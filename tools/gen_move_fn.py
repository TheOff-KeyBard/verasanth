from pathlib import Path
import re

lines = Path("index.js").read_text(encoding="utf-8").splitlines()
chunk = lines[2269:2840]
text = "\n".join(chunk)
text = text.replace("return json(movePayload);", "return movePayload;")
text = text.replace(
    "getTravelNarration(room, destRoom, exitType)",
    "travelNarrationOverride || getTravelNarration(room, destRoom, exitType, dest)",
)
text = text.replace(
    'if (row.location === "market_square" && dest === "sewer_entrance")',
    'if (fromLoc === "market_square" && dest === "sewer_entrance")',
)
pattern = re.compile(
    r"await dbRun\(db, \"UPDATE players SET location=\? WHERE user_id=\?\", \[dest, uid\]\);\s*\n"
    r"\s*const moveCount = \(await getFlag\(db, uid, \"move_count\", 0\)\) \+ 1;\s*\n"
    r"\s*await setFlag\(db, uid, \"move_count\", moveCount\);",
    re.MULTILINE,
)
replacement = """await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", [dest, uid]);
      await setFlag(db, uid, "previous_location", encodePreviousLocation(fromLoc));
      let moveCount = await getFlag(db, uid, "move_count", 0);
      if (!skipMoveCount) {
        moveCount += 1;
        await setFlag(db, uid, "move_count", moveCount);
      }"""
text, n = pattern.subn(replacement, text, count=1)
if n != 1:
    raise SystemExit(f"moveCount replace count was {n}")

header = r"""async function getExitMapForMove(db, uid, row, fromLoc) {
  let exitMap = { ...(WORLD[fromLoc]?.exits || {}) };
  if (fromLoc === "market_square") exitMap.down = "sewer_entrance";
  if (fromLoc === "cinder_cells_block" && (row.crime_heat ?? 0) < 11) {
    delete exitMap.deeper;
  }
  if (fromLoc === "scar_outer_vein") {
    const echoTriggered = await getFlag(db, uid, "first_echo_triggered", 0);
    if (echoTriggered) exitMap.west = "scar_root_passage";
  }
  return exitMap;
}

async function processMoveTransition(db, uid, row, fromLoc, dest, directionUsed, opts = {}) {
  const skipNarrativeAndScene = opts.skipNarrativeAndScene ?? false;
  const hubMove = opts.hubMove ?? false;
  const skipMoveCount = opts.skipMoveCount ?? false;
  const travelNarrationOverride = opts.travelNarrationOverride ?? null;
  const room = WORLD[fromLoc];

"""

Path("_generated_move.js").write_text(header + text + "\n}\n", encoding="utf-8")
print("ok", len(chunk), "lines")
