# Cursor Prompt — Instinct Gear Affinity System
# Reference: verasanth_instinct_gear_affinity_blueprint.md
# Touch: data/equipment.js, services/equipment.js, services/equipment_stats.js,
#        index.js, index.html

---

## ARCHITECTURE NOTE

Modular structure. Keep all existing files. No new files needed —
all additions go into the existing service and data files.

---

## CORE RULE

Never hard-block an instinct from any gear. Affinities are bonuses
and penalties only. The one exception is Instinct-Bound items
(instinct_required field) — that check is built but no items use it yet.

All affinity values are FLAT, not percentage.

---

## STEP 1 — INSTINCT_AFFINITIES constant (data/equipment.js)

Add this export to data/equipment.js:

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
    avoid_slots: [],
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
    avoid_slots: [],
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
    avoid_slots: [],
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
    avoid_slots: [],
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

---

## STEP 2 — Add instinct_required to equipment schema (data/equipment.js)

Add `instinct_required: null` as a default field to the equipment schema.
All current items get `instinct_required: null`.

This field is the infrastructure for future Instinct-Bound (Tier 3) gear.
No items use it yet — just the field and the check in canEquipItem.

---

## STEP 3 — Tag audit on sewer catalog (data/equipment.js)

Review every item in SEWER_EQUIPMENT / EQUIPMENT_DATA and ensure tags
are correct. Required tag assignments by sub_type:

| sub_type | Required tags |
|----------|--------------|
| dagger, shiv, knife | ["light_blade"] |
| axe, mace | ["heavy"] |
| great_axe, greatsword, maul, war_spear | ["heavy", "two_handed"] |
| wand, staff | ["arcane"] |
| focus | ["arcane", "arcane_focus"] |
| shield, buckler | ["heavy"] |
| plate_armor, chain_armor | ["heavy_armor"] |
| leather_armor, patchwork, cloth_armor | ["light_armor"] |
| cloak, shroud | ["stealth"] |
| lantern | ["perception"] |
| any corrupted item | add "corruption" to existing tags |

Swords and universal blades need no required tags — they are neutral.
Items can have additional flavor tags beyond these required ones.

---

## STEP 4 — Two-handed weapon logic (services/equipment.js)

### In equipItem()

When equipping an item with "two_handed" in its tags to weapon_main:
1. Check if weapon_offhand is occupied
2. If occupied, unequip it and return it to inventory (quantity +1)
3. Set character flag "offhand_locked" = true
4. Proceed with equipping the two-handed weapon

When unequipping a two_handed item from weapon_main:
1. Set character flag "offhand_locked" = false
2. Proceed with unequip normally

### In canEquipItem()

Add these checks:

```js
// Instinct-Bound check
if (item.instinct_required && item.instinct_required !== character.instinct) {
  return {
    allowed: false,
    reason: `This item can only be wielded by the ${item.instinct_required}.`
  };
}

// Offhand locked by two-hander check
if (slot === "weapon_offhand") {
  const offhandLocked = await getCharacterFlag(characterId, "offhand_locked", env);
  if (offhandLocked) {
    return {
      allowed: false,
      reason: "Your offhand is occupied by a two-handed weapon."
    };
  }
}
```

---

## STEP 5 — applyInstinctAffinities() (services/equipment_stats.js)

Add this new export function:

```js
export function applyInstinctAffinities(aggregatedStats, equippedItems, instinct) {
  const affinities = INSTINCT_AFFINITIES[instinct];
  if (!affinities) return aggregatedStats;

  const result = { ...aggregatedStats };

  for (const item of Object.values(equippedItems)) {
    if (!item?.tags?.length) continue;
    for (const tag of item.tags) {

      if (affinities.tag_bonuses?.[tag]) {
        for (const [stat, value] of Object.entries(affinities.tag_bonuses[tag])) {
          result[stat] = (result[stat] || 0) + value;
        }
      }

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

---

## STEP 6 — Dual wield and focus detection (services/equipment_stats.js)

Add to aggregateEquipmentStats(), after merging all slot stats:

```js
const mainWeapon    = equippedItems["weapon_main"];
const offhandWeapon = equippedItems["weapon_offhand"];

// Dual wield detection
const isDualWield = mainWeapon?.sub_type === "light_blade" &&
                    offhandWeapon?.sub_type === "light_blade";
if (isDualWield) {
  aggregated.dual_wield = true;
  const offhandPower = offhandWeapon.stat_modifiers?.melee_power || 0;
  aggregated.melee_power = (aggregated.melee_power || 0) + Math.floor(offhandPower / 2);
}

// Focus offhand — spell/healing contribution already flows through stat_modifiers
// Just flag it so combat can reference it if needed
if (offhandWeapon?.sub_type === "focus") {
  aggregated.has_focus_offhand = true;
}
```

---

## STEP 7 — Wire applyInstinctAffinities into combat (index.js)

Find the combat resolution block where aggregateEquipmentStats is called
(added in the item mechanics phase). Update the call sequence:

```js
const equippedItemMap = await getEquippedItemMap(characterId, env);
const baseEquipStats  = await aggregateEquipmentStats(characterId, env);

// Apply instinct affinities on top of base equipment stats
const effectiveStats  = applyInstinctAffinities(
  baseEquipStats,
  equippedItemMap,
  character.instinct
);

// Then apply active_buffs on top of effectiveStats (existing logic)
for (const buff of (combatState.active_buffs || [])) {
  effectiveStats[buff.stat] = (effectiveStats[buff.stat] || 0) + buff.value;
}
```

Also handle dual wield in the attack message:

```js
if (effectiveStats.dual_wield) {
  // Append to attack message: "Your offhand strikes for [N] additional damage."
  // The bonus is already included in effectiveStats.melee_power from Step 6
  // This is just a message enhancement
}
```

And spell weapon routing (if not already from item mechanics phase):

```js
const isSpellWeapon = equippedItemMap["weapon_main"] &&
  ["wand", "staff"].includes(equippedItemMap["weapon_main"]?.sub_type);

const attackPower = isSpellWeapon
  ? (effectiveStats.spell_power  || 0)
  : (effectiveStats.melee_power  || 0);
```

---

## STEP 8 — Inventory UI affinity hints (index.html)

When rendering each equippable item in the inventory panel, compute
whether the player's instinct has an affinity relationship with the
item's tags. The player's instinct is available on currentCharacter.instinct.

For each item:

```js
function getAffinityHint(item, instinct) {
  const affinities = INSTINCT_AFFINITIES[instinct];
  if (!affinities || !item.tags?.length) return null;

  let bonusStats = {};
  let penaltyStats = {};

  for (const tag of item.tags) {
    if (affinities.tag_bonuses?.[tag]) {
      Object.assign(bonusStats, affinities.tag_bonuses[tag]);
    }
    if (affinities.tag_penalties?.[tag]) {
      Object.assign(penaltyStats, affinities.tag_penalties[tag]);
    }
  }

  const hasBonuses  = Object.keys(bonusStats).length > 0;
  const hasPenalties = Object.keys(penaltyStats).length > 0;

  return { hasBonuses, hasPenalties, bonusStats, penaltyStats };
}
```

Render the hint in the item row:
- If hasBonuses only: show ✦ in ember color before item name
- If hasPenalties only: show ↓ in amber/muted color before item name
- If both: show ✦↓
- If neither: no marker

In the item tooltip/detail panel, show the actual stat deltas:
```
[Instinct Name]: +2 Dodge, +1 Initiative
```
Only show the current player's instinct. Do not show all instincts.

---

## STEP 9 — Character panel UI additions (index.html)

### Two-handed offhand lock

When rendering the equipment slots in the character panel, check
`offhand_locked` flag. If true, render the offhand slot as:

```
Weapon Offhand:  — Two-Handed —
```
In dim/muted styling. No equip button. Tooltip on hover: "Locked by two-handed weapon."

### Dual wield indicator

When the inventory response includes `dual_wield: true` in the
aggregated stats (expose this via /api/equipped or /api/character),
show a subtle indicator next to the weapon slots:

```
Weapon Main:    Hooked Knife
Weapon Offhand: Pipe Shiv      ⚔ Dual Wield
```

---

## STEP 10 — Verify unchanged systems

- Existing single-weapon combat still works correctly
- Existing equip/unequip routes unchanged
- Existing inventory routes return correct data
- Quest items, loot items unaffected
- Alignment system untouched
- NPC dialogue untouched
- Discovery / map system untouched
- All six instincts fall back gracefully if INSTINCT_AFFINITIES
  entry is missing (applyInstinctAffinities returns unchanged stats)

---

## DO NOT DO

- Do not hard-block any instinct from any gear (except instinct_required check)
- Do not use percentage multipliers — flat values only
- Do not add Instinct-Bound items — only the canEquipItem check
- Do not add encumbrance
- Do not add throwing weapons
- Do not redesign combat formulas
- Do not redesign instinct abilities
- Do not change the equipment slot model
- Do not create new files — use existing service and data files
