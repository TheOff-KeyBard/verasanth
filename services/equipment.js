/**
 * Equipment service — slot validation, equip, unequip.
 * @see verasanth_equipment_system_blueprint.md
 */

import {
  EQUIPMENT_SLOTS,
  EQUIPMENT_DATA,
  EQUIPMENT_STAT_KEYS,
  LEGACY_SLOT_MAP,
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
 * @param {object} character - Character row (for future level/stat checks)
 * @param {object} item - Item def from EQUIPMENT_DATA or legacy mapping
 * @param {string} slot - Target slot
 * @returns {{ ok: boolean, message?: string }}
 */
export function canEquipItem(character, item, slot) {
  if (!slot || !isValidEquipmentSlot(slot)) return { ok: false, message: "Invalid slot." };
  if (!item) return { ok: false, message: "No item." };
  const itemDef = typeof item === "string" ? EQUIPMENT_DATA[item] : item;
  const effectiveSlot = itemDef?.slot ?? (typeof item === "string" ? getEquipmentSlot(item) : null);
  if (!effectiveSlot) return { ok: false, message: "Not equippable." };
  if (effectiveSlot !== slot) return { ok: false, message: `Item belongs in ${effectiveSlot}, not ${slot}.` };
  const levelReq = (itemDef?.level_requirement ?? 1) || 1;
  const charLevel = character?.class_stage ?? character?.xp ?? 0;
  if (charLevel < levelReq) return { ok: false, message: `Requires level ${levelReq}.` };
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
 * @param {object} db - Database handle
 * @param {function} dbRun - dbRun(db, sql, params)
 * @param {function} dbGet - dbGet(db, sql, params)
 * @param {number} uid - User ID
 * @param {string} itemId - Item ID
 * @param {string} slot - Target slot (new slot names)
 */
export async function equipItem(db, dbRun, dbGet, uid, itemId, slot) {
  const resolvedSlot = resolveLegacySlot(slot) || slot;
  if (!isValidEquipmentSlot(resolvedSlot)) throw new Error("Invalid slot.");
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
 */
export async function unequipItem(db, dbRun, dbGet, uid, slot) {
  const resolvedSlot = resolveLegacySlot(slot) || slot;
  if (!isValidEquipmentSlot(resolvedSlot)) throw new Error("Invalid slot.");
  const old = await dbGet(db, "SELECT item FROM equipment_slots WHERE user_id=? AND slot=?", [uid, resolvedSlot]);
  if (old) {
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
