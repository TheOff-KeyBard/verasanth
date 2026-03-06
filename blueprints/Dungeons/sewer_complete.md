# Verasanth Sewers — Complete Implementation Document
**File:** `blueprints/world/sewers_complete.md`
**Version:** 2.0
**Last Updated:** 2026-03-06
**Status:** Ready for Implementation

---

## STRUCTURE OVERVIEW

Five floors. Each with identity, economy, and reason to return.
Floors 1–2: open access, solo viable.
Floors 3–5: boss-gated, group-encouraged.

```
sewer_entrance
    │
    ▼
FLOOR 1 — THE DRAINS
drain_entrance → overflow_channel → broken_pipe_room
                     │
                 vermin_nest → workers_alcove
                     │
                 rusted_gate ← [boss clear unlocks]
                     │
                     ▼
FLOOR 2 — THE FORGOTTEN CHANNELS
fungal_bloom_chamber → collapsed_passage (branch)
        │
    echoing_hall → old_maintenance_room (branch)
        │
    spore_garden [signature]
        │
    cracked_aqueduct ← [boss clear unlocks]
        │
        ▼
FLOOR 3 — THE CISTERN DEPTHS
flooded_hall → drowned_archive (branch)
     │
submerged_tunnel → broken_pump_room
     │
drowned_vault [signature] → sluice_gate ← [boss clear unlocks]
     │
     ▼
FLOOR 4 — THE MECHANIST'S SPINE
gear_hall → steam_vent_corridor → broken_regulator_chamber
                 │
            iron_walkway [PvPvE choke]
                 │
            heart_pump [signature] → pressure_valve_shaft ← [boss clear unlocks]
                 │
                 ▼
FLOOR 5 — THE SUMP CATHEDRAL
ash_pillar_hall → whispering_chamber
       │
  rune_lit_corridor [puzzle]
       │
  cathedral_floor → ash_heart_chamber [signature]
       │
  sump_pit [optional boss]
```

---

## FLOOR UNLOCK SYSTEM

Floors 1–2 open on entry. No unlock required.
Floors 3–5 require the previous floor's boss to be cleared.

Boss clear is **per-player**, tracked via player flag.
If a player reaches a locked gate without the flag,
the gate description changes and Grommash/noticeboard
hints at what needs to happen.

```javascript
const FLOOR_GATES = {
  rusted_gate:          { requires_flag: null,              leads_to: 'fungal_bloom_chamber' },
  cracked_aqueduct:     { requires_flag: 'boss_floor1',     leads_to: 'flooded_hall' },
  sluice_gate:          { requires_flag: 'boss_floor2',     leads_to: 'gear_hall' },
  pressure_valve_shaft: { requires_flag: 'boss_floor3',     leads_to: 'ash_pillar_hall' },
  // Floor 5 sump_pit is optional — no gate
};
```

**Locked gate description:**
*"The gate holds. Something has been through here —
the stone around the frame is marked with the kind
of wear that comes from repeated, deliberate force.
Whatever is deeper has been met before.
You have not met it yet."*

**Unlocked gate description (post-boss):**
*"The gate opens. You know what it cost to get here.
The air from below is different — older, colder,
or warmer, depending on which gate this is.
The next level does not announce itself.
It simply waits."*

---

## FLOOR 1 — THE DRAINS

**Identity:** The city's runoff channels. Filthy, cramped, familiar danger.
**Difficulty:** Solo viable. Tutorial rhythm.
**Economy:** Junk, vermin drops, worn gear.
**Loop reason:** Daily materials, early quests, build testing.

### Nodes

**`drain_entrance`**
Safe zone. No enemies. First decision point.
```
exits: { up: sewer_entrance, east: overflow_channel,
         north: workers_alcove }
objects: old_ladder, scratched_warnings, ash_residue
enemies: none
loot: none
atmosphere: "The smell hits before the dark does. Ash, standing
             water, old iron. The ladder behind you is the last
             clean thing for a while. Ahead, two passages.
             Both are equally uninviting. The east one is louder."
```

**`overflow_channel`**
Linear corridor. First enemy contact. Gutter Rats.
```
exits: { west: drain_entrance, east: broken_pipe_room,
         south: vermin_nest }
objects: overflow_pipe, filth_residue, scratched_tally_marks
enemies: [gutter_rat ×1-2]
loot: rat_pelt, tarnished_coin
atmosphere: "A channel running with slow black water down
             the center. The ceiling is low enough that you
             feel it without touching it. Something moves in
             the water but it is not the current — the current
             is not strong enough to move what is moving."
```

**`broken_pipe_room`**
Hazard room. Steam bursts from cracked pipes on a timer.
Ash Crawlers nest in the gaps between pipes.
```
exits: { west: overflow_channel }
objects: cracked_pipes, steam_valve, pipe_residue
enemies: [ash_crawler ×1-3]
hazard: steam_burst (12 damage, fires every 3 rounds,
        DEX check to avoid, telegraphed by hissing sound)
loot: pipe_fitting, ash_residue_sample, occasionally worn_tool
atmosphere: "The pipes here have given up the pretense of
             carrying anything useful. Steam pushes through
             the cracks in irregular bursts — too irregular
             to feel safe ignoring. The crawlers like the
             warmth. So do the cracks."
```

**`vermin_nest`**
Swarm fight. Multiple Gutter Rats. Open room, no cover.
Defeating triggers nest-clear flag for fetch quest.
```
exits: { north: overflow_channel, east: workers_alcove }
objects: nest_material, gnawed_bones, rat_cache
enemies: [gutter_rat ×3-4], occasionally [rat_king — rare]
loot: rat_pelt ×3-5, slime_residue, occasionally sewer_fungi
fetch_flag: nest_cleared_floor1
atmosphere: "The rats have been here long enough to make
             an architecture of it. Ash and bone and debris
             shaped into something that functions as a home.
             The largest ones don't run. They've decided
             they live here and you are the intruder."
```

**`workers_alcove`**
Loot room. No enemies. Old worker's stash.
Contains the lost tool for the static fetch quest.
```
exits: { west: vermin_nest, south: drain_entrance }
objects: abandoned_workbench, tool_rack, old_crate
enemies: none
loot: worn_tool (quest item), tarnished_coin ×2,
      rusted_chain_link ×3, occasionally worn_blade
atmosphere: "Someone worked here. The workbench is
             old but the arrangement of what's left on it
             is deliberate — tools sorted by size, a cup
             that used to hold something, a mark on the
             wall counting something that was worth counting.
             They stopped counting at a number you don't
             find reassuring."
```

**`rusted_gate`** *(Floor 1 exit / choke point)*
Boss arena approach. Rat King spawns here.
Gate to Floor 2 beyond the boss chamber.
```
exits: { west: vermin_nest,
         deeper: fungal_bloom_chamber [requires boss_floor1] }
objects: rusted_gate, heat_rising_from_below, old_warnings
boss_spawn: rat_king (triggers on approach if not cleared)
loot: [boss drops on clear] rat_king_musk, sewer_map_fragment,
      worn_gear_roll
atmosphere: "The gate is iron, old enough that the rust
             is structural rather than damage. Beyond it,
             the air changes — less filth, more age.
             Something large has been using the space
             in front of the gate as a territory marker
             for a long time. The marks are fresh."
```

---

## FLOOR 2 — THE FORGOTTEN CHANNELS

**Identity:** Older stone, fungal growth, strange echoes. First real danger.
**Difficulty:** Solo manageable with preparation. Groups faster.
**Economy:** Alchemy reagents, mid-tier gear, Othorion materials.
**Loop reason:** Reagent farming, Othorion quests, investigation hooks.

### Nodes

**`fungal_bloom_chamber`**
Entry from Floor 1. Ambient poison from spores. Beautiful, wrong.
```
exits: { up: rusted_gate, east: echoing_hall,
         north: collapsed_passage }
objects: bloom_cluster, spore_drift, old_stonework
enemies: [mold_vermin ×1-2]
hazard: spore_cloud (1 poison/round while standing still,
        cleared by moving each round)
loot: sewer_fungi, spore_cluster, glowing_spores (quest item)
atmosphere: "The fungi here produce their own light — pale
             blue-green, steady, sourceless. It is the most
             beautiful thing in the sewer. The spores it
             releases are not beautiful. They taste like
             metal and they stay in the back of the throat.
             Move through. Don't breathe deep."
```

**`collapsed_passage`**
Optional branch. Alternate route to Echoing Hall.
Partially blocked — requires searching to find path.
```
exits: { south: fungal_bloom_chamber,
         east: old_maintenance_room [hidden, requires search] }
objects: collapsed_stonework, old_marks, debris_pile
enemies: [channel_stalker ×1 — ambush from ceiling]
loot: salvaged_stone, rusted_chain_link, occasionally crafting_scrap
atmosphere: "The ceiling came down here at some point.
             What is left is navigable if you don't mind
             the weight of the stone above and the sounds
             it makes when you put weight on the floor.
             The channel stalkers like collapsed spaces.
             Something about the angles suits them."
```

**`old_maintenance_room`**
Branch from collapsed_passage. Crafting scrap, old equipment.
Caelir recognizes the tools — hooks into his arc.
```
exits: { west: collapsed_passage }
objects: tool_storage, parts_bench, maintenance_log
enemies: none
loot: crafting_scrap ×3, gear_fragment,
      maintenance_log (lore item, Caelir react)
atmosphere: "Someone maintained this tunnel. The equipment
             is old enough that the design language is
             unfamiliar — not broken, just from a different
             era of thinking about what these systems needed.
             The maintenance log uses a notation Caelir
             would recognize. You find this out later."
```

**`echoing_hall`**
Ambush room. Enemies drop from ceiling and emerge from walls.
Sound carries wrong here — footsteps come from ahead of you.
```
exits: { west: fungal_bloom_chamber, east: spore_garden,
         north: old_maintenance_room }
objects: echo_walls, old_support_beams, something_in_ceiling
enemies: [channel_stalker ×2], occasionally [fungal_shambler ×1]
hazard: disorientation (echoes make enemy position unreliable —
        first attack each combat round has -10% accuracy)
loot: spore_cluster, channel_key_fragment
atmosphere: "The hall amplifies sound and returns it wrong —
             your footstep comes back from the far wall a
             half-second late and from a slightly different
             direction. After a few minutes you stop trusting
             your ears entirely. The channel stalkers have
             lived here long enough to use this."
```

**`spore_garden`** *(Signature room)*
The most beautiful and most dangerous room on Floor 2.
Glowing fungi, thick spore clouds, rare reagents.
Floor 2 boss spawns in or adjacent to this room.
```
exits: { west: echoing_hall, south: cracked_aqueduct }
objects: spore_garden_main, rare_bloom, old_inscription
boss_spawn: sporebound_custodian
loot: glowing_spores ×5, fungal_bloom, rare_reagent,
      [boss drop] custodian_core, spore_extract
atmosphere: "The garden should not exist. There is no
             light source sufficient to explain what has
             grown here — fungi in a dozen varieties, some
             you recognize from Thalara's jars, some you
             have never seen labeled. The spore cloud is
             thick enough to be visible as a layer in the
             air. The old inscription on the far wall reads:
             GREW WITHOUT PERMISSION. You are not certain
             this is a complaint."
```

**`cracked_aqueduct`** *(Floor 2 exit / choke point)*
Ancient water system, partially flooded. Transition to Floor 3.
```
exits: { north: spore_garden,
         down: flooded_hall [requires boss_floor2] }
objects: aqueduct_structure, water_flow, deep_inscription
atmosphere: "The aqueduct is older than everything above it.
             The stonework is finer, the engineering more
             deliberate. Water still flows through the cracks —
             slow, dark, and warm. Below, the sound of much
             more water. The inscription above the descent
             reads: WHAT YOU FIND BELOW IS WHAT THE CITY
             DOES NOT DISCUSS. You have been warned."
```

---

## FLOOR 3 — THE CISTERN DEPTHS

**Identity:** Flooded chambers, drowned dead, water as hazard.
**Difficulty:** Group-encouraged. Solo possible but punishing.
**Economy:** High-value trade goods, rare reagents, first artifact.
**Loop reason:** Artifact resonance, Thalara trace quest, rare drops.

### Nodes

**`flooded_hall`**
Entry from Floor 2. Knee-deep water. Movement slowed.
Drowned Thralls rise from the water silently.
```
exits: { up: cracked_aqueduct, east: drowned_archive,
         south: submerged_tunnel }
objects: standing_water, waterlogged_armor, submerged_marks
enemies: [drowned_thrall ×1-2]
hazard: deep_water (movement -1 action per room,
        combat in water gives enemies +10% accuracy)
loot: drowned_relic, tarnished_coin ×2, waterlogged_cloth
atmosphere: "The water stands still from wall to wall —
             knee-deep, warm, and dark. It reflects the
             torchlight perfectly until something moves
             beneath it. The drowned thralls do not announce
             themselves. They simply rise from whatever
             the water has been hiding and orient toward you
             with the patience of things that are not
             in any hurry."
```

**`drowned_archive`**
Branch. Lore room. Thalara fetch quest item here.
Flood records with dates — cross-reference to Thalara's arc.
```
exits: { west: flooded_hall }
objects: submerged_shelves, flood_records, personal_effects
enemies: none (unless disturbed)
loot: drowned_journal (quest item — Thalara react),
      flood_record_page, personal_effects_bundle
fetch_flag: found_flood_records
atmosphere: "Shelves of stone holding documents wrapped in
             something that kept them mostly intact despite
             the water. The flood records go back further
             than the current city. Among them, a page with
             a name Thalara would recognize — Descent 7,
             no return date. You don't know whose name it
             is yet. Thalara will."
```

**`submerged_tunnel`**
Stealth-optional passage. Cistern Leeches wait in the water.
Can be rushed (take damage) or moved through carefully (slow).
```
exits: { north: flooded_hall, south: broken_pump_room }
objects: submerged_tunnel_walls, leech_presence, deep_current
enemies: [cistern_leech ×2-3]
hazard: leech_attachment (on hit, leech drains 3 HP/round
        until removed with action — costs a turn)
loot: leech_extract (Thalara reagent), deep_water_residue
atmosphere: "The tunnel dips below water level for a stretch.
             You can go through fast — and take what latches
             onto you — or slow, and feel them before they
             reach you. Neither option is comfortable.
             The leeches have been in this water long enough
             that they are the water, functionally."
```

**`broken_pump_room`**
Hazard room. Rising water mechanic — pump is damaged.
Timer-based: water rises each round if not addressed.
Flood Serpents in the water.
```
exits: { north: submerged_tunnel, east: drowned_vault }
objects: broken_pump, water_level_gauge, pump_controls
enemies: [flood_serpent ×1-2]
hazard: rising_water (water level increases each round —
        at level 3: movement impossible;
        pump can be repaired with INT check to stop it)
loot: pump_fragment (Caelir/crafting), deep_vent_ash
atmosphere: "The pump that was supposed to manage water
             levels down here has been broken long enough
             that the water has found its own opinion about
             where it wants to be. It is rising. Slowly,
             but with the patience of something that has
             been rising for years and is close to where
             it wants to go."
```

**`drowned_vault`** *(Signature room)*
First artifact fragment. Seris Arc 1 trigger.
Floor 3 boss spawns here — the Cistern Leviathan.
```
exits: { west: broken_pump_room, north: sluice_gate }
objects: vault_platform, artifact_display, ancient_inscription
boss_spawn: cistern_leviathan
loot: [artifact] cistern_artifact (triggers seris_arc_1_flag),
      leviathan_scale (Veyra quest), cistern_key,
      [boss drop] drowned_relic
atmosphere: "The vault sits on a raised platform above the
             water level — deliberately, precisely. Whatever
             was stored here was stored to survive flooding.
             The artifact on the platform has been here long
             enough that the stone around it has changed color
             slightly. When you pick it up, something in the
             room changes. You are not certain what.
             You are certain something noticed."
```

**`sluice_gate`** *(Floor 3 exit)*
```
exits: { south: drowned_vault,
         down: gear_hall [requires boss_floor3] }
```

---

## FLOOR 4 — THE MECHANIST'S SPINE

**Identity:** Ancient machinery, heat vents, rhythmic thumping.
**Difficulty:** Group-required for efficient runs. Solo is attrition.
**Economy:** Crafting materials, mechanical scrap, masterwork gear.
**Loop reason:** Caelir quests, high-tier crafting, rare construct drops.

### Nodes

**`gear_hall`**
Entry from Floor 3. Moving gear hazards. Gearbound Sentinels.
```
exits: { up: sluice_gate, east: steam_vent_corridor,
         south: iron_walkway }
objects: gear_mechanism, runic_power_conduit, ancient_instructions
enemies: [gearbound_sentinel ×1-2]
hazard: moving_gears (caught in gears: 8 damage,
        DEX check each round while in the path)
loot: gear_fragment, runic_shard, crafting_scrap
atmosphere: "The gears are still moving. They have been
             moving without maintenance for longer than the
             city above. The mechanism they are part of is
             not obvious from this position. Whatever they
             drive is somewhere below."
```

**`steam_vent_corridor`**
Timed traversal. Heat Wraiths form in active vents.
Must time movement between vent activations.
```
exits: { west: gear_hall, east: broken_regulator_chamber }
objects: steam_vents, heat_buildup, vent_controls
enemies: [heat_wraith ×2 — form in vents]
hazard: steam_vents (12 damage per activation,
        vents cycle every 4 rounds, telegraphed by pressure sound)
loot: deep_vent_ash (Othorion reagent), heat_core_fragment
atmosphere: "The vents activate in a pattern. You watch
             two cycles before committing to the corridor.
             The heat wraiths form when the vents are active
             and come apart when they're not. The window
             between cycles is exactly wide enough."
```

**`broken_regulator_chamber`**
Elite construct room. Broken Regulator boss.
Runic Tablet is here — full symbol sequence, major lore item.
```
exits: { west: steam_vent_corridor }
objects: regulator_mechanism, runic_tablet, symbol_sequence
boss_spawn: broken_regulator
loot: [boss drop] regulator_core (Othorion arc),
      runic_tablet (major lore), mechanist_key,
      masterwork_gear_roll
atmosphere: "The control node for the underworks water system.
             It was not built to fight. It was built to regulate.
             The distinction stopped mattering when whatever
             corrupted it decided the regulation was
             finished."
```

**`iron_walkway`** *(PvPvE choke point)*
Narrow walkway over a drop. Single-file passage.
Natural bottleneck — ambush and escort contracts happen here.
```
exits: { north: gear_hall, south: heart_pump }
objects: iron_walkway_structure, depth_below, old_safety_chains
enemies: [rust_golem ×1 — patrols]
hazard: fall_risk (knocked back in combat: fall damage 15,
        DEX check to catch chain)
loot: rust_plates (Veyra material), iron_scrap
atmosphere: "The walkway is single-file. Whatever is below
             is not visible — the drop goes further than your
             torch reaches. The old safety chains are still
             bolted in. Most of them. The rust golem patrols
             this section with the patience of something
             that has been doing it for a very long time
             and has never once thought about why."
```

**`heart_pump`** *(Signature room)*
The massive mechanism still running. Rhythmic thumping felt
through the floor for two rooms in every direction.
```
exits: { north: iron_walkway, east: pressure_valve_shaft }
objects: heart_pump_mechanism, runic_core, ancient_engineering
enemies: [gearbound_sentinel ×2]
loot: mechanist_components, rare_crafting_material,
      heart_pump_fragment (Caelir's most significant quest item)
atmosphere: "The thumping you felt two rooms back originates
             here. A mechanism the size of the room, moving
             in a cycle so regular it has become the rhythm
             of this floor. It has been running since before
             the city above was built in its current form.
             Whatever it pumps has not been traced.
             Othorion has theories. He has not confirmed them."
```

**`pressure_valve_shaft`** *(Floor 4 exit)*
```
exits: { west: heart_pump,
         down: ash_pillar_hall [requires boss_floor4] }
```

---

## FLOOR 5 — THE SUMP CATHEDRAL

**Identity:** Ancient ritual chamber, living stone, city's breath.
**Difficulty:** Group required. Solo is exceptional circumstance only.
**Economy:** Relics, corrupted gear, artifact fragments, boss drops.
**Loop reason:** Seris arc completion, corrupted gear farming, the Sump Pit.

### Nodes

**`ash_pillar_hall`**
Entry from Floor 4. Cathedral scale. Ashborn Acolytes chanting.
```
exits: { up: pressure_valve_shaft, east: whispering_chamber,
         south: rune_lit_corridor }
objects: ash_pillars, acolyte_positions, ancient_architecture
enemies: [ashborn_acolyte ×2 — sync trait active with two present]
loot: ash_infused_stone, cathedral_rune_shard
atmosphere: "The scale of this room should not be possible
             at this depth. The pillars of ash-grey stone
             reach a ceiling you cannot see. The acolytes
             stand between them, chanting in a language
             that predates every language in the city above.
             They were here before you arrived.
             They will continue after you leave.
             This is not reassuring."
```

**`whispering_chamber`**
Sanity hazard. Whispers cause confusion — wrong action descriptions.
Cathedral Wraiths phase through walls here.
```
exits: { west: ash_pillar_hall }
objects: whispering_walls, rune_patterns, deep_inscription
enemies: [cathedral_wraith ×1-2]
hazard: whisper_confusion (WIS check each round —
        fail: action description misleads player,
        attack may target wrong enemy or miss entirely)
loot: void_essence (rare, Othorion — illegal), rune_fragment
atmosphere: "The walls whisper. Not metaphorically — a sound
             that carries specific syllables in a specific order,
             repeated, emanating from the stone itself.
             The cathedral wraiths move through the walls
             as if the whispers opened a door for them.
             The whispers make you uncertain about what
             you are doing and whether you decided to do it."
```

**`rune_lit_corridor`**
Puzzle room. Rune sequence from Floor 2 and 4 appears here complete.
Correct sequence opens a hidden cache.
Wrong sequence: 8 damage, enemies spawn.
```
exits: { north: ash_pillar_hall, south: cathedral_floor }
objects: rune_sequence_full, activation_panels, hidden_cache
puzzle: rune_sequence (answer derived from runic_tablet +
        old_maintenance_room inscription — rewards players
        who explored earlier floors thoroughly)
loot: [correct sequence] rare_relic, corrupted_gear_roll,
      ancient_document
      [wrong sequence] rune_shock 8 damage + living_rune ×2 spawn
atmosphere: "The full sequence is here, assembled from
             everything the sewer has been trying to tell
             you since Floor 2. Whether you have been
             paying attention determines what this room
             costs you."
```

**`cathedral_floor`**
Elite enemies. Sump Guardians. Heavy fight before the signature room.
```
exits: { north: rune_lit_corridor, east: ash_heart_chamber,
         south: sump_pit }
objects: cathedral_architecture, pit_entrance, guardian_positions
enemies: [sump_guardian ×2], [ashborn_acolyte ×1]
loot: guardian_core, ash_stone_fragment, corrupted_gear_roll
atmosphere: "The cathedral floor is worn by the passage of
             things that have walked it for longer than the
             city above has existed. The sump guardians hold
             positions that have not changed. They guard the
             approach to the pit and the approach to the chamber
             with equal patience. They have always done this."
```

**`ash_heart_chamber`** *(Signature room)*
Seris's artifact. Arc completion. The moment everything pivots.
```
exits: { west: cathedral_floor }
objects: ashbound_resonance_display, ancient_inscription,
         sealed_alcoves, city_memory_stone
boss_spawn: ash_heart_custodian
loot: [boss drop] ashbound_resonance (Seris arc 1 artifact — cannot sell),
      cathedral_rune_shard ×2, corrupted_gear_roll,
      heartbeat_stone (permanent world item — cannot sell)
seris_flag: seris_arc_1_complete (triggers full NPC cascade)
atmosphere: "The chamber is the source. Every pattern you
             have seen on every floor of this sewer traces
             back to this room. The artifact on the central
             platform has been waiting. Whether it was
             waiting for you specifically is a question
             the city does not answer directly.
             On boss death: the pit below exhales. The lights
             in Verasanth above flicker. Kelvaris sets down
             his glass. Pip points at Othorion's trapdoor."
```

**`sump_pit`** *(Optional boss room)*
The pit itself. Breathspawn and the Ash Heart Custodian's final form.
Only accessible from cathedral_floor. Optional — not required for arc.
```
exits: { north: cathedral_floor }
objects: pit_breathing, depth_below, ancient_warning
boss_spawn: ash_heart_custodian [phase 3 only if main boss cleared]
loot: [sump_pit exclusive] void_relic, ash_wraith_essence,
      sump_key (hints at Level 6)
atmosphere: "The pit breathes. Not metaphorically.
             A slow exhale rises through the grate every
             four seconds — warm, dry, and smelling of
             something that has been below for longer than
             the word 'below' has existed.
             The inscription on the near wall:
             THE KEY DOES NOT OPEN UPWARD.
             Below the inscription, smaller, recent:
             M. DASK — I UNDERSTAND NOW."
```

---

## DYNAMIC MICRO-OBJECTIVES

Every 45 minutes (real time), the sewer generates one active condition.
Conditions rotate through a weighted pool.
Active condition is visible on the noticeboard in market_square
and at the sewer_entrance inspect object.

### Condition Pool

```javascript
const SEWER_CONDITIONS = [
  {
    id: 'fungal_bloom_surge',
    name: 'Fungal Bloom Surge',
    floors: [1, 2],
    description: "The fungi in the lower channels have released
                  a surge of spores. The bloom is heavy tonight.",
    effects: {
      enemy_spawn_bonus: { mold_vermin: +1, fungal_shambler: +1 },
      loot_bonus: { glowing_spores: +3, spore_cluster: +2 },
      hazard_increase: { spore_cloud: 'double_damage' }
    },
    noticeboard_text: "SPORE SURGE ACTIVE — Othorion paying 2× for glowing spores tonight. Mind the bloom.",
  },
  {
    id: 'water_pressure_spike',
    name: 'Water Pressure Spike',
    floors: [3, 4],
    description: "The cistern pressure has spiked. Water moves faster.",
    effects: {
      enemy_spawn_bonus: { flood_serpent: +1, drowned_thrall: +1 },
      loot_bonus: { rare_algae: +2, deep_water_residue: +3 },
      hazard_increase: { rising_water: 'faster_rise' },
      route_blocked: ['submerged_tunnel'] // alternate path required
    },
    noticeboard_text: "PRESSURE SPIKE — Submerged tunnel impassable tonight. Alternate routes advised.",
  },
  {
    id: 'construct_malfunction',
    name: 'Construct Malfunction',
    floors: [4],
    description: "The underworks mechanisms are cycling erratically.",
    effects: {
      enemy_spawn_bonus: { gearbound_sentinel: +2, rust_golem: +1 },
      loot_bonus: { crafting_scrap: +4, mechanist_components: +2 },
      hazard_increase: { moving_gears: 'unpredictable_timing' }
    },
    noticeboard_text: "CONSTRUCT ALERT — Gear Hall unstable. Caelir offering bonus for mechanical scrap recovered tonight.",
  },
  {
    id: 'ash_whisper_event',
    name: 'Ash Whisper Event',
    floors: [5],
    description: "The city is speaking through the cathedral tonight.",
    effects: {
      enemy_spawn_bonus: { cathedral_wraith: +2, ashborn_acolyte: +1 },
      loot_bonus: { void_essence: +1, ash_infused_stone: +3 },
      hazard_increase: { whisper_confusion: 'harder_check' },
      special: 'seris_alert' // Seris sends noticeboard message
    },
    noticeboard_text: "ASH WHISPER ACTIVE — Seris: 'The cathedral is louder tonight. I need samples urgently.'",
  },
  {
    id: 'vermin_migration',
    name: 'Vermin Migration',
    floors: [1, 2],
    description: "Something drove the vermin upward. They're everywhere.",
    effects: {
      enemy_spawn_bonus: { gutter_rat: +3, ash_crawler: +2 },
      loot_bonus: { rat_pelt: +5, slime_residue: +3 },
      special: 'grommash_bounty' // Grommash posts kill-count bounty
    },
    noticeboard_text: "VERMIN SURGE — Grommash: 'Clear the nests. Bounty active for verified kills tonight.'",
  },
  {
    id: 'heat_vent_instability',
    name: 'Heat Vent Instability',
    floors: [4, 5],
    description: "The vents are cycling faster than normal. Heat Wraiths are forming constantly.",
    effects: {
      enemy_spawn_bonus: { heat_wraith: +3 },
      loot_bonus: { deep_vent_ash: +4, heat_core_fragment: +2 },
      hazard_increase: { steam_vents: 'faster_cycle' },
      special: 'othorion_alert'
    },
    noticeboard_text: "VENT INSTABILITY — Othorion: 'The heat signature is anomalous. I need vent ash samples immediately.'",
  },
];
```

### Condition Scheduling
```javascript
// Runs every 45 minutes via Cloudflare Cron Trigger
async function rotateSwerCondition(db) {
  const current = await dbGet(db,
    "SELECT * FROM sewer_conditions WHERE active=1");
  if (current) {
    await dbRun(db,
      "UPDATE sewer_conditions SET active=0 WHERE id=?",
      [current.id]);
  }
  const weights = [3, 2, 2, 1, 3, 2]; // adjust for frequency
  const pool = SEWER_CONDITIONS;
  const selected = weightedRandom(pool, weights);
  await dbRun(db,
    `INSERT OR REPLACE INTO sewer_conditions
     (condition_id, active, started_at, ends_at, data)
     VALUES (?,1,?,?,?)`,
    [selected.id, Date.now(),
     Date.now() + (45 * 60 * 1000),
     JSON.stringify(selected)]);
  // Post to global chat
  await postSystemMessage(db,
    `The sewer shifts. ${selected.noticeboard_text}`);
}
```

---

## FETCH QUEST SYSTEM

### Static NPC Quests (narrative weight, arc-connected)

**Othorion — Research Series**
```javascript
const OTHORION_QUESTS = [
  {
    id: 'othorion_q1',
    title: 'Reagent Run — Fungi',
    dialogue_unlock: 'first_sewer_visit',
    objective: { item: 'sewer_fungi', qty: 3, location: 'floor_1' },
    reward: { ash_marks: 80, item: 'spore_extract', trust: +1 },
    completion_dialogue: "These are the right strain. Pip already knew you'd bring them.",
  },
  {
    id: 'othorion_q2',
    title: 'Reagent Run — Deep Ash',
    dialogue_unlock: 'othorion_q1_complete',
    objective: { item: 'deep_vent_ash', qty: 2, location: 'floor_4' },
    reward: { ash_marks: 200, item: 'listening_ash_elixir', trust: +2 },
    completion_dialogue: "The ash from the vents is different from the surface ash. You noticed that, yes? Good.",
  },
  {
    id: 'othorion_q3',
    title: 'The Rat King',
    dialogue_unlock: 'othorion_q2_complete',
    objective: { item: 'rat_king_musk', qty: 1, location: 'floor_1_boss' },
    reward: { ash_marks: 150, item: 'pale_sight_elixir', trust: +2 },
    completion_dialogue: "The musk has a resonance signature I did not expect. I'll need time with this.",
  },
];
```

**Thalara — The Trace**
```javascript
const THALARA_QUESTS = [
  {
    id: 'thalara_q1',
    title: 'Common Reagents',
    dialogue_unlock: 'first_meeting',
    objective: { item: 'slime_residue', qty: 3 },
    reward: { ash_marks: 60, item: 'channel_salt' },
  },
  {
    id: 'thalara_q2',
    title: 'The Flood Records',
    dialogue_unlock: 'thalara_q1_complete',
    objective: { item: 'flood_record_page', qty: 1,
                 location: 'drowned_archive' },
    reward: { ash_marks: 120, item: 'deep_antidote' },
    arc_flag: 'thalara_arc_seed', // plants her Floor 3 connection
    completion_dialogue: "This name. This date. That's not — how old is this record?",
  },
  {
    id: 'thalara_q3',
    title: "Someone's Kit",
    dialogue_unlock: 'thalara_arc_seed',
    objective: { item: 'healers_kit', qty: 1,
                 location: 'drowned_vault_area' },
    reward: { ash_marks: 200, item: 'ashbound_elixir' },
    arc_flag: 'thalara_arc_2_active',
    completion_dialogue: "*She holds it for a long time.* This belonged to someone I was looking for.",
  },
];
```

**Caelir — Engineering Work**
```javascript
const CAELIR_QUESTS = [
  {
    id: 'caelir_q1',
    title: 'Lost Tool',
    dialogue_unlock: 'first_meeting',
    objective: { item: 'worn_tool', qty: 1,
                 location: 'workers_alcove' },
    reward: { ash_marks: 75, item: 'worn_blade_upgraded' },
    completion_dialogue: "*He examines it without expression.* Third generation design. Interesting.",
  },
  {
    id: 'caelir_q2',
    title: 'Mechanist Scrap',
    dialogue_unlock: 'caelir_q1_complete',
    objective: { item: 'crafting_scrap', qty: 5,
                 location: 'floor_2_3' },
    reward: { ash_marks: 180, item: 'forged_blade' },
  },
  {
    id: 'caelir_q3',
    title: 'Heart Pump Fragment',
    dialogue_unlock: 'caelir_q2_complete',
    objective: { item: 'heart_pump_fragment', qty: 1,
                 location: 'heart_pump' },
    reward: { ash_marks: 400, item: 'ember_forged_weapon' },
    arc_flag: 'caelir_arc_advance',
    completion_dialogue: "*A long pause. He sets down what he is working on.* Where did you find this.",
  },
];
```

**Seris — Artifact Series** *(Arc-critical)*
```javascript
const SERIS_QUESTS = [
  {
    id: 'seris_q1',
    title: 'Resonant Scraps',
    dialogue_unlock: 'first_sewer_visit',
    objective: { item: 'resonant_scrap', qty: 2 },
    reward: { ash_marks: 150 },
    arc_flag: 'seris_arc_interest',
  },
  {
    id: 'seris_q2',
    title: 'Custodian Fragment',
    dialogue_unlock: 'seris_arc_interest',
    objective: { item: 'custodian_core', qty: 1,
                 location: 'sporebound_custodian' },
    reward: { ash_marks: 300 },
    arc_flag: 'seris_arc_1_primed',
    completion_dialogue: "*Her composure shifts — just slightly.* This resonates with the pattern I've been mapping.",
  },
  // seris_q3 is the ashbound_resonance — triggered by floor 5 clear
];
```

**Grommash — Bounty Series**
```javascript
const GROMMASH_BOUNTIES = [
  {
    id: 'grommash_b1',
    title: 'Nest Clear',
    floor: 1,
    objective: { flag: 'nest_cleared_floor1' },
    reward: { ash_marks: 100, order_score: +30 },
    completion_dialogue: "Vermin nests destabilize the lower passages. You've done the city a service.",
  },
  {
    id: 'grommash_b2',
    title: 'Construct Culling',
    floor: 4,
    objective: { enemy_kills: { gearbound_sentinel: 3 } },
    reward: { ash_marks: 350, order_score: +40 },
    completion_dialogue: "The constructs that have lost their programming are a hazard. They do not know what they guard anymore.",
  },
];
```

### Dynamic Quest Generation
```javascript
function generateDynamicQuest(db, activeCondition, floor) {
  const templates = [
    {
      type: 'collection',
      title: `[CONDITION] Surge — Collect Materials`,
      objective: { item: activeCondition.loot_bonus_items[0], qty: 4 },
      reward: { ash_marks: 50 + (floor * 30) },
      expiry: 45 * 60 * 1000, // expires with condition
    },
    {
      type: 'kill_count',
      title: `Clear the [CONDITION] Spawns`,
      objective: { enemy_kills: activeCondition.bonus_enemies, count: 5 },
      reward: { ash_marks: 75 + (floor * 25), mercy_score: +10 },
      expiry: 45 * 60 * 1000,
    },
    {
      type: 'exploration',
      title: `Investigate the [FLOOR] Anomaly`,
      objective: { visit_location: anomalyRoomForFloor(floor) },
      reward: { ash_marks: 40 + (floor * 20) },
      expiry: 45 * 60 * 1000,
    },
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}
```

---

## ECONOMY LOOP

```
FLOOR 1 OUTPUT          → BUYERS
rat_pelt                → Veyra (craft), Thalara (reagent)
sewer_fungi             → Othorion (quest), Thalara (stock)
worn_gear               → Caelir (sell), Seris (browse)
junk_items              → Still Scale (general sell)

FLOOR 2 OUTPUT          → BUYERS
glowing_spores          → Othorion (high value, quest)
spore_cluster           → Thalara (reagent)
crafting_scrap          → Caelir (quest, craft)
common_gear             → any vendor

FLOOR 3 OUTPUT          → BUYERS
drowned_journal         → Thalara (quest item, arc)
flood_record_page       → Thalara (arc seed)
rare_algae              → Thalara (premium)
resonant_scrap          → Seris (arc interest)
fine_gear               → any vendor

FLOOR 4 OUTPUT          → BUYERS
deep_vent_ash           → Othorion (quest)
heart_pump_fragment     → Caelir (arc quest)
mechanist_components    → Caelir (premium)
crafting_scrap ×4       → Caelir (bulk)
masterwork_gear         → Seris (browse), any vendor

FLOOR 5 OUTPUT          → BUYERS
ashbound_resonance      → Seris (arc — cannot sell)
cathedral_rune_shard    → Seris (high value)
corrupted_gear          → Seris (buys at premium)
void_essence            → Othorion (illegal — premium)
ash_infused_stone       → Othorion, Thalara
rare_relics             → Seris (highest value)
```

---

## D1 SCHEMA ADDITIONS

```sql
-- Active sewer condition
CREATE TABLE IF NOT EXISTS sewer_conditions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  condition_id TEXT NOT NULL,
  active INTEGER DEFAULT 0,
  started_at INTEGER NOT NULL,
  ends_at INTEGER NOT NULL,
  data TEXT  -- JSON: full condition object
);

-- Fetch quests
CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quest_id TEXT NOT NULL,
  type TEXT NOT NULL,    -- 'static' | 'dynamic'
  status TEXT DEFAULT 'active',  -- active | complete | expired
  progress TEXT,         -- JSON: current progress vs objective
  assigned_at INTEGER NOT NULL,
  expires_at INTEGER,    -- NULL for static quests
  completed_at INTEGER
);

-- Floor unlock flags (already in player_flags — just add entries)
-- boss_floor1, boss_floor2, boss_floor3, boss_floor4
-- nest_cleared_floor1, found_flood_records, seris_arc_1_complete
-- thalara_arc_seed, caelir_arc_advance, etc.
```

---

## IMPLEMENTATION ORDER FOR CURSOR

Phase 1 — Node structure:
1. Add all sewer nodes to WORLD object
2. Add gate logic (requires_flag check on exit)
3. Add boss_spawn trigger on node entry
4. Add hazard descriptors to room text

Phase 2 — Economy:
5. Wire loot tables to enemy death (floor-specific)
6. Wire quest items to specific room/enemy drops
7. Add dynamic condition to noticeboard display

Phase 3 — Quests:
8. Static quest assignments via NPC dialogue
9. Quest progress tracking on item pickup/kill
10. Quest completion detection and reward payout

Phase 4 — Dynamic conditions:
11. Cloudflare Cron Trigger for 45-min rotation
12. Condition effects on spawn and loot tables
13. Dynamic quest generation per active condition

Phase 5 — PvPvE integration:
14. Iron Walkway as contract/ambush choke point
15. Drowned Vault as natural escort contract location
16. Ash Heart Chamber as high-value group target

---
*Sewers Complete v2.0 — Verasanth*
*Part of the Verasanth World Bible*
