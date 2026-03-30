# VERASANTH — GAME BIBLE UPDATE NOTES
## Version: 2.9 → 3.0
## Date: March 27, 2026
## Changes: Race system, Gautrorn arc, encounter system,
##           NPC scene system, progression visibility,
##           Ashen Cycle calendar, canon timeline

---

Merge these updates into Game Bible v2.9 to produce v3.0.
Do not remove or alter existing content unless explicitly instructed.

---

## UPDATE 1 — Replace §3: Race System

Full replacement. Old race names (tiefling, dark_elf, elf, dwarf, orc)
are gone from all game files. Eight canonical races now exist.

### 3.1 The Eight Races of Verasanth

| Key | Display Name | Stat Mods | Instinct Affinities |
|-----|-------------|-----------|-------------------|
| ashborn | Ashborn | CHA+2, INT+1, WIS-1 | ember_touched, shadowbound |
| dakaridari | Dak'Aridari | DEX+2, CHA+1, CON-1 | shadowbound, streetcraft |
| panaridari | Pan'Aridari | DEX+2, INT+1, CON-1 | streetcraft, ember_touched |
| cambral | Cambral | STR+1, CON+2, DEX-1 | ironblood, warden |
| silth | Silth | STR+2, CON+1, INT-1 | ironblood, warden |
| human | Human | STR+1, DEX+1, INT+1 | all six |
| malaridari | Mal'Aridari | WIS+2, CON+1, INT-1 | hearthborn, warden |
| darmerians | Darmerians | STR+1, WIS+1, CON+1, CHA-1 | hearthborn, ironblood |

### 3.2 Race Identities

**Ashborn** — Humans reshaped by Verasanth's ancient fires. Ember-veins glow
faintly beneath their skin. Not infernal — city-forged. Emotionally volatile,
touched by the Pale Fires.

**Dak'Aridari** — Born in the lightless depths. See in shades of violet, move
with uncanny silence. Culture values secrets, subtlety, and survival in places
where the city forgets itself.

**Pan'Aridari** — Surface-dwellers who navigate Verasanth like it's alive.
Sense subtle shifts in streets, crowds, and danger. Graceful, almost prophetic.

**Cambral** — Stone-touched descendants of the city's earliest builders. Dense
bones, skin marked with faint mineral patterns. They don't just live in
Verasanth — they anchor it.

**Silth** — Shaped by alchemical experiments meant to create perfect soldiers.
Unpredictable results — but powerful. Strength undeniable, discipline equally so.

**Human** — Adaptable, unpredictable, shaped by choice. Resonate with any
instinct. In a city that reshapes people, humans reshape right back.

**Mal'Aridari** — Nomadic people with faint vine-like skin patterns. Steady,
loyal, unyielding when defending those they love. Every healer trained as a
defender. Travel in kin-bands bound by oath, not blood. They see the city as
a wounded giant — and wounded things deserve tending.

**Darmerians** — Sea-forged from the drowned coast beyond Verasanth.
Broad-shouldered, loud-hearted, salt-crystal skin patterns. Build longships
in the city. Hold feasts that double as strategy councils. They see the city
as another storm to weather — and storms are faced together.

### 3.3 NPC Race Assignments

| NPC ID | Display Name | Race |
|--------|-------------|------|
| bartender | Kelvaris | Human |
| weaponsmith | Caelir | Pan'Aridari |
| armorsmith | Veyra | Human |
| herbalist | Thalara | Human |
| curator | Seris Vantrel | Human |
| trader | Gautrorn Haargoth | Darmerian |
| othorion | Othorion Naxir | Dak'Aridari |
| warden | Grommash | Silth |
| vaelith | Vaelith Xyrelle | Dak'Aridari |
| garruk | Garruk Stonehide | Silth |
| halden | Brother Halden Marr | Human |
| lirael | Lirael Quickstep | Pan'Aridari |
| serix | Serix Vaunt | Ashborn |
| rhyla | Rhyla Thornshield | Cambral |

### 3.4 Implementation Files

- `data/races.js` — full replacement, 8 races, old names gone
- `services/equipment_stats.js` — applyRaceAffinities() reads
  RACES[race].stat_mods, stat key names unchanged
- `data/npcs.js` — NPC_RACES exported, NPC_NAMES trader updated
  to "Gautrorn Haargoth"
- Character creation — all 8 races selectable, old options removed

---

## UPDATE 2 — New §9: Gautrorn Haargoth

### 9.1 Character Identity

**Full name:** Gautrorn Haargoth
**NPC ID:** trader
**Location:** still_scale
**Race:** Darmerian
**Instinct lean:** Hearthborn / Ironblood

**Appearance:** Broad-shouldered, heavy-set in the way of those built to
endure. Skin marked with faint salt-crystal patterns that catch lantern light.
Thick beard braided with driftwood and metal charms. Eyes like deep water —
never the same shade twice. Wears a long leather coat patched with old sailcloth.
He moves like someone who has already survived what most fear.

**Personality:** Loud, warm, and quick to laugh. Treats strangers like old
shipmates. But nothing gets past him. He remembers faces. Voices. The way
someone hesitates before answering a question. He listens without trying to.
And once heard — nothing is forgotten. Easy to like. Difficult to read.
Far more aware than he lets on.

**Guiding belief:** "Every man carries a storm inside him. Mine just hasn't
made landfall yet."

### 9.2 The Mystery

Gautrorn dreams. Not fragments. Not impressions. Memories. A longship cutting
through black water. A crew singing in a language he still understands. Trade
routes he could walk blindfolded — if only they existed. They do not.

He does not speak of it often. But sometimes, mid-conversation, he pauses —
as if recalling something that has not yet happened.

**Canon:** Gautrorn's name was in the ledger before he arrived. Seris has
checked. She has not told him. His memories are leaks — from whatever lies
beneath Verasanth. He does not belong to a single version of the story.
The city notices inconsistencies.

### 9.3 The Still Scale

A general store. Rope. Oil. Tools. Spices. Oddities that don't quite belong.
People pass through constantly. It smells of spice, oil, and something faintly
like sea salt. Nautical objects appear where they shouldn't. Instruments no
one can name. Carvings that suggest distance, not place.

**Rule:** The Still Scale is not a tavern. It has no hearth identity.
The nautical wrongness is intentional and must be preserved in all future
content. Never describe it as safe or warm.

### 9.4 Network Role

Surface: Darmerian-run general store. Beneath: quiet relay point for
information moving through the Low Quarter. Not a Veil Market outpost —
a pressure valve Lirael uses when she needs information to move discreetly.

Gautrorn doesn't work for the Veil Market. Not a member. Not trusted.
But useful. He doesn't realize he's part of the web.

- **Lirael's view:** useful, not trusted, not informed
- **Seris's view:** connected to something older than the Market
- **Gautrorn's view of himself:** a trader with unusual dreams

### 9.5 The Three-Actor Truth System

```
Player → talks to Gautrorn (builds trust, hears dreams)
       → talks to Seris (unlocks seris_ledger_question at trust 25
                          + gautrorn_name_revealed = 1)
       → Ledger event fires in index.js (city confirms)
       → Player returns to Gautrorn (delivers the truth)
```

**Seris dynamic:** Seris offers half-truths. Gautrorn answers with something
adjacent to truth. Both listen for what is not said. They do not trust each
other. The exchange itself is the point.

**Third thread (canon):** Seris knows his name is in the ledger. She is
deciding what to do with that knowledge. This is the thing she has not said.

### 9.6 Trust Arc

| Trust | Option ID | Effect |
|-------|-----------|--------|
| 0 | trader_dreams_low | Casual denial |
| 15 | trader_dreams_mid | Coastline memory | sets gautrorn_dreams_discussed |
| 25 | trader_haargoth_run | The trade route that doesn't exist |
| 35 | trader_ledger_dream | The stone ledger | sets gautrorn_name_revealed |
| 35+ | trader_told_ledger | Player delivers news | sets told_gautrorn_about_ledger |
| 35+ | trader_after_revelation | Aftermath |

**Final line (canon):**
*"If the city made me… then I'll make sure it doesn't get the last word."*

### 9.7 Arc Flags

| Flag | Set When |
|------|---------|
| gautrorn_dreams_discussed | Trust 15 reveal |
| gautrorn_name_revealed | Trust 35 ledger dream |
| ledger_gautrorn_confirmed | Ledger event fires via Seris |
| told_gautrorn_about_ledger | Player tells Gautrorn |
| scene_post_ledger_seen | Post-ledger scene witnessed |
| encountered_ledger_stranger | Lore encounter fired |
| encountered_darmerian_sailor | Lore encounter fired |

### 9.8 Seris Additions (seris.js)

| Option ID | Trust | Flag Gate | Purpose |
|-----------|-------|-----------|---------|
| seris_gautrorn_hint | 20 | not gautrorn_name_revealed | Soft pre-trigger guide |
| seris_gautrorn_mid | 20 | gautrorn_dreams_discussed | Oblique reference |
| seris_ledger_question | 25 | gautrorn_name_revealed | LEDGER TRIGGER |
| seris_after_ledger | 25 | ledger_gautrorn_confirmed | Post-confirmation |

**Ledger event text (appended to seris_ledger_question response):**
Pages turn on their own. Not forward. Not backward. Searching. A name forms:
GAUTRORN HAARGOTH. A second line: "A memory misplaced." The name flickers —
as if it could be something else. The ledger closes. The sound is not paper.
It is stone.

---

## UPDATE 3 — New §10: Random Encounter System

### 10.1 Overview

Files: `data/encounters.js`, `services/encounters.js`
Fires on POST /api/move. Does not fire when combat is active.
Cooldown: 3 moves between any encounter.

### 10.2 Zone Chances

| Zone | Chance |
|------|--------|
| street | 8% |
| guild districts | 6% |
| indoor | 2% |
| sewer level 1–2 | 4% |
| sewer level 3–5 and Scar | 0% |

### 10.3 Three Tiers

**Tier 1 — Ambient:** Pure narrative, no interaction. Wrong doors, salt
smells, shadows moving late. Some gated on lore flags.

**Tier 2 — Social:** Stranger arrivals, faction cameos, NPC sightings.
Player sees [E1] [E2] [E0] options. POST /api/encounter/respond.

**Tier 3 — Lore:** 15% chance from lore pool when eligible. Flag-gated.
Sets flags on resolution. Once-only encounters use requires_flag_not.

### 10.4 Tier Selection

1. Lore pool (filtered by zone + flags) — 15% if eligible
2. Social pool — 60%
3. Ambient fallback

### 10.5 Lore Encounters

| ID | Requires | Sets | Once |
|----|----------|------|------|
| lore_ledger_stranger | ledger_gautrorn_confirmed | encountered_ledger_stranger | yes |
| lore_darmerian_sailor_gautrorn | gautrorn_name_revealed | encountered_darmerian_sailor | yes |
| lore_city_whisper | none | none | no (30% modifier) |

**lore_darmerian_sailor_gautrorn:** Sailor mentions Haargoth's Run.
Players who have talked to Gautrorn about the route will recognize it.
The route doesn't exist. The player now knows both of them know that.

### 10.6 Implementation Notes

- `active_narrative_encounter` stored as 1-based INTEGER index
- `NARRATIVE_ENCOUNTER_LIST` flat array in services/encounters.js
- Frontend: `syncNarrativeEncounterUI()` after every renderRoom
- Route: POST /api/encounter/respond body `{ choice_index: N }`
- 0 = ignore (lore once-only still sets flag to prevent repeat)

---

## UPDATE 4 — New §11: NPC Scene System

### 11.1 Overview

Files: `data/npc_scenes.js`, `services/npc_scenes.js`
Fires on POST /api/move — only if no random encounter fired that move.
3% chance per move in trigger zone.
Same scene cooldown: 10 moves (per scene, not global).

**Design principle:** Scenes are the world happening without the player.
NPCs do not always acknowledge player presence. Some scenes are
non-interactive. The world exists independently of player attention.

### 11.2 Scene Roster

**scene_wrong_questions**
Locations: market_square, still_scale | Trust: seris≥15, trader≥15
Not after: ledger_gautrorn_confirmed | Interactive: no
Seris and Gautrorn argue. "Tell me why I remember a sea that never existed."
They both notice the player — but neither fully turns.

**scene_seris_lirael**
Locations: market_square | Trust: seris≥20 | Interactive: no
Lirael: "He doesn't know what he is." Seris: "That makes him useful."
They separate before the player can determine who they mean.

**scene_gautrorn_stranger**
Locations: market_square, low_quarter_street | Trust: trader≥10
Interactive: no
Gautrorn describes Haargoth's Run to a stranger who's never heard of it.
When the player looks back, the stranger is already gone.

**scene_stop_digging**
Locations: market_square, still_scale | Trust: seris≥20, trader≥25
Requires: gautrorn_name_revealed | Not after: ledger_gautrorn_confirmed
Interactive: yes (2 options)
"You need to stop digging." / "Better that than never knowing."
They go quiet as the player approaches.

**scene_three_way**
Locations: market_square | Trust: trader≥25, seris≥20, warden≥10
Not after: ledger_gautrorn_confirmed | Interactive: yes (3 options)
Grommash, Seris, Gautrorn. "You don't get that choice anymore."
All three notice the player. The conversation ends.

**scene_post_ledger**
Locations: market_square, still_scale | Trust: seris≥25, trader≥35
Requires: ledger_gautrorn_confirmed | Fires once only | Interactive: no
The quietest scene. "Then what am I?" / "...misplaced."
Sets scene_post_ledger_seen.

### 11.3 Implementation Notes

- `active_scene` stored as 1-based INTEGER index (same pattern as encounters)
- `NPC_SCENE_LIST` = NPC_SCENES (shared reference)
- Frontend: detects npc_scene.awaiting_choice, renders [S0] [S1] [S2]
- Route: POST /api/scene/respond body `{ choice_index: N }`
- Non-interactive: [S0] Continue only
- Never fires same move as random encounter

### 11.4 Ephemeral State Flags (infrastructure only)

| Flag | Purpose |
|------|---------|
| active_narrative_encounter | Pending encounter (1-based index) |
| active_scene | Pending scene (1-based index) |
| last_encounter_move | Move count of last encounter |
| last_scene_{id}_move | Move count of last specific scene |
| move_count | Total move counter |

These are not story flags. Do not treat them as lore-meaningful.

---

## UPDATE 5 — §5 Addition: Progression Visibility

**Progression Bar — Debug Only**

The progression/milestone list in the character panel is not visible to
players in production. Wrapped in `data-debug="true"` container.
CSS: `[data-debug] { display: none }` by default.

Console toggle: `window.okbDebug = true` reveals all debug panels.

Players discover progression through narrative and NPC reactions,
not a checklist. This is by design and must not be reversed.

---

## UPDATE 6 — Appendix A.4: The Ashen Cycle (Canonical)

**Structure:** Cycle / Turn (0–5) / Mark

**The Six Turns:**
0. Turn of Embers | 1. Turn of Veils | 2. Turn of Stone
3. Turn of Echoes | 4. Turn of Shadows | 5. Turn of Ashfall

**Current era:** Cycle 6312
No living person remembers Cycle 1. The ledger records go back further
than anyone has read.

**Standard format:** Mark 7, Turn of Embers, Cycle 6312
**Short format:** 7 Embers, C6312

**Website implementation:** lib/calendar.ts
**In-game rule:** All player-facing dates use Ashen Cycle format.
ISO dates are never shown to players.

**Canonical dates — Ledger entries:**

| Entry | Ashen Date |
|-------|-----------|
| First Light | Mark 3, Turn of Embers, C6312 |
| The Quiet Step | Mark 17, Turn of Embers, C6312 |
| Echoes in Stone | Mark 4, Turn of Veils, C6312 |
| The Ledger Does Not Forget | Mark 22, Turn of Veils, C6312 |
| Ash Doesn't Burn Out | Mark 8, Turn of Stone, C6312 |
| The Market Knows Your Price | Mark 19, Turn of Stone, C6312 |
| The Flame Listens Back | Mark 11, Turn of Echoes, C6312 |
| Below the Last Door | Mark 6, Turn of Shadows, C6312 |

---

## UPDATE 7 — Appendix A.5: Canon Timeline (Updated)

### Cycle 6312 — Public Events

| Ashen Date | Public Event |
|-----------|-------------|
| Mark 3, Turn of Embers | First light recorded. The city opened its eyes. |
| Mark 4, Turn of Veils | Echoes noted in the lower passage walls. |
| Mark 6, Turn of Shadows | A descender passed the last door and did not return the same. |
| Mark 7, Turn of Embers | A stranger arrived. The ledger already had their name. |
| Mark 8, Turn of Stone | The Archive's flame shifted. The ash did not settle. |
| Mark 11, Turn of Echoes | The Sanctum flame responded to something it should not have heard. |
| Mark 17, Turn of Embers | The quiet step noticed in the southern alleys. |
| Mark 19, Turn of Stone | The Veil Market made its first recorded move. |
| Mark 22, Turn of Veils | The Warden's ledger recorded a name twice. Different dates. |
| Turn of Echoes, C6312 | The city began noticing new arrivals and responding. |

### Cycle 6312 — Private / Meta Notes

| Real Date | Development Event |
|-----------|-----------------|
| March 24, 2026 | Worker deployed. Phase A dialogue closed. v2.9. |
| March 25, 2026 | theoffkeybard.com launched. Phase B authored. Economy wired. |
| March 26, 2026 | Ashen Cycle, Guild Trials, The Scar, Bard's Journal. |
| March 27, 2026 | 8 canonical races. Gautrorn Haargoth arc. Random encounters. NPC scenes. Progression debug-only. Public timeline live. |

### Future Events (planned)

| Planned Date | Planned Event |
|-------------|--------------|
| Turn of Ashfall, C6312 | Arc 1 climax. The resonance event completes. |
| Cycle 6313 | Arc 2 begins. What was contained responds. |

---

## UPDATE 8 — Inviolable Design Rules (additions)

Add to existing rules:

- The Still Scale is a general store, not a tavern. Never give it hearth
  or warmth identity. The nautical wrongness is intentional.
- NPC scenes do not always acknowledge the player. The world exists
  without the player. This must be preserved in all new scenes.
- Gautrorn's name was in the ledger before he arrived. This is canon.
  It cannot be written out or explained away.
- Ashen Cycle dates only in player-facing content. ISO dates never shown.
- Old race names (tiefling, dark_elf, elf, dwarf, orc) are gone permanently.
  Never reintroduce them in any file.
- Progression bar is debug-only. Never make it player-visible.

---

## UPDATE 9 — Version History

**v3.0 — March 27, 2026:**
Race system fully replaced: 8 canonical Verasanth races, old generic
fantasy names gone from all files. NPC race table established for all
14 NPCs. Gautrorn Haargoth implemented as named NPC — full character
identity, 4-tier trust arc, three-actor truth system (Player → Seris →
Ledger → Gautrorn), ledger discovery event in index.js, post-revelation
dialogue, guiding belief documented, Still Scale identity rules added.
seris.js extended with 4 Gautrorn-thread options. Random encounter system:
3 tiers (ambient/social/lore), location-weighted chances (8/6/2/4%),
3-move cooldown, flag-gated lore encounters including ledger-stranger and
Darmerian sailor, NPC cameos for Gautrorn and Seris, frontend wired via
syncNarrativeEncounterUI(). NPC scene system: 6 scenes, 3% chance,
10-move per-scene cooldown, world events without the player, 1-based INTEGER
index storage, frontend wired. Progression bar debug-only (window.okbDebug).
Ashen Cycle canonical — Cycle 6312, six Turns documented. Canon timeline
updated with public and private tracks through March 27. Public Recorded
Events timeline added to /verasanth on website. Inviolable rules extended.

---

*Merge these updates into Game Bible v2.9 to produce v3.0.*
*The races are named. The trader has a name. The city has a calendar.*
*The world now happens without the player. That is how it should feel.*
*Cycle 6312. The ledger is current. Gautrorn doesn't know yet.*
*He will.*
