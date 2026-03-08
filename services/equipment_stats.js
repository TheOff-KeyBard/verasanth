/**
 * Equipment stat aggregation.
 * @see verasanth_equipment_system_blueprint.md
 */

import { EQUIPMENT_STAT_KEYS, EQUIPMENT_DATA } from "../data/equipment.js";

/**
 * Merge base stats with bonus stats (additive).
 */
export function mergeStatModifiers(baseStats, bonusStats) {
  const out = { ...baseStats };
  for (const k of Object.keys(bonusStats || {})) {
    if (EQUIPMENT_STAT_KEYS.includes(k)) out[k] = (out[k] ?? 0) + (bonusStats[k] ?? 0);
  }
  return out;
}

/**
 * Get effective stats for a single item (base + corruption if present).
 */
export function getItemEffectiveStats(item) {
  const def = typeof item === "string" ? EQUIPMENT_DATA[item] : item;
  if (!def?.stat_modifiers) return {};
  let stats = { ...def.stat_modifiers };
  if (def.corruption) {
    const c = def.corruption;
    if (c.positive_effects) stats = mergeStatModifiers(stats, c.positive_effects);
    if (c.negative_effects) {
      for (const [k, v] of Object.entries(c.negative_effects)) {
        stats[k] = (stats[k] ?? 0) + (v ?? 0);
      }
    }
  }
  return stats;
}

/**
 * Aggregate stats from all equipped items.
 */
export function aggregateEquipmentStats(equippedItems) {
  const aggregated = {};
  for (const k of EQUIPMENT_STAT_KEYS) aggregated[k] = 0;
  for (const item of equippedItems || []) {
    const stats = getItemEffectiveStats(item);
    for (const [k, v] of Object.entries(stats)) {
      if (EQUIPMENT_STAT_KEYS.includes(k) && typeof v === "number") aggregated[k] = (aggregated[k] ?? 0) + v;
    }
  }
  return aggregated;
}

/**
 * Apply corruption modifiers to base stats (for merge into aggregated).
 */
export function applyCorruptionModifiers(baseStats, corruption) {
  if (!corruption) return baseStats;
  let out = { ...baseStats };
  if (corruption.positive_effects) out = mergeStatModifiers(out, corruption.positive_effects);
  if (corruption.negative_effects) {
    for (const [k, v] of Object.entries(corruption.negative_effects)) {
      out[k] = (out[k] ?? 0) + (v ?? 0);
    }
  }
  return out;
}
