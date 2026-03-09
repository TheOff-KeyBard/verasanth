# Cursor Prompt — Dynamic Encounter System
# Touch index.js and index.html

---

Implement automatic combat encounters. Players should never need to press
"Fight" — the world initiates danger. This prompt covers Phase 1 (movement
triggers and linger encounters). Reputation, predator AI, and roaming monsters
are Phase 2.

Read the full prompt before starting.

---

## WHAT EXISTS

- `FIGHTABLE_LOCATIONS` — set of location IDs where combat is allowed
- `/api/combat/start` — starts combat with a random enemy for the player's floor
- `/api/move` — moves player, returns room data including `fightable: bool`
- `randomEnemy(location)` — picks a random enemy from the floor pool
- `player_flags` table — key/value store for per-player state
- `getFlag(db, uid, key)` / `setFlag(db, uid, key, val)` — flag helpers

---

## STEP 1 — Encounter Schema

Add one column to `players` table for tracking last encounter time.
Add this to `initDb()`:

```javascript
try {
  await dbRun(db, `ALTER TABLE players ADD COLUMN last_encounter_at INTEGER DEFAULT 0`);
} catch {}
```

---

## STEP 2 — Encounter Chance Tables

Add this constant near `FIGHTABLE_LOCATIONS`:

```javascript
// Base encounter chance (0–100) per location on entry
// Aligned with actual room IDs from data/sewer_nodes.js and data/combat.js
const ENCOUNTER_CHANCES = {
  // Floor 1 — The Drains
  overflow_channel:     35,
  broken_pipe_room:    45,
  vermin_nest:         50,
  rusted_gate:         40,
  // Floor 2 — Forgotten Channels
  fungal_bloom_chamber: 45,
  collapsed_passage:   42,
  echoing_hall:        48,
  spore_garden:        50,
  cracked_aqueduct:    44,
  // Floor 3 — Cistern Depths
  flooded_hall:        50,
  submerged_tunnel:    48,
  broken_pump_room:    52,
  drowned_vault:       55,
  sluice_gate:         50,
  // Floor 4 — Mechanist's Spine
  gear_hall:           52,
  steam_vent_corridor: 48,
  broken_regulator_chamber: 55,
  iron_walkway:        50,
  heart_pump:          52,
  pressure_valve_shaft: 48,
  // Floor 5 — Sump Cathedral + Foundation
  ash_pillar_hall:     55,
  whispering_chamber:  58,
  rune_lit_corridor:   55,
  cathedral_floor:    60,
  ash_heart_chamber:   65,
  sump_pit:            55,
  sewer_deep_foundation: 65,
};

// Sensory cues — implementation uses prefix matching (e.g. overflow, flooded, cathedral)
// See data/combat.js ENCOUNTER_CUES for full prefix list
const ENCOUNTER_CUES = {
  overflow: [
    "*The water ripples near your feet. The current isn't strong enough to do that.*",
    "*Something moves in the black water. It is not the current.*",
    "*A shape drifts below the surface, then holds still.*",
  ],
  flooded: [
    "*Hands burst from the water.*",
    "*Something rises from the flooded floor.*",
    "*The reflection in the water moves before you do.*",
  ],
  drowned: [
    "*One of the stone shelves is empty that wasn't before.*",
    "*The iron door behind you is open again.*",
    "*Something was disturbed here recently. The dust says so.*",
  ],
  sewer_deep_foundation: [
    "*The plinth at the center vibrates under your hand.*",
    "*The air moves. There is no source for the air movement.*",
    "*Something in this room has been waiting.*",
  ],
  default: [
    "*Something moves in the dark.*",
    "*You are not alone here.*",
    "*The silence changes quality.*",
  ],
};
```

---

## STEP 3 — Core Encounter Roll Function

Add this function near `randomEnemy()`:

```javascript
function rollEncounter(location, modifiers = {}) {
  const base = ENCOUNTER_CHANCES[location] ?? 0;
  if (base === 0) return false;

  const {
    woundedBonus    = 0,   // +20 if player is below 50% HP
    lootBonus       = 0,   // +10 if carrying bloodied/scent items
    crimeHeatBonus  = 0,   // +15 if crime_heat >= 7
    postFightBonus  = 0,   // +15 immediately after a kill (noise spike)
  } = modifiers;

  const total = base + woundedBonus + lootBonus + crimeHeatBonus + postFightBonus;
  return Math.random() * 100 < Math.min(total, 85); // cap at 85% — always a chance to breathe
}

function getEncounterCue(location) {
  // Match by prefix
  for (const [prefix, cues] of Object.entries(ENCOUNTER_CUES)) {
    if (location.startsWith(prefix) || location === prefix) {
      return cues[Math.floor(Math.random() * cues.length)];
    }
  }
  const fallback = ENCOUNTER_CUES.default;
  return fallback[Math.floor(Math.random() * fallback.length)];
}
```

---

## STEP 4 — Wire Encounters into /api/move

Find the `/api/move` handler. After the player's location is updated and
before the `return json(...)`, add the encounter roll:

```javascript
// ── Dynamic encounter check ───────────────────────────────────
let encounterData = null;

if (FIGHTABLE_LOCATIONS.has(dest)) {
  // Cooldown: minimum 12 seconds between encounters
  const now = Date.now();
  const lastEnc = row.last_encounter_at || 0;
  const onCooldown = (now - lastEnc) < 12000;

  if (!onCooldown) {
    // Build modifiers
    const hp = await getPlayerHp(db, uid, row);
    const hpPct = hp.max > 0 ? hp.current / hp.max : 1;
    const woundedBonus   = hpPct < 0.5 ? 20 : 0;

    // Check crime heat for reputation modifier
    let crimeHeatBonus = 0;
    try {
      const charRow = await dbGet(db, 'SELECT crime_heat FROM characters WHERE user_id=?', [uid]);
      if (charRow?.crime_heat >= 7) crimeHeatBonus = 15;
    } catch {}

    // Check if player just killed something (post-fight noise spike)
    const postFight = await getFlag(db, uid, 'post_fight_noise');
    const postFightBonus = postFight ? 15 : 0;
    if (postFight) await setFlag(db, uid, 'post_fight_noise', 0);

    const triggered = rollEncounter(dest, {
      woundedBonus, crimeHeatBonus, postFightBonus,
    });

    if (triggered) {
      // Update last encounter timestamp
      await dbRun(db, 'UPDATE players SET last_encounter_at=? WHERE user_id=?', [now, uid]);

      // Get sensory cue and enemy
      const cue   = getEncounterCue(dest);
      const enemy = randomEnemy(dest);

      // Auto-start combat state
      const state = {
        enemy_id: enemy.id, enemy_name: enemy.name,
        enemy_hp: enemy.hp, enemy_hp_max: enemy.hp,
        player_hp: hp.current, player_hp_max: hp.max,
        ability_used: false, turn: 1, location: dest,
        auto_triggered: true,
      };
      await dbRun(db,
        'INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json',
        [uid, JSON.stringify(state)]);

      encounterData = {
        triggered: true,
        cue,
        enemy_name: enemy.name,
        enemy_desc: enemy.desc || '',
        combat_state: state,
      };
    }
  }
}
// ── End encounter check ───────────────────────────────────────
```

Update the final `return json(...)` to include encounter data:

```javascript
return json({
  location: dest, name: destRoom.name, description: destRoom.description,
  exits: Object.keys(destRoom.exits || {}),
  exit_map: destRoom.exits || {},
  objects: Object.keys(destRoom.objects || {}),
  items: [], npcs: npcsHere, ambient,
  fightable: FIGHTABLE_LOCATIONS.has(dest),
  encounter: encounterData,   // ← add this
});
```

---

## STEP 5 — Post-Fight Noise Flag

In the combat victory handler (around the `enemyHp <= 0` block), after the
loot drops and before the return, set the noise spike flag:

```javascript
// Noise spike — increases encounter chance in next room
await setFlag(db, uid, 'post_fight_noise', 1);
```

---

## STEP 6 — Linger Encounters (/api/linger)

Add a new endpoint for the frontend to poll while the player is idle in a
fightable room:

```javascript
// POST /api/linger — call every 45s while idle in a fightable room
if (path === '/api/linger' && method === 'POST') {
  const row = await getPlayerSheet(db, uid);
  if (!row) return err('No character.', 404);
  if (!FIGHTABLE_LOCATIONS.has(row.location)) return json({ encounter: null });

  const existing = await dbGet(db, 'SELECT 1 FROM combat_state WHERE user_id=?', [uid]);
  if (existing) return json({ encounter: null }); // already in combat

  const now = Date.now();
  const lastEnc = row.last_encounter_at || 0;
  if ((now - lastEnc) < 12000) return json({ encounter: null });

  const hp = await getPlayerHp(db, uid, row);
  const hpPct = hp.max > 0 ? hp.current / hp.max : 1;

  // Linger base: 20%, scales up with time spent and wounds
  // Frontend sends how many linger ticks have elapsed
  const { ticks = 1 } = body;
  const lingerBase    = Math.min(20 + (ticks * 8), 60); // caps at 60%
  const woundedBonus  = hpPct < 0.5 ? 25 : 0;

  const triggered = Math.random() * 100 < (lingerBase + woundedBonus);

  if (!triggered) {
    // Return atmospheric cue without encounter
    const cue = getEncounterCue(row.location);
    return json({ encounter: null, ambient: cue });
  }

  await dbRun(db, 'UPDATE players SET last_encounter_at=? WHERE user_id=?', [now, uid]);

  const cue   = getEncounterCue(row.location);
  const enemy = randomEnemy(row.location);
  const state = {
    enemy_id: enemy.id, enemy_name: enemy.name,
    enemy_hp: enemy.hp, enemy_hp_max: enemy.hp,
    player_hp: hp.current, player_hp_max: hp.max,
    ability_used: false, turn: 1, location: row.location,
    auto_triggered: true,
  };
  await dbRun(db,
    'INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json',
    [uid, JSON.stringify(state)]);

  return json({
    encounter: {
      triggered: true,
      cue,
      enemy_name: enemy.name,
      enemy_desc: enemy.desc || '',
      combat_state: state,
    }
  });
}
```

---

## STEP 7 — Frontend: Handle Auto-Encounter on Move

Find `doMove()` in index.html. Currently it handles the move response and
updates the room. After updating the room display, add encounter handling:

```javascript
async function doMove(dir) {
  try {
    const data = await POST('/api/move', { direction: dir });
    renderRoom(data);
    await refreshSidebar();

    // ── Auto-encounter check ──────────────────────────────────
    if (data.encounter?.triggered) {
      await handleAutoEncounter(data.encounter);
    } else if (data.ambient) {
      // Ambient cue with no encounter
      log(`<em>${data.ambient}</em>`);
    }
  } catch(e) {
    log(`<em>${e.message}</em>`);
  }
}
```

Add the encounter handler function:

```javascript
async function handleAutoEncounter(enc) {
  // Show sensory cue
  log(`<em>${enc.cue}</em>`);

  // Brief pause — let the cue land
  await new Promise(r => setTimeout(r, 900));

  // Show enemy arrival
  log(`<em>*${enc.enemy_name} emerges from the dark.*</em>`);
  if (enc.enemy_desc) log(`<em>${enc.enemy_desc}</em>`);

  // Brief pause before combat UI opens
  await new Promise(r => setTimeout(r, 600));

  // Open combat overlay with existing state
  combatState = enc.combat_state;
  playerMaxHp = enc.combat_state.player_hp_max;
  openCombatOverlay(enc.combat_state);
}
```

Find the existing `openCombatOverlay` function or the code that populates
the combat UI. If it doesn't exist as a named function, extract it from
`doFight()` into a reusable function:

```javascript
function openCombatOverlay(state) {
  document.getElementById('combat-enemy-name').textContent = state.enemy_name;
  document.getElementById('enemy-hp-text').textContent = `${state.enemy_hp} / ${state.enemy_hp_max}`;
  document.getElementById('enemy-bar').style.width = '100%';
  document.getElementById('combat-player-hp-text').textContent =
    `${state.player_hp} / ${state.player_hp_max}`;
  document.getElementById('player-bar').style.width =
    Math.max(0, (state.player_hp / state.player_hp_max) * 100) + '%';
  document.getElementById('combat-log').innerHTML = '';
  document.getElementById('combat-overlay').classList.add('open');
}
```

Then update `doFight()` to use it:

```javascript
async function doFight() {
  try {
    const data = await POST('/api/combat/start', {});
    combatState = data;
    playerMaxHp = data.player_hp_max;
    log(`<em>${data.message}</em>`);
    openCombatOverlay(data);
  } catch(e) {
    log(`<em>${e.message}</em>`);
  }
}
```

---

## STEP 8 — Frontend: Linger Polling

Add a linger timer that fires while the player is idle in a fightable room.
The timer starts on move, resets on every action.

```javascript
let lingerTimer   = null;
let lingerTicks   = 0;
let currentRoomFightable = false;

function startLingerTimer(isFightable) {
  stopLingerTimer();
  currentRoomFightable = isFightable;
  lingerTicks = 0;
  if (!isFightable) return;

  lingerTimer = setInterval(async () => {
    // Don't linger-check if already in combat
    if (combatState) return;
    lingerTicks++;
    try {
      const data = await POST('/api/linger', { ticks: lingerTicks });
      if (data.encounter?.triggered) {
        stopLingerTimer();
        await handleAutoEncounter(data.encounter);
      } else if (data.ambient) {
        log(`<em>${data.ambient}</em>`);
      }
    } catch {}
  }, 45000); // 45 seconds
}

function stopLingerTimer() {
  if (lingerTimer) {
    clearInterval(lingerTimer);
    lingerTimer = null;
    lingerTicks = 0;
  }
}
```

Wire into `doMove()` — after `renderRoom(data)`, add:
```javascript
startLingerTimer(data.fightable);
```

Wire into combat start — stop the timer when combat begins:
In `handleAutoEncounter()` add `stopLingerTimer()` before opening combat overlay.
In `doFight()` add `stopLingerTimer()` before the POST call.

Wire into combat end — restart when combat resolves:
In `combatAction()`, after a `victory` or `death` result, add:
```javascript
startLingerTimer(currentRoomFightable);
```

---

## STEP 9 — Hide the Fight Button in Fightable Rooms

The "Fight" button should still exist as a fallback but shouldn't be the
primary prompt. Update it to be less prominent:

Find the Fight button in the room render. Change its label and style to feel
more like a last resort than a menu option. Find wherever the Fight button
is rendered (likely in `renderRoom()`) and update:

```javascript
// Find the fight button render
if (data.fightable && !combatState) {
  const fightBtn = document.createElement('button');
  fightBtn.className = 'btn fight-btn';
  fightBtn.textContent = 'Engage';
  fightBtn.title = 'Manually initiate combat';
  fightBtn.onclick = doFight;
  // Add to actions row
}
```

Add CSS to make it less visually dominant than exits:
```css
.fight-btn {
  opacity: 0.55;
  font-size: 0.8rem;
  border-color: rgba(255,92,122,0.2);
  color: var(--muted);
}
.fight-btn:hover {
  opacity: 1;
  border-color: rgba(255,92,122,0.5);
  color: var(--danger);
}
```

---

## VERIFICATION CHECKLIST

**Movement triggers:**
- [ ] Moving into `overflow_channel` (or other fightable sewer room) sometimes auto-starts combat
- [ ] Moving into a non-fightable room (market_square, tavern) never triggers
- [ ] Sensory cue appears in log before enemy name
- [ ] 0.9s pause between cue and enemy arrival feels right
- [ ] Combat overlay opens automatically
- [ ] 12-second cooldown prevents back-to-back spawns when moving quickly

**Modifiers:**
- [ ] Player below 50% HP increases encounter chance (verify via repeated testing)
- [ ] Post-fight flag is set on victory and cleared after next move

**Linger:**
- [ ] Staying in a fightable room for ~45s triggers an atmospheric cue
- [ ] Longer stays (2+ ticks) increase encounter chance
- [ ] Timer resets on movement
- [ ] Timer stops when combat starts

**Fight button:**
- [ ] Still present as fallback but visually de-emphasized
- [ ] Still works as a manual trigger

---

## WHAT THIS DOES NOT DO (Phase 2)

- Predator AI (follow across rooms, delayed spawn)
- Reputation-based enemy types (bounty hunters, vigilantes)
- Scent/loot triggers (carrying specific items increases chance)
- Environmental triggers (sewer tremors, fungal bloom from cron conditions)
- Roaming monsters (enemies that move between rooms)
- PvPvE shared encounter spawns
- Ambush variants (multi-enemy spawns, ceiling drops)
- Event encounters (breaking objects triggers enemies)

These all build on this foundation — Phase 1 gets the world feeling alive,
Phase 2 makes it feel personal.
