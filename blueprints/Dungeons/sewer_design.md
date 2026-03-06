# The Verasanth Sewers — Complete Design Document
**File:** `blueprints/world/sewers.md`
**Version:** 1.0
**Last Updated:** 2026-03-06
**Status:** Active

---

## OVERVIEW

The sewers beneath Verasanth are the game's first major dungeon
and the primary content hub of the early game. They are not
just a dungeon — they are a revelation. Players enter expecting
pipes and rats. They leave understanding the city has a mechanism,
and someone is trying to use it.

**Emotional arc of the dungeon:**
Curiosity → Unease → Danger → Revelation → Consequence

**Primary questline:** Seris Vantrel's artifact search
**Secondary hooks:** Othorion reagent quests, Thalara's lost person trace,
Grommash bounty contracts, Caelir material fetch

---

## LEVEL STRUCTURE

### Level 1 — The Drains
**Location IDs:** `sewer_entrance`, `drain_corridor`, `drain_junction`,
`drain_cache`, `rat_king_chamber`
**Purpose:** Tutorial danger, environmental storytelling, early loot
**Unlock:** Default — sewer_entrance accessible from market_square

**Tone:**
Dripping water. Rusted grates. The smell of the city above
concentrated into something physical. Graffiti from people
who came before — most of it warnings.

**Room Descriptions:**

`sewer_entrance`:
> The grate opens onto a stone ledge above a channel of dark water.
> The smell hits first — not rot exactly, but age. The city above
> is muffled here. Something skitters in the dark to the left.
> On the wall near the ladder, someone has scratched:
> *"MARROWIN DASK WENT DEEPER. DON'T."*
> The channel runs east and west. Something floats in it
> that you decide not to identify.

`drain_corridor`:
> A long pipe-lined corridor, chest-height on both sides with
> iron conduits that drip something that is not quite water.
> The floor is slick. Gutter rats scatter from the light.
> The graffiti continues here: names, dates, warnings.
> One inscription is older than the others, carved deep:
> *"THE PIPES BREATHE. LISTEN."*

`drain_junction`:
> Four passages meet here. The ceiling is high enough to stand
> in, barely. In the center, a collapsed section of floor reveals
> a lower channel — darker, quieter, further down than it should be.
> A crude map is scratched into the east wall.
> Someone updated it recently. The ink is still wet.

`drain_cache`:
> A dry alcove someone used as a shelter. Bedroll, rotted.
> Empty containers. A name scratched into the stone:
> *Pellin, 3rd descent.*
> Below it, smaller: *there is no 4th.*
> The alcove smells of old smoke and something chemical —
> Othorion's mark, if the player knows to recognize it.

`rat_king_chamber`:
> The chamber widens into something that was once a cistern intake.
> The floor moves. It takes a moment to understand why —
> the rats here are so numerous they form a living carpet.
> At the center, something large and wet and terrible is waiting.
> It has been waiting for a long time.

**Enemies:**
- Gutter Rats — fast, weak, swarm. Minor bleed on bite.
  HP: 15. DMG: 3-5. Spawn in groups of 3-5.
- Sewer Gnawers — rat mutants, slow but 4x health.
  HP: 60. DMG: 8-12. Solo or pairs.
- Filth Slimes — split into 2 smaller slimes on death.
  HP: 40 (splits into 2x20). DMG: 5-8. Slow, persistent.
- Drain Lurkers — humanoid silhouettes, flee unless cornered.
  HP: 35. DMG: 12-18 (desperation attack). Evasive.
- Pipe Eels — burst from water channels. Quick strike.
  HP: 25. DMG: 10-14. Retreat to water after strike.

**Mini Boss — The Bloated Rat King:**
HP: 280. Phases: 2.
- Phase 1: Summons Gutter Rats (3 per round), disease aura
  (player takes 2 dmg/round while in chamber)
- Phase 2 (below 50% HP): Charges, spreads bleed on contact,
  summons Gnawers instead of Rats
- Death: Drops Rat King Musk (Othorion reagent),
  Gnawed Coin Pouch (Ash Marks), chance: Sewer Map Fragment

**Narrative Hooks:**
- First mention of Marrowin Dask on entrance wall
- `seen_sewer_wall_markings` flag set on first entry
- Seris reacts to any item sold from Level 1:
  "You've been down. Good. Bring me more."
- Grommash reacts to player returning from Level 1:
  "You went. Come back with more than wounds next time."

**Inspect Items:**
- graffiti: rotating descriptions, always includes Dask mention
- collapsed_floor: "The lower channel. Darker. Further down
  than the architecture should allow."
- crude_map: partial map of Level 1, hints at Level 2 entrance
- old_bedroll: flavor, sets tone of prior inhabitants
- wet_inscription: the recent map update — someone is still here

---

### Level 2 — The Forgotten Channels
**Location IDs:** `old_sewer_west`, `old_sewer_east`,
`fungal_gallery`, `channel_crossing`, `custodian_chamber`
**Purpose:** First real challenge, branching paths, early anomalies
**Unlock:** Complete Level 1 (reach drain_junction)

**Tone:**
The stonework changes here. Older. The mortar is different —
a technique that predates the city's founding records.
Strange fungi grow in clusters that pulse faintly.
Pipes hum with something that isn't water pressure.
Echoes arrive slightly before the sounds that cause them.

**Room Descriptions:**

`old_sewer_west`:
> The architecture shifts. The brickwork is older here —
> a different style, a different era. Whoever built this
> did not build the city above it. Or they built this first.
> Fungi grow in long shelves along the walls, pale orange,
> pulsing faintly. The air smells like copper and something
> organic. A pipe to the left hums at a frequency you feel
> more than hear.

`fungal_gallery`:
> A long chamber lined floor to ceiling with fungal growth.
> Some colonies are the size of a person. They glow — not
> brightly, but enough to see by. The floor is soft underfoot
> in ways stone shouldn't be.
> The spores in the air are visible. Try not to breathe deeply.
> This is where Othorion sends players to harvest.
> *Sewer Fungi* grows in clusters along the north wall.

`channel_crossing`:
> A wide channel here — too wide to jump, too deep to wade.
> Someone built a crossing once: iron rungs in the wall,
> a chain stretched across. The chain holds, probably.
> On the far side, something pale and long-limbed crouches
> and watches. It does not move while you watch it back.
> The moment you look away, you hear it shift.

`old_sewer_east`:
> The eastern branch is drier. The fungi thin out.
> The stonework here has markings — not graffiti, not damage.
> Deliberate carved symbols in a pattern that repeats.
> Othorion would recognize them. The player might, with context.
> At the end of this branch: a door. Old iron. Locked.
> The lock is not rusted. Someone maintains it.

`custodian_chamber`:
> The chamber is large enough that the ceiling is lost in dark.
> At the center: a construct. Half stone, half something else —
> metal tendrils grown through with fungal threads, still moving,
> still performing its maintenance function on infrastructure
> that no longer serves any city above.
> It has been here since before Verasanth.
> It will be here after.
> It has not noticed you yet.

**Enemies:**
- Fungal Shamblers — slow, spore cloud on death (poison 3 rounds).
  HP: 70. DMG: 10-15.
- Mold-Touched Vermin — rats/insects, poison bite.
  HP: 30. DMG: 8-12 + poison.
- Rustback Beetles — armored, high defense, slow.
  HP: 80. DMG: 15-20. Armor: 5.
- Channel Stalkers — long-limbed ambush, attack from ceiling.
  HP: 55. DMG: 18-25. First strike bonus if player moves.
- Sewer Wights — drowned spirits, drag to water (drown DoT).
  HP: 65. DMG: 12-16 + grab attempt.

**Mini Boss — The Sporebound Custodian:**
HP: 450. Phases: 2.
- Phase 1: Melee + spore cloud (AoE poison, 2 dmg/round),
  summons Fungal Shamblers every 3 rounds
- Phase 2 (below 40% HP): Mechanical tendrils activate,
  faster attacks, spore burst (heavy AoE on death if not escaped)
- Death: Drops Custodian Core (Seris: "This resonates. Keep it."),
  Spore Extract (Othorion reagent), Old Channel Key (opens east door)

**Narrative Hooks:**
- `seen_sewer_level2` flag set on first entry
- Othorion Fungi quest items spawn in fungal_gallery
- Old Channel Key opens a room hinting at Level 3
- The symbols in old_sewer_east trigger Othorion reaction:
  "You saw the marks. Those predate the city. Significantly."
- Seris reacts to Custodian Core:
  *She goes still.* "Where did you find this."
  (Sets `seris_first_resonant_item = 1` — her arc advances)
- Grommash: "You went deeper. The channels remember everyone
  who passes through them."

**Inspect Items:**
- old_stonework: "The mortar technique is wrong for this city.
  Too old. Whoever built this built it for something else."
- fungal_colony: "The pulse is rhythmic. Not random growth —
  something is feeding it."
- channel_chain: "It holds your weight. Mostly."
- carved_symbols: "A repeating pattern. Not decorative.
  Functional, maybe. Or a warning in a language no one reads."
- locked_door: "Old iron. The lock is maintained.
  Someone comes here regularly."

---

### Level 3 — The Cistern Depths
**Location IDs:** `cistern_upper`, `flooded_hall`,
`drowned_chamber`, `leviathan_approach`, `leviathan_chamber`
**Purpose:** Mid-game difficulty spike, water traversal, first artifact clue
**Unlock:** Old Channel Key from Level 2

**Tone:**
Waist-deep water. Drowned chambers where furniture and bones
float with equal indifference. Broken machinery half-submerged,
still trying to function. Glowing algae that makes the water
look almost beautiful. Something large moves in the deep.

**Room Descriptions:**

`cistern_upper`:
> The door opens onto a landing above a flooded chamber.
> Water fills everything below the landing — clear enough
> to see the floor eight feet down, murky enough that
> you cannot see what moves through it.
> The glowing algae makes it look almost beautiful.
> A Pipe Siren's call echoes from somewhere below.
> It sounds almost like a voice you recognize.
> It is not.

`flooded_hall`:
> The water is waist-deep here. Cold. The hall runs long —
> doorways on both sides, rooms flooded to the ceiling.
> Something brushes your leg. You cannot see it.
> The walls here are marked differently than Level 2 —
> not symbols, but measurements. Water levels, dates,
> records of flooding cycles going back further than
> the city's founding. Someone was tracking this.

`drowned_chamber`:
> A large room, fully flooded. The ceiling is visible —
> you would need to swim to cross. On the far wall,
> barely visible through the algae-lit water:
> a raised platform. On the platform: something that
> doesn't belong here. Something that hums faintly
> even through eight feet of water.
> The artifact fragment. First one.
> Getting to it means crossing the chamber.
> Something in the deep has noticed the hum too.

`leviathan_approach`:
> The water deepens. You cannot touch the bottom.
> The glowing algae stops here — something has eaten it,
> or it has learned not to grow near whatever lives ahead.
> The water is warm. Unnaturally warm.
> Massive shapes move in the walls — not creatures,
> the walls themselves shifting. Old architecture settling.
> Or breathing.
> Ahead: a chamber large enough to hold something enormous.

`leviathan_chamber`:
> The chamber opens into something vast.
> Pillars rise from water you cannot see the bottom of.
> Coiled around three of them: the Cistern Leviathan.
> It is not sleeping. It has been waiting.
> The water around it is perfectly still.
> Everything else in this dungeon has been noise and motion.
> This is silence.
> It uncoils slowly when you enter. No rush.
> It has nowhere to be.

**Enemies:**
- Drowned Thralls — rise from water silently, no warning.
  HP: 85. DMG: 18-24. Immune to knockback.
- Cistern Leeches — attach on hit, drain 5 HP/round.
  HP: 20. DMG: 8-10 + attach. Must be removed (costs action).
- Flood Serpents — fast water movement, lightning reflexes.
  HP: 65. DMG: 20-28. +10 DMG from water ambush.
- Slick Horrors — oily sludge form, 50% physical resistance.
  HP: 95. DMG: 15-20. Weak to fire.
- Pipe Sirens — no combat, lure mechanic. Player resists or
  moves toward deep water (WIS check). Drawn players take
  drowning damage (5/round) until they break free.

**Boss — The Cistern Leviathan:**
HP: 800. Phases: 3.
- Phase 1: Coil attack (grab + squeeze, 30 DMG), water surge
  (knockback), summons Flood Serpents
- Phase 2 (60% HP): Submerges, attacks from water
  (invisible until strike), water becomes dangerous terrain
- Phase 3 (30% HP): Full speed, tail sweep (AoE), death throes
  (water surge on death, escape check or take 40 DMG)
- Death: Drops Leviathan Scale (armor material, Veyra quest),
  Cistern Key, Drowned Relic (Seris: resonant, mid-tier)

**Narrative Hooks:**
- `seen_sewer_level3` flag — Seris dialogue changes dramatically:
  "You went to the depths. I didn't think you would."
- Artifact fragment in drowned_chamber: `cistern_artifact_found`
  Seris reacts: *She looks at it for a long time.*
  "This is the first one. There are more."
  Arc 1 formally activates.
- Othorion on player return: "The resonance shifted when you
  brought that up. I felt it from the Crucible."
  He becomes uneasy. Seeds his arc.
- Flood level records: Thalara cross-reference
  "Those flood records — someone was tracking cycles.
  The dates match something I found in a patient's
  belongings once. Someone who came from down there."
  (Plants Thalara Arc 2 seed — her lost person was here)

---

### Level 4 — The Underworks
**Location IDs:** `mechanist_entrance`, `gear_corridor`,
`heat_vent_crossing`, `regulator_approach`, `regulator_chamber`
**Purpose:** Reveal ancient infrastructure, introduce the lock concept
**Unlock:** Cistern Key from Leviathan

**Tone:**
Massive gears turning with no visible power source.
Heat vents that exhale warm air on a rhythm — inhale, exhale.
Metal walkways over drops that go further down than they should.
A rhythmic thumping like a heartbeat that you feel through
the soles of your feet. This was built. This was designed.
This is still running.

**Room Descriptions:**

`mechanist_entrance`:
> The architecture changes completely.
> Stone gives way to metal — old metal, dark with age,
> but not rusted. Maintained. The walls are mechanisms:
> gears, pipes, valves, gauges reading pressures
> in units you do not recognize.
> The air is warm and tastes of hot iron.
> Somewhere ahead, something thumps in a rhythm
> that is too regular to be anything but intentional.
> *The city's heartbeat.*
> Othorion has written about this in his notes.
> You have found what he was looking for.

`gear_corridor`:
> The corridor is dominated by two massive gear assemblies
> on either side, turning slowly. The gaps between teeth
> are large enough to step through — barely. The timing
> is regular. Predictable. Something moves in the shadows
> between the gears, using them as cover.
> On the wall beside a pressure gauge: symbols.
> The same symbols from Level 2.
> More of them. A complete sequence.
> Othorion would recognize this as a language.

`heat_vent_crossing`:
> A wide chamber with a grated floor. Below the grates:
> orange heat, venting upward in rhythmic pulses.
> The crossing requires timing — vents fire on a cycle.
> Heat Wraiths form in the exhaust columns and dissipate
> when the vent closes. They re-form when it opens.
> On the far side: a door marked with a symbol that matches
> the artifact fragment from Level 3.
> The door is not locked. It is waiting.

`regulator_approach`:
> The chamber narrows to a corridor where the walls
> themselves are machinery — pistons cycling,
> pressure gauges fluctuating, steam valves releasing
> in precise sequence. The Broken Regulator is visible
> through a grate at the corridor's end.
> It was once maintaining something important.
> Whatever corrupted it did so recently —
> the damage is fresh in geological terms.
> The symbols here are different: warning markers.
> Even without translation, they read as warnings.

`regulator_chamber`:
> The chamber is the largest yet — cathedral-scale,
> filled with machinery that controls water flow
> through the entire system above.
> At the center: The Broken Regulator.
> It is still trying to do its job.
> The corruption has not stopped it — it has redirected it.
> It is now doing something else entirely.
> Something that involves the symbols on the walls,
> the artifact fragments, and the thumping heartbeat
> that you have felt since Level 3.
> It is building toward something.

**Enemies:**
- Gearbound Sentinels — constructs, runic powered, methodical.
  HP: 120. DMG: 22-30. Armor: 8. Weak to disruption.
- Heat Wraiths — form in vent exhaust, burn on contact.
  HP: 55. DMG: 25-35 (fire). Immune to physical. Tied to vents.
- Rust Golems — slow, massive, hit extremely hard.
  HP: 200. DMG: 35-50. Armor: 12. Weak to lightning.
- Pipe Crawlers — mechanical spiders, ceiling ambush.
  HP: 45. DMG: 15-20. Web attack (immobilize 1 round).
- Ash-Charged Vermin — rats with strange energy, explode on death.
  HP: 35. DMG: 12-15 + explosion (20 AoE on death).

**Boss — The Broken Regulator:**
HP: 1200. Phases: 3.
- Phase 1: Water surge (AoE knockback), piston slam (single target),
  activates Gearbound Sentinels from walls
- Phase 2 (65% HP): Vent activation (heat damage zones shift),
  faster slam cadence, corrupted repair cycle (heals 50 HP/round
  unless disrupted — requires specific attack pattern)
- Phase 3 (35% HP): Full mechanism activation —
  the room itself becomes hazardous. Moving platforms,
  vent columns, sentinel spawns simultaneously.
  Final phase telegraph: it begins outputting the symbol sequence.
  Othorion will recognize this when told.
- Death: Drops Regulator Core (Othorion: "This is extraordinary.
  This is the mechanism's control node."),
  Mechanist Key, Runic Tablet (full symbol sequence)

**Narrative Hooks:**
- `seen_sewer_level4` flag — Othorion's dialogue permanently shifts:
  "You found the Underworks. The city is not just old.
  It was built for something. The Regulator is proof."
- Runic Tablet: Othorion recognizes symbols matching Seris's artifacts.
  "These symbols — they appear on what Seris collects.
  The mechanism and the artifacts are part of the same system."
  He goes quiet. This is new data that changes his model.
- Grommash on return: "This place was not built for us."
  *He looks at the Runic Tablet if the player shows it.*
  "Put that somewhere safe. Away from her."
  He does not say who "her" is. He doesn't need to.
- The city's breath becomes audible from Level 4 onward —
  all room descriptions in levels 4-5 include a heartbeat reference

---

### Level 5 — The Sump Cathedral
**Location IDs:** `cathedral_approach`, `cathedral_nave`,
`artifact_antechamber`, `sump_pit_edge`, `ash_heart_chamber`
**Purpose:** Dungeon climax, Seris's first true artifact
**Unlock:** Mechanist Key from Broken Regulator

**Tone:**
Cavernous. Ancient. Deliberate. This was not infrastructure —
this was built for a purpose, and the purpose was not sanitation.
Black stone pillars. A central pit that breathes warm air
on a cycle that matches the heartbeat felt since Level 3.
Runes that pulse faintly — not randomly, in sequence.
The sequence is counting down or counting up.
You cannot tell which.

**Room Descriptions:**

`cathedral_approach`:
> The Mechanist Key opens a door that does not belong
> in a sewer. Carved stone. Old beyond the Underworks.
> The stonework is not mechanical — it is architectural,
> deliberate, designed to impress or intimidate or both.
> The air that comes through is warm and carries something
> that is almost a sound — almost a word —
> in a language that predates language.
> The heartbeat is louder here. Much louder.
> It is not the machinery.
> The machinery was mimicking this.

`cathedral_nave`:
> The chamber is cathedral-scale. Black stone pillars
> rise into darkness overhead. The floor is carved with
> concentric circles around a central point —
> the pit at the chamber's heart.
> The pit breathes. Warm air exhales from it in the same
> rhythm as the heartbeat. Between exhales: silence so complete
> it has texture.
> The runes on the pillars pulse in sequence.
> Something lives here. Or something that was once alive
> has been replaced by the idea of life, still performing
> the functions of living without the experience of it.
> Ashborn Acolytes stand at intervals between the pillars.
> They are chanting. They have been chanting for a long time.

`artifact_antechamber`:
> A smaller chamber off the nave. A pedestal.
> On the pedestal: nothing yet — the artifact is protected
> by the Ash Heart Custodian in the main chamber.
> But the pedestal is shaped for something specific.
> The shape matches the fragment from Level 3 exactly.
> On the wall behind the pedestal: a complete inscription.
> The final line reads, in the city's own symbols:
> *"THE KEY DOES NOT OPEN UPWARD."*
> This is the warning Othorion has been looking for.
> The player may not understand it yet.
> They will.

`sump_pit_edge`:
> The edge of the central pit. Looking down:
> warm darkness, lit faintly from far below by something
> that pulses with the heartbeat.
> The pit goes down further than the dungeon should allow.
> Further than the city above should allow.
> Further than the ground should allow.
> Othorion's research suggests this is a "thin place" —
> a point where the membrane between layers is worn thin.
> Standing here, you feel the city noticing you.
> Not with hostility. With recognition.
> You have been here before.
> You have not been here before.

`ash_heart_chamber`:
> The Ash Heart Custodian stands before the artifact altar.
> It is not a guardian in the conventional sense —
> it is the last function of this place still operating
> as intended. Its purpose is not to prevent access.
> Its purpose is to ensure that only something worthy
> of the artifact can take it.
> Whether you are worthy is not a moral question.
> It is a mechanical one.
> The city will decide.

**Enemies:**
- Ashborn Acolytes — chant in unison, synchronized attacks.
  HP: 95. DMG: 20-28. Break chant = breaks coordination.
- Cathedral Wraiths — phase through walls, unpredictable.
  HP: 70. DMG: 25-32. Immune to physical while phased.
- Living Runes — detach from walls, floating blade attacks.
  HP: 40. DMG: 18-24. Fast, small, hard to hit.
- Sump Guardians — towering stone, glowing cores.
  HP: 250. DMG: 40-55. Destroy core = instant kill.
- Breathspawn — form from pit exhales, incorporeal briefly.
  HP: 60. DMG: 22-30. Respawn from pit if not killed quickly.

**Boss — The Ash Heart Custodian:**
HP: 2000. Phases: 3. This is the dungeon's true test.

- Phase 1 (100-70% HP):
  Standard combat — heavy melee, ash pulse (AoE slow),
  summons Living Runes from pillars.
  The pit breathes every 30 seconds — all players take 15 dmg
  unless they move off the pit edge tiles.

- Phase 2 (70-35% HP):
  The cathedral activates. Runes on all pillars begin pulsing.
  Custodian gains: whisper attack (WIS check or confused 2 rounds),
  arena distortion (distance between locations shifts),
  Breathspawn begin emerging from pit continuously.
  The whispers are in a language. Othorion recognizes it later.
  It is the same language as the inscription.

- Phase 3 (35-0% HP):
  The Custodian accepts the player's challenge.
  It stops summoning. It stops using arena effects.
  It fights directly — full speed, full power, no tricks.
  This is the mechanical test. Pure.
  On death: the pit exhales once, deeply. The city shudders.
  Lights flicker in Verasanth above.
  Kelvaris sets down his glass.
  Pip points at the trapdoor.

- Death drops:
  **Seris's First Artifact** — the Ashbound Resonance
  Description: *"A fragment of something larger. It hums against
  your palm. The hum matches the heartbeat you have felt
  since Level 3. It is warm. It has always been warm.
  It was waiting for you specifically, or it was waiting
  for anyone. You cannot tell which. You are not sure
  the distinction matters."*
  Seris reacts: *Her composure breaks — just slightly.
  Just enough.* "You found it. I didn't think —"
  *She stops. Resets.* "I'll need to examine it."
  She does not give it back. Arc 2 begins.

**Narrative Cascade on Artifact Retrieval:**
- Seris: composure crack, Arc 2 activates
- Othorion: "The resonance shifted significantly.
  Whatever she has now — it is active."
  He begins Arc 2 of his own questline.
- Grommash: *He senses the moral shift.*
  "Something changed. The city is different weight now."
  "Be careful what you have given her."
- Kelvaris: *He sets something down.*
  "You went all the way down." *A pause.*
  "The hearth burned different while you were gone."
- Thalara: "Are you alright? Not your body — you."
  *She looks at them carefully.*
  "Something followed you back. Not physically.
  Something in your eyes."
- Veyra: *She looks up.*
  "You went to the bottom." *Back to work.*
  "Good."
- Pip: *Already facing the direction of Seris's shop.
  Not moving. Just facing it.*

---

## SCALING TABLE

| Level | Rec. Player Level | HP Range | DMG Range | Notes |
|-------|------------------|----------|-----------|-------|
| 1 | 1-3 | 15-280 | 3-25 | Tutorial pace |
| 2 | 3-6 | 30-450 | 8-30 | First challenge |
| 3 | 6-10 | 20-800 | 8-50 | Difficulty spike |
| 4 | 10-15 | 45-1200 | 15-55 | Elite tier |
| 5 | 15-20 | 40-2000 | 18-55 | Endgame of arc 1 |

---

## LOOT TABLE SUMMARY

| Level | Key Drops | NPC Reaction |
|-------|-----------|--------------|
| 1 | Rat King Musk, Sewer Map Fragment | Othorion, Seris mild |
| 2 | Custodian Core, Spore Extract | Seris (first resonant item) |
| 3 | Leviathan Scale, Drowned Relic | Seris arc activates |
| 4 | Regulator Core, Runic Tablet | Othorion model shifts |
| 5 | Ashbound Resonance (artifact) | Full NPC cascade |

---

## MINOR FETCH QUESTS

### Othorion's Reagent Run (available from trust tier 1)
- Sewer Fungi from Level 2 fungal_gallery (3 required)
- Deep Vent Ash from Level 4 heat_vent_crossing (1 required)
- Rat King Musk from Level 1 boss (1 required)
Reward: Listening Ash Elixir (Arc 1 item), trust tier advance

### Grommash Bounty Contracts
- Level 1: Drain Lurker bounty (3 kills) — Ash Marks + Order +40
- Level 2: Channel Stalker bounty (2 kills) — Ash Marks + Order +40
- Level 3: Drowned Thrall bounty (4 kills) — Ash Marks + Order +40
- Escalating rewards, escalating Order score
- All bounties optional, all advance Grommash relationship

### Thalara's Trace (available after Arc 1, WIS 12+)
- Find the name in Level 3 flood records
- Find the personal item in drowned_chamber alcove
  (A healer's kit. Old. Initials she recognizes.)
- Return to Thalara
  *She is very still for a moment.*
  "They were down there."
  *She does not cry. She refocuses.*
  "Then I need to know more."
  Arc 2 seed planted.

### Veyra's Material Fetch
- Leviathan Scale from Level 3 boss
- Rust Golem Plates from Level 4
- "Rare materials. I'll make something worth the risk."
- Reward: Unique armor piece only she can craft

---

## THE MARROWIN DASK THREAD

Dask is referenced throughout the sewer as a named figure
who went deeper than anyone. His trail is breadcrumbs.

- Level 1 entrance: "MARROWIN DASK WENT DEEPER. DON'T."
- Level 2 east branch: A personal mark — a specific symbol
  used as a signature. Seen in multiple places.
- Level 3 flooded_hall: A name in the flood records.
  Dask. Descent 7. No return date.
- Level 4 gear_corridor: A tool left behind —
  a specific instrument Othorion recognizes as belonging
  to someone from a specific era.
- Level 5 artifact_antechamber: The inscription.
  Below the warning, barely visible: a personal note
  added later, in a different hand than the ancient text.
  *"I understand now. I am not leaving.
   The city needs someone down here.
   — M.D."*

Dask is alive. Somewhere below Level 5.
He is not a boss. He is not an enemy.
He is what the player is becoming.

---

## POST-PORTAL EVOLUTION (Level 6 preview)

After Seris opens the portal, the sewer changes.

New enemies appear in existing levels:
- Ash Phantoms (Level 3+): mimic player voices, lure mechanic
- Hollowed Guardians (Level 4): constructs with missing cores,
  erratic behavior, unpredictable attacks
- Descent Echoes (Level 5): twisted versions of lower Hell enemies,
  foreshadowing the next layer

The Sump Cathedral changes:
- The pit breathes differently — longer exhale, shorter inhale
- The artifact pedestal is empty now, but warm
- A new path is visible from the sump_pit_edge:
  steps descending into the warm darkness below
- Grommash: "The descent has begun. For those who choose it."

The sewer is no longer just a dungeon.
It is a threshold.

---
*Design document version 1.0 — The Verasanth Sewers*
*Part of the Verasanth World Bible*
