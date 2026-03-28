/**
 * Starter gear by instinct id (see data/instincts.js). One row per catalog instinct; grant is key-driven.
 * Phase 2 (TODO): add a loadout object per new INSTINCTS key; keep validateStarterLoadoutsAgainstCatalog green.
 */

import { EQUIPMENT_DATA } from "./equipment.js";

export const STARTER_LOADOUTS = {
  // Ember
  ember_touched: { weapon_main: "sewer_wand", chest: "mold_stained_vest", relic: "ash_script_token" },
  pale_marked: {
    weapon_main: "sewer_wand",
    cloak: "ash_bitten_cloak",
    charm: "salt_thread_token",
    relic: "pale_wax_disk",
  },

  // Hearth
  hearthborn: { weapon_offhand: "bone_focus", chest: "patchwork_jerkin", charm: "sewer_saint_knot" },
  lifebinder: { weapon_offhand: "bone_focus", chest: "mold_stained_vest", charm: "pulse_knot_charm" },

  // Street
  streetcraft: { weapon_main: "hooked_knife", chest: "sewer_leathers", feet: "footwraps" },
  quickstep: {
    weapon_main: "pipe_shiv",
    chest: "sewer_leathers",
    feet: "slickstep_boots",
    charm: "stride_bead_charm",
  },

  // Iron
  ironblood: { weapon_main: "worn_mace", chest: "riveted_coat", weapon_offhand: "scrap_shield" },
  war_forged: {
    weapon_main: "drain_spear",
    chest: "patchwork_jerkin",
    ring_1: "drill_line_ring",
    ring_2: "iron_band",
  },

  // Shadow
  shadowbound: { weapon_main: "hooked_knife", cloak: "ash_bitten_cloak", relic: "whisper_stone_fragment" },
  grave_whisper: { weapon_main: "sewer_wand", cloak: "drip_cloak", relic: "hollow_coin_relic" },

  // Warden
  warden: { weapon_main: "rusted_blade", chest: "riveted_coat", weapon_offhand: "cracked_buckler" },
  sentinel: { weapon_main: "rusted_blade", chest: "patchwork_jerkin", charm: "post_token_charm" },
};

/**
 * Validates every loadout entry against EQUIPMENT_DATA (id exists, slot matches).
 * @returns {string[]} Human-readable errors; empty array means OK.
 */
export function validateStarterLoadoutsAgainstCatalog() {
  const errors = [];
  for (const [instinct, loadout] of Object.entries(STARTER_LOADOUTS)) {
    if (!loadout || typeof loadout !== "object") {
      errors.push(`${instinct}: loadout must be an object`);
      continue;
    }
    for (const [slot, itemId] of Object.entries(loadout)) {
      const def = EQUIPMENT_DATA[itemId];
      if (!def) errors.push(`${instinct}.${slot}: unknown item "${itemId}"`);
      else if (def.slot !== slot) errors.push(`${instinct}.${slot}: item "${itemId}" is slot ${def.slot}, not ${slot}`);
    }
  }
  return errors;
}
