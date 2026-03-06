# The Cinder Cells — Complete Location Design
**File:** `blueprints/world/cinder_cells.md`
**Version:** 1.0
**Last Updated:** 2026-03-06
**Status:** Ready for Implementation

---

## LOCATION OVERVIEW

The Cinder Cells are not a prison.
Verasanth does not build institutions.
It repurposes wounds.

Justice in Verasanth is literally beneath the city —
out of sight, out of mind, pressing up through the stone
as heat that has no clean explanation.

The entrance is visible from the market square every day.
Most people do not look at it directly.
This is not because it is hidden.
It is because looking at it requires acknowledging
what it means that it is there.

---

## LOCATION NODES

### Node: `cinder_cells_entrance`
**Name:** The Descent — Cinder Cells Entrance
**Connected from:** `market_square` (south-eastern corner, behind guard booth)
**Exits:** up → `market_square` | down → `cinder_cells_hall`

**Description:**
```
A narrow stairwell cut into the stone behind the guard booth,
descending at a steeper angle than seems right for the depth
it should reach. The stone on either side is worn smooth —
not by tools, by hands. People bracing themselves on the way
down, or steadying themselves on the way back up.

From the first step, you can see it: dim orange torchlight
at the bottom, iron bars catching the light, and rising
through the gaps in the stone, a warmth that has nothing
to do with the torches.

The city exhales through this stairwell.
Whatever it breathes out has been underground for a long time.
```

**Objects:**
- `guard_booth` — Grommash's surface post, empty when he's below.
  *"A squat stone booth beside the stairwell entrance. A hook
  inside holds a second ledger — identical to the one above,
  kept in the same hand, recording the same names in smaller
  script. The booth is sized for one person and has been
  occupied by the same person long enough that the stone
  where he stands is worn slightly concave."*

- `stairwell` — The descent itself.
  *"Seventeen steps. You count them because the torchlight
  at the bottom makes the distance look wrong — closer than
  it is, or further. The walls narrow as you descend. By the
  bottom step your shoulders nearly brush both sides. The city
  is making a point."*

- `iron_bars_below` — Visible from surface, before descending.
  *"You can see them from the top step — a heavy iron gate,
  bars thick enough that bending them would require something
  that did not care about the effort. Beyond the bars, orange
  light and the suggestion of a room. The bars are old enough
  that the metal has darkened unevenly, warmer colors where
  the heat from below reaches them most."*

---

### Node: `cinder_cells_hall`
**Name:** The Entrance Hall
**Exits:** up → `cinder_cells_entrance` | deeper → `cinder_cells_block`
**Special:** Grommash spawns here when player crime heat ≥ Killer tier

**Description:**
```
The entrance hall is low-ceilinged and warm in the specific
way of a room that has been warm for so long that the warmth
has become structural. The stone absorbs it rather than
radiating it. The air moves slowly, if at all.

Iron sconces hold torches burning a dull, patient orange.
They have been burning long enough that the stone above
each one is blackened in an identical arc — the same burn,
repeated, for years.

Against the near wall: a desk. Grommash's secondary ledger
sits open to the current page. The handwriting is the same
as the ledger above. He keeps both current. He has never
explained why two ledgers are necessary. He has never
been asked.

Beside the desk: a rack of confiscated weapons.
Everything here has a story it is no longer allowed to tell.

The gate ahead is iron, heavy, and open. It is always open.
Grommash does not lock it.
The cells hold people. The gate is a formality.
```

**Objects:**
- `grommash_desk` — Secondary ledger, records of current sentences.
  *"A heavy desk, nothing on it but the ledger and an iron
  cup holding three quills. The ledger is open. Current
  entries: names, dates, crime tier, sentence length,
  time remaining. Some entries have a single word added
  in the margin in smaller script. The word is always the
  same: RETURNED. These are the ones who served their
  sentence and left. The ones who didn't are crossed out
  in a different ink. There are very few crossed out."*

- `weapon_rack` — Confiscated gear, stored not destroyed.
  *"A rack of iron hooks holding weapons taken from people
  who no longer needed them, or needed to be separated from
  them. Each weapon has a small tag attached — a name, a date,
  a single-word description of the crime. The weapons are
  maintained. Oiled, checked, kept in working order. Grommash
  does this himself. He has never explained why he maintains
  weapons he confiscated from criminals. He does not think
  it requires explanation."*

- `iron_gate` — Always open. Heavy. Ancient.
  *"The gate is iron, old enough that the hinges have
  integrated into the stone rather than sitting against it.
  It stands open. It has always stood open, as far as anyone
  can determine — the hinge mechanism that would close it
  has rusted into position. Grommash has never had it repaired.
  'The cells hold people,' he said once, to no one in
  particular. 'The gate is a reminder. Not a lock.'"*

- `hall_heat` — The warmth itself, inspectable.
  *"The heat is not from the torches. Stand still and
  you can feel it rising through the floor — a slow,
  even warmth pushing up through the stone from somewhere
  below this room. Put your palm flat on the floor and
  the stone is warm enough to be uncomfortable after a
  moment. Grommash has never investigated the source.
  'The city burns away what it cannot use,' he said,
  when asked. He returned to the ledger. The subject
  was closed."*

---

### Node: `cinder_cells_block`
**Name:** The Cell Block
**Exits:** back → `cinder_cells_hall` | deeper → `cinder_cells_pit`
  (pit access only for Dread/Ash Wraith tier — locked gate)
**Special:** Player's active cell is here during sentence

**Description:**
```
Six cells, three to each side, carved directly into the
stone rather than built from it. Not excavated — carved,
as if the room was formed by something that removed exactly
what it needed to remove and left the rest.

The walls are blackened with soot from a source that is
not visible. The iron bars are warped — not broken, warped,
bent slightly by heat applied over a very long time from
below. They still hold. They have always held.

From the cracks between the floor stones, a faint red glow
rises and fades in a slow, irregular pulse. It does not
match the torches. It does not match anything.

The hum begins here. Low, below audible at first, felt
more than heard — in the back teeth, in the sternum,
in the spaces behind the ears. It is perfectly regular.
It has been regular since before anyone now living
was born.

Runes are etched into the stone above each cell door.
They are not Grommash's work. He did not put them there.
He does not know who did. He checks them, sometimes,
running his thumb across them in a specific sequence
that he has never explained. They are always intact.
```

**Objects:**
- `cell_runes` — The restraint runes, ancient, unexplained.
  *"The runes above each cell door are cut deep —
  not scratched, not inscribed, cut with something that
  removed stone cleanly. They are not in any script you
  have seen in Verasanth, or above it. They predate the
  city's current iteration. They possibly predate several
  iterations. When you stand close to one, the warmth
  from below increases slightly, as if the rune is a
  conductor rather than a carving. Seris, if she were
  here, would have a great deal to say about them.
  She has not been here."*

- `floor_glow` — The red light from below.
  *"The cracks between the floor stones pulse with a
  dull red-orange light that has nothing to do with
  torches. The pulse is slow — roughly once every
  four seconds, though you cannot be certain because
  watching it directly makes the timing harder to track.
  In the cells, the glow comes through the floor too.
  Prisoners sleep on the glow. Most stop noticing it
  within the first hour. This is either adaptation
  or something else."*

- `warped_bars` — Heat-bent iron, still functional.
  *"The cell bars are iron, thick, and bent — not damaged,
  not broken, bent. Each bar curves slightly inward at
  its midpoint, as if something below them expanded
  and the bars yielded rather than snapped. They still
  hold the dimensions of the cell. They still lock.
  The warp is old enough that rust has formed in the
  bent sections and settled into the new shape. This
  happened long before Grommash arrived. He inherited
  warped bars and uses them without comment."*

- `cell_[1-6]` — Individual cells, inspectable.
  *"Stone floor. Stone walls. A narrow shelf that serves
  as a bed. The stone of the shelf is smoother than
  the walls — worn smooth by people who laid on it
  and eventually left. The rune above the door is
  visible from inside. From in here, it looks different
  than it does from outside. You cannot say exactly how."*

---

### Node: `cinder_cells_pit`
**Name:** The Holding Pit
**Access:** Locked gate, Dread/Ash Wraith tier only
**Exits:** up → `cinder_cells_block` (always accessible going up)

**Description:**
```
The deeper chamber is circular, and was not made for comfort
or for function. It was made for something else entirely,
and repurposed. The original purpose is not clear.
The repurposing is obvious.

An iron grate covers the floor. Heat rises through it
in visible waves — not enough to burn, enough to be
constant, enough to make sleep impossible and thought
difficult. Chains bolt into the stone at four points
around the wall, heavy enough that breaking them
would require effort that spending the night here
would make impossible.

At the center of the ceiling, a single rune.
It is different from the ones above.
It pulses with the heat from below.

If you speak a lie in this room — a direct lie,
a deliberate untruth — the rune brightens.
Not dramatically. Not theatrically.
Just enough to be noticed.
Just enough to know it noticed.

Grommash has never told anyone about this property.
He has let it be discovered.
```

**Objects:**
- `floor_grate` — Iron grate over heat source below.
  *"The grate covers the entire floor — iron bars
  a handspan apart, heat rising through them steadily.
  Below the grate: darkness, and from the darkness,
  warmth with a source you cannot see. Press your
  face to the bars and look down. The darkness goes
  further than the room's depth should allow. Something
  is down there. It is not the furnace. It is not
  a vent. It is something that was here before either
  of those explanations existed."*

- `truth_rune` — The lie-detecting rune. Central, ceiling.
  *"The rune at the ceiling's center is larger than
  the others — carved into the keystone of the chamber's
  arch with a depth and precision that the others
  approximate but do not match. When the room is silent,
  it pulses with the heat below, slow and regular.
  When someone speaks an untruth in this room, the pulse
  brightens for exactly one beat, then returns to normal.
  It does not judge. It does not punish. It simply
  notices. Grommash brought one prisoner here who
  claimed innocence. The rune was quiet. He brought
  another who claimed the same. The rune was not.
  He has never discussed what he did with that information."*

- `holding_chains` — Four anchor points, heavy iron.
  *"The chains are bolted into the stone at roughly
  the four cardinal points of the circular room.
  They are long enough to reach the center.
  They are heavy enough that wearing them would be
  exhausting within minutes. They are old enough that
  the iron has darkened and settled into the stone
  anchor points as if growing there. Grommash maintains
  them the way he maintains everything. He has never
  had to use them on the same person twice."*

---

## NPC DIALOGUE ON THE CINDER CELLS

### Grommash (when asked about the cells)
Never calls them a prison. His terms:
- "the holding place"
- "the quiet room"
- "the ash pit"
- "the cells" (most often)

**On the heat:**
*He does not look up from the ledger.*
"The city burns away what it cannot use."
*Back to the ledger.*

**On why he keeps them:**
"Order needs a place to rest its weight."

**On the runes:**
*A pause. Longer than his usual pauses.*
"They were here when I was born. They will be here
when I am not. I do not need to understand them
to respect what they do."

**On the truth rune (if player has been to the pit):**
*He looks at them for a long moment.*
"You noticed."
*He returns to the ledger.*
"Good."

**On the heat source:**
"I have investigated it twice. Both times the investigation
ended at a wall that should not be a wall.
I stopped investigating."
*Beat.*
"The cells still work."

---

### Kelvaris (when asked about the Cinder Cells)
*He sets down the glass he is polishing.*
"I've been here since before Grommash was born.
The cells were here before me."
*He picks up the glass again.*
"The heat was here before the cells."
*He says nothing else.*

---

### Othorion (when asked)
*He does not look up from the current work.*
"The heat signature is inconsistent with any known
geothermal source at this depth. The regularity
suggests a mechanism rather than a natural phenomenon."
*A pause.*
"Something below those cells is deliberate.
Whether it was designed for the cells specifically
or whether the cells were placed above it deliberately
are different questions with different implications."
*He finally looks up.*
"I have not yet decided which question to pursue first."

---

### Thalara (when asked)
"I've been down there twice. Once to treat someone
Grommash brought in with a wound that needed attention
before a sentence could safely begin."
*She straightens the jars on the shelf in front of her.*
"The air feels angry. Not hot-angry. Just — angry.
Like the room has an opinion about being used this way
and cannot say it directly."
*Beat.*
"The second time I went, I didn't go as far.
I treated the patient at the entrance hall and left."

---

### Seris (when asked — requires trust tier 2+)
*She considers whether to say this.*
"Those cells are older than the city."
*She selects her words.*
"The current city. The iteration we're living in."
*She looks at the player steadily.*
"Grommash maintains them. He enforces order through them.
He believes they are a tool he has repurposed."
*A pause.*
"He doesn't realize what he's guarding."
*She does not elaborate. The subject is closed.*

---

### Citizens (ambient noticeboard / overheard)
*"Don't go below. The heat changes people."*
*"They say the cells are older than the square above them.
I believe it."*
*"Grommash keeps order down there. I don't ask how."*

### Merchants (ambient)
*"Grommash keeps the worst of them down there. Bless him."*
*"I heard someone tried to escape last season.
They got as far as the hall before the heat turned them back."*
*(Note: this is rumor. The heat does not stop escape attempts.
But the rumor does.)*

---

## PLAYER EXPERIENCE OF THE CELLS

### Entering Voluntarily
Players can visit the Cinder Cells at any time.
It is not restricted. Grommash does not prevent visitors.
He notes their presence in the ledger.

Room descriptions subtly shift based on player's crime heat:
- **Clean heat:** Standard description, observational tone.
- **Ruffian:** Grommash glances up. Returns to ledger.
  *"He notes something in the ledger as you enter.
  You are not certain what."*
- **Killer+:** He stands when you enter.
  *"He does not reach for anything. He stands.
  His hands are at his sides. This is enough."*

### Serving a Sentence
Player is locked to `cinder_cells_block`.
Their specific cell is assigned: `cell_[1-6]`.

**Cell description during sentence:**
```
Cell [N] — The Cinder Cells

Stone floor. Stone walls. The shelf is worn smooth
by the people who came before you.

The rune above the door is visible from here.
From in here it looks different. You cannot say how.

The heat comes through the floor in slow pulses.
The hum is constant. You stop hearing it around
the twenty-minute mark. This is not reassuring.

Sentence remaining: [TIME]
Crime heat: [TIER]

[ESCAPE attempt available after 1 minute]
```

**Grommash visit mid-sentence:**
At the halfway point of any sentence above Ruffian tier,
Grommash comes to the cell.
He does not say much.

*He stops outside the cell. He does not open it.*
*He looks at the player for a long moment.*
"The city has opinions about patterns."
*He looks at the ledger he carries.*
"This is the [first/second/third] time your name
is in this section."
*He looks back at them.*
"The cells are not the consequence. They are the pause
before you decide whether there is a consequence."
*He leaves.*

### Completing a Sentence
Grommash is present when the timer ends.
The cell door opens — he opens it from outside.

*He steps back to allow them out.*
*He does not congratulate them.*
*He does not lecture them.*
"Time served. The ledger is updated."
*He looks at them for one more moment.*
"Don't make me write in it again."
*He returns to the desk.*

The player is returned to `cinder_cells_hall`
and can leave freely via `cinder_cells_entrance`.

**Alignment update on sentence completion:**
- Crime heat: -1 per 5 minutes served (already implemented)
- Mercy/Cruelty decay: accelerated (already implemented)
- Order recovery: +20 (serving time is orderly behavior)
- Grommash trust: small increase for those who served fully

---

## IMPLEMENTATION SPEC

### New Location Nodes
```javascript
cinder_cells_entrance: {
  name: "The Descent — Cinder Cells Entrance",
  description: "[see above]",
  exits: { up: "market_square", down: "cinder_cells_hall" },
  objects: { guard_booth, stairwell, iron_bars_below },
  items: []
},
cinder_cells_hall: {
  name: "The Entrance Hall",
  description: "[see above]",
  exits: { up: "cinder_cells_entrance", deeper: "cinder_cells_block" },
  objects: { grommash_desk, weapon_rack, iron_gate, hall_heat },
  items: [],
  npc_spawn: "grommash"  // Grommash present when crime active
},
cinder_cells_block: {
  name: "The Cell Block",
  description: "[see above]",
  exits: { back: "cinder_cells_hall", deeper: "cinder_cells_pit" },
  objects: { cell_runes, floor_glow, warped_bars, cell_1..6 },
  items: [],
  pit_locked: true  // gate to pit requires Dread+ tier
},
cinder_cells_pit: {
  name: "The Holding Pit",
  description: "[see above]",
  exits: { up: "cinder_cells_block" },
  objects: { floor_grate, truth_rune, holding_chains },
  items: [],
  access_tier: "dread"  // only Dread/Ash Wraith prisoners
}
```

### Map Connection
Add to `market_square` exits:
```javascript
"southeast": "cinder_cells_entrance"
```
Add descriptive note to market_square's description:
*"In the southeastern corner, behind the guard booth,
a narrow stone stairwell descends into orange light.
Everyone knows what is down there.
Most people have learned not to look directly at it."*

### Sentence Assignment
When Grommash detects/captures a player:
1. Set player location to `cinder_cells_block`
2. Insert sentence row with cell assignment (1-6, rotating)
3. Lock movement (all move commands return cell description)
4. Start decay timers

### Post-Seris Evolution
After Seris descends through the portal (Arc completion):
The truth rune in the pit changes behavior.
It begins pulsing independently of the heat — on its own rhythm.
Othorion notices first.
Grommash notices second.
Neither says anything to the other about it.
The cells become a place players come to voluntarily,
to check if the rune is still behaving the same way.
It is not.

---
*Cinder Cells v1.0 — Verasanth*
*Part of the Verasanth World Bible*
