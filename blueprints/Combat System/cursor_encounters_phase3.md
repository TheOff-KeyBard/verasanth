# Cursor Prompt — Dynamic Encounter System: Phase 3
# Touch index.js and index.html
# Phase 1 (movement triggers, linger, cooldown, noise spike) — DONE
# Phase 2 (scent, predator AI, reputation, ambush variants) — DONE
# This prompt adds the final three systems.

---

## WHAT PHASE 3 DELIVERS

1. **Roaming Monsters** — enemies that move through the sewer on a timer,
   leaving footstep cues in adjacent rooms before they arrive
2. **Environmental Hazards** — the sewer itself attacks: gas, rising water,
   fungal spores, collapsing walkways
3. **Boss Spawn Conditions** — earned, telegraphed, cinematic

Read all three sections before starting. They share the roaming
monster table and the `sewer_conditions` flag infrastructure.

---

## SYSTEM 1 — ROAMING MONSTERS

### Concept
A small number of powerful enemies exist as persistent entities that move
through the sewer graph independently. They are not spawned per-player —
they have a location in the world. When one enters a room a player is in,
combat auto-starts. When one is in an adjacent room, the player gets a
footstep cue on move.

This is implemented without Durable Objects or WebSockets using a
lightweight approach: roamer state lives in a `roamers` D1 table.
A Cloudflare Cron Trigger moves them every 3 minutes.

### Step 1 — Roamers Table

Add to `initDb()`:

```javascript
await dbRun(db, `
  CREATE TABLE IF NOT EXISTS roamers (
    id TEXT PRIMARY KEY,
    enemy_id TEXT NOT NULL,
    location TEXT NOT NULL,
    last_moved_at INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  )
`);
```

### Step 2 — Roamer Definitions

Add near `PREDATOR_ENEMIES`:

```javascript
const ROAMER_DEFS = {
  the_hollow_warden: {
    enemy_id:    'hollow_guard',
    name:        'The Hollow Warden',
    start_room:  'sewer_mid_barracks',
    patrol:      [
      'sewer_mid_barracks','sewer_gate','sewer_mid_flooded',
      'sewer_mid_cistern','sewer_mid_drain','sewer_mid_barracks',
    ],
    // Footstep cues heard in adjacent rooms
    approach_cues: [
      "*Armor scrapes against stone somewhere nearby. Getting closer.*",
      "*A rhythmic clang echoes through the walls. Regular. Deliberate.*",
      "*Something heavy is moving in the passage you just came from.*",
    ],
    // Cue when it enters your room
    arrival_cue: "*The Hollow Warden steps into the passage. It does not hurry.*",
  },
  the_cistern_thing: {
    enemy_id:    'sewer_horror',
    name:        'The Cistern Thing',
    start_room:  'sewer_mid_cistern',
    patrol:      [
      'sewer_mid_cistern','sewer_deep_threshold',
      'sewer_deep_foundation','sewer_deep_threshold','sewer_mid_cistern',
    ],
    approach_cues: [
      "*The water in the drain shifts. Something large displaced it.*",
      "*A deep vibration travels up through the stone under your feet.*",
      "*You hear something breathing that has no rhythm you recognize.*",
    ],
    arrival_cue: "*Something rises from the dark at the far end of the chamber.*",
  },
};

// Build adjacency map for footstep detection
// (auto-derived from WORLD exits — no manual maintenance needed)
function getRoomNeighbors(locationId) {
  const room = WORLD[locationId];
  if (!room?.exits) return [];
  return Object.values(room.exits);
}
```

### Step 3 — Seed Roamers on First Init

In `initDb()`, after creating the table:

```javascript
// Seed roamers if table is empty
const roamerCount = await dbGet(db, 'SELECT COUNT(*) as n FROM roamers');
if ((roamerCount?.n || 0) === 0) {
  for (const [id, def] of Object.entries(ROAMER_DEFS)) {
    await dbRun(db,
      'INSERT OR IGNORE INTO roamers(id, enemy_id, location, last_moved_at, active) VALUES(?,?,?,?,1)',
      [id, def.enemy_id, def.start_room, 0]);
  }
}
```

### Step 4 — Cron Handler: Move Roamers

In the Worker's `scheduled` handler (add alongside `fetch` in the export):

```javascript
async scheduled(event, env, ctx) {
  const db = env.DB;
  ctx.waitUntil(tickRoamers(db));
},
```

Add the `tickRoamers` function:

```javascript
async function tickRoamers(db) {
  const roamers = await dbAll(db,
    'SELECT * FROM roamers WHERE active=1');

  for (const roamer of roamers) {
    const def = ROAMER_DEFS[roamer.id];
    if (!def) continue;

    // Advance one step along patrol route
    const idx = def.patrol.indexOf(roamer.location);
    const nextIdx = (idx + 1) % def.patrol.length;
    const nextRoom = def.patrol[nextIdx];

    await dbRun(db,
      'UPDATE roamers SET location=?, last_moved_at=? WHERE id=?',
      [nextRoom, Date.now(), roamer.id]);

    // Check if any players are in the next room — flag them for
    // auto-combat on their next action
    const playersInRoom = await dbAll(db,
      'SELECT user_id FROM players WHERE location=?', [nextRoom]);

    for (const p of playersInRoom) {
      // Don't interrupt existing combat
      const inCombat = await dbGet(db,
        'SELECT 1 FROM combat_state WHERE user_id=?', [p.user_id]);
      if (!inCombat) {
        await setFlag(db, p.user_id, 'roamer_arrived', roamer.id);
      }
    }
  }
}
```

Add the cron trigger to `wrangler.toml`:
```toml
[triggers]
crons = ["*/3 * * * *"]
```

### Step 5 — Roamer Check in /api/move and /api/look

**At the start of `/api/move`**, after updating player location,
check for roamer presence and adjacency:

```javascript
// ── Roamer checks ────────────────────────────────────────────
// 1. Check if a roamer arrived via cron while player was moving
const arrivedRoamerId = await getFlag(db, uid, 'roamer_arrived');
if (arrivedRoamerId) {
  await setFlag(db, uid, 'roamer_arrived', null);
  const def = ROAMER_DEFS[arrivedRoamerId];
  if (def && !encounterData) {
    const enemy = COMBAT_DATA.enemies[def.enemy_id];
    const hp = await getPlayerHp(db, uid, row);
    const state = {
      enemy_id: def.enemy_id, enemy_name: def.name,
      enemy_hp: enemy.hp, enemy_hp_max: enemy.hp,
      player_hp: hp.current, player_hp_max: hp.max,
      ability_used: false, turn: 1, location: dest,
      auto_triggered: true, roamer: true,
    };
    await dbRun(db,
      'INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json',
      [uid, JSON.stringify(state)]);
    encounterData = {
      triggered: true,
      roamer: true,
      cue: def.arrival_cue,
      enemy_name: def.name,
      enemy_desc: enemy.desc || '',
      combat_state: state,
    };
  }
}

// 2. Check if a roamer is in an adjacent room — footstep cue
if (!encounterData) {
  const neighbors = getRoomNeighbors(dest);
  const roamersNearby = await dbAll(db,
    `SELECT * FROM roamers WHERE active=1 AND location IN (${neighbors.map(() => '?').join(',')})`,
    neighbors);
  if (roamersNearby.length > 0) {
    const nearRoamer = roamersNearby[0];
    const def = ROAMER_DEFS[nearRoamer.id];
    if (def) {
      const cues = def.approach_cues;
      ambient = (ambient ? ambient + '\n\n' : '')
              + cues[Math.floor(Math.random() * cues.length)];
    }
  }
}
// ── End roamer checks ─────────────────────────────────────────
```

Also add a roamer check to **`/api/look`** so that if the player is already
in a room when a roamer moves in (detected via the `roamer_arrived` flag),
the next time they look around they see it:

```javascript
// In /api/look response, add:
const arrivedRoamer = await getFlag(db, uid, 'roamer_arrived');
// Include in response for frontend to handle identically to move encounter
```

---

## SYSTEM 2 — ENVIRONMENTAL HAZARDS

### Concept
The sewer environment itself becomes hostile. Hazards are stored as
global conditions in a `sewer_conditions` table, set by the cron job
or triggered by player actions. They apply damage or debuffs when
a player enters or lingers in an affected room.

### Step 1 — Sewer Conditions Table

Add to `initDb()`:

```javascript
await dbRun(db, `
  CREATE TABLE IF NOT EXISTS sewer_conditions (
    location TEXT PRIMARY KEY,
    hazard_type TEXT NOT NULL,
    severity INTEGER DEFAULT 1,
    expires_at INTEGER NOT NULL,
    set_at INTEGER NOT NULL
  )
`);
```

### Step 2 — Hazard Definitions

```javascript
const HAZARD_DEFS = {
  gas_pocket: {
    label:      'Sewer Gas',
    rooms:      ['sewer_mid_drain','sewer_mid_barracks','sewer_channel'],
    damage:     { min: 3, max: 8 },
    cue_enter:  "*The air here has a quality that makes your eyes water. Breathe shallow.*",
    cue_damage: "*The gas burns your throat. You take {dmg} damage.*",
    duration_ms: 8 * 60 * 1000,   // 8 minutes
    spawn_chance: 0.3,
  },
  rising_water: {
    label:      'Rising Water',
    rooms:      ['sewer_mid_flooded','sewer_channel','sewer_upper'],
    damage:     { min: 2, max: 5 },
    cue_enter:  "*The water is higher than it should be. The current pulls at your legs.*",
    cue_damage: "*The current knocks you against the wall. {dmg} damage.*",
    // Rising water also +15 to encounter chance (creatures flee upward)
    encounter_bonus: 15,
    duration_ms: 12 * 60 * 1000,
    spawn_chance: 0.2,
  },
  fungal_bloom: {
    label:      'Fungal Bloom',
    rooms:      ['sewer_deep_threshold','sewer_deep_foundation','sewer_mid_cistern'],
    damage:     { min: 1, max: 4 },
    cue_enter:  "*The walls are thick with pale growth. The spores drift visibly in your torchlight.*",
    cue_damage: "*Spores fill your lungs. {dmg} damage. Something in the bloom pulses.*",
    // Fungal bloom +20 to encounter chance (bloom attracts crawlers)
    encounter_bonus: 20,
    duration_ms: 15 * 60 * 1000,
    spawn_chance: 0.25,
  },
  collapse_risk: {
    label:      'Unstable Ceiling',
    rooms:      ['sewer_deep_vault','sewer_deep','sewer_den'],
    damage:     { min: 5, max: 14 },
    cue_enter:  "*Dust falls from the ceiling in slow streams. The stone creaks overhead.*",
    cue_damage: "*Stone falls. {dmg} damage. Move fast.*",
    // One-time trigger per visit — doesn't damage on every move
    one_shot:   true,
    duration_ms: 20 * 60 * 1000,
    spawn_chance: 0.15,
  },
};
```

### Step 3 — Cron: Spawn and Expire Hazards

Add to `tickRoamers` (rename to `tickWorld` or call both from `scheduled`):

```javascript
async function tickHazards(db) {
  const now = Date.now();

  // Expire old hazards
  await dbRun(db, 'DELETE FROM sewer_conditions WHERE expires_at < ?', [now]);

  // Potentially spawn new hazards
  for (const [type, def] of Object.entries(HAZARD_DEFS)) {
    if (Math.random() > def.spawn_chance) continue;

    // Pick a random eligible room that doesn't already have this hazard
    const room = def.rooms[Math.floor(Math.random() * def.rooms.length)];
    const existing = await dbGet(db,
      'SELECT 1 FROM sewer_conditions WHERE location=? AND hazard_type=?',
      [room, type]);
    if (existing) continue;

    await dbRun(db,
      `INSERT OR REPLACE INTO sewer_conditions
       (location, hazard_type, severity, expires_at, set_at)
       VALUES (?,?,?,?,?)`,
      [room, type, 1, now + def.duration_ms, now]);
  }
}
```

Update `scheduled` handler:
```javascript
async scheduled(event, env, ctx) {
  const db = env.DB;
  ctx.waitUntil(Promise.all([tickRoamers(db), tickHazards(db)]));
},
```

### Step 4 — Apply Hazards in /api/move

After the roamer check and before the encounter roll, check for hazards:

```javascript
// ── Environmental hazard check ────────────────────────────────
let hazardData = null;
const activeHazard = await dbGet(db,
  'SELECT * FROM sewer_conditions WHERE location=?', [dest]);

if (activeHazard) {
  const def = HAZARD_DEFS[activeHazard.hazard_type];
  if (def) {
    const dmg = Math.floor(Math.random() * (def.damage.max - def.damage.min + 1))
              + def.damage.min;

    // Apply damage
    const hp = await getPlayerHp(db, uid, row);
    const newHp = Math.max(0, hp.current - dmg);
    await dbRun(db,
      'UPDATE player_hp SET current_hp=? WHERE user_id=?', [newHp, uid]);

    // One-shot hazards: remove after triggering
    if (def.one_shot) {
      await dbRun(db,
        'DELETE FROM sewer_conditions WHERE location=? AND hazard_type=?',
        [dest, activeHazard.hazard_type]);
    }

    hazardData = {
      type:       activeHazard.hazard_type,
      label:      def.label,
      cue_enter:  def.cue_enter,
      cue_damage: def.cue_damage.replace('{dmg}', dmg),
      damage:     dmg,
      player_hp:  newHp,
      player_hp_max: hp.max,
    };

    // Apply encounter bonus from hazard
    if (def.encounter_bonus) {
      // Add to modifiers used in rollEncounter below
      // Set a local variable: hazardEncounterBonus
    }
  }
}
// ── End hazard check ──────────────────────────────────────────
```

Include `hazardData` in the move response:
```javascript
return json({
  // ... existing fields
  encounter: encounterData,
  hazard: hazardData,       // ← add
});
```

### Step 5 — Frontend: Hazard Display

In `doMove()`, handle hazard before encounter:

```javascript
if (data.hazard) {
  log(`<em>${data.hazard.cue_enter}</em>`);
  await new Promise(r => setTimeout(r, 600));
  log(`<em>${data.hazard.cue_damage}</em>`);
  // Update HP bar immediately
  updatePlayerHp(data.hazard.player_hp, data.hazard.player_hp_max);
}
```

Add hazard indicator to room display. When `data.hazard` is present,
show a subtle warning in the room header area:

```javascript
function renderHazardWarning(hazard) {
  const existing = document.getElementById('hazard-warning');
  if (existing) existing.remove();
  if (!hazard) return;

  const el = document.createElement('div');
  el.id = 'hazard-warning';
  el.className = 'hazard-warning';
  el.textContent = `⚠ ${hazard.label}`;
  document.getElementById('room-name').after(el);
}
```

```css
.hazard-warning {
  font-size: 0.75rem;
  color: var(--danger);
  letter-spacing: 0.1em;
  opacity: 0.7;
  margin-bottom: 8px;
  font-family: var(--font-title);
  text-transform: uppercase;
  animation: breathe 3s ease-in-out infinite;
}
```

Also expose active hazards via **`GET /api/conditions`** — a lightweight
endpoint the frontend can poll on login to show current sewer state
(useful for the noticeboard / world state display later):

```javascript
if (path === '/api/conditions' && method === 'GET') {
  const conditions = await dbAll(db,
    'SELECT location, hazard_type, severity, expires_at FROM sewer_conditions');
  const roamers = await dbAll(db,
    'SELECT id, enemy_id, location FROM roamers WHERE active=1');
  return json({ conditions, roamers });
}
```

---

## SYSTEM 3 — BOSS SPAWN CONDITIONS

### Concept
Bosses don't appear in the encounter table. They spawn when specific
conditions are met: kill count, noise level, depth, and city mood
all converge. The spawn is telegraphed over 2–3 moves before the fight.

### Step 1 — Boss Definitions

```javascript
const BOSS_DEFS = {
  rat_king: {
    enemy_id:     'rat_king',
    name:         'The Rat King',
    spawn_room:   'sewer_den',
    conditions: {
      kills_in_location: { location: 'sewer_den', min: 3 },
      // Rat King spawns after 3 kills in the Den specifically
    },
    telegraph: [
      "*The ash on the floor shifts. Everything in the den has gone still.*",
      "*The clicking stops. Complete silence for the first time since you entered.*",
      "*Something very large moves beneath the ash pile. It has been waiting.*",
    ],
    arrival: "*The ash erupts. The Rat King rises.*",
    // Drop: rat_king_musk (quest item) + large ash reward
    reward: { ash_marks: 350, item: 'rat_king_musk', flag: 'boss_rat_king_killed' },
  },
  the_warden_captain: {
    enemy_id:     'hollow_guard',   // reuse enemy, override stats
    name:         'The Warden Captain',
    spawn_room:   'sewer_mid_barracks',
    hp_override:  80,
    conditions: {
      player_kills_total: { min: 10 },
      depth_tier: { min: 2 },
    },
    telegraph: [
      "*The wall orders on the board rattle. The duty roster updates itself.*",
      "*A voice — hollow, metallic — reads a name from the list. Your name is not on the list.*",
      "*The shapes under the cloth on the sleeping platforms all sit up at once.*",
    ],
    arrival: "*The Warden Captain steps through the far door. It has been waiting for someone to report to.*",
    reward: { ash_marks: 500, flag: 'boss_warden_captain_killed' },
  },
  the_cistern_depth: {
    enemy_id:     'sewer_horror',
    name:         'The Depth',
    spawn_room:   'sewer_mid_cistern',
    hp_override:  120,
    conditions: {
      player_kills_total: { min: 20 },
      depth_tier: { min: 3 },
      hazard_active: { type: 'rising_water' },
    },
    telegraph: [
      "*The cistern water begins to drain. Slowly. All at once.*",
      "*The walkway trembles. Something is climbing the wall below you.*",
      "*The echoes stop. The cistern has gone completely silent for the first time.*",
    ],
    arrival: "*The water level drops to nothing. Something enormous fills the space where it was.*",
    reward: { ash_marks: 800, item: 'custodian_core', flag: 'boss_depth_killed' },
  },
};
```

### Step 2 — Boss Condition Checker

Add this function:

```javascript
async function checkBossConditions(db, uid, location) {
  // Don't check if boss already killed or already telegraphing
  const telegraphActive = await getFlag(db, uid, 'boss_telegraph_id');
  if (telegraphActive) return null;

  for (const [bossId, def] of Object.entries(BOSS_DEFS)) {
    // Skip if already killed
    if (await getFlag(db, uid, def.conditions?.reward?.flag ||
        `boss_${bossId}_killed`)) continue;
    if (await getFlag(db, uid, `boss_${bossId}_killed`)) continue;

    if (def.spawn_room !== location) continue;

    const c = def.conditions;
    let met = true;

    // Check kills in specific location
    if (c.kills_in_location) {
      const kills = await getFlag(db, uid, `kills_in_${c.kills_in_location.location}`) || 0;
      if (parseInt(kills) < c.kills_in_location.min) met = false;
    }

    // Check total kills
    if (c.player_kills_total) {
      const total = await getFlag(db, uid, 'total_kills') || 0;
      if (parseInt(total) < c.player_kills_total.min) met = false;
    }

    // Check depth tier
    if (c.depth_tier) {
      const tier = await getFlag(db, uid, 'depth_tier') || 0;
      if (parseInt(tier) < c.depth_tier.min) met = false;
    }

    // Check active hazard
    if (c.hazard_active) {
      const hazard = await dbGet(db,
        'SELECT 1 FROM sewer_conditions WHERE location=? AND hazard_type=?',
        [location, c.hazard_active.type]);
      if (!hazard) met = false;
    }

    if (met) return { bossId, def };
  }
  return null;
}
```

### Step 3 — Boss Telegraph in /api/move

After the roamer and hazard checks, before the normal encounter roll:

```javascript
// ── Boss spawn check ──────────────────────────────────────────
// Check if an active telegraph is in progress
const activeBossTelegraph = await getFlag(db, uid, 'boss_telegraph_id');
if (activeBossTelegraph && !encounterData) {
  const telegraphTick = parseInt(
    await getFlag(db, uid, 'boss_telegraph_tick') || 0) + 1;
  await setFlag(db, uid, 'boss_telegraph_tick', telegraphTick);

  const def = BOSS_DEFS[activeBossTelegraph];
  if (def && def.spawn_room === dest) {
    if (telegraphTick >= def.telegraph.length) {
      // Telegraph complete — spawn the boss
      await setFlag(db, uid, 'boss_telegraph_id', null);
      await setFlag(db, uid, 'boss_telegraph_tick', null);

      const enemy = {
        ...COMBAT_DATA.enemies[def.enemy_id],
        ...(def.hp_override ? { hp: def.hp_override } : {}),
      };
      const hp = await getPlayerHp(db, uid, row);
      const state = {
        enemy_id: def.enemy_id, enemy_name: def.name,
        enemy_hp: enemy.hp, enemy_hp_max: enemy.hp,
        player_hp: hp.current, player_hp_max: hp.max,
        ability_used: false, turn: 1, location: dest,
        auto_triggered: true, boss: true,
        boss_id: activeBossTelegraph,
        boss_reward: def.reward,
      };
      await dbRun(db,
        'INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json',
        [uid, JSON.stringify(state)]);
      encounterData = {
        triggered: true, boss: true,
        cue: def.arrival,
        enemy_name: def.name,
        enemy_desc: '',
        combat_state: state,
      };
    } else {
      // Still telegraphing
      ambient = (ambient ? ambient + '\n\n' : '')
              + def.telegraph[telegraphTick - 1];
    }
  }
}

// Check for new boss conditions if no telegraph active
if (!activeBossTelegraph && !encounterData) {
  const bossMatch = await checkBossConditions(db, uid, dest);
  if (bossMatch) {
    await setFlag(db, uid, 'boss_telegraph_id', bossMatch.bossId);
    await setFlag(db, uid, 'boss_telegraph_tick', 1);
    ambient = (ambient ? ambient + '\n\n' : '')
            + bossMatch.def.telegraph[0];
  }
}
// ── End boss check ────────────────────────────────────────────
```

### Step 4 — Kill Tracking for Boss Conditions

In the combat victory block, after awarding XP and loot, add:

```javascript
// Track kills for boss conditions
const locationKey = `kills_in_${state.location}`;
const locationKills = parseInt(await getFlag(db, uid, locationKey) || 0) + 1;
await setFlag(db, uid, locationKey, locationKills);

const totalKills = parseInt(await getFlag(db, uid, 'total_kills') || 0) + 1;
await setFlag(db, uid, 'total_kills', totalKills);

// Track depth tier
const depthTier =
  state.location.startsWith('sewer_deep') ? 3 :
  state.location.startsWith('sewer_mid')  ? 2 :
  state.location.startsWith('sewer_')     ? 1 : 0;
const currentTier = parseInt(await getFlag(db, uid, 'depth_tier') || 0);
if (depthTier > currentTier) {
  await setFlag(db, uid, 'depth_tier', depthTier);
}
```

### Step 5 — Boss Victory Handling

In the combat victory block, check for `boss_reward` on the state:

```javascript
if (state.boss && state.boss_reward) {
  const reward = state.boss_reward;

  // Award ash marks
  if (reward.ash_marks) {
    await dbRun(db,
      'UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?',
      [reward.ash_marks, uid]);
  }

  // Award quest item
  if (reward.item) {
    await addItemToInventory(db, uid, reward.item, 1);
  }

  // Set completion flag
  if (reward.flag) {
    await setFlag(db, uid, reward.flag, 1);
    await setFlag(db, uid, `boss_${state.boss_id}_killed`, 1);
  }

  victoryMessage += `\n\n*The ${state.enemy_name} falls.*\n\n**+${reward.ash_marks || 0} Ash Marks**${reward.item ? ` | **${reward.item}** added to inventory` : ''}`;
}
```

### Step 6 — Frontend: Boss Encounter Styling

In `handleAutoEncounter()`, add special handling when `enc.boss` is true:

```javascript
async function handleAutoEncounter(enc) {
  if (enc.boss) {
    // Boss gets a longer pause and different presentation
    log(`<em>${enc.cue}</em>`);
    await new Promise(r => setTimeout(r, 1500));
    // Flash the combat overlay border
    document.getElementById('combat-overlay').classList.add('boss-encounter');
  } else {
    log(`<em>${enc.cue}</em>`);
    await new Promise(r => setTimeout(r, 900));
  }
  // ... rest unchanged
}
```

```css
.boss-encounter {
  border-color: var(--ember) !important;
  box-shadow: 0 0 40px rgba(196,98,42,0.4), inset 0 0 20px rgba(196,98,42,0.05);
}
```

---

## WRANGLER.TOML UPDATE

Add the cron trigger if not already present:
```toml
[triggers]
crons = ["*/3 * * * *"]
```

Verify the `scheduled` export exists alongside `fetch` in the Worker:
```javascript
export default {
  async fetch(request, env, ctx) { ... },
  async scheduled(event, env, ctx) {
    const db = env.DB;
    ctx.waitUntil(Promise.all([
      tickRoamers(db),
      tickHazards(db),
    ]));
  },
};
```

---

## VERIFICATION CHECKLIST

**Roaming monsters:**
- [ ] `roamers` table seeded with two entries on first deploy
- [ ] Cron fires every 3 minutes and advances patrol positions
- [ ] Player in adjacent room sees footstep cue on move
- [ ] Player in same room as roamer gets `roamer_arrived` flag
- [ ] Next move or look auto-starts combat with roamer
- [ ] Roamer combat uses the roamer's name, not the base enemy name
- [ ] Two roamers never interfere with each other's state

**Environmental hazards:**
- [ ] Cron spawns hazards in eligible rooms (~20-30% of ticks)
- [ ] Hazards expire after their duration
- [ ] Player entering hazard room takes damage and sees cue
- [ ] `one_shot` hazards (collapse_risk) fire once then clear
- [ ] Hazard warning renders in room header
- [ ] `GET /api/conditions` returns current state correctly
- [ ] Rising water and fungal bloom increase encounter chance

**Boss spawns:**
- [ ] Kill tracking increments correctly on victory
- [ ] Depth tier flag updates when player reaches new floors
- [ ] Boss telegraph begins on correct kill threshold
- [ ] Each telegraph message appears on a separate move
- [ ] Boss spawns on the final telegraph move — not before
- [ ] Boss combat overlay has ember glow border
- [ ] Boss reward (ash marks + quest item + flag) applied on victory
- [ ] Boss does not respawn after flag is set

---

## WHAT PHASE 4 WILL REQUIRE (WEBSOCKETS)

Phase 3 completes all single-player encounter systems. The remaining
feature that cannot be done without persistent connections is:

**PvPvE collision** — two players entering the same room sharing an
encounter, hearing each other's footsteps, the option to cooperate
or betray. This requires a Durable Object per active room and a
WebSocket connection from the frontend.

That is its own architectural prompt. All of Phase 3 is fully
compatible with that future migration — the roamer and hazard state
in D1 will be read by the DO rather than the Worker.
