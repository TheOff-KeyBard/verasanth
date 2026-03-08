/**
 * Equipment service — slot validation, equip, unequip.
 * @see verasanth_equipment_system_blueprint.md
 */

import {
  EQUIPMENT_SLOTS,
  EQUIPMENT_DATA,
  EQUIPMENT_STAT_KEYS,
  LEGACY_SLOT_MAP,
  INSTINCT_AFFINITIES,
  createEmptyEquipmentLoadout,
} from "../data/equipment.js";

/** True if item is in EQUIPMENT_DATA. */
export function isEquipmentItem(itemId) {
  return itemId && EQUIPMENT_DATA[itemId] != null;
}

/** Get slot for equipment item. Returns null if not equipment. */
export function getEquipmentSlot(itemId) {
  const def = EQUIPMENT_DATA[itemId];
  return def ? def.slot : null;
}

/** True if slot is a valid equipment slot. */
export function isValidEquipmentSlot(slot) {
  return slot && EQUIPMENT_SLOTS.includes(slot);
}

/** Create empty loadout object. */
export { createEmptyEquipmentLoadout };

/**
 * Check if character can equip item into slot.
 * @param {object} character - Character row (for level/instinct checks)
 * @param {object} item - Item def from EQUIPMENT_DATA or legacy mapping
 * @param {string} slot - Target slot
 * @param {{ db, uid, getFlag }} opts - Optional; required for offhand_locked check
 * @returns {Promise<{ ok: boolean, message?: string }>}
 */
export async function canEquipItem(character, item, slot, opts = {}) {
  if (!slot || !isValidEquipmentSlot(slot)) return { ok: false, message: "Invalid slot." };
  if (!item) return { ok: false, message: "No item." };
  const itemDef = typeof item === "string" ? EQUIPMENT_DATA[item] : item;
  const effectiveSlot = itemDef?.slot ?? (typeof item === "string" ? getEquipmentSlot(item) : null);
  if (!effectiveSlot) return { ok: false, message: "Not equippable." };
  if (effectiveSlot !== slot) return { ok: false, message: `Item belongs in ${effectiveSlot}, not ${slot}.` };
  const levelReq = (itemDef?.level_requirement ?? 1) || 1;
  const charLevel = character?.class_stage ?? character?.xp ?? 0;
  if (charLevel < levelReq) return { ok: false, message: `Requires level ${levelReq}.` };
  const charInstinct = (character?.instinct || "").toLowerCase();
  const reqInstinct = (itemDef?.instinct_required || "").toLowerCase();
  if (reqInstinct && charInstinct !== reqInstinct) {
    return { ok: false, message: `This item can only be wielded by the ${itemDef.instinct_required}.` };
  }
  if (slot === "weapon_offhand" && opts.getFlag && opts.db != null && opts.uid != null) {
    const offhandLocked = await opts.getFlag(opts.db, opts.uid, "offhand_locked", 0);
    if (offhandLocked) return { ok: false, message: "Your offhand is occupied by a two-handed weapon." };
  }
  return { ok: true };
}

/**
 * Map legacy slot (weapon/armor/shield) to new slot.
 */
export function resolveLegacySlot(slot) {
  return LEGACY_SLOT_MAP[slot] || slot;
}

/**
 * Equip item into slot. Replaces existing item in slot.
 * Handles two-handed: unequips offhand and sets offhand_locked when equipping two_handed to weapon_main.
 * @param {object} db - Database handle
 * @param {function} dbRun - dbRun(db, sql, params)
 * @param {function} dbGet - dbGet(db, sql, params)
 * @param {number} uid - User ID
 * @param {string} itemId - Item ID
 * @param {string} slot - Target slot (new slot names)
 * @param {{ getFlag, setFlag }} opts - Optional; required for two-handed offhand_locked
 */
export async function equipItem(db, dbRun, dbGet, uid, itemId, slot, opts = {}) {
  const resolvedSlot = resolveLegacySlot(slot) || slot;
  if (!isValidEquipmentSlot(resolvedSlot)) throw new Error("Invalid slot.");
  const itemDef = EQUIPMENT_DATA[itemId];
  const tags = itemDef?.tags ?? [];
  const isTwoHanded = tags.includes("two_handed");

  if (resolvedSlot === "weapon_main" && isTwoHanded && opts.setFlag) {
    const offhandRow = await dbGet(db, "SELECT item FROM equipment_slots WHERE user_id=? AND slot=?", [uid, "weapon_offhand"]);
    if (offhandRow) {
      await dbRun(db, "UPDATE inventory SET equipped=0 WHERE user_id=? AND item=?", [uid, offhandRow.item]);
      await dbRun(db, "DELETE FROM equipment_slots WHERE user_id=? AND slot=?", [uid, "weapon_offhand"]);
      const invRow = await dbGet(db, "SELECT qty FROM inventory WHERE user_id=? AND item=?", [uid, offhandRow.item]);
      if (invRow) {
        await dbRun(db, "UPDATE inventory SET qty=qty+1 WHERE user_id=? AND item=?", [uid, offhandRow.item]);
      } else {
        await dbRun(db, "INSERT INTO inventory (user_id, item, qty) VALUES (?, ?, 1)", [uid, offhandRow.item]);
      }
    }
    await opts.setFlag(db, uid, "offhand_locked", 1);
  }

  const old = await dbGet(db, "SELECT item FROM equipment_slots WHERE user_id=? AND slot=?", [uid, resolvedSlot]);
  if (old) {
    await dbRun(db, "UPDATE inventory SET equipped=0 WHERE user_id=? AND item=?", [uid, old.item]);
    await dbRun(db, "DELETE FROM equipment_slots WHERE user_id=? AND slot=?", [uid, resolvedSlot]);
  }
  await dbRun(db, "INSERT INTO equipment_slots (user_id, slot, item) VALUES (?, ?, ?)", [uid, resolvedSlot, itemId]);
  await dbRun(db, "UPDATE inventory SET equipped=1 WHERE user_id=? AND item=?", [uid, itemId]);
  return { slot: resolvedSlot, item: itemId };
}

/**
 * Unequip item from slot.
 * Clears offhand_locked when unequipping two_handed from weapon_main.
 * @param {{ getFlag, setFlag }} opts - Optional; required for two-handed offhand_locked
 */
export async function unequipItem(db, dbRun, dbGet, uid, slot, opts = {}) {
  const resolvedSlot = resolveLegacySlot(slot) || slot;
  if (!isValidEquipmentSlot(resolvedSlot)) throw new Error("Invalid slot.");
  const old = await dbGet(db, "SELECT item FROM equipment_slots WHERE user_id=? AND slot=?", [uid, resolvedSlot]);
  if (old) {
    const itemDef = EQUIPMENT_DATA[old.item];
    const tags = itemDef?.tags ?? [];
    if (resolvedSlot === "weapon_main" && tags.includes("two_handed") && opts.setFlag) {
      await opts.setFlag(db, uid, "offhand_locked", 0);
    }
    await dbRun(db, "UPDATE inventory SET equipped=0 WHERE user_id=? AND item=?", [uid, old.item]);
    await dbRun(db, "DELETE FROM equipment_slots WHERE user_id=? AND slot=?", [uid, resolvedSlot]);
  }
  return { slot: resolvedSlot };
}

/**
 * Get equipped items as array of { slot, item }.
 */
export async function getEquippedItems(db, dbAll, uid) {
  const rows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
  return rows.map((r) => ({ slot: r.slot, item: r.item }));
}

/**
 * Get equipped items as map { slot: itemId }.
 */
export async function getEquippedItemMap(db, dbAll, uid) {
  const rows = await getEquippedItems(db, dbAll, uid);
  const map = createEmptyEquipmentLoadout();
  for (const { slot, item } of rows) map[slot] = item;
  return map;
}

// ── Rendering helpers ──────────────────────────────────────────────────────
const SLOT_DISPLAY_NAMES = {
  weapon_main: "Weapon Main",
  weapon_offhand: "Weapon Offhand",
  head: "Head",
  chest: "Chest",
  hands: "Hands",
  legs: "Legs",
  feet: "Feet",
  cloak: "Cloak",
  ring_1: "Ring 1",
  ring_2: "Ring 2",
  charm: "Charm",
  relic: "Relic",
};

export function formatEquipmentSlotName(slot) {
  return SLOT_DISPLAY_NAMES[slot] || slot?.replace(/_/g, " ") || "";
}

export function formatItemStatModifiers(item) {
  const def = typeof item === "string" ? EQUIPMENT_DATA[item] : item;
  if (!def?.stat_modifiers) return [];
  const lines = [];
  for (const k of EQUIPMENT_STAT_KEYS) {
    const v = def.stat_modifiers[k];
    if (v != null && v !== 0) {
      const sign = v > 0 ? "+" : "";
      lines.push(`${k.replace(/_/g, " ")}: ${sign}${v}`);
    }
  }
  return lines;
}

export function formatCorruptionText(item) {
  const def = typeof item === "string" ? EQUIPMENT_DATA[item] : item;
  const c = def?.corruption;
  if (!c) return null;
  return c.passive_text || `Corrupted (${c.corruption_type || "unknown"})`;
}

/**
 * Compute affinity hint for an equipment item vs player instinct.
 * @param {object} item - Item def (from EQUIPMENT_DATA) with tags
 * @param {string} instinct - Player instinct (lowercase)
 * @returns {{ hasBonuses: boolean, hasPenalties: boolean, bonusStats: object, penaltyStats: object, marker: string|null, tooltip: string|null }}
 */
export function getAffinityHint(item, instinct) {
  const affinities = INSTINCT_AFFINITIES[instinct];
  if (!affinities || !item?.tags?.length) return { hasBonuses: false, hasPenalties: false, bonusStats: {}, penaltyStats: {}, marker: null, tooltip: null };

  const bonusStats = {};
  const penaltyStats = {};
  for (const tag of item.tags) {
    if (affinities.tag_bonuses?.[tag]) Object.assign(bonusStats, affinities.tag_bonuses[tag]);
    if (affinities.tag_penalties?.[tag]) Object.assign(penaltyStats, affinities.tag_penalties[tag]);
  }
  const hasBonuses = Object.keys(bonusStats).length > 0;
  const hasPenalties = Object.keys(penaltyStats).length > 0;

  let marker = null;
  if (hasBonuses && hasPenalties) marker = "✦↓";
  else if (hasBonuses) marker = "✦";
  else if (hasPenalties) marker = "↓";

  const parts = [];
  for (const [stat, val] of Object.entries(bonusStats)) {
    if (val > 0) parts.push(`+${val} ${stat.replace(/_/g, " ")}`);
  }
  for (const [stat, val] of Object.entries(penaltyStats)) {
    if (val < 0) parts.push(`${val} ${stat.replace(/_/g, " ")}`);
  }
  const instinctName = (instinct || "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  const tooltip = parts.length ? `${instinctName}: ${parts.join(", ")}` : null;

  return { hasBonuses, hasPenalties, bonusStats, penaltyStats, marker, tooltip };
}
