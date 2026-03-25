/**
 * Phase 1 combat (§29 not in repo): d20 attack + static damage, logged rolls.
 * attack: roll d20 + atkMod vs target AC (10 + enemy defense)
 * damage on hit: 1d4 + level (min 1)
 * flee: d20 >= 12 succeeds
 */

export type CombatAction = "attack" | "use_item" | "flee";

export function rollDie(sides: number): number {
  return Math.floor(Math.random() * sides) + 1;
}

export function playerAttackMod(level: number): number {
  return Math.floor(level / 2);
}

export function attackArmorClass(enemyDefense: number): number {
  return 10 + enemyDefense;
}

export function computeDamage(level: number): number {
  return Math.max(1, rollDie(4) + level);
}

export function fleeSuccess(): { roll: number; ok: boolean } {
  const roll = rollDie(20);
  return { roll, ok: roll >= 12 };
}
