/**
 * Guild faction ↔ instinct family alignment (Phase 1: two instincts per family in data/instincts.js).
 * Use for mastery trial gates and initiation-trial mechanic branches — not for combat upgrades.
 */

import { INSTINCTS } from "../data/instincts.js";

/** POST /api/guild/trial `guild` body key → instinct `guild` (matches legacy one-id-per-guild alignment). */
const FACTION_TO_FAMILY = {
  ashen_archive: "shadow",
  broken_banner: "iron",
  quiet_sanctum: "hearth",
  veil_market: "street",
  umbral_covenant: "ember",
  stone_watch: "warden",
};

/** POST /api/trial/start `guild` body key (leader id) → instinct `guild`. */
const LEADER_TO_FAMILY = {
  vaelith: "shadow",
  garruk: "iron",
  halden: "hearth",
  lirael: "street",
  serix: "ember",
  rhyla: "warden",
};

/**
 * @param {string} instinctKey - lowercase instinct id
 * @returns {string|null} INSTINCTS[].guild or null
 */
export function instinctGuildFamily(instinctKey) {
  const k = (instinctKey || "").toLowerCase();
  const def = INSTINCTS[k];
  return def?.guild ?? null;
}

/** Mastery trials: POST /api/guild/trial body.guild is a FACTION_TO_FAMILY key. */
export function instinctBelongsToFaction(instinctKey, factionId) {
  const want = FACTION_TO_FAMILY[factionId];
  if (want == null) return false;
  return instinctGuildFamily(instinctKey) === want;
}

/** Standing-0 initiation: leader id must match character instinct family. */
export function instinctBelongsToLeaderHall(instinctKey, leaderId) {
  const want = LEADER_TO_FAMILY[leaderId];
  if (want == null) return false;
  return instinctGuildFamily(instinctKey) === want;
}
