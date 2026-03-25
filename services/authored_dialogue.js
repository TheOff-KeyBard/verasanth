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
    case "trader":
      return 100;
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

export async function resolveAuthoredGreeting(dialogue, db, uid, getFlag, dbGet) {
  const g = dialogue.greeting;
  if (!g) return "";
  if (g.conditional?.length) {
    for (const c of g.conditional) {
      if (c.requires_flag && !(await flagTruthy(db, uid, c.requires_flag, getFlag, dbGet)))
        continue;
      if (
        c.requires_flag_not &&
        !(await flagFalsy(db, uid, c.requires_flag_not, getFlag, dbGet))
      )
        continue;
      return c.text;
    }
  }
  return g.default || "";
}

function optionVisible(opt, trust, level) {
  const minT = opt.requires_trust_min ?? 0;
  if (trust < minT) return false;
  const minL = opt.requires_level_min;
  if (minL != null && level < minL) return false;
  return true;
}

async function optionFlagsOk(opt, db, uid, getFlag, dbGet) {
  if (opt.requires_flag && !(await flagTruthy(db, uid, opt.requires_flag, getFlag, dbGet)))
    return false;
  if (
    opt.requires_flag_not &&
    !(await flagFalsy(db, uid, opt.requires_flag_not, getFlag, dbGet))
  )
    return false;
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
) {
  const out = [];
  for (const opt of dialogue.options || []) {
    if (!optionVisible(opt, trust, level)) continue;
    if (!(await optionFlagsOk(opt, db, uid, getFlag, dbGet))) continue;
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
  const greeting = await resolveAuthoredGreeting(dialogue, db, uid, getFlag, dbGet);
  const options = await getVisibleOptions(
    dialogue,
    db,
    uid,
    getFlag,
    dbGet,
    trust,
    level,
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
  if (!(await optionFlagsOk(opt, db, uid, getFlag, dbGet)))
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

  const follow = opt.followup
    ? { label: opt.followup.label, response: opt.followup.response }
    : null;

  return {
    ok: true,
    response: opt.response,
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
