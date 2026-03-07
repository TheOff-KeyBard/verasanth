# Cursor Prompt — Dynamic Encounter System: Phase 2
# Touch index.js and index.html
# Phase 1 (movement triggers, linger polling, encounter cooldown,
# post-fight noise spike) is already implemented.
# This prompt builds on that foundation.

---

## WHAT PHASE 1 DELIVERED

- `ENCOUNTER_CHANCES` per location
- `rollEncounter(location, modifiers)` with wounded/crime/post-fight bonuses
- `getEncounterCue(location)` — sensory text before combat starts
- Auto-combat on move into fightable rooms
- 12s encounter cooldown via `last_encounter_at` on players table
- `/api/linger` — polls every 45s, escalating chance per tick
- `post_fight_noise` flag — noise spike after a kill
- Frontend: `handleAutoEncounter()`, `startLingerTimer()`, `openCombatOverlay()`

---

## PHASE 2 OVERVIEW — FOUR SYSTEMS

1. **Scent / Loot Triggers** — carried items increase encounter chance
2. **Predator AI** — enemies that follow across rooms before attacking
3. **Reputation Encounters** — alignment score changes who hunts you
4. **Ambush Variants** — multi-enemy and environmental spawns

Read all four sections before starting. They share data structures.

---

## SYSTEM 1 — SCENT / LOOT TRIGGERS

### Concept
Certain carried items attract specific enemy types. The bonus is applied
to the encounter roll in `/api/move` and `/api/linger`.

### Step 1 — Scent Item Table

Add near `ENCOUNTER_CHANCES`:

```javascript
// Items that attract enemies, and which enemy pools they bias toward
const SCENT_ITEMS = {
  // Raw biological material
  rat_king_musk:       { bonus: 25, label: "The musk on your pack draws attention." },
  slime_residue:       { bonus: 15, label: "Something in the dark smells the residue you carry." },
  sewer_fungi:         { bonus: 10, label: "The fungi spores drift from your pack." },
  deep_vent_ash:       { bonus: 10, label: "The ash carries heat. Something notices." },
  // Blood / combat residue
  flood_record_page:   { bonus: 5,  label: "Old paper. Old blood. Something remembers." },
  heart_pump_fragment: { bonus: 20, label: "The mechanical pulse in your pack is audible to the wrong things." },
  custodian_core:      { bonus: 30, label: "The core hums. Everything in the dark hears it." },
  // High value
  drowned_relic:       { bonus: 20, label: "Old magic radiates from what you carry." },
};
```

### Step 2 — Scent Modifier in rollEncounter calls

In `/api/move`, after computing `woundedBonus` and `crimeHeatBonus`,
add a scent check:

```javascript
// Scent modifier — check inventory for attractant items
let scentBonus = 0;
let scentLabel = null;
try {
  const invRows = await dbAll(db,
    'SELECT item, qty FROM inventory WHERE user_id=? AND qty > 0', [uid]);
  for (const row of invRows) {
    const scentDef = SCENT_ITEMS[row.item];
    if (scentDef && scentDef.bonus > scentBonus) {
      scentBonus = scentDef.bonus;
      scentLabel = scentDef.label;
    }
  }
} catch {}
```

Pass `scentBonus` into `rollEncounter()`:
```javascript
const triggered = rollEncounter(dest, {
  woundedBonus, crimeHeatBonus, postFightBonus, scentBonus,
});
```

Update `rollEncounter` signature to include it:
```javascript
function rollEncounter(location, modifiers = {}) {
  const {
    woundedBonus   = 0,
    lootBonus      = 0,
    crimeHeatBonus = 0,
    postFightBonus = 0,
    scentBonus     = 0,   // ← add
  } = modifiers;
  const total = base + woundedBonus + lootBonus + crimeHeatBonus
              + postFightBonus + scentBonus;
  // ... rest unchanged
}
```

When an encounter triggers and `scentLabel` is set, prepend it to the cue:
```javascript
if (triggered) {
  const rawCue = getEncounterCue(dest);
  const cue = scentLabel ? `${scentLabel}\n\n${rawCue}` : rawCue;
  // ... rest of encounter block unchanged
}
```

Apply the same scent check in `/api/linger`.

---

## SYSTEM 2 — PREDATOR AI

### Concept
Some enemies don't spawn immediately on entry. They appear in the next
room, creating a beat of dread between detection and attack.

Predator state lives in `player_flags`:
- `predator_id` — enemy id being tracked (e.g. `sewer_horror`)
- `predator_location` — room where the predator first sensed the player
- `predator_ticks` — how many moves the player has made since detection

### Step 1 — Predator Enemy List

Add near `SCENT_ITEMS`:

```javascript
// Enemies that stalk rather than ambush immediately
// chance = probability this enemy becomes a predator instead of
// spawning instantly (only applies in their eligible rooms)
const PREDATOR_ENEMIES = {
  sewer_horror:      { chance: 0.7, eligible: ['sewer_mid_cistern','sewer_deep_threshold','sewer_deep_foundation'] },
  hollow_guard:      { chance: 0.5, eligible: ['sewer_mid_flooded','sewer_mid_barracks','sewer_gate'] },
  gearbound_sentinel:{ chance: 0.4, eligible: ['sewer_deep_vault','sewer_deep_foundation'] },
};
```

### Step 2 — Predator Detection in /api/move

In the encounter block in `/api/move`, after `rollEncounter` returns true
and before creating `combat_state`, check if this enemy should stalk:

```javascript
const enemy = randomEnemy(dest);
const predatorDef = PREDATOR_ENEMIES[enemy.id];
const shouldStalk = predatorDef
  && predatorDef.eligible.includes(dest)
  && Math.random() < predatorDef.chance
  && !(await getFlag(db, uid, 'predator_id')); // only one predator at a time

if (shouldStalk) {
  // Set predator flags — no combat yet
  await setFlag(db, uid, 'predator_id', enemy.id);
  await setFlag(db, uid, 'predator_ticks', 0);

  // Return a detection cue instead of combat
  encounterData = {
    triggered: false,
    predator_detected: true,
    cue: getPredatorCue(dest, enemy.id),
  };
} else {
  // Normal immediate combat — existing block unchanged
  const state = { ... };
  await dbRun(db, 'INSERT INTO combat_state ...');
  encounterData = { triggered: true, cue, enemy_name: enemy.name, ... };
}
```

### Step 3 — Predator Cue Text

```javascript
const PREDATOR_CUES = {
  sewer_horror: [
    "*The water in the cistern displaces. Something large shifted below.*",
    "*A sound behind you. Not footsteps. Something dragging.*",
    "*The torchlight dims slightly, as if something nearby is absorbing it.*",
  ],
  hollow_guard: [
    "*Armor scrapes against stone somewhere behind you. Slow. Deliberate.*",
    "*You hear breathing that has no rhythm — mechanical, repeated, wrong.*",
    "*A shadow moves across the far wall. Nothing cast it.*",
  ],
  gearbound_sentinel: [
    "*A clicking sound begins. Regular. Getting closer.*",
    "*The air smells of hot iron and old oil.*",
    "*Something in the walls is moving alongside you.*",
  ],
  default: [
    "*You feel watched.*",
    "*Something is following you.*",
    "*The silence behind you changes.*",
  ],
};

function getPredatorCue(location, enemyId) {
  const cues = PREDATOR_CUES[enemyId] || PREDATOR_CUES.default;
  return cues[Math.floor(Math.random() * cues.length)];
}
```

### Step 4 — Predator Strikes on Next Move

At the START of the `/api/move` handler, before the encounter block,
add a predator check:

```javascript
// ── Predator follow-through ──────────────────────────────────
const predatorId = await getFlag(db, uid, 'predator_id');
if (predatorId && FIGHTABLE_LOCATIONS.has(dest)) {
  let ticks = parseInt(await getFlag(db, uid, 'predator_ticks') || 0) + 1;
  await setFlag(db, uid, 'predator_ticks', ticks);

  // Predator always strikes by tick 2 — tick 1 is the stalk, tick 2 is the attack
  const strikes = ticks >= 2;

  if (strikes) {
    // Clear predator flags
    await setFlag(db, uid, 'predator_id', null);
    await setFlag(db, uid, 'predator_ticks', null);

    // Build combat with the tracked enemy
    const enemyDef = COMBAT_DATA.enemies[predatorId];
    if (enemyDef) {
      const hp = await getPlayerHp(db, uid, row);
      const state = {
        enemy_id: predatorId, enemy_name: enemyDef.name,
        enemy_hp: enemyDef.hp, enemy_hp_max: enemyDef.hp,
        player_hp: hp.current, player_hp_max: hp.max,
        ability_used: false, turn: 1, location: dest,
        auto_triggered: true, predator_strike: true,
      };
      await dbRun(db,
        'INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json',
        [uid, JSON.stringify(state)]);

      // Skip the normal encounter roll — predator overrides it
      encounterData = {
        triggered: true,
        predator_strike: true,
        cue: `*It found you.*`,
        enemy_name: enemyDef.name,
        enemy_desc: enemyDef.desc || '',
        combat_state: state,
      };

      // Skip the rest of the encounter block
      // (set a flag to bypass rollEncounter below)
    }
  }
}
// ── End predator check ───────────────────────────────────────
```

If the player flees to a non-fightable room (tavern, market_square), clear
the predator — they escaped:

```javascript
if (predatorId && !FIGHTABLE_LOCATIONS.has(dest)) {
  await setFlag(db, uid, 'predator_id', null);
  await setFlag(db, uid, 'predator_ticks', null);
  // Return a short escape cue as ambient
  ambient = "*Whatever was following you has stopped. For now.*";
}
```

### Step 5 — Frontend: Predator Handling

In `doMove()`, handle the `predator_detected` response:

```javascript
if (data.encounter?.predator_detected) {
  // Just show the cue — no combat, no overlay
  log(`<em>${data.encounter.cue}</em>`);
} else if (data.encounter?.predator_strike) {
  // Predator caught up — different intro beat
  log(`<em>*Something moves in the dark behind you.*</em>`);
  await new Promise(r => setTimeout(r, 700));
  log(`<em>${data.encounter.cue}</em>`);
  await new Promise(r => setTimeout(r, 500));
  await handleAutoEncounter(data.encounter);
} else if (data.encounter?.triggered) {
  await handleAutoEncounter(data.encounter);
}
```

---

## SYSTEM 3 — REPUTATION ENCOUNTERS

### Concept
Alignment score (mercy/order/chaos from existing system) changes
which enemies are added to the encounter pool and modifies base chance.

### Step 1 — Reputation Encounter Pools

```javascript
const REPUTATION_SPAWNS = {
  // High crime heat (>= 8) — bounty hunters
  high_crime: {
    threshold_flag: 'crime_heat',
    threshold_value: 8,
    locations: ['market_square','north_road','south_road','east_road'],
    enemy_override: 'city_watchman',   // must exist in COMBAT_DATA.enemies
    cue: "*A figure in city colors steps from the shadow ahead. Hand on blade.*",
    chance: 60,
  },
  // High chaos alignment — unstable spawns, extra enemies
  high_chaos: {
    threshold_flag: 'alignment_chaos',
    threshold_value: 15,
    bonus: 20,
    cue_suffix: "*The city's mood matches yours — dangerous.*",
  },
  // High order alignment — enemies hesitate, reduced base chance
  high_order: {
    threshold_flag: 'alignment_order',
    threshold_value: 15,
    bonus: -15,  // negative — reduces encounter chance
  },
  // High mercy — chance to get wounded NPC instead of enemy
  high_mercy: {
    threshold_flag: 'alignment_mercy',
    threshold_value: 15,
    wounded_npc_chance: 0.25,  // 25% chance to get narrative instead of fight
  },
};
```

### Step 2 — Reputation Check in /api/move

After computing other modifiers, add:

```javascript
let reputationBonus = 0;
let reputationCueSuffix = null;
let enemyOverride = null;
let woundedNpcChance = 0;

try {
  const charRow = await dbGet(db,
    'SELECT crime_heat, alignment_chaos, alignment_order, alignment_mercy FROM characters WHERE user_id=?',
    [uid]);

  if (charRow) {
    // Crime heat — bounty hunters in city locations
    if ((charRow.crime_heat || 0) >= 8 && !FIGHTABLE_LOCATIONS.has(dest)) {
      const rep = REPUTATION_SPAWNS.high_crime;
      if (Math.random() * 100 < rep.chance) {
        enemyOverride = rep.enemy_override;
        encounterData = {
          triggered: true,
          cue: rep.cue,
          enemy_name: COMBAT_DATA.enemies[rep.enemy_override]?.name || 'City Watchman',
          enemy_desc: COMBAT_DATA.enemies[rep.enemy_override]?.desc || '',
          combat_state: null, // built below
        };
        // Build combat state with override enemy
        const overrideEnemy = COMBAT_DATA.enemies[rep.enemy_override];
        if (overrideEnemy) {
          const hp = await getPlayerHp(db, uid, row);
          const state = {
            enemy_id: rep.enemy_override,
            enemy_name: overrideEnemy.name,
            enemy_hp: overrideEnemy.hp,
            enemy_hp_max: overrideEnemy.hp,
            player_hp: hp.current, player_hp_max: hp.max,
            ability_used: false, turn: 1, location: dest,
            auto_triggered: true,
          };
          await dbRun(db,
            'INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json',
            [uid, JSON.stringify(state)]);
          encounterData.combat_state = state;
        }
      }
    }

    // Chaos — boost encounter rate in sewer
    if ((charRow.alignment_chaos || 0) >= 15 && FIGHTABLE_LOCATIONS.has(dest)) {
      reputationBonus += REPUTATION_SPAWNS.high_chaos.bonus;
      reputationCueSuffix = REPUTATION_SPAWNS.high_chaos.cue_suffix;
    }

    // Order — reduce encounter rate
    if ((charRow.alignment_order || 0) >= 15) {
      reputationBonus += REPUTATION_SPAWNS.high_order.bonus;
    }

    // Mercy — wounded NPC intercept chance
    if ((charRow.alignment_mercy || 0) >= 15) {
      woundedNpcChance = REPUTATION_SPAWNS.high_mercy.wounded_npc_chance;
    }
  }
} catch {}
```

Pass `reputationBonus` into `rollEncounter`. If `woundedNpcChance` fires,
return a narrative event instead of combat (see System 4).

---

## SYSTEM 4 — AMBUSH VARIANTS + NARRATIVE EVENTS

### Concept
Not all encounters are standard 1v1 combat. Rare variants add texture.

### Type A — Multi-Enemy Ambush (rare, high-tension rooms only)

In the encounter block, after `rollEncounter` returns true, roll a small
chance for a multi-enemy spawn:

```javascript
const AMBUSH_ROOMS = new Set([
  'sewer_deep_foundation', 'sewer_deep_threshold',
  'sewer_mid_cistern', 'sewer_mid_flooded',
]);

const isAmbush = AMBUSH_ROOMS.has(dest) && Math.random() < 0.12; // 12% of encounters

if (isAmbush) {
  const enemy1 = randomEnemy(dest);
  const enemy2 = randomEnemy(dest);
  // Store both in combat state — frontend handles display
  // For now: spawn enemy1, flag that enemy2 joins on round 2
  state.ambush_pending = { enemy_id: enemy2.id, enemy_name: enemy2.name,
                           enemy_hp: enemy2.hp, joins_on_turn: 2 };
  encounterData.cue = getAmbushCue(dest);
  encounterData.is_ambush = true;
}
```

```javascript
const AMBUSH_CUES = {
  sewer_deep_foundation: "*The pattern on the floor glows. The room wakes up.*",
  sewer_deep_threshold:  "*Two shapes detach from the wall simultaneously.*",
  sewer_mid_cistern:     "*Something erupts from the water as something else drops from above.*",
  sewer_mid_flooded:     "*Hands burst from the water on both sides.*",
  default:               "*They were waiting.*",
};

function getAmbushCue(location) {
  return AMBUSH_CUES[location] || AMBUSH_CUES.default;
}
```

In `/api/combat/action`, when `ambush_pending` exists and
`state.turn >= state.ambush_pending.joins_on_turn`:

```javascript
if (state.ambush_pending && state.turn >= state.ambush_pending.joins_on_turn
    && !state.ambush_joined) {
  // Merge second enemy HP into current enemy as reinforcement
  // Simplest approach: add HP to current enemy, update name
  state.enemy_hp     += state.ambush_pending.enemy_hp;
  state.enemy_hp_max += state.ambush_pending.enemy_hp;
  state.enemy_name    = `${state.enemy_name} + ${state.ambush_pending.enemy_name}`;
  state.ambush_joined = true;
  // Append to combat message
  combatResult.join_message =
    `*${state.ambush_pending.enemy_name} emerges from the dark.*`;
}
```

### Type B — Wounded NPC Narrative Event

When `woundedNpcChance` fires (mercy alignment), instead of combat:

```javascript
const WOUNDED_NPC_EVENTS = [
  {
    cue: "*A figure slumps against the wall ahead. Not dead. Not safe.*",
    text: "A wounded scavenger. Alive, barely. They look at you the way people look at the last thing they expect to see.",
    choices: ["help", "pass", "take_what_they_have"],
    reward_help: { ash_marks: 0, flag: 'helped_wounded_1', xp: 15,
                   response: "You stop. You help. They live. For now. They press something into your hand — old, worn, worth nothing to anyone who doesn't know what it is." },
    reward_pass: { flag: 'passed_wounded_1',
                   response: "You walk past. They watch you go." },
  },
  {
    cue: "*Something is crying in the dark ahead. It sounds human.*",
    text: "A child — no, something that looks like a child. The sewer does not produce children. You know this.",
    choices: ["approach", "flee"],
    reward_approach: { flag: 'approached_false_child',
                       response: "It looks up. Its eyes are wrong. It smiles. Then it runs — not away. Deeper in. You hear it for several minutes after, getting further away. Then nothing.",
                       alignment_chaos: 1 },
  },
];

// Return as a non-combat encounter response
return json({
  location: dest, name: destRoom.name, /* ... other fields ... */
  encounter: {
    triggered: false,
    narrative_event: true,
    event: WOUNDED_NPC_EVENTS[Math.floor(Math.random() * WOUNDED_NPC_EVENTS.length)],
  }
});
```

Add a `/api/encounter/choice` endpoint to handle player choices:

```javascript
if (path === '/api/encounter/choice' && method === 'POST') {
  const { choice, event_id } = body;
  // Apply reward based on choice
  // Set appropriate flags, award XP, adjust alignment
  // Return narrative response text
}
```

### Frontend: Narrative Event Display

In `doMove()`, handle `narrative_event`:

```javascript
if (data.encounter?.narrative_event) {
  await handleNarrativeEvent(data.encounter.event);
}
```

```javascript
async function handleNarrativeEvent(event) {
  log(`<em>${event.cue}</em>`);
  await new Promise(r => setTimeout(r, 1000));
  log(event.text);

  // Render choice buttons in the room actions area
  // (reuse existing button-row pattern)
  renderNarrativeChoices(event);
}
```

---

## VERIFICATION CHECKLIST

**Scent triggers:**
- [ ] Carrying `custodian_core` noticeably increases encounter frequency
- [ ] Scent label appears before the sensory cue when it fires
- [ ] Highest-bonus item is used (not additive) — one label per encounter

**Predator AI:**
- [ ] Entering `sewer_mid_cistern` sometimes shows detection cue, not combat
- [ ] Next room entered after detection auto-starts combat (no roll needed)
- [ ] Moving to tavern or market_square after detection: escape message, no combat
- [ ] Only one predator tracked at a time
- [ ] Predator enemies are only sewer_horror, hollow_guard, gearbound_sentinel

**Reputation:**
- [ ] Player with crime_heat >= 8 can be jumped by watchman in city streets
- [ ] High chaos player has visibly higher encounter rate in sewer
- [ ] High order player has visibly lower encounter rate
- [ ] High mercy player occasionally gets narrative event instead of combat

**Ambush:**
- [ ] Second enemy joins at turn 2 with join_message in combat log
- [ ] Enemy name updates to show both enemies
- [ ] Combined HP is additive (not doubled)
- [ ] Ambush only fires in the 4 designated deep rooms

**Narrative events:**
- [ ] Wounded NPC only appears with high mercy alignment
- [ ] Choice buttons render correctly
- [ ] Choosing "help" sets flag and awards XP
- [ ] Alignment adjustments apply correctly

---

## WHAT PHASE 3 WILL ADD

- **Roaming monsters** — enemies that move between rooms on a timer,
  creating footstep cues in adjacent rooms before they arrive
- **Environmental attacks** — gas ignition, collapsing walkways,
  rising water (requires cron job or Durable Object timer)
- **PvPvE collision** — shared encounter spawns when two players
  enter the same room (requires WebSocket / Durable Object)
- **Boss spawn conditions** — high noise + many kills + city mood spike
  triggers a boss encounter with pre-fight atmospheric buildup
