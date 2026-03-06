/**
 * Procedural item generation — weapons, armor, loot.
 * Design: item_system.md
 */

import { getItemTier } from "../data/items.js";

// ── Weapon name tables (tier 1–5) ──
const WEAPON_PREFIXES = {
  1: ["Rusted", "Bent", "Cracked", "Gnawed", "Filth-Caked", "Pitted"],
  2: ["Worn", "Ash-Wrapped", "Stained", "Salvaged", "Mended"],
  3: ["Forged", "Tempered", "Dark-Edged", "Channel-Steel", "Deep-Cut"],
  4: ["Ember-Forged", "Rune-Etched", "Vein-Steel", "City-Tempered", "Ash-Core", "Deep-Wrought"],
  5: ["Ashbound", "Breath-Forged", "Sump-Drawn", "Cathedral-Touched", "Rune-Alive", "Heartbeat-Edged"],
};
const WEAPON_SUFFIXES = {
  1: ["Blade", "Knife", "Hatchet", "Spike", "Club", "Shard", "Hook"],
  2: ["Longsword", "Dagger", "Hatchet", "Shortbow", "Spear", "Mace"],
  3: ["Blade", "Sword", "Cleaver", "Crossbow", "Glaive", "Maul"],
  4: ["Blade", "Greatsword", "War-Axe", "Longbow", "Pike", "Warhammer"],
  5: ["Blade", "Executioner", "Reaper", "Soulbow", "Lance", "Crusher"],
};

// ── Armor name tables (tier 1–5) ──
const ARMOR_PREFIXES = {
  1: ["Rotted", "Cracked", "Scavenged", "Rat-Gnawed", "Filthy"],
  2: ["Mended", "Salvaged", "Soot-Stained", "Ash-Dusted"],
  3: ["Channel-Cured", "Deep-Tanned", "Forge-Hardened", "Sewer-Proof"],
  4: ["Rune-Stitched", "Ember-Lined", "Vein-Woven", "City-Hardened"],
  5: ["Ashbound", "Sump-Forged", "Cathedral-Blessed", "Breath-Woven", "Heartbeat-Lined"],
};
const ARMOR_SUFFIXES = {
  1: ["Rags", "Wrap", "Scraps", "Patchwork", "Hide"],
  2: ["Leather", "Jerkin", "Coat", "Vest", "Mail", "Padding"],
  3: ["Armor", "Cuirass", "Hauberk", "Plate", "Brigandine"],
  4: ["Armor", "Plate", "Carapace", "Shell", "Mantle"],
  5: ["Armor", "Aegis", "Shroud", "Shell", "Carapace"],
};

// ── Corrupted name parts ──
const CORRUPTED_PREFIXES = [
  "Sundered", "Hollow", "Ash-Drunk", "Thirsting",
  "Breath-Taken", "Ruin-Touched", "Void-Kissed",
  "City-Claimed", "Sump-Born", "Forgotten",
];
const CORRUPTED_SUFFIXES = [
  "of Hollow Promise", "of the Forgotten",
  "of What Remains", "of the Deep",
  "of False Hope", "of the City's Design",
  "of Unfinished Business", "of the Last Descent",
];

// ── Special properties by tier unlock ──
const WEAPON_SPECIALS = {
  2: ["minor_bleed", "minor_poison"],
  3: ["armor_piercing", "on_hit_slow"],
  4: ["life_steal", "stagger"],
  5: ["resonance", "city_touch"],
};
const ARMOR_SPECIALS = {
  2: ["sewer_resistance"],
  3: ["fire_resistance", "on_hit_thorns"],
  4: ["regeneration", "dampening"],
  5: ["city_sense", "resonance"],
};

// ── Curse tables ──
const MINOR_CURSES = ["Hunger", "Echo", "Chill", "Weight"];
const MAJOR_CURSES = ["Bleed Cost", "City Marked", "Drain", "Attractor", "Binding"];
const RARE_CURSES = ["Memory", "Hunger of the Deep", "The City Watches", "Reciprocal", "Void Price"];

// ── Loot items by tier (sellable) ──
const LOOT_ITEMS = {
  1: ["Rat Pelt", "Tarnished Coin", "Rusted Chain Link", "Gnawed Bone", "Cracked Lens", "Sewer Fungi", "Slime Residue"],
  2: ["Custodian Fragment", "Spore Cluster", "Fungal Bloom", "Drowned Journal", "Wight Essence"],
  3: ["Leviathan Scale", "Cistern Map Fragment", "Resonant Scrap", "Deep Vent Ash", "Flood Record Page"],
  4: ["Ashbound Resonance", "Cathedral Rune Shard"],
};

// ── Stat ranges by tier (weapon dmg, armor armor/hp) ──
const WEAPON_DMG = { 1: [5, 12], 2: [10, 20], 3: [18, 32], 4: [28, 45], 5: [40, 60], 6: [35, 70] };
const ARMOR_ARMOR = { 1: [2, 4], 2: [4, 8], 3: [7, 13], 4: [11, 18], 5: [16, 24], 6: [20, 30] };
const ARMOR_HP = { 1: 0, 2: 5, 3: 10, 4: 15, 5: 25, 6: 20 };

const BASE_VALUES = [0, 10, 25, 60, 130, 280, 400];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randBetween(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateId() {
  return "gen_" + Math.random().toString(36).slice(2, 8);
}

function rollCategory() {
  const r = Math.random();
  if (r < 0.4) return "weapon";
  if (r < 0.8) return "armor";
  return "loot";
}

function generateWeaponName(tier) {
  const t = Math.min(tier, 5);
  const pre = pick(WEAPON_PREFIXES[t] || WEAPON_PREFIXES[1]);
  const suf = pick(WEAPON_SUFFIXES[t] || WEAPON_SUFFIXES[1]);
  return `${pre} ${suf}`;
}

function generateArmorName(tier) {
  const t = Math.min(tier, 5);
  const pre = pick(ARMOR_PREFIXES[t] || ARMOR_PREFIXES[1]);
  const suf = pick(ARMOR_SUFFIXES[t] || ARMOR_SUFFIXES[1]);
  return `${pre} ${suf}`;
}

function generateCorruptedName(category) {
  const pre = pick(CORRUPTED_PREFIXES);
  const suf = pick(CORRUPTED_SUFFIXES);
  if (category === "weapon") return `${pre} Blade ${suf}`;
  return `${pre} Cuirass ${suf}`;
}

function rollWeaponStats(tier) {
  const [min, max] = WEAPON_DMG[tier] || WEAPON_DMG[1];
  return { dmg: randBetween(min, max) };
}

function rollArmorStats(tier) {
  const [min, max] = ARMOR_ARMOR[tier] || ARMOR_ARMOR[1];
  return { armor: randBetween(min, max), hp_bonus: ARMOR_HP[tier] ?? 0 };
}

function rollSpecial(tier, category) {
  const pool = category === "weapon" ? WEAPON_SPECIALS : ARMOR_SPECIALS;
  const unlocked = [];
  for (const [t, specs] of Object.entries(pool)) {
    if (tier >= parseInt(t, 10)) unlocked.push(...specs);
  }
  if (unlocked.length === 0) return null;
  return Math.random() < 0.4 ? pick(unlocked) : null;
}

function rollCurse(tier) {
  const r = Math.random();
  if (r < 0.5) return pick(MINOR_CURSES);
  if (r < 0.85) return pick(MAJOR_CURSES);
  return pick(RARE_CURSES);
}

function calculateValue(tier, corrupted) {
  const base = BASE_VALUES[Math.min(tier, 6)] ?? 400;
  const mult = corrupted ? 1.8 : 1;
  const variance = 0.8 + Math.random() * 0.4;
  return Math.floor(base * mult * variance);
}

/**
 * Generate a procedural item.
 * @param {number} playerLevel — from class_stage or xp
 * @param {string} locationId — current location
 * @param {number} [enemyTier] — enemy tier (optional, influences nothing for now)
 * @returns {Object} — { id, display_name, tier, category, corrupted, curse, curse_identified, special_property, value, stats }
 */
export function generateItem(playerLevel, locationId, enemyTier) {
  const tier = getItemTier(playerLevel, locationId);
  const category = rollCategory();
  const isCorrupted = tier >= 3 && Math.random() < 0.04;

  if (isCorrupted) return generateCorruptedItem(tier, category);

  if (category === "loot") {
    const lootTier = Math.min(Math.max(tier, 1), 4);
    const pool = LOOT_ITEMS[lootTier] || LOOT_ITEMS[1];
    const name = pick(pool);
    const id = generateId();
    const value = calculateValue(lootTier, false);
    return {
      id,
      display_name: name,
      tier: lootTier,
      category: "loot",
      corrupted: false,
      curse: null,
      curse_identified: 0,
      special_property: null,
      value,
      stats: null,
    };
  }

  const name = category === "weapon" ? generateWeaponName(tier) : generateArmorName(tier);
  const stats = category === "weapon" ? rollWeaponStats(tier) : rollArmorStats(tier);
  const special = rollSpecial(tier, category);

  return {
    id: generateId(),
    display_name: name,
    tier,
    category,
    corrupted: false,
    curse: null,
    curse_identified: 0,
    special_property: special,
    value: calculateValue(tier, false),
    stats,
  };
}

/**
 * Generate a corrupted item (one tier above base).
 */
export function generateCorruptedItem(baseTier, category) {
  const tier = Math.min(baseTier + 1, 6);
  const curse = rollCurse(tier);
  const name = generateCorruptedName(category);
  const stats = category === "weapon" ? rollWeaponStats(tier) : rollArmorStats(tier);
  const special = rollSpecial(tier, category);

  return {
    id: generateId(),
    display_name: name,
    tier,
    category,
    corrupted: true,
    curse,
    curse_identified: 0,
    special_property: special,
    value: calculateValue(tier, true),
    stats,
  };
}
