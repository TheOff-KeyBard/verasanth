# VERASANTH — GAME BIBLE
**Version:** 2.0
**Last Updated:** 2026-03-08
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
- `[STUB]` — exists in code but not yet functional

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
       [STONE WATCH — Threshold Road NW]
                     |
       [BROKEN BANNER — Pale Rise N]
                     |
[TAVERN] ← [NORTH ROAD] → [ATELIER]  [ALLEY → BACKROOM]
               |
        [MARKET SQUARE] ← Sewer Grate (down)
         |    |    |
 [SOUTH ROAD] | [EAST ROAD]
  /     \     |    /        \
[MENDED [STILL  [HOLLOW  [ASHEN SANCTUARY]
 HIDE]  SCALE]   JAR]         |
  |                     [QUIET SANCTUM N]
[VEIL MARKET S]
                     |
               [EAST ROAD S]
                     |
           [EMBER QUARTER SOUTH]
                     |
           [ASHEN ARCHIVE entrance → hall]

       [UMBRAL COVENANT — Pale Rise down]
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
| `north_road` | North Road — Threshold District | — | `[IMPLEMENTED]` |
| `south_road` | South Road — Low Quarter | — | `[IMPLEMENTED]` |
| `east_road` | East Road — Ember Quarter | — | `[IMPLEMENTED]` |
| `west_road` | West Road — Pale Rise | — | `[IMPLEMENTED]` |
| `alley` | Narrow Alley | — | `[IMPLEMENTED]` |
| `sewer_entrance` | Sewer Entrance | — | `[IMPLEMENTED]` |
| `ember_quarter_south` | Ember Quarter — South End | — | `[DESIGNED]` |
| `ashen_archive_entrance` | The Ashen Archive — Entrance | — | `[DESIGNED]` |
| `ashen_archive_hall` | The Ashen Archive — Ember Hall | Vaelith Xyrelle | `[DESIGNED]` |
| `threshold_road` | Threshold Road — Eastern Approach | — | `[DESIGNED]` |
| `stone_watch_gate` | The Stone Watch — Gate | — | `[DESIGNED]` |
| `stone_watch_hall` | The Stone Watch — Shield Hall | Rhyla Thornshield | `[DESIGNED]` |
| `broken_banner_gate` | The Broken Banner — Gate | — | `[DESIGNED]` |
| `broken_banner_yard` | The Broken Banner — Training Yard | Garruk Stonehide | `[DESIGNED]` |
| `quiet_sanctum_entrance` | The Quiet Sanctum | Brother Halden Marr | `[DESIGNED]` |
| `veil_market_surface` | The Veil Market — Surface | — | `[DESIGNED]` |
| `veil_market_hidden` | The Veil Market — Hidden Bazaar | Lirael Quickstep | `[DESIGNED]` |
| `umbral_covenant_descent` | The Umbral Covenant — Descent | — | `[DESIGNED]` |
| `umbral_covenant_hall` | The Umbral Covenant — Gloom Hall | Serix Vaunt | `[DESIGNED]` |

**Exit patches to existing rooms (not yet implemented):**
- `east_road` → add `south: ember_quarter_south`
- `ashen_sanctuary` → add `north: quiet_sanctum_entrance`
- `west_road` → add `north: broken_banner_gate`, `down: umbral_covenant_descent`
- `south_road` → add `south: veil_market_surface`
- `north_road` → add `northwest: threshold_road`

**Module:** `blueprints/guild_npcs_v2.md` for guild rooms

---

### 1.3 The Sewers — Five Floors

The sewers are Verasanth's primary dungeon and the backbone of the early-to-mid game economy. Five floors, each with a distinct identity, enemy ecosystem, and narrative purpose.

**Unlock structure:** Floors 1–2 open. Floors 3–5 require boss clears from the previous floor.

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

Verasanth's jail. Four connected nodes beneath the Market Square. Run by Grommash. Heat source predates the city. The truth rune in the pit was not installed by Grommash — he found it there.

**Nodes:** `cinder_cells_entrance`, `cinder_cells_hall`, `cinder_cells_block`, `cinder_cells_pit`

**Module:** `blueprints/world/cinder_cells.md` — `[IMPLEMENTED]`

---

## PART 2 — CHARACTERS

### 2.1 NPC Roster — City Veterans

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

---

### 2.2 NPC Roster — Guild Leaders

Six guild leaders. Each runs a faction tied to an instinct and a currency layer.

| Name | Title | Guild | Instinct | Location |
|------|-------|-------|----------|----------|
| Vaelith Xyrelle | High PyreKeeper | Ashen Archive | `ember_touched` | `ashen_archive_hall` |
| Garruk Stonehide | High WarMarshal | Broken Banner | `ironblood` | `broken_banner_yard` |
| Brother Halden Marr | High FlameShepherd | Quiet Sanctum | `hearthbound` | `quiet_sanctum_entrance` |
| Lirael Quickstep | High VeilRunner | Veil Market | `streetcraft` | `veil_market_hidden` |
| Serix Vaunt | High UmbralSpeaker | Umbral Covenant | `shadowbound` | `umbral_covenant_hall` |
| Rhyla Thornshield | High Bulwark Captain | Stone Watch | `warden` | `stone_watch_hall` |

**Guild leader secrets (writers only):**
- **Vaelith:** The Archive fire was deliberate. The city is a containment sigil — built to imprison something below, not protect people. Has a Covenant informant she suspects is manipulating her.
- **Garruk:** Abandoned 32 fighters behind a sealed gate in a deep expedition. Quest hook: player finds a Broken Banner signet ring deep in the sewers.
- **Halden:** Believes Verasanth literally feeds on despair. Told only Thalara. Serix believes Halden is accidentally weakening something that should stay contained.
- **Lirael:** Theory: the city is a collection mechanism for exceptional individuals and escape may be impossible by design. Shared only with Othorion (who was disturbingly interested).
- **Serix:** Has never lied about what shadow magic does. Watches every Covenant member change without intervening. Believes shadow reveals true nature, not corrupts.
- **Rhyla:** City foundations are shifting from below. Quietly sealing passages. Has asked Vaelith about containment structures. Vaelith did not answer.

**Cross-guild tensions built into NPC dialogue:**
- Vaelith suspects Covenant informant among her researchers
- Rhyla and Lirael understand each other perfectly, which is the problem
- Serix believes Halden is weakening something that should stay contained
- Lirael shared the collection theory with Othorion (he was disturbingly interested)

**Module:** `blueprints/guild_npcs_v2.md` — `[DESIGNED]`

---

### 2.3 NPC Design Rules

1. **NPCs are people, not quest boards.** They have opinions, moods, and the ability to refuse.
2. **No NPC speaks beyond their knowledge.** Kelvaris doesn't explain the city. He just lives in it.
3. **Trust is earned through action, not dialogue.** Gates open via player_flags and trust scores, never from asking the right question.
4. **Every NPC has one thing they won't discuss.** Permanent until arc conditions are met.
5. **NPC reactions to the sewer are non-negotiable.** The artifact retrieval cascade is the pivot of Arc 1.
6. **Guild leaders have instinct-specific greetings.** Matching instinct gets a different first line — noted, not celebrated.
7. **Soul Coin rejection is universal among normal vendors.** *"Take that thing out of my shop before someone sees."*

---

### 2.4 Marrowin Dask

Not an NPC. A thread. Alive. Somewhere below Level 5. Not a boss, not an enemy. He is what the player is becoming.

**Do not resolve Dask until Arc 2 is designed.**

---

## PART 3 — SYSTEMS

### 3.1 Combat System `[IMPLEMENTED]`

**Player stats:** STR, DEX, CON, INT, WIS, CHA (default 10 = neutral modifier)
**HP formula:** `10 + statMod(CON) * 3 + class_stage * 4`
**Stat modifier:** `floor((stat - 10) / 2)`
**HP recalculated at combat start, not on login.**

**Enemy structure:** `{ damage: {min,max}, accuracy, defense, break_threshold, archetype, trait }`

**Implemented traits:** `bleed`, `poison`, `fire_touch`, `stagger`, `lunge`, `guard`, `drain`, `armor_break`

**Enemy floor scaling:**
| Floor | HP Range | DMG Range | Accuracy |
|-------|----------|-----------|----------|
| 1 | 18–28 | 3–5 | 60–65% |
| 2 | 35–55 | 7–11 | 65–70% |
| 3 | 50–75 | 12–18 | 70–75% |
| 4 | 70–110 | 18–26 | 75–80% |
| 5 | 90–140 | 22–32 | 80–85% |

**Files:** `data/combat.js`, `services/combat.js`

---

### 3.2 Instinct System `[IMPLEMENTED]`

Six instincts chosen at character creation. Shapes combat abilities, equipment affinity, and guild access.

| Instinct | Identity | Linked Guild |
|----------|----------|--------------|
| `ember_touched` | Fire, heat, transformation | Ashen Archive |
| `ironblood` | Endurance, aggression, pressure | Broken Banner |
| `hearthbound` | Healing, protection, warmth | Quiet Sanctum |
| `streetcraft` | Deception, speed, leverage | Veil Market |
| `shadowbound` | Drain, corruption, shadow | Umbral Covenant |
| `warden` | Defense, control, structure | Stone Watch |

**Code keys:** `ember_touched`, `ironblood`, `hearthbound`, `streetcraft`, `shadowbound`, `warden`
**Note:** `hearthbound` not `hearthborn`. Do not use the wrong key.

---

### 3.3 Level 5 Instinct Upgrades `[DESIGNED]`

At Level 5, players choose one of three permanent upgrades per instinct. 18 total.

| Instinct | Option A | Option B | Option C |
|----------|----------|----------|----------|
| `ember_touched` | fire_lash (burst) | ash_veil (defensive) | ember_mark (setup) |
| `hearthbound` | radiant_pulse (hybrid) | sanctuary_ward (protection) | quiet_prayer (passive) |
| `ironblood` | crushing_blow (burst) | battle_hardened (passive) | blood_surge (berserker) |
| `streetcraft` | backstab (assassin) | smoke_step (evasion) | dirty_trick (control) |
| `shadowbound` | void_bolt (drain) | curse_of_weakness (debuff) | dark_bargain (high-risk) |
| `warden` | shield_bash (control) | stone_guard (passive) | intercept (protector) |

**Status effects constant:** `data/status_effects.js` — `burn`, `stagger`, `blind`, `stun`, `marked`, `shield`, `damage_resist`, `empowered`, `untargetable`, `weakened`, `corrupted_power`

**Status resolution order:** stun check → untargetable check → burn tick → modifier application → enemy attack → player attack → decrement durations → remove expired

**Special rules:**
- Passives (`battle_hardened`, `stone_guard`, `quiet_prayer`) fire automatically — button disabled
- `shield_bash`: no shield equipped → damage only, no stun
- `backstab`: triggers when enemy has any negative status
- `intercept` solo: -25% incoming damage for 2 turns

**DB:** `upgrades TEXT DEFAULT '{}'` column on characters table
**Storage:** `{ level_5: "fire_lash", level_10: null, level_15: null, level_20: null }`

**Module:** `blueprints/verasanth_level5_upgrades_spec.md` — `[DESIGNED]`

---

### 3.4 Equipment System `[IMPLEMENTED]`

**Files:** `data/equipment.js`, `services/equipment.js`, `services/equipment_stats.js`

**Critical gap:** `aggregateEquipmentStats()` must be wired into `playerAttack()` and damage reduction. Equipment currently does nothing in combat.

**Key functions:** `canEquipItem()`, `aggregateEquipmentStats()`, `applyInstinctAffinities()`

**Module:** `blueprints/systems/verasanth_equipment_system_blueprint.md` — `[IMPLEMENTED]`

---

### 3.5 Item Generation System `[DESIGNED]`

**Six tiers:** Rusted (1) → Worn (2) → Forged (3) → Tempered (4) → Ashbound (5) → Corrupted (6)

**Tier formula:** `item_tier = clamp(player_tier, dungeon_tier, dungeon_tier + 1)`, `player_tier = floor(player_level / 5) + 1`

**Corrupted items:** 3–5% drop from Tier 3+. One tier above base. Always carry a curse.

**NPC reactions to corrupted items:** Veyra refuses. Seris buys at premium. Othorion identifies curses.

**Module:** `blueprints/systems/items.md` — `[DESIGNED]`

---

### 3.6 Alignment System `[PARTIAL]`

Two axes. Neither shown as numbers. **Mercy ↔ Cruelty** decays 5 pts/hour. **Order ↔ Chaos** is permanent.

**Range:** -200 to +200 each. Starting: 0/0.

**Archetypes (computed, never shown directly):** Protector, Vigilante, Wanderer, Enforcer, Mercenary, Predator, Survivor, Cutpurse, Butcher

**Crime heat tiers:** Ruffian (1–3) → Killer (4–6) → Butcher (7–10) → Dread (11–15) → Ash Wraith (16+)

**Module:** `blueprints/systems/alignment.md` — `[DESIGNED]`

---

### 3.7 Economy System `[PARTIAL]`

#### Three-Currency Architecture

Three currencies. **No conversion between them. Ever.**

| Currency | DB Column | Role | Feeling | How Obtained |
|----------|-----------|------|---------|--------------|
| Ash Marks | `ash_marks` | Survival | Gritty, transactional | Combat loot, selling items |
| Ember Shards | `ember_shards` | Guild/institutional | Power within the city | Guild trials, faction quests, elite enemies |
| Soul Coins | `soul_coins` | Infernal/forbidden | Dangerous, transgressive | Morally questionable acts: black market contracts, pact rituals, deep corruption, murdering sleeping players |

**The no-conversion rule is absolute.** No exchange rates. No conversion mechanic. SC is not a premium tier — it is a different thing.

#### Ash Marks — Street Economy

All normal transactions. NPCs: Caelir, Veyra, Thalara, Still Scale, Kelvaris.

**Death penalty:** 20% AM loss, dropped at death location, 30-min despawn.

**Display:** `"1 CC, 20 AM (120 AM)"` — always show raw AM in parentheses for values over 100.

#### Ember Shards — Guild Economy

Not from normal enemies. `1 ES ≈ 100 AM` in psychological weight only — not an exchange rate.

| Service Type | ES Cost |
|---|---|
| Guild trial entry | 1 ES |
| Advanced guild service | 2–3 ES |
| Rare equipment | 4–6 ES |

Guild → ES mapping: Archive, Broken Banner, Quiet Sanctum, Stone Watch use ES. Veil Market and Covenant use SC.

**Status:** ES wallet display wired. ES spend routes `[DEFERRED — guild trial system]`.

#### Soul Coins — Infernal Economy

NPCs that acknowledge SC: Serix, Lirael, possibly Vaelith.

**Uses:** Shadow rituals, forbidden items, corrupted equipment, future PvP bounty currency.

**Normal vendor rejection line:** *"Take that thing out of my shop before someone sees."* — all standard vendors.

**Status:** SC column active. SC spend routes `[DEFERRED — Covenant arc]`.

#### Vendor Pricing

**Anti-arbitrage rule:** `buy_price > sell_value` at every vendor, always. No item can be bought and resold for profit.

| Vendor | Specialty Buy Rate |
|--------|--------------------|
| Caelir | weapon: 40% |
| Veyra | armor/shield: 40%, loot_vendor: 35% |
| Thalara | loot_reagent: 120%, consumable: 50% |
| Still Scale | loot_scrap: 18%, default: 30% |
| Seris | loot_relic: 150%, loot_artifact: 120% |
| Lirael (black market) | All items ~46% net (55% gross − 15% cut) |

#### Cash Drop Formula

- Tier 1 (upper sewer): 5–10 AM
- Tier 2 (mid sewer): 10–18 AM
- Tier 3 (deep sewer): 15–28 AM

#### Item Categories

`loot_vendor`, `loot_reagent`, `loot_relic`, `loot_artifact`, `loot_scrap`, `consumable`, `weapon`, `armor`, `shield`, `gear`

`loot_scrap` (`rusted_gear`, `broken_pipe`, `charred_bolt` — 5–7 AM base) always drops something on tier 1, ensuring enemies never feel unrewarding.

#### Named Vendor Services (AM Gold Sinks)

Temp buffs stored as `player_flags` with combat countdown. No durability system needed.

**Caelir:** edge_hone (8 AM, +1 melee 5 combats), balanced_grip (10 AM, +3 accuracy 5 combats), heavy_draw (12 AM, +1 stagger 3 combats)

**Veyra:** strap_tighten (8 AM, +1 defense 5 combats), weight_redistribute (10 AM, +1 dodge 5 combats), shield_brace (12 AM, +2 block 3 combats)

**Thalara:** cleansing_tonic (20 AM, removes corruption_residue), ember_tonic (18 AM, +1 spell 5 combats), deep_lung_draught (15 AM, sewer resistance 8 combats)

**Seris:** Identify (40 AM) — reveals name, lore, hidden stats on unidentified relics/artifacts

**Othorion:** Appraise (25 AM) — reveals best buyer for a given item. Routing decision sink.

**Thalara compress:** 15 AM + 3× same loot_reagent → 1 extract worth 2.5× base_value

**Veil Market black market:** 55% gross / ~46% net. Location-gated to `veil_market_hidden`.

**Module:** `blueprints/systems/cursor_economy_blueprint_v2.md` — `[PARTIAL]`

---

### 3.8 PvPvE System `[DESIGNED]`

Four interaction states: Neutral → Party (oath) → Contract (witnessed) → Hostile

**Downed player choices:** Revive (+15 Mercy), Loot (+20 Chaos), Finish (+30 Cruelty), Leave (neutral), Threaten

**Guild tiers:** Crew → Company → Brotherhood → Covenant → Sovereign (1–5)

**Social titles (functional):** Oathbreaker, Mercenary, Warden's Shadow, Ash Dealer, Bleeder, Protector, Dreadborn, The Survived

**Module:** `blueprints/systems/pvpve.md` — `[DESIGNED]`

---

### 3.9 Fetch Quest System `[DESIGNED]`

**Static quest chains:** Othorion, Thalara, Caelir, Seris, Grommash — all arc-connected.

**Dynamic sewer conditions (rotate every 45 min):** Fungal Bloom Surge, Water Pressure Spike, Construct Malfunction, Ash Whisper Event, Vermin Migration, Heat Vent Instability

**Module:** `blueprints/world/sewers_complete.md` — `[DESIGNED]`

---

### 3.10 Memory & City Lore System `[DESIGNED — not yet implemented]`

**Mutation chain:** Rumor → Tavern Tale → Bounty Record → Chronicle Entry → Ghost Echo → Shrine

**Memory is sometimes wrong.** The city mythologizes. Players become legends because the city distorts them.

**Memory blind spots:** Anything tied to the portal, the artifacts, certain deaths, certain NPCs. Only Kelvaris notices the gaps.

**Module:** `blueprints/systems/memory_lore.md` — `[DESIGNED — file pending]`

---

### 3.11 Bounty Board System `[DESIGNED — pending alignment backend]`

| Heat Tier | Auto-Bounty |
|-----------|------------|
| Killer (4–6) | 200 AM |
| Butcher (7–10) | 400 AM |
| Dread (11–15) | 750 AM |
| Ash Wraith (16+) | 1,500 AM |

**Player bounties:** 25 AM posting fee + escrow. 72-hour expiry.

---

### 3.12 Guild System `[DESIGNED]`

Six guilds. Guilds are the primary progression path post-Level 5. Trials gate advancement and cost Ember Shards.

**Guild standing:** `player_flags` — `guild_standing_vaelith`, `guild_standing_garruk`, `guild_standing_halden`, `guild_standing_lirael`, `guild_standing_serix`, `guild_standing_rhyla`. Default 0, range 0–5.

**Currency layer:**
- Ashen Archive, Broken Banner, Quiet Sanctum, Stone Watch → Ember Shards
- Veil Market, Umbral Covenant → Soul Coins

**Module:** `blueprints/guild_npcs_v2.md` — `[DESIGNED]`

---

## PART 4 — NARRATIVE

### 4.1 Arc Structure

**Arc 1 — The Descent** `[PARTIALLY IMPLEMENTED]`
Trigger: First sewer entry. Climax: Ashbound Resonance retrieved. Resolution: NPC cascade fires. Everything changes.

**Arc 2 — The Mechanism** `[DESIGNED — not yet written]`
Trigger: Ashbound Resonance delivered. New sewer content. Dask thread deepens. Kelvaris acknowledges the gaps.

**Arc 3 — The Portal** `[CONCEPT ONLY]`
The portal opens. The nature of Verasanth changes. Design deferred until Arc 2 is complete.

---

### 4.2 The Seris Thread

Seris is not a villain. She is someone who has been working toward a specific goal for a very long time.

**Her arc:** Collecting (patient, composed) → Ashbound Resonance cracks her composure → She activates the mechanism. She knew exactly what it would do.

**The question the player should be asking by Arc 2:** *"Did I help her, or did I help the city? Are those the same thing?"*

---

### 4.3 Key Lore Facts (Established, Do Not Contradict)

1. Verasanth predates its current iteration. It has been rebuilt over itself more than once.
2. The sewer was not built as a sewer. The mechanism is the closest thing to an answer.
3. The Cinder Cells' heat source predates the cells. Grommash did not install it.
4. The truth rune pulses brighter when someone lies. After the portal opens, it pulses independently.
5. Marrowin Dask's final note: *"I understand now. I am not leaving. The city needs someone down here."* He is not dead.
6. The Ashen Sanctuary has no deity. Whatever is in there is older than gods and is not one.
7. Kelvaris has been at the Shadow Hearth longer than the current city. The ledger goes back centuries.
8. Pip is always correct. Pip never explains.
9. Verasanth is a containment sigil — built to imprison something below, not protect people. Vaelith has deduced this. She has not shared it.
10. The city collects exceptional people. Escape may not be possible by design. Lirael is tracking this.
11. **Unresolved:** Does Seris (curator/Vantrel) know what she is adjacent to regarding the root corruption source? Decide before expanding Vaelith's dialogue.

---

## PART 5 — TECHNICAL

### 5.1 Stack

- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Frontend:** Vanilla JS / HTML served from Worker
- **AI:** Anthropic Claude API (NPC dialogue)
- **Cron:** Cloudflare Cron Triggers (sewer condition rotation, alignment decay)

### 5.2 Architecture

```
index.js (router + world data)
  ├── data/equipment.js       — item data, INSTINCT_AFFINITIES
  ├── data/combat.js          — COMBAT_DATA, sewer_floor_pools, LOCATION_TO_FLOOR
  ├── data/status_effects.js  — STATUS_EFFECTS constant [DESIGNED]
  ├── data/maps.js            — MAP_DATA, LOCATION_TO_MAP
  ├── services/equipment.js   — equip/unequip, canEquipItem
  ├── services/equipment_stats.js — aggregateEquipmentStats, applyInstinctAffinities
  ├── services/combat.js      — randomEnemy, playerAttack, enemyAttack, status ticks
  └── services/map_renderer.js — updateSidebarMap, buildNodeClass
```

**Project uses ES modules bundled by wrangler. Do not flatten into a single file.**

### 5.3 Core Database Tables

| Table | Purpose | Status |
|-------|---------|--------|
| `users` | Auth, credentials | `[IMPLEMENTED]` |
| `characters` | Stats, location, alignment, currency, upgrades column | `[IMPLEMENTED]` |
| `inventory` | Items, equipped state, tier, corrupted flag | `[IMPLEMENTED]` |
| `player_flags` | All boolean/integer progression flags and combat buff countdowns | `[IMPLEMENTED]` |
| `combat_state` | Active combat, enemy, turn_count, statuses, player_statuses | `[IMPLEMENTED]` |
| `npc_trust` | Per-NPC trust score per player | `[IMPLEMENTED]` |
| `sessions` | Auth tokens | `[IMPLEMENTED]` |
| `quests` | Quest tracking | `[DESIGNED]` |
| `crime_log` | Crime history | `[DESIGNED]` |
| `bounties` | Official and player bounties | `[DESIGNED]` |
| `sentences` | Cinder Cells sentences | `[DESIGNED]` |
| `player_relationships` | PvP trust state | `[DESIGNED]` |
| `contracts` | Player-to-player agreements | `[DESIGNED]` |
| `player_titles` | Social titles | `[DESIGNED]` |
| `sewer_conditions` | Active dynamic condition | `[DESIGNED]` |
| `memory_events` | City memory entries | `[DESIGNED]` |
| `world_events` | Active world events | `[DESIGNED]` |

**No new tables without explicit design approval.** New flags → `player_flags`. New items → `inventory`.

### 5.4 Key Player Flags Reference

**Sewer progression:** `seen_sewer_wall_markings`, `seen_sewer_level2`–`5`, `boss_floor1`–`4`, `nest_cleared_floor1`, `found_flood_records`, `cistern_artifact_found`

**NPC arcs:** `seris_arc_interest`, `seris_arc_1_primed`, `seris_arc_1_complete`, `othorion_arc_seed`, `caelir_arc_advance`, `thalara_arc_seed`, `thalara_arc_2_active`

**Alignment:** `has_active_bounty`, `cinder_cells_escaped`, `has_corruption`

**Guild standing (integer 0–5):** `guild_standing_vaelith`, `guild_standing_garruk`, `guild_standing_halden`, `guild_standing_lirael`, `guild_standing_serix`, `guild_standing_rhyla`

**Combat buff countdowns (decrement each combat, remove at 0):**
`buff_edge_hone_combats_remaining`, `buff_balanced_grip_combats_remaining`, `buff_heavy_draw_combats_remaining`, `buff_strap_tighten_combats_remaining`, `buff_weight_redist_combats_remaining`, `buff_shield_brace_combats_remaining`, `buff_ember_tonic_combats_remaining`, `buff_deep_lung_combats_remaining`

**Instinct upgrades:** `characters.upgrades` JSON column — `{ level_5: "fire_lash", level_10: null, level_15: null, level_20: null }`

### 5.5 NPC Dialogue Architecture

```javascript
// Context object passed to every NPC call
{
  player_name, player_class, player_level, player_location,
  npc_name, relevant_flags, trust_level, archetype,
  recent_actions, active_quest_with_npc,
  alignment: 'light' | 'neutral' | 'dark',
  // Added in guild update:
  instinct,
  has_corruption,
  guild_standing: { vaelith, garruk, halden, lirael, serix, rhyla }
}
```

**NPC system prompts are fixed.** Do not modify to change fundamental personality.

### 5.6 Combat Service Architecture

```
combat/start  → randomEnemy(location)
              → init: { status_effects, trait_state, armor_break_effects,
                        round: 1, enemy_staggered: false,
                        turn_count: 0, statuses: {}, player_statuses: {} }

combat/action → tickStatusEffects()
              → aggregateEquipmentStats()   ← MUST BE WIRED (currently missing)
              → playerAttack() → break_threshold → stagger
              → resolveUpgradeAbility()     ← Level 5 upgrades
              → resolveEnemyTrait()
              → enemyAttack()
              → getStatusEffectOnHit()
              → getTraitOnHitEffect()
              → decrementBuffCountdowns()   ← player_flags buff timers
```

---

## PART 6 — DESIGN RULES

These rules are constraints. If a design decision contradicts one, the rule wins.

### 6.1 The City Is Not a Game Mechanic
Never show raw alignment numbers. Never name archetypes to players. Never let the sewer feel like a level. Never let currency feel like a game economy — AM is survival, ES is influence, SC is transgression.

### 6.2 NPCs React, They Don't Explain
No NPC explains a game system. Grommash doesn't say "your crime heat is 7." He says "The city has noticed you." The player learns through observation.

### 6.3 Consequences Are Permanent
Order/Chaos does not reset. An Oathbreaker stays an Oathbreaker. The city remembers. This is the system.

### 6.4 The Sewer Is Never Finished
Build each layer before revealing the next. Never hint at a layer you're not ready to build.

### 6.5 Seris Gets What She Wants
Seris will succeed. The portal will open. Players can delay her, not stop her. Do not design any system that prevents arc completion.

### 6.6 Currency Identity Is Inviolable
AM, ES, and SC are not denominations of the same currency. No conversion. No exchange rate. A player who has SC has done specific things to get it, and that means something.

### 6.7 No New DB Tables Without Design Approval
New flags → `player_flags`. New items → `inventory`. If a system genuinely cannot fit, it requires explicit discussion first.

### 6.8 The Anti-Arbitrage Rule
At every vendor: `buy_price > sell_value`. Always. Verify before adding any new item or vendor.

---

## APPENDIX — MODULE INDEX

| Module | Path | Status |
|--------|------|--------|
| Sewer (complete) | `blueprints/world/sewers_complete.md` | `[IMPLEMENTED]` |
| Cinder Cells | `blueprints/world/cinder_cells.md` | `[IMPLEMENTED]` |
| Combat & Enemies | `blueprints/systems/combat_enemies.md` | `[IMPLEMENTED]` |
| Equipment System | `blueprints/systems/verasanth_equipment_system_blueprint.md` | `[IMPLEMENTED]` |
| Mapping System | `blueprints/systems/verasanth_mapping_system_blueprint.md` | `[IMPLEMENTED]` |
| Level 5 Upgrades | `blueprints/verasanth_level5_upgrades_spec.md` | `[DESIGNED]` |
| Guild NPCs & Rooms | `blueprints/guild_npcs_v2.md` | `[DESIGNED]` |
| Economy Blueprint | `blueprints/systems/cursor_economy_blueprint_v2.md` | `[PARTIAL]` |
| Items & Tiers | `blueprints/systems/items.md` | `[DESIGNED]` |
| Alignment & Crime | `blueprints/systems/alignment.md` | `[DESIGNED]` |
| PvPvE | `blueprints/systems/pvpve.md` | `[DESIGNED]` |
| Memory & Lore | `blueprints/systems/memory_lore.md` | `[DESIGNED — file pending]` |
| NPC Blueprints | `blueprints/npcs/[name].md` | `[PENDING FILES]` |
| Arc 2 Design | `blueprints/narrative/arc2.md` | `[NOT STARTED]` |

---

## APPENDIX — OPEN DECISIONS

Unresolved questions that need answers before the relevant systems are built.

| Decision | Why It Matters | Blocks |
|----------|---------------|--------|
| Does Seris (Vantrel) know what she is adjacent to regarding the root corruption source? | Affects all Vaelith dialogue and Arc 2 | Vaelith expansion, Arc 2 |
| At what guild_standing threshold do guild leaders begin cross-referencing each other? | Required before cross-talk expansion | NPC cross-talk prompt |
| Do guild trials have narrative content or are they mechanical gates? | Affects trial design scope | Guild trial system |
| What triggers the first ES drop for a player? | Required before ES spend routes | Guild economy |
| Does Kelvaris ever leave the tavern? | Lore constraint for Arc 2 | Arc 2 design |

---

*Verasanth Game Bible v2.0*
*The city remembers everything. So should this document.*
