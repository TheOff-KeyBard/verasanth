# Verasanth Combat Rebalance — Enemy Stat Tables
**File:** `blueprints/systems/combat_enemies.md`
**Version:** 2.0
**Last Updated:** 2026-03-06
**Status:** Ready for Implementation

---

## FRAMEWORK SUMMARY

Enemy Level = Sewer Floor × 2
Scaling is in damage, accuracy, and mechanics — not HP bloat.
Player HP is fixed at 20 (CON 10 baseline after HP fix).

### Base Stat Targets by Floor

| Floor | Enemy Lvl | HP Range | Damage | Accuracy | Defense | Speed |
|-------|-----------|----------|--------|----------|---------|-------|
| 1 | 2 | 18–28 | 3–5 | 60–65% | 0–1 | 6–7 |
| 2 | 4 | 28–42 | 5–8 | 65–70% | 1–2 | 6–7 |
| 3 | 6 | 40–60 | 8–12 | 70–75% | 2–3 | 7–8 |
| 4 | 8 | 55–80 | 12–17 | 75–80% | 3–4 | 7–8 |
| 5 | 10 | 75–110 | 17–22 | 80–85% | 4–5 | 8–9 |

### Archetype Modifiers
| Archetype | HP | Damage | Speed | Role |
|-----------|-----|--------|-------|------|
| Swarmer | −20% | −20% | +30% | Pressure, chip damage |
| Skirmisher | base | base | base | Balanced |
| Bruiser | +40% | +20% | −20% | Threat, must be dealt with |
| Elite | ×2 HP | ×1.5 dmg | base | Mini-boss, special trait |

### Accuracy → Defense Roll Translation
Current system uses d20 roll vs enemy.defense.
New system: accuracy% = chance enemy hits player.
**Translation:** `enemy.defense` sets the player's dodge threshold.
`accuracy 65%` = player needs roll of 8+ on d20 to dodge
`accuracy 75%` = player needs roll of 6+ on d20 to dodge
`accuracy 85%` = player needs roll of 4+ on d20 to dodge

Player dodge roll = d20 + DEX modifier vs enemy attack threshold.

---

## FLOOR 1 ENEMIES — THE DRAINS
*Feel: "I can handle this." Pressure but not danger.*

### Gutter Rat (Swarmer)
The rats are always worse than they look. They move in the gaps
between your attention.

```javascript
{
  id: "gutter_rat",
  name: "Gutter Rat",
  hp: 16,
  damage: { min: 2, max: 4 },      // avg 3
  accuracy: 60,                     // hits 60% of the time
  defense: 1,                       // reduces incoming damage by 1
  speed: 9,                         // acts first in round
  break_threshold: 5,               // stagger requires 5+ damage in one hit
  archetype: "swarmer",
  trait: "bleed",                   // 1 damage/round for 2 rounds
  tier: 1,
  xp: 15,
  desc: "A rat the size of a small dog, fur singed black,
         eyes catching the torchlight like embers. It moves
         in quick bursts between shadows. It has done this before."
}
```

### Sewer Wretch (Skirmisher)
Something that used to be human. Oriented toward you now.

```javascript
{
  id: "sewer_wretch",
  name: "Sewer Wretch",
  hp: 22,
  damage: { min: 3, max: 5 },      // avg 4
  accuracy: 63,
  defense: 0,
  speed: 6,
  break_threshold: 6,
  archetype: "skirmisher",
  trait: null,
  tier: 1,
  xp: 25,
  desc: "A hunched figure that was once human, now something less.
         It moves through the filth like it belongs here — because it does."
}
```

### Ash Crawler (Swarmer)
Low to the ground, fast, clicking. It wants to get behind you.

```javascript
{
  id: "ash_crawler",
  name: "Ash Crawler",
  hp: 14,
  damage: { min: 2, max: 4 },      // avg 3
  accuracy: 65,
  defense: 1,
  speed: 8,
  break_threshold: 4,
  archetype: "swarmer",
  trait: "poison",                  // 1 damage/round, stacks to 3
  tier: 1,
  xp: 20,
  desc: "A pale many-legged thing that leaves grey dust wherever
         it walks. The clicking gets louder when it's hungry."
}
```

### Drain Lurker (Skirmisher)
It was in the water. You didn't see it until it wasn't.

```javascript
{
  id: "drain_lurker",
  name: "Drain Lurker",
  hp: 24,
  damage: { min: 3, max: 6 },      // avg 4.5
  accuracy: 62,
  defense: 1,
  speed: 6,
  break_threshold: 7,
  archetype: "skirmisher",
  trait: "lunge",                   // once per combat: high dmg, low accuracy
  tier: 1,
  xp: 30,
  desc: "Something that lives in the channel water. It moves
         differently on land — wrong joints in the wrong places —
         but it moves fast enough."
}
```

### Bloated Rat King (Elite / Floor 1 Boss)
The rats stop when it moves. That's how you know it's here.

```javascript
{
  id: "rat_king",
  name: "Bloated Rat King",
  hp: 55,                           // ×2 base bruiser HP
  damage: { min: 5, max: 9 },       // ×1.5 dmg
  accuracy: 68,
  defense: 2,
  speed: 5,
  break_threshold: 12,
  archetype: "elite",
  trait: "summon",                  // summons 1 Gutter Rat at 50% HP
  tier: 1,
  xp: 120,
  desc: "Larger than it should be. Its fur has fused with the
         ash it sleeps in. It moves with the slow certainty of
         something that has never been in danger in this tunnel."
}
```

---

## FLOOR 2 ENEMIES — THE FORGOTTEN CHANNELS
*Feel: "I need to think." Traits start mattering.*

### Fungal Shambler (Bruiser)
Slow, deliberate, and it doesn't stop when you hit it.

```javascript
{
  id: "fungal_shambler",
  name: "Fungal Shambler",
  hp: 42,
  damage: { min: 5, max: 8 },      // avg 6.5
  accuracy: 65,
  defense: 2,
  speed: 4,
  break_threshold: 10,
  archetype: "bruiser",
  trait: "spore_burst",            // on death: all players take 4 damage
  tier: 2,
  xp: 60,
  desc: "A mass of fungal growth that moves with the patience
         of something that has been growing for a very long time.
         The spores it releases smell like something you almost
         recognize."
}
```

### Mold-Touched Vermin (Swarmer)
Fast, low, and it leaves something on you when it bites.

```javascript
{
  id: "mold_vermin",
  name: "Mold-Touched Vermin",
  hp: 22,
  damage: { min: 4, max: 6 },
  accuracy: 68,
  defense: 1,
  speed: 8,
  break_threshold: 6,
  archetype: "swarmer",
  trait: "poison",                 // 1 damage/round, stacks to 4
  tier: 2,
  xp: 40,
  desc: "Rats that have lived in the fungal gallery long enough
         to be changed by it. The fur has a grey-green cast and
         the eyes are the wrong color."
}
```

### Channel Stalker (Skirmisher)
It was on the ceiling. You looked up too late or just in time.

```javascript
{
  id: "channel_stalker",
  name: "Channel Stalker",
  hp: 32,
  damage: { min: 5, max: 9 },
  accuracy: 70,
  defense: 2,
  speed: 7,
  break_threshold: 9,
  archetype: "skirmisher",
  trait: "stagger",               // 20% chance to interrupt player action
  tier: 2,
  xp: 55,
  desc: "Long-limbed, pale, and very still until it isn't.
         It drops from the ceiling with a sound like a single
         stone falling into water. Then it is already on you."
}
```

### Rustback Beetle (Bruiser)
It won't go down fast. That's the problem.

```javascript
{
  id: "rustback_beetle",
  name: "Rustback Beetle",
  hp: 44,
  damage: { min: 4, max: 7 },
  accuracy: 65,
  defense: 4,                      // armored — defense is its defining stat
  speed: 4,
  break_threshold: 12,
  archetype: "bruiser",
  trait: "guard",                  // reduces damage taken by 50% one turn
  tier: 2,
  xp: 65,
  desc: "A beetle the size of a shield, carapace darkened to
         the color of old iron. It moves slowly and it does not
         care what you do to it. It has the patience of something
         that has survived everything in this tunnel for a long time."
}
```

### Sporebound Custodian (Elite / Floor 2 Boss)
Half-machine, half-fungal. The city's maintenance, corrupted.

```javascript
{
  id: "sporebound_custodian",
  name: "Sporebound Custodian",
  hp: 90,
  damage: { min: 7, max: 12 },
  accuracy: 70,
  defense: 3,
  speed: 5,
  break_threshold: 18,
  archetype: "elite",
  trait: "armor_break",           // reduces player defense by 2 for 3 rounds
  tier: 2,
  xp: 200,
  desc: "The maintenance systems for the forgotten channels
         have been growing down here long enough to become
         something else. The mechanical parts are still there.
         So is something that wasn't there originally."
}
```

---

## FLOOR 3 ENEMIES — THE CISTERN DEPTHS
*Feel: "I need help or instincts." Traits are threats, not flavour.*

### Drowned Thrall (Skirmisher)
It came up from the water. There may be more.

```javascript
{
  id: "drowned_thrall",
  name: "Drowned Thrall",
  hp: 45,
  damage: { min: 7, max: 11 },
  accuracy: 71,
  defense: 2,
  speed: 6,
  break_threshold: 12,
  archetype: "skirmisher",
  trait: "bleed",                  // 2 damage/round for 3 rounds
  tier: 3,
  xp: 90,
  desc: "Something that drowned and kept moving. The movement
         is wrong — too regular, too patient. It does not breathe.
         It does not need to."
}
```

### Cistern Leech (Swarmer)
It attaches. That's when the real problem starts.

```javascript
{
  id: "cistern_leech",
  name: "Cistern Leech",
  hp: 30,
  damage: { min: 5, max: 8 },
  accuracy: 73,
  defense: 1,
  speed: 9,
  break_threshold: 8,
  archetype: "swarmer",
  trait: "drain",                  // heals self for 3 HP when it hits
  tier: 3,
  xp: 75,
  desc: "Long, pale, and faster in water than anything that
         size should be. It attaches to whatever it can reach
         and it does not let go without persuasion."
}
```

### Flood Serpent (Skirmisher)
Fast. Accurate. Does not give you time to think.

```javascript
{
  id: "flood_serpent",
  name: "Flood Serpent",
  hp: 40,
  damage: { min: 8, max: 13 },
  accuracy: 74,
  defense: 2,
  speed: 9,
  break_threshold: 11,
  archetype: "skirmisher",
  trait: "frenzy",                 // attacks twice at -15% accuracy
  tier: 3,
  xp: 95,
  desc: "A serpent the length of the tunnel width, moving through
         the water without disturbing the surface until it is already
         out of the water and already moving toward you."
}
```

### Slick Horror (Bruiser)
High resistance. The weapon slides off. You need to find an angle.

```javascript
{
  id: "slick_horror",
  name: "Slick Horror",
  hp: 65,
  damage: { min: 9, max: 14 },
  accuracy: 70,
  defense: 5,                      // notable defense — instincts shine here
  speed: 5,
  break_threshold: 15,
  archetype: "bruiser",
  trait: "guard",                  // damage reduction 50% every other turn
  tier: 3,
  xp: 110,
  desc: "Something from the deep water that should not have
         come to the surface. Its surface deflects rather than
         absorbs. Finding where to hit it requires attention
         you may not have."
}
```

### Cistern Leviathan (Elite / Floor 3 Boss)
It was circling. You saw the displacement in the water before you saw it.

```javascript
{
  id: "cistern_leviathan",
  name: "Cistern Leviathan",
  hp: 160,
  damage: { min: 12, max: 20 },
  accuracy: 73,
  defense: 4,
  speed: 6,
  break_threshold: 25,
  archetype: "elite",
  trait: "coil",                   // grapple: player loses one action, takes 8 damage
  tier: 3,
  xp: 400,
  phases: 3,                       // phase transitions at 66% and 33% HP
  desc: "The thing that has been circling in the dark cistern
         water. It is not the largest thing in the sewer.
         It is the largest thing you have seen. There is a difference."
}
```

---

## FLOOR 4 ENEMIES — THE UNDERWORKS
*Feel: "This is a fight." Every round has decisions.*

### Gearbound Sentinel (Skirmisher)
Runic-powered. Precise. It doesn't make mistakes.

```javascript
{
  id: "gearbound_sentinel",
  name: "Gearbound Sentinel",
  hp: 60,
  damage: { min: 11, max: 16 },
  accuracy: 76,
  defense: 3,
  speed: 7,
  break_threshold: 16,
  archetype: "skirmisher",
  trait: "stagger",                // 25% interrupt chance
  tier: 4,
  xp: 130,
  desc: "Animated by the same runic mechanism that powers
         the underworks. It moves with the exactness of something
         that does not improvise. This is both its strength
         and its only weakness."
}
```

### Heat Wraith (Swarmer)
Formed from the vents. Hard to hit. Burns when it touches you.

```javascript
{
  id: "heat_wraith",
  name: "Heat Wraith",
  hp: 42,
  damage: { min: 10, max: 14 },
  accuracy: 78,
  defense: 2,
  speed: 10,
  break_threshold: 12,
  archetype: "swarmer",
  trait: "fire_touch",             // ignite: 3 damage/round for 3 rounds
  tier: 4,
  xp: 115,
  desc: "A shape that forms in the heat vents and comes apart
         when it's done. Physical strikes pass through it partially.
         The damage it deals is thermal. You feel it after."
}
```

### Rust Golem (Bruiser)
Slow. Massive. The architecture moves when it passes.

```javascript
{
  id: "rust_golem",
  name: "Rust Golem",
  hp: 95,
  damage: { min: 14, max: 20 },
  accuracy: 72,
  defense: 5,
  speed: 3,
  break_threshold: 20,
  archetype: "bruiser",
  trait: "armor_break",            // reduces player defense by 3 for 4 rounds
  tier: 4,
  xp: 160,
  desc: "Iron and rust formed into something that walks.
         The mass of it is the danger — it moves the air when
         it swings and what it hits it hits completely.
         It is not fast. This is your only advantage."
}
```

### Broken Regulator (Elite / Floor 4 Boss)
The mechanism that controlled the water flow. It is not controlled now.

```javascript
{
  id: "broken_regulator",
  name: "Broken Regulator",
  hp: 200,
  damage: { min: 15, max: 22 },
  accuracy: 77,
  defense: 4,
  speed: 6,
  break_threshold: 30,
  archetype: "elite",
  trait: "flood_surge",            // once: room floods, all take 12 damage,
                                   // enemy gains +10% accuracy for 3 rounds
  tier: 4,
  xp: 500,
  phases: 2,
  desc: "The control node for the underworks water system,
         corrupted recently. It was not built to fight.
         It was built to control flow and pressure.
         The distinction has stopped mattering."
}
```

---

## FLOOR 5 ENEMIES — THE SUMP CATHEDRAL
*Feel: "This is a fight." Death is possible. Focus is required.*

### Ashborn Acolyte (Skirmisher)
They were chanting before you arrived. They haven't stopped.

```javascript
{
  id: "ashborn_acolyte",
  name: "Ashborn Acolyte",
  hp: 70,
  damage: { min: 15, max: 20 },
  accuracy: 80,
  defense: 3,
  speed: 7,
  break_threshold: 18,
  archetype: "skirmisher",
  trait: "sync",                   // if two present: +15% accuracy both
  tier: 5,
  xp: 160,
  desc: "They chant between the pillars in the cathedral nave.
         They were here before you arrived. They will be here
         when you leave, or they won't. The chanting continues
         either way from somewhere further in."
}
```

### Cathedral Wraith (Swarmer)
Phase-capable. It goes through the wall and comes out behind you.

```javascript
{
  id: "cathedral_wraith",
  name: "Cathedral Wraith",
  hp: 52,
  damage: { min: 14, max: 19 },
  accuracy: 82,
  defense: 2,
  speed: 10,
  break_threshold: 14,
  archetype: "swarmer",
  trait: "phase",                  // once per combat: bypasses player defense
  tier: 5,
  xp: 145,
  desc: "A figure that moves through the cathedral walls as if
         they are not there — because for it, they are not.
         It appears where it chooses. The first time you see it,
         it is already beside you."
}
```

### Sump Guardian (Bruiser)
Glowing core. The core is the weak point. It knows this.

```javascript
{
  id: "sump_guardian",
  name: "Sump Guardian",
  hp: 105,
  damage: { min: 18, max: 24 },
  accuracy: 78,
  defense: 5,
  speed: 5,
  break_threshold: 22,
  archetype: "bruiser",
  trait: "guard",                  // damage reduction 50%, every other turn
  tier: 5,
  xp: 200,
  desc: "A figure built from the cathedral stone with a core
         of dull light at its center. The light pulses with
         the same rhythm as the pit below. It guards the approach
         to the pit. It has always guarded the approach to the pit."
}
```

### Ash Heart Custodian (Elite / Floor 5 Boss)
The city's judgment. Phase 3 is pure test.

```javascript
{
  id: "ash_heart_custodian",
  name: "Ash Heart Custodian",
  hp: 280,
  damage: { min: 20, max: 28 },
  accuracy: 82,
  defense: 5,
  speed: 7,
  break_threshold: 35,
  archetype: "elite",
  trait: "judgment",               // phase 3 only: all player abilities reset,
                                   // combat becomes pure attack/dodge
  tier: 5,
  xp: 1000,
  phases: 3,
  phase_transitions: [66, 33],     // % HP thresholds
  phase_descriptions: [
    "It tests your awareness.",
    "It tests your endurance.",
    "It tests only what remains."
  ],
  desc: "The city's oldest guardian, at the deepest point
         of its oldest structure. It whispers in a language
         that predates every language you have heard. Phase 3
         is a pure mechanical test. There are no tricks.
         The city is deciding whether you are worth what comes next."
}
```

---

## COMBAT SYSTEM CHANGES FOR CURSOR

### 1. Replace die-roll damage with min/max range
Current: `rollDie(enemy.attack_die) + enemy.attack_mod`
New: `Math.floor(Math.random() * (enemy.damage.max - enemy.damage.min + 1)) + enemy.damage.min`

### 2. Replace defense threshold with accuracy check
Current: `rollDie(20) + enemy.attack_mod vs player.defense`
New:
```javascript
function enemyHits(enemy, playerDex) {
  const dexMod = statMod(playerDex);
  const dodgeRoll = rollDie(20) + dexMod;
  const hitThreshold = Math.floor((100 - enemy.accuracy) / 5);
  return dodgeRoll < hitThreshold;
}
```

### 3. Add special trait resolution
```javascript
function resolveEnemyTrait(enemy, combatState, playerStats) {
  if (!enemy.trait) return null;
  switch(enemy.trait) {
    case 'bleed':
      return { effect: 'bleed', damage: 2, duration: 2 };
    case 'poison':
      return { effect: 'poison', damage: 1, duration: 3, stacks: true };
    case 'stagger':
      if (Math.random() < 0.20) return { effect: 'stagger', duration: 1 };
      break;
    case 'lunge':
      // once per combat, high damage low accuracy
      if (!combatState.lunge_used) {
        combatState.lunge_used = true;
        const hits = Math.random() < 0.40;
        if (hits) return { effect: 'lunge_hit',
          damage: enemy.damage.max + Math.floor(enemy.damage.max * 0.5) };
      }
      break;
    case 'guard':
      if (combatState.round % 2 === 0)
        return { effect: 'guard', damage_reduction: 0.5 };
      break;
    case 'frenzy':
      return { effect: 'frenzy', attacks: 2, accuracy_penalty: -15 };
    case 'armor_break':
      return { effect: 'armor_break', defense_reduction: 2, duration: 3 };
    case 'drain':
      return { effect: 'drain', self_heal: 3 };
    case 'spore_burst':
      // on death only — handled in death resolution
      break;
    case 'sync':
      // handled in encounter setup — requires 2+ acolytes
      break;
  }
  return null;
}
```

### 4. Break threshold — stagger mechanic
```javascript
// In playerAttack resolution:
if (dmg >= enemy.break_threshold) {
  combatState.enemy_staggered = true;
  narrative += " **STAGGER** — the enemy loses its next action.";
}
```

### 5. Status effect tick — add to round resolution
```javascript
function tickStatusEffects(combatState) {
  let damage = 0;
  combatState.status_effects = combatState.status_effects
    .map(effect => {
      if (effect.type === 'bleed' || effect.type === 'poison'
          || effect.type === 'fire_touch') {
        damage += effect.damage;
        return { ...effect, duration: effect.duration - 1 };
      }
      return effect;
    })
    .filter(e => e.duration > 0);
  return damage;
}
```

### 6. Update COMBAT_DATA in index.js
Replace the entire `COMBAT_DATA.enemies` object with the new stat blocks above.
Update `tier_enemies` pools:
```javascript
tier_enemies: {
  sewer_floor_1: ["gutter_rat", "sewer_wretch", "ash_crawler", "drain_lurker"],
  sewer_floor_2: ["fungal_shambler", "mold_vermin", "channel_stalker", "rustback_beetle"],
  sewer_floor_3: ["drowned_thrall", "cistern_leech", "flood_serpent", "slick_horror"],
  sewer_floor_4: ["gearbound_sentinel", "heat_wraith", "rust_golem"],
  sewer_floor_5: ["ashborn_acolyte", "cathedral_wraith", "sump_guardian"],
  bosses: {
    sewer_floor_1: "rat_king",
    sewer_floor_2: "sporebound_custodian",
    sewer_floor_3: "cistern_leviathan",
    sewer_floor_4: "broken_regulator",
    sewer_floor_5: "ash_heart_custodian"
  }
}
```

---

## CURRENT vs NEW — COMPARISON

| Enemy | Old HP | New HP | Old Max Dmg | New Max Dmg | Change |
|-------|--------|--------|-------------|-------------|--------|
| Cinder Rat → Gutter Rat | 12 | 16 | 4 | 4 | Slightly more HP, same dmg ceiling |
| Sewer Wretch | 18 | 22 | 7 | 5 | Less damage, slight HP increase |
| Ash Crawler | 15 | 14 | 6 | 4 | Cleaner damage, added poison |
| Hollow Guard → Drain Lurker | 28 | 24 | 10 | 6 | Significant damage reduction |
| Rusted Sentinel → Floor 2 | 36 | 42 | 11 | 8 | Moved to correct floor |
| Ember Hound → Floor 3 | 30 | 40 | 11 | 13 | Correctly scary at Floor 3 |

Against a 20 HP player (CON 10):
- Floor 1 max hit: 4–6 damage (20–30% HP) — survivable
- Floor 3 max hit: 13–20 damage (65–100% HP) — dangerous
- Floor 5 max hit: 24–28 damage (120–140% HP) — lethal if undefended

Armor and abilities are the difference at Floor 4+. That's correct.

---
*Combat Rebalance v2.0 — Verasanth*
*Part of the Verasanth Systems Bible*
