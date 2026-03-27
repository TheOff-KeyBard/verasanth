from pathlib import Path

p = Path("_generated_move.js")
t = p.read_text(encoding="utf-8")

t = t.replace(
    """      // Ambient events
      let ambient = null;
      if (dest === "flooded_hall") {""",
    """      let ambient = null;
      if (!hubMove) {
      if (dest === "flooded_hall") {""",
)

t = t.replace(
    """        }
      }

      const destRoom = WORLD[dest];""",
    """        }
      }
      }

      const destRoom = WORLD[dest];""",
)

t = t.replace(
    """      if (dest === "market_square") {
        destExits = [...destExits, "down"];
        destExitMap.down = "sewer_entrance";
      }
      if (dest === "cinder_cells_block" && (row.crime_heat ?? 0) < 11) {""",
    """      if (dest === "market_square") {
        destExits = [...destExits, "down"];
        destExitMap.down = "sewer_entrance";
      }
      if (dest === "scar_outer_vein") {
        const echoTriggered = await getFlag(db, uid, "first_echo_triggered", 0);
        if (echoTriggered) {
          destExits = [...destExits.filter((e) => e !== "west"), "west"];
          destExitMap.west = "scar_root_passage";
        }
      }
      if (dest === "cinder_cells_block" && (row.crime_heat ?? 0) < 11) {""",
)

t = t.replace(
    """      // Phase 3: Environmental hazard check
      let hazardData = null;""",
    """      let hazardData = null;""",
)

# Insert if (!hubMove) before hazardData declaration - we removed comment, now add wrap
t = t.replace(
    """      let hazardData = null;
      let hazardEncounterBonus = 0;
      const now = Date.now();
      const activeHazard = await dbGet(db, "SELECT * FROM sewer_hazards WHERE location=? AND expires_at>?", [dest, now]);""",
    """      let hazardData = null;
      let hazardEncounterBonus = 0;
      if (!hubMove) {
      const now = Date.now();
      const activeHazard = await dbGet(db, "SELECT * FROM sewer_hazards WHERE location=? AND expires_at>?", [dest, now]);""",
)

t = t.replace(
    """      }
      // ── End encounter check ─────────────────────────────────────────

      let narrativeEncounter = null;
      if (!encounterData) {""",
    """      }
      }
      // ── End encounter check ─────────────────────────────────────────

      let narrativeEncounter = null;
      if (!hubMove && !skipNarrativeAndScene && !encounterData) {""",
)

t = t.replace(
    """      let npcSceneMeta = null;
      if (!narrativeEncounter && Math.random() < 0.03) {""",
    """      let npcSceneMeta = null;
      if (!hubMove && !skipNarrativeAndScene && !narrativeEncounter && Math.random() < 0.03) {""",
)

p.write_text(t, encoding="utf-8")
print("post-process ok")
