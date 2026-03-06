/**
 * Item tier logic — adapted to five-floor sewer structure.
 */

// Surface / City — tier 0
// Sewer Floor 1 — tier 1: The Drains
// Sewer Floor 2 — tier 2: Forgotten Channels
// Sewer Floor 3 — tier 3: Cistern Depths
// Sewer Floor 4 — tier 4: Mechanist's Spine
// Sewer Floor 5 — tier 5: Sump Cathedral
export const DUNGEON_TIERS = {
  market_square: 0, tavern: 0, atelier: 0,
  mended_hide: 0, hollow_jar: 0, still_scale: 0,
  naxirs_crucible: 0, wardens_post: 0,
  cinder_cells_entrance: 0, cinder_cells_hall: 0, cinder_cells_block: 0, cinder_cells_pit: 0,
  north_road: 0, south_road: 0, east_road: 0, west_road: 0,
  alley: 0, ashen_sanctuary: 0, backroom: 0,
  // Sewer Floor 1 — The Drains
  sewer_entrance: 1, drain_entrance: 1, overflow_channel: 1, broken_pipe_room: 1,
  vermin_nest: 1, workers_alcove: 1, rusted_gate: 1,
  // Sewer Floor 2 — Forgotten Channels
  fungal_bloom_chamber: 2, collapsed_passage: 2, old_maintenance_room: 2,
  echoing_hall: 2, spore_garden: 2, cracked_aqueduct: 2,
  // Sewer Floor 3 — Cistern Depths
  flooded_hall: 3, drowned_archive: 3, submerged_tunnel: 3,
  broken_pump_room: 3, drowned_vault: 3, sluice_gate: 3,
  // Sewer Floor 4 — Mechanist's Spine
  gear_hall: 4, steam_vent_corridor: 4, broken_regulator_chamber: 4,
  iron_walkway: 4, heart_pump: 4, pressure_valve_shaft: 4,
  // Sewer Floor 5 — Sump Cathedral
  ash_pillar_hall: 5, whispering_chamber: 5, rune_lit_corridor: 5,
  cathedral_floor: 5, ash_heart_chamber: 5, sump_pit: 5,
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
