# Cursor Prompt — Equipment System Implementation
# Reference: verasanth_equipment_system_blueprint.md
# Touch: index.js, index.html

---

## ARCHITECTURE CONSTRAINT — READ FIRST

Verasanth runs as a single Cloudflare Worker. There is no module bundler,
no import system, and no separate files that get loaded at runtime.

- All equipment constants, schemas, data, and service functions go in index.js
- All rendering helpers and UI logic go in index.html's script section
- Do NOT create data/equipment.js, services/equipment.js, or any separate files
- Organize code using clearly labeled comment blocks, not file splits

---

## WHAT TO BUILD

Implement a 12-slot equipment framework. Do not redesign combat, instincts,
quests, alignment, or any other system. Extend the existing item system only.

---

## STEP 1 — Constants (index.js)

Add these named constants as a clearly labeled section:

```js
// ── Equipment System ──────────────────────────────────────────────

const EQUIPMENT_SLOTS = [
  "weapon_main", "weapon_offhand", "head", "chest", "hands",
  "legs", "feet", "cloak", "ring_1", "ring_2", "charm", "relic"
];

const EQUIPMENT_STAT_KEYS = [
  "max_hp", "max_stamina", "melee_power", "ranged_power",
  "spell_power", "healing_power", "accuracy", "defense", "dodge",
  "block_value", "crit_chance", "crit_damage", "initiative",
  "perception", "carry_capacity", "resist_poison", "resist_bleed",
  "resist_fire", "resist_shadow"
];
```

---

## STEP 2 — Sewer Equipment Data (index.js)

Add a SEWER_EQUIPMENT constant containing at minimum:
- 8 weapon_main items
- 4 weapon_offhand items
- 4 head items
- 5 chest items
- 3 hands items
- 3 legs items
- 4 feet items
- 3 cloak items
- 4 ring items
- 4 charm items
- 3 relic items
- 4 corrupted test items

Every item must use this exact schema shape:

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

Sewer-tier tuning rules — keep numbers modest:
- Basic weapon: melee_power +1 to +3
- Light chest: defense +1 to +2
- Heavy chest: defense +2 to +4, dodge -1
- Boots: dodge +1 or initiative +1
- Lantern: perception +2
- Charm: one small resistance bonus

Corrupted items must include a corruption payload:
```js
corruption: {
  corruption_type: "bloodbound",
  positive_effects: { melee_power: 3, crit_chance: 2 },
  negative_effects: { max_hp: -4 },
  passive_text: "The blade drinks from the hand that grips it."
}
```

The 4 corrupted test items are:
- Bloodbound Pipe Shiv (weapon_main)
- Whispering Lantern (weapon_offhand)
- Ash-Bitten Cloak (cloak)
- Split-Iron Charm (charm)

---

## STEP 3 — Schema and Slot Helpers (index.js)

```js
function isEquipmentItem(item)          // item_type === "equipment"
function getEquipmentSlot(item)         // returns item.slot
function isValidEquipmentSlot(slot)     // EQUIPMENT_SLOTS.includes(slot)
function createEmptyEquipmentLoadout()  // returns object with all 12 slots set to null
```

---

## STEP 4 — Equip / Unequip Service Functions (index.js)

```js
async function canEquipItem(characterId, item, slot, env)
// Returns { allowed: bool, reason: string }
// Checks: slot exists, item is equipment, item.slot matches requested slot

async function equipItem(characterId, inventoryRowId, slot, env)
// Sets equipped_slot = slot on the inventory row
// If another item occupies that slot, sets its equipped_slot = null first
// Returns updated loadout

async function unequipItem(characterId, slot, env)
// Sets equipped_slot = null for any inventory row with that slot
// Returns updated loadout

async function getEquippedItems(characterId, env)
// Returns array of inventory rows where equipped_slot IS NOT NULL
// Join with SEWER_EQUIPMENT or ITEM_DATA to get full item details

async function getEquippedItemMap(characterId, env)
// Returns object keyed by slot: { weapon_main: item, chest: item, ... }
// Missing slots return null
```

---

## STEP 5 — DB Migration (index.js)

Add these columns to the inventory table if they don't exist.
Run this in the Worker's startup or as a safe migration:

```sql
ALTER TABLE inventory ADD COLUMN equipped_slot TEXT NULL;
ALTER TABLE inventory ADD COLUMN instance_data_json TEXT NULL;
ALTER TABLE inventory ADD COLUMN corruption_json TEXT NULL;
```

Migrate existing equipped items safely:
- Any row where the old `equipped` column = 'weapon' → set equipped_slot = 'weapon_main'
- Any row where the old `equipped` column = 'armor'  → set equipped_slot = 'chest'
- Any row where the old `equipped` column = 'shield' → set equipped_slot = 'weapon_offhand'

If the old column names differ, check the actual schema and map accordingly.
Do not drop old columns — just add the new one alongside.

---

## STEP 6 — Stat Aggregation (index.js)

```js
function mergeStatModifiers(base, bonus)
// Adds each key in bonus onto base. Returns merged object.
// All EQUIPMENT_STAT_KEYS must be present in result even if 0.

function getItemEffectiveStats(item)
// Returns stat_modifiers merged with corruption positive/negative effects if present

function aggregateEquipmentStats(equippedItems)
// Calls getItemEffectiveStats on each item and merges all into a single stat object
// Returns object with all EQUIPMENT_STAT_KEYS
```

---

## STEP 7 — Rendering Helpers (index.html script section)

```js
function formatEquipmentSlotName(slot)
// Returns display name: "weapon_main" → "Weapon", "weapon_offhand" → "Offhand",
// "ring_1" → "Ring 1", "ring_2" → "Ring 2", etc.

function formatItemStatModifiers(item)
// Returns array of strings for non-zero stats only
// e.g. ["Melee Power +2", "Defense +1"]

function formatCorruptionText(item)
// Returns corruption passive_text if present, null if not corrupted
```

---

## STEP 8 — API Routes (index.js)

Add these routes to the Worker's fetch handler:

```
POST /api/equip
  Body: { inventory_row_id, slot }
  Calls equipItem(), returns updated loadout

POST /api/unequip
  Body: { slot }
  Calls unequipItem(), returns updated loadout

GET /api/equipped
  Calls getEquippedItemMap(), returns all 12 slots
```

---

## STEP 9 — Character Panel UI (index.html)

Update the character panel to display all 12 equipment slots.
Show empty slots clearly with a dim placeholder.

Target display for each slot:
- Slot label (formatted via formatEquipmentSlotName)
- Equipped item name, or "—" if empty
- On click of an equipped item: show stat summary and Unequip button

Inventory items that are equippable should show an Equip button.
Equipping calls POST /api/equip with the inventory_row_id and correct slot.
Unequipping calls POST /api/unequip with the slot.

Show corruption passive_text in a distinct color if the item is corrupted.

---

## STEP 10 — Compatibility Check

After implementation verify:
- Existing loot table items (from LOOT_TABLES) still drop normally
- Existing quest reward IDs still resolve: spore_extract, listening_ash_elixir,
  pale_sight_elixir, channel_salt, deep_antidote, ashbound_elixir,
  worn_blade_upgraded, forged_blade, ember_forged_weapon
- Non-equipment loot still sells at vendors normally
- No existing combat, instinct, or quest logic has been touched

---

## DO NOT DO

- Do not redesign combat formulas
- Do not redesign instinct abilities
- Do not create separate JS files — everything in index.js and index.html
- Do not remove existing item IDs or loot tables
- Do not hard-code equipment effects into combat routes
- Do not add procedural generation
