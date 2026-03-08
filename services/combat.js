import { COMBAT_DATA, LOCATION_TO_FLOOR } from "../data/combat.js";

export function statMod(v) { return Math.floor((v - 10) / 2); }

export function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }

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

// Instinct definitions — primary abilities and passives
export const INSTINCT_DEFS = {
  ember_touched: {
    role: "burst / DoT",
    primary: {
      name: "Kindle",
      cadence: 3,
      narrative: (dmg) => `**Kindle** — Arcane fire tears through them. ${dmg} damage. They are *Burning*.`,
      effect: (stats, enemy) => {
        const dmg = rollDie(8) + 2 + Math.max(0, statMod(stats.intelligence ?? stats.wisdom ?? 10));
        return { dmg, status_on_enemy: "burning", status_duration: 3 };
      },
    },
    passive: { name: "Smolder", desc: "Burning enemies take +1 damage from all sources." },
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
      narrative: (dmg, wounded) =>
        `**Opportunist Strike** — ${wounded ? "You find the gap in their weakness. " : "You slip inside their guard. "}${dmg} damage.`,
      effect: (stats, enemy, state) => {
        const strMod = statMod(stats.strength);
        const wounded = enemy && state.enemy_hp < (state.enemy_hp_max * 0.5);
        const bonus = wounded ? rollDie(4) : 0;
        const dmg = rollDie(6) + strMod + bonus + 2;
        return { dmg, wounded, skip_retaliation: false, status_on_player: "slip_dodge", status_duration: 1 };
      },
    },
    passive: { name: "Slip", desc: "+10% dodge on the turn after using the ability." },
  },
  ironblood: {
    role: "frontliner / control",
    primary: {
      name: "Crushing Blow",
      cadence: 3,
      narrative: (dmg) => `**Crushing Blow** — The impact staggers them back. ${dmg} damage. They are *Staggered*.`,
      effect: (stats, enemy) => {
        const strMod = statMod(stats.strength);
        const dmg = rollDie(8) + strMod + 2;
        return { dmg, status_on_enemy: "staggered", status_duration: 1, status_on_player: "iron_stance", status_duration_player: 1 };
      },
    },
    passive: { name: "Iron Stance", desc: "+1 flat damage reduction for 1 turn after using the ability." },
  },
  shadowbound: {
    role: "assassin / burst",
    primary: {
      name: "Veil Step",
      cadence: 3,
      narrative: () => `**Veil Step** — You step into the shadow between moments. *Stealth* settles on you.`,
      effect: (stats, enemy) => {
        return { dmg: 0, status_on_player: "stealth", status_duration: 2, skip_retaliation: true };
      },
    },
    passive: { name: "Fade", desc: "First attack each combat has +10% crit chance (roll twice, take higher)." },
  },
  warden: {
    role: "protector / tank",
    primary: {
      name: "Stand Fast",
      cadence: 3,
      narrative: () => `**Stand Fast** — You plant your feet. *Resolve* and *Taunt* — you absorb what comes.`,
      effect: (stats, enemy) => {
        return {
          dmg: 0,
          status_on_player: "resolve",
          status_duration: 2,
          status_on_enemy: "taunt",
          status_duration_enemy: 1,
          skip_retaliation: false,
        };
      },
    },
    passive: { name: "Bulwark", desc: "+1 flat armor when below 50% HP." },
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
 */
export function resolvePlayerAction(stats, enemy, useAbility, instinct, state, upgrades = null) {
  const strMod = statMod(stats.strength);
  const def = INSTINCT_DEFS[instinct];
  const weaponDie = state?.weapon_die ?? 6;

  if (useAbility && def) {
    const effectFn = typeof upgrades?.level_5 === "function" ? upgrades.level_5 : def.primary.effect;
    const result = effectFn(stats, enemy, state);
    const narrative =
      typeof def.primary.narrative === "function"
        ? def.primary.narrative(result.dmg ?? result.heal, result.wounded)
        : def.primary.narrative;
    return { ...result, narrative, ability: true };
  }

  let roll = rollDie(20) + strMod + (state?.accuracy_bonus ?? 0);
  const isFade = instinct === "shadowbound" && !state?.fade_used;
  if (isFade) {
    roll = Math.max(roll, rollDie(20) + strMod);
  }

  const inStealth = (state?.statuses?.stealth ?? 0) > 0;
  const defense = enemy?.defense ?? 0;
  let dmg = 0,
    narrative = "";

  if (roll >= defense) {
    dmg = rollDie(weaponDie) + strMod;
    dmg = Math.max(1, dmg);

    if (inStealth) {
      dmg = Math.floor(dmg * STATUS_DEFS.stealth.bonus_dmg_multiplier);
      narrative = `You strike from shadow for **${dmg}** damage.`;
    } else {
      narrative = `You strike for **${dmg}** damage.`;
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
 * Returns { dmg, hit } — dmg is 0 on miss or when staggered.
 */
export function resolveEnemyAttack(enemy, stats, playerStatuses = {}, enemyStatuses = {}, shieldBonus = 0) {
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

  const hitThreshold = 10 + defMod;
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

  return { dmg, hit: true };
}

/** Legacy enemyAttack — delegates to resolveEnemyAttack for backwards compat */
export function enemyAttack(enemy, stats, shieldBonus = 0) {
  return resolveEnemyAttack(enemy, stats, {}, {}, shieldBonus);
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
