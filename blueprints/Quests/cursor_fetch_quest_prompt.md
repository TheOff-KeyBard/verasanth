# Cursor Prompt — Fetch Quest System
# Paste this entire prompt into Cursor

---

Implement the fetch quest system. This is the economy loop that connects
the sewer to the NPCs. Players kill enemies, get items, bring items to NPCs,
get rewards, unlock quest chains.

This pass covers index.js and index.html. It is larger than previous passes —
read the full prompt before starting.

Current state (confirmed by code review):
- Combat victory only drops Ash Marks — no items
- No sell/buy endpoints exist
- No vendor stock definitions exist
- No quest table exists
- No quest assignment or progress tracking exists
- inventory table exists: (user_id, item TEXT, qty INTEGER)
- player_flags table exists — used for all boolean progression

---

## STEP 1 — Item Drop System

### 1a — Loot Tables in data/combat.js (or inline in index.js)

Add this loot table object. Each enemy has a `loot` array of possible drops
with weights. Add it to the COMBAT_DATA object or as a standalone const:

```javascript
// Weight-based loot: [item_id, weight, min_qty, max_qty]
// Weights are relative — higher = more common
const LOOT_TABLES = {
  // Floor 1
  gutter_rat:        [['rat_pelt', 70, 1, 2], ['slime_residue', 30, 1, 1]],
  ash_crawler:       [['ash_residue', 60, 1, 1], ['pipe_fitting', 40, 1, 1]],
  mold_vermin:       [['slime_residue', 60, 1, 2], ['sewer_fungi', 40, 1, 1]],
  channel_stalker:   [['rat_pelt', 40, 1, 1], ['spore_cluster', 60, 1, 1]],
  drowned_thrall:    [['waterlogged_cloth', 50, 1, 1], ['drowned_relic', 30, 1, 1], ['tarnished_coin', 20, 1, 2]],
  cistern_leech:     [['leech_extract', 80, 1, 2], ['deep_water_residue', 20, 1, 1]],
  flood_serpent:     [['deep_water_residue', 50, 1, 1], ['rare_algae', 30, 1, 1], ['leech_extract', 20, 1, 1]],
  gearbound_sentinel:[['gear_fragment', 60, 1, 1], ['crafting_scrap', 40, 1, 2]],
  heat_wraith:       [['deep_vent_ash', 70, 1, 1], ['heat_core_fragment', 30, 1, 1]],
  rust_golem:        [['rust_plates', 60, 1, 1], ['gear_fragment', 40, 1, 1]],
  ashborn_acolyte:   [['ash_infused_stone', 60, 1, 1], ['cathedral_rune_shard', 40, 1, 1]],
  cathedral_wraith:  [['void_essence', 50, 1, 1], ['ash_infused_stone', 50, 1, 1]],
  fungal_shambler:   [['sewer_fungi', 50, 1, 2], ['spore_cluster', 50, 1, 1]],
  // Bosses
  rat_king:          [['rat_king_musk', 100, 1, 1], ['sewer_map_fragment', 40, 1, 1]],
  sporebound_custodian: [['custodian_core', 100, 1, 1], ['spore_extract', 100, 1, 1]],
  cistern_leviathan: [['leviathan_scale', 100, 1, 1], ['drowned_relic', 100, 1, 1]],
  broken_regulator:  [['regulator_core', 100, 1, 1], ['runic_tablet', 100, 1, 1], ['mechanist_components', 60, 1, 2]],
  ash_heart_custodian: [['ashbound_resonance', 100, 1, 1], ['cathedral_rune_shard', 100, 2, 3]],
};

// Item display names and base values (sell price = base * 0.5, rounded)
const ITEM_DATA = {
  rat_pelt:              { name: 'Rat Pelt',              value: 12  },
  slime_residue:         { name: 'Slime Residue',         value: 8   },
  ash_residue:           { name: 'Ash Residue',           value: 10  },
  pipe_fitting:          { name: 'Pipe Fitting',          value: 15  },
  sewer_fungi:           { name: 'Sewer Fungi',           value: 20  },
  spore_cluster:         { name: 'Spore Cluster',         value: 25  },
  spore_extract:         { name: 'Spore Extract',         value: 80  },
  waterlogged_cloth:     { name: 'Waterlogged Cloth',     value: 10  },
  drowned_relic:         { name: 'Drowned Relic',         value: 120 },
  tarnished_coin:        { name: 'Tarnished Coin',        value: 5   },
  leech_extract:         { name: 'Leech Extract',         value: 30  },
  deep_water_residue:    { name: 'Deep Water Residue',    value: 25  },
  rare_algae:            { name: 'Rare Algae',            value: 60  },
  gear_fragment:         { name: 'Gear Fragment',         value: 35  },
  crafting_scrap:        { name: 'Crafting Scrap',        value: 18  },
  deep_vent_ash:         { name: 'Deep Vent Ash',         value: 50  },
  heat_core_fragment:    { name: 'Heat Core Fragment',    value: 90  },
  rust_plates:           { name: 'Rust Plates',           value: 45  },
  ash_infused_stone:     { name: 'Ash-Infused Stone',     value: 55  },
  cathedral_rune_shard:  { name: 'Cathedral Rune Shard', value: 150 },
  void_essence:          { name: 'Void Essence',          value: 200 },
  mechanist_components:  { name: 'Mechanist Components',  value: 140 },
  sewer_map_fragment:    { name: 'Sewer Map Fragment',    value: 30  },
  rat_king_musk:         { name: "Rat King's Musk",       value: 80  },
  custodian_core:        { name: 'Custodian Core',        value: 180 },
  leviathan_scale:       { name: 'Leviathan Scale',       value: 250 },
  regulator_core:        { name: 'Regulator Core',        value: 300 },
  runic_tablet:          { name: 'Runic Tablet',          value: 200 },
  ashbound_resonance:    { name: 'Ashbound Resonance',    value: 0   }, // quest item — not sellable
  worn_tool:             { name: 'Worn Tool',             value: 25  },
  glowing_spores:        { name: 'Glowing Spores',        value: 40  },
  flood_record_page:     { name: 'Flood Record Page',     value: 0   }, // quest item
  healers_kit:           { name: "Healer's Kit",          value: 0   }, // quest item
  heart_pump_fragment:   { name: 'Heart Pump Fragment',   value: 0   }, // quest item
  channel_salt:          { name: 'Channel Salt',          value: 15  },
  deep_antidote:         { name: 'Deep Antidote',         value: 60  },
};
```

### 1b — rollLoot() helper

Add this function near the other combat helpers:

```javascript
function rollLoot(enemyId) {
  const table = LOOT_TABLES[enemyId];
  if (!table) return [];
  const drops = [];
  for (const [itemId, weight, minQty, maxQty] of table) {
    // Roll against weight (weight/100 chance for common items,
    // always drops for bosses with weight 100)
    if (Math.random() * 100 < weight) {
      const qty = minQty + Math.floor(Math.random() * (maxQty - minQty + 1));
      drops.push({ itemId, qty });
    }
  }
  return drops;
}

async function addItemToInventory(db, uid, itemId, qty = 1) {
  await dbRun(db, `
    INSERT INTO inventory (user_id, item, qty) VALUES (?, ?, ?)
    ON CONFLICT(user_id, item) DO UPDATE SET qty = qty + excluded.qty
  `, [uid, itemId, qty]);
}

async function removeItemFromInventory(db, uid, itemId, qty = 1) {
  const row = await dbGet(db, 'SELECT qty FROM inventory WHERE user_id=? AND item=?', [uid, itemId]);
  if (!row || row.qty < qty) return false;
  if (row.qty === qty) {
    await dbRun(db, 'DELETE FROM inventory WHERE user_id=? AND item=?', [uid, itemId]);
  } else {
    await dbRun(db, 'UPDATE inventory SET qty=qty-? WHERE user_id=? AND item=?', [qty, uid, itemId]);
  }
  return true;
}
```

### 1c — Wire loot drops into combat victory handler

Find the combat victory block (around line 990, after `enemyHp <= 0`).
After the existing ash marks drop, add item drops:

```javascript
// Item drops from loot table
const drops = rollLoot(enemy.id);
const dropMessages = [];
for (const { itemId, qty } of drops) {
  await addItemToInventory(db, uid, itemId, qty);
  // Check if this drop satisfies any active quest
  await checkQuestProgress(db, uid, 'item_pickup', itemId, qty);
  const itemName = ITEM_DATA[itemId]?.name || itemId;
  dropMessages.push(`**${itemName}**${qty > 1 ? ` x${qty}` : ''}`);
}

// Check kill-count quests
await checkQuestProgress(db, uid, 'enemy_kill', enemy.id, 1);

// Update the victory message to include drops
const dropText = dropMessages.length
  ? `\n\n*Carried:* ${dropMessages.join(', ')}`
  : '';

return json({
  result: 'victory',
  message: `*${enemy.name} falls.*\n\n${attack.narrative}\n\n**+${xpGain} XP** | **+${lootAsh} Ash Marks**${dropText}`,
  can_advance: !!canAdvance, player_hp: playerHp,
});
```

Also set player_flags for boss kills (used by quest system and NPC flags):
```javascript
if (enemy.is_boss) {
  const bossFlag = `boss_killed_${enemy.id}`;
  await setFlag(db, uid, bossFlag, 1);
  // Floor gate flags
  const floorBossMap = {
    rat_king: 'boss_floor1',
    sporebound_custodian: 'boss_floor2',
    cistern_leviathan: 'boss_floor3',
    broken_regulator: 'boss_floor4',
    ash_heart_custodian: 'boss_floor5',
  };
  if (floorBossMap[enemy.id]) {
    await setFlag(db, uid, floorBossMap[enemy.id], 1);
  }
}
```

---

## STEP 2 — Quest Schema and Core Functions

### 2a — Add quests table to initDb()

```javascript
await dbRun(db, `CREATE TABLE IF NOT EXISTS quests (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  quest_id TEXT NOT NULL,
  npc TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  objective_type TEXT NOT NULL,
  objective_target TEXT NOT NULL,
  objective_qty_required INTEGER DEFAULT 1,
  objective_qty_current INTEGER DEFAULT 0,
  reward_am INTEGER DEFAULT 0,
  reward_item TEXT,
  reward_flag TEXT,
  assigned_at INTEGER NOT NULL,
  completed_at INTEGER,
  UNIQUE(user_id, quest_id)
)`);
```

### 2b — Quest definitions

Add this static quest data. These are the static NPC quest chains:

```javascript
const QUEST_DEFS = {
  // ── Othorion ──────────────────────────────────────────────────
  othorion_q1: {
    npc: 'othorion',
    title: 'Reagent Run — Fungi',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'sewer_fungi',
    objective_qty: 3,
    reward_am: 80,
    reward_item: 'spore_extract',
    reward_flag: null,
    unlock_flag: null,           // available immediately
    sets_flag: 'othorion_q1_done',
    completion_line: "These are the right strain. Pip already knew you'd bring them.",
  },
  othorion_q2: {
    npc: 'othorion',
    title: 'Reagent Run — Deep Ash',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'deep_vent_ash',
    objective_qty: 2,
    reward_am: 200,
    reward_item: null,
    reward_flag: null,
    unlock_flag: 'othorion_q1_done',
    sets_flag: 'othorion_q2_done',
    completion_line: "The ash from the vents is different from the surface ash. You noticed that, yes?",
  },
  othorion_q3: {
    npc: 'othorion',
    title: "The Rat King's Musk",
    type: 'static',
    objective_type: 'collect',
    objective_target: 'rat_king_musk',
    objective_qty: 1,
    reward_am: 150,
    reward_item: null,
    reward_flag: 'othorion_arc_seed',
    unlock_flag: 'othorion_q2_done',
    sets_flag: 'othorion_q3_done',
    completion_line: "The musk has a resonance signature I did not expect. I'll need time with this.",
  },

  // ── Thalara ───────────────────────────────────────────────────
  thalara_q1: {
    npc: 'herbalist',
    title: 'Common Reagents',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'slime_residue',
    objective_qty: 3,
    reward_am: 60,
    reward_item: 'channel_salt',
    reward_flag: null,
    unlock_flag: null,
    sets_flag: 'thalara_q1_done',
    completion_line: "Good. These are harder to find than they should be.",
  },
  thalara_q2: {
    npc: 'herbalist',
    title: 'The Flood Records',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'flood_record_page',
    objective_qty: 1,
    reward_am: 120,
    reward_item: 'deep_antidote',
    reward_flag: 'thalara_arc_seed',
    unlock_flag: 'thalara_q1_done',
    sets_flag: 'thalara_q2_done',
    completion_line: "This name. This date. That's not — how old is this record?",
  },

  // ── Caelir ────────────────────────────────────────────────────
  caelir_q1: {
    npc: 'caelir',
    title: 'Lost Tool',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'worn_tool',
    objective_qty: 1,
    reward_am: 75,
    reward_item: null,
    reward_flag: null,
    unlock_flag: null,
    sets_flag: 'caelir_q1_done',
    completion_line: "Third generation design. Interesting.",
  },
  caelir_q2: {
    npc: 'caelir',
    title: 'Mechanist Scrap',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'crafting_scrap',
    objective_qty: 5,
    reward_am: 180,
    reward_item: null,
    reward_flag: null,
    unlock_flag: 'caelir_q1_done',
    sets_flag: 'caelir_q2_done',
    completion_line: "This is from the lower levels. You went further than I expected.",
  },
  caelir_q3: {
    npc: 'caelir',
    title: 'Heart Pump Fragment',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'heart_pump_fragment',
    objective_qty: 1,
    reward_am: 400,
    reward_item: null,
    reward_flag: 'caelir_arc_advance',
    unlock_flag: 'caelir_q2_done',
    sets_flag: 'caelir_q3_done',
    completion_line: "Where did you find this.",  // period, not question mark — intentional
  },

  // ── Seris ─────────────────────────────────────────────────────
  seris_q1: {
    npc: 'curator',
    title: 'Resonant Scraps',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'drowned_relic',
    objective_qty: 1,
    reward_am: 150,
    reward_item: null,
    reward_flag: 'seris_arc_interest',
    unlock_flag: null,
    sets_flag: 'seris_q1_done',
    completion_line: "This resonates with something I've been mapping. Bring me more.",
  },
  seris_q2: {
    npc: 'curator',
    title: 'Custodian Fragment',
    type: 'static',
    objective_type: 'collect',
    objective_target: 'custodian_core',
    objective_qty: 1,
    reward_am: 300,
    reward_item: null,
    reward_flag: 'seris_arc_1_primed',
    unlock_flag: 'seris_q1_done',
    sets_flag: 'seris_q2_done',
    completion_line: "Her composure shifts — just slightly. This resonates with the pattern I've been mapping.",
  },

  // ── Grommash bounty contracts ─────────────────────────────────
  grommash_b1: {
    npc: 'grommash',
    title: 'Nest Clear',
    type: 'static',
    objective_type: 'kill',
    objective_target: 'rat_king',  // boss kill = nest cleared
    objective_qty: 1,
    reward_am: 100,
    reward_item: null,
    reward_flag: null,
    unlock_flag: null,
    sets_flag: 'grommash_b1_done',
    completion_line: "Vermin nests destabilize the lower passages. You've done the city a service.",
    order_reward: 30,
  },
  grommash_b2: {
    npc: 'grommash',
    title: 'Construct Culling',
    type: 'static',
    objective_type: 'kill_count',
    objective_target: 'gearbound_sentinel',
    objective_qty: 3,
    reward_am: 350,
    reward_item: null,
    reward_flag: null,
    unlock_flag: 'grommash_b1_done',
    sets_flag: 'grommash_b2_done',
    completion_line: "The constructs that have lost their programming are a hazard. Good work.",
    order_reward: 40,
  },
};
```

### 2c — Quest management functions

```javascript
async function getActiveQuest(db, uid, npc) {
  return await dbGet(db,
    "SELECT * FROM quests WHERE user_id=? AND npc=? AND status='active' ORDER BY assigned_at DESC LIMIT 1",
    [uid, npc]);
}

async function assignQuest(db, uid, questId) {
  const def = QUEST_DEFS[questId];
  if (!def) return null;
  // Check unlock flag
  if (def.unlock_flag) {
    const unlocked = await getFlag(db, uid, def.unlock_flag);
    if (!unlocked) return null;
  }
  // Don't re-assign completed quests
  const existing = await dbGet(db,
    'SELECT id FROM quests WHERE user_id=? AND quest_id=?', [uid, questId]);
  if (existing) return null;
  await dbRun(db,
    `INSERT INTO quests (user_id, quest_id, npc, type, status,
      objective_type, objective_target, objective_qty_required,
      reward_am, reward_item, reward_flag, assigned_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
    [uid, questId, def.npc, def.type, 'active',
     def.objective_type, def.objective_target, def.objective_qty,
     def.reward_am, def.reward_item || null, def.reward_flag || null,
     Date.now()]);
  return def;
}

async function checkQuestProgress(db, uid, eventType, target, qty) {
  // Get all active quests that could match this event
  const activeQuests = await dbAll(db,
    "SELECT * FROM quests WHERE user_id=? AND status='active'", [uid]);

  for (const quest of activeQuests) {
    let matches = false;
    if (eventType === 'item_pickup' && quest.objective_type === 'collect'
        && quest.objective_target === target) {
      matches = true;
    }
    if ((eventType === 'enemy_kill') &&
        (quest.objective_type === 'kill' || quest.objective_type === 'kill_count')
        && quest.objective_target === target) {
      matches = true;
    }
    if (!matches) continue;

    const newQty = (quest.objective_qty_current || 0) + qty;
    await dbRun(db,
      'UPDATE quests SET objective_qty_current=? WHERE id=?',
      [newQty, quest.id]);

    // Quest complete?
    if (newQty >= quest.objective_qty_required) {
      await completeQuest(db, uid, quest);
    }
  }
}

async function completeQuest(db, uid, quest) {
  const def = QUEST_DEFS[quest.quest_id];
  if (!def) return;

  // Mark complete
  await dbRun(db,
    "UPDATE quests SET status='complete', completed_at=? WHERE id=?",
    [Date.now(), quest.id]);

  // Remove quest items from inventory (collect type only)
  if (quest.objective_type === 'collect') {
    await removeItemFromInventory(db, uid, quest.objective_target, quest.objective_qty_required);
  }

  // Pay reward
  if (quest.reward_am > 0) {
    await dbRun(db, 'UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?',
      [quest.reward_am, uid]);
  }

  // Give reward item
  if (quest.reward_item) {
    await addItemToInventory(db, uid, quest.reward_item, 1);
  }

  // Set arc flag
  if (quest.reward_flag) {
    await setFlag(db, uid, quest.reward_flag, 1);
  }

  // Set completion flag
  if (def.sets_flag) {
    await setFlag(db, uid, def.sets_flag, 1);
  }

  // Order reward for Grommash bounties
  if (def.order_reward) {
    await updateAlignment(db, uid, 0, def.order_reward);
  }

  // Special cascade for Seris arc completion (ashbound_resonance)
  if (quest.quest_id === 'seris_q2') {
    await setFlag(db, uid, 'seris_arc_1_primed', 1);
  }
}
```

---

## STEP 3 — Quest Auto-Assignment Logic

Quests should be auto-assigned when a player first talks to an NPC, based on
what's available and unlocked. Add this to the `/api/talk` handler, after the
NPC dialogue response is generated but before returning:

```javascript
// Auto-assign the next available quest for this NPC
const npcQuestMap = {
  othorion: ['othorion_q1', 'othorion_q2', 'othorion_q3'],
  herbalist: ['thalara_q1', 'thalara_q2'],
  caelir:   ['caelir_q1', 'caelir_q2', 'caelir_q3'],
  curator:  ['seris_q1', 'seris_q2'],
  grommash: ['grommash_b1', 'grommash_b2'],
};

const npcChain = npcQuestMap[npcId];
if (npcChain) {
  for (const questId of npcChain) {
    const assigned = await assignQuest(db, uid, questId);
    if (assigned) break; // only assign one new quest per conversation
  }
}
```

---

## STEP 4 — Sell Endpoint

```javascript
// POST /api/sell — sell items to a vendor
if (path === '/api/sell' && method === 'POST') {
  const { item_id, qty = 1, npc_id } = await req.json();
  if (!item_id || !npc_id) return err('item_id and npc_id required.', 400);

  const itemDef = ITEM_DATA[item_id];
  if (!itemDef) return err('Unknown item.', 404);
  if (itemDef.value === 0) return err(`${itemDef.name} cannot be sold.`, 400);

  // Check inventory
  const invRow = await dbGet(db, 'SELECT qty FROM inventory WHERE user_id=? AND item=?',
    [uid, item_id]);
  if (!invRow || invRow.qty < qty) {
    return err(`You don't have ${qty > 1 ? qty + 'x ' : ''}${itemDef.name}.`, 400);
  }

  // Sell price is 50% of base value
  const sellPrice = Math.max(1, Math.floor(itemDef.value * 0.5)) * qty;

  await removeItemFromInventory(db, uid, item_id, qty);
  await dbRun(db, 'UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?',
    [sellPrice, uid]);

  // Track curator_items_sold for Seris arc
  if (npc_id === 'curator') {
    const sold = await getFlag(db, uid, 'curator_items_sold');
    await setFlag(db, uid, 'curator_items_sold', (sold || 0) + qty);
  }

  // Seris special reactions to resonant items
  const serisResonantItems = ['custodian_core', 'drowned_relic', 'regulator_core',
                               'cathedral_rune_shard', 'leviathan_scale'];
  let specialMessage = null;
  if (npc_id === 'curator' && serisResonantItems.includes(item_id)) {
    specialMessage = "She examines it carefully before setting it aside. \"Interesting. Keep bringing me things like this.\"";
    await setFlag(db, uid, 'seris_arc_interest', 1);
  }

  return json({
    success: true,
    item: itemDef.name,
    qty,
    earned: sellPrice,
    message: specialMessage,
  });
}

// GET /api/sell/value — check sell value of an item before selling
if (path.startsWith('/api/sell/value/') && method === 'GET') {
  const itemId = path.split('/').pop();
  const itemDef = ITEM_DATA[itemId];
  if (!itemDef) return err('Unknown item.', 404);
  const sellPrice = itemDef.value === 0 ? 0 : Math.max(1, Math.floor(itemDef.value * 0.5));
  return json({ item: itemDef.name, sell_price: sellPrice, sellable: itemDef.value > 0 });
}

// GET /api/quests — player's active and recent quests
if (path === '/api/quests' && method === 'GET') {
  const active = await dbAll(db,
    "SELECT * FROM quests WHERE user_id=? AND status='active' ORDER BY assigned_at DESC",
    [uid]);
  const recent = await dbAll(db,
    "SELECT * FROM quests WHERE user_id=? AND status='complete' ORDER BY completed_at DESC LIMIT 5",
    [uid]);
  // Enrich with def data (title, completion progress)
  const enrich = (q) => {
    const def = QUEST_DEFS[q.quest_id] || {};
    return {
      ...q,
      title: def.title || q.quest_id,
      progress: `${q.objective_qty_current}/${q.objective_qty_required}`,
      npc_display: q.npc.charAt(0).toUpperCase() + q.npc.slice(1),
    };
  };
  return json({ active: active.map(enrich), recent: recent.map(enrich) });
}
```

---

## STEP 5 — Quest Panel UI (index.html)

### HTML

Add to the sidebar, after `#standing-panel` and before `#inv-panel`:

```html
<!-- ── Quest Panel ───────────────────────────────────────────── -->
<div id="quest-panel">
  <div id="quest-title">Tasks</div>
  <div id="quest-list"></div>
</div>
```

### CSS

```css
#quest-panel {
  padding: 14px 16px;
  border-bottom: 1px solid var(--border);
}

#quest-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 8px;
}

#quest-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.quest-item {
  background: var(--panel2);
  border: 1px solid var(--border);
  border-radius: 8px;
  padding: 8px 10px;
}

.quest-item-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 6px;
  margin-bottom: 3px;
}

.quest-item-name {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
  flex: 1;
}

.quest-item-npc {
  font-size: 10px;
  color: var(--muted);
  flex-shrink: 0;
}

.quest-item-progress {
  font-size: 11px;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.quest-item-progress.done {
  color: var(--ok);
}

.quest-empty {
  font-size: 12px;
  color: var(--muted);
  font-style: italic;
}
```

### JavaScript — updateQuests()

Add after `updateStanding()`:

```javascript
async function updateQuests() {
  try {
    const data = await GET('/api/quests');
    const listEl = document.getElementById('quest-list');
    listEl.innerHTML = '';

    if (!data.active || !data.active.length) {
      listEl.innerHTML = '<div class="quest-empty">No active tasks.</div>';
      return;
    }

    data.active.forEach(q => {
      const done = q.objective_qty_current >= q.objective_qty_required;
      const el = document.createElement('div');
      el.className = 'quest-item';
      el.innerHTML = `
        <div class="quest-item-header">
          <span class="quest-item-name">${escapeHtml(q.title)}</span>
          <span class="quest-item-npc">${escapeHtml(q.npc_display)}</span>
        </div>
        <div class="quest-item-progress${done ? ' done' : ''}">
          ${done ? '✓ Ready to turn in' : q.progress}
        </div>
      `;
      listEl.appendChild(el);
    });
  } catch(e) {}
}
```

### Wire into refreshSidebar()

```javascript
async function refreshSidebar() {
  try {
    const [charData, walletData, invData, alignData] = await Promise.all([
      GET('/api/character'),
      GET('/api/wallet'),
      GET('/api/inventory'),
      GET('/api/alignment'),
    ]);
    updateCharPanel(charData);
    updateWallet(walletData);
    updateInventory(invData.items);
    updateStanding(alignData);
    updateQuests();  // ← add (not awaited — non-blocking)
  } catch(e) {}
}
```

---

## STEP 6 — Sell UI in Dialogue

When a player talks to a vendor NPC (othorion, thalara, caelir, curator,
weaponsmith, armorsmith), add a "Sell Items" section to the dialogue panel
that shows sellable inventory with values and a sell button.

Find the `renderTopics()` function or wherever dialogue topics are rendered.
After the topics list, add this sell panel that appears for vendor NPCs:

```javascript
const VENDOR_NPCS = ['othorion', 'herbalist', 'caelir', 'curator', 'weaponsmith', 'armorsmith'];

async function renderSellPanel(npcId) {
  const sellPanelEl = document.getElementById('sell-panel');
  if (!VENDOR_NPCS.includes(npcId)) {
    sellPanelEl.style.display = 'none';
    return;
  }

  try {
    const invData = await GET('/api/inventory');
    // Get raw items (we need item IDs not display strings)
    const rawData = await GET('/api/inventory?raw=1');
    const items = rawData.items || [];

    if (!items.length) {
      sellPanelEl.innerHTML = '<div class="sell-empty">Nothing to sell.</div>';
      sellPanelEl.style.display = '';
      return;
    }

    sellPanelEl.style.display = '';
    sellPanelEl.innerHTML = '<div class="sell-title">Sell</div>';

    for (const item of items) {
      const valData = await GET(`/api/sell/value/${item.id}`);
      if (!valData.sellable) continue;

      const row = document.createElement('div');
      row.className = 'sell-row';
      row.innerHTML = `
        <span class="sell-item-name">${escapeHtml(valData.item)}${item.qty > 1 ? ` x${item.qty}` : ''}</span>
        <span class="sell-item-price">${valData.sell_price * item.qty} AM</span>
        <button class="sell-btn" onclick="doSell('${item.id}', ${item.qty}, '${npcId}', this)">
          Sell
        </button>
      `;
      sellPanelEl.appendChild(row);
    }
  } catch(e) {}
}

async function doSell(itemId, qty, npcId, btn) {
  btn.disabled = true;
  try {
    const result = await POST('/api/sell', { item_id: itemId, qty, npc_id: npcId });
    log(`<em>Sold ${result.item}${result.qty > 1 ? ` x${result.qty}` : ''} for ${result.earned} AM.</em>`);
    if (result.message) log(`<em>${result.message}</em>`);
    await refreshSidebar();
    await renderSellPanel(npcId); // refresh sell panel
  } catch(e) {
    btn.disabled = false;
    log(`<em>${e.message}</em>`);
  }
}
```

**Also add to the backend** — update `/api/inventory` to support `?raw=1`
which returns `[{ id, qty }]` instead of display strings:

```javascript
if (path === '/api/inventory' && method === 'GET') {
  const rows = await dbAll(db, 'SELECT item, qty FROM inventory WHERE user_id=? ORDER BY item', [uid]);
  const raw = url.searchParams.get('raw');
  if (raw) {
    return json({ items: rows.map(r => ({ id: r.item, qty: r.qty })) });
  }
  const items = rows.map(r => {
    const name = ITEM_DATA[r.item]?.name || r.item;
    return r.qty === 1 ? name : `${name} x${r.qty}`;
  });
  return json({ items });
}
```

**Add sell panel HTML** inside `#dialogue-box`, after `#dialogue-topics`:

```html
<div id="sell-panel" style="display:none"></div>
```

**Add sell panel CSS**:
```css
#sell-panel {
  border-top: 1px solid var(--border);
  padding: 10px 0 0;
  margin-top: 8px;
}
.sell-title {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .08em;
  text-transform: uppercase;
  color: var(--muted);
  margin-bottom: 6px;
}
.sell-row {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 0;
  border-bottom: 1px solid rgba(255,255,255,.04);
}
.sell-item-name { flex: 1; font-size: 12px; color: var(--text); }
.sell-item-price { font-size: 12px; color: var(--ok); width: 56px; text-align: right; }
.sell-btn {
  font-size: 11px;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid var(--border);
  background: rgba(255,255,255,.04);
  color: var(--muted);
  cursor: pointer;
}
.sell-empty { font-size: 12px; color: var(--muted); font-style: italic; }
```

**Wire into openDialogue()** — after dialogue loads, call `renderSellPanel(npcId)`.

---

## VERIFICATION CHECKLIST

- [ ] Killing a gutter_rat drops rat_pelt and/or slime_residue in inventory
- [ ] Killing the Rat King drops rat_king_musk (100% chance)
- [ ] Boss kill sets `boss_floor1` flag (check via admin or DB)
- [ ] Talking to Othorion assigns `othorion_q1` (collect 3 sewer_fungi)
- [ ] Quest panel shows active quest with progress (0/3)
- [ ] Picking up sewer_fungi increments quest progress
- [ ] At 3/3, quest panel shows "✓ Ready to turn in"
- [ ] Completing collect quest removes items from inventory, adds reward
- [ ] Talking to Caelir after `caelir_q1_done` auto-assigns `caelir_q2`
- [ ] Sell panel appears in vendor NPC dialogue
- [ ] Selling rat_pelt to Caelir adds 6 AM (12 * 0.5)
- [ ] Ashbound Resonance shows "cannot be sold" error
- [ ] Selling to Seris with resonant item triggers special dialogue line
- [ ] Quest panel updates on refreshSidebar
- [ ] `/api/quests` returns correct active/recent structure

---

## WHAT THIS DOES NOT DO (next passes)

- Dynamic quest generation from sewer conditions (requires cron trigger pass)
- Quest turn-in via explicit dialogue ("I have your items") — currently auto-completes on collect
- Vendor buy stock (player buying items from NPCs) — separate pass
- Corrupted item handling (Seris premium, Veyra refusal) — items pass
- Thalara q2 flood_record_page drop location — needs sewer room inspect handler
  (currently add flood_record_page as a possible drop from drowned_thrall as workaround)
