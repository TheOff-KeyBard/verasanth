/**
 * Sewer loot tables — floor-specific enemy drops, boss drops, room search loot.
 * @see sewer_complete.md economy loop
 */

import { generateItem } from "../services/item_generator.js";

// ── Static item display names (for room/boss loot) ──
const STATIC_ITEM_NAMES = {
  worn_tool: "Worn Tool",
  tarnished_coin: "Tarnished Coin",
  rat_pelt: "Rat Pelt",
  sewer_fungi: "Sewer Fungi",
  slime_residue: "Slime Residue",
  spore_cluster: "Spore Cluster",
  glowing_spores: "Glowing Spores",
  crafting_scrap: "Crafting Scrap",
  rusted_chain_link: "Rusted Chain Link",
  rat_king_musk: "Rat King Musk",
  sewer_map_fragment: "Sewer Map Fragment",
  custodian_core: "Custodian Core",
  spore_extract: "Spore Extract",
  leviathan_scale: "Leviathan Scale",
  cistern_key: "Cistern Key",
  regulator_core: "Regulator Core",
  runic_tablet: "Runic Tablet",
  mechanist_key: "Mechanist Key",
  ashbound_resonance: "Ashbound Resonance",
  cathedral_rune_shard: "Cathedral Rune Shard",
  drowned_journal: "Drowned Journal",
  flood_record_page: "Flood Record Page",
  personal_effects_bundle: "Personal Effects Bundle",
  drowned_relic: "Drowned Relic",
  resonant_scrap: "Resonant Scrap",
  deep_vent_ash: "Deep Vent Ash",
  gear_fragment: "Gear Fragment",
  heart_pump_fragment: "Heart Pump Fragment",
};

// ── Enemy → loot pool (floor-specific) ──
const ENEMY_LOOT = {
  gutter_rat: ["rat_pelt", "tarnished_coin"],
  sewer_wretch: ["tarnished_coin", "rusted_chain_link"],
  ash_crawler: ["slime_residue", "sewer_fungi"],
  drain_lurker: ["sewer_fungi", "slime_residue"],
  mold_vermin: ["spore_cluster", "sewer_fungi"],
  fungal_shambler: ["glowing_spores", "spore_cluster"],
  channel_stalker: ["crafting_scrap", "rusted_chain_link"],
  rustback_beetle: ["rusted_chain_link", "crafting_scrap"],
  drowned_thrall: ["drowned_relic", "tarnished_coin"],
  cistern_leech: ["slime_residue", "sewer_fungi"],
  flood_serpent: ["drowned_relic", "resonant_scrap"],
  slick_horror: ["resonant_scrap", "drowned_relic"],
  gearbound_sentinel: ["gear_fragment", "crafting_scrap"],
  heat_wraith: ["deep_vent_ash", "gear_fragment"],
  rust_golem: ["crafting_scrap", "gear_fragment"],
  ashborn_acolyte: ["cathedral_rune_shard", "resonant_scrap"],
  cathedral_wraith: ["resonant_scrap", "cathedral_rune_shard"],
  sump_guardian: ["cathedral_rune_shard", "gear_fragment"],
};

// ── Boss drops: guaranteed + optional roll ──
const BOSS_DROPS = {
  rat_king: { guaranteed: ["rat_king_musk"], optional: ["sewer_map_fragment"] },
  sporebound_custodian: { guaranteed: ["custodian_core"], optional: ["spore_extract"] },
  cistern_leviathan: { guaranteed: ["leviathan_scale"], optional: ["cistern_key"] },
  broken_regulator: { guaranteed: ["regulator_core"], optional: ["runic_tablet", "mechanist_key"] },
  ash_heart_custodian: { guaranteed: ["ashbound_resonance"], optional: ["cathedral_rune_shard", "cathedral_rune_shard"] },
};

// ── Room loot: (location:object) → { item, qty, flag } — one-time per player ──
export const ROOM_LOOT = {
  "workers_alcove:abandoned_workbench": { item: "worn_tool", qty: 1, flag: "looted_workers_workbench", display_name: "Worn Tool" },
  "workers_alcove:old_crate": { item: "tarnished_coin", qty: 2, flag: "looted_workers_crate", display_name: "Tarnished Coin" },
  "vermin_nest:rat_cache": { item: "tarnished_coin", qty: 1, flag: "looted_vermin_cache", display_name: "Tarnished Coin" },
  "drowned_archive:submerged_shelves": { item: "drowned_journal", qty: 1, flag: "looted_drowned_archive", display_name: "Drowned Journal" },
  "drowned_archive:flood_records": { item: "flood_record_page", qty: 1, flag: "looted_flood_records", display_name: "Flood Record Page" },
  "drowned_archive:personal_effects": { item: "personal_effects_bundle", qty: 1, flag: "looted_personal_effects", display_name: "Personal Effects Bundle" },
  "flooded_hall:waterlogged_armor": { item: "drowned_relic", qty: 1, flag: "looted_waterlogged_armor", display_name: "Drowned Relic" },
  "collapsed_passage:debris_pile": { item: "crafting_scrap", qty: 1, flag: "looted_collapsed_debris", display_name: "Crafting Scrap" },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get loot from combat victory.
 * @param {string} enemyId
 * @param {string} locationId
 * @param {boolean} isBoss
 * @param {number} playerLevel
 * @returns {{ items: Array<{item, qty, display_name, tier}>, procedural: Object|null }}
 */
export function getCombatLoot(enemyId, locationId, isBoss, playerLevel) {
  const items = [];
  let procedural = null;

  if (isBoss && BOSS_DROPS[enemyId]) {
    const drops = BOSS_DROPS[enemyId];
    for (const itemId of drops.guaranteed) {
      items.push({
        item: itemId,
        qty: 1,
        display_name: STATIC_ITEM_NAMES[itemId] || itemId,
        tier: getTierForItem(itemId),
      });
    }
    for (const itemId of drops.optional) {
      if (Math.random() < 0.5) {
        items.push({
          item: itemId,
          qty: 1,
          display_name: STATIC_ITEM_NAMES[itemId] || itemId,
          tier: getTierForItem(itemId),
        });
      }
    }
  } else if (ENEMY_LOOT[enemyId]) {
    const pool = ENEMY_LOOT[enemyId];
    const itemId = pick(pool);
    items.push({
      item: itemId,
      qty: 1,
      display_name: STATIC_ITEM_NAMES[itemId] || itemId,
      tier: getTierForItem(itemId),
    });
    // 30% chance for procedural weapon/armor in addition
    if (Math.random() < 0.3) {
      procedural = generateItem(playerLevel, locationId, 1);
    }
  } else {
    procedural = generateItem(playerLevel, locationId, 1);
  }

  return { items, procedural };
}

function getTierForItem(itemId) {
  const tierMap = {
    worn_tool: 1, tarnished_coin: 1, rat_pelt: 1, sewer_fungi: 1, slime_residue: 1,
    spore_cluster: 2, glowing_spores: 2, crafting_scrap: 2, rusted_chain_link: 1,
    rat_king_musk: 1, sewer_map_fragment: 1, custodian_core: 2, spore_extract: 2,
    leviathan_scale: 3, cistern_key: 3, regulator_core: 4, runic_tablet: 4, mechanist_key: 4,
    ashbound_resonance: 5, cathedral_rune_shard: 5, drowned_journal: 3, flood_record_page: 3,
    personal_effects_bundle: 3, drowned_relic: 3, resonant_scrap: 3, deep_vent_ash: 4,
    gear_fragment: 4, heart_pump_fragment: 4,
  };
  return tierMap[itemId] ?? 1;
}
