import { COMBAT_DATA, LOCATION_TO_FLOOR } from "../data/combat.js";
import { EQUIPMENT_DATA } from "../data/equipment.js";

export function statMod(v) { return Math.floor((v - 10) / 2); }

export function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }

/** Weapon damage die sides from main-hand equipment (EQUIPMENT_DATA), or null if unknown. */
export function weaponDieSidesFromEquippedWeapon(equippedItemMap) {
  const id = equippedItemMap?.weapon_main;
  if (!id || !EQUIPMENT_DATA[id]) return null;
  const def = EQUIPMENT_DATA[id];
  const st = def.sub_type || "";
  if (st === "wand" || st === "dagger") return 6;
  if (def.tags?.includes("light_blade")) return 6;
  if (st === "staff" || st === "two_handed" || def.tags?.includes("two_handed")) return 10;
  if (st === "sword" || st === "mace" || st === "spear") return 8;
  return 6;
}

export function maxPlayerHp(con, classStage = 0) { return 10 + statMod(con) * 3 + (classStage ?? 0) * 4; }

/**
 * Pick a random enemy for the given location. Uses floor-based pools and 8% boss chance.
 * If activeCondition has enemy_spawn_bonus and floor matches, extends pool with bonus enemies.
 */
export function randomEnemy(location, activeCondition = null) {
  const cd = COMBAT_DATA;
  const floor = LOCATION_TO_FLOOR[location] ?? 1;
  let pool = [...(cd.sewer_floor_pools[floor] ?? cd.sewer_floor_pools[1])];

  if (activeCondition?.effects?.enemy_spawn_bonus && activeCondition.floors?.includes(floor)) {
    for (const [enemyId, count] of Object.entries(activeCondition.effects.enemy_spawn_bonus)) {
      if (cd.enemies[enemyId]) {
        for (let i = 0; i < (count || 1); i++) pool.push(enemyId);
      }
    }
  }

  const bosses = cd.sewer_floor_bosses;
  const bossChance = cd.BOSS_CHANCE ?? 0.08;

  let id;
  if (Math.random() < bossChance && bosses[floor]) {
    id = bosses[floor];
  } else {
    id = pool[Math.floor(Math.random() * pool.length)];
  }
  return { ...cd.enemies[id], id };
}

// ── Status effects (instinct system) ─────────────────────────────
// Stored in combat_state as { status_name: turns_remaining }
// All statuses expire by decrementing each round in tickStatuses()
export const STATUS_DEFS = {
  burning: {
    label: "Burning",
    passive_dmg_bonus: 1,
  },
  staggered: {
    label: "Staggered",
    skip_retaliation: true,
  },
  resolve: {
    label: "Resolve",
    damage_reduction: 0.25,
  },
  stealth: {
    label: "Stealth",
    bonus_dmg_multiplier: 2.0,
    consumed_on_hit: true,
  },
  taunt: {
    label: "Taunt",
    disadvantage: true,
  },
  iron_stance: {
    label: "Iron Stance",
    flat_damage_reduction: 1,
  },
  slip_dodge: {
    label: "Slip",
    disadvantage: true,
  },
};

// Instinct definitions — primary abilities and passives (keys must match data/instincts.js).
// Phase 2 (TODO): add INSTINCT_DEFS entries for new ids; missing key + ability press → normal-attack fallback in resolvePlayerAction.
export const INSTINCT_DEFS = {
  ember_touched: {
    role: "burst / burn mark",
    primary: {
      name: "Kindle",
      cadence: 3,
      narrative: (dmg) => `**Kindle** — Arcane fire tears through them. ${dmg} damage. They are *Burning*.`,
      effect: (stats, enemy) => {
        const dmg = rollDie(8) + 2 + Math.max(0, statMod(stats.intelligence ?? stats.wisdom ?? 10));
        return { dmg, status_on_enemy: "burning", status_duration_enemy: 3 };
      },
    },
    passive: { name: "Smolder", desc: "Burning enemies take +1 damage from your weapon strikes." },
  },
  hearthborn: {
    role: "sustain / support",
    primary: {
      name: "Kindle the Hearth",
      cadence: 2,
      narrative: (heal) => `**Kindle the Hearth** — Something warm moves through you. Recover ${heal} HP. *Resolve* settles on you.`,
      effect: (stats, enemy, state) => {
        const base = rollDie(6) + statMod(stats.constitution ?? 10);
        const bonus = state.hearth_healed ? 0 : Math.floor(base * 0.2);
        const heal = base + bonus;
        return { heal, status_on_player: "resolve", status_duration: 2, set_flag: "hearth_healed" };
      },
    },
    passive: { name: "Warmth", desc: "First heal each combat is 20% stronger." },
  },
  streetcraft: {
    role: "opportunist / control",
    primary: {
      name: "Opportunist Strike",
      cadence: 2,
      narrative: (dmg, wounded, tag) =>
        `**Opportunist Strike** — ${wounded ? "You find the gap in their weakness. " : "You slip inside their guard. "}${
          tag === "crit" ? "*The blade bites deep.* " : ""
        }${dmg} damage.`,
      effect: (stats, enemy, state) => {
        const strMod = statMod(stats.strength);
        const dex = statMod(stats.dexterity);
        const wounded = enemy && state.enemy_hp < state.enemy_hp_max * 0.5;
        const bonus = wounded ? rollDie(4) : 0;
        let dmg = rollDie(6) + strMod + dex + bonus + 1;
        const crit = Math.random() < 0.35;
        if (crit) dmg = Math.max(1, Math.floor(dmg * 1.45));
        return { dmg, wounded, narrative_tag: crit ? "crit" : "", skip_retaliation: false };
      },
    },
    passive: { name: "Slip", desc: "The Low Quarter taught you to cut where the guard is lazy." },
  },
  ironblood: {
    role: "frontliner / control",
    primary: {
      name: "Crushing Blow",
      cadence: 3,
      narrative: (dmg, staggered) =>
        staggered
          ? `**Crushing Blow** — The impact staggers them back. ${dmg} damage. They are *Staggered*.`
          : `**Crushing Blow** — A brutal hit for ${dmg} damage. They hold their line.`,
      effect: (stats, enemy) => {
        const strMod = statMod(stats.strength);
        const dmg = rollDie(8) + strMod + 3;
        const staggered = Math.random() < 0.45;
        const out = { dmg, wounded: staggered, status_on_player: "iron_stance", status_duration_player: 1 };
        if (staggered) {
          out.status_on_enemy = "staggered";
          out.status_duration_enemy = 1;
        }
        return out;
      },
    },
    passive: { name: "Veteran's Brace", desc: "After your blow, you give less away to what comes back." },
  },
  shadowbound: {
    role: "assassin / burst",
    primary: {
      name: "Veil Cut",
      cadence: 3,
      narrative: (dmg, leech) =>
        `**Veil Cut** — Shadow carries the edge. **${dmg}** damage. You draw **${leech}** HP from the wound.`,
      effect: (stats, enemy) => {
        const dex = statMod(stats.dexterity);
        const intm = Math.max(0, statMod(stats.intelligence ?? 10));
        const dmg = rollDie(8) + dex + Math.max(0, Math.floor(intm / 2)) + 1;
        const heal = Math.max(1, Math.floor(dmg * 0.16));
        return { dmg, heal, wounded: heal, skip_retaliation: false };
      },
    },
    passive: {
      name: "Fade",
      desc: "First normal attack each combat rolls twice on the to-hit and keeps the better total.",
    },
  },
  warden: {
    role: "protector / tank",
    primary: {
      name: "Stand Fast",
      cadence: 3,
      narrative: (shieldVal) =>
        `**Stand Fast** — You set shield and angle. A ward of **${shieldVal}** turns the next blows aside.`,
      effect: (stats, enemy, state) => {
        const maxHp = state.player_hp_max ?? 20;
        const shieldVal = Math.max(3, Math.floor(maxHp * 0.1) + statMod(stats.constitution ?? 10));
        return {
          dmg: 0,
          narrative_primary: shieldVal,
          status_on_player: "shield",
          status_duration_player: 2,
          status_value: shieldVal,
          skip_retaliation: false,
        };
      },
    },
    passive: { name: "Bulwark", desc: "Below half health, the mail remembers its duty—one less point finds you." },
  },
  pale_marked: {
    role: "sustain / drain",
    primary: {
      name: "Siphon Burn",
      cadence: 3,
      narrative: (dmg, leech) =>
        `**Siphon Burn** — Pale flame scores **${dmg}**. You pull **${leech}** HP back through the link.`,
      effect: (stats) => {
        const intm = Math.max(0, statMod(stats.intelligence ?? 10));
        const dmg = rollDie(8) + intm + 1;
        const heal = Math.max(1, Math.floor(dmg * 0.22));
        return { dmg, heal, wounded: heal };
      },
    },
    passive: { name: "Ash Wreath", desc: "What you take does not stay in the air." },
  },
  lifebinder: {
    role: "support / ward",
    primary: {
      name: "Vital Thread",
      cadence: 2,
      narrative: (heal) =>
        `**Vital Thread** — You knot life back into place. Recover **${heal}** HP. A ward steadies your skin.`,
      effect: (stats, enemy, state) => {
        const wis = statMod(stats.wisdom ?? 10);
        const heal = rollDie(6) + rollDie(4) + wis + 1;
        const maxHp = state.player_hp_max ?? 20;
        const shieldVal = Math.max(2, Math.floor(maxHp * 0.12));
        return {
          heal,
          dmg: 0,
          status_on_player: "shield",
          status_duration_player: 3,
          status_value: shieldVal,
        };
      },
    },
    passive: { name: "Pulse", desc: "Life knotted tight is harder to pull loose." },
  },
  quickstep: {
    role: "evasion / pressure",
    primary: {
      name: "Flow State",
      cadence: 2,
      narrative: (dmg) =>
        `**Flow State** — A light cut for **${dmg}**; you are already elsewhere — *Untargetable* this beat.`,
      effect: (stats) => {
        const dex = statMod(stats.dexterity);
        const dmg = rollDie(4) + dex + rollDie(4);
        return {
          dmg,
          status_on_player: "untargetable",
          status_duration_player: 1,
          skip_retaliation: true,
        };
      },
    },
    passive: { name: "Rhythm", desc: "You leave the line before their answer lands." },
  },
  war_forged: {
    role: "tactical / control",
    primary: {
      name: "Tactical Strike",
      cadence: 3,
      narrative: (dmg) =>
        `**Tactical Strike** — Measured force finds the seam. **${dmg}** damage. They are *Weakened*.`,
      effect: (stats) => {
        const strMod = statMod(stats.strength);
        const wis = statMod(stats.wisdom ?? 10);
        const dmg = rollDie(8) + strMod + Math.max(0, Math.floor(wis / 2)) + 1;
        return {
          dmg,
          status_on_enemy: "weakened",
          status_duration_enemy: 2,
        };
      },
    },
    passive: { name: "Drill", desc: "The first honest strike carries the lesson you drilled." },
  },
  grave_whisper: {
    role: "debuff / drain",
    primary: {
      name: "Death's Grasp",
      cadence: 3,
      narrative: (dmg, drain) =>
        `**Death's Grasp** — The hollow takes **${dmg}**; sight frays. You pull **${drain}** HP from the slack.`,
      effect: (stats) => {
        const intm = Math.max(0, statMod(stats.intelligence ?? 10));
        const dmg = rollDie(8) + intm + 1;
        const heal = Math.max(1, Math.floor(dmg * 0.18));
        return { dmg, heal, wounded: heal, status_on_enemy: "blind", status_duration_enemy: 1 };
      },
    },
    passive: { name: "Hollow Touch", desc: "Silence has weight; you learned where to lean." },
  },
  sentinel: {
    role: "defender / barrier",
    primary: {
      name: "Vigilant Guard",
      cadence: 3,
      narrative: (shieldVal) =>
        `**Vigilant Guard** — You set the line. A barrier of **${shieldVal}**; they hesitate — *Weakened* for a moment.`,
      effect: (stats, enemy, state) => {
        const con = statMod(stats.constitution ?? 10);
        const maxHp = state.player_hp_max ?? 20;
        const shieldVal = Math.max(3, Math.floor(maxHp * 0.18) + con);
        return {
          dmg: 0,
          narrative_primary: shieldVal,
          status_on_player: "shield",
          status_duration_player: 3,
          status_value: shieldVal,
          status_on_enemy: "weakened",
          status_duration_enemy: 1,
        };
      },
    },
    passive: { name: "Watch", desc: "What you raise, they must reckon with first." },
  },
};

export function tickStatuses(statuses) {
  const next = {};
  for (const [k, v] of Object.entries(statuses || {})) {
    if (typeof v === "object" && v !== null && "duration" in v) {
      if (v.duration > 1) next[k] = { ...v, duration: v.duration - 1 };
    } else if (typeof v === "number" && v > 1) {
      next[k] = v - 1;
    }
  }
  return next;
}

/**
 * Resolve player action — ability or normal attack. Uses INSTINCT_DEFS.
 * @param {object} upgrades - Optional. If upgrades.level_5 is a function, use it instead of def.primary.effect.
 * @param {object} equipStats - Aggregated equipment stats (melee_power, accuracy, spell_power, etc.)
 * @param {object|null} equippedItemMap - Slot → item id; used to derive weapon die from EQUIPMENT_DATA.
 */
export function resolvePlayerAction(stats, enemy, useAbility, instinct, state, upgrades = null, equipStats = {}, equippedItemMap = null) {
  const strMod = statMod(stats.strength);
  const def = INSTINCT_DEFS[instinct];
  const eq = equipStats || {};
  let weaponDie = state?.weapon_die;
  if (equippedItemMap?.weapon_main && EQUIPMENT_DATA[equippedItemMap.weapon_main]) {
    weaponDie = weaponDieSidesFromEquippedWeapon(equippedItemMap) ?? weaponDie ?? 6;
  } else if (weaponDie == null) {
    weaponDie = 6;
  }

  if (useAbility && def) {
    const effectFn = typeof upgrades?.level_5 === "function" ? upgrades.level_5 : def.primary.effect;
    const result = effectFn(stats, enemy, state);
    if (instinct === "ember_touched" && result.dmg != null) {
      result.dmg += eq.spell_power ?? 0;
    }
    if (instinct === "pale_marked" && result.dmg != null) {
      result.dmg += eq.spell_power ?? 0;
      if (result.heal != null) {
        result.heal = Math.max(1, Math.floor(result.dmg * 0.22));
        result.heal += eq.healing_power ?? 0;
        result.wounded = result.heal;
      }
    }
    if (instinct === "grave_whisper" && result.dmg != null) {
      result.dmg += eq.spell_power ?? 0;
      if (result.heal != null) {
        result.heal = Math.max(1, Math.floor(result.dmg * 0.18));
        result.heal += eq.healing_power ?? 0;
        result.wounded = result.heal;
      }
    }
    if (instinct === "shadowbound" && result.dmg != null) {
      result.dmg += (eq.melee_power ?? 0) + Math.floor((eq.spell_power ?? 0) / 2);
      if (result.heal != null) {
        result.heal = Math.max(1, Math.floor(result.dmg * 0.16));
        result.heal += eq.healing_power ?? 0;
        result.wounded = result.heal;
      }
    }
    if (instinct === "streetcraft" && result.dmg != null) {
      result.dmg += eq.melee_power ?? 0;
    }
    if (instinct === "ironblood" && result.dmg != null) {
      result.dmg += eq.melee_power ?? 0;
    }
    if (instinct === "war_forged" && result.dmg != null) {
      result.dmg += eq.melee_power ?? 0;
    }
    if (instinct === "quickstep" && result.dmg != null) {
      result.dmg += eq.melee_power ?? 0;
    }
    if (instinct === "hearthborn" && result.heal != null) {
      result.heal += eq.healing_power ?? 0;
    }
    if (instinct === "lifebinder" && result.heal != null) {
      result.heal += eq.healing_power ?? 0;
    }
    const narrativeArg0 = result.narrative_primary ?? result.dmg ?? result.heal;
    const narrative =
      typeof def.primary.narrative === "function"
        ? def.primary.narrative(narrativeArg0, result.wounded, result.narrative_tag)
        : def.primary.narrative;
    return { ...result, narrative, ability: true };
  }

  const accBonus = (eq.accuracy ?? 0) + (state?.accuracy_bonus ?? 0);
  const die1 = rollDie(20);
  const isFade = instinct === "shadowbound" && !state?.fade_used;
  let natForCrit = die1;
  let roll = die1 + strMod + accBonus;
  if (isFade) {
    const die2 = rollDie(20);
    const r2 = die2 + strMod + accBonus;
    if (r2 > roll) {
      roll = r2;
      natForCrit = die2;
    }
  }

  const inStealth = (state?.statuses?.stealth ?? 0) > 0;
  const defense = enemy?.defense ?? 0;
  let dmg = 0,
    narrative = "";

  const critNeed = Math.max(15, 18 - Math.floor((eq.crit_chance ?? 0) / 5));
  const critMult = 1.5 + (eq.crit_damage ?? 0) / 10;
  const isCrit = roll >= defense && natForCrit >= critNeed;

  if (roll >= defense) {
    let baseDmg = rollDie(weaponDie) + strMod + (eq.melee_power ?? 0);
    baseDmg = Math.max(1, baseDmg);
    if (isCrit) {
      baseDmg = Math.max(1, Math.floor(baseDmg * critMult));
      narrative = `**Critical hit!** `;
    } else {
      narrative = "";
    }
    dmg = baseDmg;

    if (inStealth) {
      dmg = Math.floor(dmg * STATUS_DEFS.stealth.bonus_dmg_multiplier);
      narrative += `You strike from shadow for **${dmg}** damage.`;
    } else {
      narrative += `You strike for **${dmg}** damage.`;
    }

    if (instinct === "ember_touched" && (state?.enemy_statuses?.burning ?? 0) > 0) {
      dmg += STATUS_DEFS.burning.passive_dmg_bonus;
      narrative += ` *The burning worsens it.*`;
    }
  } else {
    narrative = `Your attack misses — ${enemy?.name ?? "the enemy"} evades.`;
  }

  return {
    dmg,
    narrative,
    hit: roll >= defense,
    fade_triggered: isFade,
    stealth_consumed: inStealth && roll >= defense,
  };
}

/**
 * Enemy attack — status-aware. Uses playerStatuses and enemyStatuses.
 * @param {number} shieldBonus - Legacy: added to DEX-based avoid threshold (e.g. tier shield from combat start).
 * @param {object} equipStats - Equipment defense, dodge, block_value.
 * @param {object|null} equippedItemMap - Used to confirm shield for block_value.
 * Returns { dmg, hit, armor_absorbed? } — dmg is 0 on miss or when staggered.
 */
export function resolveEnemyAttack(
  enemy,
  stats,
  playerStatuses = {},
  enemyStatuses = {},
  shieldBonus = 0,
  equipStats = {},
  equippedItemMap = null,
) {
  const eq = equipStats || {};
  const defMod = statMod(stats.dexterity) + shieldBonus;

  if ((enemyStatuses?.staggered ?? 0) > 0) return { dmg: 0, hit: false };

  let roll = rollDie(20) + Math.floor(((enemy.accuracy ?? 65) - 50) / 5);
  if ((enemyStatuses?.blind ?? 0) > 0) {
    roll = Math.max(1, roll - 40);
  }

  if ((enemyStatuses?.taunt ?? 0) > 0) {
    roll = Math.min(roll, rollDie(20) + Math.floor(((enemy.accuracy ?? 65) - 50) / 5));
  }
  if ((playerStatuses?.slip_dodge ?? 0) > 0) {
    roll = Math.min(roll, rollDie(20) + Math.floor(((enemy.accuracy ?? 65) - 50) / 5));
  }

  let hitThreshold = 10 + defMod + (eq.defense ?? 0);
  if ((eq.dodge ?? 0) > 0) {
    hitThreshold += Math.floor(eq.dodge / 2);
  }
  if (roll < hitThreshold) return { dmg: 0, hit: false };

  const d = enemy.damage ?? { min: 3, max: 5 };
  const range = d.max - d.min + 1;
  let dmg = Math.max(1, d.min + Math.floor(Math.random() * range));

  if ((playerStatuses?.resolve ?? 0) > 0) {
    dmg = Math.floor(dmg * (1 - STATUS_DEFS.resolve.damage_reduction));
  }
  if ((playerStatuses?.iron_stance ?? 0) > 0) {
    dmg = Math.max(0, dmg - STATUS_DEFS.iron_stance.flat_damage_reduction);
  }
  if ((enemyStatuses?.stagger ?? 0) > 0) {
    dmg = Math.max(0, Math.floor(dmg * (1 - 0.20)));
  }
  if ((enemyStatuses?.weakened ?? 0) > 0) {
    dmg = Math.max(0, Math.floor(dmg * (1 - 0.25)));
  }

  const offId = equippedItemMap?.weapon_offhand;
  const offDef = offId ? EQUIPMENT_DATA[offId] : null;
  const shieldEquipped =
    offDef && (offDef.sub_type === "shield" || offDef.sub_type === "buckler");
  if (shieldEquipped && (eq.block_value ?? 0) > 0) {
    dmg = Math.max(0, dmg - eq.block_value);
  }

  let armorAbsorbed = 0;
  if ((eq.defense ?? 0) > 0) {
    const beforeArmor = dmg;
    let red = Math.floor(eq.defense / 2);
    const cap = Math.floor(beforeArmor * 0.5);
    red = Math.min(red, cap);
    dmg = Math.max(0, beforeArmor - red);
    armorAbsorbed = red;
  }

  return { dmg, hit: true, armor_absorbed: armorAbsorbed };
}

/** Legacy enemyAttack — delegates to resolveEnemyAttack for backwards compat */
export function enemyAttack(enemy, stats, shieldBonus = 0) {
  return resolveEnemyAttack(enemy, stats, {}, {}, shieldBonus, {}, null);
}

/**
 * Tick status effects at round start. Returns total damage to player.
 */
export function tickStatusEffects(state) {
  const effects = state.status_effects ?? [];
  let damage = 0;
  const updated = effects
    .map((effect) => {
      if (effect.type === "bleed" || effect.type === "poison" || effect.type === "fire_touch") {
        damage += effect.damage ?? 0;
        return { ...effect, duration: (effect.duration ?? 1) - 1 };
      }
      return { ...effect, duration: (effect.duration ?? 1) - 1 };
    })
    .filter((e) => e.duration > 0);
  state.status_effects = updated;
  return damage;
}

/**
 * Resolve trait before enemy acts. Returns { skipAction } or { replacementAttack: { damage, hit } } or null.
 */
export function resolveEnemyTrait(enemy, state) {
  if (!enemy?.trait) return null;
  const traitState = state.trait_state ?? {};
  const round = state.round ?? 1;

  switch (enemy.trait) {
    case "stagger": {
      const chance = enemy.trait_params?.chance ?? 0.2;
      if (Math.random() < chance) return { skipAction: true };
      break;
    }
    case "lunge": {
      if (traitState.lunge_used) break;
      traitState.lunge_used = true;
      const hits = Math.random() < 0.4;
      const dmg = hits
        ? enemy.damage.max + Math.floor(enemy.damage.max * 0.5)
        : 0;
      return { replacementAttack: { damage: dmg, hit: hits } };
    }
    case "summon": {
      if (traitState.summon_used) break;
      const enemyHp = state.enemy_hp ?? 0;
      const enemyHpMax = state.enemy_hp_max ?? enemy.hp;
      if (enemyHp > enemyHpMax / 2) break;
      traitState.summon_used = true;
      const minionId = enemy.trait_params?.minion_id ?? "gutter_rat";
      return { skipAction: true, summonMinion: minionId };
    }
    case "spore_burst":
      // On death only — handled in victory/death resolution in index.js
      break;
    case "guard":
      // Damage reduction applied via getTraitDamageModifier — no action change
      break;
    default:
      break;
  }
  return null;
}

/**
 * Get damage multiplier for player damage to enemy (e.g. guard = 0.5).
 */
export function getTraitDamageModifier(enemy, state) {
  if (!enemy?.trait || enemy.trait !== "guard") return 1;
  const round = state.round ?? 1;
  if (round % 2 === 0) return 0.5;
  return 1;
}

/**
 * Get status effect to add when enemy hits. Returns { type, damage, duration } or null.
 */
export function getStatusEffectOnHit(enemy) {
  if (!enemy?.trait) return null;
  const params = enemy.trait_params ?? {};
  switch (enemy.trait) {
    case "bleed":
      return {
        type: "bleed",
        damage: params.damage ?? 1,
        duration: params.duration ?? 2,
      };
    case "poison":
      return {
        type: "poison",
        damage: params.damage ?? 1,
        duration: params.duration ?? 3,
        stacks: true,
        max_stacks: params.max_stacks ?? 3,
      };
    case "fire_touch":
      return {
        type: "fire_touch",
        damage: params.damage ?? 3,
        duration: params.duration ?? 3,
      };
    default:
      return null;
  }
}

/**
 * Get on-hit effect: drain (enemy heals) or armor_break (reduce player defense).
 */
export function getTraitOnHitEffect(enemy) {
  if (!enemy?.trait) return null;
  const params = enemy.trait_params ?? {};
  switch (enemy.trait) {
    case "drain":
      return { drain: params.self_heal ?? 3 };
    case "armor_break":
      return {
        armor_break: {
          defense_reduction: params.defense_reduction ?? 2,
          duration: params.duration ?? 3,
        },
      };
    default:
      return null;
  }
}
