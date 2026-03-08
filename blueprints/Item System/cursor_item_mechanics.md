# Cursor Prompt — Item Mechanics Implementation (Revised)
# Reference: verasanth_item_mechanics_blueprint.md
# Touch: index.js, index.html, data/equipment.js, services/equipment_stats.js

---

## ARCHITECTURE NOTE

This project uses ES modules bundled by wrangler. Keep the modular structure.
Do NOT flatten everything into index.js. Use the existing files:
- data/equipment.js — item data and constants
- services/equipment.js — equip/unequip logic
- services/equipment_stats.js — aggregateEquipmentStats, getItemEffectiveStats
- index.js — routes, combat handler
- index.html — frontend UI

---

## CONTEXT FROM GAP REPORT

The gap report identified one primary functional gap:

  aggregateEquipmentStats() exists and works correctly but is
  never called by combat. Combat currently uses tier-based lookups:
    - weapon_main tier → weaponDie [6, 8, 10, 12]
    - chest tier → armorReduction [0, 2, 4, 6]
    - weapon_offhand present → shieldBonus = 2

The fix is to AUGMENT tier-based combat with stat_modifiers from
equipped items — not replace the tier system. Tier is the base.
stat_modifiers are added on top.

Everything else in both systems is working correctly. Do not refactor
route names, DB schema, discovery persistence, or canEquipItem signatures.

---

## WHAT THIS PROMPT BUILDS

1. Wire aggregateEquipmentStats into combat (the main gap)
2. Add item_type and effect blocks to ITEM_DATA consumables
3. Add POST /api/item/use route
4. Add active_buffs tracking to combat state
5. Update inventory UI to show item types and action buttons
6. Add in-combat item use to combat overlay

---

## STEP 1 — Add effect blocks to consumables (data/equipment.js or index.js)

Wherever ITEM_DATA lives, add `item_type` and `effect` to every consumable.
Add `item_type: "loot"` to loot items and `item_type: "quest"` to quest items.
Equipment already has `item_type: "equipment"`.

### Effect block shape

```js
effect: {
  type: "heal",           // heal | buff | utility | damage
  value: 18,              // numeric magnitude
  stat: null,             // stat key to buff, if type=buff
  duration_turns: null,   // turns active in combat, null = instant
  removes_status: null,   // status string to remove, if type=utility
  out_of_combat: true,    // usable outside combat
  in_combat: true,        // usable during combat (costs a turn)
  message: "..."          // narrative result message
}
```

### Apply to existing items

```js
"crude_healing_draught": {
  item_type: "consumable",
  effect: { type: "heal", value: 12, out_of_combat: true, in_combat: true,
    message: "A bitter swallow. The wound closes badly but closes." }
},
"healing_potion": {
  item_type: "consumable",
  effect: { type: "heal", value: 22, out_of_combat: true, in_combat: true,
    message: "The warmth spreads through your chest." }
},
"strong_healing_potion": {
  item_type: "consumable",
  effect: { type: "heal", value: 40, out_of_combat: true, in_combat: true,
    message: "The pain recedes. Not gone — receded." }
},
"listening_ash_elixir": {
  item_type: "consumable",
  effect: { type: "buff", stat: "perception", value: 4, duration_turns: 5,
    out_of_combat: true, in_combat: false,
    message: "The ash settles in your throat. You hear more." }
},
"pale_sight_elixir": {
  item_type: "consumable",
  effect: { type: "buff", stat: "perception", value: 6, duration_turns: 3,
    out_of_combat: true, in_combat: false,
    message: "Your vision shifts. Edges sharpen. You see what hides." }
},
"ashbound_elixir": {
  item_type: "consumable",
  effect: { type: "buff", stat: "defense", value: 3, duration_turns: 4,
    out_of_combat: true, in_combat: true,
    message: "The ash hardens on your skin. Brief, but enough." }
},
"deep_antidote": {
  item_type: "consumable",
  effect: { type: "utility", removes_status: "poisoned",
    out_of_combat: true, in_combat: true,
    message: "The bitterness burns the poison out." }
},
"channel_salt": {
  item_type: "consumable",
  effect: { type: "utility", removes_status: "cursed",
    out_of_combat: true, in_combat: false,
    message: "The salt absorbs it. Whatever it was." }
}
```

### New consumables to add

```js
"sewer_salt_wrap": {
  name: "Sewer Salt Wrap", item_type: "consumable", value_am: 5,
  effect: { type: "buff", stat: "defense", value: 1, duration_turns: 3,
    out_of_combat: true, in_combat: true,
    message: "Rough cloth soaked in salt. It stiffens against the next blow." }
},
"rat_bile_flask": {
  name: "Rat Bile Flask", item_type: "consumable", value_am: 4,
  effect: { type: "damage", value: 8, out_of_combat: false, in_combat: true,
    message: "You hurl it. The enemy recoils from the stench and acid." }
},
"fungal_paste": {
  name: "Fungal Paste", item_type: "consumable", value_am: 6,
  effect: { type: "heal", value: 6, out_of_combat: true, in_combat: true,
    message: "It smells wrong. It works anyway." }
},
"ember_salts": {
  name: "Ember Salts", item_type: "consumable", value_am: 22,
  effect: { type: "buff", stat: "melee_power", value: 3, duration_turns: 3,
    out_of_combat: false, in_combat: true,
    message: "Your grip tightens. Every strike feels intent." }
}
```

---

## STEP 2 — Wire aggregateEquipmentStats into combat (index.js)

### The rule
Tier-based values are the BASE. stat_modifiers from equipped items are
ADDED ON TOP. Do not remove or replace weaponDie, armorReduction,
or shieldBonus. Only augment them.

### Where to make the change
Find the combat action handler around lines 1525, 1609, 1822 where
weaponDie, armorReduction, and shieldBonus are calculated.

At the top of the combat resolution block, after fetching the character,
add:

```js
// Get equipment stat bonuses — these add ON TOP of tier values
const equippedItemMap = await getEquippedItemMap(characterId, env);
const equippedStats   = await aggregateEquipmentStats(characterId, env);

// Merge active buff bonuses
const activeBonuses = {};
for (const buff of (combatState.active_buffs || [])) {
  activeBonuses[buff.stat] = (activeBonuses[buff.stat] || 0) + buff.value;
}
```

### Player attack — add melee_power to tier roll

```js
// Keep existing tier roll
const tierRoll = Math.ceil(Math.random() * weaponDie[tier]);

// Add equipment + buff bonus on top
const weaponMain    = equippedItemMap["weapon_offhand"] // check for spell type
const isSpellWeapon = equippedItemMap["weapon_main"] &&
  ["wand","staff"].includes(equippedItemMap["weapon_main"].sub_type);

const attackBonus = isSpellWeapon
  ? ((equippedStats.spell_power  || 0) + (activeBonuses.spell_power  || 0))
  : ((equippedStats.melee_power  || 0) + (activeBonuses.melee_power  || 0));

const playerRoll = tierRoll + attackBonus;
// Use playerRoll wherever the old tier roll result was used
```

### Incoming damage — add defense to armorReduction

```js
// Keep existing tier lookup
const baseTierReduction = armorReduction[armorTier];

// Add equipment defense + buff bonus on top
const equipDefense   = (equippedStats.defense || 0)
                     + (activeBonuses.defense  || 0);
const totalReduction = baseTierReduction + equipDefense;

const reduced = Math.max(1, enemyDamage - totalReduction);
// Use reduced wherever the old reduced damage was used
```

### Shield — add block_value to shieldBonus

```js
// Keep existing presence check
const offhand   = equippedItemMap["weapon_offhand"];
const isShield  = offhand && ["shield","buckler"].includes(offhand.sub_type);
const shieldBonus = isShield
  ? (2 + (equippedStats.block_value || 0))
  : 0;
```

### Dodge — add dodge check if not already present

```js
const dodgeChance = (equippedStats.dodge || 0) + (activeBonuses.dodge || 0);
const dodged = dodgeChance > 0 && (Math.random() * 100) < dodgeChance;
if (dodged) {
  // Skip applying damage to player this turn
  // Append to combat message: "You sidestep the attack."
}
```

---

## STEP 3 — Active buffs in combat state (index.js)

Add `active_buffs: []` to the initial combat state object when a fight starts.

At the START of each combat turn, before player action resolves, decrement
and expire buffs:

```js
if (combatState.active_buffs?.length) {
  combatState.active_buffs = combatState.active_buffs
    .map(b => ({ ...b, turns_remaining: b.turns_remaining - 1 }))
    .filter(b => b.turns_remaining > 0);
}
```

Include `active_buffs` in every `ongoing` combat response.

---

## STEP 4 — applyConsumableEffect() (index.js)

```js
async function applyConsumableEffect(effect, characterId, combatState, env) {
  const result = {
    message: effect.message,
    hp_change: 0,
    buff: null,
    status_removed: null,
    enemy_damage: 0
  };

  if (effect.type === "heal") {
    const { current, max } = await getPlayerHp(characterId, env);
    const newHp = Math.min(max, current + effect.value);
    await env.DB.prepare(
      "UPDATE characters SET current_hp=? WHERE id=?"
    ).bind(newHp, characterId).run();
    result.hp_change = newHp - current;
  }

  if (effect.type === "buff") {
    result.buff = {
      stat: effect.stat,
      value: effect.value,
      turns_remaining: effect.duration_turns,
      source: "consumable"
    };
  }

  if (effect.type === "utility" && effect.removes_status) {
    result.status_removed = effect.removes_status;
    if (combatState?.statuses) {
      delete combatState.statuses[effect.removes_status];
    }
  }

  if (effect.type === "damage") {
    result.enemy_damage = effect.value;
  }

  return result;
}
```

---

## STEP 5 — POST /api/item/use route (index.js)

```
POST /api/item/use
Body: { item_id }
```

Handler logic:

1. Look up item in ITEM_DATA — confirm item_type === "consumable" and
   effect block exists
2. Confirm player has at least 1 in inventory
3. Check combat context:
   - Fetch current combat state
   - In combat + effect.in_combat === false →
     return error "Can't use that during combat."
   - Not in combat + effect.out_of_combat === false →
     return error "That only works in combat."
4. Call applyConsumableEffect()
5. If result.buff: push to combatState.active_buffs, save combat state
6. If result.enemy_damage: reduce enemy_hp in combatState, check victory
7. Remove 1 from inventory (delete row if quantity reaches 0)
8. If used in combat: run enemy attack this turn, append to message
9. Return:

```js
{
  success: true,
  message: "...",
  player_hp: newHp,
  player_hp_max: maxHp,
  active_buffs: combatState?.active_buffs || [],
  enemy_hp: combatState?.enemy_hp || null,
  result: "ok"    // or "victory" if enemy_damage killed enemy
}
```

---

## STEP 6 — Update /api/inventory response (index.js)

Update GET /api/inventory to return full item objects:

```js
items: [
  {
    item_id: "healing_potion",
    name: "Healing Potion",
    item_type: "consumable",
    quantity: 2,
    equipped_slot: null,
    effect_summary: "Heals 22 HP",
    value_am: 18,
    in_combat: true,
    out_of_combat: true
  }
]
```

Compute effect_summary server-side:
- heal → "Heals X HP"
- buff → "+X [stat] for Y turns"
- utility removes_status → "Removes [status]"
- damage → "Deals X damage to enemy"
- equipment → first two non-zero stat_modifiers formatted as "+2 Melee, +1 Defense"
- loot → blank or omit
- quest → blank or omit

---

## STEP 7 — Update updateInventory() (index.html)

Replace flat string rendering with typed item rows. Each item shows:

- Name + quantity
- Muted small type tag (consumable / equipment / loot / quest)
- effect_summary line below name
- Action buttons:
  - equipment, not equipped → "Equip"
  - equipment, equipped → "Unequip" + show slot name in muted text
  - consumable, out_of_combat true → "Use"
  - consumable, out_of_combat false only → no out-of-combat button
  - loot → value in ash marks shown, no buttons
  - quest → no buttons, no value

Use button calls POST /api/item/use with { item_id }.
On success: call refreshSidebar() to update HP bar and inventory.
On error: show error message inline next to the item.

---

## STEP 8 — In-combat item use (index.html)

Add to the combat actions row:

```html
<button id="btn-use-item" class="btn" onclick="openCombatInventory()">
  Use Item
</button>
```

Implement openCombatInventory():
- Fetches GET /api/inventory
- Filters to consumables where in_combat === true
- If none: shows "No usable items." inline, no panel
- Otherwise: renders inline panel with item name, effect_summary, Use button
- Use button → POST /api/item/use with { item_id }
- On success:
  - Append message to combat log
  - Update HP bars via updateCombatBars()
  - Update status bar with active_buffs
  - If result === "victory": run existing victory flow
  - Close item panel
- On error: log error in combat log, keep panel open

Mutual exclusion:
- Disable btn-use-item if ability was already used this turn
- Disable btn-ability if Use Item was already used this turn
- Disable btn-use-item while item panel is open

---

## STEP 9 — Verify unchanged systems

- Loot drops from LOOT_TABLES still work
- Quest reward IDs still resolve
- /api/inventory/equip and /api/inventory/unequip still work
- GET /api/map/discovered and discovery persistence still work
- Tier values (weaponDie, armorReduction) still present in code
- Alignment system untouched
- NPC dialogue untouched

---

## DO NOT DO

- Do not remove or replace weaponDie or armorReduction — augment only
- Do not rename existing routes
- Do not migrate the equipment_slots table or inventory schema
- Do not flatten modular file structure
- Do not add crafting
- Do not persist active_buffs in DB — combat_state only
- Do not make loot equippable or usable
- Do not make quest items sellable or droppable
