/**
 * Phase A authored NPC dialogue — GET options, POST select, /api/talk free-text fallback.
 * See verasanth_dialogue_system_v1.0.md
 */

import {
  DIALOGUE_REGISTRY,
  GAME_NPC_TO_CANONICAL,
  PHASE_A_GAME_NPCS,
} from "../data/dialogue/index.js";
import { NPC_LOCATIONS } from "../data/npcs.js";
import { getCharacterLevel } from "./equipment.js";

const CANONICAL_TO_GAME = Object.fromEntries(
  Object.entries(GAME_NPC_TO_CANONICAL).map(([game, canon]) => [canon, game]),
);

function resolveRouteNpc(routeSegment) {
  if (GAME_NPC_TO_CANONICAL[routeSegment]) {
    return {
      gameNpcId: routeSegment,
      canonicalId: GAME_NPC_TO_CANONICAL[routeSegment],
    };
  }
  if (DIALOGUE_REGISTRY[routeSegment]) {
    return {
      gameNpcId: CANONICAL_TO_GAME[routeSegment],
      canonicalId: routeSegment,
    };
  }
  return null;
}

export function isPhaseAGameNpc(gameNpcId) {
  return PHASE_A_GAME_NPCS.has(gameNpcId);
}

export function npcPresentAtPlayer(row, gameNpcId) {
  const npcLoc = NPC_LOCATIONS[gameNpcId];
  const wardenAtCells =
    gameNpcId === "warden" &&
    row.location === "cinder_cells_hall" &&
    (row.crime_heat ?? 0) >= 4;
  if (!npcLoc && !wardenAtCells) return false;
  if (!wardenAtCells && npcLoc !== row.location) return false;
  return true;
}

async function hasAshboundResonance(db, dbGet, uid) {
  const row = await dbGet(
    db,
    "SELECT 1 FROM inventory WHERE user_id=? AND item='ashbound_resonance' AND qty>0",
    [uid],
  );
  return !!row;
}

async function hasActiveBounty(db, dbGet, uid) {
  const row = await dbGet(
    db,
    "SELECT id FROM bounties WHERE target_id=? AND status='active' LIMIT 1",
    [uid],
  );
  return !!row;
}

async function specialFlagTruthy(db, dbGet, uid, flagName) {
  const f = flagName.toLowerCase();
  if (f === "has_ashbound_resonance") return hasAshboundResonance(db, dbGet, uid);
  if (f === "has_active_bounty") return hasActiveBounty(db, dbGet, uid);
  return null;
}

async function flagTruthy(db, uid, flagName, getFlag, dbGet) {
  const sp = await specialFlagTruthy(db, dbGet, uid, flagName);
  if (sp !== null) return !!sp;
  return (await getFlag(db, uid, flagName, 0)) >= 1;
}

async function flagFalsy(db, uid, flagName, getFlag, dbGet) {
  const sp = await specialFlagTruthy(db, dbGet, uid, flagName);
  if (sp !== null) return !sp;
  const v = await getFlag(db, uid, flagName, 0);
  return !v || v === 0;
}

async function getTableTrust(db, dbGet, uid, canonicalId) {
  const row = await dbGet(
    db,
    "SELECT score FROM npc_trust WHERE user_id=? AND npc_id=?",
    [uid, canonicalId],
  );
  return row ? Number(row.score) || 0 : 0;
}

async function addNpcTrustDelta(db, dbGet, dbRun, uid, canonicalId, delta) {
  if (!delta) return;
  const curRow = await dbGet(
    db,
    "SELECT score FROM npc_trust WHERE user_id=? AND npc_id=?",
    [uid, canonicalId],
  );
  const cur = curRow ? Number(curRow.score) || 0 : 0;
  const next = Math.max(0, cur + delta);
  await dbRun(
    db,
    `INSERT INTO npc_trust (user_id, npc_id, score) VALUES (?,?,?)
     ON CONFLICT(user_id, npc_id) DO UPDATE SET score=excluded.score`,
    [uid, canonicalId, next],
  );
}

/** Bridge legacy visit / flag progression into trust floors for Phase A gates. */
async function legacyTrustBoost(db, uid, canonicalId, getFlag) {
  switch (canonicalId) {
    case "kelvaris":
      return Math.min(40, (await getFlag(db, uid, "kelvaris_visits", 0)) * 5);
    case "caelir":
      return Math.min(36, (await getFlag(db, uid, "caelir_visits", 0)) * 4);
    case "veyra": {
      const v = Math.min(36, (await getFlag(db, uid, "veyra_visits", 0)) * 4);
      const t = await getFlag(db, uid, "veyra_trust", 0);
      return Math.max(v, t ? 18 : v);
    }
    case "thalara":
      return Math.min(40, (await getFlag(db, uid, "thalara_visits", 0)) * 4);
    case "seris":
      return Math.min(40, (await getFlag(db, uid, "seris_visits", 0)) * 4);
    case "othorion": {
      const v = Math.min(35, (await getFlag(db, uid, "othorion_visits", 0)) * 3);
      const t = await getFlag(db, uid, "othorion_trust", 0);
      return Math.max(v, t ? 20 : v);
    }
    case "grommash":
      return Math.min(45, (await getFlag(db, uid, "grommash_visits", 0)) * 4);
    default:
      return 0;
  }
}

export async function getEffectiveTrust(
  db,
  dbGet,
  uid,
  canonicalId,
  getFlag,
) {
  const table = await getTableTrust(db, dbGet, uid, canonicalId);
  const legacy = await legacyTrustBoost(db, uid, canonicalId, getFlag);
  return Math.max(table, legacy);
}

/** Guild leaders only; first matching instinct row wins (one line per interaction). */
const GUILD_LEADER_INSTINCT_GREETINGS = {
  vaelith: [
    {
      instinct: "grave_whisper",
      lines: [
        "You listen differently than most people who come here.",
        "The Archive has noted it.",
      ],
    },
    {
      instinct: "sentinel",
      lines: [
        "You were reading the room before you spoke.",
        "The sigils responded.",
      ],
    },
  ],
  serix: [
    {
      instinct: "ember_touched",
      lines: [
        "You burn toward things.",
        "That's not a criticism. But the Covenant reads heat as well as shadow.",
      ],
    },
    {
      instinct: "pale_marked",
      lines: [
        "Something was taken from you. Or gave itself.",
        "The distinction matters here.",
      ],
    },
  ],
  garruk: [
    {
      instinct: "quickstep",
      lines: [
        "You're already halfway through your next move.",
        "Finish the one you're in first.",
      ],
    },
    {
      instinct: "streetcraft",
      lines: [
        "You came in reading angles.",
        "Good habit. Just remember the yard doesn't have exits.",
      ],
    },
  ],
  rhyla: [
    {
      instinct: "ironblood",
      lines: [
        "You brace before impact. Not after.",
        "That's earned, not taught.",
      ],
    },
    {
      instinct: "warden",
      lines: [
        "You hold your ground like it means something.",
        "It does. Don't forget that when the city tries to move you.",
      ],
    },
  ],
  halden: [
    {
      instinct: "shadowbound",
      lines: [
        "You carry something quiet with you.",
        "That's not a warning. Just — sit near the flame when you need to.",
      ],
    },
    {
      instinct: "grave_whisper",
      lines: [
        "You've been listening to the wrong kind of silence.",
        "The Sanctum has a different kind, if you want it.",
      ],
    },
  ],
  lirael: [
    {
      instinct: "sentinel",
      lines: [
        "You entered this room knowing where everyone was before you looked.",
        "That's useful. Just don't let it make you predictable.",
      ],
    },
    {
      instinct: "warden",
      lines: [
        "You move like you're holding something in place.",
        "Works fine until the thing you're holding decides to move.",
      ],
    },
  ],
};

/**
 * Tier-1 passive instinct prefix for select guild leaders.
 * @param {string} npcId - Dialogue `npc_id` (e.g. vaelith, serix).
 * @param {{ instinct?: string } | null | undefined} playerContext
 * @returns {string | null}
 */
export function getInstinctGreetingLine(npcId, playerContext) {
  const rows = GUILD_LEADER_INSTINCT_GREETINGS[npcId];
  if (!rows?.length) return null;
  const instinct = String(playerContext?.instinct || "")
    .trim()
    .toLowerCase();
  if (!instinct) return null;
  for (const row of rows) {
    if (row.instinct === instinct) {
      return row.lines.filter(Boolean).join("\n");
    }
  }
  return null;
}

/** Faction keys → numeric standing (matches /api/talk `playerContext.guild_standings`). */
export async function loadGuildStandingsMap(db, uid, getFlag) {
  const vaelith = Number(await getFlag(db, uid, "guild_standing_vaelith", 0)) || 0;
  const garruk = Number(await getFlag(db, uid, "guild_standing_garruk", 0)) || 0;
  const halden = Number(await getFlag(db, uid, "guild_standing_halden", 0)) || 0;
  const lirael = Number(await getFlag(db, uid, "guild_standing_lirael", 0)) || 0;
  const serix = Number(await getFlag(db, uid, "guild_standing_serix", 0)) || 0;
  const rhyla = Number(await getFlag(db, uid, "guild_standing_rhyla", 0)) || 0;
  return {
    ashen_archive: vaelith,
    broken_banner: garruk,
    quiet_sanctum: halden,
    veil_market: lirael,
    umbral_covenant: serix,
    stone_watch: rhyla,
  };
}

function greetingGuildStandingOk(c, playerContext) {
  const key = c.requires_guild_standing_key;
  const minSt = c.requires_guild_standing_min;
  if (key == null || minSt == null) return true;
  const gs = playerContext?.guild_standings;
  const val = gs ? Number(gs[key]) || 0 : 0;
  return val >= Number(minSt);
}

function optionGuildStandingOk(opt, playerContext) {
  const key = opt.requires_guild_standing_key;
  const minSt = opt.requires_guild_standing_min;
  if (key == null || minSt == null) return true;
  const gs = playerContext?.guild_standings;
  const val = gs ? Number(gs[key]) || 0 : 0;
  return val >= Number(minSt);
}

function findGreetingByStanding(greetingBlock, standingKey, standingMin) {
  const c = greetingBlock?.conditional?.find(
    (x) =>
      x.requires_guild_standing_key === standingKey &&
      Number(x.requires_guild_standing_min) === Number(standingMin),
  );
  return c?.text ?? null;
}

function findGreetingByFlag(greetingBlock, flagName) {
  const c = greetingBlock?.conditional?.find((x) => x.requires_flag === flagName);
  return c?.text ?? null;
}

async function greetingConditionalRowMatches(
  c,
  db,
  uid,
  getFlag,
  dbGet,
  playerContext,
) {
  if (c.requires_flag && !(await flagTruthy(db, uid, c.requires_flag, getFlag, dbGet)))
    return false;
  if (
    c.requires_flag_not &&
    !(await flagFalsy(db, uid, c.requires_flag_not, getFlag, dbGet))
  )
    return false;
  if (!greetingGuildStandingOk(c, playerContext)) return false;
  return true;
}

/**
 * Serix — strict single-path greeting (no stacking with instinct or fallthrough).
 * Evaluation order (first match wins; identity / primary guild before cross-guild / flags / instinct):
 * 1. guild_standings.umbral_covenant >= 4  (Standing 4 / Hollow)
 * 2. guild_standings.ashen_archive >= 3   (Archive reinterpretation)
 * 3. flag has_ashbound_resonance
 * 4. flag has_corruption
 * 5. flag pale_marked_old_sight            (mythic contact / Tier 2 echo)
 * 6. flag guild_standing_serix             (trial completion)
 * 7. instinct ember_touched | pale_marked only (Tier 1; same lines as GUILD_LEADER_INSTINCT_GREETINGS.serix)
 * 8. greeting.default
 */
async function resolveSerixGreeting(
  dialogue,
  db,
  uid,
  getFlag,
  dbGet,
  playerContext,
) {
  const g = dialogue.greeting;
  const gs = playerContext?.guild_standings || {};
  const umbral = Number(gs.umbral_covenant) || 0;
  const archive = Number(gs.ashen_archive) || 0;

  if (umbral >= 4) {
    const t = findGreetingByStanding(g, "umbral_covenant", 4);
    if (t) return t;
  }
  if (archive >= 3) {
    const t = findGreetingByStanding(g, "ashen_archive", 3);
    if (t) return t;
  }
  if (await flagTruthy(db, uid, "has_ashbound_resonance", getFlag, dbGet)) {
    const t = findGreetingByFlag(g, "has_ashbound_resonance");
    if (t) return t;
  }
  if (await flagTruthy(db, uid, "has_corruption", getFlag, dbGet)) {
    const t = findGreetingByFlag(g, "has_corruption");
    if (t) return t;
  }
  if (await flagTruthy(db, uid, "pale_marked_old_sight", getFlag, dbGet)) {
    const t = findGreetingByFlag(g, "pale_marked_old_sight");
    if (t) return t;
  }
  if (await flagTruthy(db, uid, "guild_standing_serix", getFlag, dbGet)) {
    const t = findGreetingByFlag(g, "guild_standing_serix");
    if (t) return t;
  }
  const instinctKey = String(playerContext?.instinct || "").trim().toLowerCase();
  if (instinctKey === "ember_touched" || instinctKey === "pale_marked") {
    const line = getInstinctGreetingLine("serix", playerContext);
    if (line) return line;
  }
  return g?.default || "";
}

/**
 * Other leaders — one path only: standing 4 → standing 3 → flag-only rows (JSON order) → instinct → default.
 */
async function resolveLayeredGenericGreeting(
  dialogue,
  db,
  uid,
  getFlag,
  dbGet,
  playerContext,
) {
  const g = dialogue.greeting;
  const list = g?.conditional || [];
  const npcId = dialogue.npc_id;

  const standing4 = list.filter(
    (c) =>
      c.requires_guild_standing_key != null && Number(c.requires_guild_standing_min) === 4,
  );
  for (const c of standing4) {
    if (await greetingConditionalRowMatches(c, db, uid, getFlag, dbGet, playerContext))
      return c.text;
  }
  const standing3 = list.filter(
    (c) =>
      c.requires_guild_standing_key != null && Number(c.requires_guild_standing_min) === 3,
  );
  for (const c of standing3) {
    if (await greetingConditionalRowMatches(c, db, uid, getFlag, dbGet, playerContext))
      return c.text;
  }
  const flagRows = list.filter(
    (c) =>
      c.requires_flag &&
      (c.requires_guild_standing_key == null || c.requires_guild_standing_min == null),
  );
  for (const c of flagRows) {
    if (await greetingConditionalRowMatches(c, db, uid, getFlag, dbGet, playerContext))
      return c.text;
  }
  const line =
    npcId && playerContext ? getInstinctGreetingLine(npcId, playerContext) : null;
  if (line) return line;
  return g?.default || "";
}

export async function resolveAuthoredGreeting(
  dialogue,
  db,
  uid,
  getFlag,
  dbGet,
  playerContext = null,
) {
  const g = dialogue?.greeting;
  if (!g) return "";

  if (dialogue.npc_id === "serix") {
    return await resolveSerixGreeting(
      dialogue,
      db,
      uid,
      getFlag,
      dbGet,
      playerContext,
    );
  }

  if (g.conditional?.length) {
    return await resolveLayeredGenericGreeting(
      dialogue,
      db,
      uid,
      getFlag,
      dbGet,
      playerContext,
    );
  }

  const npcId = dialogue?.npc_id;
  const line =
    npcId && playerContext ? getInstinctGreetingLine(npcId, playerContext) : null;
  return line || g.default || "";
}

function optionVisible(opt, trust, level) {
  const minT = opt.requires_trust_min ?? 0;
  if (trust < minT) return false;
  const minL = opt.requires_level_min;
  if (minL != null && level < minL) return false;
  return true;
}

async function optionFlagsOk(opt, db, uid, getFlag, dbGet, playerContext = null) {
  if (opt.requires_flag && !(await flagTruthy(db, uid, opt.requires_flag, getFlag, dbGet)))
    return false;
  if (
    opt.requires_flag_not &&
    !(await flagFalsy(db, uid, opt.requires_flag_not, getFlag, dbGet))
  )
    return false;
  if (!optionGuildStandingOk(opt, playerContext)) return false;
  return true;
}

export async function getVisibleOptions(
  dialogue,
  db,
  uid,
  getFlag,
  dbGet,
  trust,
  level,
  playerContext = null,
) {
  const out = [];
  for (const opt of dialogue.options || []) {
    if (!optionVisible(opt, trust, level)) continue;
    if (!(await optionFlagsOk(opt, db, uid, getFlag, dbGet, playerContext))) continue;
    out.push({ id: opt.id, label: opt.label });
  }
  return out;
}

function findOptionById(dialogue, optionId) {
  return (dialogue.options || []).find((o) => o.id === optionId) || null;
}

async function applyDialogueEffects(
  db,
  dbGet,
  dbRun,
  uid,
  canonicalId,
  effects,
  setFlag,
  addItemToInventory,
) {
  const applied = [];
  if (!effects || typeof effects !== "object") return applied;
  if (effects.set_flag) {
    await setFlag(db, uid, effects.set_flag, 1);
    applied.push({ type: "set_flag", flag: effects.set_flag });
  }
  if (effects.trust_delta) {
    await addNpcTrustDelta(
      db,
      dbGet,
      dbRun,
      uid,
      canonicalId,
      Number(effects.trust_delta) || 0,
    );
    applied.push({ type: "trust_delta", delta: effects.trust_delta });
  }
  if (effects.give_item) {
    await addItemToInventory(db, uid, effects.give_item, 1);
    applied.push({ type: "give_item", item: effects.give_item });
  }
  return applied;
}

export async function incrementPhaseAVisit(
  db,
  uid,
  gameNpcId,
  getFlag,
  setFlag,
  row,
) {
  if (gameNpcId === "bartender") {
    const n = await getFlag(db, uid, "kelvaris_visits", 0);
    await setFlag(db, uid, "kelvaris_visits", n + 1);
    if (await getFlag(db, uid, "just_respawned", 0))
      await setFlag(db, uid, "just_respawned", 0);
  } else if (gameNpcId === "weaponsmith") {
    const n = await getFlag(db, uid, "caelir_visits", 0);
    await setFlag(db, uid, "caelir_visits", n + 1);
  } else if (gameNpcId === "armorsmith") {
    const n = await getFlag(db, uid, "veyra_visits", 0);
    await setFlag(db, uid, "veyra_visits", n + 1);
  } else if (gameNpcId === "herbalist") {
    const n = await getFlag(db, uid, "thalara_visits", 0);
    await setFlag(db, uid, "thalara_visits", n + 1);
  } else if (gameNpcId === "curator") {
    const n = await getFlag(db, uid, "seris_visits", 0);
    await setFlag(db, uid, "seris_visits", n + 1);
  } else if (gameNpcId === "othorion") {
    const n = await getFlag(db, uid, "othorion_visits", 0);
    await setFlag(db, uid, "othorion_visits", n + 1);
  } else if (gameNpcId === "warden") {
    const n = await getFlag(db, uid, "grommash_visits", 0);
    await setFlag(db, uid, "grommash_visits", n + 1);
  }
}

export async function handleNpcOptionsGet(
  deps,
  routeSegment,
) {
  const {
    db,
    dbGet,
    uid,
    getFlag,
    setFlag,
    getPlayerSheet,
  } = deps;
  const resolved = resolveRouteNpc(routeSegment);
  if (!resolved) return { error: "Unknown NPC.", status: 404 };
  const { gameNpcId, canonicalId } = resolved;
  const dialogue = DIALOGUE_REGISTRY[canonicalId];
  if (!dialogue) return { error: "Unknown NPC.", status: 404 };

  const row = await getPlayerSheet(db, uid);
  if (!row) return { error: "No character.", status: 404 };
  if (!npcPresentAtPlayer(row, gameNpcId))
    return { error: `${gameNpcId} is not here.`, status: 400 };

  const trust = await getEffectiveTrust(db, dbGet, uid, canonicalId, getFlag);
  const level = getCharacterLevel(row);
  const guild_standings = await loadGuildStandingsMap(db, uid, getFlag);
  const dialoguePlayerContext = {
    instinct: row.instinct,
    guild_standings,
  };
  let greeting = await resolveAuthoredGreeting(
    dialogue,
    db,
    uid,
    getFlag,
    dbGet,
    dialoguePlayerContext,
  );
  if (
    canonicalId === "seris" &&
    trust === 0 &&
    String(row.race || "").toLowerCase() === "ashborn" &&
    !(await getFlag(db, uid, "seris_ashborn_first_greeting_shown", 0))
  ) {
    greeting =
      (greeting || "") +
      "\n\n*She looks at you for a moment longer than necessary.*";
    await setFlag(db, uid, "seris_ashborn_first_greeting_shown", 1);
  }
  if (
    canonicalId === "seris" &&
    trust === 0 &&
    String(row.race || "").toLowerCase() === "dakaridari" &&
    !(await getFlag(db, uid, "seris_dakaridari_first_greeting_shown", 0))
  ) {
    greeting =
      (greeting || "") +
      "\n\n*She glances at the lower level of the room before looking at you. As if checking what you came up from.*";
    await setFlag(db, uid, "seris_dakaridari_first_greeting_shown", 1);
  }
  if (
    canonicalId === "seris" &&
    trust === 0 &&
    String(row.race || "").toLowerCase() === "panaridari" &&
    !(await getFlag(db, uid, "seris_panaridari_first_greeting_shown", 0))
  ) {
    greeting =
      (greeting || "") +
      "\n\n*She watches you enter before you finish entering. As if she expected you slightly earlier.*";
    await setFlag(db, uid, "seris_panaridari_first_greeting_shown", 1);
  }
  if (
    canonicalId === "seris" &&
    trust === 0 &&
    String(row.race || "").toLowerCase() === "cambral" &&
    !(await getFlag(db, uid, "seris_cambral_first_greeting_shown", 0))
  ) {
    greeting =
      (greeting || "") +
      "\n\n*She looks at your hands before she looks at your face. Old habit, maybe. Or something she learned from the records.*";
    await setFlag(db, uid, "seris_cambral_first_greeting_shown", 1);
  }
  if (
    canonicalId === "seris" &&
    trust === 0 &&
    String(row.race || "").toLowerCase() === "silth" &&
    !(await getFlag(db, uid, "seris_silth_first_greeting_shown", 0))
  ) {
    greeting =
      (greeting || "") +
      "\n\n*She pauses — just briefly. Then: 'You were engineered.' Not a question. She moves on before you can confirm or deny it.*";
    await setFlag(db, uid, "seris_silth_first_greeting_shown", 1);
  }
  if (
    canonicalId === "seris" &&
    trust === 0 &&
    String(row.race || "").toLowerCase() === "human" &&
    !(await getFlag(db, uid, "seris_human_first_greeting_shown", 0))
  ) {
    greeting =
      (greeting || "") +
      "\n\n*She looks at you for a moment. Then: 'You came through on your own.' It is not a question. Something about it amuses her — briefly, and then it doesn't.*";
    await setFlag(db, uid, "seris_human_first_greeting_shown", 1);
  }
  if (
    canonicalId === "seris" &&
    trust === 0 &&
    String(row.race || "").toLowerCase() === "darmerians" &&
    !(await getFlag(db, uid, "seris_darmerian_first_greeting_shown", 0))
  ) {
    greeting =
      (greeting || "") +
      "\n\n*She doesn't ask where you're from. She asks: 'When did the sea change?' She already knows the answer. She wants to know if you do.*";
    await setFlag(db, uid, "seris_darmerian_first_greeting_shown", 1);
  }
  if (
    canonicalId === "seris" &&
    trust === 0 &&
    String(row.race || "").toLowerCase() === "malaridari" &&
    !(await getFlag(db, uid, "seris_malaridari_first_greeting_shown", 0))
  ) {
    greeting =
      (greeting || "") +
      "\n\n*She studies you for a moment. Not with suspicion. With something closer to relief — and then she sets it aside.*";
    await setFlag(db, uid, "seris_malaridari_first_greeting_shown", 1);
  }
  const options = await getVisibleOptions(
    dialogue,
    db,
    uid,
    getFlag,
    dbGet,
    trust,
    level,
    dialoguePlayerContext,
  );

  return {
    ok: true,
    npc_id: canonicalId,
    game_npc_id: gameNpcId,
    greeting,
    options,
  };
}

export async function handleNpcSelectPost(deps, routeSegment, body) {
  const {
    db,
    dbGet,
    dbRun,
    uid,
    getFlag,
    setFlag,
    getPlayerSheet,
    addItemToInventory,
    getAshbornLedgerFlavor,
    getDakAridariLedgerFlavor,
    getPanAridariLedgerFlavor,
    getMalAridariLedgerFlavor,
    getCambralLedgerFlavor,
    getSilthLedgerFlavor,
    getDarmerianLedgerFlavor,
    getHumanLedgerFlavor,
  } = deps;
  const resolved = resolveRouteNpc(routeSegment);
  if (!resolved) return { error: "Unknown NPC.", status: 404 };
  const { gameNpcId, canonicalId } = resolved;
  const dialogue = DIALOGUE_REGISTRY[canonicalId];
  if (!dialogue) return { error: "Unknown NPC.", status: 404 };

  const row = await getPlayerSheet(db, uid);
  if (!row) return { error: "No character.", status: 404 };
  if (!npcPresentAtPlayer(row, gameNpcId))
    return { error: `${gameNpcId} is not here.`, status: 400 };

  const trust = await getEffectiveTrust(db, dbGet, uid, canonicalId, getFlag);
  const level = getCharacterLevel(row);
  const guild_standings = await loadGuildStandingsMap(db, uid, getFlag);
  const dialoguePlayerContext = {
    instinct: row.instinct,
    guild_standings,
  };

  const optionId = body?.option_id;
  const takeFollowup = !!body?.followup;
  const freeText =
    typeof body?.text === "string"
      ? body.text.trim()
      : typeof body?.message === "string"
        ? body.message.trim()
        : "";

  if (freeText && !optionId) {
    const visible = await getVisibleOptions(
      dialogue,
      db,
      uid,
      getFlag,
      dbGet,
      trust,
      level,
      dialoguePlayerContext,
    );
    const t = freeText.toLowerCase();
    let picked = null;
    const num = /^\d+$/.test(t) ? parseInt(t, 10) : 0;
    if (num >= 1 && num <= visible.length) {
      const id = visible[num - 1].id;
      picked = findOptionById(dialogue, id);
    } else {
      const matches = (dialogue.options || []).filter((o) => {
        const lab = (o.label || "").toLowerCase();
        return lab.includes(t) || t.includes(lab);
      });
      const visibleIds = new Set(visible.map((v) => v.id));
      const narrowed = matches.filter((m) => visibleIds.has(m.id));
      if (narrowed.length === 1) picked = narrowed[0];
      else if (narrowed.length > 1) {
        narrowed.sort((a, b) => (b.label?.length || 0) - (a.label?.length || 0));
        picked = narrowed[0];
      }
    }
    if (!picked || !visible.some((v) => v.id === picked.id)) {
      return {
        ok: true,
        response: dialogue.fallback || "…",
        followup: null,
        effects_applied: [],
        fallback: true,
        option_id: null,
      };
    }
    const effectsApplied = await applyDialogueEffects(
      db,
      dbGet,
      dbRun,
      uid,
      canonicalId,
      picked.effects,
      setFlag,
      addItemToInventory,
    );
    await incrementPhaseAVisit(db, uid, gameNpcId, getFlag, setFlag, row);
    const follow = picked.followup
      ? { label: picked.followup.label, response: picked.followup.response }
      : null;
    return {
      ok: true,
      response: picked.response,
      followup: follow,
      effects_applied: effectsApplied,
      fallback: false,
      option_id: picked.id,
    };
  }

  if (!optionId || typeof optionId !== "string") {
    return { error: "option_id or text required.", status: 400 };
  }

  const opt = findOptionById(dialogue, optionId);
  if (!opt) return { error: "Unknown option.", status: 400 };
  if (!optionVisible(opt, trust, level)) return { error: "Option locked.", status: 400 };
  if (!(await optionFlagsOk(opt, db, uid, getFlag, dbGet, dialoguePlayerContext)))
    return { error: "Option locked.", status: 400 };

  if (opt.use_ai) return { useAi: true };

  if (takeFollowup) {
    if (!opt.followup) return { error: "No follow-up.", status: 400 };
    return {
      ok: true,
      response: opt.followup.response,
      followup: null,
      effects_applied: [],
      fallback: false,
      option_id: optionId,
    };
  }

  const effectsApplied = await applyDialogueEffects(
    db,
    dbGet,
    dbRun,
    uid,
    canonicalId,
    opt.effects,
    setFlag,
    addItemToInventory,
  );
  await incrementPhaseAVisit(db, uid, gameNpcId, getFlag, setFlag, row);

  let responseOut = opt.response;
  if (canonicalId === "seris" && optionId === "seris_ledger_question") {
    const serisTrust = await getEffectiveTrust(
      db,
      dbGet,
      uid,
      "seris",
      getFlag,
    );
    const gautrornRevealed = await getFlag(
      db,
      uid,
      "gautrorn_name_revealed",
      0,
    );
    const alreadyConfirmed = await getFlag(
      db,
      uid,
      "ledger_gautrorn_confirmed",
      0,
    );
    if (serisTrust >= 25 && gautrornRevealed >= 1 && !alreadyConfirmed) {
      const ledgerNarrative = [
        "",
        "The ledger's pages turn on their own.",
        "",
        "Not forward. Not backward.",
        "",
        "Searching.",
        "",
        "Ink rises from the surface — not written, but pulled upward, as though remembering its shape.",
        "",
        "A name forms:",
        "",
        "**GAUTRORN HAARGOTH**",
        "",
        "The letters settle... then shift.",
        "",
        "A second line emerges beneath it:",
        "",
        "*A memory misplaced.*",
        "",
        "For a moment — the name flickers. As if it could be something else.",
        "",
        "The ledger closes.",
        "",
        "The sound is not paper. It is stone.",
        "",
        "---",
        "",
        "\u201c...So it\u2019s confirmed.\u201d A quiet breath. \u201cThe city marked him before he ever arrived.\u201d",
      ].join("\n");
      responseOut = (responseOut || "") + ledgerNarrative;
      await setFlag(db, uid, "ledger_gautrorn_confirmed", 1);
      if (String(row.race || "").toLowerCase() === "ashborn" && getAshbornLedgerFlavor) {
        const flavor = await getAshbornLedgerFlavor(row.race);
        if (flavor) responseOut += flavor;
      }
      if (String(row.race || "").toLowerCase() === "dakaridari" && getDakAridariLedgerFlavor) {
        const dakFlavor = await getDakAridariLedgerFlavor(row.race);
        if (dakFlavor) responseOut += dakFlavor;
      }
      if (String(row.race || "").toLowerCase() === "panaridari" && getPanAridariLedgerFlavor) {
        const panFlavor = await getPanAridariLedgerFlavor(row.race);
        if (panFlavor) responseOut += panFlavor;
      }
      if (String(row.race || "").toLowerCase() === "cambral" && getCambralLedgerFlavor) {
        const camFlavor = await getCambralLedgerFlavor(row.race);
        if (camFlavor) responseOut += camFlavor;
      }
      if (String(row.race || "").toLowerCase() === "malaridari" && getMalAridariLedgerFlavor) {
        const malFlavor = await getMalAridariLedgerFlavor(row.race);
        if (malFlavor) responseOut += malFlavor;
      }
      if (String(row.race || "").toLowerCase() === "silth" && getSilthLedgerFlavor) {
        const silFlavor = await getSilthLedgerFlavor(row.race);
        if (silFlavor) responseOut += silFlavor;
      }
      if (
        String(row.race || "").toLowerCase() === "darmerians" &&
        getDarmerianLedgerFlavor
      ) {
        const darFlavor = await getDarmerianLedgerFlavor(row.race);
        if (darFlavor) responseOut += darFlavor;
      }
      if (String(row.race || "").toLowerCase() === "human" && getHumanLedgerFlavor) {
        const humanFlavor = await getHumanLedgerFlavor(row.race);
        if (humanFlavor) responseOut += humanFlavor;
      }
    }
  }

  const follow = opt.followup
    ? { label: opt.followup.label, response: opt.followup.response }
    : null;

  return {
    ok: true,
    response: responseOut,
    followup: follow,
    effects_applied: effectsApplied,
    fallback: false,
    option_id: opt.id,
  };
}

/**
 * Free-text /api/talk for Phase A NPCs. Returns null to defer to Claude path.
 */
export async function tryAuthoredTalkFromTopic(
  deps,
  gameNpcId,
  topic,
) {
  if (!isPhaseAGameNpc(gameNpcId)) return null;
  const canonicalId = GAME_NPC_TO_CANONICAL[gameNpcId];
  const dialogue = DIALOGUE_REGISTRY[canonicalId];
  if (!dialogue) return null;

  const t = (topic || "").trim();
  if (!t) return null;

  const boardish = ["board", "notice", "notices"].includes(t.toLowerCase());
  if (boardish) return null;

  const body = { text: t };
  const result = await handleNpcSelectPost(deps, gameNpcId, body);
  if (result.error) return null;
  if (result.useAi) return null;
  return result;
}
