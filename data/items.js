/**
 * Fetch quest economy — loot tables, item data, sell values.
 * @see blueprints/Quests/cursor_fetch_quest_prompt.md
 * @see blueprints/Item System/item_system.md
 */

// Dungeon tier by location (0 = surface, 1–5 = sewer floors)
const DUNGEON_TIERS = {
  market_square: 0, tavern: 0, wardens_post: 0, north_road: 0, south_road: 0,
  east_road: 0, west_road: 0, atelier: 0, mended_hide: 0, hollow_jar: 0,
  still_scale: 0, crucible: 0, naxirs_crucible: 0, alley: 0, ashen_sanctuary: 0,
  sewer_entrance: 1, cinder_cells_entrance: 0, cinder_cells_hall: 0, cinder_cells_block: 0, cinder_cells_pit: 0,
  drain_entrance: 1, overflow_channel: 1, broken_pipe_room: 1, vermin_nest: 1, workers_alcove: 1, rusted_gate: 1,
  fungal_bloom_chamber: 2, collapsed_passage: 2, old_maintenance_room: 2, echoing_hall: 2, spore_garden: 2, cracked_aqueduct: 2,
  flooded_hall: 3, drowned_archive: 3, submerged_tunnel: 3, broken_pump_room: 3, drowned_vault: 3, sluice_gate: 3,
  gear_hall: 4, steam_vent_corridor: 4, broken_regulator_chamber: 4, iron_walkway: 4, heart_pump: 4, pressure_valve_shaft: 4,
  ash_pillar_hall: 5, whispering_chamber: 5, rune_lit_corridor: 5, cathedral_floor: 5, ash_heart_chamber: 5, sump_pit: 5,
};

/**
 * Compute item tier from player level and location.
 * @param {number} playerLevel — from class_stage or xp
 * @param {string} locationId — current location
 * @returns {number} — tier 1–6
 */
export function getItemTier(playerLevel, locationId) {
  const dungeonTier = DUNGEON_TIERS[locationId] ?? 1;
  const playerTier = Math.floor((playerLevel || 0) / 5) + 1;
  return Math.min(
    Math.max(playerTier, dungeonTier),
    dungeonTier + 1
  );
}

// Weight-based loot: [item_id, weight, min_qty, max_qty]
// Weights are relative — higher = more common
export const LOOT_TABLES = {
  gutter_rat:        [['rat_pelt', 70, 1, 2], ['slime_residue', 30, 1, 1]],
  ash_crawler:       [['ash_residue', 60, 1, 1], ['pipe_fitting', 40, 1, 1]],
  mold_vermin:       [['slime_residue', 60, 1, 2], ['sewer_fungi', 40, 1, 1]],
  channel_stalker:   [['rat_pelt', 40, 1, 1], ['spore_cluster', 60, 1, 1]],
  drowned_thrall:    [['waterlogged_cloth', 50, 1, 1], ['drowned_relic', 30, 1, 1], ['tarnished_coin', 20, 1, 2], ['flood_record_page', 15, 1, 1]],
  cistern_leech:     [['leech_extract', 80, 1, 2], ['deep_water_residue', 20, 1, 1]],
  flood_serpent:     [['deep_water_residue', 50, 1, 1], ['rare_algae', 30, 1, 1], ['leech_extract', 20, 1, 1]],
  gearbound_sentinel:[['gear_fragment', 60, 1, 1], ['crafting_scrap', 40, 1, 2]],
  heat_wraith:       [['deep_vent_ash', 70, 1, 1], ['heat_core_fragment', 30, 1, 1]],
  rust_golem:        [['rust_plates', 60, 1, 1], ['gear_fragment', 40, 1, 1]],
  ashborn_acolyte:   [['ash_infused_stone', 60, 1, 1], ['cathedral_rune_shard', 40, 1, 1]],
  cathedral_wraith:  [['void_essence', 50, 1, 1], ['ash_infused_stone', 50, 1, 1]],
  fungal_shambler:   [['sewer_fungi', 50, 1, 2], ['spore_cluster', 50, 1, 1]],
  rat_king:          [['rat_king_musk', 100, 1, 1], ['sewer_map_fragment', 40, 1, 1]],
  sporebound_custodian: [['custodian_core', 100, 1, 1], ['spore_extract', 100, 1, 1]],
  cistern_leviathan: [['leviathan_scale', 100, 1, 1], ['drowned_relic', 100, 1, 1]],
  broken_regulator:  [['regulator_core', 100, 1, 1], ['runic_tablet', 100, 1, 1], ['mechanist_components', 60, 1, 2]],
  ash_heart_custodian: [['ashbound_resonance', 100, 1, 1], ['cathedral_rune_shard', 100, 2, 3]],
};

// Item display names and base values (sell price = base * 0.5, rounded)
export const ITEM_DATA = {
  rat_pelt:              { name: 'Rat Pelt',              value: 12  },
  slime_residue:         { name: 'Slime Residue',         value: 8   },
  ash_residue:           { name: 'Ash Residue',           value: 10  },
  pipe_fitting:          { name: 'Pipe Fitting',          value: 15  },
  sewer_fungi:           { name: 'Sewer Fungi',           value: 20  },
  spore_cluster:         { name: 'Spore Cluster',         value: 25  },
  spore_extract:         { name: 'Spore Extract',         value: 80  },
  waterlogged_cloth:     { name: 'Waterlogged Cloth',     value: 10  },
  drowned_relic:         { name: 'Drowned Relic',         value: 120 },
  tarnished_coin:        { name: 'Tarnished Coin',         value: 5   },
  leech_extract:         { name: 'Leech Extract',         value: 30  },
  deep_water_residue:    { name: 'Deep Water Residue',    value: 25  },
  rare_algae:            { name: 'Rare Algae',             value: 60  },
  gear_fragment:         { name: 'Gear Fragment',         value: 35  },
  crafting_scrap:        { name: 'Crafting Scrap',         value: 18  },
  deep_vent_ash:         { name: 'Deep Vent Ash',         value: 50  },
  heat_core_fragment:    { name: 'Heat Core Fragment',    value: 90  },
  rust_plates:           { name: 'Rust Plates',           value: 45  },
  ash_infused_stone:     { name: 'Ash-Infused Stone',     value: 55  },
  cathedral_rune_shard:  { name: 'Cathedral Rune Shard',  value: 150 },
  void_essence:          { name: 'Void Essence',         value: 200 },
  mechanist_components:  { name: 'Mechanist Components',   value: 140 },
  sewer_map_fragment:    { name: 'Sewer Map Fragment',   value: 30  },
  rat_king_musk:         { name: "Rat King's Musk",       value: 80  },
  custodian_core:        { name: 'Custodian Core',        value: 180 },
  leviathan_scale:       { name: 'Leviathan Scale',       value: 250 },
  regulator_core:        { name: 'Regulator Core',       value: 300 },
  runic_tablet:          { name: 'Runic Tablet',         value: 200 },
  ashbound_resonance:    { name: 'Ashbound Resonance',   value: 0   },
  worn_tool:             { name: 'Worn Tool',            value: 25  },
  glowing_spores:        { name: 'Glowing Spores',        value: 40  },
  flood_record_page:     { name: 'Flood Record Page',     value: 0   },
  healers_kit:           { name: "Healer's Kit",          value: 0   },
  heart_pump_fragment:   { name: 'Heart Pump Fragment',   value: 0   },
  channel_salt:          { name: 'Channel Salt',         value: 15  },
  deep_antidote:         { name: 'Deep Antidote',         value: 60  },
  resonant_scrap:        { name: 'Resonant Scrap',        value: 35  },
};

export function rollLoot(enemyId) {
  const table = LOOT_TABLES[enemyId];
  if (!table) return [];
  const drops = [];
  for (const [itemId, weight, minQty, maxQty] of table) {
    if (Math.random() * 100 < weight) {
      const qty = minQty + Math.floor(Math.random() * (maxQty - minQty + 1));
      drops.push({ itemId, qty });
    }
  }
  return drops;
}
