# Cursor Prompt — Add Othorion Naxir + The Crucible
# Paste this entire prompt into Cursor

---

Add Othorion Naxir as a fully functional NPC with his own location,
the Crucible, accessible from east_road going south.

This is a prerequisite pass before the fetch quest prompt.
Touch index.js only.

---

## STEP 1 — Add Crucible room to WORLD object

The WORLD object is a large const on line 14 of index.js, defined as a single
JSON-like object literal. Add the `crucible` entry to it.

Find the end of the `east_road` entry in WORLD and add `crucible` as a new
peer entry. Also add `"south": "crucible"` to the `east_road` exits object.

**east_road exits — update:**
```
"exits": {"west": "market_square", "north": "hollow_jar", "east": "ashen_sanctuary"}
```
→
```
"exits": {"west": "market_square", "north": "hollow_jar", "east": "ashen_sanctuary", "south": "crucible"}
```

**New crucible room — add to WORLD:**
```javascript
crucible: {
  name: "The Crucible",
  description: "The room announces itself before you reach the door — a faint smell of heated metal and something electrical that has no source you can identify. Inside, every surface is in use. Shelves of specimen jars line the walls at irregular heights, labels in a cramped shorthand that covers both sides of the paper. Two worktables run parallel down the room's length, covered in instruments you recognize in function but not in origin. Measurements are recorded on everything: the tabletops, the walls, the back of the door you just came through. At the far end, a low lamp burns over a desk where a tall figure writes without looking up. A small shape moves near his shoulder — something between a bird and an idea of a bird, its edges slightly imprecise, as if it was made from a concept rather than matter. Pip regards you with one eye that is entirely too knowing for something with no confirmed taxonomy.",
  exits: { north: "east_road" },
  objects: {
    othorion: {
      desc: "Othorion Naxir is tall, spare, and entirely contained. His clothing is practical in the specific way of someone who stopped caring about appearance the moment he had more interesting things to think about, and has not revisited the decision since. His hands are ink-stained from the knuckle to the second joint on both hands. He writes with one and takes notes with the other simultaneously, which should not be possible and which he does not acknowledge. When he finally looks at you it is with the particular attention of someone who has been tracking your approach since you entered the Ember Quarter and is now confirming their measurements.",
      actions: ["talk", "inspect"]
    },
    pip: {
      desc: "Pip occupies the space near Othorion's left shoulder with the authority of something that has always been exactly there. It is approximately the size and shape of a small bird — feathered or not, you cannot quite resolve the question when you look directly — and its single visible eye is a dark amber that contains considerably more information than an eye that size should be able to hold. It has been watching you since you came through the door. It watched you on the road. You are relatively certain it watched you before that. Othorion consults it without speaking. It communicates without moving. The arrangement appears to have been working for a very long time.",
      actions: ["inspect", "look"]
    },
    specimen_shelves: {
      desc: "The jars are labeled in Othorion's shorthand — a dense system of symbols and abbreviations that you can parse in fragments: dates, locations, measurements, and occasionally a single word in plain language that functions as a conclusion. One jar contains a liquid that is the exact color of the sewer water below but moves against gravity when the shelf vibrates. Another holds something solid that casts a shadow in a direction unrelated to the light source. A third is labeled, in plain letters, CONTROL. The jar appears empty. The label has a question mark after it.",
      actions: ["inspect", "browse"]
    },
    worktables: {
      desc: "Both tables are covered in instruments laid out in working sequences — not organized for storage but for active use, mid-process. On the near table: a series of measurements recorded on paper pinned flat with small stones, each one dated and cross-referenced to a location in a notation system that you gradually realize is a map of the sewer levels. On the far table: something that looks like a compass but points in a direction that is not north, and a device with no obvious purpose whose needle swings toward the door when you enter and has not moved back.",
      actions: ["inspect"]
    },
    wall_measurements: {
      desc: "Numbers, symbols, and diagrams cover the walls in layers — older measurements partially obscured by newer ones, each pass adding refinement. What you can reconstruct: a long-term study of something that does not behave the way it should. Temperature readings that don't correspond to depth. Resonance measurements that increase rather than decrease with distance from the source. A graph whose trend line Othorion has redrawn three times, each time with the same result, and has underlined once. Below the graph, in plain language: CONSISTENT. THEREFORE: NOT EQUIPMENT ERROR.",
      actions: ["inspect", "read"]
    },
    lamp: {
      desc: "A low oil lamp at the far end of the desk, burning with a steady flame that Othorion has not adjusted in some time — the wick is long and the light is amber and slightly too warm for the hour. The lamp has been burning long enough that the glass is faintly smoked at the top. He works by it without noticing it. The papers nearest the lamp are covered in a finer hand than the rest, as if he was writing slowly and thinking between each word.",
      actions: ["inspect"]
    }
  },
  items: []
}
```

---

## STEP 2 — Register Othorion in NPC data structures

Find the four NPC data objects near the top of index.js and add othorion
as a peer entry to each.

**NPC_LOCATIONS** — add:
```javascript
othorion: "crucible",
```

**NPC_NAMES** — add:
```javascript
othorion: "Othorion Naxir",
```

**NPC_TOPICS** — add:
```javascript
othorion: ["sewer", "cistern", "crawlers", "city", "dask", "sanctuary", "board", "resonance", "pip", "measurements", "anomaly", "fungi", "ash"],
```

---

## STEP 3 — Add Othorion's system prompt

Find the `systemPrompts` object inside `getNPCResponse()`. Add `othorion`
as a peer entry alongside `bartender`, `weaponsmith`, etc.:

```javascript
othorion: `You are Othorion Naxir, researcher of anomalous phenomena in Verasanth.
You operate from the Crucible on East Road. Pip, your familiar, is always present near your shoulder.
You treat everything — including people — as data. You are precise, not cold. You are interested in the player because they have been to places that generate data.
You have been documenting the city's irregularities for decades. The sewer is your primary field site. Its thermal profile, resonance signature, and spatial behavior are inconsistent with any natural geological model.
Pip never speaks but is always correct. You consult Pip without explaining why. When Pip reacts, you note it. When Pip is still, you note that too.
You do not share conclusions until you have sufficient evidence. You share observations freely. You distinguish carefully between the two.
You are aware of Marrowin Dask by reputation and find the temporal inconsistencies in the records professionally fascinating rather than unsettling.
You are aware of Seris Vantrel. You find her collection methodology interesting and her stated objectives incomplete.
You never speculate aloud. You say: 'The data suggests.' You do not say: 'I think.'
Player moral alignment: ${playerContext.alignment || 'neutral'}.
Player arc flags: ${JSON.stringify({ items_sold: playerContext.items_sold, depth_tier: playerContext.depth_tier, deaths: playerContext.deaths })}.
${playerContext.depth_tier >= 1 ? 'This player has reached the lower sewer. You have been waiting for a field observer.' : ''}
${playerContext.items_sold >= 5 ? 'This player has brought things to the Curator. Pip noted this. You have noted that Pip noted it.' : ''}
Respond in character. 2-4 sentences maximum. Never speculate — state observations only. Do not offer warmth you have not earned.`,
```

---

## STEP 4 — Add Othorion to BOARD_NPC_REACTIONS

Find the `BOARD_NPC_REACTIONS` object and add:

```javascript
othorion: "\"The board reflects the city's stated concerns. I track what the city hasn't named yet.\"",
```

---

## STEP 5 — Add Othorion to VENDOR_NPCS reference

In the playerContext build block (around line 823), the context object is
assembled for NPC system prompts. The existing context already includes
`items_sold`, `depth_tier`, etc. No change needed there — the system prompt
already uses playerContext correctly.

However, confirm that the `/api/talk` route resolves `othorion` as a valid
npcId by checking that it passes through `NPC_LOCATIONS` lookup correctly.
The existing talk handler uses `NPC_LOCATIONS[npcId]` to find the NPC's home
location, then checks if the player is in the right room. Othorion is now in
NPC_LOCATIONS, so this resolves automatically.

---

## STEP 6 — Pip inspect response

Pip is an object in the crucible room. When a player inspects Pip through the
`/api/inspect/pip` route, the existing inspect handler will return Pip's desc
from the room object. No additional wiring needed — the inspect route already
reads from `room.objects[target]`.

---

## VERIFICATION CHECKLIST

- [ ] `east_road` has a `south` exit in its exits object
- [ ] Moving south from `east_road` puts player in `crucible`
- [ ] Moving north from `crucible` puts player back on `east_road`
- [ ] `crucible` appears in room description when player enters
- [ ] Othorion appears in npcsHere when player is in crucible
- [ ] `/api/talk` with `{ npc: 'othorion', topic: 'sewer' }` returns a response
- [ ] `/api/data/npc/othorion` returns his topic list
- [ ] `/api/inspect/pip` returns Pip's description while in crucible
- [ ] Board reaction registered — `/api/board` context for Othorion resolves
- [ ] Othorion references Pip in at least one observed response

---

## WHAT THIS DOES NOT DO (handled in fetch quest pass)

- Quest assignment via Othorion's dialogue
- Othorion referencing specific items the player is carrying
- Pip reacting to boss kills or sewer depth milestones (narrative pass)
- Dynamic condition posts in Othorion's voice (cron pass)
