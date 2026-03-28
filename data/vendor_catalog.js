/**
 * Authoritative vendor catalog — weaponsmith / armorsmith use EQUIPMENT_DATA (buy = value_am).
 * Herbalist + trader lists match legacy consumables / gear (not in EQUIPMENT_DATA).
 * Curator (Seris): sells nothing (buy-only); relic buy rates live in economy VENDOR_BUY_RATES.
 *
 * Anti-arbitrage: for every item in VENDOR_CATALOG, player sell price at that vendor is always
 * strictly less than buy price (getSellPrice uses VENDOR_BUY_RATES with rates < 1 on base_value).
 */

import { EQUIPMENT_DATA } from "./equipment.js";
import { getSellPrice as econGetSellPrice } from "./economy.js";

const WEAPONSMITH_ITEM_IDS = [
  "rusted_blade",
  "pipe_shiv",
  "hooked_knife",
  "drain_spear",
  "ash_caked_club",
  "worn_mace",
  "sewer_wand",
  // Ember arcane upgrade (catalog tier 2; buy = value_am, unchanged)
  "charred_staff",
];

/** patchwork_jerkin = chest piece closest to "patchwork_rags"; shields: scrap_shield, cracked_buckler. */
const ARMORSMITH_ITEM_IDS = [
  "patchwork_jerkin",
  "mold_stained_vest",
  "sewer_leathers",
  "riveted_coat",
  "scrap_shield",
  "cracked_buckler",
  "cloth_wraps",
  "tinker_gloves",
  // Sewer vendor coverage for starter-adjacent slots (full Phase 1 roster; expand when catalog/instincts grow)
  "bone_focus",
  "footwraps",
  "slickstep_boots",
  "faded_mantle",
  "drip_cloak",
  "sewer_saint_knot",
  "salt_thread_token",
  "rat_bone_charm",
  "iron_band",
  "ash_script_token",
  "whisper_stone_fragment",
  "cracked_reliquary_shard",
];

export const THALARA_STOCK = [
  { id: "vendor_murky_draught", display_name: "Murky Draught", price: 15, base_value: 10, tier: 1, category: "consumable" },
  { id: "vendor_sewer_tincture", display_name: "Sewer Tincture", price: 30, base_value: 20, tier: 1, category: "consumable" },
  { id: "vendor_rat_moss_poultice", display_name: "Rat Moss Poultice", price: 10, base_value: 7, tier: 1, category: "consumable" },
  { id: "vendor_bitter_fungal_cap", display_name: "Bitter Fungal Cap", price: 10, base_value: 7, tier: 1, category: "consumable" },
];

const TRADER_STOCK = [
  { id: "rope_coil", name: "Rope Coil", price: 5, base_value: 3, type: "gear", category: "gear" },
  { id: "torch_bundle", name: "Torch Bundle (x3)", price: 6, base_value: 3, type: "gear", category: "gear" },
  { id: "travel_rations", name: "Travel Rations", price: 4, base_value: 2, type: "gear", category: "gear" },
  { id: "iron_hook", name: "Iron Hook", price: 3, base_value: 2, type: "gear", category: "gear" },
];

function equipSellCategory(itemId) {
  const d = EQUIPMENT_DATA[itemId];
  if (!d) return "armor";
  if (d.slot === "weapon_main") return "weapon";
  if (d.slot === "weapon_offhand" && (d.sub_type === "shield" || d.sub_type === "buckler")) return "shield";
  if (d.slot === "weapon_offhand") return "weapon";
  return "armor";
}

/** Legacy shape for /api/vendor/buy (display_name, stats, tier). */
export function legacyEquipVendorRow(itemId) {
  const d = EQUIPMENT_DATA[itemId];
  if (!d) return null;
  const category = equipSellCategory(itemId);
  return {
    id: itemId,
    name: d.name,
    display_name: d.name,
    price: d.value_am,
    tier: d.tier ?? 1,
    category,
    stats: null,
  };
}

export const VENDOR_CATALOG = {
  weaponsmith: WEAPONSMITH_ITEM_IDS.map(legacyEquipVendorRow).filter(Boolean),
  armorsmith: ARMORSMITH_ITEM_IDS.map(legacyEquipVendorRow).filter(Boolean),
  herbalist: THALARA_STOCK,
  trader: TRADER_STOCK,
  curator: [],
};

export const VENDOR_NPCS = {
  weaponsmith: { buy: true, sell: true },
  armorsmith: { buy: true, sell: true },
  herbalist: { buy: true, sell: true },
  trader: { buy: true, sell: true },
  curator: { buy: false, sell: true },
};

export function getVendorStock(npcId) {
  return VENDOR_CATALOG[npcId] ?? [];
}

/** Buy price for catalog items (equipment → value_am). */
export function getBuyPrice(itemId) {
  const d = EQUIPMENT_DATA[itemId];
  if (d) return d.value_am;
  const th = THALARA_STOCK.find((x) => x.id === itemId);
  if (th) return th.price;
  const tr = TRADER_STOCK.find((x) => x.id === itemId);
  if (tr) return tr.price;
  return null;
}

/**
 * Sell price when player sells to npcId (uses economy rates + equipment category).
 */
export function getSellPrice(itemId, npcId) {
  const d = EQUIPMENT_DATA[itemId];
  if (d) {
    const category = equipSellCategory(itemId);
    return econGetSellPrice({ base_value: d.value_am, category, name: d.name }, npcId);
  }
  const th = THALARA_STOCK.find((x) => x.id === itemId);
  if (th) {
    return econGetSellPrice(
      { base_value: th.base_value, category: "consumable", name: th.display_name },
      npcId,
    );
  }
  const tr = TRADER_STOCK.find((x) => x.id === itemId);
  if (tr) return econGetSellPrice(tr, npcId);
  return null;
}

/** Shop browse rows (economy /shop shape: id, name, price, base_value, type, category). */
export function getShopBrowseRows(npcId) {
  const stock = VENDOR_CATALOG[npcId];
  if (!stock?.length) return null;
  return stock.map((r) => {
    if (r.display_name != null && EQUIPMENT_DATA[r.id]) {
      const d = EQUIPMENT_DATA[r.id];
      return {
        id: r.id,
        name: r.display_name,
        price: r.price,
        base_value: d.value_am,
        type: d.slot === "chest" || d.slot === "head" || d.slot === "hands" ? "armor" : "weapon",
        category: r.category,
      };
    }
    if (r.display_name != null) {
      return {
        id: r.id,
        name: r.display_name,
        price: r.price,
        base_value: r.base_value ?? Math.floor(r.price * 0.65),
        type: "consumable",
        category: r.category || "consumable",
      };
    }
    return {
      id: r.id,
      name: r.name,
      price: r.price,
      base_value: r.base_value,
      type: r.type || "gear",
      category: r.category || "gear",
    };
  });
}

export const CAELIR_STOCK = VENDOR_CATALOG.weaponsmith;
export const VEYRA_STOCK = VENDOR_CATALOG.armorsmith;
