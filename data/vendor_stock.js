/**
 * Static vendor stock — Caelir (weapons), Veyra (armor), Thalara (consumables).
 * Seris sells nothing; she buys relics/reagents at 1.5×.
 */

// Caelir: Tier 1–2 weapons (rusted/worn tier)
export const CAELIR_STOCK = [
  { id: "vendor_rusted_blade", display_name: "Rusted Blade", price: 15, tier: 1, category: "weapon", stats: { dmg: 6 } },
  { id: "vendor_bent_knife", display_name: "Bent Knife", price: 12, tier: 1, category: "weapon", stats: { dmg: 5 } },
  { id: "vendor_gnawed_hatchet", display_name: "Gnawed Hatchet", price: 18, tier: 1, category: "weapon", stats: { dmg: 8 } },
  { id: "vendor_worn_longsword", display_name: "Worn Longsword", price: 35, tier: 2, category: "weapon", stats: { dmg: 14 } },
  { id: "vendor_mended_dagger", display_name: "Mended Dagger", price: 28, tier: 2, category: "weapon", stats: { dmg: 11 } },
  { id: "vendor_ash_wrapped_spear", display_name: "Ash-Wrapped Spear", price: 42, tier: 2, category: "weapon", stats: { dmg: 16 } },
  { id: "vendor_salvaged_mace", display_name: "Salvaged Mace", price: 38, tier: 2, category: "weapon", stats: { dmg: 15 } },
];

// Veyra: Tier 1–2 armor and shields
export const VEYRA_STOCK = [
  { id: "vendor_rotted_rags", display_name: "Rotted Rags", price: 8, tier: 1, category: "armor", stats: { armor: 2, hp_bonus: 0 } },
  { id: "vendor_cracked_wrap", display_name: "Cracked Wrap", price: 10, tier: 1, category: "armor", stats: { armor: 3, hp_bonus: 0 } },
  { id: "vendor_scavenged_hide", display_name: "Scavenged Hide", price: 14, tier: 1, category: "armor", stats: { armor: 3, hp_bonus: 0 } },
  { id: "vendor_mended_leather", display_name: "Mended Leather", price: 32, tier: 2, category: "armor", stats: { armor: 6, hp_bonus: 5 } },
  { id: "vendor_soot_stained_jerkin", display_name: "Soot-Stained Jerkin", price: 38, tier: 2, category: "armor", stats: { armor: 7, hp_bonus: 5 } },
  { id: "vendor_ash_dusted_mail", display_name: "Ash-Dusted Mail", price: 45, tier: 2, category: "armor", stats: { armor: 8, hp_bonus: 5 } },
  { id: "vendor_cracked_shield", display_name: "Cracked Shield", price: 22, tier: 1, category: "armor", stats: { armor: 4, hp_bonus: 0 } },
  { id: "vendor_mended_shield", display_name: "Mended Shield", price: 40, tier: 2, category: "armor", stats: { armor: 6, hp_bonus: 5 } },
];

// Thalara: Consumables
export const THALARA_STOCK = [
  { id: "vendor_murky_draught", display_name: "Murky Draught", price: 15, tier: 1, category: "consumable" },
  { id: "vendor_sewer_tincture", display_name: "Sewer Tincture", price: 30, tier: 1, category: "consumable" },
  { id: "vendor_rat_moss_poultice", display_name: "Rat Moss Poultice", price: 10, tier: 1, category: "consumable" },
  { id: "vendor_bitter_fungal_cap", display_name: "Bitter Fungal Cap", price: 10, tier: 1, category: "consumable" },
];

export const VENDOR_STOCK = {
  weaponsmith: CAELIR_STOCK,
  armorsmith: VEYRA_STOCK,
  herbalist: THALARA_STOCK,
  curator: [], // Seris sells nothing; buy-only from player
};

export const VENDOR_NPCS = {
  weaponsmith: { buy: true, sell: true },
  armorsmith: { buy: true, sell: true },
  herbalist: { buy: true, sell: true },
  curator: { buy: false, sell: true },
};
