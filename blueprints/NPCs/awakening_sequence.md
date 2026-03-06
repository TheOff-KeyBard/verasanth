# The First Awakening Sequence
## Verasanth — New Player Experience Design Document

---

## THE COMPLETE SEQUENCE

### Phase 1: Cinematic (pre-game)
*[Designed in previous session — see Cursor prompt]*

Black screen. Text burns in line by line:

> "You are on the floor."
> "The stone is cold. The air smells of ash and old fire."
> "You do not know how you got here."
> "You do not know where here is."
> "You do not know your name."
> 
> *[pause]*
> 
> "Wait."
> 
> *[pause]*
> 
> "You know one thing."
> 
> *[name burns in — large, Cinzel, ember glow]*
> 
> "Hold onto it. This city takes everything else."
> 
> — open your eyes —
> [ WAKE UP ]

---

### Phase 2: The Room (first look description)

*This replaces the standard tavern description for first awakening only.*
*Triggered by flag: `has_seen_awakening = 0` on first `/api/look` call.*
*After this loads, set `has_seen_awakening = 1`.*

**First Awakening Room Description — The Shadow Hearth Inn:**

```
The floor is stone. That is the first thing you know — the cold of it 
against your cheek, the weight of your body on something that does not 
give. The second thing you know is warmth, coming from somewhere to 
your left, slow and steady, the way warmth comes from something that 
has been burning for a very long time.

You are in a room. There is a hearth. There is a bar. There is a dog 
near the fire that has lifted its head and is looking at you with 
eyes that are too still for an animal that has just noticed something 
unexpected.

Behind the bar, a broad dwarf with burn-scarred braids is already 
watching you. He does not look surprised. He does not look concerned.

He looks like he has seen this before.

He looks like he has been waiting.
```

**Standard tavern description loads from this point forward.**
*The player will never see this text again.*

---

### Phase 3: Kelvaris First Words (first awakening dialogue)

*This is the FIRST AWAKENING response from Kelvaris.*
*Triggered when: `visits === 0 AND deaths === 0 AND has_seen_awakening === 1`*
*The player has just woken up on the floor. They are standing now, or trying to.*

**The exchange should feel like:**
The player clicks Kelvaris. He has been watching them get up off the floor.
He does not help. He does not explain. He gives them the next thing they need.

**Kelvaris first awakening lines — one of these, chosen by the model:**

> *He sets something on the bar. Doesn't look away.* "Floor's not a bed. Square's east. Board has what you need."

> *He watches you find your feet. His expression doesn't change.* "You know your name. Start there. Square's east when you're ready."

> *He doesn't move, doesn't speak until you're standing.* "East door. Market square. Come back if you're still here at dark."

**Rules for this specific moment:**
- He watched them wake up on the floor. He did not help them up. This is not cruelty — it is the understanding that getting up is something they need to do themselves.
- One action (italics, third person). One or two sentences of speech.
- The word "east" must appear. It is the only direction that matters right now.
- Do not mention memory. Do not mention the city. Do not say "welcome."
- The name is theirs. He does not use it. Not yet.

**System prompt addition for first awakening:**
```javascript
`FIRST AWAKENING — SPECIAL CASE:
This player just woke up on the floor of your inn. You watched it happen.
You did not help them up. You never do — they need to find their own feet.
They are standing now, or close to it. They have their name and nothing else.
One action in italics (third person, about you). One or two sentences.
The word "east" must appear. It is the first direction they need.
Do not say: welcome / remember / city / memory / name.
Do not explain anything. Give them the next step only.`
```

---

### Phase 4: The First Move (east to North Road)

*When the player first moves east from the tavern, the room description gets a one-time addition.*
*Triggered by: `visited_north_road` not yet set.*

**North Road — First Visit Addition:**
Prepend this to the standard North Road description, this visit only:

```
The door opens onto a road that does not care that you just woke up 
on a floor with nothing but a name.

The air is cold and smells of something burning far away. The road 
runs north and south from here. Ahead — further east — you can hear 
the sounds of a market. Behind you, the inn door has already closed.

You are outside now. Verasanth is not asking if you are ready.
```

*Standard North Road description appended after this.*
*Never shown again after first visit.*

---

### Phase 5: First Market Square Visit

*When the player first reaches market_square.*
*Triggered by: `has_seen_market_square` not yet set.*

**Market Square — First Visit Addition:**
Prepend this to the standard Market Square description, this visit only:

```
This is where the city begins, or where it presents itself as beginning.

The square is open and loud and permanent in the way of things that 
existed before anyone thought to ask why. At the center, an iron post 
hung with notices. Four roads leading outward. A grate in the 
cobblestones at the eastern edge that everyone near it is very 
carefully not looking at.

You are new here. The square knows it. 

Something at the center of this place has already noted your arrival.
It has not decided yet what to do with that information.
```

*Sets flag `has_seen_market_square = 1` after this.*

---

## IMPLEMENTATION NOTES FOR CURSOR

### Backend changes needed:

1. **New awakening room description** — in `/api/look`, check flag `has_seen_awakening`:
   - If `0` or unset: return awakening description instead of standard tavern description, then set flag to `1`
   - If `1`: return standard description always

2. **First visit location descriptions** — add a `FIRST_VISIT_INTROS` map in `data/world.js`:
```javascript
export const FIRST_VISIT_INTROS = {
  north_road: `The door opens onto a road that does not care that you just woke up on a floor with nothing but a name.\n\nThe air is cold and smells of something burning far away. The road runs north and south from here. Ahead — further east — you can hear the sounds of a market. Behind you, the inn door has already closed.\n\nYou are outside now. Verasanth is not asking if you are ready.\n\n`,
  
  market_square: `This is where the city begins, or where it presents itself as beginning.\n\nThe square is open and loud and permanent in the way of things that existed before anyone thought to ask why. At the center, an iron post hung with notices. Four roads leading outward. A grate in the cobblestones at the eastern edge that everyone near it is very carefully not looking at.\n\nYou are new here. The square knows it.\n\nSomething at the center of this place has already noted your arrival. It has not decided yet what to do with that information.\n\n`,
};
```

3. **First visit flag check** — in `/api/look` and `/api/move` responses, check if `visited_[location]` is unset. If so, prepend the first visit intro to the description before setting the flag.

4. **Kelvaris first awakening flag** — the `isFirstAwakening` condition in `npc_dialogue.js` already handles this. Ensure the system prompt receives `has_seen_awakening` in playerContext so the first words feel continuous with the room description.

### Frontend changes needed:

1. After `/api/character/complete` succeeds → play awakening cinematic (not entry transition)
2. Awakening cinematic passes `characterName` for the name burn-in
3. WAKE UP button calls `loadGame()` then `showScreen('game')`
4. `has_seen_awakening` flag prevents cinematic from replaying on subsequent logins

---

## TONE REFERENCE

The awakening sequence should feel like:
- Waking up in a place you don't recognize with the specific clarity that comes right before panic sets in
- The city is not hostile in this moment — it is indifferent, which is worse
- Kelvaris has seen this happen to many people. Some of them are still here. Most are not. He does not say this.
- The player's name is the only anchor. The sequence keeps returning to it. The city will eventually try to take that too.

---
*Document version 1.0 — First Awakening Sequence*
*Part of the Verasanth Game Design Bible*
