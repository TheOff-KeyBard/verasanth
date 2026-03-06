/**
 * Item tier logic — adapted to current sewer location IDs.
 * TODO: update to new sewer IDs when sewer redesign is implemented
 * (drain_corridor, drain_junction, old_sewer_west, cistern_upper, etc.)
 */

// Surface / City — tier 0
// Sewer Level 1 — tier 1: entrance, upper, den, channel
// Sewer Level 2 — tier 2: deep, gate, mid_*
// Sewer Level 3 — tier 3: deep_threshold, deep_vault
// Sewer Level 4 — tier 4: deep_foundation
export const DUNGEON_TIERS = {
  market_square: 0, tavern: 0, atelier: 0,
  mended_hide: 0, hollow_jar: 0, still_scale: 0,
  naxirs_crucible: 0, wardens_post: 0,
  north_road: 0, south_road: 0, east_road: 0, west_road: 0,
  alley: 0, ashen_sanctuary: 0, backroom: 0,
  // Sewer Level 1
  sewer_entrance: 1, sewer_upper: 1, sewer_den: 1, sewer_channel: 1,
  // Sewer Level 2
  sewer_deep: 2, sewer_gate: 2,
  sewer_mid_flooded: 2, sewer_mid_barracks: 2,
  sewer_mid_cistern: 3, sewer_mid_drain: 3,
  // Sewer Level 3
  sewer_deep_threshold: 4,
  // Sewer Level 4
  sewer_deep_vault: 5, sewer_deep_foundation: 5,
};

/**
 * @param {number} playerLevel — derived from class_stage or xp
 * @param {string} locationId
 * @returns {number} item tier 1–6
 */
export function getItemTier(playerLevel, locationId) {
  const dungeonTier = DUNGEON_TIERS[locationId] ?? 1;
  const playerTier = Math.floor(playerLevel / 5) + 1;
  return Math.min(
    Math.max(playerTier, dungeonTier),
    dungeonTier + 1
  );
}
