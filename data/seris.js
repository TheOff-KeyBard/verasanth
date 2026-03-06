/**
 * Seris Vantrel — item recognition and sell values.
 * Design: item_system.md
 */

export const SERIS_INTEREST_ITEMS = {
  custodian_fragment: { dialogue: "mild", arcAdvance: false },
  resonant_scrap: { dialogue: "strong", arcAdvance: true },
  drowned_relic: { dialogue: "strong", arcAdvance: true },
  drowned_journal: { dialogue: "strong", arcAdvance: true },
  ashbound_resonance: { dialogue: "break", arcAdvance: true, arcStage: 1 },
  cathedral_rune_shard: { dialogue: "invested", arcAdvance: false },
};

const NO_SELL = new Set(["Ashbound Resonance", "Heartbeat Stone", "Old Channel Key", "Regulator Core", "Runic Tablet", "Custodian Memory"]);

/** Display name -> sell value (AM). Procedural weapons/armor use tier-based default. */
export const SELL_VALUES = {
  "Rat Pelt": 2, "Tarnished Coin": 5, "Rusted Chain Link": 3,
  "Gnawed Bone": 1, "Cracked Lens": 8, "Sewer Fungi": 15, "Slime Residue": 10,
  "Custodian Fragment": 40, "Spore Cluster": 25, "Fungal Bloom": 30,
  "Drowned Journal": 50, "Drowned Relic": 50, "Wight Essence": 35,
  "Leviathan Scale": 120, "Cistern Map Fragment": 60, "Resonant Scrap": 200,
  "Deep Vent Ash": 80, "Flood Record Page": 45,
  "Cathedral Rune Shard": 300,
};

const TIER_BASE_VALUES = [0, 10, 25, 60, 130, 280, 400];

/** Get sell value for an item. Returns 0 if not sellable. */
export function getSellValue(displayName, tier, category) {
  if (NO_SELL.has(displayName)) return 0;
  if (SELL_VALUES[displayName] != null) return SELL_VALUES[displayName];
  const base = TIER_BASE_VALUES[Math.min(tier || 1, 6)] ?? 10;
  return Math.floor(base * (0.8 + Math.random() * 0.4));
}

/** Normalize display name to SERIS_INTEREST_ITEMS key. */
export function displayNameToKey(name) {
  if (!name || typeof name !== "string") return null;
  return name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
}
