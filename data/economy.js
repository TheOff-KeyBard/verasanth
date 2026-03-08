/**
 * Economy Blueprint v2 — vendor stock, buy rates, loot tables, combat drops.
 * @see cursor_economy_blueprint_v2.md
 *
 * ECONOMY INVARIANT: buy_price must always exceed sell_value at every vendor.
 * No item should ever be purchasable and resellable for profit.
 * Before adding any item: verify sell_price(item, any_vendor) < item.price at cheapest vendor.
 */

// --- VENDOR_STOCK ---
// Map: alchemist → herbalist (NPC_LOCATIONS). trader = Still Scale.
export const VENDOR_STOCK = {
  weaponsmith: [
    { id: "rusted_blade",      name: "Rusted Blade",       price: 15,  base_value: 10,  type: "weapon",  category: "weapon" },
    { id: "worn_shortsword",   name: "Worn Shortsword",    price: 28,  base_value: 18,  type: "weapon",  category: "weapon" },
    { id: "worn_longsword",    name: "Worn Longsword",     price: 35,  base_value: 22,  type: "weapon",  category: "weapon" },
    { id: "ash_wrapped_spear", name: "Ash-Wrapped Spear",  price: 42,  base_value: 28,  type: "weapon",  category: "weapon" },
    { id: "iron_handaxe",      name: "Iron Handaxe",       price: 38,  base_value: 25,  type: "weapon",  category: "weapon" },
    { id: "iron_dagger",       name: "Iron Dagger",        price: 22,  base_value: 14,  type: "weapon",  category: "weapon" },
  ],
  armorsmith: [
    { id: "padded_vest",        name: "Padded Vest",        price: 18,  base_value: 12,  type: "armor",  category: "armor" },
    { id: "leather_jerkin",     name: "Leather Jerkin",     price: 30,  base_value: 20,  type: "armor",  category: "armor" },
    { id: "chain_shirt",        name: "Chain Shirt",        price: 55,  base_value: 36,  type: "armor",  category: "armor" },
    { id: "reinforced_leather", name: "Reinforced Leather", price: 45,  base_value: 30,  type: "armor",  category: "armor" },
    { id: "wooden_buckler",     name: "Wooden Buckler",     price: 20,  base_value: 13,  type: "shield", category: "shield" },
    { id: "iron_shield",        name: "Iron Shield",        price: 50,  base_value: 33,  type: "shield", category: "shield" },
  ],
  herbalist: [
    { id: "ash_salve",           name: "Ash Salve",           price: 12, base_value: 8,  type: "consumable", category: "consumable" },
    { id: "ember_draught",       name: "Ember Draught",       price: 20, base_value: 14, type: "consumable", category: "consumable" },
    { id: "pale_growth_extract", name: "Pale Growth Extract", price: 15, base_value: 10, type: "consumable", category: "consumable" },
    { id: "cinder_rat_bile",     name: "Cinder Rat Bile",     price: 8,  base_value: 5,  type: "reagent",    category: "loot_reagent" },
    { id: "stillwater_vial",     name: "Stillwater Vial",     price: 25, base_value: 17, type: "consumable", category: "consumable" },
    { id: "ashcap_powder",       name: "Ashcap Powder",       price: 6,  base_value: 4,  type: "reagent",    category: "loot_reagent" },
  ],
  trader: [
    { id: "rope_coil",      name: "Rope Coil",         price: 5, base_value: 3, type: "gear", category: "gear" },
    { id: "torch_bundle",   name: "Torch Bundle (x3)", price: 6, base_value: 3, type: "gear", category: "gear" },
    { id: "travel_rations", name: "Travel Rations",    price: 4, base_value: 2, type: "gear", category: "gear" },
    { id: "iron_hook",      name: "Iron Hook",         price: 3, base_value: 2, type: "gear", category: "gear" },
  ],
};

// --- VENDOR_BUY_RATES ---
export const VENDOR_BUY_RATES = {
  weaponsmith: { weapon: 0.40, default: 0.20 },
  armorsmith:  { armor: 0.40, shield: 0.40, loot_vendor: 0.35, default: 0.20 },
  herbalist:   { loot_reagent: 1.20, consumable: 0.50, default: 0.25 },
  trader:      { loot_scrap: 0.18, default: 0.30 },
  curator:     { loot_relic: 1.50, loot_artifact: 1.20, default: 0.10 },
};

export function getSellPrice(item, npc_id) {
  const rates = VENDOR_BUY_RATES[npc_id] || VENDOR_BUY_RATES.trader;
  const rate  = rates[item.category] ?? rates.default;
  return Math.floor(item.base_value * rate);
}

/** Resolve item by id for sell price. Returns { base_value, category, name } or null. */
export function getItemForSell(itemId, itemData = {}) {
  const loot = LOOT_ITEMS[itemId];
  if (loot) return { ...loot, base_value: loot.base_value };
  for (const stock of Object.values(VENDOR_STOCK)) {
    const entry = stock.find((s) => s.id === itemId);
    if (entry) return { base_value: entry.base_value, category: entry.category, name: entry.name };
  }
  const def = itemData[itemId];
  if (def && def.value != null) {
    const category = def.item_type === "consumable" ? "consumable" : def.item_type === "loot" ? "loot_vendor" : "loot_vendor";
    return { base_value: def.value, category, name: def.name };
  }
  return null;
}

// --- LOOT_ITEMS (combat drop economy) ---
export const LOOT_ITEMS = {
  rat_pelt:         { name: "Cinder Rat Pelt",        category: "loot_vendor",  base_value: 12 },
  crawler_carapace: { name: "Crawler Carapace",        category: "loot_vendor",  base_value: 18 },
  hollow_shard:     { name: "Hollow Guard Shard",      category: "loot_vendor",  base_value: 35 },
  pale_film:        { name: "Pale Growth Sample",      category: "loot_reagent", base_value: 20 },
  spore_cluster:    { name: "Ash Spore Cluster",       category: "loot_reagent", base_value: 25 },
  deep_ash:         { name: "Deep Foundation Ash",     category: "loot_relic",   base_value: 80  },
  leviathan_scale:  { name: "Leviathan Scale",         category: "loot_relic",   base_value: 250 },
  regulator_core:   { name: "Regulator Core",         category: "loot_relic",   base_value: 300 },
  rusted_gear:      { name: "Rusted Gear",             category: "loot_scrap",  base_value: 6 },
  broken_pipe:      { name: "Broken Pipe Segment",     category: "loot_scrap",   base_value: 7 },
  charred_bolt:     { name: "Charred Bolt",            category: "loot_scrap",   base_value: 5 },
};

/** loot_reagent → refined item (2.5× base_value). Compress: 3× same → 1 refined. */
export const REFINED_REAGENTS = {
  pale_film:     { id: "refined_pale_growth", name: "Refined Pale Growth Extract", base_value: 50 },
  spore_cluster: { id: "refined_spore_extract", name: "Refined Spore Extract", base_value: 63 },
};

// --- DROP_TABLES (tier 1–3 weighted) ---
export const DROP_TABLES = {
  1: [
    { id: "rusted_gear",       weight: 25 },
    { id: "charred_bolt",      weight: 20 },
    { id: "rat_pelt",          weight: 20 },
    { id: "crawler_carapace",  weight: 15 },
    { id: "pale_film",         weight: 12 },
    { id: null,                weight:  8 },
  ],
  2: [
    { id: "spore_cluster",     weight: 25 },
    { id: "hollow_shard",      weight: 20 },
    { id: "broken_pipe",       weight: 18 },
    { id: "crawler_carapace",  weight: 17 },
    { id: null,                weight: 20 },
  ],
  3: [
    { id: "deep_ash",          weight: 28 },
    { id: "hollow_shard",      weight: 22 },
    { id: "regulator_core",    weight: 12 },
    { id: "leviathan_scale",   weight:  5 },
    { id: "rusted_gear",       weight:  8 },
    { id: null,                weight: 25 },
  ],
};

export function rollCashLoot(enemyTier) {
  const base     = enemyTier * 5;
  const variance = Math.floor(Math.random() * (enemyTier * 5));
  return base + variance;
}

export function rollItemDrop(tier) {
  const table = DROP_TABLES[tier] || DROP_TABLES[1];
  const total = table.reduce((s, e) => s + e.weight, 0);
  let r = Math.floor(Math.random() * total);
  for (const entry of table) {
    if (r < entry.weight) return entry.id;
    r -= entry.weight;
  }
  return null;
}
