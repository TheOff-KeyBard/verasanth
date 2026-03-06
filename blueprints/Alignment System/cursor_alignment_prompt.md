# Cursor Prompt — Alignment System Backend
# Paste this entire prompt into Cursor

---

Implement the full alignment system backend. This is a self-contained pass — 
schema migrations, core functions, API endpoints, and two bug fixes.
Do not change anything outside the scope defined below.

---

## CONTEXT

The current implementation has:
- `alignment_morality` and `alignment_order` columns on `characters` (range incorrectly capped at -100/100)
- A basic `updateAlignment()` function at line ~450
- Death handler at line ~1017 that zeroes ALL ash_marks (wrong — should be 20% loss)
- No `crime_heat`, no `archetype`, no `last_decay`
- No `crime_log`, `bounties`, or `sentences` tables

---

## STEP 1 — Schema Migrations

Add to `initDb()` after the existing CREATE TABLE statements.
All statements use IF NOT EXISTS / safe column adds — will not break existing data.

```javascript
// Add columns to characters (safe — IF NOT EXISTS equivalent via try/catch)
const alterStatements = [
  "ALTER TABLE characters ADD COLUMN crime_heat INTEGER DEFAULT 0",
  "ALTER TABLE characters ADD COLUMN archetype TEXT DEFAULT 'Survivor'",
  "ALTER TABLE characters ADD COLUMN last_decay INTEGER DEFAULT 0",
];
for (const sql of alterStatements) {
  try { await dbRun(db, sql); } catch (e) { /* column already exists */ }
}

// New tables
await dbRun(db, `CREATE TABLE IF NOT EXISTS crime_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  crime_type TEXT NOT NULL,
  heat_added INTEGER NOT NULL,
  mercy_change INTEGER DEFAULT 0,
  order_change INTEGER DEFAULT 0,
  location TEXT,
  created_at INTEGER NOT NULL
)`);

await dbRun(db, `CREATE TABLE IF NOT EXISTS bounties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  target_id INTEGER NOT NULL,
  poster_id INTEGER,
  reason TEXT,
  reward INTEGER NOT NULL,
  status TEXT DEFAULT 'active',
  claimed_by INTEGER,
  posted_at INTEGER NOT NULL,
  expires_at INTEGER,
  location TEXT DEFAULT 'wardens_post'
)`);

await dbRun(db, `CREATE TABLE IF NOT EXISTS sentences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  crime_tier TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  escaped INTEGER DEFAULT 0,
  escape_attempts INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0
)`);
```

---

## STEP 2 — Core Alignment Functions

Replace the existing `updateAlignment()` function (around line 450) with this 
complete set. Keep `dbGet` and `dbRun` as-is — these functions use them directly.

```javascript
// ─── Alignment & Crime System ───────────────────────────────────────────────

function computeArchetype(mercy, order, heat) {
  // Crime heat overrides alignment archetype
  if (heat >= 16) return 'Ash Wraith';
  if (heat >= 11) return 'Dread';
  if (heat >= 7)  return 'Butcher';
  if (heat >= 4)  return 'Killer';
  if (heat >= 1)  return 'Ruffian';
  // Alignment-based archetypes
  const mHi = mercy >= 60,  mLo = mercy <= -60;
  const oHi = order >= 60,  oLo = order <= -60;
  if (mHi && oHi) return 'Protector';
  if (mHi && oLo) return 'Vigilante';
  if (mHi)        return 'Wanderer';
  if (mLo && oHi) return 'Mercenary';
  if (mLo && oLo) return 'Predator';
  if (mLo)        return 'Predator';
  if (oHi)        return 'Enforcer';
  if (oLo)        return 'Cutpurse';
  return 'Survivor';
}

async function updateAlignment(db, uid, mercyDelta, orderDelta) {
  const row = await dbGet(db,
    'SELECT alignment_morality, alignment_order, crime_heat FROM characters WHERE user_id=?',
    [uid]);
  // Range is -200 to +200 (not -100/100 — fix the old cap)
  const mercy = Math.max(-200, Math.min(200, (row.alignment_morality || 0) + mercyDelta));
  // Order/Chaos is PERMANENT — no decay ever. Mercy/Cruelty decays over time.
  const order = Math.max(-200, Math.min(200, (row.alignment_order || 0) + orderDelta));
  const archetype = computeArchetype(mercy, order, row.crime_heat || 0);
  await dbRun(db,
    'UPDATE characters SET alignment_morality=?, alignment_order=?, archetype=? WHERE user_id=?',
    [mercy, order, archetype, uid]);
}

async function addCrimeHeat(db, uid, heat, crimeType, location) {
  const row = await dbGet(db,
    'SELECT crime_heat, alignment_morality, alignment_order FROM characters WHERE user_id=?',
    [uid]);
  const newHeat = Math.min(20, (row.crime_heat || 0) + heat); // cap at 20
  const archetype = computeArchetype(
    row.alignment_morality || 0,
    row.alignment_order || 0,
    newHeat
  );
  await dbRun(db,
    'UPDATE characters SET crime_heat=?, archetype=? WHERE user_id=?',
    [newHeat, archetype, uid]);
  await dbRun(db,
    'INSERT INTO crime_log (user_id, crime_type, heat_added, location, created_at) VALUES (?,?,?,?,?)',
    [uid, crimeType, heat, location || 'unknown', Date.now()]);
  // Auto-post official bounty at threshold crossings
  await checkBountyThreshold(db, uid, newHeat);
}

async function checkBountyThreshold(db, uid, heat) {
  // Only post if no active official bounty exists
  const existing = await dbGet(db,
    "SELECT id FROM bounties WHERE target_id=? AND status='active' AND type='official'",
    [uid]);
  if (existing) return;
  const reward = heat >= 16 ? 1500
               : heat >= 11 ? 750
               : heat >= 7  ? 400
               : heat >= 4  ? 200
               : 0;
  if (reward === 0) return;
  await dbRun(db,
    'INSERT INTO bounties (type, target_id, reward, posted_at, expires_at, location) VALUES (?,?,?,?,?,?)',
    ['official', uid, reward, Date.now(), Date.now() + 7 * 24 * 60 * 60 * 1000, 'wardens_post']);
}

async function decayAlignment(db, uid) {
  // Mercy/Cruelty decays 5 pts/hour toward 0.
  // Order/Chaos NEVER decays — the city remembers structural betrayal permanently.
  const row = await dbGet(db,
    'SELECT alignment_morality, alignment_order, crime_heat, last_decay FROM characters WHERE user_id=?',
    [uid]);
  const now = Date.now();
  const lastDecay = row.last_decay || now;
  const hoursElapsed = (now - lastDecay) / 3_600_000;
  if (hoursElapsed < 0.1) return; // minimum 6-minute gap
  const decayPoints = Math.floor(hoursElapsed * 5);
  if (decayPoints === 0) return;
  const mercy = row.alignment_morality || 0;
  // Decay toward 0 — reduce absolute value, never cross 0
  const mercyDecay = mercy > 0
    ? -Math.min(decayPoints, mercy)
    :  mercy < 0 ? Math.min(decayPoints, Math.abs(mercy)) : 0;
  if (mercyDecay !== 0) {
    await updateAlignment(db, uid, mercyDecay, 0);
  }
  await dbRun(db,
    'UPDATE characters SET last_decay=? WHERE user_id=?',
    [now, uid]);
}
```

---

## STEP 3 — Wire Decay to Every Authenticated Request

Find the section in the request handler where `uid` is resolved after auth 
(after the session token lookup, before route handling). Add one line:

```javascript
// Fire-and-forget — don't await, don't block the request
decayAlignment(db, uid).catch(() => {});
```

This runs alignment decay on every authenticated action without adding latency.

---

## STEP 4 — Fix the Death Handler

Find the combat death handler (around line 1017-1019). Currently:
```javascript
await dbRun(db, "UPDATE characters SET current_hp=0, ash_marks=0 WHERE user_id=?", [uid]);
```

Replace with:
```javascript
// Death penalty: lose 20% of ash_marks, not all of them. Equipped items safe.
const deathRow = await dbGet(db, "SELECT ash_marks FROM characters WHERE user_id=?", [uid]);
const currentMarks = deathRow.ash_marks || 0;
const lostMarks = Math.floor(currentMarks * 0.20);
const remainingMarks = currentMarks - lostMarks;
await dbRun(db,
  "UPDATE characters SET current_hp=0, ash_marks=? WHERE user_id=?",
  [remainingMarks, uid]);
// TODO Phase 2: drop lostMarks as loot at player's death location for others to find
```

Also wire crime heat for PvP kills. In the same death handler block, if the 
death was caused by another player (not an enemy), add:
```javascript
// PvP kill — add crime heat and cruelty to the killer
// killerUid is the attacker's user_id if available in scope
if (killerUid) {
  await addCrimeHeat(db, killerUid, 3, 'pvp_kill', currentLocation);
  await updateAlignment(db, killerUid, -50, 0); // cruelty hit
}
```
If killerUid is not currently tracked in the death handler, add a note 
to implement this in Phase 2 when PvP is wired.

---

## STEP 5 — Update playerContext Builder

Find where `playerContext` is assembled for NPC dialogue (around line 826, 
where `alignment_morality` is read). Replace the alignment section with:

```javascript
// Replace old single-axis alignment with full context
const mercy   = row.alignment_morality || 0;
const order   = row.alignment_order    || 0;
const heat    = row.crime_heat         || 0;
const archetype = row.archetype        || computeArchetype(mercy, order, heat);

// Check for active bounty
const activeBounty = await dbGet(db,
  "SELECT reward FROM bounties WHERE target_id=? AND status='active' ORDER BY reward DESC LIMIT 1",
  [uid]);

const playerContext = {
  // ... keep all existing fields ...
  archetype,
  crime_heat: heat,
  mercy_score: mercy,
  order_score: order,
  has_bounty: !!activeBounty,
  bounty_reward: activeBounty?.reward || 0,
  // Legacy field — keep for backward compat with existing NPC prompts
  alignment: mercy >= 40 ? 'light' : mercy <= -40 ? 'dark' : 'neutral',
};
```

---

## STEP 6 — New API Endpoints

Add these route handlers in the same pattern as existing routes:

```javascript
// GET /api/alignment — player's current alignment state
if (path === '/api/alignment' && method === 'GET') {
  const row = await dbGet(db,
    'SELECT alignment_morality, alignment_order, crime_heat, archetype FROM characters WHERE user_id=?',
    [uid]);
  const activeBounty = await dbGet(db,
    "SELECT reward FROM bounties WHERE target_id=? AND status='active' ORDER BY reward DESC LIMIT 1",
    [uid]);
  return json({
    archetype: row.archetype || 'Survivor',
    mercy_score: row.alignment_morality || 0,
    order_score: row.alignment_order || 0,
    crime_heat: row.crime_heat || 0,
    has_bounty: !!activeBounty,
    bounty_reward: activeBounty?.reward || 0,
  });
}

// GET /api/bounties/official — active official bounties at wardens_post
if (path === '/api/bounties/official' && method === 'GET') {
  const bounties = await dbAll(db,
    `SELECT b.id, b.reward, b.posted_at, b.expires_at,
            c.archetype, p.location as last_location,
            a.username as target_name
     FROM bounties b
     JOIN characters c ON c.user_id = b.target_id
     JOIN players p ON p.user_id = b.target_id
     JOIN accounts a ON a.user_id = b.target_id
     WHERE b.type='official' AND b.status='active'
     AND (b.expires_at IS NULL OR b.expires_at > ?)
     ORDER BY b.reward DESC`,
    [Date.now()]);
  return json({ bounties });
}

// GET /api/bounties/player — active player-posted bounties
if (path === '/api/bounties/player' && method === 'GET') {
  const bounties = await dbAll(db,
    `SELECT b.id, b.reward, b.reason, b.posted_at, b.expires_at,
            a.username as target_name,
            pa.username as poster_name
     FROM bounties b
     JOIN accounts a ON a.user_id = b.target_id
     LEFT JOIN accounts pa ON pa.user_id = b.poster_id
     WHERE b.type='player' AND b.status='active'
     AND (b.expires_at IS NULL OR b.expires_at > ?)
     ORDER BY b.posted_at DESC`,
    [Date.now()]);
  return json({ bounties });
}

// POST /api/bounties/post — player posts a bounty on another player
if (path === '/api/bounties/post' && method === 'POST') {
  const { target_name, reason, reward } = await req.json();
  if (!target_name || !reward || reward < 50) {
    return err('target_name and reward (min 50) required.', 400);
  }
  const POSTING_FEE = 25;
  const total = reward + POSTING_FEE;
  const poster = await dbGet(db,
    'SELECT ash_marks FROM characters WHERE user_id=?', [uid]);
  if ((poster.ash_marks || 0) < total) {
    return err(`Insufficient funds. Need ${total} AM (${reward} reward + ${POSTING_FEE} posting fee).`, 400);
  }
  const target = await dbGet(db,
    'SELECT user_id FROM accounts WHERE username=?', [target_name.toLowerCase()]);
  if (!target) return err('Player not found.', 404);
  if (target.user_id === uid) return err('You cannot bounty yourself.', 400);
  // Deduct total from poster
  await dbRun(db,
    'UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?', [total, uid]);
  // Post bounty (72-hour expiry)
  await dbRun(db,
    `INSERT INTO bounties (type, target_id, poster_id, reason, reward, posted_at, expires_at, location)
     VALUES ('player',?,?,?,?,?,?,'noticeboard')`,
    [target.user_id, uid, reason || null, reward,
     Date.now(), Date.now() + 72 * 60 * 60 * 1000]);
  return json({ success: true, message: `Bounty posted. ${total} AM deducted.` });
}

// POST /api/bounties/claim/:id — claim a bounty (requires target to be dead/in cells)
if (path.startsWith('/api/bounties/claim/') && method === 'POST') {
  const bountyId = parseInt(path.split('/').pop());
  const bounty = await dbGet(db,
    "SELECT * FROM bounties WHERE id=? AND status='active'", [bountyId]);
  if (!bounty) return err('Bounty not found or already claimed.', 404);
  if (bounty.target_id === uid) return err('Cannot claim your own bounty.', 400);
  // Mark claimed, pay claimer
  await dbRun(db,
    "UPDATE bounties SET status='claimed', claimed_by=? WHERE id=?", [uid, bountyId]);
  await dbRun(db,
    'UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?',
    [bounty.reward, uid]);
  // Reduce target's crime heat by 2 (served consequence)
  const targetRow = await dbGet(db,
    'SELECT crime_heat, alignment_morality, alignment_order FROM characters WHERE user_id=?',
    [bounty.target_id]);
  const newHeat = Math.max(0, (targetRow.crime_heat || 0) - 2);
  const newArchetype = computeArchetype(
    targetRow.alignment_morality || 0,
    targetRow.alignment_order || 0,
    newHeat
  );
  await dbRun(db,
    'UPDATE characters SET crime_heat=?, archetype=? WHERE user_id=?',
    [newHeat, newArchetype, bounty.target_id]);
  return json({ success: true, reward: bounty.reward,
    message: `Bounty claimed. ${bounty.reward} AM added.` });
}
```

**Note:** You'll need a `dbAll` helper if it doesn't exist. Add alongside `dbGet`:
```javascript
async function dbAll(db, sql, params = []) {
  const result = await db.prepare(sql).bind(...params).all();
  return result.results || [];
}
```

---

## STEP 7 — Update Character Sheet UI

Find the alignment display in the frontend (wherever `alignment_morality` 
and `alignment_order` are shown to the player). Replace with:

The UI should call `GET /api/alignment` and render:

```
STANDING
──────────────────────────────
Archetype     [computed label]
              [one-line flavor text per archetype — see table below]

Mercy         [████████░░]   bar fills right = merciful, left = cruel
Order         [██████░░░░]   bar fills right = ordered, left = chaotic  
Heat          [░░░░░░░░░░]   empty = clean, fills red as heat rises

[⚠ Bounty Active — 200 AM]   ← only shown if has_bounty = true
──────────────────────────────
```

**Rules for the bars:**
- Scale: -200 to +200 maps to 0–10 bar segments
- Neutral (0) = 5 filled segments
- No numbers ever shown to the player
- Heat bar: 0–20 maps to 0–10 segments, color shifts from grey → amber → red

**Archetype flavor text (one line each, shown under the label):**

| Archetype | Flavor |
|-----------|--------|
| Protector | *"The city notes you with something close to approval."* |
| Vigilante | *"You make your own law. The city watches, undecided."* |
| Wanderer | *"No particular stain. No particular record."* |
| Enforcer | *"Reliable. Cold. The ledger approves."* |
| Mercenary | *"A weapon that can be pointed. Someone is always looking."* |
| Predator | *"The city has noted the pattern."* |
| Survivor | *"Neutral. For now."* |
| Cutpurse | *"The city does not forget what you've taken from it."* |
| Ruffian | *"Grommash is watching."* |
| Killer | *"There is a notice with your name on it."* |
| Butcher | *"The wardens move differently when you enter a room."* |
| Dread | *"The city holds its breath when you pass."* |
| Ash Wraith | *"You are the thing people warn others about."* |

---

## STEP 8 — Admin Reset Update

Find the admin reset handler (around line 645-650). Add the new columns to 
the character reset:

```javascript
await dbRun(db, `UPDATE characters SET 
  instinct=NULL, strength=10, dexterity=10, constitution=10, 
  intelligence=10, wisdom=10, charisma=10, stats_set=0,
  alignment_morality=0, alignment_order=0, 
  crime_heat=0, archetype='Survivor', last_decay=0,
  ash_marks=0, ember_shards=0, soul_coins=0, 
  xp=0, class_stage=0, current_hp=0 
  WHERE user_id=?`, [targetUid]);
// Also clear crime history and bounties for this user
await dbRun(db, "DELETE FROM crime_log WHERE user_id=?", [targetUid]);
await dbRun(db, "UPDATE bounties SET status='expired' WHERE target_id=?", [targetUid]);
await dbRun(db, "DELETE FROM sentences WHERE user_id=?", [targetUid]);
```

Note: default stats changed from 5 to 10 — neutral modifier, not penalty modifier.

---

## VERIFICATION CHECKLIST

After implementation, confirm:

- [ ] `GET /api/alignment` returns archetype, mercy_score, order_score, crime_heat, has_bounty
- [ ] `GET /api/bounties/official` returns active official bounties
- [ ] `GET /api/bounties/player` returns active player bounties  
- [ ] `POST /api/bounties/post` deducts AM, creates bounty, returns error if insufficient funds
- [ ] `POST /api/bounties/claim/:id` pays reward, reduces target heat by 2
- [ ] Death gives back 80% of ash_marks (not zero)
- [ ] Decay fires on every authenticated request without blocking
- [ ] Archetype updates whenever alignment or heat changes
- [ ] Admin reset clears crime_log, sentences, and marks bounties expired

---

## WHAT THIS DOES NOT DO (Phase 2)

These are intentionally deferred — do not implement now:

- Dropped ash_marks as loot at death location (needs world item system)
- PvP kill heat (needs killer tracking in combat state)  
- Cinder Cells sentence enforcement (needs sentence timer UI)
- Contract breach heat (needs contract system)
- NPC dialogue conditionals on archetype (bounty board UI first)
- Sewer condition rotation cron trigger (separate pass)
