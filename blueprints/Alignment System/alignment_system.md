# Verasanth Alignment System — Complete Design Document
**File:** `blueprints/systems/alignment.md`
**Version:** 1.0
**Last Updated:** 2026-03-06
**Status:** Active

---

## CORE PHILOSOPHY

*Ash & Iron — The Warden's Ledger*

Grommash Nazgrel doesn't enforce "good vs evil."
He enforces **behavior** — because in Verasanth, behavior is survival.

The player never sees their alignment scores.
They see what Grommash calls them.
They feel what the city does to them.
They read what the noticeboard says about them.

The numbers are the city's memory.
The descriptors are its voice.

---

## THE TWO AXES

### Axis 1: Mercy ↔ Cruelty
*"Are you predator or protector?"*

Tracks how the player treats other living things.
Range: -200 (Maximum Cruelty) to +200 (Maximum Mercy)
Starting value: 0 (Neutral)

**Mercy increases when:**
| Action | Points |
|--------|--------|
| Complete bounty on criminal | +40 |
| Revive a downed player | +15 |
| Heal or help another player | +10 |
| Return stolen items | +25 |
| Kill Dread-tier criminal | +60 |
| Refuse to finish downed enemy | +5 |
| Spare a surrendering player | +20 |

**Cruelty increases (Mercy decreases) when:**
| Action | Points |
|--------|--------|
| Kill sleeping/AFK player | -80 |
| Steal from sleeping player | -30 |
| Kill neutral player | -50 |
| Kill low-level player (5+ levels below) | -70 |
| Kill weakened player (below 25% HP) | -40 |
| Finish a downed player | -30 |
| Refuse to revive party member | -15 |
| Thalara refuses to heal (cruelty threshold) | signal only |

**Grommash reads Mercy as:** restraint
**Grommash reads Cruelty as:** predation

He doesn't punish cruelty because it's evil.
He punishes it because it destabilizes the city.

### Axis 2: Order ↔ Chaos
*"Do you uphold structure or unravel it?"*

Tracks how the player treats the city's agreements and systems.
Range: -200 (Maximum Chaos) to +200 (Maximum Order)
Starting value: 0 (Neutral)

**Order increases when:**
| Action | Points |
|--------|--------|
| Complete bounty contract | +40 |
| Pay debt or tax | +20 |
| Complete guild contract | +30 |
| Honor a formal agreement | +25 |
| Turn in escaped prisoner | +35 |
| Report a crime to Grommash | +15 |

**Chaos increases (Order decreases) when:**
| Action | Points |
|--------|--------|
| Break a formal contract | -60 |
| Kill a bounty issuer | -80 |
| Steal from guild storage | -50 |
| Escape from Cinder Cells | -40 |
| Bribe a witness | -30 |
| Destroy a noticeboard posting | -20 |
| Operate contraband trade | -15 per transaction |

**Grommash reads Order as:** predictability
**Grommash reads Chaos as:** risk

He doesn't hate chaos. He fears what chaos invites.

---

## DECAY RULES

### Mercy/Cruelty — Decays Over Time
The city allows for redemption. Actions fade.
Old mercy fades too — you cannot rest on past kindness.

**Decay rate:** 5 points toward 0 per real-world hour (while logged in)
**Decay cap:** Never decays past the nearest archetype threshold
  (e.g., a Butcher doesn't decay to Killer without active mercy actions)
**Accelerated decay in Cinder Cells:**
  15 points toward 0 per minute served
  This is why serving time actually means something.
  A Butcher who serves their full sentence emerges as a Killer.
  A Killer who serves emerges as a Ruffian.
  Grommash sees this as "resetting the board."

### Order/Chaos — Permanent
The city remembers structural betrayal forever.
Breaking a contract, killing a bounty issuer, stealing from the guild —
these are recorded in the Warden's Ledger and never removed.

**No decay. No redemption through time.**
The only path forward is to build Order score high enough
to functionally counterbalance the Chaos floor.
A player with -80 Order who builds to +60 Order
sits at a net -20 — not neutral, not forgotten,
but functional. The ledger still shows the entry.
Grommash still knows.

**Why this matters:**
A player can redeem cruelty through mercy.
A player cannot un-break a contract.
The city treats these as fundamentally different categories of wrong.

---

## ARCHETYPE SYSTEM

Players never see their scores.
They see what they are — as determined by where they sit on both axes.
Grommash reads these. Other NPCs feel them.

### The Archetypes

| Mercy Score | Order Score | Archetype | Grommash Reads As |
|-------------|-------------|-----------|-------------------|
| +60 to +200 | +60 to +200 | **Protector** | "Someone the city can rely on." |
| +60 to +200 | -59 to +59 | **Wanderer** | "Restrained but unpredictable." |
| +60 to +200 | -60 to -200 | **Vigilante** | "Good intentions. Wrong methods." |
| -59 to +59 | +60 to +200 | **Enforcer** | "Useful. Ruthless. Ordered." |
| -59 to +59 | -59 to +59 | **Survivor** | "Neither asset nor threat. Yet." |
| -59 to +59 | -60 to -200 | **Cutpurse** | "Small chaos. Adds up." |
| -60 to -200 | +60 to +200 | **Mercenary** | "Dangerous but contained." |
| -60 to -200 | -59 to +59 | **Predator** | "A threat to stability." |
| -60 to -200 | -60 to -200 | **Butcher** | "The city will correct this." |

### Special Archetypes (Crime Heat Tiers)
These override the grid when crime heat reaches threshold:

| Crime Heat | Archetype | Grommash Response |
|------------|-----------|-------------------|
| 1-2 crimes | **Ruffian** | Gives warnings |
| 1 murder | **Killer** | Begins tracking |
| 3+ murders | **Butcher** | Hunts actively |
| 5+ murders / serial | **Dread** | Mobilizes |
| Legendary criminal | **Ash Wraith** | Citywide alert |

### Player-Facing UI
The character sheet shows:
```
STANDING
Archetype: Protector
The city sees you as someone it can rely on.

Mercy: Restrained      [████████░░] 
Order: Ordered         [██████░░░░]
Heat:  Clean           [░░░░░░░░░░]
```

No numbers. Just the bars (directional, not precise)
and the archetype label with Grommash's one-line read.
The bars show general direction — not exact values.
Players can feel they're drifting without knowing the math.

---

## CRIME HEAT SYSTEM

*"The Ash remembers."*

Crime Heat is a separate counter from alignment scores.
It tracks specific criminal acts, not general behavior.
It does not decay on its own — only through:
- Serving time in Cinder Cells
- Paying Ash Mark fines (minor crimes only)
- Completing redemption bounties (Grommash assigns these)

### Heat Generation
| Crime | Heat Added |
|-------|-----------|
| Theft (caught) | +1 |
| Assault (non-lethal) | +1 |
| Contract breach | +2 |
| Manslaughter (accident/PvP) | +2 |
| Murder (intentional) | +3 |
| Murder of sleeping player | +5 |
| Guild storage theft | +4 |
| Killing bounty issuer | +6 |
| Escape from Cinder Cells | +3 |

### Heat Thresholds
| Heat | Tier | Grommash Response |
|------|------|-------------------|
| 0 | Clean | Standard interactions |
| 1-3 | Ruffian | Warning dialogue, increased watch |
| 4-6 | Killer | Active tracking, patrol shifts |
| 7-10 | Butcher | Hunt active, other NPCs react |
| 11-15 | Dread | Guards mobilized, bounty posted automatically |
| 16+ | Ash Wraith | Citywide alert, maximum bounty |

### Heat Reduction
- Cinder Cells: -1 heat per 5 minutes served
- Ash Mark fine (Ruffian only): 50 AM per heat point
- Redemption bounty (Grommash assigns): -2 heat on completion
- Time (Ruffian only): -1 heat per 2 real hours offline

---

## BOUNTY SYSTEM

Two bounty types. Two locations. One overseer.

### Type 1 — Crime Bounties (Warden's Post)
Generated automatically when a player's crime heat reaches threshold.
Posted by Grommash. Official. Enforced by the city.

**Location:** `wardens_post` — the official bounty board
**Who sees it:** Any player who visits the Warden's Post
**Who can claim it:** Any player (including guild members)
**Reward source:** City treasury (Ash Marks, scales with heat tier)

**Bounty values:**
| Heat Tier | Bounty Value |
|-----------|-------------|
| Ruffian | 50-100 AM |
| Killer | 150-250 AM |
| Butcher | 300-500 AM |
| Dread | 600-900 AM |
| Ash Wraith | 1000-2000 AM |

**Claiming a bounty:**
Player must defeat/capture the target and return to Warden's Post.
Capture (non-lethal): +20 Mercy bonus on top of reward.
Kill: standard reward, no bonus.
Grommash: *"Justice served. The ledger is updated."*

**Bounty target effects:**
- Target sees "BOUNTY ACTIVE" in their character sheet
- Target's name appears marked in other players' local chat
- Target gets increased Grommash patrol attention
- Other players in same location see a subtle indicator

### Type 2 — Player Bounties (Noticeboard)
Posted by players or NPCs. Organic. Unofficial. Messy.
This is where personal scores get settled.

**Location:** `market_square` noticeboard
**Cost to post:** 25 AM + the reward amount (held in escrow)
**Who sees it:** Anyone who reads the noticeboard
**Who can claim:** Any player
**Expiry:** 72 hours or until claimed

**Player bounty format:**
```
WANTED
[Player Name]
For: [player-written reason, max 100 chars]
Reward: [AM amount]
Posted by: [anonymous or named]
— Expires in 72 hours —
```

**Seris's reaction to player bounties:**
She occasionally reads the noticeboard.
High-value bounties get a comment:
*"Someone wants them found badly. Interesting."*

**Grommash's reaction to player bounties:**
He does not post them. He does not endorse them.
But he does not remove them.
*"People are free to settle their own accounts.
 Within limits."*

**NPC-posted bounties:**
Some NPCs post bounties for specific items or tasks.
These appear on the market noticeboard alongside player bounties.
They look identical. Players cannot always tell the difference.
This is intentional — the noticeboard is Verasanth's chaos board.

### Bounty Board API
```
GET  /api/bounties/official     — Warden's Post bounties
GET  /api/bounties/player       — Noticeboard bounties
POST /api/bounties/post         — Post player bounty (costs AM)
POST /api/bounties/claim/:id    — Claim a bounty (triggers verification)
GET  /api/bounties/active       — Current player's active bounties on them
```

---

## CINDER CELLS

*"The city claims you... for now."*

### Location
`cinder_cells` — beneath the Warden's Post.
Cold stone. Ash-lined walls that absorb sound.
A place the city tolerates, not supports.

### Sentence Lengths
| Crime Tier | Sentence |
|------------|----------|
| Ruffian | 5 minutes |
| Killer | 15 minutes |
| Butcher | 30 minutes |
| Dread | 60 minutes |
| Ash Wraith | 120 minutes |

### What Happens During Sentence
- Player location locked to `cinder_cells`
- Mercy/Cruelty decay accelerated: 15 points/minute toward 0
- Crime heat reduced: 1 point per 5 minutes
- Player can still use chat (global, whisper)
- Player cannot: move, fight, trade, access inventory
- Timer displayed in character sheet

### Escape Mechanic
Command: `/escape`
Available after 1 minute served.

**Escape check:**
- Base difficulty: 40%
- +10% per DEX point above 12
- +10% if Chaos score below -60 (practiced at this)
- -20% if Ash Wraith tier (maximum security)
- -10% per failed attempt (cell gets more secure)

**Success:** Player moves to `sewer_entrance` (the only way out)
Crime heat +3, Order score -40, Chaos score -20
Grommash becomes aware immediately.
His next patrol routes through sewer entrance.

**Failure:** Attempt logged. Timer adds 2 minutes. Difficulty decreases.

### The Cell Description
```
The Cinder Cells

Cold stone. The walls are ash-grey and absorb 
sound in a way that makes silence feel deliberate.
A single iron door. No window.

The city tolerates this place. It does not support it.
You are here because someone decided you needed to be.

Sentence remaining: [TIME]
Crime heat: [TIER]

You could try to escape. The door has been tried before.
```

### What Serving Time Means
This is the most important mechanic in the system.

A player who serves their full sentence:
- Emerges one crime tier lower
- Receives Grommash's acknowledgment:
  *"Time served. The ledger is updated. Don't make me write in it again."*
- Gets a small Order score recovery: +20
- NPCs treat them slightly better for the next session

A player who escapes:
- Remains at current crime tier
- Adds escape to their record
- Gets a brief window before Grommash finds them
- Other players can see the escape notice on the noticeboard

Serving time is the only path to genuine redemption.
The city respects players who accept its consequences.
Grommash respects them too — in his way.

---

## NPC REACTIONS TO ALIGNMENT

### Grommash — Primary Enforcer
He is the system's living face.

| Archetype | His Response |
|-----------|-------------|
| Protector | "You are becoming someone the city can rely on." |
| Wanderer | "Restrained but unpredictable. Choose a direction." |
| Vigilante | "Good intent. Wrong method. The city notices both." |
| Enforcer | "Useful. Ruthless. Stay on the right side of the line." |
| Survivor | "You are neither asset nor threat. Yet." |
| Cutpurse | "Small chaos adds up. Consider your pattern." |
| Mercenary | "Dangerous but contained. Keep it that way." |
| Predator | "You hunt the weak. The city remembers." |
| Butcher | "The cells will hold what you cannot." |
| Ruffian | Gives warnings |
| Killer | Begins tracking |
| Dread | Hunts actively |
| Ash Wraith | *He doesn't speak. He moves.* |

### Thalara — Mercy Barometer
She notices alignment through people, not the system.

| Condition | Her Response |
|-----------|-------------|
| Cruelty score below -80 | "I'll treat your wounds. I know what you did out there. I'll treat them anyway." |
| Cruelty score below -120 | "I'll heal you. But I want you to know — I see what you are." |
| Cruelty score below -160 | Refuses. "Not today. Come back when you've made a different choice." |
| Mercy score above +80 | Prices -25%. Faster treatment. Genuine warmth. |
| Protector archetype | "You're one of the good ones. Don't let the city take that." |

### Seris — Alignment as Data
She files everything. Reacts strategically, not morally.

| Condition | Her Response |
|-----------|-------------|
| Oathbreaker title | *She looks at them with something like interest.* "You're willing to do what others won't. I'll remember that." |
| Ash Wraith tier | "You've made yourself very visible. That's either brave or stupid." |
| Protector archetype | Slightly more forthcoming on artifact arc. She trusts them marginally more. |
| Butcher archetype | Prices increase. She is not moral — she is risk-averse. |
| High Order score | More willing to advance arc. They honor agreements. |

### Kelvaris — Everything in the Ledger
He knows. He always knows.

| Condition | His Response |
|-----------|-------------|
| Any murder | *He sets something down.* "I heard." Nothing more. |
| Oathbreaker | "You've been marked. I'd be careful." |
| Protector | "You hold back. That's rarer than it should be." |
| Ash Wraith | *He looks at them for a long time.* "The hearth burns different when you're here." |
| First Cinder Cells release | "You served your time. The city noticed." |

### Veyra — No Change
She treats every player identically regardless of alignment.
No price changes. No dialogue shifts. No visible reaction.

This is conspicuous when every other NPC adjusts.
Players with high cruelty scores who notice Veyra's neutrality
will feel something they cannot name.
Grommash respects this about her.
She does not enforce order. She simply refuses to participate in chaos.

### Caelir — Subtle Adjustment
He becomes more guarded with chaotic players.
Not hostile — more contained. More careful.

| Condition | His Response |
|-----------|-------------|
| Chaos below -60 | Shorter responses. Less willing to share. |
| Oathbreaker | *He continues what he is doing.* "I see." Back to work. |
| High Order | Marginally more forthcoming on his arc. |

### Othorion — Scientific Interest
He categorizes alignment as behavioral data.

| Condition | His Response |
|-----------|-------------|
| Ash Wraith tier | "You've become something the city is paying attention to. That is either very useful or very dangerous. Possibly both." |
| Butcher archetype | "Your pattern suggests escalation. I am documenting this." |
| Protector archetype | He notes it. Does not comment. Treats their deliveries with slightly more care. |
| Oathbreaker + high INT | "Interesting. You understand consequence and act anyway. That's a specific kind of dangerous." |

---

## CITY REACTIONS TO ALIGNMENT

When collective player behavior crosses city-wide thresholds,
Verasanth responds. This is the "City Breathes" world event
from the PvPvE system, triggered by alignment data.

### Threshold: City-Wide Cruelty Spike
If average player cruelty score drops below -40:
- Room descriptions in sewer locations gain dark flavor text
- Sewer creature aggro range increases 25% city-wide
- Kelvaris: *"The hearth burns low tonight."*
- Thalara: "Something is wrong. People are hurting each other."
- Grommash: *"The city is uneasy. Stay close to the light."*

### Threshold: City-Wide Chaos Spike
If total chaos events in a session exceed 10:
- Whispers in sewer locations mislead high-chaos players
- Noticeboard fills with player and NPC reaction posts
- City Breathes event triggers (see PvPvE doc)
- Othorion: "Too many broken agreements in one place. The resonance is unstable."

### Threshold: Redemption Wave
If average player mercy score rises above +60:
- Thalara notices: "People are helping each other. I didn't expect that."
- Kelvaris: *"The hearth burns well tonight."* Back to work.
- Minor shop discount city-wide (2 hours)
- Grommash says nothing. He updates the ledger. He looks satisfied.

---

## BACKEND IMPLEMENTATION

### D1 Schema Additions
```sql
-- Add to players table
ALTER TABLE players ADD COLUMN mercy_score INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN order_score INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN crime_heat INTEGER DEFAULT 0;
ALTER TABLE players ADD COLUMN archetype TEXT DEFAULT 'Survivor';
ALTER TABLE players ADD COLUMN last_decay INTEGER; -- timestamp

-- Crime log
CREATE TABLE IF NOT EXISTS crime_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  crime_type TEXT NOT NULL,
  heat_added INTEGER NOT NULL,
  mercy_change INTEGER DEFAULT 0,
  order_change INTEGER DEFAULT 0,
  location TEXT,
  victim_id INTEGER,           -- player or NULL
  created_at INTEGER NOT NULL
);

-- Bounties
CREATE TABLE IF NOT EXISTS bounties (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,          -- 'official' | 'player'
  target_id INTEGER NOT NULL,
  poster_id INTEGER,           -- NULL for official bounties
  reason TEXT,
  reward INTEGER NOT NULL,     -- Ash Marks in escrow
  status TEXT DEFAULT 'active',-- active | claimed | expired
  claimed_by INTEGER,
  posted_at INTEGER NOT NULL,
  expires_at INTEGER,
  location TEXT DEFAULT 'wardens_post'
);

-- Sentence tracking
CREATE TABLE IF NOT EXISTS sentences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  crime_tier TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  started_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  escaped INTEGER DEFAULT 0,
  escape_attempts INTEGER DEFAULT 0,
  completed INTEGER DEFAULT 0
);
```

### Core Functions
```javascript
// Update alignment scores
async function updateAlignment(db, uid, mercyDelta, orderDelta) {
  const player = await getPlayer(db, uid);
  const newMercy = Math.max(-200, Math.min(200,
    player.mercy_score + mercyDelta));
  const newOrder = Math.max(-200, Math.min(200,
    player.order_score + orderDelta));
  const archetype = computeArchetype(newMercy, newOrder,
    player.crime_heat);
  await dbRun(db,
    `UPDATE players SET mercy_score=?, order_score=?, 
     archetype=? WHERE user_id=?`,
    [newMercy, newOrder, archetype, uid]);
}

// Add crime heat
async function addCrimeHeat(db, uid, heat, crimeType, location) {
  await dbRun(db,
    `UPDATE players SET crime_heat = crime_heat + ? WHERE user_id=?`,
    [heat, uid]);
  await dbRun(db,
    `INSERT INTO crime_log (user_id, crime_type, heat_added, 
     location, created_at) VALUES (?,?,?,?,?)`,
    [uid, crimeType, heat, location, Date.now()]);
  await checkBountyThreshold(db, uid);
}

// Compute archetype from scores
function computeArchetype(mercy, order, heat) {
  // Crime heat overrides grid at high levels
  if (heat >= 16) return 'Ash Wraith';
  if (heat >= 11) return 'Dread';
  if (heat >= 7) return 'Butcher';
  if (heat >= 4) return 'Killer';
  if (heat >= 1) return 'Ruffian';

  // Grid-based archetype
  const mercyHigh = mercy >= 60;
  const mercyLow = mercy <= -60;
  const orderHigh = order >= 60;
  const orderLow = order <= -60;

  if (mercyHigh && orderHigh) return 'Protector';
  if (mercyHigh && orderLow) return 'Vigilante';
  if (mercyHigh) return 'Wanderer';
  if (mercyLow && orderHigh) return 'Mercenary';
  if (mercyLow && orderLow) return 'Butcher';
  if (mercyLow) return 'Predator';
  if (orderHigh) return 'Enforcer';
  if (orderLow) return 'Cutpurse';
  return 'Survivor';
}

// Decay function (run on authenticated requests)
async function decayAlignment(db, uid) {
  const player = await getPlayer(db, uid);
  const now = Date.now();
  const lastDecay = player.last_decay || now;
  const hoursPassed = (now - lastDecay) / (1000 * 60 * 60);
  if (hoursPassed < 0.1) return; // Don't decay more than every 6 min

  const decayAmount = Math.floor(hoursPassed * 5);
  if (decayAmount === 0) return;

  // Mercy/Cruelty decays toward 0
  const mercyDecay = player.mercy_score > 0
    ? -Math.min(decayAmount, player.mercy_score)
    : Math.min(decayAmount, Math.abs(player.mercy_score));

  // Order/Chaos does NOT decay — permanent
  await updateAlignment(db, uid, mercyDecay, 0);
  await dbRun(db,
    `UPDATE players SET last_decay=? WHERE user_id=?`,
    [now, uid]);
}

// Auto-post bounty when heat threshold crossed
async function checkBountyThreshold(db, uid) {
  const player = await getPlayer(db, uid);
  const heat = player.crime_heat;
  const existing = await dbGet(db,
    `SELECT id FROM bounties WHERE target_id=? AND status='active' 
     AND type='official'`, [uid]);
  if (existing) return; // Already has bounty

  if (heat >= 4) {
    const reward = heat >= 16 ? 1500
      : heat >= 11 ? 750
      : heat >= 7 ? 400
      : heat >= 4 ? 200 : 0;

    if (reward > 0) {
      await dbRun(db,
        `INSERT INTO bounties (type, target_id, reward, posted_at, 
         expires_at, location) VALUES ('official',?,?,?,?,?)`,
        [uid, reward, Date.now(),
         Date.now() + (7 * 24 * 60 * 60 * 1000), 'wardens_post']);
    }
  }
}
```

### API Endpoints
```
GET  /api/alignment              — get current player alignment UI data
POST /api/alignment/action       — record alignment-affecting action
GET  /api/bounties/official      — Warden's Post bounty board
GET  /api/bounties/player        — Noticeboard bounties
POST /api/bounties/post          — Post player bounty
POST /api/bounties/claim/:id     — Claim bounty
GET  /api/sentence/current       — Get active sentence if any
POST /api/sentence/escape        — Attempt escape
GET  /api/crimes/log             — Player's own crime log
```

### Alignment in playerContext
When building playerContext for any NPC dialogue:
```javascript
playerContext.archetype = player.archetype;
playerContext.mercy_score = player.mercy_score;
playerContext.order_score = player.order_score;
playerContext.crime_heat = player.crime_heat;
playerContext.has_bounty = bounty ? true : false;
playerContext.in_sentence = sentence ? true : false;
```

---

## IMPLEMENTATION ORDER

Phase 1 — Foundation:
1. D1 schema (players columns + crime_log + bounties + sentences)
2. `updateAlignment()`, `addCrimeHeat()`, `computeArchetype()`
3. `decayAlignment()` called on every authenticated request
4. Alignment UI in character sheet (archetype label + direction bars)

Phase 2 — Crime System:
5. Crime heat triggers on PvP kill, theft, contract breach
6. Auto-bounty posting at thresholds
7. Official bounty board at Warden's Post
8. Player bounty posting on noticeboard

Phase 3 — Cinder Cells:
9. Sentence assignment on Grommash detection
10. Cell UI and timer
11. `/escape` mechanic
12. Sentence completion decay bonus

Phase 4 — NPC Integration:
13. All NPC system prompts updated with archetype/heat context
14. Thalara heal refusal at cruelty threshold
15. Shop price modifiers per archetype
16. Grommash patrol shift based on heat

Phase 5 — City Reactions:
17. City-wide threshold monitoring
18. World event triggers from collective alignment
19. Player memory system entries for major alignment events

---
*Alignment System version 1.0 — Verasanth*
*Part of the Verasanth Systems Bible*
