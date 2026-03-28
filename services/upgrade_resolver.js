/**
 * Resolve Level 5 upgrade abilities.
 * @see verasanth_level5_upgrades_spec.md
 */

import { statMod, rollDie } from "./combat.js";
import { LEVEL_5_UPGRADES } from "../data/upgrades.js";
import { EQUIPMENT_DATA } from "../data/equipment.js";

/**
 * Resolve an active upgrade ability. Returns shape compatible with combat flow.
 * @param {object} upgrade - LEVEL_5_UPGRADES entry
 * @param {object} character - Row with stats, instinct
 * @param {object} state - combat_state
 * @param {object} enemy - Enemy definition
 * @param {object} equippedItemMap - Slot -> itemId (for shield_bash)
 */
export function resolveUpgradeAbility(upgrade, character, state, enemy, equippedItemMap = {}) {
  const stats = {
    strength: character.strength ?? 10,
    dexterity: character.dexterity ?? 10,
    constitution: character.constitution ?? 10,
    intelligence: character.intelligence ?? 10,
    wisdom: character.wisdom ?? 10,
    charisma: character.charisma ?? 10,
  };
  const enemyName = enemy?.name ?? "the enemy";
  const playerHpMax = state.player_hp_max ?? 20;
  const enemyHp = state.enemy_hp ?? 0;
  const enemyHpMax = state.enemy_hp_max ?? 1;
  const enemyHpPercent = enemyHpMax > 0 ? enemyHp / enemyHpMax : 0;

  let dmg = 0;
  let heal = 0;
  let status_on_enemy = null;
  let status_duration = 1;
  let status_on_player = null;
  let status_duration_player = 1;
  let status_value = null;  // for shield, etc.
  let skip_retaliation = false;
  let narrative = upgrade.combat_log_player || "";

  // Handle hp_cost_immediate (dark_bargain)
  if (upgrade.hp_cost_immediate) {
    const cost = Math.max(1, Math.floor(playerHpMax * upgrade.hp_cost_immediate));
    state.player_hp = Math.max(0, (state.player_hp ?? playerHpMax) - cost);
    narrative += ` *${(upgrade.combat_log_cost || "").replace("{value}", cost)}*`;
  }

  switch (upgrade.id) {
    case "fire_lash": {
      const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
      dmg = Math.max(1, Math.floor(base * (upgrade.damage_multiplier ?? 1)));
      const marked = (state.enemy_statuses?.marked ?? 0) > 0;
      if (marked) dmg = Math.floor(dmg * 1.3);
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_enemy = applied.effect;
        status_duration = applied.duration ?? 1;
      }
      narrative = upgrade.combat_log_enemy.replace("{enemy}", enemyName);
      break;
    }
    case "ash_veil": {
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_player = applied.effect;
        status_duration_player = applied.duration ?? 1;
        state.damage_resist_value = 0.4;
      }
      narrative = upgrade.combat_log_player;
      break;
    }
    case "ember_mark": {
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_enemy = applied.effect;
        status_duration = applied.duration ?? 1;
      }
      narrative = upgrade.combat_log_enemy.replace("{enemy}", enemyName);
      break;
    }
    case "radiant_pulse": {
      const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
      dmg = Math.max(1, Math.floor(base * (upgrade.damage_multiplier ?? 1)));
      if (enemyHpPercent <= (upgrade.lifesteal_threshold ?? 0.5)) {
        heal = Math.max(1, Math.floor(dmg * (upgrade.lifesteal_percent ?? 0.3)));
      }
      narrative = upgrade.combat_log_enemy.replace("{enemy}", enemyName);
      if (heal > 0) narrative += ` *${(upgrade.combat_log_heal || "").replace("{value}", heal)}*`;
      break;
    }
    case "sanctuary_ward": {
      status_value = Math.max(1, Math.floor(playerHpMax * (upgrade.shield_percent_max_hp ?? 0.25)));
      status_on_player = "shield";
      status_duration_player = upgrade.shield_duration ?? 3;
      narrative = upgrade.combat_log_player;
      break;
    }
    case "crushing_blow": {
      const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
      dmg = Math.max(1, Math.floor(base * (upgrade.damage_multiplier ?? 1)));
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_enemy = applied.effect;
        status_duration = applied.duration ?? 1;
      }
      narrative = upgrade.combat_log_enemy.replace("{enemy}", enemyName);
      break;
    }
    case "blood_surge": {
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_player = applied.effect;
        status_duration_player = applied.duration ?? 2;
      }
      narrative = upgrade.combat_log_player;
      break;
    }
    case "backstab": {
      const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
      const hasNeg = (state.enemy_statuses?.blind ?? 0) > 0 || (state.enemy_statuses?.stun ?? 0) > 0 || (state.enemy_statuses?.stagger ?? 0) > 0 || (state.enemy_statuses?.staggered ?? 0) > 0 || (state.enemy_statuses?.weakened ?? 0) > 0;
      const mult = hasNeg ? (upgrade.damage_multiplier_flanking ?? 2) : (upgrade.damage_multiplier ?? 1.5);
      dmg = Math.max(1, Math.floor(base * mult));
      narrative = hasNeg ? upgrade.combat_log_flanking : upgrade.combat_log_player;
      break;
    }
    case "smoke_step": {
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_player = applied.effect;
        status_duration_player = applied.duration ?? 1;
      }
      skip_retaliation = true;
      narrative = upgrade.combat_log_player;
      break;
    }
    case "dirty_trick": {
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_enemy = applied.effect;
        status_duration = applied.duration ?? 1;
      }
      narrative = upgrade.combat_log_enemy.replace("{enemy}", enemyName);
      break;
    }
    case "void_bolt": {
      const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
      dmg = Math.max(1, Math.floor(base * (upgrade.damage_multiplier ?? 1)));
      heal = Math.max(1, Math.floor(dmg * (upgrade.lifesteal_percent ?? 0.25)));
      narrative = upgrade.combat_log_player;
      if (heal > 0) narrative += ` *${(upgrade.combat_log_heal || "").replace("{value}", heal)}*`;
      break;
    }
    case "curse_of_weakness": {
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_enemy = applied.effect;
        status_duration = applied.duration ?? 1;
      }
      narrative = upgrade.combat_log_enemy.replace("{enemy}", enemyName);
      break;
    }
    case "dark_bargain": {
      const applied = upgrade.applies_status?.[0];
      if (applied) {
        status_on_player = applied.effect;
        status_duration_player = applied.duration ?? 2;
      }
      narrative = upgrade.combat_log_player;
      break;
    }
    case "shield_bash": {
      const offhandId = equippedItemMap?.weapon_offhand;
      const offhandDef = offhandId ? EQUIPMENT_DATA[offhandId] : null;
      const hasShield = offhandDef && (upgrade.requires_offhand || ["shield", "buckler"]).includes(offhandDef.sub_type);
      const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
      dmg = Math.max(1, Math.floor(base * (upgrade.damage_multiplier ?? 0.8)));
      if (hasShield && upgrade.applies_status?.[0]) {
        status_on_enemy = upgrade.applies_status[0].effect;
        status_duration = upgrade.applies_status[0].duration ?? 1;
        narrative = upgrade.combat_log_stun.replace("{enemy}", enemyName);
      } else {
        narrative = upgrade.combat_log_no_shield.replace("{enemy}", enemyName);
      }
      break;
    }
    case "intercept": {
      // Solo variant: 25% damage reduction for 2 turns (stored for combat reducer)
      status_on_player = "damage_resist";
      status_duration_player = upgrade.solo_variant_effect?.duration ?? 2;
      state.damage_resist_value = 0.25;  // intercept uses 25%, ash_veil uses 40%
      narrative = upgrade.combat_log_solo || upgrade.combat_log_player;
      break;
    }
    default: {
      // Phase 1+ instincts: structurally complete upgrades keyed in upgrades.js without a
      // dedicated case above. Conservative templates only — no new combat engine features.
      if (upgrade.type === "passive") {
        narrative = upgrade.combat_log_passive || upgrade.combat_log_player || "";
        break;
      }
      if (upgrade.target === "self" && upgrade.heal_percent_max_hp != null) {
        heal = Math.max(1, Math.floor(playerHpMax * upgrade.heal_percent_max_hp));
        narrative = upgrade.combat_log_player || "";
        if (upgrade.combat_log_heal) {
          narrative += ` *${upgrade.combat_log_heal.replace("{value}", heal)}*`;
        }
        break;
      }
      if (upgrade.target === "self" && upgrade.shield_percent_max_hp != null) {
        status_value = Math.max(1, Math.floor(playerHpMax * (upgrade.shield_percent_max_hp ?? 0.25)));
        status_on_player = "shield";
        status_duration_player = upgrade.shield_duration ?? 3;
        narrative = upgrade.combat_log_player;
        break;
      }
      if (upgrade.target === "self" && upgrade.solo_variant_effect) {
        status_on_player = "damage_resist";
        status_duration_player = upgrade.solo_variant_effect?.duration ?? 2;
        state.damage_resist_value = Math.abs(upgrade.solo_variant_effect?.value ?? -0.25);
        narrative = upgrade.combat_log_solo || upgrade.combat_log_player;
        break;
      }
      if (
        upgrade.target === "self" &&
        upgrade.applies_status?.[0]?.effect === "damage_resist"
      ) {
        const applied = upgrade.applies_status[0];
        status_on_player = applied.effect;
        status_duration_player = applied.duration ?? 2;
        state.damage_resist_value = upgrade.damage_resist_value ?? 0.3;
        narrative = upgrade.combat_log_player;
        break;
      }
      if (upgrade.target === "self" && upgrade.applies_status?.[0]) {
        const applied = upgrade.applies_status[0];
        status_on_player = applied.effect;
        status_duration_player = applied.duration ?? 1;
        if (applied.effect === "untargetable") skip_retaliation = true;
        narrative = upgrade.combat_log_player;
        break;
      }
      if (
        upgrade.target === "enemy" &&
        upgrade.stat_scaling &&
        upgrade.damage_multiplier != null &&
        upgrade.lifesteal_percent != null &&
        upgrade.lifesteal_threshold != null
      ) {
        const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
        dmg = Math.max(1, Math.floor(base * (upgrade.damage_multiplier ?? 1)));
        if (enemyHpPercent <= (upgrade.lifesteal_threshold ?? 0.5)) {
          heal = Math.max(1, Math.floor(dmg * (upgrade.lifesteal_percent ?? 0.3)));
        }
        narrative = (upgrade.combat_log_enemy || "").replace("{enemy}", enemyName);
        if (heal > 0 && upgrade.combat_log_heal) {
          narrative += ` *${upgrade.combat_log_heal.replace("{value}", heal)}*`;
        }
        break;
      }
      if (
        upgrade.target === "enemy" &&
        upgrade.stat_scaling &&
        upgrade.damage_multiplier != null &&
        upgrade.lifesteal_percent != null &&
        upgrade.lifesteal_threshold == null
      ) {
        const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
        dmg = Math.max(1, Math.floor(base * (upgrade.damage_multiplier ?? 1)));
        heal = Math.max(1, Math.floor(dmg * (upgrade.lifesteal_percent ?? 0.25)));
        narrative = (upgrade.combat_log_enemy || upgrade.combat_log_player || "").replace(
          "{enemy}",
          enemyName,
        );
        const applied = upgrade.applies_status?.[0];
        if (applied) {
          status_on_enemy = applied.effect;
          status_duration = applied.duration ?? 1;
        }
        if (upgrade.combat_log_heal) {
          narrative += ` *${upgrade.combat_log_heal.replace("{value}", heal)}*`;
        }
        break;
      }
      if (upgrade.target === "enemy" && upgrade.stat_scaling && upgrade.damage_multiplier != null) {
        const base = Math.max(0, statMod(stats[upgrade.stat_scaling] ?? 10));
        dmg = Math.max(1, Math.floor(base * (upgrade.damage_multiplier ?? 1)));
        const applied = upgrade.applies_status?.[0];
        if (applied) {
          status_on_enemy = applied.effect;
          status_duration = applied.duration ?? 1;
        }
        narrative = upgrade.combat_log_enemy
          ? upgrade.combat_log_enemy.replace("{enemy}", enemyName)
          : upgrade.combat_log_player || "";
        break;
      }
      if (upgrade.target === "enemy" && upgrade.applies_status?.[0] && !upgrade.stat_scaling) {
        const applied = upgrade.applies_status[0];
        status_on_enemy = applied.effect;
        status_duration = applied.duration ?? 1;
        narrative = (upgrade.combat_log_enemy || "").replace("{enemy}", enemyName);
        break;
      }
      narrative = upgrade.combat_log_player || "You use your ability.";
    }
  }

  const result = {
    dmg: dmg || undefined,
    heal: heal || undefined,
    status_on_enemy: status_on_enemy || undefined,
    status_duration: status_duration,
    status_on_player: status_on_player || undefined,
    status_duration_player: status_duration_player,
    status_value: status_value ?? undefined,
    skip_retaliation,
    narrative,
    ability: true,
  };
  return result;
}
