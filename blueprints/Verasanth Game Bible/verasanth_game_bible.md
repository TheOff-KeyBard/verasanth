# VERASANTH — GAME BIBLE
**Version:** 1.0
**Last Updated:** 2026-03-06
**Status:** Living Document — add modules as systems are built

---

## HOW TO USE THIS DOCUMENT

This bible is the single source of truth for Verasanth.
Every system, character, location, and design rule lives here or links to a dedicated module file.

**Adding a new module:**
1. Create `blueprints/[category]/[system].md`
2. Add a one-line entry to the relevant section below with a link and status
3. Never duplicate content — the module is the source, this is the index

**Status tags used throughout:**
- `[DESIGNED]` — fully specced, not yet built
- `[IMPLEMENTED]` — built and in production
- `[PARTIAL]` — foundation exists, needs expansion
- `[DEFERRED]` — designed, intentionally not built yet

---

## PART 1 — THE WORLD

### 1.1 Core Premise

Verasanth is a city that should not exist and knows it.

Players arrive with no memory of how they got here — only that they woke up in the Shadow Hearth Inn and the city feels *familiar* in ways it shouldn't. The city is alive in a non-metaphorical sense. It has a mechanism beneath it. The mechanism is still running. Someone is trying to use it.

**The central dramatic question:** What is Verasanth, and what happens when the portal opens?

**Tone:** Gothic, atmospheric, morally weighted. Not horror — *dread*. The city doesn't threaten players. It watches them, remembers them, and adjusts accordingly. NPCs are not quest-givers. They are people with histories, agendas, and the ability to be permanently affected by what the player does.

**The world's secret (known to writers, hidden from players until earned):**
Verasanth is a city built over a mechanism of unknown origin. The mechanism was designed to do something. Seris Vantrel has been searching for the artifacts that will activate it. When the portal opens, the nature of the city changes. What lies below is not Hell in the religious sense — it is something older, and it has been waiting.

---

### 1.2 The City — Location Map

```
                    [PALE RISE — West Road]
                           |
[TAVERN] ← [NORTH ROAD] → [ATELIER]
               |
        [MARKET SQUARE] ← Sewer Grate (down)
               |
      [SOUTH ROAD — Low Quarter]
        /              \
[MENDED HIDE]      [STILL SCALE]
               |
         [EAST ROAD]
        /              \
[HOLLOW JAR]      [ASHEN SANCTUARY]
```

**Named Locations:**

| ID | Name | Owner/NPC | Status |
|----|------|-----------|--------|
| `market_square` | The Market Square | — | `[IMPLEMENTED]` |
| `tavern` | The Shadow Hearth Inn | Kelvaris Thornbeard | `[IMPLEMENTED]` |
| `atelier` | Dawnforge Atelier | Caelir Dawnforge | `[IMPLEMENTED]` |
| `mended_hide` | The Mended Hide | Veyra Emberhide | `[IMPLEMENTED]` |
| `still_scale` | The Still Scale | The Trader | `[IMPLEMENTED]` |
| `hollow_jar` | The Hollow Jar | Thalara Mirebloom | `[IMPLEMENTED]` |
| `ashen_sanctuary` | The Ashen Sanctuary | — (the city) | `[IMPLEMENTED]` |
| `cinder_cells` | The Cinder Cells | Grommash | `[IMPLEMENTED]` |
| `north_road` | North Road | — | `[IMPLEMENTED]` |
| `south_road` | South Road | — | `[IMPLEMENTED]` |
| `east_road` | East Road | — | `[IMPLEMENTED]` |
| `west_road` | Pale Rise | — | `[IMPLEMENTED]` |
| `alley` | Narrow Alley | — | `[IMPLEMENTED]` |
| `sewer_entrance` | Sewer Entrance | — | `[IMPLEMENTED]` |

**Module:** `blueprints/world/locations.md` — *pending dedicated file*

---

### 1.3 The Sewers — Five Floors

The sewers are Verasanth's primary dungeon and the backbone of the early-to-mid game economy. Five floors, each with a distinct identity, enemy ecosystem, and narrative purpose.

**Unlock structure:** Floors 1–2 open. Floors 3–5 require boss clears from the previous floor.

**Floor Summary:**

| Floor | Name | Identity | Boss | Status |
|-------|------|----------|------|--------|
| 1 | The Drains | Filth, vermin, tutorial danger | Rat King | `[IMPLEMENTED]` |
| 2 | The Forgotten Channels | Fungal, older stone, first anomalies | Sporebound Custodian | `[IMPLEMENTED]` |
| 3 | The Cistern Depths | Flooded, drowned dead, first artifact | Cistern Leviathan | `[IMPLEMENTED]` |
| 4 | The Mechanist's Spine | Ancient machinery, heat, heartbeat | Broken Regulator | `[IMPLEMENTED]` |
| 5 | The Sump Cathedral | Ritual chamber, the city's breath | Ash Heart Custodian | `[IMPLEMENTED]` |

**Module:** `blueprints/world/sewers_complete.md` — `[IMPLEMENTED]`

---

### 1.4 The Cinder Cells

Verasanth's jail. Four connected nodes beneath the Market Square.
Run by Grommash. Heat source predates the city. The truth rune in the pit was not installed by Grommash — he found it there.

**Nodes:** `cinder_cells_entrance`, `cinder_cells_hall`, `cinder_cells_block`, `cinder_cells_pit`

**Module:** `blueprints/world/cinder_cells.md` — `[IMPLEMENTED]`

---

## PART 2 — CHARACTERS

### 2.1 NPC Roster

| Name | Role | Location | Trust System | Arc |
|------|------|----------|--------------|-----|
| Kelvaris Thornbeard | Innkeeper, city memory | `tavern` | Yes | Sees the gaps in the city's memory |
| Caelir Dawnforge | Weaponsmith | `atelier` | Yes | Something in the locked chest. The unfinished blade. |
| Veyra Emberhide | Armorsmith | `mended_hide` | Yes | The wall symbols mean something. She knows. |
| Thalara Mirebloom | Alchemist/healer | `hollow_jar` | Yes | Someone she knew went into the sewers. They didn't come back. |
| Seris Vantrel | Artifact curator | `market_square` | Yes | Assembling the mechanism. She knows exactly what she's doing. |
| Othorion | Researcher | `crucible` | Yes | Treats the city as data. Becomes uneasy when data stops making sense. |
| Grommash | Warden/enforcer | `cinder_cells` | Yes | Believes in the ledger. Doesn't know what he's guarding. |
| The Trader | General merchant | `still_scale` | No | Too calm. Knew what to stock before anyone arrived. |
| Pip | Othorion's familiar | `crucible` | No | Points at things. Always correct. Never explains. |

### 2.2 NPC Design Rules

These rules apply to every NPC in Verasanth and must be preserved across all implementations:

1. **NPCs are people, not quest boards.** They have opinions, moods, and the ability to refuse players.
2. **No NPC speaks beyond their knowledge.** Kelvaris doesn't explain the city. He's been here too long to explain it — he just lives in it.
3. **Trust is earned through action, not dialogue.** NPC dialogue gates open based on player_flags and trust scores, never on asking the right question.
4. **Every NPC has one thing they won't discuss.** Kelvaris won't discuss the name in the ledger. Veyra won't discuss the wall symbols. Caelir won't discuss the locked chest. These are permanent until arc conditions are met.
5. **NPC reactions to the sewer are non-negotiable.** The artifact retrieval cascade (Seris composure crack, Othorion model shift, Grommash warning, Kelvaris setting down his glass) triggers exactly as designed. It is the pivot of Arc 1.

### 2.3 Marrowin Dask

Not an NPC. A thread.

Dask is referenced throughout the sewer as someone who descended further than anyone. His trail is breadcrumbs across all five floors, culminating in a personal note below the Level 5 inscription: *"I understand now. I am not leaving. The city needs someone down here. — M.D."*

Dask is alive. Somewhere below Level 5. He is not a boss. He is not an enemy. He is what the player is becoming.

**Do not resolve Dask until Arc 2 is designed.**

---

## PART 3 — SYSTEMS

### 3.1 Combat System `[IMPLEMENTED]`

**Core design:** Turn-based, stat-driven, trait-layered.

**Player stats:** STR, DEX, CON, INT, WIS, CHA (default 10 = neutral modifier)
**HP formula:** `20 + statMod(CON) * 3` — CON 10 = 20 HP baseline
**Stat modifier:** `floor((stat - 10) / 2)`

**Enemy structure:**
```
{
  damage: { min, max },
  accuracy: percentage,
  defense: flat damage reduction,
  break_threshold: damage required to stagger,
  archetype: swarmer | skirmisher | bruiser | elite,
  trait: [see trait list]
}
```

**Implemented traits:** `bleed`, `poison`, `fire_touch`, `stagger`, `lunge`, `guard`, `drain`, `armor_break`
**Deferred traits:** `summon`, `spore_burst`, `sync`, `phase`, `coil`, `flood_surge`, `judgment`, multi-phase bosses

**Enemy floor scaling:**
| Floor | HP Range | DMG Range | Accuracy |
|-------|----------|-----------|----------|
| 1 | 18–28 | 3–5 | 60–65% |
| 2 | 35–55 | 7–11 | 65–70% |
| 3 | 50–75 | 12–18 | 70–75% |
| 4 | 70–110 | 18–26 | 75–80% |
| 5 | 90–140 | 22–32 | 80–85% |

**Files:** `data/combat.js`, `services/combat.js`
**Module:** `blueprints/systems/combat_enemies.md` — `[IMPLEMENTED]`

---

### 3.2 Item Generation System `[DESIGNED]`

**Six tiers:** Rusted (1) → Worn (2) → Forged (3) → Tempered (4) → Ashbound (5) → Corrupted (6)

**Tier formula:**
```javascript
item_tier = clamp(player_tier, dungeon_tier, dungeon_tier + 1)
player_tier = floor(player_level / 5) + 1
```

**Corrupted items:** 3–5% drop from Tier 3+. One tier above base. Always carry a curse alongside the bonus.

**Curse types:** Minor (manageable), Major (significant tradeoff), Rare (severe high-reward)

**NPC reactions to corrupted items:**
- Veyra: *"I won't work with that."* — refuses
- Seris: buys at premium (1.8× value)
- Othorion: identifies curses

**Module:** `blueprints/systems/items.md` — `[DESIGNED]`

---

### 3.3 Alignment System — The Warden's Ledger `[PARTIAL]`

Two axes. Both tracked. Neither shown to the player as numbers.

**Mercy ↔ Cruelty** (how you treat others): decays toward 0 at 5 pts/hour
**Order ↔ Chaos** (how you treat the city's rules): **permanent — the city never forgets structural betrayal**

**Range:** -200 to +200 each axis. Starting: 0/0.

**Schema (implemented):** `alignment_morality`, `alignment_order` on characters table
**Schema (designed, not yet built):** `crime_heat`, `archetype`, `last_decay`, `crime_log`, `bounties`, `sentences`

**Archetypes (computed, never shown directly):**

| Archetype | Condition |
|-----------|-----------|
| Protector | High mercy + high order |
| Vigilante | High mercy + high chaos |
| Wanderer | High mercy, neutral order |
| Enforcer | Low mercy + high order |
| Mercenary | Low mercy + high order (alt) |
| Predator | Low mercy, neutral order |
| Survivor | Neutral both |
| Cutpurse | Neutral mercy + high chaos |
| Butcher | Low mercy + high chaos |

**Crime heat tiers:**
| Heat | Tier | Consequence |
|------|------|-------------|
| 1–3 | Ruffian | Warnings, Grommash watches |
| 4–6 | Killer | Active tracking, bounty posted |
| 7–10 | Butcher | Grommash hunts |
| 11–15 | Dread | City mobilized |
| 16+ | Ash Wraith | Citywide alert, maximum bounty |

**Player-facing display:** Direction bars only — no numbers. Bounty indicator if active.

**Module:** `blueprints/systems/alignment.md` — `[DESIGNED]`

---

### 3.4 PvPvE System `[DESIGNED]`

Four interaction states: **Neutral** → **Party** (oath) → **Contract** (witnessed) → **Hostile**

**Party oath effects:** Shared map pings, -15% friendly fire, faster revives, combined threat score.

**Trust levels:** Stranger → Known → Trusted → Bloodbound
Betrayal resets trust instantly and permanently in that session.

**Party → Betrayal → Hostile** triggers: -80 Cruelty, -60 Chaos, city whisper *"A vow breaks in the ash."*

**Downed player choices:**
- Revive (+15 Mercy)
- Loot (+20 Chaos)
- Finish (+30 Cruelty)
- Leave (neutral)
- Threaten (outcome-dependent)

**Guild tiers:** Crew → Company → Brotherhood → Covenant → Sovereign (1–5)

**Social titles (functional, not cosmetic):** Oathbreaker, Mercenary, Warden's Shadow, Ash Dealer, Bleeder, Protector, Dreadborn, The Survived

**World events:** Ash Tremors (forced cooperation), Sewer Surge (forced proximity), City Breathes (city corrects chaos), Pale Hunt (mandatory alliance)

**Module:** `blueprints/systems/pvpve.md` — `[DESIGNED]`

---

### 3.5 Economy System `[PARTIAL]`

**Currencies:** Ash Marks (AM) — primary. Ember Shards — rare. Soul Coins — deferred.

**Death penalty:** 20% AM loss. Dropped at death location. Anyone can loot. 30-min despawn. Equipped items safe.

**Vendor sell price:** 0.5× base value (all vendors)
**Corrupted item multiplier:** 1.8× (Seris only)

**Economy loop by floor:**

| Floor | Output | Primary Buyer |
|-------|--------|---------------|
| 1 | Rat pelts, fungi, junk, worn gear | Veyra, Thalara, Caelir, Still Scale |
| 2 | Glowing spores, crafting scrap, common gear | Othorion, Thalara, Caelir |
| 3 | Rare algae, drowned relics, resonant scrap | Thalara, Seris |
| 4 | Mechanist components, vent ash, masterwork gear | Caelir, Othorion, Seris |
| 5 | Relics, corrupted gear, cathedral shards | Seris (primary) |

**Vendor buy/sell UI:** `[IMPLEMENTED]` for Caelir, Veyra, Thalara
**Bounty board UI:** `[DESIGNED — pending alignment backend]`

---

### 3.6 Fetch Quest System `[DESIGNED]`

Two types: **Static** (NPC-assigned, narrative weight, arc-connected) and **Dynamic** (system-generated, rotates with sewer conditions, 45-min expiry)

**Static quest chains:**

| NPC | Quest Chain | Arc Connection |
|-----|-------------|----------------|
| Othorion | Reagent runs → Rat King Musk → Anomaly investigation | Othorion arc seeds |
| Thalara | Common reagents → Flood records → Lost healer's kit | Thalara Arc 2 |
| Caelir | Lost tool → Mechanist scrap → Heart Pump fragment | Caelir arc advance |
| Seris | Resonant scraps → Custodian core → Ashbound Resonance | Seris Arc 1 completion |
| Grommash | Nest clear → Construct culling → Patrol support | Alignment/order rewards |

**Dynamic sewer conditions (rotate every 45 minutes):**
- Fungal Bloom Surge (Floors 1–2)
- Water Pressure Spike (Floors 3–4)
- Construct Malfunction (Floor 4)
- Ash Whisper Event (Floor 5)
- Vermin Migration (Floors 1–2)
- Heat Vent Instability (Floors 4–5)

Each condition changes: enemy spawns, loot tables, hazards, route accessibility, and posts a message to global chat in the NPC's voice.

**Module:** `blueprints/world/sewers_complete.md` — `[DESIGNED]`

---

### 3.7 Memory & City Lore System `[DESIGNED — not yet implemented]`

The city remembers players. Memory is not passive — it shapes the world.

**Memory rules:**
1. **Impact, not intent.** The city records what changed it, not what players meant to do.
2. **Patterns, not events.** Ten murders becomes lore. One murder is a crime.
3. **What it fears.** Opening forbidden doors, touching artifacts, descending too far — these trigger deeper memory layers.

**Memory mutation chain:**
```
Rumor → Tavern Tale → Bounty Record → Chronicle Entry → Ghost Echo → Shrine
```
Each stage requires time and threshold conditions. Mutation runs on a cron timer.

**Memory is sometimes wrong.** The city mythologizes, not documents.
A rumor may exaggerate kill counts. A Chronicle entry may misattribute a heroic act. A wanted poster may show the wrong face. Players become legends *because* the city distorts them.

**Alignment influences memory:**
- Mercy-aligned: failures remembered more than successes
- Cruelty-aligned: crimes remembered vividly, stains that don't fade
- Order-aligned: contracts, oaths, and patterns recorded
- Chaos-aligned: remembered inconsistently — fragmented, contradictory

**NPC interpretations of the ledger:**
- Grommash: *"The ledger is truth."*
- Othorion: *"The ledger is data."*
- Thalara: *"The ledger is emotional residue."*
- Seris: *"The ledger is a key."*
- Kelvaris: *"The ledger is dangerous."* — and he is the only one who notices the gaps

**Memory blind spots (critical lore):**
The city does not remember: anything tied to the portal, anything tied to the artifacts, certain deaths, certain NPCs, events that "should not be." These gaps are invisible to everyone except Kelvaris. He never volunteers this. He only confirms it if a player finds a gap themselves and asks directly.

**Exploitable memory** `[DEFERRED — requires black market faction]`:
- Erase graffiti
- Forge bounty posters
- Plant false rumors
- Alter ghost echoes
- Bribe scribes

**Module:** `blueprints/systems/memory_lore.md` — `[DESIGNED — file pending]`

---

### 3.8 Bounty Board System `[DESIGNED — pending alignment backend]`

Two types of bounties:

**Official (Warden's Post):** Auto-generated from crime_heat thresholds. Enforced by Grommash and city patrols.

| Heat Tier | Auto-Bounty Reward |
|-----------|-------------------|
| Killer (4–6) | 200 AM |
| Butcher (7–10) | 400 AM |
| Dread (11–15) | 750 AM |
| Ash Wraith (16+) | 1,500 AM |

**Player bounties (Market Noticeboard):** 25 AM posting fee + reward held in escrow. 72-hour expiry. Any player can claim.

**Player-facing UI (designed):**
- Wardens Post: official bounties, target name/archetype/last known location
- Noticeboard: player bounties, posted by whom (anonymous option), reason
- Personal: current bounty status, crime heat indicator (no numbers — visual bar only)

**Implementation order:** Alignment backend first → then bounty board UI.

**Module:** `blueprints/systems/alignment.md` — included in alignment spec

---

## PART 4 — NARRATIVE

### 4.1 Arc Structure

Verasanth's story runs in arcs, not levels. Arcs are triggered by player actions, not by reaching a zone.

**Arc 1 — The Descent** `[PARTIALLY IMPLEMENTED]`
*The player discovers what is beneath the city.*
- Trigger: First entry into the sewer
- Climax: Retrieval of the Ashbound Resonance from Floor 5
- Resolution: Seris receives the artifact. Her composure breaks. The NPC cascade fires. Everything changes.
- Player understanding at arc end: The city has a mechanism. Seris is assembling it. Othorion is afraid of what it means.

**Arc 2 — The Mechanism** `[DESIGNED — not yet written]`
*What happens after Seris activates the first artifact.*
- Trigger: Ashbound Resonance delivered
- New sewer content appears (post-portal evolution)
- Dask thread deepens
- Kelvaris begins acknowledging the gaps

**Arc 3 — The Portal** `[CONCEPT ONLY]`
*The portal opens. The nature of Verasanth changes.*
- This is the pivot point of the entire game
- Design deferred until Arc 2 is complete

---

### 4.2 The Seris Thread

Seris Vantrel is the game's primary narrative driver. She is not a villain. She is not a hero. She is someone who has been working toward a specific goal for a very long time and has no intention of stopping because a player arrived.

**Her arc in three beats:**
1. She is collecting artifacts. She is patient, composed, and professional.
2. The Ashbound Resonance cracks her composure. For the first time, she is *affected*.
3. She activates the mechanism. She knew exactly what it would do. She did it anyway.

**Her relationship to the player:** She needs them as a retrieval agent. She respects competence. She does not form attachments. The moment she has what she needs, her priorities shift.

**The question the player should be asking by Arc 2:** *"Did I help her, or did I help the city? Are those the same thing?"*

---

### 4.3 Key Lore Facts (Established, Do Not Contradict)

1. The city of Verasanth predates its current iteration. It has been rebuilt over itself more than once.
2. The sewer was not built as a sewer. The sewer's original function is unknown. The mechanism is the closest thing to an answer.
3. The Cinder Cells' heat source predates the cells. Grommash did not install it. He doesn't know what it is.
4. The truth rune in the pit was there before Grommash. It pulses brighter when someone speaks a direct lie. After Seris's portal opens, it pulses independently.
5. Marrowin Dask went into the sewer on at least seven descents. His final note reads: *"I understand now. I am not leaving. The city needs someone down here."* He is not dead.
6. The Ashen Sanctuary has no deity. Whatever is in there is older than gods and is not one.
7. Kelvaris has been at the Shadow Hearth for longer than the current city. The ledger behind his bar goes back centuries in multiple handwritings. Some names appear more than once, separated by decades.
8. Pip is always correct. Pip never explains.

---

## PART 5 — TECHNICAL

### 5.1 Stack

- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Frontend:** Vanilla JS / HTML served from Worker
- **AI:** Anthropic Claude API (NPC dialogue)
- **Cron:** Cloudflare Cron Triggers (sewer condition rotation, alignment decay)

### 5.2 Core Database Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | Auth, credentials | `[IMPLEMENTED]` |
| `characters` | Stats, location, alignment, currency | `[IMPLEMENTED]` |
| `inventory` | Items, equipped state, tier, corrupted flag | `[IMPLEMENTED]` |
| `player_flags` | All boolean progression flags | `[IMPLEMENTED]` |
| `combat_state` | Active combat, enemy, status effects | `[IMPLEMENTED]` |
| `npc_trust` | Per-NPC trust score per player | `[IMPLEMENTED]` |
| `quests` | Static and dynamic quest tracking | `[DESIGNED]` |
| `crime_log` | Crime history for heat calculation | `[DESIGNED]` |
| `bounties` | Official and player bounties | `[DESIGNED]` |
| `sentences` | Cinder Cells sentences, escape tracking | `[DESIGNED]` |
| `player_relationships` | PvP trust/state between players | `[DESIGNED]` |
| `contracts` | Formal player-to-player agreements | `[DESIGNED]` |
| `guilds` | Guild registry | `[DESIGNED]` |
| `guild_members` | Guild membership | `[DESIGNED]` |
| `player_titles` | Awarded social titles | `[DESIGNED]` |
| `sewer_conditions` | Active dynamic condition | `[DESIGNED]` |
| `memory_events` | City memory entries | `[DESIGNED]` |
| `world_events` | Active world events | `[DESIGNED]` |

### 5.3 Key Player Flags Reference

Flags stored in `player_flags` table. Boolean. All default 0.

**Sewer progression:**
- `seen_sewer_wall_markings` — first entry into sewer
- `seen_sewer_level2` through `seen_sewer_level5`
- `boss_floor1` through `boss_floor4` — gate unlock flags
- `nest_cleared_floor1` — Grommash bounty completion
- `found_flood_records` — Thalara arc seed
- `cistern_artifact_found` — Seris arc 1 activates

**NPC arcs:**
- `seris_arc_interest` — first resonant item sold
- `seris_arc_1_primed` — custodian core delivered
- `seris_arc_1_complete` — Ashbound Resonance retrieved
- `othorion_arc_seed` — symbols seen, Level 2
- `caelir_arc_advance` — heart pump fragment delivered
- `thalara_arc_seed` — flood records found
- `thalara_arc_2_active` — healer's kit returned

**Alignment:**
- `has_active_bounty` — computed from bounties table
- `cinder_cells_escaped` — permanent chaos mark

### 5.4 NPC Dialogue Architecture

Every NPC uses Claude API for dialogue generation. Context passed per call:

```javascript
{
  player_name,
  player_class,
  player_level,
  player_location,
  npc_name,
  relevant_flags: [...],    // only flags this NPC cares about
  trust_level,
  archetype,                // computed alignment label
  recent_actions: [...],    // last 3 significant player actions
  active_quest_with_npc,
  alignment: 'light' | 'neutral' | 'dark'  // legacy, being replaced by archetype
}
```

**NPC system prompts are fixed.** Do not modify NPC system prompts to change fundamental personality. NPC personality is a design decision, not a tuning parameter.

### 5.5 Combat Service Architecture

```
index.js
  ├── combat/start  →  randomEnemy(location) from services/combat.js
  │                    initializes: { status_effects, trait_state,
  │                                   armor_break_effects, round: 1,
  │                                   enemy_staggered: false }
  └── combat/action →  tickStatusEffects()
                       playerAttack() → checks break_threshold → stagger
                       resolveEnemyTrait() → handles lunge/stagger traits
                       enemyAttack() → accuracy check (d20 + DEX vs threshold)
                       getStatusEffectOnHit() → bleed/poison/fire_touch
                       getTraitOnHitEffect() → drain/armor_break
```

**Enemy data source:** `data/combat.js` → `COMBAT_DATA.enemies` and `sewer_floor_pools`
**Location-to-floor mapping:** `LOCATION_TO_FLOOR` in `data/combat.js`

---

## PART 6 — DESIGN RULES

These rules are not preferences. They are constraints. If a design decision contradicts one of these, the rule wins.

### 6.1 The City Is Not a Game Mechanic

The city is alive. Its systems (memory, heat, alignment, echo) should feel like the city's behavior, not like game systems the player is optimizing. This means:
- Never show raw numbers on alignment bars. Direction only.
- Never tell the player their archetype directly. Let NPCs reflect it.
- Never let the sewer feel like a level in a game. It has weather (conditions), history (graffiti, Dask), and opinion (the city watches players who go deep).

### 6.2 NPCs React, They Don't Explain

An NPC should never explain a game system to the player. Grommash doesn't say *"your crime heat is 7, which means..."*. He says *"The city has noticed you. Walk carefully."*

Othorion doesn't explain the artifact system. He notices a resonance shift and becomes uneasy.

The player learns through observation, not exposition.

### 6.3 Consequences Are Permanent

Alignment (especially Order/Chaos) does not reset. A player who broke a contract is an Oathbreaker. The city remembers. NPCs remember. This is not a bug in the system — it is the system.

Death penalty, bounties, crime heat: all designed to make decisions feel weighted without being punishing enough to cause players to quit.

### 6.4 The Sewer Is Never Finished

The sewer should feel like it always has another layer. This is both a design rule and a narrative one. After Arc 1, the pit at Floor 5 has stairs. Those stairs go somewhere. Marrowin Dask went down them. The player can too.

Build each layer before revealing the next one. Never hint at a layer you're not ready to build.

### 6.5 Seris Gets What She Wants

This is the most important rule. Seris is going to succeed. The portal will open. The mechanism will activate. The only question is what the player did along the way and whether they understand what they helped accomplish.

Do not design any system that lets the player "stop" Seris. They can delay her. They can ask questions. They cannot prevent the arc from completing. This is the point.

---

## APPENDIX — MODULE INDEX

| Module | Path | Status |
|--------|------|--------|
| Sewer (complete) | `blueprints/world/sewers_complete.md` | `[IMPLEMENTED]` |
| Cinder Cells | `blueprints/world/cinder_cells.md` | `[IMPLEMENTED]` |
| Combat & Enemies | `blueprints/systems/combat_enemies.md` | `[IMPLEMENTED]` |
| Items & Tiers | `blueprints/systems/items.md` | `[DESIGNED]` |
| Alignment & Crime | `blueprints/systems/alignment.md` | `[DESIGNED]` |
| PvPvE | `blueprints/systems/pvpve.md` | `[DESIGNED]` |
| Memory & Lore | `blueprints/systems/memory_lore.md` | `[PENDING FILE]` |
| NPC Blueprints | `blueprints/npcs/[name].md` | `[PENDING FILES]` |
| Arc 2 Design | `blueprints/narrative/arc2.md` | `[NOT STARTED]` |

---

*Verasanth Game Bible v1.0*
*The city remembers everything. So should this document.*
