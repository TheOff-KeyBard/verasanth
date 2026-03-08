/**
 * Fetch quest economy — loot tables, item data, sell values.
 * @see blueprints/Quests/cursor_fetch_quest_prompt.md
 * @see blueprints/Item System/item_system.md
 */

import { EQUIPMENT_DATA } from "./equipment.js";

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
  rat_pelt:              { name: 'Rat Pelt',              value: 12,  item_type: 'loot' },
  slime_residue:         { name: 'Slime Residue',         value: 8,   item_type: 'loot' },
  ash_residue:           { name: 'Ash Residue',           value: 10,  item_type: 'loot' },
  pipe_fitting:          { name: 'Pipe Fitting',          value: 15,  item_type: 'loot' },
  sewer_fungi:           { name: 'Sewer Fungi',           value: 20,  item_type: 'loot' },
  spore_cluster:         { name: 'Spore Cluster',         value: 25,  item_type: 'loot' },
  spore_extract:         { name: 'Spore Extract',         value: 80,  item_type: 'loot' },
  waterlogged_cloth:     { name: 'Waterlogged Cloth',     value: 10,  item_type: 'loot' },
  drowned_relic:         { name: 'Drowned Relic',         value: 120, item_type: 'loot' },
  tarnished_coin:        { name: 'Tarnished Coin',         value: 5,   item_type: 'loot' },
  leech_extract:         { name: 'Leech Extract',         value: 30,  item_type: 'loot' },
  deep_water_residue:    { name: 'Deep Water Residue',    value: 25,  item_type: 'loot' },
  rare_algae:            { name: 'Rare Algae',             value: 60,  item_type: 'loot' },
  gear_fragment:         { name: 'Gear Fragment',         value: 35,  item_type: 'loot' },
  crafting_scrap:        { name: 'Crafting Scrap',         value: 18,  item_type: 'loot' },
  deep_vent_ash:         { name: 'Deep Vent Ash',         value: 50,  item_type: 'loot' },
  heat_core_fragment:    { name: 'Heat Core Fragment',    value: 90,  item_type: 'loot' },
  rust_plates:           { name: 'Rust Plates',           value: 45,  item_type: 'loot' },
  ash_infused_stone:     { name: 'Ash-Infused Stone',     value: 55,  item_type: 'loot' },
  cathedral_rune_shard:  { name: 'Cathedral Rune Shard',  value: 150, item_type: 'loot' },
  void_essence:          { name: 'Void Essence',         value: 200, item_type: 'loot' },
  mechanist_components:  { name: 'Mechanist Components',   value: 140, item_type: 'loot' },
  sewer_map_fragment:    { name: 'Sewer Map Fragment',   value: 30,  item_type: 'loot' },
  rat_king_musk:         { name: "Rat King's Musk",       value: 80,  item_type: 'loot' },
  custodian_core:        { name: 'Custodian Core',        value: 180, item_type: 'loot' },
  leviathan_scale:       { name: 'Leviathan Scale',       value: 250, item_type: 'loot' },
  regulator_core:        { name: 'Regulator Core',       value: 300, item_type: 'loot' },
  runic_tablet:          { name: 'Runic Tablet',         value: 200, item_type: 'loot' },
  ashbound_resonance:    { name: 'Ashbound Resonance',   value: 0,   item_type: 'loot' },
  worn_tool:             { name: 'Worn Tool',            value: 25,  item_type: 'loot' },
  glowing_spores:        { name: 'Glowing Spores',        value: 40,  item_type: 'loot' },
  flood_record_page:     { name: 'Flood Record Page',     value: 0,   item_type: 'quest' },
  healers_kit:           { name: "Healer's Kit",           value: 0,   item_type: 'quest' },
  heart_pump_fragment:   { name: 'Heart Pump Fragment',   value: 0,   item_type: 'quest' },
  channel_salt: {
    name: 'Channel Salt', value: 15, item_type: 'consumable',
    effect: { type: 'utility', removes_status: 'cursed', out_of_combat: true, in_combat: false,
      message: 'The salt absorbs it. Whatever it was.' },
  },
  deep_antidote: {
    name: 'Deep Antidote', value: 60, item_type: 'consumable',
    effect: { type: 'utility', removes_status: 'poisoned', out_of_combat: true, in_combat: true,
      message: 'The bitterness burns the poison out.' },
  },
  crude_healing_draught: {
    name: 'Crude Healing Draught', value: 12, item_type: 'consumable',
    effect: { type: 'heal', value: 12, out_of_combat: true, in_combat: true,
      message: 'A bitter swallow. The wound closes badly but closes.' },
  },
  healing_potion: {
    name: 'Healing Potion', value: 22, item_type: 'consumable',
    effect: { type: 'heal', value: 22, out_of_combat: true, in_combat: true,
      message: 'The warmth spreads through your chest.' },
  },
  strong_healing_potion: {
    name: 'Strong Healing Potion', value: 45, item_type: 'consumable',
    effect: { type: 'heal', value: 40, out_of_combat: true, in_combat: true,
      message: 'The pain recedes. Not gone — receded.' },
  },
  listening_ash_elixir: {
    name: 'Listening Ash Elixir', value: 80, item_type: 'consumable',
    effect: { type: 'buff', stat: 'perception', value: 4, duration_turns: 5,
      out_of_combat: true, in_combat: false,
      message: 'The ash settles in your throat. You hear more.' },
  },
  pale_sight_elixir: {
    name: 'Pale Sight Elixir', value: 60, item_type: 'consumable',
    effect: { type: 'buff', stat: 'perception', value: 6, duration_turns: 3,
      out_of_combat: true, in_combat: false,
      message: 'Your vision shifts. Edges sharpen. You see what hides.' },
  },
  ashbound_elixir: {
    name: 'Ashbound Elixir', value: 90, item_type: 'consumable',
    effect: { type: 'buff', stat: 'defense', value: 3, duration_turns: 4,
      out_of_combat: true, in_combat: true,
      message: 'The ash hardens on your skin. Brief, but enough.' },
  },
  sewer_salt_wrap: {
    name: 'Sewer Salt Wrap', value: 5, item_type: 'consumable',
    effect: { type: 'buff', stat: 'defense', value: 1, duration_turns: 3,
      out_of_combat: true, in_combat: true,
      message: 'Rough cloth soaked in salt. It stiffens against the next blow.' },
  },
  rat_bile_flask: {
    name: 'Rat Bile Flask', value: 4, item_type: 'consumable',
    effect: { type: 'damage', value: 8, out_of_combat: false, in_combat: true,
      message: 'You hurl it. The enemy recoils from the stench and acid.' },
  },
  fungal_paste: {
    name: 'Fungal Paste', value: 6, item_type: 'consumable',
    effect: { type: 'heal', value: 6, out_of_combat: true, in_combat: true,
      message: 'It smells wrong. It works anyway.' },
  },
  ember_salts: {
    name: 'Ember Salts', value: 22, item_type: 'consumable',
    effect: { type: 'buff', stat: 'melee_power', value: 3, duration_turns: 3,
      out_of_combat: false, in_combat: true,
      message: 'Your grip tightens. Every strike feels intent.' },
  },
  resonant_scrap:        { name: 'Resonant Scrap',        value: 35,  item_type: 'loot' },
  // Guild vault items (Tier 3)
  archive_sigil_band:    { name: 'Archive Sigil Band',    value: 80,  item_type: 'equipment' },
  ember_scholar_robes:   { name: 'Ember Scholar Robes',   value: 80,  item_type: 'equipment' },
  containment_seal:      { name: 'Containment Seal',      value: 80,  item_type: 'equipment' },
  banner_vanguard_mail:   { name: 'Banner Vanguard Mail',  value: 80,  item_type: 'equipment' },
  ironblood_bracer:      { name: 'Ironblood Bracer',      value: 80,  item_type: 'equipment' },
  pressure_buckler:      { name: 'Pressure Buckler',      value: 80,  item_type: 'equipment' },
  sanctum_warden_wrap:   { name: 'Sanctum Warden Wrap',   value: 80,  item_type: 'equipment' },
  hearthborn_pendant:    { name: 'Hearthborn Pendant',    value: 80,  item_type: 'equipment' },
  flame_keeper_hood:     { name: 'Flame Keeper Hood',     value: 80,  item_type: 'equipment' },
  veil_runner_coat:      { name: 'Veil Runner Coat',      value: 80,  item_type: 'equipment' },
  market_cipher_ring:    { name: 'Market Cipher Ring',    value: 80,  item_type: 'equipment' },
  street_ghost_boots:    { name: 'Street Ghost Boots',    value: 80,  item_type: 'equipment' },
  watch_plate_shoulders: { name: 'Watch Plate Shoulders', value: 80,  item_type: 'equipment' },
  foundation_greaves:    { name: 'Foundation Greaves',   value: 80,  item_type: 'equipment' },
  sentinel_shield:       { name: 'Sentinel Shield',      value: 80,  item_type: 'equipment' },
  covenant_shroud:       { name: 'Covenant Shroud',       value: 80,  item_type: 'equipment' },
  shadow_threaded_wrap:   { name: 'Shadow-Threaded Wrap', value: 80,  item_type: 'equipment' },
  void_touched_ring:     { name: 'Void-Touched Ring',     value: 80,  item_type: 'equipment' },
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

/**
 * Compute effect_summary for display (heal, buff, utility, damage, equipment).
 */
export function getEffectSummary(itemId, itemDef) {
  const def = itemDef ?? ITEM_DATA[itemId];
  if (!def) return "";
  const eff = def.effect;
  if (eff?.type === "heal") return `Heals ${eff.value} HP`;
  if (eff?.type === "buff") return `+${eff.value} ${(eff.stat || "").replace(/_/g, " ")} for ${eff.duration_turns} turns`;
  if (eff?.type === "utility" && eff.removes_status) return `Removes ${eff.removes_status}`;
  if (eff?.type === "damage") return `Deals ${eff.value} damage to enemy`;
  if (def.item_type === "equipment" && def.stat_modifiers) {
    const lines = [];
    for (const [k, v] of Object.entries(def.stat_modifiers || {})) {
      if (v != null && v !== 0) lines.push(`${v > 0 ? "+" : ""}${v} ${k.replace(/_/g, " ")}`);
      if (lines.length >= 2) break;
    }
    return lines.join(", ") || "";
  }
  return "";
}

// Merge equipment items into ITEM_DATA for sell value (extend, do not replace)
for (const [id, def] of Object.entries(EQUIPMENT_DATA || {})) {
  if (!ITEM_DATA[id]) ITEM_DATA[id] = { name: def.name, value: def.value_am ?? 10, item_type: "equipment", stat_modifiers: def.stat_modifiers };
}
