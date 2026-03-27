import {
  ENCOUNTER_ZONES,
  ENCOUNTER_CHANCES,
  AMBIENT_ENCOUNTERS,
  SOCIAL_ENCOUNTERS,
  LORE_ENCOUNTERS,
} from "../data/encounters.js";

/** Stable flat list: ambient → social → lore (for INTEGER flag indexing). */
function buildNarrativeList() {
  const list = [];
  for (const encounter of AMBIENT_ENCOUNTERS) {
    list.push({ tier: "ambient", encounter });
  }
  for (const encounter of SOCIAL_ENCOUNTERS) {
    list.push({ tier: "social", encounter });
  }
  for (const encounter of LORE_ENCOUNTERS) {
    list.push({ tier: "lore", encounter });
  }
  return list;
}

export const NARRATIVE_ENCOUNTER_LIST = buildNarrativeList();

export function getNarrativeEncounterListIndex(tier, encounterId) {
  const i = NARRATIVE_ENCOUNTER_LIST.findIndex(
    (x) => x.tier === tier && x.encounter.id === encounterId,
  );
  return i >= 0 ? i + 1 : 0;
}

export function getNarrativeByListIndex(n) {
  if (n < 1 || n > NARRATIVE_ENCOUNTER_LIST.length) return null;
  return NARRATIVE_ENCOUNTER_LIST[n - 1];
}

/**
 * @param {Record<string, number>} flags flag name -> value (from player_flags)
 */
function flagTruthy(flags, f) {
  if (f == null || f === "") return true;
  return Number(flags[f] ?? 0) >= 1;
}

function flagFalsy(flags, f) {
  if (f == null || f === "") return true;
  const v = flags[f];
  return v == null || Number(v) === 0;
}

/**
 * Get zone type for a location id.
 */
export function getEncounterZone(locationId) {
  for (const [zone, rooms] of Object.entries(ENCOUNTER_ZONES)) {
    if (rooms.includes(locationId)) return zone;
  }
  return null;
}

/**
 * Should an encounter fire this move?
 */
export function shouldFireEncounter(locationId, moveCount, lastEncounterMove) {
  const zone = getEncounterZone(locationId);
  if (!zone) return false;
  const cooldownOk = moveCount - lastEncounterMove >= 3;
  if (!cooldownOk) return false;
  const p = ENCOUNTER_CHANCES[zone];
  if (p == null) return false;
  return Math.random() < p;
}

/**
 * Pick an encounter from the appropriate pools.
 * Priority: lore (if eligible) > social > ambient
 */
export function pickEncounter(locationId, flags) {
  const zone = getEncounterZone(locationId);
  if (!zone) return null;

  const lorePool = LORE_ENCOUNTERS.filter((e) => {
    if (!e.zones.includes(zone)) return false;
    if (e.requires_flag && !flagTruthy(flags, e.requires_flag)) return false;
    if (e.requires_flag_not && !flagFalsy(flags, e.requires_flag_not))
      return false;
    if (
      e.chance_modifier != null &&
      Math.random() >= e.chance_modifier
    ) {
      return false;
    }
    return true;
  });
  if (lorePool.length && Math.random() < 0.15) {
    const encounter = lorePool[Math.floor(Math.random() * lorePool.length)];
    return { tier: "lore", encounter };
  }

  const socialPool = SOCIAL_ENCOUNTERS.filter((e) => {
    if (!e.zones.includes(zone)) return false;
    if (e.requires_flag && !flagTruthy(flags, e.requires_flag)) return false;
    return true;
  });
  if (socialPool.length && Math.random() < 0.6) {
    const encounter = socialPool[Math.floor(Math.random() * socialPool.length)];
    return { tier: "social", encounter };
  }

  const ambientPool = AMBIENT_ENCOUNTERS.filter((e) => {
    if (!e.zones.includes(zone)) return false;
    if (e.requires_flag && !flagTruthy(flags, e.requires_flag)) return false;
    return true;
  });
  if (ambientPool.length) {
    const encounter =
      ambientPool[Math.floor(Math.random() * ambientPool.length)];
    return { tier: "ambient", encounter };
  }

  return null;
}

/**
 * Text appended to move `description` (paragraphs + numbered options).
 */
export function formatNarrativeEncounterAppend(tier, encounter) {
  if (tier === "ambient" && encounter.text) {
    return `\n\n${encounter.text}`;
  }
  if (tier === "social" || tier === "lore") {
    const lines = [encounter.stranger || ""];
    const opts = encounter.options || [];
    opts.forEach((o, i) => {
      lines.push(`\n[E${i + 1}] ${o.label}`);
    });
    lines.push("\n[E0] Ignore");
    return `\n\n${lines.join("")}`;
  }
  return "";
}

/**
 * Apply encounter.effects (set_flag) after a choice.
 */
export async function applyNarrativeEncounterEffects(db, uid, setFlag, effects) {
  if (!effects || typeof effects !== "object") return;
  if (effects.set_flag) await setFlag(db, uid, effects.set_flag, 1);
}
