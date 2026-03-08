# Verasanth Instinct Gear Affinity System Blueprint
**Version:** 0.1  
**Audience:** Cursor Planner / Cursor Coder  
**Scope:** Instinct-gear affinity, weapon specialization (two-handed, dual wield), tag-based stat scaling, and focus offhand support. Does not redesign combat formulas, instinct abilities, or the corruption system.  
**Purpose:** Make instinct identity felt through gear. The right equipment in the right hands should feel natural. The wrong equipment should feel like a cost, not a wall.

---

## Core Design Principle

**Never lock. Always cost.**

No instinct is forbidden from using any gear category. Every affinity decision is expressed as a bonus for the right fit or a penalty for the wrong one — never a hard block. Players self-correct. The system guides without forcing.

---

## 0. Rules for Cursor

1. Do not redesign the equipment schema. Extend it with `tags` and affinity data.
2. Do not redesign combat formulas. Add affinity scaling as a post-aggregation layer.
3. Do not touch instinct abilities, alignment, quests, or NPC systems.
4. Do not break existing equip/unequip logic. Extend it.
5. Keep all affinity math as flat bonuses, not percentages. Flat values are predictable and do not inflate with gear tier.
6. Two-handed and dual wield are weapon specializations, not new slots.
7. Implement in order. Do not skip steps.

---

## 1. Gear Tier Model

### Three tiers of instinct relationship

| Tier | Name | Description | Target % of catalog |
|------|------|-------------|-------------------|
| 1 | Universal | Anyone equips it. No affinity modifiers. | ~70% |
| 2 | Affinity | Tag-based bonuses and penalties per instinct. | ~25% |
| 3 | Instinct-Bound | Requires specific instinct to equip. Rare. | ~5% |

### Tier 3 rules
Instinct-Bound gear is milestone gear only. It should not drop from random loot tables. It should come from:
- Boss kills
- Quest completions
- Late-arc vendor unlocks

Do not add Tier 3 items in this phase. Build the infrastructure to support them.

---

## 2. Tag System

### Tags already exist on equipment items
The equipment schema already has a `tags` array on every item. This phase gives those tags mechanical meaning.

### Canonical tag list

#### Weapon style tags
- `heavy` — maces, axes, great weapons
- `light_blade` — daggers, short blades
- `arcane` — wands, staves, focuses
- `two_handed` — great weapons that lock the offhand
- `dual_wield` — computed flag, not a static tag (see Section 4)
- `thrown` — future: throwing weapons
- `piercing` — future: spears, stilettos

#### Armor tags
- `heavy_armor` — plate, chain, riveted coats
- `light_armor` — leathers, cloth, patchwork
- `stealth` — cloaks, shadow gear, soft shoes
- `arcane_focus` — focuses, spell-attuned offhands

#### Utility tags
- `shadow` — darkness/occult flavor gear
- `corruption` — corrupted items (affinity applies on top of corruption effects)
- `holy` — future: sanctuary-adjacent gear
- `perception` — lanterns, sight-enhancing items

### Tagging rules
- Every item should have 1–3 tags maximum
- Tags describe what the item IS, not what instinct it belongs to
- Universal items carry no affinity-relevant tags, or only one neutral tag
- Affinity-relevant items carry tags that instinct affinities reference

---

## 3. Instinct Affinity Data

### INSTINCT_AFFINITIES constant

Implement in `data/equipment.js` as a named export.

Each instinct entry has:
- `tag_bonuses` — flat stat bonuses when equipped item has matching tag
- `tag_penalties` — flat stat penalties when equipped item has matching tag
- `preferred_slots` — cosmetic/UI hint only, no mechanical effect
- `avoid_slots` — cosmetic/UI hint only, no mechanical effect

```js
export const INSTINCT_AFFINITIES = {

  ironblood: {
    tag_bonuses: {
      heavy:       { defense: 2, max_hp: 4 },
      heavy_armor: { defense: 3, block_value: 1 },
      two_handed:  { melee_power: 3 },
    },
    tag_penalties: {
      stealth:     { dodge: -2, initiative: -1 },
      light_blade: { melee_power: -1 },
      arcane:      { spell_power: -2 },
    },
    preferred_slots: ["weapon_main", "chest", "weapon_offhand"],
    avoid_slots: ["cloak", "charm"],
  },

  streetcraft: {
    tag_bonuses: {
      light_blade: { crit_chance: 2, initiative: 1 },
      stealth:     { dodge: 2, initiative: 1 },
      light_armor: { dodge: 1 },
      perception:  { perception: 2 },
    },
    tag_penalties: {
      heavy_armor: { dodge: -3, initiative: -2 },
      heavy:       { dodge: -1, initiative: -1 },
      two_handed:  { accuracy: -2 },
    },
    preferred_slots: ["weapon_main", "weapon_offhand", "cloak", "charm", "feet"],
    avoid_slots: ["weapon_offhand"],  // shield specifically — see offhand note
  },

  shadowbound: {
    tag_bonuses: {
      light_blade: { crit_chance: 3, crit_damage: 2 },
      shadow:      { crit_chance: 2, resist_shadow: 2 },
      stealth:     { dodge: 2 },
      corruption:  { crit_chance: 1, melee_power: 1 },
    },
    tag_penalties: {
      heavy_armor: { dodge: -4, initiative: -3 },
      heavy:       { dodge: -2 },
      arcane:      { accuracy: -1 },
    },
    preferred_slots: ["weapon_main", "weapon_offhand", "cloak", "relic"],
    avoid_slots: ["chest", "weapon_offhand"],
  },

  ember_touched: {
    tag_bonuses: {
      arcane:       { spell_power: 4, crit_chance: 1 },
      arcane_focus: { spell_power: 3, healing_power: 1 },
      shadow:       { spell_power: 1, resist_shadow: 1 },
      perception:   { perception: 1 },
    },
    tag_penalties: {
      heavy_armor:  { spell_power: -3 },
      heavy:        { spell_power: -2 },
      two_handed:   { spell_power: -3 },
    },
    preferred_slots: ["weapon_main", "weapon_offhand", "ring_1", "ring_2", "relic"],
    avoid_slots: ["chest"],
  },

  hearthbound: {
    tag_bonuses: {
      arcane_focus: { healing_power: 4, max_hp: 2 },
      heavy:        { max_hp: 2, defense: 1 },
      stealth:      { healing_power: 1 },
    },
    tag_penalties: {
      shadow:       { healing_power: -2 },
      corruption:   { healing_power: -3 },
      two_handed:   { healing_power: -2 },
    },
    preferred_slots: ["weapon_offhand", "charm", "relic"],
    avoid_slots: ["weapon_main"],
  },

  warden: {
    tag_bonuses: {
      heavy_armor:  { defense: 2, resist_poison: 1, resist_shadow: 1 },
      heavy:        { defense: 1, block_value: 1 },
      arcane_focus: { resist_shadow: 2, resist_fire: 1 },
      perception:   { perception: 2 },
    },
    tag_penalties: {
      light_blade:  { defense: -1 },
      stealth:      { defense: -1 },
      corruption:   { resist_shadow: -3, resist_poison: -2 },
    },
    preferred_slots: ["weapon_offhand", "chest", "relic"],
    avoid_slots: [],
  },

};
```

### Flat bonus rationale
Bonuses are flat, not percentage. A `+2 dodge` from a stealth tag is `+2` whether the base item has `dodge +1` or `dodge +10`. This keeps the instinct gap predictable across all gear tiers and prevents endgame affinity scaling from dominating.

---

## 4. Weapon Specializations

### 4.1 Two-Handed Weapons

#### Tag
Items with sub_type `great_axe`, `greatsword`, `maul`, or `war_spear` carry the `two_handed` tag.

#### Mechanic
When a `two_handed` item is equipped to `weapon_main`, the `weapon_offhand` slot is automatically locked — it cannot be equipped while a two-hander is in the main hand. If something is already in the offhand, it is returned to inventory on equip.

#### Stat profile
Two-handed weapons have higher base `melee_power` than one-handers of the same tier. They cannot use `block_value` from offhand. This is the tradeoff — more damage, no block.

#### Affinity
- Ironblood: `two_handed` tag bonus → `melee_power +3`
- Ember Touched, Hearthbound, Streetcraft: `two_handed` tag penalty (see INSTINCT_AFFINITIES)

#### Implementation
In `equipItem()` in `services/equipment.js`:
```js
if (item.tags?.includes("two_handed") && slot === "weapon_main") {
  // Unequip offhand if occupied
  await unequipItem(characterId, "weapon_offhand", env);
  // Set a flag so the offhand slot renders as locked in UI
  await setCharacterFlag(characterId, "offhand_locked", true, env);
}
// When unequipping a two_handed weapon_main:
if (currentItem?.tags?.includes("two_handed") && slot === "weapon_main") {
  await setCharacterFlag(characterId, "offhand_locked", false, env);
}
```

### 4.2 Dual Wield

#### What it is
Dual wield is not a tag on items. It is a computed state detected by `aggregateEquipmentStats()` when both conditions are met:
1. `weapon_main` slot contains a `light_blade` sub_type item
2. `weapon_offhand` slot contains a `light_blade` sub_type item

#### When active
When dual wield is detected:
- The offhand weapon's `melee_power` modifier is added at half value (rounded down) as a bonus attack contribution
- A `dual_wield: true` flag is added to the aggregated stats object
- Combat reads `dual_wield: true` and appends a reduced offhand strike to the attack message

#### Affinity
- Streetcraft: `light_blade` tag bonus already covers this — `crit_chance +2, initiative +1` per weapon
- Shadowbound: same — `crit_chance +3, crit_damage +2` per weapon
- Both daggers trigger their respective instinct bonuses independently

#### Implementation in `services/equipment_stats.js`

```js
// In aggregateEquipmentStats(), after merging all slots:
const mainWeapon    = equippedItems["weapon_main"];
const offhandWeapon = equippedItems["weapon_offhand"];

const isDualWield = mainWeapon?.sub_type === "light_blade" &&
                    offhandWeapon?.sub_type === "light_blade";

if (isDualWield) {
  aggregated.dual_wield = true;
  // Add half offhand melee_power as bonus
  const offhandPower = offhandWeapon.stat_modifiers?.melee_power || 0;
  aggregated.melee_power += Math.floor(offhandPower / 2);
}
```

### 4.3 Focus Offhand (Hearthbound / Ember Touched)

#### What it is
When `weapon_offhand` contains an item with sub_type `focus`, the offhand contributes `healing_power` and `spell_power` bonuses instead of `block_value`. This makes the offhand slot a meaningful decision for caster and support instincts.

#### Implementation in `services/equipment_stats.js`

```js
const offhand = equippedItems["weapon_offhand"];
if (offhand?.sub_type === "focus") {
  // Focus contributes spell/healing, not block
  aggregated.spell_power   += offhand.stat_modifiers?.spell_power   || 0;
  aggregated.healing_power += offhand.stat_modifiers?.healing_power || 0;
  // block_value from focus is ignored
}
```

This already works implicitly through the schema if focus items have `spell_power` and `healing_power` in their `stat_modifiers` and zero `block_value`. Make sure the sewer catalog reflects this.

---

## 5. Affinity Stat Application

### Where it happens
Affinity bonuses and penalties are applied in `services/equipment_stats.js` inside or immediately after `aggregateEquipmentStats()`.

### New function: applyInstinctAffinities()

```js
export function applyInstinctAffinities(aggregatedStats, equippedItems, instinct) {
  const affinities = INSTINCT_AFFINITIES[instinct];
  if (!affinities) return aggregatedStats;

  const result = { ...aggregatedStats };

  for (const item of Object.values(equippedItems)) {
    if (!item?.tags) continue;
    for (const tag of item.tags) {
      // Apply bonuses
      if (affinities.tag_bonuses?.[tag]) {
        for (const [stat, value] of Object.entries(affinities.tag_bonuses[tag])) {
          result[stat] = (result[stat] || 0) + value;
        }
      }
      // Apply penalties
      if (affinities.tag_penalties?.[tag]) {
        for (const [stat, value] of Object.entries(affinities.tag_penalties[tag])) {
          result[stat] = (result[stat] || 0) + value; // value is already negative
        }
      }
    }
  }

  return result;
}
```

### Call order in combat (index.js)

```js
const equippedItemMap = await getEquippedItemMap(characterId, env);
const baseEquipStats  = await aggregateEquipmentStats(characterId, env);
const effectiveStats  = applyInstinctAffinities(
  baseEquipStats,
  equippedItemMap,
  character.instinct
);
// Then apply active_buffs on top of effectiveStats
```

---

## 6. Instinct-Bound Gear Infrastructure

Do not implement Instinct-Bound items in this phase. Build the check only.

### canEquipItem() addition

In `services/equipment.js`, add one check:

```js
// Instinct-Bound check
if (item.instinct_required && item.instinct_required !== character.instinct) {
  return {
    allowed: false,
    reason: `This item can only be wielded by the ${item.instinct_required}.`
  };
}
```

Add `instinct_required: null` to the equipment schema default. All current items are null — the field exists for future Tier 3 items.

---

## 7. UI — Affinity Hints

The UI should communicate affinity to the player without dumping numbers on them.

### Inventory item display additions

When rendering an equippable item, if the player's instinct has an affinity relationship with any of the item's tags, show a subtle hint:

- Green tint or ✦ symbol → instinct has a bonus tag match
- Amber tint or ↓ symbol → instinct has a penalty tag match
- No marker → neutral / universal

Show the specific stat deltas in the tooltip:
```
Ash-Thread Cloak
Dodge +3
[Streetcraft] +2 Dodge, +1 Initiative
```

Do not show other instincts' affinities. Only the current player's instinct.

### Two-handed offhand lock display

When `offhand_locked` flag is true, render the offhand slot in the character panel as:
```
Weapon Offhand:  [Two-Handed]
```
In muted/dim styling. No equip button. Tooltip: "Locked — two-handed weapon equipped."

### Dual wield indicator

When dual wield is active, show a subtle indicator in the character panel weapon section:
```
Weapon Main:    Hooked Knife     ⚔ Dual Wield
Weapon Offhand: Pipe Shiv
```

---

## 8. Sewer Catalog Tag Audit

Review all items in `data/equipment.js` and ensure every item has correct tags.

### Required tag assignments by sub_type

| Sub_type | Required tags |
|----------|--------------|
| dagger, shiv, knife | `light_blade` |
| sword, blade | *(none required, universal)* |
| axe, mace | `heavy` |
| great_axe, greatsword, maul, war_spear | `heavy`, `two_handed` |
| wand, staff | `arcane` |
| focus | `arcane`, `arcane_focus` |
| shield, buckler | `heavy` |
| plate_armor, chain_armor | `heavy_armor` |
| leather_armor, cloth_armor, patchwork | `light_armor` |
| cloak, shroud, shadow mantle | `stealth` |
| lantern | `perception` |
| corrupted items | `corruption` (in addition to existing tags) |

---

## 9. Implementation Order

1. Add `INSTINCT_AFFINITIES` constant to `data/equipment.js`
2. Add `instinct_required: null` field to equipment schema default
3. Add `instinct_required` check to `canEquipItem()` in `services/equipment.js`
4. Add `two_handed` offhand-lock logic to `equipItem()` and `unequipItem()`
5. Add `isDualWield` detection and half-offhand bonus to `aggregateEquipmentStats()`
6. Add `applyInstinctAffinities()` to `services/equipment_stats.js`
7. Wire `applyInstinctAffinities()` into combat stat resolution in `index.js`
8. Audit and update tags on all sewer catalog items in `data/equipment.js`
9. Update inventory UI in `index.html` to show affinity hints and dual wield indicator
10. Update character panel to show offhand locked state for two-handed weapons

---

## 10. Test Cases

### Affinity bonuses
- Streetcraft equips stealth cloak → dodge increases by affinity amount
- Ironblood equips stealth cloak → dodge decreases by penalty amount
- Ember Touched equips arcane staff → spell_power increases by affinity amount
- Warden equips corrupted item → resist_shadow decreases by penalty amount

### Two-handed
- Equip great_axe to weapon_main → offhand slot locks
- Attempt to equip shield while great_axe equipped → blocked with message
- Unequip great_axe → offhand slot unlocks
- Ironblood equips two-hander → melee_power +3 from affinity

### Dual wield
- Equip dagger to weapon_main and dagger to weapon_offhand → dual_wield flag active
- Offhand melee_power contributes at half value
- Streetcraft dual daggers → both daggers trigger light_blade bonus independently
- Equip a shield in offhand → dual_wield flag inactive

### Focus offhand
- Hearthbound equips focus in offhand → healing_power increases
- Ember Touched equips focus in offhand → spell_power increases
- Ironblood equips focus in offhand → no healing/spell bonus (stats come from item, affinity doesn't boost arcane_focus for Ironblood)

### Instinct-Bound infrastructure
- Item with instinct_required: "ironblood" → Streetcraft cannot equip, correct error message
- Same item → Ironblood can equip normally
- Item with instinct_required: null → any instinct can equip

### UI hints
- Affinity bonus item shows ✦ for matching instinct
- Affinity penalty item shows ↓ for matching instinct
- Universal item shows no marker

---

## 11. Hard Do-Not-Do List

1. Do not hard-block any instinct from any gear category except Instinct-Bound items.
2. Do not use percentage multipliers for affinity — flat values only.
3. Do not add Instinct-Bound items in this phase — infrastructure only.
4. Do not redesign combat damage formulas.
5. Do not redesign instinct abilities.
6. Do not add encumbrance in this phase — that is a future system.
7. Do not add throwing weapons in this phase — tag exists for future use.
8. Do not change the equipment slot model.

---

## 12. Phase Exit Conditions

This phase is complete when:

1. INSTINCT_AFFINITIES data exists and covers all six instincts.
2. Equipped item tags trigger flat stat bonuses and penalties per instinct.
3. Two-handed weapons lock the offhand slot on equip.
4. Dual wield is detected and contributes a half-offhand melee bonus.
5. Focus offhand correctly routes to spell_power / healing_power.
6. Instinct-Bound infrastructure exists in canEquipItem() (no items yet).
7. Sewer catalog items have correct tags.
8. Inventory UI shows affinity hints for the player's instinct.
9. No existing combat, quest, vendor, or alignment logic is broken.

---

## One-Sentence Summary

**Make instinct identity felt through gear by adding tag-based affinity bonuses and penalties, weapon specializations for two-handers and dual wield, and the infrastructure for future Instinct-Bound items — without locking any instinct out of any gear category.**
