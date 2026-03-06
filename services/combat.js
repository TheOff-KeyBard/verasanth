import { COMBAT_DATA, LOCATION_TO_FLOOR } from "../data/combat.js";

export function statMod(v) { return Math.floor((v - 10) / 2); }

export function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }

export function maxPlayerHp(con) { return 20 + statMod(con) * 3; }

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

/**
 * Player attack. Always hits; damage reduced by enemy.defense. Returns staggered if dmg >= break_threshold.
 */
export function playerAttack(stats, enemy, useAbility, instinct, equipment = {}) {
  const strMod = statMod(stats.strength);
  const weaponDie = equipment.weaponDie || 6;
  let dmg = 0, narrative = "";

  if (useAbility) {
    if (instinct === "streetcraft") {
      dmg = rollDie(6) + strMod + 2;
      narrative = `**Dirty Strike** — You slip inside their guard. ${dmg} damage.`;
      return { dmg, narrative, skipRetaliation: true };
    }
    if (instinct === "ironblood") {
      narrative = "**Brace** — You absorb the blow. Incoming damage is halved this turn.";
      dmg = rollDie(6) + strMod;
      return { dmg, narrative, damageReduction: 0.5 };
    }
    if (instinct === "ember_touched") {
      dmg = rollDie(8) + 2;
      narrative = `**Ember Pulse** — Something surges from your core. ${dmg} magic damage.`;
      return { dmg, narrative, magic: true };
    }
    if (instinct === "hearthborn") {
      const heal = rollDie(6) + statMod(stats.constitution);
      narrative = `**Steady** — You pull yourself together. Recover ${heal} HP.`;
      return { dmg: 0, narrative, heal };
    }
  }

  dmg = rollDie(weaponDie) + strMod;
  const defense = enemy.defense ?? 0;
  const finalDmg = Math.max(1, dmg - defense);
  narrative = `You strike for **${finalDmg}** damage.`;

  const breakThreshold = enemy.break_threshold ?? 999;
  const staggered = finalDmg >= breakThreshold;
  if (staggered) narrative += " **STAGGER** — the enemy loses its next action.";

  return { dmg: finalDmg, narrative, staggered };
}

/**
 * Enemy attack. Uses accuracy-based hit check and damage range.
 * Blueprint: accuracy% = chance enemy hits; dodge when d20+DEX+shield >= threshold.
 * Formula: hit when dodgeRoll < threshold; threshold from combat_rebalance.md.
 * Returns { dmg, hit } — dmg is 0 on miss.
 */
export function enemyAttack(enemy, stats, shieldBonus = 0) {
  const dexMod = statMod(stats.dexterity);
  const dodgeRoll = rollDie(20) + dexMod + shieldBonus;
  const hitThreshold = Math.floor((100 - (enemy.accuracy ?? 65)) / 5);
  const hit = dodgeRoll < hitThreshold;

  if (!hit) return { dmg: 0, hit: false };

  const d = enemy.damage ?? { min: 3, max: 5 };
  const range = d.max - d.min + 1;
  const dmg = Math.max(1, d.min + Math.floor(Math.random() * range));
  return { dmg, hit: true };
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
