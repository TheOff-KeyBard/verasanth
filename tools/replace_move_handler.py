from pathlib import Path

ORCH = r'''      const chain = body.chain;
      if (chain != null && !Array.isArray(chain)) {
        return err("chain must be an array of direction tokens.", 400);
      }
      if (Array.isArray(chain) && chain.length === 0) {
        return err("chain cannot be empty.", 400);
      }
      if (Array.isArray(chain) && chain.length > 0) {
        if (body.target != null || body.direction != null) {
          return err("Do not combine chain with direction or target.", 400);
        }
        const pNStart = await getFlag(db, uid, "active_narrative_encounter", 0);
        const pSStart = await getFlag(db, uid, "active_scene", 0);
        if (pNStart > 0 || pSStart > 0) {
          return err("Something waits for your answer before you walk away.", 400);
        }
        const chain_moves = [];
        let stopped_early = false;
        let stop_reason = null;
        let lastPayload = null;
        for (let si = 0; si < chain.length; si++) {
          row = await getPlayerSheet(db, uid);
          const inChainCombat = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
          if (inChainCombat) {
            stopped_early = true;
            stop_reason = "You're in combat.";
            break;
          }
          const pN = await getFlag(db, uid, "active_narrative_encounter", 0);
          const pS = await getFlag(db, uid, "active_scene", 0);
          if (pN > 0 || pS > 0) {
            stopped_early = true;
            stop_reason = "Something waits for your answer.";
            break;
          }
          const tok = String(chain[si] ?? "").trim().toLowerCase();
          const nd = normalizeMoveDirectionToken(tok);
          if (!nd || nd === "__hub__" || nd === "__back__") {
            stopped_early = true;
            stop_reason = !nd ? "Invalid direction in chain." : "Chain cannot use hub or back shortcuts.";
            break;
          }
          const exitMapCh = await getExitMapForMove(db, uid, row, row.location);
          let directionUsedCh = nd;
          let destCh = exitMapCh[directionUsedCh];
          if (row.location === "market_square" && directionUsedCh === "down") destCh = "sewer_entrance";
          if (row.location === "cinder_cells_block" && directionUsedCh === "deeper" && (row.crime_heat ?? 0) < 11) {
            destCh = null;
          }
          const gateCh = FLOOR_GATES[row.location];
          if (gateCh && directionUsedCh === gateCh.exit_dir && gateCh.requires_flag) {
            const hasFlagCh = await getFlag(db, uid, gateCh.requires_flag, 0);
            const hasAltCh = gateCh.alt_flag ? await getFlag(db, uid, gateCh.alt_flag, 0) : 0;
            if (!hasFlagCh && !hasAltCh) destCh = null;
          }
          const blockedCh = await getBlockedRoutes(db);
          if (destCh && blockedCh.includes(destCh)) {
            stopped_early = true;
            stop_reason = "The passage is impassable.";
            break;
          }
          if (!destCh || !WORLD[destCh]) {
            stopped_early = true;
            stop_reason = "You can't go that way.";
            break;
          }
          const isFinal = si === chain.length - 1;
          const payload = await processMoveTransition(db, uid, row, row.location, destCh, directionUsedCh, {
            skipNarrativeAndScene: !isFinal,
          });
          chain_moves.push({
            step: si + 1,
            direction: tok,
            destination: WORLD[destCh].name,
          });
          lastPayload = payload;
          if (payload.encounter?.triggered && payload.encounter?.combat_state) {
            stopped_early = true;
            stop_reason = "Combat started.";
            break;
          }
          if (payload.hazard?.player_hp != null && payload.hazard.player_hp <= 0) {
            stopped_early = true;
            stop_reason = "You collapse.";
            break;
          }
        }
        if (!lastPayload) {
          return err(stop_reason || "Chain could not complete.", 400);
        }
        return json({
          ...lastPayload,
          chain_moves,
          final_location: lastPayload.location,
          final_description: lastPayload.description,
          stopped_early,
          stop_reason: stopped_early ? stop_reason : null,
        });
      }

      const resolved = await (async () => {
        const fromLoc = row.location;
        const normFromBody = body.direction != null ? normalizeMoveDirectionToken(String(body.direction)) : null;
        if (normFromBody === "__hub__") {
          return {
            ok: true,
            fromLoc,
            dest: "tavern",
            directionUsed: "hub",
            moveOpts: { hubMove: true, skipMoveCount: true, travelNarrationOverride: HUB_TRAVEL_LINE },
          };
        }
        if (normFromBody === "__back__") {
          const prevIdx = await getFlag(db, uid, "previous_location", 0);
          const prev = decodePreviousLocation(prevIdx);
          if (!prev) return { ok: false, error: "There is no going back from here. Not yet." };
          return { ok: true, fromLoc, dest: prev, directionUsed: "back", moveOpts: {} };
        }
        const exitMap = await getExitMapForMove(db, uid, row, fromLoc);
        let directionUsed;
        let dest;
        if (body.target) {
          directionUsed = Object.entries(exitMap).find(([, t]) => t === body.target)?.[0];
          dest = directionUsed ? exitMap[directionUsed] : null;
        } else if (normFromBody) {
          directionUsed = normFromBody;
          dest = exitMap[directionUsed];
        } else if (body.direction != null) {
          directionUsed = body.direction;
          dest = exitMap[directionUsed];
        } else {
          return { ok: false, error: "direction, target, or chain required." };
        }
        if (fromLoc === "market_square" && directionUsed === "down") dest = "sewer_entrance";
        if (fromLoc === "cinder_cells_block" && directionUsed === "deeper" && (row.crime_heat ?? 0) < 11) {
          dest = null;
        }
        const gate = FLOOR_GATES[fromLoc];
        if (gate && directionUsed === gate.exit_dir && gate.requires_flag) {
          const hasFlag = await getFlag(db, uid, gate.requires_flag, 0);
          const hasAlt = gate.alt_flag ? await getFlag(db, uid, gate.alt_flag, 0) : 0;
          if (!hasFlag && !hasAlt) dest = null;
        }
        const blocked = await getBlockedRoutes(db);
        if (dest && blocked.includes(dest)) {
          return { ok: false, error: "The passage is impassable. The noticeboard warned of this.", status: 400 };
        }
        if (!dest || !WORLD[dest]) {
          return { ok: false, error: `You can't go ${directionUsed || body.direction || "there"} from here.` };
        }
        return { ok: true, fromLoc, dest, directionUsed, moveOpts: {} };
      })();

      if (!resolved.ok) {
        if (resolved.status === 400) return err(resolved.error, 400);
        return err(resolved.error);
      }

      const movePayload = await processMoveTransition(
        db,
        uid,
        row,
        resolved.fromLoc,
        resolved.dest,
        resolved.directionUsed,
        resolved.moveOpts,
      );
      return json(movePayload);
'''

lines = Path("index.js").read_text(encoding="utf-8").splitlines(keepends=True)
# 1-based line 2849 -> index 2848; 1-based 3444 -> index 3443 last line to remove
start, end = 2848, 3444
assert "const room = WORLD[row.location]" in lines[start] and "directionUsed = direction" in lines[start + 1]
assert "return json(movePayload);" in lines[end - 1]
new_lines = lines[:start] + [ORCH + ("\n" if not ORCH.endswith("\n") else "")] + lines[end:]
Path("index.js").write_text("".join(new_lines), encoding="utf-8")
print("replaced", end - start, "lines with orchestration")
