/**
 * Equipment stat aggregation.
 * @see verasanth_equipment_system_blueprint.md
 */

import { EQUIPMENT_STAT_KEYS, EQUIPMENT_DATA, INSTINCT_AFFINITIES } from "../data/equipment.js";
import { RACES } from "../data/races.js";

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
 * @param {object} equippedItemMap - Slot -> itemId map (from getEquippedItemMap)
 * @returns {object} Aggregated stats plus dual_wield, has_focus_offhand flags
 */
export function aggregateEquipmentStats(equippedItemMap) {
  const aggregated = {};
  for (const k of EQUIPMENT_STAT_KEYS) aggregated[k] = 0;
  const itemIds = Object.values(equippedItemMap || {}).filter(Boolean);
  for (const itemId of itemIds) {
    const stats = getItemEffectiveStats(itemId);
    for (const [k, v] of Object.entries(stats)) {
      if (EQUIPMENT_STAT_KEYS.includes(k) && typeof v === "number") aggregated[k] = (aggregated[k] ?? 0) + v;
    }
  }

  const mainWeaponId = equippedItemMap?.weapon_main;
  const offhandWeaponId = equippedItemMap?.weapon_offhand;
  const mainWeapon = mainWeaponId ? EQUIPMENT_DATA[mainWeaponId] : null;
  const offhandWeapon = offhandWeaponId ? EQUIPMENT_DATA[offhandWeaponId] : null;

  const isDualWield = mainWeapon?.tags?.includes("light_blade") && offhandWeapon?.tags?.includes("light_blade");
  if (isDualWield) {
    aggregated.dual_wield = true;
    const offhandPower = offhandWeapon?.stat_modifiers?.melee_power || 0;
    aggregated.melee_power = (aggregated.melee_power || 0) + Math.floor(offhandPower / 2);
  }

  if (offhandWeapon?.sub_type === "focus") {
    aggregated.has_focus_offhand = true;
  }

  return aggregated;
}

/**
 * Apply instinct affinities (tag bonuses/penalties) on top of aggregated stats.
 * Instincts without an INSTINCT_AFFINITIES row pass through unchanged (Phase 2: add rows as roster grows).
 */
export function applyInstinctAffinities(aggregatedStats, equippedItemMap, instinct) {
  const affinities = INSTINCT_AFFINITIES[instinct];
  if (!affinities) return aggregatedStats;

  const result = { ...aggregatedStats };

  for (const itemId of Object.values(equippedItemMap || {}).filter(Boolean)) {
    const item = typeof itemId === "string" ? EQUIPMENT_DATA[itemId] : itemId;
    if (!item?.tags?.length) continue;
    for (const tag of item.tags) {
      if (affinities.tag_bonuses?.[tag]) {
        for (const [stat, value] of Object.entries(affinities.tag_bonuses[tag])) {
          result[stat] = (result[stat] ?? 0) + value;
        }
      }
      if (affinities.tag_penalties?.[tag]) {
        for (const [stat, value] of Object.entries(affinities.tag_penalties[tag])) {
          result[stat] = (result[stat] ?? 0) + value;
        }
      }
    }
  }

  return result;
}

/**
 * Apply racial stat_mods as small flat bonuses to overlapping equipment stat keys.
 */
export function applyRaceAffinities(aggregatedStats, instinct, race) {
  const raceDef = RACES[race];
  if (!raceDef) return aggregatedStats;
  const result = { ...aggregatedStats };
  const statMap = {
    strength: { melee_power: 1 },
    dexterity: { dodge: 1, initiative: 1 },
    intelligence: { spell_power: 1 },
    wisdom: { healing_power: 1 },
    constitution: { max_hp: 2 },
  };
  for (const [raceStat, val] of Object.entries(raceDef.stat_mods || {})) {
    const mapping = statMap[raceStat];
    if (!mapping || val <= 0) continue;
    for (const [equipStat, multiplier] of Object.entries(mapping)) {
      result[equipStat] = (result[equipStat] ?? 0) + val * multiplier;
    }
  }
  return result;
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
