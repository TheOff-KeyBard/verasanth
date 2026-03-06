# Verasanth Item Generation System
**File:** `blueprints/systems/items.md`
**Version:** 1.0
**Last Updated:** 2026-03-06
**Status:** Active

---

## TIER CALCULATION

### Dungeon Tier by Location
```javascript
const DUNGEON_TIERS = {
  // Surface / City
  market_square: 0, tavern: 0, atelier: 0,
  mended_hide: 0, hollow_jar: 0, still_scale: 0,
  naxirs_crucible: 0, wardens_post: 0,
  // Sewer Level 1
  sewer_entrance: 1, drain_corridor: 1,
  drain_junction: 1, drain_cache: 1, rat_king_chamber: 1,
  // Sewer Level 2
  old_sewer_west: 2, old_sewer_east: 2,
  fungal_gallery: 2, channel_crossing: 2,
  custodian_chamber: 2,
  // Sewer Level 3
  cistern_upper: 3, flooded_hall: 3,
  drowned_chamber: 3, leviathan_approach: 3,
  leviathan_chamber: 3,
  // Sewer Level 4
  mechanist_entrance: 4, gear_corridor: 4,
  heat_vent_crossing: 4, regulator_approach: 4,
  regulator_chamber: 4,
  // Sewer Level 5
  cathedral_approach: 5, cathedral_nave: 5,
  artifact_antechamber: 5, sump_pit_edge: 5,
  ash_heart_chamber: 5,
};
```

### Tier Formula
```javascript
function getItemTier(playerLevel, locationId) {
  const dungeonTier = DUNGEON_TIERS[locationId] ?? 1;
  const playerTier = Math.floor(playerLevel / 5) + 1;
  return Math.min(
    Math.max(playerTier, dungeonTier),
    dungeonTier + 1
  );
}
```

### Tier Summary
| Tier | Name | Dungeon Depth | Feel |
|------|------|--------------|------|
| 1 | Rusted | Surface / Drain | Scavenged, barely functional |
| 2 | Worn | Forgotten Channels | Used, repaired, reliable |
| 3 | Forged | Cistern Depths | Intentionally made, quality |
| 4 | Tempered | Underworks | Rare craft, city-touched |
| 5 | Ashbound | Sump Cathedral | Ancient, semi-alive, dangerous |
| 6 | Corrupted | Any (special drop) | Powerful, wrong, costly |

---

## ITEM CATEGORIES

### Weapons
- **Blade** — balanced, reliable damage
- **Heavy** — slow, high damage, armor penetration
- **Fast** — quick, low damage, high crit chance
- **Ranged** — distance, low damage, special ammo
- **Staff/Focus** — INT scaling, magical damage

### Armor
- **Light** — DEX bonus, low protection, good evasion
- **Medium** — balanced, moderate protection
- **Heavy** — STR requirement, high protection, low evasion
- **Shield** — block chance, CON bonus

### Consumables
- **Healing** — restore HP
- **Poison** — damage over time (weapon coating or thrown)
- **Buff** — temporary stat increase
- **Antidote** — remove status effects
- **Elixir** — rare, powerful, made by Othorion/Thalara

### Loot / Sellables
- **Materials** — crafting components
- **Relics** — Seris quest items, high sell value
- **Reagents** — Othorion/Thalara quest items
- **Contraband** — illegal, Grommash reacts

---

## WEAPON GENERATION

### Base Stat Ranges by Tier
| Tier | DMG Range | Special Slot | Crit% | Weight |
|------|-----------|-------------|-------|--------|
| 1 | 5-12 | None | 5% | Heavy feel |
| 2 | 10-20 | 1 minor | 8% | Functional |
| 3 | 18-32 | 1 major | 10% | Balanced |
| 4 | 28-45 | 1 major + 1 minor | 12% | Light feel |
| 5 | 40-60 | 2 major | 15% | Responsive |
| 6 (Corrupted) | 35-70 | 2 major + curse | 18% | Wrong |

### Weapon Name Tables

**Tier 1 — Rusted**
Prefixes: Rusted, Bent, Cracked, Gnawed, Filth-Caked, Pitted
Suffixes: Blade, Knife, Hatchet, Spike, Club, Shard, Hook
Examples:
- Rusted Blade, Cracked Spike, Bent Hook, Pitted Knife

**Tier 2 — Worn**
Prefixes: Worn, Ash-Wrapped, Stained, Salvaged, Mended
Suffixes: Longsword, Dagger, Hatchet, Shortbow, Spear, Mace
Examples:
- Ash-Wrapped Longsword, Salvaged Spear, Mended Mace

**Tier 3 — Forged**
Prefixes: Forged, Tempered, Dark-Edged, Channel-Steel, Deep-Cut
Suffixes: Blade, Sword, Cleaver, Crossbow, Glaive, Maul
Examples:
- Forged Cleaver, Dark-Edged Glaive, Channel-Steel Sword

**Tier 4 — Tempered**
Prefixes: Ember-Forged, Rune-Etched, Vein-Steel,
  City-Tempered, Ash-Core, Deep-Wrought
Suffixes: Blade, Greatsword, War-Axe, Longbow, Pike, Warhammer
Examples:
- Ember-Forged Warhammer, Rune-Etched Pike, Vein-Steel Greatsword

**Tier 5 — Ashbound**
Prefixes: Ashbound, Breath-Forged, Sump-Drawn,
  Cathedral-Touched, Rune-Alive, Heartbeat-Edged
Suffixes: Blade, Executioner, Reaper, Soulbow, Lance, Crusher
Examples:
- Ashbound Reaper, Cathedral-Touched Lance, Breath-Forged Crusher

**Tier 6 — Corrupted** (see Corrupted Items section)

### Weapon Special Properties (by tier unlock)
Tier 2+: Minor bleed (2 dmg/round, 3 rounds)
Tier 2+: Minor poison (3 dmg/round, 2 rounds)
Tier 3+: Armor piercing (ignore 3 armor)
Tier 3+: On-hit slow (target -10% speed 1 round)
Tier 4+: Life steal (5% dmg returned as HP)
Tier 4+: Stagger (15% chance enemy loses next action)
Tier 5+: Resonance (hums near Seris artifacts, +5% dmg in sewer)
Tier 5+: City-Touch (whispers when held, +8 dmg vs constructs)

---

## ARMOR GENERATION

### Base Stat Ranges by Tier
| Tier | Armor | HP Bonus | Special Slot | Evasion% |
|------|-------|----------|-------------|---------|
| 1 | 2-4 | 0 | None | 0% |
| 2 | 4-8 | +5 | 1 minor | 2% |
| 3 | 7-13 | +10 | 1 major | 4% |
| 4 | 11-18 | +15 | 1 major + 1 minor | 5% |
| 5 | 16-24 | +25 | 2 major | 7% |
| 6 (Corrupted) | 20-30 | +20 | 2 major + curse | 8% |

### Armor Name Tables

**Tier 1 — Rusted**
Prefixes: Rotted, Cracked, Scavenged, Rat-Gnawed, Filthy
Suffixes: Rags, Wrap, Scraps, Patchwork, Hide
Examples:
- Rotted Rags, Scavenged Hide, Rat-Gnawed Wrap

**Tier 2 — Worn**
Prefixes: Mended, Salvaged, Soot-Stained, Ash-Dusted
Suffixes: Leather, Jerkin, Coat, Vest, Mail, Padding
Examples:
- Mended Leather, Soot-Stained Mail, Salvaged Coat

**Tier 3 — Forged**
Prefixes: Channel-Cured, Deep-Tanned, Forge-Hardened, Sewer-Proof
Suffixes: Armor, Cuirass, Hauberk, Plate, Brigandine
Examples:
- Channel-Cured Brigandine, Forge-Hardened Cuirass

**Tier 4 — Tempered**
Prefixes: Rune-Stitched, Ember-Lined, Vein-Woven, City-Hardened
Suffixes: Armor, Plate, Carapace, Shell, Mantle
Examples:
- Rune-Stitched Carapace, Ember-Lined Plate

**Tier 5 — Ashbound**
Prefixes: Ashbound, Sump-Forged, Cathedral-Blessed,
  Breath-Woven, Heartbeat-Lined
Suffixes: Armor, Aegis, Shroud, Shell, Carapace
Examples:
- Ashbound Aegis, Cathedral-Blessed Shroud

### Armor Special Properties (by tier unlock)
Tier 2+: Sewer resistance (reduce poison duration by 1 round)
Tier 3+: Fire resistance (-5 fire dmg)
Tier 3+: On-hit thorns (2 dmg reflected to attacker)
Tier 4+: Regeneration (+2 HP/round out of combat)
Tier 4+: Dampening (reduce stagger chance by 10%)
Tier 5+: City-Sense (whispers warn of ambush, -20% surprise chance)
Tier 5+: Resonance (reduces artifact artifact proximity effects)

---

## POTION & CONSUMABLE GENERATION

### Healing Potions by Tier
| Item | HP Restored | Tier | Source |
|------|------------|------|--------|
| Murky Draught | 15 HP | 1 | Loot drop |
| Sewer Tincture | 30 HP | 2 | Thalara sells |
| Channel Salve | 50 HP | 3 | Thalara crafts |
| Deep Remedy | 75 HP | 4 | Thalara arc reward |
| Ashbound Elixir | 120 HP + clear 1 status | 5 | Othorion arc reward |

### Buff Potions by Tier
| Item | Effect | Duration | Source |
|------|--------|----------|--------|
| Ash Draught | +3 STR | 3 rounds | Loot |
| Gutter Brew | +3 DEX | 3 rounds | Loot |
| Spore Extract | +5 INT | 5 rounds | Othorion sells |
| Channel Water | +15 max HP | Combat | Loot tier 3+ |
| Ember Flask | +10 dmg, +10% fire dmg | 4 rounds | Othorion crafts |
| Listening Ash | Perception mode (see hidden) | 10 min | Othorion arc |

### Status Cures
| Item | Cures | Source |
|------|-------|--------|
| Rat Moss Poultice | Bleed | Thalara sells |
| Bitter Fungal Cap | Poison | Thalara sells |
| Channel Salt | Disease | Thalara crafts |
| Deep Antidote | All status effects | Thalara tier 3+ |

### Othorion's Illegal Concoctions
Available only at trust tier 3+. Grommash reacts if found.

| Item | Effect | Side Effect | Crime Heat |
|------|--------|------------|-----------|
| Void Tincture | Invisible for 3 rounds | -5 max HP permanent | +10 heat |
| Ash Rage | +20 STR/DMG for 5 rounds | -15 WIS for 10 rounds | +5 heat |
| Pale Sight | See invisible/hidden enemies | Hallucinations 20% chance | 0 heat |
| Deep Breath | Breathe underwater, no drown dmg | Cough blood 1 HP/round surface | 0 heat |
| Soul Debt | Survive lethal hit (1 use) | -10 max HP permanent | +20 heat |
| City's Favor | +25% all stats for 1 combat | City watches you (enemy spawns) | +30 heat |

---

## LOOT / SELLABLE ITEMS

### Common Loot (Tier 1-2, all sewer levels)
| Item | Sell Value | Notes |
|------|-----------|-------|
| Rat Pelt | 2 AM | Bulk sellable |
| Tarnished Coin | 5 AM | Common drop |
| Rusted Chain Link | 3 AM | Craft material |
| Gnawed Bone | 1 AM | Flavor item |
| Cracked Lens | 8 AM | Merchant item |
| Sewer Fungi | 15 AM | Othorion quest |
| Slime Residue | 10 AM | Thalara reagent |

### Uncommon Loot (Tier 2-3, mid sewer)
| Item | Sell Value | Notes |
|------|-----------|-------|
| Custodian Fragment | 40 AM | Seris interest |
| Spore Cluster | 25 AM | Othorion reagent |
| Old Channel Key | Quest item | Opens Level 3 |
| Fungal Bloom | 30 AM | Thalara reagent |
| Drowned Journal | 50 AM | Lore, Thalara react |
| Wight Essence | 35 AM | Othorion reagent |

### Rare Loot (Tier 3-4, deep sewer)
| Item | Sell Value | Notes |
|------|-----------|-------|
| Leviathan Scale | 120 AM | Veyra craft quest |
| Cistern Map Fragment | 60 AM | Navigation item |
| Resonant Scrap | 200 AM | Seris quest item |
| Regulator Core | Quest item | Othorion arc |
| Runic Tablet | Quest item | Major lore |
| Deep Vent Ash | 80 AM | Othorion reagent |
| Flood Record Page | 45 AM | Thalara arc seed |

### Unique / Quest Loot (Tier 5, Cathedral only)
| Item | Sell Value | Notes |
|------|-----------|-------|
| Ashbound Resonance | Cannot sell | Seris Arc 1 artifact |
| Custodian Memory | 500 AM | OR Othorion arc item |
| Cathedral Rune Shard | 300 AM | Seris interest |
| Heartbeat Stone | Cannot sell | World item, permanent |

### Contraband (Illegal — Grommash reacts)
| Item | Sell Value | Crime Heat |
|------|-----------|-----------|
| Void Residue | 150 AM | +15 |
| Sewer Blade (unregistered) | 80 AM | +10 |
| Bound Wight Essence | 200 AM | +20 |
| Stolen Merchant Seal | 100 AM | +25 |

---

## CORRUPTED ITEMS

### What Corrupted Items Are
Corrupted items are powerful but wrong.
They carry the city's influence — enhanced beyond their tier,
but with a cost built into what they are.
The corruption is not random. It is thematic.
An item that absorbed too much sewer resonance.
A blade that was used for something it shouldn't have been.
Armor worn by someone who went down and never came back.

### Corrupted Item Rules
- Drop rate: 3-5% from any Tier 3+ enemy
- Always one tier above their base (Tier 3 drop = Tier 4 stats)
- Always carry one curse alongside their bonus
- Identified as corrupted by a faint visual tell in description:
  *"The item hums faintly. Not pleasantly."*
  *"The metal is cold regardless of temperature."*
  *"Something looks back when you hold it."*
- Othorion can identify the curse at trust tier 2+
- Thalara can sometimes remove minor curses (Arc 2+)
- Grommash notices corrupted items on high-cruelty players:
  "What you carry smells wrong. The city made that."

### Curse Categories

**Minor Curses** (manageable)
- Hunger: +10% stamina drain in combat
- Echo: Whispers 10% chance each round (WIS check or -1 action)
- Chill: -2 CON while equipped
- Weight: -5% movement (evasion penalty)

**Major Curses** (significant tradeoff)
- Bleed Cost: Using the item's special property costs 5 HP
- City Marked: Crime heat +5 per combat encounter
- Drain: -3 max HP per dungeon level descended while equipped
- Attractor: Enemies have 15% higher aggro toward wearer
- Binding: Cannot unequip without Othorion's help

**Rare Curses** (severe — high reward)
- Memory: Random flashback vision during combat (stun 1 round, 15%)
- Hunger of the Deep: Must use item every combat or lose 10 max HP
- The City Watches: Special enemy spawns after 5 combats with item
- Reciprocal: 10% of damage dealt also applied to wearer
- Void Price: On killing blow, lose 1 stat point permanently

### Corrupted Item Name Examples
Corrupted items have tells in their names:

- *Sundered Blade of Hollow Promise*
- *The Warden's Forgotten Edge*
- *Ash-Drunk Cuirass*
- *What Remains of the Keeper's Mail*
- *Thirsting Hook*
- *The Leviathan's Last Scale*
- *Breath-Taken Shield*
- *Ruin-Touched Longbow*

### Corrupted Item Generation Table
```javascript
const CORRUPTED_PREFIXES = [
  "Sundered", "Hollow", "Ash-Drunk", "Thirsting",
  "Breath-Taken", "Ruin-Touched", "Void-Kissed",
  "City-Claimed", "Sump-Born", "Forgotten"
];

const CORRUPTED_SUFFIXES = [
  "of Hollow Promise", "of the Forgotten",
  "of What Remains", "of the Deep",
  "of False Hope", "of the City's Design",
  "of Unfinished Business", "of the Last Descent"
];
```

### NPC Reactions to Corrupted Items
**Seris:** *She looks at it with something close to interest.*
"The city made that. Or unmade something to create it."
"I'll buy it. More than it's worth, probably."

**Othorion:** *He examines it without touching.*
"Corrupted. Tier [X] base, enhanced by resonance absorption."
"The curse is [minor/major/rare]. I can identify the specifics
for a price. Removing it — that depends on which curse."

**Thalara:** "I don't like the feel of that."
*She looks at it carefully.*
"The minor ones I can try to help with. The major ones —
bring it to Othorion. He understands the mechanism better."

**Veyra:** *She looks at it once.*
"I won't work with that." Back to work.
No explanation. Final.

**Grommash:** *(if player cruelty score is high)*
*He looks at it for a long moment.*
"The city gives those to people it has marked."
"I'm watching what you do with it."

---

## BACKEND IMPLEMENTATION

### Item Generation Function
```javascript
function generateItem(playerLevel, locationId, enemyTier) {
  const tier = getItemTier(playerLevel, locationId);
  const category = rollCategory();          // weapon/armor/loot/etc
  const isCorrupted = tier >= 3 && Math.random() < 0.04;

  if (isCorrupted) return generateCorruptedItem(tier, category);

  return {
    id: generateId(),
    name: generateName(tier, category),
    tier: tier,
    category: category,
    stats: rollStats(tier, category),
    special: rollSpecial(tier, category),
    description: generateDescription(tier, category),
    value: calculateValue(tier, isCorrupted),
    corrupted: false
  };
}

function generateCorruptedItem(baseTier, category) {
  const tier = baseTier + 1; // Corrupted items are one tier above base
  const curse = rollCurse(tier);
  return {
    id: generateId(),
    name: generateCorruptedName(tier, category),
    tier: tier,
    category: category,
    stats: rollStats(tier, category),
    special: rollSpecial(tier, category),
    curse: curse,
    description: generateCorruptedDescription(tier, category, curse),
    value: calculateValue(tier, true),
    corrupted: true,
    curseIdentified: false  // requires Othorion or inspection
  };
}
```

### Value Calculation
```javascript
function calculateValue(tier, corrupted) {
  const BASE_VALUES = [0, 10, 25, 60, 130, 280, 400];
  const base = BASE_VALUES[tier] ?? 400;
  const corruptedMultiplier = corrupted ? 1.8 : 1;
  const variance = 0.8 + Math.random() * 0.4; // ±20%
  return Math.floor(base * corruptedMultiplier * variance);
}
```

### D1 Schema Addition
```sql
ALTER TABLE inventory ADD COLUMN tier INTEGER DEFAULT 1;
ALTER TABLE inventory ADD COLUMN corrupted INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN curse TEXT;
ALTER TABLE inventory ADD COLUMN curse_identified INTEGER DEFAULT 0;
ALTER TABLE inventory ADD COLUMN special_property TEXT;
```

---

## SERIS ITEM RECOGNITION SYSTEM

Seris reacts to specific item categories when players sell to her.
This is how her arc advances through natural play.

```javascript
const SERIS_INTEREST_ITEMS = {
  // Mild interest — first tier
  custodian_fragment: { dialogue: 'mild', arcAdvance: false },
  resonant_scrap: { dialogue: 'strong', arcAdvance: true },
  drowned_relic: { dialogue: 'strong', arcAdvance: true },
  // Arc activating
  ashbound_resonance: { dialogue: 'break', arcAdvance: true, arcStage: 1 },
  // Post-arc
  cathedral_rune_shard: { dialogue: 'invested', arcAdvance: false },
};
```

When a player sells a recognized item, `/api/sell` triggers
a special Seris response if `npc === 'curator'`.

---
*Item System version 1.0 — Verasanth*
*Part of the Verasanth Systems Bible*
