import { COMBAT_DATA } from "../data/combat.js";

export function statMod(v) { return Math.floor((v - 10) / 2); }

export function rollDie(sides) { return Math.floor(Math.random() * sides) + 1; }

export function maxPlayerHp(con) { return 20 + statMod(con) * 3; }

export function randomEnemy(location) {
  const cd = COMBAT_DATA;
  let pool;
  if (location.startsWith("sewer_deep")) pool = cd.sewer_deep_pool;
  else if (location.startsWith("sewer_mid")) pool = cd.sewer_mid_pool;
  else {
    // Derive tier from location prefix
    let tier = 1;
    for (const [prefix, t] of Object.entries(cd.dungeon_tiers)) {
      if (location.startsWith(prefix)) { tier = t; break; }
    }
    pool = cd.tier_enemies[String(tier)] || cd.tier_enemies["1"];
  }
  const id = pool[Math.floor(Math.random() * pool.length)];
  return { ...cd.enemies[id], id };
}

export function playerAttack(stats, enemy, useAbility, instinct, equipment = {}) {
  const strMod = statMod(stats.strength);
  const roll   = rollDie(20) + strMod;
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

  if (roll >= enemy.defense) {
    dmg = rollDie(weaponDie) + strMod;
    dmg = Math.max(1, dmg);
    narrative = `You strike for **${dmg}** damage.`;
  } else {
    narrative = `Your attack misses — ${enemy.name} evades.`;
  }
  return { dmg, narrative };
}

export function enemyAttack(enemy, stats, shieldBonus = 0) {
  const defMod = statMod(stats.dexterity);
  const roll   = rollDie(20) + (enemy.attack_mod || 0);
  if (roll >= 10 + defMod + shieldBonus) {
    return Math.max(1, rollDie(enemy.attack_die || 6));
  }
  return 0;
}

// ─────────────────────────────────────────────────────────────
// NPC DIALOGUE — Claude API calls
// Each NPC gets a tailored system prompt so the response
// matches the voice and progression system we built.
// ─────────────────────────────────────────────────────────────
