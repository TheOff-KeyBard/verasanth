# Verasanth PvPvE System — Complete Design Document
**File:** `blueprints/systems/pvpve.md`
**Version:** 1.0
**Last Updated:** 2026-03-06
**Status:** Active

---

## CORE PHILOSOPHY

Verasanth PvPvE is not "players fighting in a dungeon."
It is a **social survival ecosystem inside a living city.**

The three actors are:
1. **Players** — individuals with alignment, reputation, trust history
2. **Other Players** — potential allies, contracts, betrayers, threats
3. **The City** — a third actor that reacts to everything

The city is not neutral. It watches. It remembers. It responds.
Grommash is its enforcement arm.
Othorion is its early warning system.
The morality system is its memory.

---

## INTERACTION STATES

Every player relationship exists in one of four states.
Players do not toggle PvP. They cross social boundaries
that have weight and consequence.

### The Four States

**NEUTRAL**
Default state. No buffs, no penalties.
Either player can initiate a state change.
The city watches but does not intervene.

**PARTY**
Voluntary alliance. Requires mutual acceptance.
Protected by Party Oath (see below).
Shared benefits, shared risks.
Betrayal from Party state carries maximum consequences.

**CONTRACT**
Formal agreement with defined terms, witnessed by the city.
Either party can breach — but the city remembers.
Most reliable state for large coordinated actions.
Grommash enforces contract terms.

**HOSTILE**
Active conflict state. Both players are marked.
The city reacts. Guards shift. NPCs notice.
Exits: Surrender (rare) → Neutral, or death.

### State Transitions

```
Neutral → Party         (mutual acceptance + Party Oath)
Neutral → Contract      (formal agreement, terms set)
Neutral → Hostile       (attack, theft, or declared intent)
Party → Betrayal → Hostile  (oath broken, max consequences)
Contract → Breach → Hostile (terms violated, city enforces)
Hostile → Surrender → Neutral (rare, cruelty score affects outcome)
```

---

## PARTY SYSTEM

Parties are temporary alliances forged under pressure.
They are not casual groupings — they carry weight.

### Party Oath
Joining a party creates a visible Party Oath buff:
- Shared map pings (see each other's location on node map)
- Shared Peril: -15% damage taken when within same location
- Faster revive speed on downed party members
- Combined threat score (intimidation factors stack)

### Party Benefits by Trust Level
| Trust | Benefit |
|-------|---------|
| Stranger | Base party only — shared location |
| Known | Reduced betrayal penalties if things go wrong |
| Trusted | Shared map pings + faster revives |
| Bloodbound | +10% damage resistance when fighting together |

### Betrayal from Party
The most consequential action in the game.

**Triggers:** Attacking a party member, stealing from them,
leading them into an ambush, or formally breaking the oath.

**Immediate effects:**
- Party Oath buff removed (visibly)
- Cruelty score: -80 (maximum single-event cruelty spike)
- Chaos score: -60
- Trust reset to 0 with all witnesses in the same location
- Crime heat escalates to Killer tier minimum
- City whisper fires to all players in the location:
  *"A vow breaks in the ash."*
- Grommash becomes aware of the betrayer immediately
- Othorion senses a "resonance fracture" (his dialogue shifts)
- Betrayer title applied: **Oathbreaker**

**Why this weight:**
Betrayal should be a story event, not a mechanic.
Players remember who broke an oath. The city does too.

---

## CONTRACT SYSTEM

Contracts are the heart of structured PvPvE.
They create obligations, stakes, and consequences.

### Contract Terms
Every contract must define:
- **Duration** — time-limited or objective-limited
- **Reward** — Ash Marks, items, information, territory
- **Obligations** — what each party must do
- **Penalties** — what happens on breach
- **Witness** — optional NPC (Grommash, Seris) or player witness

### Creating a Contract
Players initiate via `/contract [player_name]` or through
the noticeboard in market_square or the Warden's Post.

The contract UI shows all terms before both parties confirm.
Once confirmed, Grommash is notified automatically.

### Contract Types

**Escort Contract**
Party A escorts Party B through a dungeon zone.
Breach: abandonment or attack.
Grommash responds: automatic bounty on breaching party.

**Trade Contract**
Goods or services exchange at defined terms.
Breach: non-delivery or short-delivery.
Seris can witness trade contracts for a fee.

**Non-Aggression Pact**
Mutual Neutral state guaranteed for defined duration.
Breach: any attack action.
Chaos spike + automatic hostile declaration.

**Guild Compact** (see Guild System)
Multi-player, persistent contract defining guild membership.
Breach: rebellion, theft from guild storage.
Most severe penalties — Grommash hunts rebels.

**Bounty Contract**
Posted on noticeboard. Any player can accept.
Target: specific player or enemy type.
Completion triggers Order score increase.
Grommash oversees all active bounties.

### Contract Breach Consequences
- Chaos score: -60
- Cruelty score: -40 (intent to defraud)
- Automatic bounty posted (Grommash-enforced)
- Trust reset with contract party
- City whispers follow the breacher for one session:
  *"The Ash remembers what was promised."*
- Title applied: **Contract Breaker** (affects future contract rates)

---

## GUILD / FACTION SYSTEM

The social backbone of late-game Verasanth.
Players should want to group because dungeons demand it.
Players should be wary of outsiders because betrayal is real.

### What Guilds Are
Formal player organizations recognized by the city.
Grommash maintains a guild registry.
Seris tracks guild economic activity.

### Guild Formation
- Minimum 3 players
- Guild Compact signed (formal contract)
- Name registered at Warden's Post (Ash Marks fee)
- Guild flag color chosen — appears in chat next to name

### Guild Tiers
| Tier | Name | Members | Unlocks |
|------|------|---------|---------|
| 1 | Crew | 3-5 | Guild chat, shared stash (small) |
| 2 | Company | 6-10 | Guild territory claim, noticeboard priority |
| 3 | Brotherhood | 11-20 | Guild hall (location), contract bonuses |
| 4 | Covenant | 21-40 | World event priority, Grommash alliance option |
| 5 | Sovereign | 41+ | City influence, NPC dialogue changes |

### Guild Mechanics

**Guild Chat**
Private channel. Whisper-style delivery.
`/g message` to send. Color-coded in chat panel.

**Shared Stash**
Guild storage location. Items deposited/withdrawn by members.
Theft from guild stash: maximum Chaos + Cruelty penalty,
automatic Oathbreaker title, Grommash alert.

**Guild Territory**
Higher tier guilds can claim a district or dungeon zone.
Claiming: requires holding the zone for defined period.
Benefits: resource respawn bonus, reduced enemy aggro
for guild members, hostile-on-sight for rival guild members.

**Guild vs Guild**
Declared via formal Guild War contract (witnessed by Grommash).
Duration defined. Winning condition defined.
All guild members are Hostile state to each other.
City watches but does not intervene in declared wars.
Grommash: "You have chosen this. I will hold the line after."

**Guild Reputation**
Guilds accumulate collective reputation.
Affects: NPC prices for members, Grommash's trust level,
Seris's interest, Thalara's willingness to heal members.
A guild full of Oathbreakers will find the city hostile to them.

---

## TRUST SYSTEM

Trust is a currency. It is built slowly and spent instantly.

### Trust Levels
| Level | Requirements | Benefits |
|-------|-------------|---------|
| Stranger | Default | No bonuses |
| Known | 5+ interactions, no betrayal | Reduced betrayal penalties |
| Trusted | 15+ interactions, mutual contracts completed | Shared map pings, faster revives |
| Bloodbound | Trusted + survived combat together | Temp damage resistance, shared HP threshold alerts |

### Trust Mechanics
- Trust is **per-player-pair**, not global
- Trust builds through: trading, completing contracts together,
  reviving, shared dungeon completion
- Trust resets to 0 instantly on: betrayal, contract breach,
  attacking while in party
- Trust cannot be rebuilt to Bloodbound after a reset —
  once broken at that level, the ceiling is Trusted

### The Trust Economy
Players must decide: invest in trust with a few players
(high reward, high risk) or stay Stranger with everyone
(low reward, safe). The dungeon scaling forces the first option
for serious progression. The betrayal system makes it dangerous.

---

## HOSTILE STATE

Hostile is not a PvP toggle. It is a city-recognized status.

### Entering Hostile State
- Direct attack on a Neutral player
- Theft detected by another player
- Declared contract breach
- Bounty acceptance (target becomes Hostile-aware)
- Oathbreaker status triggers automatic Hostile with witnesses

### Hostile Player Effects
The city marks Hostile players. The effects are environmental:
- Footsteps produce slightly louder descriptions in room text
- Whispers follow them (random city whisper insertions in their look descriptions)
- Sewer creatures: +20% aggro range, +10% damage against them
- Grommash patrol routes shift toward their location
- Other players see a subtle tell in their name in local chat

### Exiting Hostile State
- **Surrender** — offer to the opposing player. They can accept or reject.
  If accepted: Neutral restored, no further combat that session,
  Cruelty score +10 for the accepter (showed mercy).
- **Death** — Hostile state clears on respawn.
  Crime heat does not clear.
- **Time** — Minor Hostile states (no kills) decay after 30 min
  of no hostile actions.

---

## DOWNED PLAYER SYSTEM

When a player reaches 0 HP in a PvP context, they enter
a Downed state before death. Other players have choices.

### Downed Choices
| Action | Effect | Alignment |
|--------|--------|-----------|
| Revive | Player restored to 30% HP | Mercy +15 |
| Loot | Take one item from inventory | Chaos +20 |
| Finish | Kill the downed player | Cruelty +30 |
| Leave | Do nothing, player dies on timer | Neutral |
| Threaten | Demand surrender/items for revive | Based on outcome |

### Downed Timer
60 seconds. Party members see countdown.
After timer: player dies, respawns at last rest point.
Items dropped: 1 random item from inventory (not equipped).

### Revive Mechanics
- Any player can revive (not just party members)
- Takes 10 seconds (interrupted by combat)
- Reviver gains Mercy score regardless of prior relationship
- Reviving an enemy creates temporary Neutral status

---

## THREAT SYSTEM

Threatening a player is a social action with mechanical weight.

### Threat Factors
The success of a threat is calculated from:
- **Reputation** — Oathbreaker vs Warden's Shadow vs unknown
- **Weapon tier** — visible, affects intimidation
- **Player level difference** — significant gaps matter
- **Trust history** — threatening a Known player is harder to bluff
- **Nearby allies** — party members add to threat score
- **City mood** — high city unease amplifies threat effectiveness
- **Crime heat** — a Dread player's threat lands differently

### Threat Outcomes
- **Compliance** — target surrenders item or location
- **Bluff call** — target refuses, both enter Hostile (if attacker backs down, Chaos penalty)
- **Counter-threat** — target responds with their own threat (opposed roll)
- **Panic** — target flees to adjacent location (low-level vs high-reputation gap)

### Grommash and Threats
If Grommash is in the location or adjacent:
- Threat attempt triggers his awareness
- He does not intervene in words — he appears in the room description
- His presence reduces threat effectiveness by 30%
- If the threat escalates to attack, he responds immediately

---

## BETRAYAL

Betrayal is a story event. The game treats it as one.

### What Constitutes Betrayal
- Attacking a party member
- Stealing from a party member
- Leading party into ambush
- Breaking a formal contract
- Selling party member information to enemies

### Betrayal Cascade
When betrayal is detected:

**Immediate (same tick):**
- Cruelty -80, Chaos -60
- Crime heat escalates
- Trust reset with all witnesses
- City whisper to all players in location:
  *"A vow breaks in the ash."*

**Within 30 seconds:**
- Grommash's patrol shifts toward betrayer's location
- Othorion (if trust tier 2+): next dialogue includes
  *"Something fractured in the city's resonance nearby.
   Someone broke a promise. The city felt it."*
- Automatic bounty posted on betrayer

**Persistent:**
- Title applied: **Oathbreaker**
- All future contract rates increase (city doesn't trust them)
- NPC dialogue shifts for betrayers:
  - Kelvaris: *"You've been marked. I'd be careful."*
  - Thalara: *"I'll heal you. But I know what you did."*
  - Seris: *"Interesting. You're willing to do what others won't."*
    (She files this away. It affects her arc assessment of them.)
  - Veyra: No change. She treats everyone the same.
  - Caelir: Marginally more guarded.

---

## SOCIAL TITLES

Titles are functional, not cosmetic. They change how the city
and its inhabitants respond to the player.

| Title | Trigger | Effects |
|-------|---------|---------|
| **Oathbreaker** | Party betrayal or contract breach | Contract costs +20%, guards watch closely, bounty rate increases |
| **Mercenary** | 10+ contracts completed | Better contract rewards, Grommash neutral, criminals wary |
| **The Warden's Shadow** | 20+ bounties completed, high Order | Grommash respects them, criminals hostile-on-sight, city reduced aggro |
| **Ash Dealer** | 10+ contraband transactions | Black market prices -20%, Grommash increased heat tracking |
| **Bleeder** | 5+ kills in one session | NPCs close shops, Grommash hunts, sewer creatures ignore them (predator recognition) |
| **Protector** | 10+ revives of other players | Thalara prices -25%, party members gain extra HP threshold |
| **Dreadborn** | Maximum crime heat tier | City whispers constantly, Grommash mobilized, Seris watches with interest |
| **The Survived** | Died 10+ times and returned | Kelvaris acknowledges them. Thalara checks on them. The city notes it. |

---

## WORLD EVENTS

Dynamic events that reshape social pressure.
Events override normal PvP incentives temporarily.

### Ash Tremors
**Trigger:** Random timer (every 2-4 hours of server time)
**Duration:** 20 minutes
**Effect:** Sewer creature aggro doubled citywide.
Players must band together or retreat.
PvP is not disabled but attacking during Ash Tremors
adds +40 Chaos — the city sees it as predation during crisis.
**Reward:** Shared loot multiplier for players who fought together.
Grommash: *"The tremors pass. Hold the line until they do."*

### Sewer Surge
**Trigger:** Activated by specific player actions (TBD) or timer
**Duration:** 15 minutes
**Effect:** Water levels rise in sewer zones.
Certain paths become impassable.
Players trapped together must cooperate or compete for exits.
Forced proximity with potential enemies.
**Reward:** Rare loot from surge creatures.

### City Breathes
**Trigger:** When morality system reaches city-wide threshold
  (collective cruelty score too high)
**Duration:** 30 minutes
**Effect:** The city becomes active against chaotic players.
Whispers mislead high-chaos players (wrong exit descriptions).
Low-chaos players get minor guidance.
Sewer creatures target high-crime-heat players preferentially.
**Othorion:** *"The city is correcting. Someone pushed too hard."*
**Grommash:** *"Stay close to the light. This is not a night to wander."*

### The Pale Hunt
**Trigger:** Rare (weekly). Announced 5 minutes before.
**Duration:** 45 minutes
**Effect:** A powerful sewer creature surfaces into the city.
All player conflict suspended — Hostile state does not function.
City forces temporary alliance.
Killing the creature requires coordinated group.
**Reward:** Significant loot, Mercy score increase for all
participants, city-wide title: **Hunt Survivor**.
**Grommash:** *"Everything else waits."*

---

## PLAYER MEMORY SYSTEM

Players who commit major acts become part of the city's lore.
Their names appear in tavern conversation, noticeboard notices,
and NPC dialogue as part of the living world texture.

### Memory Triggers
- First player to reach sewer Level 5
- Highest kill count in a session (Bleeder)
- Most contracts completed (Mercenary)
- First recorded Oathbreaker
- Surviving 10+ deaths (The Survived)
- First guild to claim territory

### Memory Implementation
```javascript
const PLAYER_MEMORIES = {
  first_deep: "They say {name} went all the way to the bottom. 
               No one's confirmed what they found.",
  oathbreaker: "{name} broke a vow in the ash. 
                The city whispered it.",
  survived: "{name} keeps coming back. 
             Kelvaris has stopped looking surprised.",
};
```

Names appear in:
- Noticeboard NPC-generated posts
- Kelvaris idle dialogue
- Grommash bounty board entries
- Thalara conversation about other players

---

## NPC INTEGRATION

Every major NPC responds to PvPvE state.

### Grommash
- Enforces contracts (aware of all active contracts)
- Hunts Oathbreakers and Bleeders
- Warns players about dangerous reputations
- Shifts patrol toward Hostile concentrations
- Respects The Warden's Shadow title
- Cools toward Oathbreakers: prices increase
- Guild registration handled through him

### Othorion
- Senses anomalies when 4+ players gather in one location
  *"Something shifts when too many gather here. 
   The city notices congregation."*
- Comments on betrayal resonance
- Sells illegal concoctions — reputation affects availability
- Pip reacts to high-cruelty players before Othorion does

### Thalara
- Refuses to heal players with Bleeder title
  *"I'll heal wounds. Not whatever you're doing out there."*
- Gives revive speed bonus to Protector title players
- Prices -25% for Merciful alignment
- Prices +50% for Cruel alignment
- She notices. She doesn't lecture. She adjusts.

### Seris
- Reacts to players who help her artifact quest
- Reacts to players who hinder or steal from her
- Oathbreakers get a specific Seris response:
  *"You're willing to do what others won't."*
  *She files this away.* (Affects her arc — she considers
  whether an Oathbreaker might be useful to her plan.)
- High-Order players she trusts slightly more with arc details

### Kelvaris
- All alignment history visible in his responses
- The Survived players get specific acknowledgment
- Bleeder players get the death tier response
  regardless of actual death count
- He knows about every Oathbreaker in the city

### Veyra
- Treats every player the same.
- This is conspicuous.
- Grommash respects this.

### Caelir
- More guarded with Oathbreakers
- More open with Mercenary and Warden's Shadow titles
- His distance increases with Chaos score

---

## BACKEND IMPLEMENTATION

### New D1 Tables

```sql
-- Player relationships
CREATE TABLE IF NOT EXISTS player_relationships (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_a INTEGER NOT NULL,
  player_b INTEGER NOT NULL,
  state TEXT DEFAULT 'neutral',    -- neutral/party/contract/hostile
  trust_level TEXT DEFAULT 'stranger',
  trust_points INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(player_a, player_b)
);

-- Active contracts
CREATE TABLE IF NOT EXISTS contracts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  initiator_id INTEGER NOT NULL,
  target_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  terms TEXT NOT NULL,             -- JSON
  reward TEXT,                     -- JSON
  penalty TEXT,                    -- JSON
  witness_id INTEGER,              -- NPC or player ID
  status TEXT DEFAULT 'active',    -- active/completed/breached
  expires_at INTEGER,
  created_at INTEGER NOT NULL
);

-- Guilds
CREATE TABLE IF NOT EXISTS guilds (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  tier INTEGER DEFAULT 1,
  leader_id INTEGER NOT NULL,
  color TEXT DEFAULT 'ember',
  reputation INTEGER DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS guild_members (
  guild_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  rank TEXT DEFAULT 'member',
  joined_at INTEGER NOT NULL,
  PRIMARY KEY (guild_id, user_id)
);

CREATE TABLE IF NOT EXISTS guild_stash (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  guild_id INTEGER NOT NULL,
  item TEXT NOT NULL,
  tier INTEGER DEFAULT 1,
  deposited_by INTEGER NOT NULL,
  deposited_at INTEGER NOT NULL
);

-- Player titles
CREATE TABLE IF NOT EXISTS player_titles (
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  earned_at INTEGER NOT NULL,
  active INTEGER DEFAULT 0,         -- only one active at a time
  PRIMARY KEY (user_id, title)
);

-- World events
CREATE TABLE IF NOT EXISTS world_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  started_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  data TEXT                          -- JSON, event-specific
);

-- Player memory (city lore)
CREATE TABLE IF NOT EXISTS player_memories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  memory_type TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  data TEXT                          -- JSON
);
```

### New API Endpoints

```
POST /api/party/invite        — invite player to party
POST /api/party/accept        — accept party invitation
POST /api/party/leave         — leave party (no betrayal)
POST /api/party/betray        — attack party member (triggers cascade)

POST /api/contract/create     — create contract with terms
POST /api/contract/accept     — accept contract
POST /api/contract/breach     — formal breach declaration
GET  /api/contract/active     — get player's active contracts

POST /api/guild/create        — register guild with Grommash
POST /api/guild/invite        — invite player to guild
POST /api/guild/accept        — accept guild invitation
POST /api/guild/stash/deposit — deposit item to guild stash
POST /api/guild/stash/withdraw — withdraw from guild stash
POST /api/guild/war/declare   — declare guild war

POST /api/player/threaten     — threaten another player
POST /api/player/surrender    — offer surrender
POST /api/player/revive       — revive downed player

GET  /api/world/events        — get active world events
GET  /api/player/titles       — get player's titles
GET  /api/player/relationship/:target — get relationship state
```

### Chat Integration
Guild chat uses existing chat system with new channel type:
- `GET /api/chat/guild?since=TIMESTAMP`
- `POST /api/chat/send` with `channel: 'guild'`
- Guild members only. Auth checks guild membership.

### Frontend Integration
- Party members visible on node map (shared pings)
- Hostile players show subtle indicator in local chat names
- Downed state triggers UI prompt for nearby players
- World events announced in global chat + visual indicator
- Guild name + color displayed next to player name in chat
- Contract status visible in character sheet

---

## IMPLEMENTATION ORDER

Phase 1 — Foundation (implement first):
1. D1 schema (all new tables)
2. Player relationship tracking
3. Party system (invite, accept, leave, betray)
4. Downed player system with alignment consequences

Phase 2 — Economy:
5. Contract system (create, accept, breach)
6. Title system (award, display, NPC reactions)
7. Trust level calculation and effects

Phase 3 — Social:
8. Guild system (create, members, stash, chat channel)
9. Guild vs Guild (war declaration)
10. Player memory system (city lore appearances)

Phase 4 — World:
11. World events (Ash Tremors first)
12. Threat system
13. City reactions to alignment thresholds

Phase 5 — NPC Integration:
14. All NPC dialogue conditionals on titles/alignment
15. Grommash patrol shifts
16. Othorion congregation sensing

---
*PvPvE System version 1.0 — Verasanth*
*Part of the Verasanth Systems Bible*
