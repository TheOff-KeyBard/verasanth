# Cursor Prompt — Instinct System Overhaul
# Touch index.js and index.html
# Prerequisite: ability_cooldown system from cursor_ability_cooldown.md must be implemented first

---

## OVERVIEW

Six instincts. Each gets:
- A primary ability (the button) with a defined cadence
- A passive that fires automatically each turn
- A status effect where relevant (burning, stagger, resolve, stealth, taunt)

The combat state object gains new fields to track statuses.
The `playerAttack` function is replaced with `resolvePlayerAction`.
The `enemyAttack` function gains a status-aware wrapper.
No new endpoints. No schema changes beyond what ability_cooldown added.

---

## STEP 1 — STATUS EFFECT SYSTEM

Add this block near `ABILITY_COOLDOWNS`. Statuses live in `combat_state`
as duration counters. They tick down at the end of each full round.

```javascript
// Status effects — stored in combat_state as { status_name: turns_remaining }
// All statuses expire by decrementing each round in resolveStatuses()

const STATUS_DEFS = {
  burning: {
    label:   'Burning',
    // Deals bonus damage from all sources while active (applied in damage calc)
    // Stacks are not tracked — presence/absence only
    passive_dmg_bonus: 1,   // +1 damage from all hits while burning
  },
  staggered: {
    label:   'Staggered',
    // Enemy misses their retaliation turn
    skip_retaliation: true,
  },
  resolve: {
    label:   'Resolve',
    // Player takes reduced damage while active
    damage_reduction: 0.25,  // 25% reduction
  },
  stealth: {
    label:   'Stealth',
    // Next player attack deals bonus damage; consumed on hit
    bonus_dmg_multiplier: 2.0,
    consumed_on_hit: true,
  },
  taunt: {
    label:   'Taunt',
    // Enemy focuses attacks (no mechanical change solo; relevant for PvPvE later)
    // For now: enemy attack roll is at disadvantage (roll twice, take lower)
    disadvantage: true,
  },
  iron_stance: {
    label:   'Iron Stance',
    // +1 flat damage reduction for 1 turn
    flat_damage_reduction: 1,
  },
};

function tickStatuses(statuses) {
  // Decrement all status counters, remove expired ones
  const next = {};
  for (const [k, v] of Object.entries(statuses || {})) {
    if (v > 1) next[k] = v - 1;
    // v === 1 means this was the last turn — expires now
  }
  return next;
}
```

---

## STEP 2 — INSTINCT DEFINITIONS

Replace the current `INSTINCTS` constant (which has empty descriptions)
and add a new `INSTINCT_DEFS` table that the combat system reads from.
Keep `INSTINCTS` as-is for the character creation UI — just add the new table.

```javascript
const INSTINCT_DEFS = {
  ember_touched: {
    role:    'burst / DoT',
    primary: {
      name:      'Kindle',
      cadence:   3,
      narrative: (dmg) => `**Kindle** — Arcane fire tears through them. ${dmg} damage. They are *Burning*.`,
      effect: (stats, enemy) => {
        const dmg = rollDie(8) + 2 + Math.max(0, statMod(stats.intelligence ?? stats.wisdom ?? 10));
        return { dmg, status_on_enemy: 'burning', status_duration: 3 };
      },
    },
    passive: {
      name: 'Smolder',
      // Enemies that are Burning take +1 from all sources (handled in damage calc)
      // Also: first attack each combat has a small ember bonus
      desc: 'Burning enemies take +1 damage from all sources.',
    },
  },

  hearthbound: {
    role:    'sustain / support',
    primary: {
      name:      'Kindle the Hearth',
      cadence:   2,
      narrative: (heal) => `**Kindle the Hearth** — Something warm moves through you. Recover ${heal} HP. *Resolve* settles on you.`,
      effect: (stats, enemy, state) => {
        const base  = rollDie(6) + statMod(stats.constitution ?? 10);
        // Warmth passive: first heal each combat is 20% stronger
        const bonus = state.hearth_healed ? 0 : Math.floor(base * 0.2);
        const heal  = base + bonus;
        return { heal, status_on_player: 'resolve', status_duration: 2, set_flag: 'hearth_healed' };
      },
    },
    passive: {
      name: 'Warmth',
      desc: 'First heal each combat is 20% stronger.',
    },
  },

  streetcraft: {
    role:    'opportunist / control',
    primary: {
      name:      'Opportunist Strike',
      cadence:   2,
      narrative: (dmg, wounded) =>
        `**Opportunist Strike** — ${wounded ? 'You find the gap in their weakness. ' : 'You slip inside their guard. '}${dmg} damage.`,
      effect: (stats, enemy, state) => {
        const strMod  = statMod(stats.strength);
        const wounded = enemy && state.enemy_hp < (state.enemy_hp_max * 0.5);
        const bonus   = wounded ? rollDie(4) : 0;
        const dmg     = rollDie(6) + strMod + bonus + 2;
        return { dmg, wounded, skip_retaliation: false, status_on_player: 'slip_dodge', status_duration: 1 };
      },
    },
    passive: {
      name: 'Slip',
      desc: '+10% dodge on the turn after using the ability. (Enemy attack roll is at disadvantage.)',
      // Implemented via 'slip_dodge' status on player — same as taunt but for dodge
    },
  },

  ironblood: {
    role:    'frontliner / control',
    primary: {
      name:      'Crushing Blow',
      cadence:   3,
      narrative: (dmg) => `**Crushing Blow** — The impact staggers them back. ${dmg} damage. They are *Staggered*.`,
      effect: (stats, enemy) => {
        const strMod = statMod(stats.strength);
        const dmg    = rollDie(8) + strMod + 2;
        return { dmg, status_on_enemy: 'staggered', status_duration: 1 };
      },
    },
    passive: {
      name: 'Iron Stance',
      desc: '+1 flat damage reduction for 1 turn after using the ability.',
      // Implemented via 'iron_stance' status on player after ability use
    },
  },

  shadowbound: {
    role:    'assassin / burst',
    primary: {
      name:      'Veil Step',
      cadence:   3,
      narrative: () => `**Veil Step** — You step into the shadow between moments. *Stealth* settles on you.`,
      effect: (stats, enemy) => {
        // No immediate damage — applies stealth which doubles next attack
        return { dmg: 0, status_on_player: 'stealth', status_duration: 2, skip_retaliation: true };
      },
    },
    passive: {
      name: 'Fade',
      desc: 'First attack each combat has +10% crit chance (roll twice, take higher).',
      // Implemented via state.fade_used flag — first attack only
    },
  },

  warden: {
    role:    'protector / tank',
    primary: {
      name:      'Stand Fast',
      cadence:   3,
      narrative: () => `**Stand Fast** — You plant your feet. *Resolve* and *Taunt* — you absorb what comes.`,
      effect: (stats, enemy) => {
        return { dmg: 0, status_on_player: 'resolve', status_duration: 2,
                 status_on_enemy: 'taunt', status_duration_enemy: 1, skip_retaliation: false };
      },
    },
    passive: {
      name: 'Bulwark',
      desc: '+1 flat armor when below 50% HP.',
      // Applied automatically in damage calc when player_hp < player_hp_max * 0.5
    },
  },
};
```

---

## STEP 3 — REPLACE playerAttack WITH resolvePlayerAction

Remove the existing `playerAttack` function entirely. Replace with:

```javascript
function resolvePlayerAction(stats, enemy, useAbility, instinct, state) {
  const strMod = statMod(stats.strength);
  const def    = INSTINCT_DEFS[instinct];

  // ── ABILITY ──────────────────────────────────────────────────
  if (useAbility && def) {
    const result = def.primary.effect(stats, enemy, state);
    const narrative = typeof def.primary.narrative === 'function'
      ? def.primary.narrative(result.dmg ?? result.heal, result.wounded)
      : def.primary.narrative;
    return { ...result, narrative, ability: true };
  }

  // ── NORMAL ATTACK ────────────────────────────────────────────
  let roll = rollDie(20) + strMod;

  // Shadowbound Fade passive — first attack advantage
  const isFade = instinct === 'shadowbound' && !state.fade_used;
  if (isFade) {
    roll = Math.max(roll, rollDie(20) + strMod);
    // fade_used is set in the combat handler after this returns
  }

  // Stealth active — next attack is doubled, consumed on hit
  const inStealth = (state.statuses?.stealth ?? 0) > 0;

  let dmg = 0, narrative = '';

  if (roll >= enemy.defense) {
    dmg = rollDie(6) + strMod;
    dmg = Math.max(1, dmg);

    // Stealth bonus
    if (inStealth) {
      dmg = Math.floor(dmg * STATUS_DEFS.stealth.bonus_dmg_multiplier);
      narrative = `You strike from shadow for **${dmg}** damage.`;
    } else {
      narrative = `You strike for **${dmg}** damage.`;
    }

    // Ember-Touched Smolder: +1 if enemy is burning
    if (instinct === 'ember_touched' && (state.enemy_statuses?.burning ?? 0) > 0) {
      dmg += STATUS_DEFS.burning.passive_dmg_bonus;
      narrative += ` *The burning worsens it.*`;
    }
  } else {
    narrative = `Your attack misses — ${enemy.name} evades.`;
  }

  return {
    dmg,
    narrative,
    hit: roll >= enemy.defense,
    fade_triggered: isFade,
    stealth_consumed: inStealth && roll >= enemy.defense,
  };
}
```

---

## STEP 4 — UPDATE enemyAttack TO RESPECT STATUSES

Replace `enemyAttack` with a status-aware version:

```javascript
function resolveEnemyAttack(enemy, stats, playerStatuses, enemyStatuses) {
  const defMod = statMod(stats.dexterity);

  // Staggered: enemy skips retaliation entirely
  if ((enemyStatuses?.staggered ?? 0) > 0) return 0;

  let roll = rollDie(20) + (enemy.attack_mod || 0);

  // Taunt: enemy attacks at disadvantage (lower of two rolls)
  if ((enemyStatuses?.taunt ?? 0) > 0) {
    roll = Math.min(roll, rollDie(20) + (enemy.attack_mod || 0));
  }

  // Streetcraft Slip: player dodge bonus (same as taunt, applied to roll vs player)
  if ((playerStatuses?.slip_dodge ?? 0) > 0) {
    roll = Math.min(roll, rollDie(20) + (enemy.attack_mod || 0));
  }

  if (roll < 10 + defMod) return 0;

  let dmg = Math.max(1, rollDie(enemy.attack_die || 6) + (enemy.attack_mod || 0));

  // Player Resolve: 25% damage reduction
  if ((playerStatuses?.resolve ?? 0) > 0) {
    dmg = Math.floor(dmg * (1 - STATUS_DEFS.resolve.damage_reduction));
  }

  // Ironblood Iron Stance: flat -1 damage
  if ((playerStatuses?.iron_stance ?? 0) > 0) {
    dmg = Math.max(0, dmg - STATUS_DEFS.iron_stance.flat_damage_reduction);
  }

  // Warden Bulwark passive: +1 flat reduction when below 50% HP
  // (this is passed in from the handler)
  return dmg;
}
```

---

## STEP 5 — UPDATE COMBAT STATE INITIALIZATION

In `/api/combat/start`, update the state object:

```javascript
const state = {
  enemy_id:       enemy.id,
  enemy_name:     enemy.name,
  enemy_hp:       enemy.hp,
  enemy_hp_max:   enemy.hp,
  player_hp:      hp.current,
  player_hp_max:  hp.max,
  ability_cooldown: 0,
  turn:           1,
  location:       row.location,
  statuses:       {},        // player status effects { status_name: turns_remaining }
  enemy_statuses: {},        // enemy status effects
  fade_used:      false,     // shadowbound fade passive tracking
  hearth_healed:  false,     // hearthbound warmth passive tracking
};
```

---

## STEP 6 — UPDATE COMBAT ACTION HANDLER

Replace the combat action processing block. Find from
`if (action === "ability" && state.ability_used)` through to the
`// Ongoing` save block, and replace entirely:

```javascript
if (action === "ability" && state.ability_cooldown > 0) {
  return err(`Ability recharging — ${state.ability_cooldown} turn${state.ability_cooldown !== 1 ? 's' : ''} remaining.`);
}

const useAbility = action === "ability";

// Resolve player action
const attack = resolvePlayerAction(stats, enemy, useAbility, instinct, state);

// Track one-time passives
if (attack.fade_triggered) state.fade_used = true;
if (attack.stealth_consumed) delete state.statuses.stealth;
if (attack.set_flag) state[attack.set_flag] = true;  // e.g. hearth_healed

// Apply ability cooldown
if (useAbility) {
  const def = INSTINCT_DEFS[instinct];
  state.ability_cooldown = def ? def.primary.cadence : 3;
  // Ironblood: apply iron_stance on self after ability
  if (instinct === 'ironblood') {
    state.statuses = state.statuses || {};
    state.statuses.iron_stance = 1;
  }
} else if (state.ability_cooldown > 0) {
  state.ability_cooldown--;
}

// Apply status effects from this action to enemy
if (attack.status_on_enemy) {
  state.enemy_statuses = state.enemy_statuses || {};
  state.enemy_statuses[attack.status_on_enemy] = attack.status_duration ?? 1;
}

// Apply status effects from this action to player
if (attack.status_on_player) {
  state.statuses = state.statuses || {};
  state.statuses[attack.status_on_player] = attack.status_duration ?? 1;
}

// Warden Stand Fast also applies taunt on enemy
if (useAbility && instinct === 'warden' && attack.status_on_enemy) {
  state.enemy_statuses = state.enemy_statuses || {};
  state.enemy_statuses.taunt = attack.status_duration_enemy ?? 1;
}

// Warden Bulwark passive: check HP threshold
const bulwarkActive = instinct === 'warden'
  && state.player_hp < state.player_hp_max * 0.5;

// Resolve enemy retaliation
const skipRetaliation = attack.skip_retaliation
  || (attack.ability && attack.status_on_enemy === 'staggered')
  || (state.enemy_statuses?.staggered ?? 0) > 0;

let enemyDmg = skipRetaliation ? 0
  : resolveEnemyAttack(enemy, stats, state.statuses, state.enemy_statuses);

// Warden Bulwark: flat -1 if active
if (bulwarkActive && enemyDmg > 0) {
  enemyDmg = Math.max(0, enemyDmg - 1);
}

let playerHp = state.player_hp;
let enemyHp  = state.enemy_hp;

if (attack.heal) {
  playerHp = Math.min(playerHp + attack.heal, state.player_hp_max);
} else {
  // Smolder: ember_touched passive — already applied in resolvePlayerAction
  enemyHp = Math.max(0, enemyHp - (attack.dmg ?? 0));
}
playerHp = Math.max(0, playerHp - enemyDmg);

// Tick statuses at end of round
state.statuses       = tickStatuses(state.statuses);
state.enemy_statuses = tickStatuses(state.enemy_statuses);

// Build status line for message
const statusLines = [];
if ((state.enemy_statuses?.burning ?? 0) > 0)   statusLines.push(`*${enemy.name} is Burning (${state.enemy_statuses.burning} turns).*`);
if ((state.enemy_statuses?.staggered ?? 0) > 0)  statusLines.push(`*${enemy.name} is Staggered.*`);
if ((state.statuses?.resolve ?? 0) > 0)          statusLines.push(`*Resolve shields you (${state.statuses.resolve} turns).*`);
if ((state.statuses?.stealth ?? 0) > 0)          statusLines.push(`*You are in Stealth (${state.statuses.stealth} turns).*`);
if ((state.statuses?.iron_stance ?? 0) > 0)      statusLines.push(`*Iron Stance: +1 armor (${state.statuses.iron_stance} turns).*`);

const retalMsg = skipRetaliation
  ? `*${enemy.name} cannot retaliate.*`
  : enemyDmg > 0
    ? `*${enemy.name} retaliates — ${enemyDmg} damage.*`
    : `*${enemy.name} retaliates — misses.*`;

const fullMessage = [
  attack.narrative,
  retalMsg,
  ...statusLines,
].filter(Boolean).join('\n\n');
```

Then keep the existing Victory, Death, and Ongoing blocks — but update
the Ongoing block to include new fields:

```javascript
// Ongoing — update state
state.enemy_hp  = enemyHp;
state.player_hp = playerHp;
state.turn++;
await dbRun(db, "UPDATE combat_state SET state_json=? WHERE user_id=?", [JSON.stringify(state), uid]);
await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

return json({
  result:          "ongoing",
  message:         fullMessage,
  player_hp:       playerHp,
  enemy_hp:        enemyHp,
  enemy_hp_max:    state.enemy_hp_max,
  ability_cooldown: state.ability_cooldown,
  statuses:        state.statuses,
  enemy_statuses:  state.enemy_statuses,
});
```

Also update the Victory return to use `fullMessage` for the last hit:
```javascript
return json({
  result:     "victory",
  message:    `*${enemy.name} falls.*\n\n${attack.narrative}\n\n**+${xpGain} XP** | **+${lootAsh} Ash Marks**`,
  can_advance: !!canAdvance,
  player_hp:  playerHp,
  ability_cooldown: 0,
});
```

---

## STEP 7 — REGISTER SHADOWBOUND AND WARDEN

In `NPC_LOCATIONS`, `NPC_NAMES`, `NPC_TOPICS`, and `ALIGN_INSTINCT_BIAS`:
Shadowbound and Warden are new instincts referenced in `INSTINCT_DEFS`
but not yet registered. Add them:

In `ALIGN_INSTINCT_BIAS`:
```javascript
const ALIGN_INSTINCT_BIAS = {
  hearthbound:   [1,  0],
  ember_touched: [0,  0],
  ironblood:     [0,  0],
  streetcraft:   [0, -1],
  shadowbound:   [-1, 0],  // ← add: chaos-leaning
  warden:        [1,  1],  // ← add: moral + ordered
};
```

In `INSTINCTS` (the character creation constant):
```javascript
const INSTINCTS = {
  streetcraft:   { label: "Echo: Streetcraft",   description: "Opportunist. Fast. Hits harder when they're already bleeding." },
  ironblood:     { label: "Echo: Ironblood",     description: "Frontliner. Slow and crushing. Controls the fight." },
  ember_touched: { label: "Echo: Ember-Touched", description: "Arcane burst. Burns them down. Punishes long fights." },
  hearthbound:   { label: "Echo: Hearthbound",   description: "Sustain. Heals and endures. Good in a long fight." },
  shadowbound:   { label: "Echo: Shadowbound",   description: "Assassin. Stealth burst. High risk, massive payoff." },
  warden:        { label: "Echo: Warden",        description: "Protector. Absorbs damage. Carries the team." },
};
```

---

## CHANGES — index.html

### Ability button label

`updateAbilityButton` from the previous prompt already handles the
cooldown label. No changes needed there.

### Status display in combat overlay

After the HP bars, add a status line area. Find the combat overlay HTML
(around `#combat-overlay`) and add inside it, after the bars:

```html
<div id="combat-statuses" style="
  font-size: 0.75rem;
  color: var(--ember);
  font-family: var(--font-title);
  letter-spacing: 0.05em;
  min-height: 1.2em;
  margin: 6px 0 0 0;
"></div>
```

In `combatAction`, after `updateCombatBars`, add:

```javascript
function updateStatusDisplay(statuses, enemyStatuses) {
  const el = document.getElementById('combat-statuses');
  if (!el) return;
  const parts = [];
  if (statuses?.resolve)     parts.push(`Resolve (${statuses.resolve}t)`);
  if (statuses?.stealth)     parts.push(`Stealth (${statuses.stealth}t)`);
  if (statuses?.iron_stance) parts.push(`Iron Stance (${statuses.iron_stance}t)`);
  if (enemyStatuses?.burning)   parts.push(`Enemy: Burning (${enemyStatuses.burning}t)`);
  if (enemyStatuses?.staggered) parts.push(`Enemy: Staggered`);
  if (enemyStatuses?.taunt)     parts.push(`Enemy: Taunted`);
  el.textContent = parts.join('  ·  ');
}
```

Call it in `combatAction` `ongoing` branch:
```javascript
updateStatusDisplay(data.statuses, data.enemy_statuses);
```

Clear it when combat closes (victory/fled/death):
```javascript
updateStatusDisplay({}, {});
```

Also clear on `showCombat`:
```javascript
updateStatusDisplay({}, {});
```

---

## VERIFICATION CHECKLIST

**Ember-Touched:**
- [ ] Kindle applies Burning (3 turns) to enemy
- [ ] Burning enemy shows status line in combat log
- [ ] Normal attacks on Burning enemy show "+1 / The burning worsens it"
- [ ] Cadence: 3 turns

**Hearthbound:**
- [ ] Kindle the Hearth heals and applies Resolve (2 turns)
- [ ] First heal of the combat is ~20% higher than subsequent heals
- [ ] Resolve reduces incoming damage by 25%
- [ ] Cadence: 2 turns

**Streetcraft:**
- [ ] Opportunist Strike crits harder on enemies below 50% HP
- [ ] Slip status applies after ability use — enemy attacks at disadvantage next turn
- [ ] Cadence: 2 turns

**Ironblood:**
- [ ] Crushing Blow applies Staggered to enemy (1 turn — skips retaliation)
- [ ] Iron Stance activates on player for 1 turn after ability
- [ ] Cadence: 3 turns

**Shadowbound:**
- [ ] Veil Step applies Stealth (2 turns) — no damage, skips retaliation
- [ ] Next normal attack while in Stealth deals doubled damage
- [ ] Stealth consumed on hit
- [ ] First attack each combat has advantage (roll twice take higher)
- [ ] Cadence: 3 turns

**Warden:**
- [ ] Stand Fast applies Resolve to player + Taunt to enemy
- [ ] Taunt: enemy attacks at disadvantage (lower of two rolls)
- [ ] Bulwark passive: below 50% HP, enemy deals -1 damage automatically
- [ ] Cadence: 3 turns

**General:**
- [ ] Status lines appear in combat log when active
- [ ] Status counters display in the status bar above combat log
- [ ] All statuses tick down correctly each round
- [ ] Ability button shows cooldown countdown
- [ ] New fight always starts with clean statuses ({}) and cooldown 0
