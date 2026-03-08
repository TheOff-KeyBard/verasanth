# Verasanth Equipment System Blueprint
**Version:** 0.2  
**Audience:** Cursor Planner / Cursor Coder  
**Scope:** Equipment system only. Do not redesign unrelated systems in this phase.  
**Purpose:** Upgrade Verasanth from a shallow gear model into a full equipment framework that supports progression, party roles, build variety, loot scaling, and future biome expansion.

---

## ARCHITECTURE NOTE — READ FIRST

Verasanth runs as a single Cloudflare Worker (`index.js`) with no module bundler or import system. All equipment constants, schemas, service functions, and data must live inside `index.js` as named constants and functions — not in separate imported files. The file organization described in this blueprint describes logical grouping only. Implement it as clearly separated, comment-headed sections within `index.js`. The same applies to `index.html` — all JS lives in that single file with no external imports.

---

## 0. Rules for Cursor

1. Do not work on anything outside the equipment system in this phase.
2. Do not redesign combat, instincts, quests, alignment, or world content.
3. Do not remove existing working item/loot logic. Extend it.
4. Do not break current vendor, quest, or loot item IDs.
5. Do not hard-code one-off gear logic. Build shared schemas and helpers.
6. Do not assume the current 3-slot loadout is enough.
7. Preserve current sewer item and loot tables while adding equipment support alongside them.
8. Implement in small steps, with migration-safe defaults.

---

## 1. Current State — Do Not Break

### Existing Item System
The following structures already exist in `index.js`. Keep them working and extend rather than replace:

- `DUNGEON_TIERS` — tier definitions by location
- `getItemTier(playerLevel, locationId)` — item tier calculator
- `LOOT_TABLES` — enemy-specific loot tables
- `ITEM_DATA` — item definitions
- `rollLoot(enemyId)` — loot roll by enemy

### Existing Quest Reward IDs — Must Not Break
These item IDs are referenced by quest rewards and must remain valid:

- `spore_extract`
- `listening_ash_elixir`
- `pale_sight_elixir`
- `channel_salt`
- `deep_antidote`
- `ashbound_elixir`
- `worn_blade_upgraded`
- `forged_blade`
- `ember_forged_weapon`

---

## 2. Phase Goal

Upgrade the equipment system so Verasanth supports more equipment slots, stat-bearing gear, item categories, slot validation, equipping and unequipping through shared logic, future build variety, future party-role reinforcement, and future biome-based gear scaling.

This phase should produce:
1. A universal equipment schema
2. A multi-slot equipment model
3. A safe migration path from the current shallow model
4. A first-pass sewer gear catalog
5. A shared equipment stat aggregation layer

---

## 3. Equipment Slot Model

Replace the current 3-slot model (weapon / armor / shield) with this full structure. Implement as `EQUIPMENT_SLOTS` constant in `index.js`:

```js
const EQUIPMENT_SLOTS = [
  "weapon_main",    // primary weapon
  "weapon_offhand", // shield, lantern, focus, buckler
  "head",           // hood, helm, mask, circlet
  "chest",          // armor/body gear
  "hands",          // wraps, gloves, gauntlets
  "legs",           // trousers, leathers, greaves
  "feet",           // boots, wraps, heavy boots
  "cloak",          // stealth, resistance, utility
  "ring_1",         // small stat/passive slot
  "ring_2",         // small stat/passive slot
  "charm",          // utility/passive/resistance
  "relic"           // rare special slot
];
```

> Optional future slots — do NOT implement yet: `belt`, `shoulders`, `tool`

---

## 4. Universal Equipment Schema

Every equippable item must conform to this shape. Non-equipment items (loot, consumable, quest, artifact) are unaffected.

```js
{
  id: "rusted_blade",
  name: "Rusted Blade",
  item_type: "equipment",
  sub_type: "sword",
  slot: "weapon_main",
  rarity: "common",
  quality: "worn",           // broken | worn | serviceable | forged
  tier: 1,
  biome_tier: 1,
  level_requirement: 1,
  value_am: 10,
  weight: 2,
  stackable: false,
  max_stack: 1,
  equippable: true,
  tags: ["rusted", "sewer", "metal"],
  stat_modifiers: {
    max_hp: 0, max_stamina: 0, melee_power: 2, ranged_power: 0,
    spell_power: 0, healing_power: 0, accuracy: 0, defense: 0,
    dodge: 0, block_value: 0, crit_chance: 0, crit_damage: 0,
    initiative: 0, perception: 0, carry_capacity: 0,
    resist_poison: 0, resist_bleed: 0, resist_fire: 0, resist_shadow: 0
  },
  on_equip_effects: [],
  on_hit_effects: [],
  passive_effects: [],
  corruption: null,
  lore: "A blade left too long in wet stone.",
  vendor_targets: ["caelir", "trader"]
}
```

**Schema rules:**
- `quality` and `tier` are separate: tier = progression band, quality = item condition/flavor
- `stat_modifiers` must always be present even if all zeros
- `corruption` must be nullable — `null` for standard items
- `vendor_targets` helps future vendor specialization

---

## 5. Stat Modifier Keys

Implement as `EQUIPMENT_STAT_KEYS` constant. Equipment may only modify these fields:

```js
const EQUIPMENT_STAT_KEYS = [
  "max_hp", "max_stamina",
  "melee_power", "ranged_power", "spell_power", "healing_power",
  "accuracy", "defense", "dodge", "block_value",
  "crit_chance", "crit_damage",
  "initiative", "perception", "carry_capacity",
  "resist_poison", "resist_bleed", "resist_fire", "resist_shadow"
];
```

### Sewer-Tier Tuning Rules

Keep numbers modest. Power should come from multiple slots and combinations, not single items.

| Item Type | Modifier Range |
|-----------|---------------|
| Basic weapon | `melee_power +1 to +3` |
| Light chest | `defense +1 to +2` |
| Heavy chest | `defense +2 to +4, dodge -1` |
| Boots | `dodge +1` or `initiative +1` |
| Lantern | `perception +2` |
| Charm | One small resistance bonus |
| Relic | Small but flavorful utility |

---

## 6. Equipment Slot Intent & Sewer Gear

### Slot Intent

| Slot | Intent | Sewer Examples |
|------|--------|----------------|
| `weapon_main` | Primary damage source | Rusted Blade, Pipe Shiv, Ash-Caked Club, Hooked Knife, Drain Spear, Worn Mace, Sewer Wand, Charred Staff |
| `weapon_offhand` | Defense, utility, or focus | Cracked Buckler, Scrap Shield, Oil Lantern, Bone Focus |
| `head` | Minor stat, vision, stealth | Threadbare Hood, Rusted Cap, Sewer Mask, Bent Helm |
| `chest` | Primary armor layer | Patchwork Jerkin, Mold-Stained Vest, Sewer Leathers, Riveted Coat, Patchwork Coat |
| `hands` | Accuracy or grip utility | Cloth Wraps, Tinker Gloves, Rust-Linked Gauntlets |
| `legs` | Mobility or durability | Patched Trousers, Sewer Leg Wraps, Reinforced Greaves |
| `feet` | Dodge, initiative, traction | Worn Boots, Slickstep Boots, Footwraps, Heavy Sewer Boots |
| `cloak` | Dodge, resistances, stealth flavor | Ash Cloak, Drip-Cloak, Faded Mantle |
| `ring_1` / `ring_2` | Small stat or passive slots | Tarnished Band, Bent Copper Ring, Dull Iron Signet, Ash-Flecked Ring |
| `charm` | Utility, perception, resist, luck hooks | Rat-Bone Charm, Salt Thread Token, Sewer Saint Knot, Pale Coin |
| `relic` | Low-frequency meaningful passives | Cracked Reliquary Shard, Whisper Stone Fragment, Ash-Script Token |

### Sewer Starter Gear Content Target

Cursor must produce at least this many initial sewer-tier items:

| Slot | Count |
|------|-------|
| weapon_main | 8 |
| weapon_offhand | 4 |
| head | 4 |
| chest | 5 |
| hands | 3 |
| legs | 3 |
| feet | 4 |
| cloak | 3 |
| rings | 4 |
| charms | 4 |
| relics | 3 |
| corrupted test items | 4 |

---

## 7. Corrupted Equipment Support

Do not fully build corruption progression in this phase. The equipment system must support corrupted gear structurally now.

### Corruption Payload Shape

```js
corruption: {
  corruption_type: "bloodbound",
  positive_effects: { melee_power: 3, crit_chance: 2 },
  negative_effects: { max_hp: -4 },
  passive_text: "The blade drinks from the hand that grips it."
}
```

### Sewer Corrupted Test Items
- Bloodbound Pipe Shiv
- Whispering Lantern
- Ash-Bitten Cloak
- Split-Iron Charm

**Rules:**
- Corruption is optional — `null` for standard items
- Corruption must be renderable in UI
- Corruption effects must be mergeable into aggregated equipment stats
- Corruption support must not break non-corrupted items

---

## 8. Required Functions

All implemented as named functions in `index.js`.

### Schema and Slot Helpers
```js
isEquipmentItem(item)
getEquipmentSlot(item)
isValidEquipmentSlot(slot)
createEmptyEquipmentLoadout()
```

### Equip Flow
```js
canEquipItem(character, item, slot)
equipItem(characterId, inventoryRowId, slot)
unequipItem(characterId, slot)
getEquippedItems(characterId)
getEquippedItemMap(characterId)
```

### Stat Aggregation
```js
mergeStatModifiers(baseStats, bonusStats)
getItemEffectiveStats(item)
aggregateEquipmentStats(equippedItems)
```

### Rendering Helpers
```js
formatEquipmentSlotName(slot)
formatItemStatModifiers(item)
formatCorruptionText(item)
```

---

## 9. Database / Save Model

Store equipped state in inventory rows via a single column addition. Do not add 12 new character columns.

```sql
-- Add to inventory table
ALTER TABLE inventory ADD COLUMN equipped_slot TEXT NULL;
ALTER TABLE inventory ADD COLUMN instance_data_json TEXT NULL;
ALTER TABLE inventory ADD COLUMN corruption_json TEXT NULL;
```

### Migration Mapping

| Old Column | New Slot |
|-----------|----------|
| `weapon` | `weapon_main` |
| `armor` | `chest` |
| `shield` | `weapon_offhand` |

Existing equipped states must map safely. Characters with no prior equipment should default to all slots empty with no errors.

---

## 10. Minimum UI Requirements

Do not do the full UI redesign in this phase. Only improve equipment display enough to support the new system.

### Character Panel — Required Slot Display

```
Weapon Main:     [item name or empty]
Weapon Offhand:  [item name or empty]
Head:            [item name or empty]
Chest:           [item name or empty]
Hands:           [item name or empty]
Legs:            [item name or empty]
Feet:            [item name or empty]
Cloak:           [item name or empty]
Ring 1:          [item name or empty]
Ring 2:          [item name or empty]
Charm:           [item name or empty]
Relic:           [item name or empty]
```

### Minimum Tooltip Data
- Name, slot, rarity, quality, tier
- All non-zero stat modifiers
- Corruption text if applicable
- Item value in Ash Marks

---

## 11. Implementation Order

1. Create `EQUIPMENT_SLOTS`, `EQUIPMENT_STAT_KEYS`, and schema constants in `index.js`
2. Create expanded slot model and `createEmptyEquipmentLoadout()`
3. Add sewer starter equipment catalog as `SEWER_EQUIPMENT` constant
4. Add slot validation and equip/unequip service functions
5. Add inventory-to-slot migration for old weapon/armor/shield
6. Add equipment stat aggregation functions
7. Update character panel to display all 12 slots
8. Update inventory interactions to support equip/unequip by slot
9. Add 4 corrupted sewer test items
10. Verify existing loot, quest, and vendor items still function

---

## 12. Test Cases

### Basic Equipment
- Equip a weapon into `weapon_main`
- Equip a shield into `weapon_offhand`
- Equip armor into `chest`
- Equip boots into `feet`

### Slot Restrictions
- Cannot equip a chest item into `head`
- Cannot equip a relic into `ring_1`
- Cannot equip non-equipment loot into any slot

### Replace Behavior
- Equipping a new chest item replaces current chest item safely
- Replaced item returns to inventory correctly

### Aggregation
- Total equipment stats combine all equipped item modifiers
- Zero-value fields do not break display
- Corrupted items include both positive and negative modifiers

### Migration
- Legacy equipped weapon becomes `weapon_main`
- Legacy armor becomes `chest`
- Legacy shield becomes `weapon_offhand`

### Compatibility
- Existing loot table items from `items.js` still drop normally
- Existing quest rewards still resolve by item ID
- Non-equipment loot still sells normally

---

## 13. Hard Do-Not-Do List

1. Do not redesign combat formulas in this phase.
2. Do not redesign instinct abilities in this phase.
3. Do not implement the forest, caves, or new biomes.
4. Do not convert every existing loot item into gear.
5. Do not remove current loot/item IDs from working systems.
6. Do not bury slot logic inside UI files.
7. Do not hard-code equipment effects directly into combat routes.
8. Do not add random procedural generation unless fully optional and data-safe.

---

## 14. Phase Exit Conditions

This phase is complete when:

1. Verasanth supports a multi-slot equipment model (12 slots).
2. Equippable gear uses a shared universal schema.
3. Inventory can equip and unequip items by slot.
4. Character UI shows all 12 slots, filled or empty.
5. Equipment stats are aggregatable through shared helpers.
6. Existing sewer loot, economy, and quest systems still work.
7. Sewer gear options feel more varied than weapon/armor/shield only.
8. System is ready for future phases: stat integration, instinct synergy, biome-tier progression.

---

## One-Sentence Summary

**Implement a safe, extensible multi-slot equipment framework for Verasanth that upgrades the current shallow gear model without breaking existing loot, quest, and economy systems.**
