/**
 * Verasanth — Cloudflare Worker Backend
 * Database: Cloudflare D1 (SQLite-compatible)
 * All game data embedded — no Python imports needed.
 * Design direction: see GAME_DIRECTION.md
 */

import { runAdminCommand } from "./admin.js";
import { WORLD, FIRST_VISIT_INTROS } from "./data/world.js";
import { COMBAT_DATA, FIGHTABLE_LOCATIONS } from "./data/combat.js";
import { RACES } from "./data/races.js";
import { INSTINCTS } from "./data/instincts.js";
import { NPC_LOCATIONS, NPC_NAMES, NPC_TOPICS, BARTENDER_FEE } from "./data/npcs.js";
import { SERIS_NOTICES, FLAVOR_NOTICES, ANONYMOUS_NOTICES, IMPOSSIBLE_TEMPLATES, BOARD_NPC_REACTIONS } from "./data/board.js";
import { SERIS_INTEREST_ITEMS, getSellValue, displayNameToKey, TIER_BASE_VALUES } from "./data/seris.js";
import { VENDOR_STOCK, VENDOR_NPCS, CAELIR_STOCK, VEYRA_STOCK } from "./data/vendor_stock.js";
import { getNPCResponse, boardNPCReaction } from "./services/npc_dialogue.js";
import { statMod, rollDie, maxPlayerHp, randomEnemy, playerAttack, enemyAttack, tickStatusEffects, resolveEnemyTrait, getTraitDamageModifier, getStatusEffectOnHit, getTraitOnHitEffect } from "./services/combat.js";
import { generateItem } from "./services/item_generator.js";
import { getRelationship, setRelationship, getPartyMembers, triggerBetrayalCascade } from "./services/pvp.js";

// ─────────────────────────────────────────────────────────────
// GAME DATA (remaining in index)
// ─────────────────────────────────────────────────────────────

// Sewer depth: five floors (drain_entrance through sump_pit)
const SEWER_LEVEL_1 = ["drain_entrance", "overflow_channel", "broken_pipe_room", "vermin_nest", "workers_alcove", "rusted_gate"];
const SEWER_LEVEL_2 = ["fungal_bloom_chamber", "collapsed_passage", "old_maintenance_room", "echoing_hall", "spore_garden", "cracked_aqueduct"];
const SEWER_LEVEL_3 = ["flooded_hall", "drowned_archive", "submerged_tunnel", "broken_pump_room", "drowned_vault", "sluice_gate"];
const SEWER_LEVEL_4 = ["gear_hall", "steam_vent_corridor", "broken_regulator_chamber", "iron_walkway", "heart_pump", "pressure_valve_shaft"];
const SEWER_LEVEL_5 = ["ash_pillar_hall", "whispering_chamber", "rune_lit_corridor", "cathedral_floor", "ash_heart_chamber", "sump_pit"];

const OLD_SEWER_LOCATIONS = new Set([
  "sewer_upper", "sewer_den", "sewer_channel", "sewer_deep", "sewer_gate",
  "sewer_mid_flooded", "sewer_mid_barracks", "sewer_mid_cistern", "sewer_mid_drain",
  "sewer_deep_threshold", "sewer_deep_vault", "sewer_deep_foundation"
]);

// Boss nodes: when combat starts here and player lacks flag, force this boss. On victory, set flag.
const BOSS_NODES = {
  rusted_gate: { boss_id: "rat_king", flag: "boss_floor1" },
  spore_garden: { boss_id: "sporebound_custodian", flag: "boss_floor2" },
  drowned_vault: { boss_id: "cistern_leviathan", flag: "boss_floor3" },
  broken_regulator_chamber: { boss_id: "broken_regulator", flag: "boss_floor4" },
  ash_heart_chamber: { boss_id: "ash_heart_custodian", flag: "boss_floor5" },
};

// Gate nodes: requires_flag null = always open; otherwise player must have flag to see deeper/down exit
const FLOOR_GATES = {
  rusted_gate:          { requires_flag: null, exit_dir: "deeper", leads_to: "fungal_bloom_chamber" },
  cracked_aqueduct:     { requires_flag: "boss_floor1", exit_dir: "down", leads_to: "flooded_hall" },
  sluice_gate:          { requires_flag: "boss_floor2", exit_dir: "down", leads_to: "gear_hall" },
  pressure_valve_shaft: { requires_flag: "boss_floor3", exit_dir: "down", leads_to: "ash_pillar_hall" },
};

// Story markings: (location, object_id) -> flag. When player inspects, set flag so NPC dialogue can unlock.
const SEWER_STORY_MARKINGS = {
  drain_entrance: { scratched_warnings: "seen_sewer_wall_markings" },
  overflow_channel: { scratched_tally_marks: "seen_sewer_graffiti" },
  rusted_gate: { old_warnings: "seen_sewer_graffiti" },
  fungal_bloom_chamber: { bloom_cluster: "seen_sewer_wall_markings" },
  drowned_archive: { flood_records: "seen_dask_roster" },
  drowned_vault: { artifact_display: "seen_tier2_graffiti" },
  pressure_valve_shaft: { pressure_valve: "seen_rusted_pipe" },
  sump_pit: { ancient_warning: "seen_foundation_dask" },
};

const PROGRESSION_FLAGS = [
  "seen_sewer_wall_markings", "seen_sewer_graffiti", "seen_dask_roster", "seen_tier2_graffiti",
  "seen_rusted_pipe", "seen_foundation_dask", "warned_mid_sewer", "has_seen_market_square",
  "found_foundation_stone", "has_room", "has_seen_awakening", "othorion_trust",
  "seris_arc3_complete",
];

const NOTICEBOARD_NPC_NOTICES = {
  tavern: [
    { id: "npc-tavern-1", title: "House rules", message: "Pay before you sleep. No questions.", player_name: "The City", pinned: 1 },
  ],
  market_square: [
    { id: "npc-ember-1", title: "RATS ATE JORIN", message: "RATS ATE JORIN. DON'T BE JORIN.", player_name: "The City", pinned: 0 },
    { id: "npc-ember-2", title: "", message: "The board has been here longer than the square. Don't think too hard about it.", player_name: "The City", pinned: 0 },
  ],
  sewer_entrance: [
    { id: "npc-sewer-1", title: "WARNING", message: "DON'T GO DOWN. NOT WATER. NOT WATER.", player_name: "The City", pinned: 1 },
  ],
  drain_entrance: [
    { id: "npc-sewer-2", title: "IT HEARS YOU COUNT", message: "KEEP COUNTING.", player_name: "The City", pinned: 0 },
  ],
};

const AWAKENING_ROOM_DESCRIPTION = "The floor is stone. That is the first thing you know — the cold of it against your cheek, the weight of your body on something that does not give. The second thing you know is warmth, coming from somewhere to your left, slow and steady, the way warmth comes from something that has been burning for a very long time.\n\nYou are in a room. There is a hearth. There is a bar. There is a dog near the fire that has lifted its head and is looking at you with eyes that are too still for an animal that has just noticed something unexpected.\n\nBehind the bar, a broad dwarf with burn-scarred braids is already watching you. He does not look surprised. He does not look concerned.\n\nHe looks like he has seen this before.\n\nHe looks like he has been waiting.";

// Point-pool: each stat starts at 5, 28 points to distribute (≈ 3d6 total). Max per stat for future items/equipment.
const STAT_BASE = 5;
const STAT_POOL = 28;
const STAT_MAX = 18;
const STAT_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const STAT_TOTAL_EXPECTED = 6 * STAT_BASE + STAT_POOL; // 58

const STARTING_ITEMS = {
  ember_touched: ["charred_focus_wand", "ash_thread_robe", "ember_charm"],
  hearthborn:    ["simple_mace", "tattered_vestments", "tarnished_holy_symbol"],
  streetcraft:   ["rusted_dagger", "patchwork_cloak", "lockpick_kit"],
  ironblood:     ["worn_longsword", "cracked_shield", "leather_brigandine"],
  shadowbound:   ["serrated_dagger", "shadow_cloak", "smoke_vial"],
  warden:        ["iron_spear", "reinforced_shield", "guards_mail"],
};

function validatePointBuy(stats) {
  let sum = 0;
  for (const key of STAT_KEYS) {
    const v = Number(stats[key]);
    if (!Number.isInteger(v) || v < STAT_BASE || v > STAT_MAX)
      return { ok: false, message: `Each stat must be an integer between ${STAT_BASE} and ${STAT_MAX}.` };
    sum += v;
  }
  if (sum !== STAT_TOTAL_EXPECTED)
    return { ok: false, message: `Stats must use the full pool: total ${sum} should be ${STAT_TOTAL_EXPECTED} (6×${STAT_BASE} base + ${STAT_POOL} points).` };
  return { ok: true };
}

/** Returns 'weapon' | 'armor' | 'shield' | null for equippable items. */
function getItemSlot(itemId, displayName) {
  const name = (displayName || itemId || "").toLowerCase();
  const vendorWeapon = CAELIR_STOCK.find(e => e.id === itemId);
  if (vendorWeapon) return "weapon";
  const vendorArmor = VEYRA_STOCK.find(e => e.id === itemId);
  if (vendorArmor) return name.includes("shield") ? "shield" : "armor";
  if (name.includes("shield")) return "shield";
  const weaponWords = ["blade", "knife", "hatchet", "spike", "club", "shard", "hook", "longsword", "dagger", "shortbow", "spear", "mace", "sword", "cleaver", "crossbow", "glaive", "maul", "greatsword", "war-axe", "longbow", "pike", "warhammer", "executioner", "reaper", "soulbow", "lance", "crusher"];
  if (weaponWords.some(w => name.includes(w))) return "weapon";
  const armorWords = ["rags", "wrap", "scraps", "patchwork", "hide", "leather", "jerkin", "coat", "vest", "mail", "padding", "armor", "cuirass", "hauberk", "plate", "brigandine", "carapace", "shell", "mantle", "aegis", "shroud", "robe", "vestments", "cloak", "brigandine"];
  if (armorWords.some(w => name.includes(w))) return "armor";
  return null;
}

// ─────────────────────────────────────────────────────────────

function formatBoard(playerName, depthTier, seed) {
  const rng = seededRandom(seed);
  const lines = [];

  // Seris notice
  const pool = depthTier >= 2 ? SERIS_NOTICES.late
             : depthTier >= 1 ? SERIS_NOTICES.mid
             : SERIS_NOTICES.early;
  const serisNotice = pool[Math.floor(rng() * pool.length)];
  lines.push(`**${serisNotice.title}**\n${serisNotice.body}`);
  lines.push("─────────");

  // 2 flavor notices
  const f1 = FLAVOR_NOTICES[Math.floor(rng() * FLAVOR_NOTICES.length)];
  lines.push(`**${f1.title}**\n${f1.body}`);
  lines.push("─────────");
  const f2 = FLAVOR_NOTICES[Math.floor(rng() * FLAVOR_NOTICES.length)];
  if (f2.title !== f1.title) {
    lines.push(`**${f2.title}**\n${f2.body}`);
    lines.push("─────────");
  }

  // Anonymous (50%)
  if (rng() > 0.5) {
    const anon = ANONYMOUS_NOTICES[Math.floor(rng() * ANONYMOUS_NOTICES.length)];
    lines.push(`─────────\n${anon}\n─────────`);
  }

  // Impossible (2%)
  if (playerName && rng() < 0.02) {
    const tmpl = IMPOSSIBLE_TEMPLATES[Math.floor(rng() * IMPOSSIBLE_TEMPLATES.length)];
    lines.push(`\n${tmpl.replace(/\{name\}/g, playerName)}`);
  }

  return lines.join("\n\n");
}

function seededRandom(seed) {
  let s = typeof seed === 'number' ? seed : hashCode(String(seed));
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}

// ─────────────────────────────────────────────────────────────
// COMMUNE RESPONSES
// ─────────────────────────────────────────────────────────────

const COMMUNE_FLAVORS = [
  "*You kneel. The air shifts.*\n\n*Something ancient takes notice. It does not speak. You are not sure it communicates in words.*",
  "*A warmth settles behind your sternum — like a hand resting there, very still.*\n\n*You feel watched, but not judged. After a moment it withdraws.*",
  "*A whisper brushes the edge of your thoughts — too soft to understand, too deliberate to be random.*",
  "*Your instinct echo stirs as you approach — as if answering a distant call it has been waiting for.*",
  "*The candles do not flicker when you approach. The silence is attentive in a way silence should not be.*",
  "*The altar is smooth and warm under your hands. For a moment — just a moment — you have the impression you have stood here before. Not in this life.*",
];

// ─────────────────────────────────────────────────────────────
// DATABASE HELPERS (D1 — SQLite-compatible)
// ─────────────────────────────────────────────────────────────

async function dbGet(db, sql, params = []) {
  const stmt = db.prepare(sql);
  return await stmt.bind(...params).first();
}

async function dbAll(db, sql, params = []) {
  const stmt = db.prepare(sql);
  const result = await stmt.bind(...params).all();
  return result.results || [];
}

async function dbRun(db, sql, params = []) {
  const stmt = db.prepare(sql);
  return await stmt.bind(...params).run();
}

// Session auth
async function getUid(db, request) {
  const auth = request.headers.get("Authorization") || "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7).trim();
  const row = await dbGet(db, "SELECT user_id FROM sessions WHERE token=?", [token]);
  return row ? row.user_id : null;
}

// Flags
async function getFlag(db, uid, flag, def = 0) {
  const row = await dbGet(db, "SELECT value FROM player_flags WHERE user_id=? AND flag=?", [uid, flag.toLowerCase()]);
  return row ? Number(row.value) : def;
}

async function setFlag(db, uid, flag, value = 1) {
  await dbRun(db,
    "INSERT INTO player_flags(user_id,flag,value) VALUES(?,?,?) ON CONFLICT(user_id,flag) DO UPDATE SET value=excluded.value",
    [uid, flag.toLowerCase(), Number(value)]
  );
}

// Player sheet
async function getPlayerSheet(db, uid) {
  return await dbGet(db, `
    SELECT p.user_id, p.location,
           p.mercy_score, p.order_score, p.crime_heat, p.archetype,
           c.name, c.race, c.instinct,
           c.strength, c.dexterity, c.constitution,
           c.intelligence, c.wisdom, c.charisma,
           c.stats_set, c.alignment_morality, c.alignment_order,
           c.ash_marks, c.ember_shards, c.soul_coins,
           c.xp, c.class_stage, c.current_hp
    FROM players p
    LEFT JOIN characters c ON c.user_id=p.user_id
    WHERE p.user_id=?`, [uid]);
}

// HP
async function getPlayerHp(db, uid, row) {
  const con = row ? row.constitution : 10;
  const maxHp = maxPlayerHp(con);
  const cur = row && row.current_hp > 0 ? row.current_hp : maxHp;
  return { current: cur, max: maxHp };
}

// Death penalty: 20% Ash Marks drop, min 1 if any
async function processDeathDrop(db, uid, deathLocation) {
  const row = await dbGet(db, "SELECT ash_marks FROM characters WHERE user_id=?", [uid]);
  const ash = Number(row?.ash_marks ?? 0);
  if (ash <= 0) return { ashLost: 0 };
  const ashLost = Math.max(1, Math.floor(ash * 0.2));
  await dbRun(db, "UPDATE characters SET ash_marks = ash_marks - ? WHERE user_id = ?", [ashLost, uid]);
  const now = Date.now();
  await dbRun(db, "INSERT INTO death_drops (owner_id, location, ash_marks, dropped_at) VALUES (?, ?, ?, ?)", [uid, deathLocation, ashLost, now]);
  return { ashLost };
}

// Unclaimed death drops at location (non-expired; 30 min)
const DEATH_DROP_EXPIRY_MS = 1800000;
async function getUnclaimedDropsAtLocation(db, locationId) {
  const cutoff = Date.now() - DEATH_DROP_EXPIRY_MS;
  return await dbAll(db, "SELECT id, ash_marks FROM death_drops WHERE location=? AND claimed_by IS NULL AND dropped_at>? ORDER BY id ASC", [locationId, cutoff]);
}

// Presence (chat: "recently active" for whispers)
async function updateLastSeen(db, uid) {
  await dbRun(db, `UPDATE players SET last_seen = unixepoch('now') * 1000 WHERE user_id = ?`, [uid]);
}

// Chat: sanitize message (strip HTML, trim, max length; allow *italics*)
const CHAT_MESSAGE_MAX_LEN = 280;
function sanitizeChatMessage(text) {
  if (text == null || typeof text !== "string") return "";
  const stripped = text.replace(/<[^>]*>/g, "").trim();
  return stripped.slice(0, CHAT_MESSAGE_MAX_LEN);
}

// Alignment system (Phase 1)
function computeArchetype(mercy, order, heat) {
  if (heat >= 16) return "Ash Wraith";
  if (heat >= 11) return "Dread";
  if (heat >= 7) return "Butcher";
  if (heat >= 4) return "Killer";
  if (heat >= 1) return "Ruffian";

  const mercyHigh = mercy >= 60;
  const mercyLow = mercy <= -60;
  const orderHigh = order >= 60;
  const orderLow = order <= -60;

  if (mercyHigh && orderHigh) return "Protector";
  if (mercyHigh && orderLow) return "Vigilante";
  if (mercyHigh) return "Wanderer";
  if (mercyLow && orderHigh) return "Mercenary";
  if (mercyLow && orderLow) return "Butcher";
  if (mercyLow) return "Predator";
  if (orderHigh) return "Enforcer";
  if (orderLow) return "Cutpurse";
  return "Survivor";
}

const ALIGN_INSTINCT_BIAS = {
  hearthborn: [1, 0],
  ember_touched: [0, 0],
  ironblood: [0, 0],
  streetcraft: [0, -1],
  shadowbound: [0, 0],
  warden: [0, 0],
};

async function updateAlignment(db, uid, mercyDelta, orderDelta, instinct = "") {
  const [mb, ob] = ALIGN_INSTINCT_BIAS[instinct] || [0, 0];
  mercyDelta += mb;
  orderDelta += ob;
  const row = await dbGet(db, "SELECT mercy_score, order_score, crime_heat FROM players WHERE user_id=?", [uid]);
  if (!row) return;
  const newMercy = Math.max(-200, Math.min(200, (row.mercy_score || 0) + mercyDelta));
  const newOrder = Math.max(-200, Math.min(200, (row.order_score || 0) + orderDelta));
  const archetype = computeArchetype(newMercy, newOrder, row.crime_heat || 0);
  await dbRun(db, "UPDATE players SET mercy_score=?, order_score=?, archetype=? WHERE user_id=?", [newMercy, newOrder, archetype, uid]);
}

async function addCrimeHeat(db, uid, heat, crimeType, opts = {}) {
  const { mercyChange = 0, orderChange = 0, location = null, victimId = null } = opts;
  await dbRun(db, "UPDATE players SET crime_heat = crime_heat + ? WHERE user_id=?", [heat, uid]);
  const now = Math.floor(Date.now() / 1000);
  await dbRun(db, `INSERT INTO crime_log (user_id, crime_type, heat_added, mercy_change, order_change, location, victim_id, created_at)
    VALUES (?,?,?,?,?,?,?,?)`, [uid, crimeType, heat, mercyChange, orderChange, location, victimId, now]);
  const row = await dbGet(db, "SELECT mercy_score, order_score, crime_heat FROM players WHERE user_id=?", [uid]);
  if (row && (mercyChange !== 0 || orderChange !== 0)) {
    const newMercy = Math.max(-200, Math.min(200, (row.mercy_score || 0) + mercyChange));
    const newOrder = Math.max(-200, Math.min(200, (row.order_score || 0) + orderChange));
    const archetype = computeArchetype(newMercy, newOrder, row.crime_heat || 0);
    await dbRun(db, "UPDATE players SET mercy_score=?, order_score=?, archetype=? WHERE user_id=?", [newMercy, newOrder, archetype, uid]);
  }
}

async function decayAlignment(db, uid) {
  const row = await dbGet(db, "SELECT mercy_score, last_decay FROM players WHERE user_id=?", [uid]);
  if (!row) return;
  const now = Date.now();
  const lastDecay = row.last_decay || now;
  const hoursPassed = (now - lastDecay) / (1000 * 60 * 60);
  if (hoursPassed < 0.1) return; // throttle: ~6 min minimum between decays

  const decayAmount = Math.floor(hoursPassed * 5);
  if (decayAmount === 0) return;

  const mercy = row.mercy_score || 0;
  const mercyDecay = mercy > 0 ? -Math.min(decayAmount, mercy) : Math.min(decayAmount, Math.abs(mercy));
  if (mercyDecay !== 0) {
    const newMercy = Math.max(-200, Math.min(200, mercy + mercyDecay));
    const alignRow = await dbGet(db, "SELECT order_score, crime_heat FROM players WHERE user_id=?", [uid]);
    const archetype = computeArchetype(newMercy, alignRow?.order_score || 0, alignRow?.crime_heat || 0);
    await dbRun(db, "UPDATE players SET mercy_score=?, archetype=?, last_decay=? WHERE user_id=?", [newMercy, archetype, now, uid]);
  } else {
    await dbRun(db, "UPDATE players SET last_decay=? WHERE user_id=?", [now, uid]);
  }
}

async function getPlayerAlignment(db, uid) {
  return await dbGet(db, "SELECT mercy_score, order_score, crime_heat, archetype FROM players WHERE user_id=?", [uid]);
}

const GROMMASH_READS = {
  Protector: "Someone the city can rely on.",
  Wanderer: "Restrained but unpredictable.",
  Vigilante: "Good intentions. Wrong methods.",
  Enforcer: "Useful. Ruthless. Ordered.",
  Survivor: "Neither asset nor threat. Yet.",
  Cutpurse: "Small chaos. Adds up.",
  Mercenary: "Dangerous but contained.",
  Predator: "A threat to stability.",
  Butcher: "The city will correct this.",
  Ruffian: "Gives warnings.",
  Killer: "Begins tracking.",
  Dread: "Hunts actively.",
  "Ash Wraith": "He doesn't speak. He moves.",
};

function buildAlignmentUI(mercy, order, heat, archetype) {
  mercy = mercy ?? 0;
  order = order ?? 0;
  heat = heat ?? 0;
  archetype = archetype ?? "Survivor";
  const mercyBar = Math.round(5 + (mercy / 200) * 5);
  const orderBar = Math.round(5 + (order / 200) * 5);
  const heatBar = heat >= 16 ? 10 : heat >= 11 ? 8 : heat >= 7 ? 6 : heat >= 4 ? 4 : heat >= 1 ? 2 : 0;
  const mercyLabel = mercy >= 60 ? "Restrained" : mercy <= -60 ? "Predatory" : "Neutral";
  const orderLabel = order >= 60 ? "Ordered" : order <= -60 ? "Chaotic" : "Neutral";
  const heatLabel = heat >= 16 ? "Ash Wraith" : heat >= 11 ? "Dread" : heat >= 7 ? "Butcher" : heat >= 4 ? "Killer" : heat >= 1 ? "Ruffian" : "Clean";
  return {
    archetype,
    grommash_read: GROMMASH_READS[archetype] || "Neither asset nor threat. Yet.",
    mercy_label: mercyLabel,
    order_label: orderLabel,
    heat_label: heatLabel,
    mercy_bar: Math.max(0, Math.min(10, mercyBar)),
    order_bar: Math.max(0, Math.min(10, orderBar)),
    heat_bar: heatBar,
  };
}

// ─────────────────────────────────────────────────────────────
// DB INIT
// ─────────────────────────────────────────────────────────────

async function initDb(db) {
  await dbRun(db, `CREATE TABLE IF NOT EXISTS players (
    user_id INTEGER PRIMARY KEY, location TEXT NOT NULL DEFAULT 'tavern')`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS characters (
    user_id INTEGER PRIMARY KEY REFERENCES players(user_id),
    name TEXT NOT NULL, race TEXT NOT NULL, instinct TEXT,
    strength INTEGER DEFAULT 10, dexterity INTEGER DEFAULT 10,
    constitution INTEGER DEFAULT 10, intelligence INTEGER DEFAULT 10,
    wisdom INTEGER DEFAULT 10, charisma INTEGER DEFAULT 10,
    stats_set INTEGER DEFAULT 0,
    alignment_morality INTEGER DEFAULT 0, alignment_order INTEGER DEFAULT 0,
    ash_marks INTEGER DEFAULT 0, ember_shards INTEGER DEFAULT 0, soul_coins INTEGER DEFAULT 0,
    xp INTEGER DEFAULT 0, class_stage INTEGER DEFAULT 0, current_hp INTEGER DEFAULT 0)`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS player_flags (
    user_id INTEGER NOT NULL REFERENCES players(user_id),
    flag TEXT NOT NULL, value INTEGER DEFAULT 1,
    PRIMARY KEY(user_id, flag))`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS inventory (
    user_id INTEGER NOT NULL REFERENCES players(user_id),
    item TEXT NOT NULL, qty INTEGER DEFAULT 1,
    PRIMARY KEY(user_id, item))`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS combat_state (
    user_id INTEGER PRIMARY KEY REFERENCES players(user_id),
    state_json TEXT NOT NULL)`);
  await dbRun(db, `CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES players(user_id))`);
    await dbRun(db, `CREATE TABLE IF NOT EXISTS accounts (
      username TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      user_id INTEGER NOT NULL REFERENCES players(user_id))`);

    // Chat system (Phase 1)
    await dbRun(db, `CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      channel TEXT NOT NULL,
      location TEXT,
      user_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      deleted INTEGER DEFAULT 0)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_chat_channel ON chat_messages(channel, created_at DESC)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_chat_location ON chat_messages(location, created_at DESC)`);

    await dbRun(db, `CREATE TABLE IF NOT EXISTS whispers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_user_id INTEGER NOT NULL,
      from_name TEXT NOT NULL,
      to_user_id INTEGER NOT NULL,
      to_name TEXT NOT NULL,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      read INTEGER DEFAULT 0)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_whisper_to ON whispers(to_user_id, created_at DESC)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_whisper_from ON whispers(from_user_id, created_at DESC)`);

    await dbRun(db, `CREATE TABLE IF NOT EXISTS noticeboards (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      location TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      player_name TEXT NOT NULL,
      title TEXT,
      message TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      expires_at INTEGER,
      pinned INTEGER DEFAULT 0,
      deleted INTEGER DEFAULT 0)`);
    await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_noticeboard_location ON noticeboards(location, created_at DESC)`);

    try {
      await dbRun(db, `ALTER TABLE players ADD COLUMN last_seen INTEGER`);
    } catch (_) {
      // Column already exists on re-run
    }

    // Item system (Phase 1) — add columns for tier, corrupted, curse, etc.
    try { await dbRun(db, `ALTER TABLE inventory ADD COLUMN tier INTEGER DEFAULT 1`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE inventory ADD COLUMN corrupted INTEGER DEFAULT 0`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE inventory ADD COLUMN curse TEXT`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE inventory ADD COLUMN curse_identified INTEGER DEFAULT 0`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE inventory ADD COLUMN special_property TEXT`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE inventory ADD COLUMN display_name TEXT`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE inventory ADD COLUMN equipped INTEGER DEFAULT 0`); } catch (_) {}

    await dbRun(db, `CREATE TABLE IF NOT EXISTS equipment_slots (
      user_id INTEGER NOT NULL,
      slot TEXT NOT NULL,
      item TEXT NOT NULL,
      PRIMARY KEY (user_id, slot)
    )`);

    // PvPvE system (Phase 1)
    await dbRun(db, `CREATE TABLE IF NOT EXISTS player_relationships (
      player_a INTEGER NOT NULL,
      player_b INTEGER NOT NULL,
      state TEXT DEFAULT 'neutral',
      trust_level TEXT DEFAULT 'stranger',
      trust_points INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(player_a, player_b),
      CHECK(player_a < player_b)
    )`);
    await dbRun(db, `CREATE TABLE IF NOT EXISTS party_invites (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      inviter_id INTEGER NOT NULL,
      target_id INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(inviter_id, target_id)
    )`);
    await dbRun(db, `CREATE TABLE IF NOT EXISTS pvp_state (
      user_id INTEGER PRIMARY KEY REFERENCES players(user_id),
      downed_until INTEGER DEFAULT 0,
      downed_by INTEGER,
      created_at INTEGER,
      updated_at INTEGER
    )`);
    try { await dbRun(db, `CREATE INDEX IF NOT EXISTS idx_party_invites_target ON party_invites(target_id)`); } catch (_) {}

    // Alignment system (Phase 1)
    try { await dbRun(db, `ALTER TABLE players ADD COLUMN mercy_score INTEGER DEFAULT 0`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE players ADD COLUMN order_score INTEGER DEFAULT 0`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE players ADD COLUMN crime_heat INTEGER DEFAULT 0`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE players ADD COLUMN archetype TEXT DEFAULT 'Survivor'`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE players ADD COLUMN last_decay INTEGER`); } catch (_) {}
    await dbRun(db, `CREATE TABLE IF NOT EXISTS crime_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      crime_type TEXT NOT NULL,
      heat_added INTEGER NOT NULL,
      mercy_change INTEGER DEFAULT 0,
      order_change INTEGER DEFAULT 0,
      location TEXT,
      victim_id INTEGER,
      created_at INTEGER NOT NULL
    )`);
    await dbRun(db, `CREATE TABLE IF NOT EXISTS bounties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      target_id INTEGER NOT NULL,
      poster_id INTEGER,
      reason TEXT,
      reward INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      claimed_by INTEGER,
      posted_at INTEGER NOT NULL,
      expires_at INTEGER,
      location TEXT DEFAULT 'wardens_post'
    )`);
    await dbRun(db, `CREATE TABLE IF NOT EXISTS sentences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      crime_tier TEXT NOT NULL,
      duration_seconds INTEGER NOT NULL,
      started_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL,
      escaped INTEGER DEFAULT 0,
      escape_attempts INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0
    )`);

    // Death penalty: Ash Marks drop on death
    await dbRun(db, `CREATE TABLE IF NOT EXISTS death_drops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      location TEXT NOT NULL,
      ash_marks INTEGER DEFAULT 0,
      dropped_at INTEGER NOT NULL,
      claimed_by INTEGER,
      claimed_at INTEGER
    )`);

    // One-time migration: seed mercy_score/order_score from characters
    await dbRun(db, `CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)`);
    const migrated = await dbGet(db, "SELECT 1 FROM _migrations WHERE name=?", ["alignment_v1"]);
    if (!migrated) {
      const chars = await dbAll(db, "SELECT user_id, alignment_morality, alignment_order FROM characters");
      for (const c of chars) {
        const mercy = Math.max(-200, Math.min(200, (c.alignment_morality || 0) * 2));
        const order = Math.max(-200, Math.min(200, (c.alignment_order || 0) * 2));
        const align = await dbGet(db, "SELECT crime_heat FROM players WHERE user_id=?", [c.user_id]);
        const heat = align?.crime_heat || 0;
        const archetype = computeArchetype(mercy, order, heat);
        await dbRun(db, "UPDATE players SET mercy_score=?, order_score=?, archetype=? WHERE user_id=?", [mercy, order, archetype, c.user_id]);
      }
      await dbRun(db, "INSERT OR IGNORE INTO _migrations (name) VALUES (?)", ["alignment_v1"]);
    }
    const hpMigrated = await dbGet(db, "SELECT 1 FROM _migrations WHERE name=?", ["hp_formula_v1"]);
    if (!hpMigrated) {
      await dbRun(db, "UPDATE characters SET current_hp = 0");
      await dbRun(db, "INSERT OR IGNORE INTO _migrations (name) VALUES (?)", ["hp_formula_v1"]);
    }
}

// ─────────────────────────────────────────────────────────────
// RESPONSE HELPERS
// ─────────────────────────────────────────────────────────────

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Key",
    },
  });
}

function err(msg, status = 400) {
  return json({ error: msg, detail: msg }, status);
}

// ─────────────────────────────────────────────────────────────
// PASSWORD HASHING (simple SHA-256 — fine for this game)
// ─────────────────────────────────────────────────────────────
async function hashPassword(password) {
  const enc = new TextEncoder();
  const data = enc.encode(String(password));
  const digest = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(digest);
  let hex = "";
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, "0");
  }
  return hex;
}

// ─────────────────────────────────────────────────────────────
// ROUTER
// ─────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Admin-Key",
        },
      });
    }

    const url  = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    const requestForAssets = request.clone();
    let body = {};
    if (method === "POST") {
      try { body = await request.json(); } catch { body = {}; }
    }

    // GET /admin → serve admin panel (admin.html)
    if (path === "/admin" && method === "GET" && env.ASSETS) {
      const adminRequest = new Request(new URL("/admin.html", request.url), { method: "GET", headers: request.headers });
      const adminResponse = await env.ASSETS.fetch(adminRequest);
      if (adminResponse.status !== 404) return adminResponse;
    }

    // GET /api/character/flags (before ASSETS so it is not 404'd by static lookup)
    if (path === "/api/character/flags" && method === "GET") {
      const db = env.DB;
      await initDb(db);
      const userId = await getUid(db, request);
      if (!userId) return err("Unauthorized.", 401);
      const rows = await dbAll(db, "SELECT flag, value FROM player_flags WHERE user_id=?", [userId]);
      const out = {};
      rows.forEach((r) => (out[r.flag] = r.value));
      return json(out);
    }

    // Static assets first (no auth, no DB)
    if (env.ASSETS) {
      const asset = await env.ASSETS.fetch(requestForAssets);
      if (asset.status !== 404) return asset;
    }

    if (path.startsWith("/api")) {
      const db = env.DB;
      await initDb(db);
      // ── Auth: Register ──
if (path === "/api/register" && method === "POST") {
  const { username, password } = body;
  if (!username || !password) return err("Username and password required.", 400);

  const normalizedUsername = String(username).trim().toLowerCase();
  if (normalizedUsername.length < 2) return err("Username too short.");
  if (String(password).length < 4) return err("Password too short.");

  const existing = await dbGet(db,
    "SELECT 1 FROM accounts WHERE username=?",
    [normalizedUsername]
  );
  if (existing) return err("Username already taken.");

  const uid = Math.floor(Math.random() * 900_000_000) + 100_000_000;
  const token = crypto.randomUUID();

  await dbRun(db, "INSERT INTO players(user_id,location) VALUES(?,?)", [uid, "tavern"]);
  await dbRun(db, `INSERT INTO characters(user_id,name,race,strength,dexterity,constitution,
    intelligence,wisdom,charisma,ash_marks) VALUES(?,?,?,10,10,10,10,10,10,0)`,
    [uid, "", "human"]);
  await dbRun(db, "INSERT INTO sessions(token,user_id) VALUES(?,?)", [token, uid]);

  const pwHash = await hashPassword(password);
  await dbRun(db,
    "INSERT INTO accounts(username,password_hash,user_id) VALUES(?,?,?)",
    [normalizedUsername, pwHash, uid]
  );

  return json({ token, user_id: uid });
}

// ── Auth: Login ──
if (path === "/api/login" && method === "POST") {
  const { username, password } = body;
  if (!username || !password) return err("Username and password required.", 400);

  const normalizedUsername = String(username).trim().toLowerCase();
  const row = await dbGet(db,
    "SELECT user_id, password_hash FROM accounts WHERE username=?",
    [normalizedUsername]
  );
  if (!row || !row.password_hash) return err("Invalid login.", 401);

  const pwHash = await hashPassword(password);
  if (pwHash !== row.password_hash) return err("Invalid login.", 401);

  const token = crypto.randomUUID();
  await dbRun(db,
    "INSERT INTO sessions(token,user_id) VALUES(?,?) ON CONFLICT(token) DO UPDATE SET user_id=excluded.user_id",
    [token, row.user_id]
  );

  return json({ token, user_id: row.user_id });
}

// ── POST: Character reset (self or other via secret) ──
if (path === "/api/character/reset" && method === "POST") {
  let targetUid;
  const usernameParam = body.username != null && String(body.username).trim() !== "";
  if (usernameParam) {
    const secret = request.headers.get("X-Reset-Secret") || "";
    if (!env.ADMIN_SECRET || secret !== env.ADMIN_SECRET) return err("Forbidden.", 403);
    const normalized = String(body.username).trim().toLowerCase();
    const acc = await dbGet(db, "SELECT user_id FROM accounts WHERE username=?", [normalized]);
    if (!acc) return err("User not found.", 404);
    targetUid = acc.user_id;
  } else {
    const uidFromAuth = await getUid(db, request);
    if (!uidFromAuth) return err("Unauthorized.", 401);
    targetUid = uidFromAuth;
  }
  await dbRun(db, "UPDATE players SET location=?, mercy_score=0, order_score=0, crime_heat=0, archetype='Survivor', last_decay=NULL WHERE user_id=?", ["tavern", targetUid]);
  await dbRun(db, `UPDATE characters SET instinct=NULL, strength=5, dexterity=5, constitution=5, intelligence=5, wisdom=5, charisma=5, stats_set=0,
    alignment_morality=0, alignment_order=0, ash_marks=0, ember_shards=0, soul_coins=0, xp=0, class_stage=0, current_hp=0 WHERE user_id=?`, [targetUid]);
  await dbRun(db, "DELETE FROM player_flags WHERE user_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM equipment_slots WHERE user_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM inventory WHERE user_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM pvp_state WHERE user_id=?", [targetUid]);
  return json({ ok: true, message: "Character reset. Reload to see True Welcome." });
}

// ── POST: Admin command ──
if (path === "/api/admin/command" && method === "POST") {
  const adminKey = request.headers.get("X-Admin-Key") || "";
  console.log('ENV SECRET:', JSON.stringify(env.ADMIN_SECRET));
  console.log('RECEIVED KEY:', JSON.stringify(adminKey));
  if (!env.ADMIN_SECRET || adminKey !== env.ADMIN_SECRET) {
    return json({ error: "Unauthorized." }, 401);
  }
  const command = body.command;
  const params = body.params || {};
  const adminEnv = {
    ...env,
    WORLD,
    getFlag: (uid, flag, def) => getFlag(db, uid, flag, def),
    setFlag: (uid, flag, value) => setFlag(db, uid, flag, value),
  };
  const result = await runAdminCommand(db, adminEnv, command, params);
  return json(result);
}

    // ── All routes below require auth ──
    const uid = await getUid(db, request);
    if (!uid && path !== "/api/data/races" && path !== "/api/data/instincts") {
      if (!path.startsWith("/api/data/")) return err("Unauthorized.", 401);
    }
    if (uid) {
      await updateLastSeen(db, uid);
      await decayAlignment(db, uid);
      const now = Math.floor(Date.now() / 1000);
      const downed = await dbGet(db, "SELECT downed_until FROM pvp_state WHERE user_id=? AND downed_until>0 AND downed_until<?", [uid, now]);
      if (downed) {
        const row = await getPlayerSheet(db, uid);
        await processDeathDrop(db, uid, row?.location || "tavern");
        await dbRun(db, "UPDATE characters SET current_hp=0 WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE players SET location='tavern' WHERE user_id=?", [uid]);
        const maxHp = maxPlayerHp(row?.constitution || 10);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [maxHp, uid]);
        const dc = await getFlag(db, uid, "death_count");
        await setFlag(db, uid, "death_count", dc + 1);
        await setFlag(db, uid, "just_respawned", 1);
        await dbRun(db, "INSERT INTO pvp_state (user_id, downed_until, downed_by, created_at, updated_at) VALUES (?, 0, NULL, ?, ?) ON CONFLICT(user_id) DO UPDATE SET downed_until=0, downed_by=NULL, updated_at=excluded.updated_at", [uid, now, now]);
      }
    }

    // ── GET: Character ──
    if (path === "/api/character" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const hp = await getPlayerHp(db, uid, row);
      const alignment_ui = buildAlignmentUI(row.mercy_score, row.order_score, row.crime_heat, row.archetype);
      return json({ ...row, max_hp: hp.max, alignment_ui });
    }

    if (path === "/api/alignment" && method === "GET") {
      const align = await getPlayerAlignment(db, uid);
      if (!align) return err("No character.", 404);
      return json(buildAlignmentUI(align.mercy_score, align.order_score, align.crime_heat, align.archetype));
    }

    // ── POST: Choose instinct ──
    if (path === "/api/character/instinct" && method === "POST") {
      const { instinct } = body;
      if (!INSTINCTS[instinct]) return err("Invalid instinct.");
      const row = await dbGet(db, "SELECT instinct FROM characters WHERE user_id=?", [uid]);
      if (!row) return err("No character.", 404);
      if (row.instinct) return err("Instinct already chosen.");
      await dbRun(db, "UPDATE characters SET instinct=? WHERE user_id=?", [instinct, uid]);
      return json({ instinct, label: INSTINCTS[instinct].label, ok: true });
    }

    // ── POST: Complete character (race + instinct + name + base stats → final stats + starting items) ──
    if (path === "/api/character/complete" && method === "POST") {
      const { race: raceKey, instinct: instinctKey, name: characterName, stats: baseStatsBody } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.stats_set) return err("Character already complete.", 400);
      if (!RACES[raceKey]) return err("Unknown race.", 400);
      if (!INSTINCTS[instinctKey]) return err("Invalid instinct.", 400);

      const nameTrimmed = characterName != null ? String(characterName).trim() : (row.name || "");
      if (nameTrimmed.length < 2) return err("Name too short.", 400);

      const baseStats = baseStatsBody && typeof baseStatsBody === "object"
        ? {
            strength: Number(baseStatsBody.strength) || 10,
            dexterity: Number(baseStatsBody.dexterity) || 10,
            constitution: Number(baseStatsBody.constitution) || 10,
            intelligence: Number(baseStatsBody.intelligence) || 10,
            wisdom: Number(baseStatsBody.wisdom) || 10,
            charisma: Number(baseStatsBody.charisma) || 10,
          }
        : { strength: 10, dexterity: 10, constitution: 10, intelligence: 10, wisdom: 10, charisma: 10 };

      const baseSum = baseStats.strength + baseStats.dexterity + baseStats.constitution +
        baseStats.intelligence + baseStats.wisdom + baseStats.charisma;
      if (baseSum !== 60) return err("Stats must sum to 60 (6×5 base + 30 points).", 400);
      const STAT_KEYS_COMPLETE = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
      for (const k of STAT_KEYS_COMPLETE) {
        const v = baseStats[k];
        if (!Number.isInteger(v) || v < 5 || v > 18) return err(`Each stat must be between 5 and 18.`, 400);
      }

      const race = RACES[raceKey];
      const instinct = INSTINCTS[instinctKey];
      const finalStats = { ...baseStats };
      for (const [stat, mod] of Object.entries(race.stat_mods)) {
        finalStats[stat] = (finalStats[stat] ?? 10) + mod;
      }
      for (const [stat, mod] of Object.entries(instinct.stat_mods)) {
        finalStats[stat] = (finalStats[stat] ?? 10) + mod;
      }
      if (race.affinity && race.affinity.includes(instinctKey)) {
        const primaryStat = Object.keys(instinct.stat_mods)[0];
        if (primaryStat) finalStats[primaryStat] += 1;
      }

      const { strength, dexterity, constitution, intelligence, wisdom, charisma } = finalStats;
      const maxHp = maxPlayerHp(constitution);
      await dbRun(db, `UPDATE characters SET name=?, race=?, instinct=?, strength=?, dexterity=?, constitution=?,
        intelligence=?, wisdom=?, charisma=?, stats_set=1, current_hp=? WHERE user_id=?`,
        [nameTrimmed, raceKey, instinctKey, strength, dexterity, constitution, intelligence, wisdom, charisma, maxHp, uid]);

      const items = STARTING_ITEMS[instinctKey] || [];
      for (const item of items) {
        await dbRun(db, "INSERT INTO inventory (user_id, item, qty) VALUES (?, ?, 1) ON CONFLICT(user_id, item) DO UPDATE SET qty = qty + 1", [uid, item]);
      }

      // has_seen_awakening is set on first /api/look when we serve the awakening room description
      return json({ ok: true, first_awakening: true, stats: finalStats, max_hp: maxHp, starting_items: items });
    }

    // ── POST: Set stats ──
    if (path === "/api/character/stats" && method === "POST") {
      const { strength, dexterity, constitution, intelligence, wisdom, charisma } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.stats_set) return err("Stats already set.");
      const stats = { strength, dexterity, constitution, intelligence, wisdom, charisma };
      const validation = validatePointBuy(stats);
      if (!validation.ok) return err(validation.message, 400);
      const maxHp = maxPlayerHp(constitution);
      await dbRun(db, `UPDATE characters SET strength=?,dexterity=?,constitution=?,
        intelligence=?,wisdom=?,charisma=?,stats_set=1,current_hp=? WHERE user_id=?`,
        [strength,dexterity,constitution,intelligence,wisdom,charisma,maxHp,uid]);
      return json({ ok: true, max_hp: maxHp });
    }

    // ── GET: Roll stats ──
    if (path === "/api/character/roll" && method === "GET") {
      const roll = () => {
        const dice = [rollDie(6),rollDie(6),rollDie(6),rollDie(6)].sort((a,b)=>a-b);
        return dice.slice(1).reduce((a,b)=>a+b,0);
      };
      return json({
        stats: { strength:roll(), dexterity:roll(), constitution:roll(),
                 intelligence:roll(), wisdom:roll(), charisma:roll() }
      });
    }

    // ── GET: Look ──
    if (path === "/api/look" && method === "GET") {
      let row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      let loc = row.location;
      if (OLD_SEWER_LOCATIONS.has(loc)) {
        await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", ["drain_entrance", uid]);
        row = await getPlayerSheet(db, uid);
        loc = row.location;
      }
      const room = WORLD[loc];
      if (!room) return err("Unknown location.");

      let description = room.description;
      if (loc === "tavern") {
        const hasSeenAwakening = await getFlag(db, uid, "has_seen_awakening", 0);
        if (hasSeenAwakening === 0) {
          description = AWAKENING_ROOM_DESCRIPTION;
          await setFlag(db, uid, "has_seen_awakening", 1);
        }
      } else if (FIRST_VISIT_INTROS[loc]) {
        const visitFlag = loc === "market_square" ? "has_seen_market_square" : "visited_" + loc;
        const seen = await getFlag(db, uid, visitFlag, 0);
        if (seen === 0) {
          description = FIRST_VISIT_INTROS[loc] + room.description;
          await setFlag(db, uid, visitFlag, 1);
        }
      }

      let npcsHere = Object.entries(NPC_LOCATIONS)
        .filter(([,l]) => l === loc).map(([id]) => id);
      if (loc === "cinder_cells_hall" && (row.crime_heat ?? 0) >= 4 && !npcsHere.includes("warden")) {
        npcsHere = [...npcsHere, "warden"];
      }

      const combatRow = await dbGet(db, "SELECT state_json FROM combat_state WHERE user_id=?", [uid]);
      const inCombat  = !!combatRow;

      let exits = Object.keys(room.exits || {});
      let exit_map = { ...(room.exits || {}) };
      if (loc === "market_square") {
        exits = [...exits, "down"];
        exit_map.down = "sewer_entrance";
      }
      if (loc === "cinder_cells_block" && (row.crime_heat ?? 0) < 11) {
        exits = exits.filter(e => e !== "deeper");
        delete exit_map.deeper;
      }
      // Floor gates: hide deeper/down exit if player lacks required boss flag
      const gate = FLOOR_GATES[loc];
      if (gate && gate.requires_flag) {
        const hasFlag = await getFlag(db, uid, gate.requires_flag, 0);
        if (!hasFlag) {
          exits = exits.filter(e => e !== gate.exit_dir);
          delete exit_map[gate.exit_dir];
          description += " The gate ahead is sealed. Beyond it, something older waits.";
        }
      }

      const deathDrops = await getUnclaimedDropsAtLocation(db, loc);
      if (deathDrops.length > 0) {
        description += "\n\nSomething glints near the drain. Ash Marks — someone left them here quickly.";
      }

      return json({
        location: loc, name: room.name, description,
        exits, exit_map,
        objects: Object.keys(room.objects || {}),
        items: [],  // room items seeded statically for now
        npcs: npcsHere,
        in_combat: inCombat,
        fightable: FIGHTABLE_LOCATIONS.has(loc),
        death_drops_present: deathDrops.length > 0,
      });
    }

    // ── POST: Move ──
    if (path === "/api/move" && method === "POST") {
      const { direction } = body;
      let row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (OLD_SEWER_LOCATIONS.has(row.location)) {
        await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", ["drain_entrance", uid]);
        row = await getPlayerSheet(db, uid);
      }
      const inCombat = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
      if (inCombat) return err("You're in combat. Flee first.");

      const room = WORLD[row.location];
      let dest = room?.exits?.[direction];
      if (row.location === "market_square" && direction === "down") dest = "sewer_entrance";
      if (row.location === "cinder_cells_block" && direction === "deeper" && (row.crime_heat ?? 0) < 11) {
        dest = null;
      }
      // Floor gates: block deeper/down if player lacks required boss flag
      const gate = FLOOR_GATES[row.location];
      if (gate && direction === gate.exit_dir && gate.requires_flag) {
        const hasFlag = await getFlag(db, uid, gate.requires_flag, 0);
        if (!hasFlag) dest = null;
      }
      if (!dest) return err(`You can't go ${direction} from here.`);
      if (!WORLD[dest]) return err("That path leads nowhere.");

      await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", [dest, uid]);

      // Ambient events
      let ambient = null;
      if (dest === "flooded_hall") {
        const r = Math.random();
        if (r < 0.1) ambient = "*A single bubble rises from the still water. The surface does not ripple.*";
        else if (r < 0.225) ambient = "*Something skitters just beyond your torchlight. The sound stops the moment you turn.*";
      }

      const destRoom = WORLD[dest];
      let destDescription = destRoom.description;
      if (dest === "tavern") {
        const hasSeenAwakening = await getFlag(db, uid, "has_seen_awakening", 0);
        if (hasSeenAwakening === 0) {
          destDescription = AWAKENING_ROOM_DESCRIPTION;
          await setFlag(db, uid, "has_seen_awakening", 1);
        }
      } else {
        const visitFlag = dest === "market_square" ? "has_seen_market_square" : "visited_" + dest;
        const hadVisited = await getFlag(db, uid, visitFlag, 0);
        if (FIRST_VISIT_INTROS[dest] && hadVisited === 0) {
          destDescription = FIRST_VISIT_INTROS[dest] + destRoom.description;
        }
      }

      // Depth flag (sewer floors 2–5)
      if (SEWER_LEVEL_2.includes(dest) || SEWER_LEVEL_3.includes(dest) || SEWER_LEVEL_4.includes(dest) || SEWER_LEVEL_5.includes(dest)) {
        await setFlag(db, uid, "warned_mid_sewer", 1);
      }
      if (dest === "market_square") {
        await setFlag(db, uid, "has_seen_market_square", 1);
      }
      await setFlag(db, uid, "visited_" + dest, 1);

      let destExits = Object.keys(destRoom.exits || {});
      let destExitMap = { ...(destRoom.exits || {}) };
      if (dest === "market_square") {
        destExits = [...destExits, "down"];
        destExitMap.down = "sewer_entrance";
      }
      if (dest === "cinder_cells_block" && (row.crime_heat ?? 0) < 11) {
        destExits = destExits.filter(e => e !== "deeper");
        delete destExitMap.deeper;
      }
      const destGate = FLOOR_GATES[dest];
      if (destGate && destGate.requires_flag) {
        const hasFlag = await getFlag(db, uid, destGate.requires_flag, 0);
        if (!hasFlag) {
          destExits = destExits.filter(e => e !== destGate.exit_dir);
          delete destExitMap[destGate.exit_dir];
          destDescription += " The gate ahead is sealed. Beyond it, something older waits.";
        }
      }
      let npcsHere = Object.entries(NPC_LOCATIONS)
        .filter(([,l]) => l === dest).map(([id]) => id);
      if (dest === "cinder_cells_hall" && (row.crime_heat ?? 0) >= 4 && !npcsHere.includes("warden")) {
        npcsHere = [...npcsHere, "warden"];
      }

      const deathDrops = await getUnclaimedDropsAtLocation(db, dest);
      if (deathDrops.length > 0) {
        destDescription += "\n\nSomething glints near the drain. Ash Marks — someone left them here quickly.";
      }

      return json({
        location: dest, name: destRoom.name, description: destDescription,
        exits: destExits,
        exit_map: destExitMap,
        objects: Object.keys(destRoom.objects || {}),
        items: [], npcs: npcsHere, ambient,
        fightable: FIGHTABLE_LOCATIONS.has(dest),
        death_drops_present: deathDrops.length > 0,
      });
    }

    // ── POST: Death drop claim ──
    if (path === "/api/death-drop/claim" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const loc = row.location;
      const cutoff = Date.now() - DEATH_DROP_EXPIRY_MS;
      const drop = await dbGet(db, "SELECT id, ash_marks FROM death_drops WHERE location=? AND claimed_by IS NULL AND dropped_at>? ORDER BY id ASC LIMIT 1", [loc, cutoff]);
      if (!drop) return err("Nothing to find here.", 404);
      const now = Date.now();
      await dbRun(db, "UPDATE death_drops SET claimed_by=?, claimed_at=? WHERE id=?", [uid, now, drop.id]);
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [drop.ash_marks, uid]);
      return json({ ok: true, ash_marks: drop.ash_marks, message: "*You gather the scattered marks.*" });
    }

    // ── GET: Inspect ──
    if (path.startsWith("/api/inspect/") && method === "GET") {
      const target = path.slice("/api/inspect/".length);
      const row  = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const room = WORLD[row.location];
      const obj  = room?.objects?.[target];
      if (!obj) return err(`Nothing called '${target}' here.`, 404);
      const flagName = SEWER_STORY_MARKINGS[row.location]?.[target];
      if (flagName) await setFlag(db, uid, flagName, 1);
      return json({ target, desc: obj.desc, actions: obj.actions || [] });
    }

    // ── Party System ──
    if (path === "/api/party" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const members = await getPartyMembers(db, dbAll, uid);
      const invites = await dbAll(db, "SELECT inviter_id, created_at FROM party_invites WHERE target_id=?", [uid]);
      const inviterNames = await Promise.all(invites.map(async (inv) => {
        const r = await dbGet(db, "SELECT name FROM characters WHERE user_id=?", [inv.inviter_id]);
        return { inviter_id: inv.inviter_id, inviter_name: r?.name || "Unknown", created_at: inv.created_at };
      }));
      const memberNames = await Promise.all(members.map(async (mid) => {
        const r = await dbGet(db, "SELECT name FROM characters WHERE user_id=?", [mid]);
        return { user_id: mid, name: r?.name || "Unknown" };
      }));
      return json({ members: memberNames, pending_invites: inviterNames });
    }

    if (path === "/api/party/invite" && method === "POST") {
      const { target_name } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!target_name || typeof target_name !== "string") return err("target_name required.", 400);
      const targetRow = await dbGet(db, "SELECT user_id FROM characters WHERE LOWER(TRIM(name))=LOWER(?)", [target_name.trim()]);
      if (!targetRow || targetRow.user_id === uid) return err("Player not found or cannot invite yourself.", 404);
      const targetUid = targetRow.user_id;
      const targetLoc = await dbGet(db, "SELECT location FROM players WHERE user_id=?", [targetUid]);
      if (targetLoc?.location !== row.location) return err("Target must be in the same location.", 400);
      const rel = await getRelationship(db, dbGet, uid, targetUid);
      if (rel?.state === "party") return err("Already in a party with them.", 400);
      const existing = await dbGet(db, "SELECT 1 FROM party_invites WHERE inviter_id=? AND target_id=?", [uid, targetUid]);
      if (existing) return err("Invite already sent.", 400);
      const now = Math.floor(Date.now() / 1000);
      await dbRun(db, "INSERT INTO party_invites (inviter_id, target_id, created_at) VALUES (?, ?, ?)", [uid, targetUid, now]);
      return json({ ok: true, message: `Invite sent to ${target_name.trim()}.` });
    }

    if (path === "/api/party/accept" && method === "POST") {
      const { inviter_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const inviterUid = Number(inviter_id);
      if (!inviterUid) return err("inviter_id required.", 400);
      const invite = await dbGet(db, "SELECT 1 FROM party_invites WHERE inviter_id=? AND target_id=?", [inviterUid, uid]);
      if (!invite) return err("No pending invite from that player.", 404);
      await dbRun(db, "DELETE FROM party_invites WHERE inviter_id=? AND target_id=?", [inviterUid, uid]);
      await setRelationship(db, dbRun, uid, inviterUid, "party", 1);
      const inviterName = (await dbGet(db, "SELECT name FROM characters WHERE user_id=?", [inviterUid]))?.name || "Unknown";
      return json({ ok: true, message: `You have joined a party with ${inviterName}.` });
    }

    if (path === "/api/party/leave" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const members = await getPartyMembers(db, dbAll, uid);
      if (members.length === 0) return err("You are not in a party.", 400);
      for (const mid of members) {
        await setRelationship(db, dbRun, uid, mid, "neutral", 0);
      }
      return json({ ok: true, message: "You have left the party." });
    }

    // ── POST: Talk ──
    if (path === "/api/talk" && method === "POST") {
      const { npc, topic = "" } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);

      const npcLoc = NPC_LOCATIONS[npc];
      const wardenAtCells = npc === "warden" && row.location === "cinder_cells_hall" && (row.crime_heat ?? 0) >= 4;
      if (!npcLoc && !wardenAtCells) return err(`${npc} is not here.`);
      if (!wardenAtCells && npcLoc !== row.location) return err(`${npc} is not here.`);

      // Build player context for NPCs (Seris/Thalara + Kelvaris stateful intro)
      const itemsSold   = await getFlag(db, uid, "curator_items_sold");
      const deaths      = await getFlag(db, uid, "death_count");
      const justRespawned = await getFlag(db, uid, "just_respawned");
      const morality    = row.mercy_score ?? row.alignment_morality ?? 0;
      const depthTier   = await getFlag(db, uid, "found_foundation_stone") ? 2
                        : await getFlag(db, uid, "warned_mid_sewer")        ? 1 : 0;
      const kelvarisVisits = await getFlag(db, uid, "kelvaris_visits");
      const hasSeenMarket  = await getFlag(db, uid, "has_seen_market_square");
      const warnedMidSewer  = await getFlag(db, uid, "warned_mid_sewer");
      const hasSeenAwakening = await getFlag(db, uid, "has_seen_awakening", 0);
      const seenSewerWallMarkings = await getFlag(db, uid, "seen_sewer_wall_markings");
      const seenSewerGraffiti = await getFlag(db, uid, "seen_sewer_graffiti");
      const seenDaskRoster = await getFlag(db, uid, "seen_dask_roster");
      const seenTier2Graffiti = await getFlag(db, uid, "seen_tier2_graffiti");
      const seenRustedPipe = await getFlag(db, uid, "seen_rusted_pipe");
      const seenFoundationDask = await getFlag(db, uid, "seen_foundation_dask");
      let caelirVisits = 0;
      let caelirDatesRevealed = 0;
      let caelirBladeRevealed = 0;
      if (npc === "weaponsmith") {
        caelirVisits = await getFlag(db, uid, "caelir_visits");
        caelirDatesRevealed = await getFlag(db, uid, "caelir_dates_revealed");
        caelirBladeRevealed = await getFlag(db, uid, "caelir_blade_revealed");
      }
      let veyraVisits = 0;
      let veyraMarkAcknowledged = 0;
      if (npc === "armorsmith") {
        veyraVisits = await getFlag(db, uid, "veyra_visits");
        veyraMarkAcknowledged = await getFlag(db, uid, "veyra_mark_acknowledged");
      }
      let thalaraVisits = 0;
      let thalaraArc1Complete = 0;
      let thalaraArc2Complete = 0;
      if (npc === "alchemist") {
        thalaraVisits = await getFlag(db, uid, "thalara_visits");
        thalaraArc1Complete = await getFlag(db, uid, "thalara_arc1_complete");
        thalaraArc2Complete = await getFlag(db, uid, "thalara_arc2_complete");
      }
      let serisVisits = 0;
      let serisArc1Active = 0;
      let serisArc2Active = 0;
      if (npc === "curator") {
        serisVisits = await getFlag(db, uid, "seris_visits");
        serisArc1Active = await getFlag(db, uid, "seris_arc1_active");
        serisArc2Active = await getFlag(db, uid, "seris_arc2_active");
      }
      let othorionVisits = 0;
      let othorionTrust = 0;
      let othorionArc1Complete = 0;
      let othorionArc2Complete = 0;
      let serisArc1ActiveOthorion = 0;
      let serisArc2ActiveOthorion = 0;
      let serisArc3Complete = 0;
      let foundFoundationStone = 0;
      if (npc === "othorion") {
        othorionVisits = await getFlag(db, uid, "othorion_visits");
        othorionTrust = await getFlag(db, uid, "othorion_trust");
        othorionArc1Complete = await getFlag(db, uid, "othorion_arc1_complete");
        othorionArc2Complete = await getFlag(db, uid, "othorion_arc2_complete");
        serisArc1ActiveOthorion = await getFlag(db, uid, "seris_arc1_active");
        serisArc2ActiveOthorion = await getFlag(db, uid, "seris_arc2_active");
        serisArc3Complete = await getFlag(db, uid, "seris_arc3_complete");
        foundFoundationStone = await getFlag(db, uid, "found_foundation_stone");
      }
      let grommashVisits = 0;
      let grommashArc1Complete = 0;
      let grommashArc2Complete = 0;
      let serisArc3CompleteWarden = 0;
      if (npc === "warden") {
        grommashVisits = await getFlag(db, uid, "grommash_visits");
        grommashArc1Complete = await getFlag(db, uid, "grommash_arc1_complete");
        grommashArc2Complete = await getFlag(db, uid, "grommash_arc2_complete");
        serisArc3CompleteWarden = await getFlag(db, uid, "seris_arc3_complete");
      }
      const hp = await getPlayerHp(db, uid, row);

      const playerContext = {
        items_sold: itemsSold, deaths, morality, depth_tier: depthTier,
        alignment: morality >= 40 ? "light" : morality <= -40 ? "dark" : "neutral",
        archetype: row.archetype ?? "Survivor",
        mercy_score: row.mercy_score ?? 0,
        order_score: row.order_score ?? 0,
        crime_heat: row.crime_heat ?? 0,
        has_bounty: false,
        in_sentence: false,
        kelvaris_visits: kelvarisVisits,
        has_instinct: !!(row.instinct && row.instinct.trim()),
        stats_set: !!(row.stats_set),
        has_seen_market_square: !!hasSeenMarket,
        has_seen_awakening: !!hasSeenAwakening,
        warned_mid_sewer: !!warnedMidSewer,
        seen_sewer_wall_markings: !!seenSewerWallMarkings,
        seen_sewer_graffiti: !!seenSewerGraffiti,
        seen_dask_roster: !!seenDaskRoster,
        seen_tier2_graffiti: !!seenTier2Graffiti,
        seen_rusted_pipe: !!seenRustedPipe,
        seen_foundation_dask: !!seenFoundationDask,
        wisdom: row.wisdom,
        charisma: row.charisma,
        intelligence: row.intelligence,
        current_hp: hp.current,
        max_hp: hp.max,
        just_respawned: !!justRespawned,
      };
      if (npc === "weaponsmith") {
        playerContext.caelir_visits = caelirVisits;
        playerContext.caelir_dates_revealed = caelirDatesRevealed;
        playerContext.caelir_blade_revealed = caelirBladeRevealed;
        playerContext.race = row.race || "";
      }
      if (npc === "armorsmith") {
        playerContext.veyra_visits = veyraVisits;
        playerContext.veyra_mark_acknowledged = veyraMarkAcknowledged;
        playerContext.race = row.race || "";
        playerContext.constitution = row.constitution;
      }
      if (npc === "alchemist") {
        playerContext.thalara_visits = thalaraVisits;
        playerContext.thalara_arc1_complete = thalaraArc1Complete;
        playerContext.thalara_arc2_complete = thalaraArc2Complete;
      }
      if (npc === "curator") {
        playerContext.seris_visits = serisVisits;
        playerContext.seris_items_sold = itemsSold;
        playerContext.seris_arc1_active = serisArc1Active;
        playerContext.seris_arc2_active = serisArc2Active;
      }
      if (npc === "othorion") {
        playerContext.othorion_visits = othorionVisits;
        playerContext.othorion_trust = othorionTrust;
        playerContext.othorion_arc1_complete = othorionArc1Complete;
        playerContext.othorion_arc2_complete = othorionArc2Complete;
        playerContext.seris_arc1_active = serisArc1ActiveOthorion;
        playerContext.seris_arc2_active = serisArc2ActiveOthorion;
        playerContext.seris_arc3_complete = serisArc3Complete;
        playerContext.deep_sewer = !!foundFoundationStone;
        playerContext.race = row.race || "";
      }
      if (npc === "warden") {
        playerContext.grommash_visits = grommashVisits;
        playerContext.grommash_arc1_complete = grommashArc1Complete;
        playerContext.grommash_arc2_complete = grommashArc2Complete;
        playerContext.seris_arc3_complete = serisArc3CompleteWarden;
        playerContext.strength = row.strength;
      }

      const response = await getNPCResponse(env, npc, topic, playerContext);

      if (npc === "bartender") {
        await setFlag(db, uid, "kelvaris_visits", kelvarisVisits + 1);
        if (justRespawned) await setFlag(db, uid, "just_respawned", 0);
      }
      if (npc === "weaponsmith") {
        await setFlag(db, uid, "caelir_visits", caelirVisits + 1);
      }
      if (npc === "armorsmith") {
        await setFlag(db, uid, "veyra_visits", veyraVisits + 1);
        if (topic === "wall_marks" && veyraVisits >= 6 && (row.wisdom ?? 10) >= 12 && !veyraMarkAcknowledged) {
          await setFlag(db, uid, "veyra_mark_acknowledged", 1);
        }
      }
      if (npc === "alchemist") {
        await setFlag(db, uid, "thalara_visits", thalaraVisits + 1);
      }
      if (npc === "curator") {
        await setFlag(db, uid, "seris_visits", serisVisits + 1);
      }
      if (npc === "othorion") {
        await setFlag(db, uid, "othorion_visits", othorionVisits + 1);
      }
      if (npc === "warden") {
        await setFlag(db, uid, "grommash_visits", grommashVisits + 1);
      }

      return json({ response });
    }

    // ── GET: NPC topics ──
    if (path.startsWith("/api/data/npc/") && method === "GET") {
      const npcId = path.split("/")[4];
      const topics = NPC_TOPICS[npcId];
      if (!topics) return err("Unknown NPC.", 404);
      return json({ npc: npcId, topics });
    }

    // ── GET: Location names + connections (for exit labels and node map) ──
    if (path === "/api/data/locations" && method === "GET") {
      const locations = {};
      const connections = [];
      for (const [roomId, room] of Object.entries(WORLD)) {
        locations[roomId] = room.name || roomId;
        const exits = room.exits || {};
        if (roomId === "market_square") connections.push(["market_square", "sewer_entrance"]);
        for (const dest of Object.values(exits)) connections.push([roomId, dest]);
      }
      return json({ locations, connections });
    }

    // ── POST: Set player flag (e.g. visited_<location>) ──
    if (path === "/api/flag" && method === "POST") {
      const { flag, value } = body;
      if (!flag || typeof flag !== "string") return err("Missing flag.", 400);
      await setFlag(db, uid, flag, value == null ? 1 : Number(value));
      return json({ ok: true });
    }

    // ── GET: Chat global ──
    if (path === "/api/chat/global" && method === "GET") {
      const since = parseInt(url.searchParams.get("since") || "0", 10) || 0;
      const rows = await dbAll(db, `
        SELECT id, player_name, message, created_at
        FROM chat_messages
        WHERE channel = 'global' AND deleted = 0 AND created_at > ?
        ORDER BY created_at ASC
        LIMIT 100`, [since]);
      const messages = rows.map((r) => ({
        id: r.id,
        player_name: r.player_name,
        message: r.message,
        created_at: r.created_at,
      }));
      return json({ messages, server_time: Date.now() });
    }

    // ── GET: Chat local (Phase 4) ──
    if (path === "/api/chat/local" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const loc = row.location || "tavern";
      const since = parseInt(url.searchParams.get("since") || "0", 10) || 0;
      const rows = await dbAll(db, `
        SELECT id, player_name, message, created_at
        FROM chat_messages
        WHERE channel = 'local' AND location = ? AND deleted = 0 AND created_at > ?
        ORDER BY created_at ASC
        LIMIT 100`, [loc, since]);
      const messages = rows.map((r) => ({
        id: r.id,
        player_name: r.player_name,
        message: r.message,
        created_at: r.created_at,
      }));
      return json({ messages, location: loc, server_time: Date.now() });
    }

    // ── POST: Chat send (global + local) ──
    if (path === "/api/chat/send" && method === "POST") {
      const { channel, message: rawMessage } = body;
      if (channel !== "global" && channel !== "local") return err("Invalid channel.", 400);
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (await getFlag(db, uid, "chat_banned")) return err("You cannot use chat.", 403);
      const playerName = (row.name || "Someone").trim() || "Someone";
      const message = sanitizeChatMessage(rawMessage);
      if (!message) return err("Message is required.", 400);
      const now = Date.now();
      const loc = row.location || "tavern";

      if (channel === "global") {
        const lastRow = await dbGet(db,
          `SELECT created_at FROM chat_messages WHERE user_id = ? AND channel = 'global' ORDER BY created_at DESC LIMIT 1`,
          [uid]);
        if (lastRow && now - lastRow.created_at < 2000) {
          return err("Wait 2 seconds between messages.", 429);
        }
        await dbRun(db, `
          INSERT INTO chat_messages (channel, location, user_id, player_name, message, created_at)
          VALUES (?, NULL, ?, ?, ?, ?)`, ["global", uid, playerName, message, now]);
        const insertRow = await dbGet(db, "SELECT id, created_at FROM chat_messages WHERE user_id = ? AND channel = 'global' ORDER BY id DESC LIMIT 1", [uid]);
        return json({ ok: true, id: insertRow?.id ?? null, created_at: insertRow?.created_at ?? now });
      }

      if (channel === "local") {
        const lastRow = await dbGet(db,
          `SELECT created_at FROM chat_messages WHERE user_id = ? AND channel = 'local' ORDER BY created_at DESC LIMIT 1`,
          [uid]);
        if (lastRow && now - lastRow.created_at < 1000) {
          return err("Wait 1 second between local messages.", 429);
        }
        const countRow = await dbGet(db,
          `SELECT COUNT(*) as c FROM chat_messages WHERE user_id = ? AND channel = 'local' AND created_at > ?`,
          [uid, now - 60 * 1000]);
        if (countRow && countRow.c >= 30) {
          return err("Too many local messages. Slow down.", 429);
        }
        await dbRun(db, `
          INSERT INTO chat_messages (channel, location, user_id, player_name, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?)`, ["local", loc, uid, playerName, message, now]);
        const insertRow = await dbGet(db, "SELECT id, created_at FROM chat_messages WHERE user_id = ? AND channel = 'local' ORDER BY id DESC LIMIT 1", [uid]);
        return json({ ok: true, id: insertRow?.id ?? null, created_at: insertRow?.created_at ?? now, location: loc });
      }
    }

    // ── POST: Chat whisper (Phase 5) ──
    if (path === "/api/chat/whisper" && method === "POST") {
      const { to_name: toNameRaw, message: rawMessage } = body;
      const toName = (toNameRaw != null && String(toNameRaw).trim()) ? String(toNameRaw).trim() : "";
      if (!toName) return err("Recipient name is required.", 400);
      const message = sanitizeChatMessage(rawMessage);
      if (!message) return err("Message is required.", 400);
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (await getFlag(db, uid, "chat_banned")) return err("You cannot use chat.", 403);
      const fromName = (row.name || "Someone").trim() || "Someone";

      const target = await dbGet(db,
        `SELECT c.user_id, c.name, p.last_seen FROM characters c JOIN players p ON p.user_id = c.user_id WHERE LOWER(TRIM(c.name)) = LOWER(?)`,
        [toName]);
      if (!target || target.user_id === uid) return err("Player not found or not available.", 404);
      const thirtyMinAgo = Date.now() - 30 * 60 * 1000;
      if (target.last_seen == null || target.last_seen < thirtyMinAgo) {
        return err("Player not found or not recently active.", 404);
      }
      const toNameDisplay = (target.name || "").trim() || toName;

      const now = Date.now();
      const lastWhisper = await dbGet(db,
        `SELECT created_at FROM whispers WHERE from_user_id = ? ORDER BY created_at DESC LIMIT 1`,
        [uid]);
      if (lastWhisper && now - lastWhisper.created_at < 3000) {
        return err("Wait 3 seconds between whispers.", 429);
      }
      const countRow = await dbGet(db,
        `SELECT COUNT(*) as c FROM whispers WHERE from_user_id = ? AND created_at > ?`,
        [uid, now - 60 * 1000]);
      if (countRow && countRow.c >= 10) {
        return err("Too many whispers. Slow down.", 429);
      }

      await dbRun(db, `
        INSERT INTO whispers (from_user_id, from_name, to_user_id, to_name, message, created_at)
        VALUES (?, ?, ?, ?, ?, ?)`, [uid, fromName, target.user_id, toNameDisplay, message, now]);
      const insertRow = await dbGet(db, "SELECT id, created_at FROM whispers WHERE from_user_id = ? ORDER BY id DESC LIMIT 1", [uid]);
      return json({ ok: true, id: insertRow?.id ?? null, created_at: insertRow?.created_at ?? now });
    }

    // ── GET: Chat whispers inbox (Phase 5) ──
    if (path === "/api/chat/whispers" && method === "GET") {
      const since = parseInt(url.searchParams.get("since") || "0", 10) || 0;
      const rows = await dbAll(db, `
        SELECT id, from_user_id, from_name, message, created_at, read
        FROM whispers
        WHERE to_user_id = ? AND created_at > ?
        ORDER BY created_at ASC
        LIMIT 100`, [uid, since]);
      const unreadRow = await dbGet(db, `SELECT COUNT(*) as c FROM whispers WHERE to_user_id = ? AND read = 0`, [uid]);
      const messages = rows.map((r) => ({
        id: r.id,
        from_name: r.from_name,
        message: r.message,
        created_at: r.created_at,
      }));
      return json({ messages, server_time: Date.now(), unread: unreadRow?.c ?? 0 });
    }

    // ── GET: Chat whispers unread count only (for badge) ──
    if (path === "/api/chat/whispers/unread" && method === "GET") {
      const unreadRow = await dbGet(db, `SELECT COUNT(*) as c FROM whispers WHERE to_user_id = ? AND read = 0`, [uid]);
      return json({ unread: unreadRow?.c ?? 0 });
    }

    // ── POST: Mark whispers as read (when user views Whispers tab) ──
    if (path === "/api/chat/whispers/mark-read" && method === "POST") {
      await dbRun(db, `UPDATE whispers SET read = 1 WHERE to_user_id = ?`, [uid]);
      return json({ ok: true });
    }

    // ── GET: Noticeboard (player + NPC notices for location) ──
    if (path === "/api/chat/noticeboard" && method === "GET") {
      const url = new URL(request.url);
      const location = (url.searchParams.get("location") || "").trim();
      if (!location) return err("Missing location.", 400);
      const now = Date.now();
      const rows = await dbAll(db,
        `SELECT id, user_id, title, message, player_name, pinned, created_at FROM noticeboards
         WHERE location = ? AND deleted = 0 AND (expires_at IS NULL OR expires_at > ?)
         ORDER BY pinned DESC, created_at DESC`,
        [location, now]
      );
      const rowsWithOwn = rows.map(r => ({ ...r, is_own: r.user_id === uid }));
      const npc = (NOTICEBOARD_NPC_NOTICES[location] || []).map((n, i) => ({
        id: n.id || `npc-${location}-${i}`,
        title: n.title || "",
        message: n.message || "",
        player_name: n.player_name || "The City",
        pinned: n.pinned ? 1 : 0,
        created_at: 0,
        is_npc: true,
      }));
      const combined = [...npc, ...rowsWithOwn];
      combined.sort((a, b) => (b.pinned - a.pinned) || ((b.created_at || 0) - (a.created_at || 0)));
      return json({ notices: combined });
    }

    // ── POST: Post to noticeboard ──
    if (path === "/api/chat/noticeboard" && method === "POST") {
      const body = await request.json().catch(() => ({}));
      const location = (body.location || "").trim();
      const title = (body.title || "").trim();
      const message = (body.message || "").trim();
      const expiresHours = body.expires_hours != null ? Number(body.expires_hours) : null;
      if (!location) return err("Missing location.", 400);
      if (message.length > 500) return err("Message too long (max 500).", 400);
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (await getFlag(db, uid, "chat_banned")) return err("You cannot use chat.", 403);
      const ash = Number(row.ash_marks ?? 0);
      if (ash < 5) return err("Not enough Ash Marks (need 5).", 400);
      const existing = await dbGet(db, `SELECT id FROM noticeboards WHERE location = ? AND user_id = ? AND deleted = 0`, [location, uid]);
      if (existing) return err("You already have a notice here. Remove it first.", 400);
      const now = Date.now();
      const expiresAt = expiresHours != null && expiresHours > 0 ? now + expiresHours * 3600 * 1000 : null;
      const playerName = (row.name || "Unknown").trim() || "Unknown";
      await dbRun(db,
        `INSERT INTO noticeboards (user_id, location, player_name, title, message, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uid, location, playerName, title, message, now, expiresAt]
      );
      await dbRun(db, `UPDATE characters SET ash_marks = ? WHERE user_id = ?`, [ash - 5, uid]);
      return json({ ok: true });
    }

    // ── DELETE: Remove own notice (soft-delete) ──
    if (path.startsWith("/api/chat/noticeboard/") && method === "DELETE") {
      const id = path.slice("/api/chat/noticeboard/".length).replace(/[^a-zA-Z0-9_-]/g, "");
      if (!id) return err("Invalid notice id.", 400);
      if (id.startsWith("npc-")) return err("Cannot remove city notices.", 400);
      const row = await dbGet(db, `SELECT id FROM noticeboards WHERE id = ? AND user_id = ?`, [id, uid]);
      if (!row) return err("Notice not found or not yours.", 404);
      await dbRun(db, `UPDATE noticeboards SET deleted = 1 WHERE id = ?`, [id]);
      return json({ ok: true });
    }

    // ── GET: Board ──
    if (path === "/api/board" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== "market_square") return err("The Ember Post is in the market square.");
      const depth = await getFlag(db, uid, "found_foundation_stone") ? 2
                  : await getFlag(db, uid, "warned_mid_sewer") ? 1 : 0;
      const seed  = Math.floor(Date.now() / 3_600_000); // hourly
      return json({ board: formatBoard(row.name, depth, seed) });
    }

    // ── POST: Commune ──
    if (path === "/api/commune" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== "ashen_sanctuary") return err("You must be at the Ashen Sanctuary.");

      const instinct = (row.instinct || "").toLowerCase();
      const count    = await getFlag(db, uid, "commune_count");
      await setFlag(db, uid, "commune_count", count + 1);

      const mComm = instinct === "ember_touched" ? 2 : 1;
      await updateAlignment(db, uid, mComm, 1, instinct);

      const hp = await getPlayerHp(db, uid, row);
      let hpGained = 0;
      let response = "";

      if (Math.random() < 0.01) {
        // Rare glad event
        hpGained = 3;
        response = "*You kneel. The air shifts.*\n\n*Something ancient takes notice — and then, for a single heartbeat, something changes.*\n\n*The Sanctuary feels glad you are here.*\n\n*The feeling passes before you can be certain of it. But it was there.*";
      } else if (instinct === "hearthborn") {
        hpGained = 3;
        response = count === 0
          ? "*The silence changes. It was empty before. Now it is not.*\n\n*Something turns its attention toward you — not a god, not a demon, something that predates those distinctions — and waits.*\n\n*Your wounds ease slightly.* **+3 HP**"
          : "*You return to the altar. Something is already waiting.*\n\n*It does not greet you. It simply continues attending, the way fire attends to whatever is placed in front of it.*\n\n*Your wounds ease slightly.* **+3 HP**";
      } else {
        response = COMMUNE_FLAVORS[Math.floor(Math.random() * COMMUNE_FLAVORS.length)];
      }

      if (hpGained) {
        const newHp = Math.min(hp.current + hpGained, hp.max);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [newHp, uid]);
      }

      return json({ response, hp_gained: hpGained });
    }

// ── GET: Combat State ──
if (path === "/api/combat/state" && method === "GET") {
  const csRow = await dbGet(db, "SELECT state_json FROM combat_state WHERE user_id=?", [uid]);
  if (!csRow) return err("Not in combat.", 404);
  const state = JSON.parse(csRow.state_json);
  const enemy = COMBAT_DATA.enemies[state.enemy_id];
  return json({
    ...state,
    enemy_name: state.enemy_name || (enemy && enemy.name) || state.enemy_id,
  });
}

    // ── POST: Combat Start ──
    if (path === "/api/combat/start" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!FIGHTABLE_LOCATIONS.has(row.location)) return err("Nothing to fight here.");
      const existing = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
      if (existing) return err("Already in combat.");

      const hp = await getPlayerHp(db, uid, row);
      if (hp.current <= 0) return err("You can't fight in this condition.");

      let enemy;
      const bossNode = BOSS_NODES[row.location];
      const forceBoss = bossNode && !(await getFlag(db, uid, bossNode.flag, 0));
      if (forceBoss) {
        const bossData = COMBAT_DATA.enemies[bossNode.boss_id];
        enemy = bossData ? { ...bossData, id: bossData.id } : randomEnemy(row.location);
      } else {
        // Optional: set player_flags.force_combat_test=1 for deterministic gutter_rat spawn (playtest).
        const forceCombatTest = await getFlag(db, uid, "force_combat_test");
        if (forceCombatTest) {
          const gutterRat = COMBAT_DATA.enemies.gutter_rat;
          enemy = { ...gutterRat, id: gutterRat.id };
        } else {
          enemy = randomEnemy(row.location);
        }
      }
      const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
      let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
      for (const eq of eqRows) {
        const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
        const tier = Math.min(invRow?.tier ?? 1, 3);
        if (eq.slot === "weapon") weaponDie = [6, 8, 10, 12][tier];
        else if (eq.slot === "armor") armorReduction = [0, 2, 4, 6][tier];
        else if (eq.slot === "shield") shieldBonus = 2;
      }
      const state = {
        enemy_id: enemy.id, enemy_name: enemy.name,
        enemy_hp: enemy.hp, enemy_hp_max: enemy.hp,
        player_hp: hp.current, player_hp_max: hp.max,
        ability_used: false, turn: 1, round: 1, location: row.location,
        weapon_die: weaponDie, armor_reduction: armorReduction, shield_bonus: shieldBonus,
        enemy_staggered: false, status_effects: [], trait_state: {},
        armor_break_effects: [],
      };
      await dbRun(db, "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
        [uid, JSON.stringify(state)]);
      return json({ ...state, message: `*${enemy.name} emerges from the dark.*\n\n${enemy.desc || ""}` });
    }

    // ── POST: Combat Action ──
    if (path === "/api/combat/action" && method === "POST") {
      const { action } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const csRow = await dbGet(db, "SELECT state_json FROM combat_state WHERE user_id=?", [uid]);
      if (!csRow) return err("Not in combat.");

      const state    = JSON.parse(csRow.state_json);
      const instinct = (row.instinct || "").toLowerCase();
      const enemy    = COMBAT_DATA.enemies[state.enemy_id];
      const stats    = { strength: row.strength, dexterity: row.dexterity, constitution: row.constitution };

      if (!enemy) return err("Combat state invalid. Flee to reset.");

      if (action === "flee") {
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await updateAlignment(db, uid, 0, -1, instinct);
        return json({ result: "fled", message: "*You retreat into the dark.*" });
      }

      if (action === "ability" && state.ability_used) return err("Ability already used.");

      const useAbility = action === "ability";
      const equipment = { weaponDie: state.weapon_die ?? 6 };

      // Ensure new state fields exist (backwards compat)
      state.status_effects = state.status_effects ?? [];
      state.trait_state = state.trait_state ?? {};
      state.armor_break_effects = state.armor_break_effects ?? [];
      state.round = state.round ?? state.turn ?? 1;

      // 1. Tick status effects (bleed/poison/fire_touch)
      const statusDmg = tickStatusEffects(state);
      let playerHp = state.player_hp - statusDmg;

      // 2. Tick armor_break (decay duration)
      state.armor_break_effects = state.armor_break_effects
        .map((e) => ({ ...e, duration: e.duration - 1 }))
        .filter((e) => e.duration > 0);

      const armorBreakReduction = state.armor_break_effects.reduce((s, e) => s + (e.defense_reduction ?? 0), 0);
      const effectiveArmor = Math.max(0, (state.armor_reduction ?? 0) - armorBreakReduction);

      // 3. Player attack
      const attack = playerAttack(stats, enemy, useAbility, instinct, equipment);
      if (useAbility) state.ability_used = true;

      let enemyHp = state.enemy_hp;

      if (attack.heal) {
        playerHp = Math.min(playerHp + attack.heal, state.player_hp_max);
      } else {
        const guardMod = getTraitDamageModifier(enemy, state);
        const playerDmg = Math.floor(attack.dmg * guardMod);
        enemyHp = Math.max(0, enemyHp - playerDmg);
        if (attack.staggered) state.enemy_staggered = true;
      }

      // 4. Enemy retaliation (skip if staggered or skipRetaliation)
      let enemyDmg = 0;
      let enemyHit = false;
      let enemySkippedStagger = false;
      if (!(action === "ability" && attack.skipRetaliation)) {
        if (state.enemy_staggered) {
          state.enemy_staggered = false;
          enemySkippedStagger = true;
        } else {
          const traitResult = resolveEnemyTrait(enemy, state);
          let attackResult;
          if (traitResult?.skipAction) {
            attackResult = { dmg: 0, hit: false };
          } else if (traitResult?.replacementAttack) {
            attackResult = {
              dmg: traitResult.replacementAttack.damage,
              hit: traitResult.replacementAttack.hit,
            };
          } else {
            attackResult = enemyAttack(enemy, stats, state.shield_bonus ?? 0);
          }
          enemyDmg = attackResult.dmg ?? 0;
          enemyHit = attackResult.hit ?? false;

          enemyDmg = Math.floor(enemyDmg * (attack.damageReduction ? 1 - attack.damageReduction : 1));
          enemyDmg = Math.max(0, enemyDmg - effectiveArmor);

          if (enemyHit) {
            const statusEffect = getStatusEffectOnHit(enemy);
            if (statusEffect) {
              if (statusEffect.type === "poison" && statusEffect.stacks) {
                const existing = state.status_effects.filter((e) => e.type === "poison");
                if (existing.length < (statusEffect.max_stacks ?? 3)) {
                  state.status_effects.push(statusEffect);
                }
              } else {
                state.status_effects.push(statusEffect);
              }
            }
            const onHit = getTraitOnHitEffect(enemy);
            if (onHit?.drain) enemyHp = Math.min(enemyHp + onHit.drain, state.enemy_hp_max);
            if (onHit?.armor_break) state.armor_break_effects.push(onHit.armor_break);
          }
        }
      }

      playerHp = Math.max(0, playerHp - enemyDmg);

      // Victory
      if (enemyHp <= 0) {
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

        // Set boss_floorN flag when defeating a floor boss
        const bossFlags = { rat_king: "boss_floor1", sporebound_custodian: "boss_floor2", cistern_leviathan: "boss_floor3", broken_regulator: "boss_floor4", ash_heart_custodian: "boss_floor5" };
        const bossFlag = bossFlags[state.enemy_id];
        if (bossFlag) await setFlag(db, uid, bossFlag, 1);

        const xpGain = enemy.xp || 50;
        const xpRow  = await dbGet(db, "SELECT xp,class_stage FROM characters WHERE user_id=?", [uid]);
        const newXp  = (xpRow.xp || 0) + xpGain;
        await dbRun(db, "UPDATE characters SET xp=? WHERE user_id=?", [newXp, uid]);
        const canAdvance = newXp >= [0,500,1500,3500,7500,15000][(xpRow.class_stage||0)+1];

        // Loot — simple cash drop
        const lootAsh = Math.floor(Math.random() * 15) + 5;
        await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [lootAsh, uid]);

        // Procedural item drop
        const playerLevel = 1 + (xpRow.class_stage || 0);
        const locationId = state.location || "drain_entrance";
        const enemyTier = enemy.tier ?? 1;
        const dropped = generateItem(playerLevel, locationId, enemyTier);
        await dbRun(db, `INSERT INTO inventory (user_id, item, qty, tier, corrupted, curse, curse_identified, special_property, display_name)
          VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)`,
          [uid, dropped.id, dropped.tier, dropped.corrupted ? 1 : 0, dropped.curse || null, dropped.curse_identified || 0, dropped.special_property || null, dropped.display_name || null]);

        const mKill = instinct === "ironblood" ? 0 : -1;
        await updateAlignment(db, uid, mKill, 1, instinct);

        const itemLine = dropped.display_name ? ` | **${dropped.display_name}**` : "";
        return json({
          result: "victory",
          message: `*${enemy.name} falls.*\n\n${attack.narrative}\n\n**+${xpGain} XP** | **+${lootAsh} Ash Marks**${itemLine}`,
          can_advance: !!canAdvance, player_hp: playerHp,
        });
      }

      // Death
      if (playerHp <= 0) {
        const deathLoc = state.location || "drain_entrance";
        const { ashLost } = await processDeathDrop(db, uid, deathLoc);
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE characters SET current_hp=0 WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE players SET location='tavern' WHERE user_id=?", [uid]);
        const maxHp = maxPlayerHp(row.constitution);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [maxHp, uid]);
        const dc = await getFlag(db, uid, "death_count");
        await setFlag(db, uid, "death_count", dc + 1);
        await setFlag(db, uid, "just_respawned", 1);
        await updateAlignment(db, uid, 0, -2, instinct);
        let deathMsg = `*${enemy.name} stands over you.*\n\n*You wake in the Shadow Hearth Inn.*`;
        if (ashLost > 0) deathMsg += `\n\nYou lost ${ashLost} Ash Marks. They're still where you fell.`;
        return json({
          result: "death",
          message: deathMsg,
        });
      }

      // Ongoing
      state.enemy_hp = enemyHp;
      state.player_hp = playerHp;
      state.turn++;
      state.round = (state.round ?? state.turn) + 1;
      await dbRun(db, "UPDATE combat_state SET state_json=? WHERE user_id=?", [JSON.stringify(state), uid]);
      await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

      let msg = attack.narrative;
      if (statusDmg > 0) msg += `\n\n*Bleed/poison/fire — ${statusDmg} damage.*`;
      if (enemySkippedStagger) msg += `\n\n*${enemy.name} staggers — it loses its turn.*`;
      else msg += `\n\n*${enemy.name} retaliates — ${enemyDmg > 0 ? `${enemyDmg} damage.` : "misses."}*`;

      return json({
        result: "ongoing",
        message: msg,
        player_hp: playerHp, enemy_hp: enemyHp,
        enemy_hp_max: state.enemy_hp_max,
      });
    }

    // ── GET: Location players (for downed UI) ──
    if (path === "/api/location/players" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const players = await dbAll(db, `SELECT p.user_id, c.name FROM players p
        LEFT JOIN characters c ON c.user_id=p.user_id
        WHERE p.location=? AND p.user_id!=?`, [row.location, uid]);
      const pvpRows = await dbAll(db, "SELECT user_id, downed_until, downed_by FROM pvp_state WHERE downed_until>?", [Math.floor(Date.now() / 1000)]);
      const downedMap = Object.fromEntries(pvpRows.map(r => [r.user_id, { downed_until: r.downed_until, downed_by: r.downed_by }]));
      const list = players.map(p => ({
        user_id: p.user_id,
        name: p.name || "Unknown",
        downed: !!downedMap[p.user_id],
        downed_until: downedMap[p.user_id]?.downed_until,
      }));
      return json({ players: list });
    }

    // ── Downed player actions ──
    if (path === "/api/player/revive" && method === "POST") {
      const { target_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const targetUid = Number(target_id);
      if (!targetUid) return err("target_id required.", 400);
      const targetLoc = await dbGet(db, "SELECT location FROM players WHERE user_id=?", [targetUid]);
      if (targetLoc?.location !== row.location) return err("Target is not here.", 400);
      const pvpRow = await dbGet(db, "SELECT downed_until FROM pvp_state WHERE user_id=? AND downed_until>?", [targetUid, Math.floor(Date.now() / 1000)]);
      if (!pvpRow) return err("That player is not downed.", 400);
      const targetChar = await dbGet(db, "SELECT constitution FROM characters WHERE user_id=?", [targetUid]);
      const maxHp = maxPlayerHp(targetChar?.constitution || 10);
      const reviveHp = Math.max(1, Math.floor(maxHp * 0.3));
      await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [reviveHp, targetUid]);
      await dbRun(db, "INSERT INTO pvp_state (user_id, downed_until, downed_by, created_at, updated_at) VALUES (?, 0, NULL, ?, ?) ON CONFLICT(user_id) DO UPDATE SET downed_until=0, downed_by=NULL, updated_at=excluded.updated_at", [targetUid, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)]);
      await updateAlignment(db, uid, 15, 0, (row.instinct || "").toLowerCase());
      const targetName = (await dbGet(db, "SELECT name FROM characters WHERE user_id=?", [targetUid]))?.name || "Unknown";
      return json({ ok: true, message: `*You revive ${targetName}.*\n\nThey stir. **${reviveHp} HP** restored.` });
    }

    if (path === "/api/player/loot" && method === "POST") {
      const { target_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const targetUid = Number(target_id);
      if (!targetUid) return err("target_id required.", 400);
      const targetLoc = await dbGet(db, "SELECT location FROM players WHERE user_id=?", [targetUid]);
      if (targetLoc?.location !== row.location) return err("Target is not here.", 400);
      const pvpRow = await dbGet(db, "SELECT downed_until FROM pvp_state WHERE user_id=? AND downed_until>?", [targetUid, Math.floor(Date.now() / 1000)]);
      if (!pvpRow) return err("That player is not downed.", 400);
      const allItems = await dbAll(db, "SELECT item, qty, tier, corrupted, curse, curse_identified, special_property, display_name FROM inventory WHERE user_id=?", [targetUid]);
      if (allItems.length === 0) return err("They have nothing to take.", 400);
      const take = allItems[Math.floor(Math.random() * allItems.length)];
      await dbRun(db, take.qty <= 1 ? "DELETE FROM inventory WHERE user_id=? AND item=?" : "UPDATE inventory SET qty=qty-1 WHERE user_id=? AND item=?", take.qty <= 1 ? [targetUid, take.item] : [targetUid, take.item]);
      const qtyToGive = Math.min(take.qty || 1, 1);
      await dbRun(db, `INSERT INTO inventory (user_id, item, qty, tier, corrupted, curse, curse_identified, special_property, display_name)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, item) DO UPDATE SET qty=qty+?`,
        [uid, take.item, qtyToGive, take.tier || 1, take.corrupted || 0, take.curse || null, take.curse_identified || 0, take.special_property || null, take.display_name || null, qtyToGive]);
      await updateAlignment(db, uid, 0, -20, (row.instinct || "").toLowerCase());
      const label = take.display_name || take.item;
      return json({ ok: true, message: `*You take ${label} from them.*`, item: label });
    }

    if (path === "/api/player/finish" && method === "POST") {
      const { target_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const targetUid = Number(target_id);
      if (!targetUid) return err("target_id required.", 400);
      const targetLoc = await dbGet(db, "SELECT location FROM players WHERE user_id=?", [targetUid]);
      if (targetLoc?.location !== row.location) return err("Target is not here.", 400);
      const pvpRow = await dbGet(db, "SELECT downed_until FROM pvp_state WHERE user_id=? AND downed_until>?", [targetUid, Math.floor(Date.now() / 1000)]);
      if (!pvpRow) return err("That player is not downed.", 400);
      const { ashLost } = await processDeathDrop(db, targetUid, targetLoc.location);
      await dbRun(db, "UPDATE characters SET current_hp=0 WHERE user_id=?", [targetUid]);
      await dbRun(db, "UPDATE players SET location='tavern' WHERE user_id=?", [targetUid]);
      const maxHp = maxPlayerHp((await dbGet(db, "SELECT constitution FROM characters WHERE user_id=?", [targetUid]))?.constitution || 10);
      await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [maxHp, targetUid]);
      const dc = await getFlag(db, targetUid, "death_count");
      await setFlag(db, targetUid, "death_count", dc + 1);
      await setFlag(db, targetUid, "just_respawned", 1);
      await dbRun(db, "INSERT INTO pvp_state (user_id, downed_until, downed_by, created_at, updated_at) VALUES (?, 0, NULL, ?, ?) ON CONFLICT(user_id) DO UPDATE SET downed_until=0, downed_by=NULL, updated_at=excluded.updated_at", [targetUid, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)]);
      await updateAlignment(db, uid, -30, 0, (row.instinct || "").toLowerCase());
      const targetName = (await dbGet(db, "SELECT name FROM characters WHERE user_id=?", [targetUid]))?.name || "Unknown";
      let finishMsg = `*You finish ${targetName}.*\n\n*They wake in the Shadow Hearth Inn.*`;
      if (ashLost > 0) finishMsg += " Their marks are still where they fell.";
      return json({ ok: true, message: finishMsg });
    }

    // ── POST: PvP Attack ──
    if (path === "/api/combat/pvp/attack" && method === "POST") {
      const { target_name, target_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      let targetUid = Number(target_id);
      if (!targetUid && target_name) {
        const tr = await dbGet(db, "SELECT user_id FROM characters WHERE LOWER(TRIM(name))=LOWER(?)", [String(target_name).trim()]);
        if (tr) targetUid = tr.user_id;
      }
      if (!targetUid || targetUid === uid) return err("Valid target required.", 400);
      const targetRow = await getPlayerSheet(db, targetUid);
      if (!targetRow) return err("Target not found.", 404);
      if (targetRow.location !== row.location) return err("Target is not here.", 400);
      const c1 = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
      const c2 = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [targetUid]);
      if (c1 || c2) return err("One of you is in PvE combat.", 400);
      const rel = await getRelationship(db, dbGet, uid, targetUid);
      const isParty = rel?.state === "party";
      if (isParty) {
        await triggerBetrayalCascade(db, dbGet, dbRun, uid, targetUid, (u, f, v) => setFlag(db, u, f, v));
      } else {
        await setRelationship(db, dbRun, uid, targetUid, "hostile", rel?.trust_points || 0);
      }
      const strMod = statMod(row.strength);
      const dmg = Math.max(1, rollDie(6) + strMod);
      const newHp = Math.max(0, (targetRow.current_hp || maxPlayerHp(targetRow.constitution)) - dmg);
      await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [newHp, targetUid]);
      if (!isParty) await updateAlignment(db, uid, -10, 0, (row.instinct || "").toLowerCase());
      const targetName = targetRow.name || "Unknown";
      if (newHp <= 0) {
        const now = Math.floor(Date.now() / 1000);
        await dbRun(db, "INSERT INTO pvp_state (user_id, downed_until, downed_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET downed_until=excluded.downed_until, downed_by=excluded.downed_by, updated_at=excluded.updated_at", [targetUid, now + 60, uid, now, now]);
        return json({ result: "downed", message: `*You strike ${targetName}.*\n\nThey fall. **60 seconds** until death.`, target_hp: 0, target_downed: true });
      }
      return json({ result: "hit", message: `*You strike ${targetName} for **${dmg}** damage.*`, target_hp: newHp });
    }

    // ── POST: Rest ──
    if (path === "/api/rest" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== "tavern") return err("You need to be at the Shadow Hearth Inn.");
      if ((row.ash_marks || 0) < BARTENDER_FEE) {
        return json({ ok: false, message: `*Kelvaris doesn't look at you.*\n\n"Ten marks. That's what a room costs."\n\nYou have **${row.ash_marks || 0}** Ash Marks.` });
      }
      const maxHp = maxPlayerHp(row.constitution);
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-?,current_hp=? WHERE user_id=?", [BARTENDER_FEE, maxHp, uid]);
      await setFlag(db, uid, "has_room", 1);
      const instinct = (row.instinct || "").toLowerCase();
      await updateAlignment(db, uid, 1, 2, instinct);
      return json({ ok: true, message: `*Kelvaris takes the marks and sets a key on the bar.*\n\n"Room's yours until morning."\n\n**Your HP is fully restored.**`, hp: maxHp });
    }

    // ── GET: Vendor stock ──
    if (path.startsWith("/api/vendor/") && path.endsWith("/stock") && method === "GET") {
      const npcId = path.slice("/api/vendor/".length, -"/stock".length);
      const stock = VENDOR_STOCK[npcId];
      if (!stock) return err("Unknown vendor.", 404);
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const npcLoc = NPC_LOCATIONS[npcId];
      if (!npcLoc || npcLoc !== row.location) return err("Vendor is not here.", 400);
      return json({ stock });
    }

    // ── GET: Vendor sell offers (prices for player's inventory) ──
    if (path.startsWith("/api/vendor/") && path.endsWith("/sell-offers") && method === "GET") {
      const npcId = path.slice("/api/vendor/".length, -"/sell-offers".length);
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const npcLoc = NPC_LOCATIONS[npcId];
      if (!npcLoc || npcLoc !== row.location) return err("Vendor is not here.", 400);
      if (!VENDOR_NPCS[npcId]?.sell) return err("That vendor doesn't buy.", 400);

      const rows = await dbAll(db, "SELECT item,display_name,tier FROM inventory WHERE user_id=?", [uid]);
      const offers = {};
      for (const r of rows) {
        const tier = r.tier ?? 1;
        if (npcId === "curator") {
          const v = getSellValue(r.display_name || r.item, tier, "loot");
          if (v > 0) offers[r.item] = Math.floor(v * 1.5);
        } else {
          const base = TIER_BASE_VALUES[Math.min(tier, 6)] ?? 10;
          offers[r.item] = Math.floor(base * 0.5);
        }
      }
      return json({ offers });
    }

    // ── POST: Vendor buy ──
    if (path === "/api/vendor/buy" && method === "POST") {
      const { npc, item_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!npc || !item_id) return err("Missing npc or item_id.", 400);

      const npcLoc = NPC_LOCATIONS[npc];
      if (!npcLoc || npcLoc !== row.location) return err("Vendor is not here.", 400);

      const stock = VENDOR_STOCK[npc];
      if (!stock || !VENDOR_NPCS[npc]?.buy) return err("That vendor doesn't sell.", 400);

      const entry = stock.find(s => s.id === item_id);
      if (!entry) return err("Item not in stock.", 404);

      const ash = Number(row.ash_marks ?? 0);
      if (ash < entry.price) return err(`You need ${entry.price} Ash Marks. You have ${ash}.`, 400);

      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?", [entry.price, uid]);
      const invRow = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      const specProp = entry.stats ? JSON.stringify(entry.stats) : null;
      if (invRow) {
        await dbRun(db, "UPDATE inventory SET qty=qty+1, tier=?, display_name=?, special_property=? WHERE user_id=? AND item=?",
          [entry.tier || 1, entry.display_name, specProp, uid, item_id]);
      } else {
        await dbRun(db, `INSERT INTO inventory (user_id, item, qty, tier, corrupted, curse, curse_identified, special_property, display_name)
          VALUES (?, ?, 1, ?, 0, NULL, 0, ?, ?)`,
          [uid, item_id, entry.tier || 1, specProp, entry.display_name]);
      }

      return json({
        ok: true,
        message: `*You purchase ${entry.display_name} for ${entry.price} Ash Marks.*`,
        ash_marks: ash - entry.price,
      });
    }

    // ── GET: Inventory ──
    if (path === "/api/inventory" && method === "GET") {
      const rows = await dbAll(db, "SELECT item,qty,display_name,tier,equipped FROM inventory WHERE user_id=? ORDER BY item", [uid]);
      const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
      const equipment = { weapon: null, armor: null, shield: null };
      for (const eq of eqRows) {
        if (equipment.hasOwnProperty(eq.slot)) equipment[eq.slot] = eq.item;
      }
      const equipmentMap = new Set(eqRows.map(e => e.item));
      const items = rows.map(r => {
        const label = r.display_name || r.item;
        return r.qty === 1 ? label : `${label} x${r.qty}`;
      });
      const itemDetails = rows.map(r => {
        const slot = getItemSlot(r.item, r.display_name);
        const equipped = !!(r.equipped || equipmentMap.has(r.item));
        return {
          id: r.item,
          display_name: r.display_name || r.item,
          qty: r.qty,
          tier: r.tier ?? 1,
          slot: slot ?? null,
          equipped,
        };
      });
      return json({ items, itemDetails, equipment });
    }

    // ── POST: Equip ──
    if (path === "/api/inventory/equip" && method === "POST") {
      const { item: itemId } = body;
      if (!itemId) return err("Missing item.", 400);
      const invRow = await dbGet(db, "SELECT item,qty,display_name,tier FROM inventory WHERE user_id=? AND item=?", [uid, itemId]);
      if (!invRow) return err("You don't have that item.", 404);
      const slot = getItemSlot(itemId, invRow.display_name);
      if (!slot) return err("Not equippable.", 400);
      const old = await dbGet(db, "SELECT item FROM equipment_slots WHERE user_id=? AND slot=?", [uid, slot]);
      if (old) {
        await dbRun(db, "UPDATE inventory SET equipped=0 WHERE user_id=? AND item=?", [uid, old.item]);
        await dbRun(db, "DELETE FROM equipment_slots WHERE user_id=? AND slot=?", [uid, slot]);
      }
      await dbRun(db, "INSERT INTO equipment_slots (user_id, slot, item) VALUES (?, ?, ?)", [uid, slot, itemId]);
      await dbRun(db, "UPDATE inventory SET equipped=1 WHERE user_id=? AND item=?", [uid, itemId]);
      return json({ ok: true, slot, item: itemId });
    }

    // ── POST: Unequip ──
    if (path === "/api/inventory/unequip" && method === "POST") {
      const { slot } = body;
      if (!slot || !["weapon", "armor", "shield"].includes(slot)) return err("Invalid slot.", 400);
      const old = await dbGet(db, "SELECT item FROM equipment_slots WHERE user_id=? AND slot=?", [uid, slot]);
      if (old) {
        await dbRun(db, "UPDATE inventory SET equipped=0 WHERE user_id=? AND item=?", [uid, old.item]);
        await dbRun(db, "DELETE FROM equipment_slots WHERE user_id=? AND slot=?", [uid, slot]);
      }
      return json({ ok: true, slot });
    }

    // ── POST: Sell (to NPC) ──
    if (path === "/api/sell" && method === "POST") {
      const { npc, item: itemId } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!npc || !itemId) return err("Missing npc or item.", 400);

      const npcLoc = NPC_LOCATIONS[npc];
      if (!npcLoc || npcLoc !== row.location) return err(`${npc} is not here.`);

      const invRow = await dbGet(db, "SELECT item,qty,display_name,tier FROM inventory WHERE user_id=? AND item=?", [uid, itemId]);
      if (!invRow) return err("You don't have that item.", 404);

      const displayName = invRow.display_name || invRow.item;
      const tier = invRow.tier || 1;

      if (npc === "curator") {
        const value = getSellValue(displayName, tier, "loot");
        if (value <= 0) return err("Seris won't buy that.", 400);
        const serisValue = Math.floor(value * 1.5);

        const key = displayNameToKey(displayName);
        const interest = key ? SERIS_INTEREST_ITEMS[key] : null;

        await dbRun(db, invRow.qty <= 1
          ? "DELETE FROM inventory WHERE user_id=? AND item=?"
          : "UPDATE inventory SET qty=qty-1 WHERE user_id=? AND item=?",
          invRow.qty <= 1 ? [uid, itemId] : [uid, itemId]);
        await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [serisValue, uid]);

        const sold = await getFlag(db, uid, "curator_items_sold");
        await setFlag(db, uid, "curator_items_sold", (sold || 0) + 1);

        if (interest) {
          if (interest.arcAdvance && interest.arcStage === 1) await setFlag(db, uid, "seris_arc1_active", 1);
          if (interest.arcAdvance && !interest.arcStage) await setFlag(db, uid, `seris_sold_${key}`, 1);

          const dialogue = {
            mild: `*She looks at it with something close to interest.*\n\n"I'll take it. The city leaves marks on things."`,
            strong: `*She examines it without touching.*\n\n"This resonates. I'll buy it. More than it's worth, probably."`,
            break: `*Her composure cracks — just slightly.*\n\n"This is what I've been looking for."`,
            invested: `*She looks at it for a long time.*\n\n"You've been deeper than I thought."`,
          }[interest.dialogue] || dialogue.mild;

          return json({
            ok: true,
            message: `${dialogue}\n\n**+${serisValue} Ash Marks**`,
            ash_marks: (row.ash_marks || 0) + serisValue,
            seris_reaction: true,
          });
        }

        return json({
          ok: true,
          message: `*Seris takes it.*\n\n"${serisValue} marks."\n\n**+${serisValue} Ash Marks**`,
          ash_marks: (row.ash_marks || 0) + serisValue,
        });
      }

      if (npc === "weaponsmith" || npc === "armorsmith" || npc === "alchemist") {
        if (!VENDOR_NPCS[npc]?.sell) return err("You can't sell to that NPC.", 400);
        const base = TIER_BASE_VALUES[Math.min(tier || 1, 6)] ?? 10;
        const value = Math.floor(base * 0.5);

        await dbRun(db, invRow.qty <= 1
          ? "DELETE FROM inventory WHERE user_id=? AND item=?"
          : "UPDATE inventory SET qty=qty-1 WHERE user_id=? AND item=?",
          invRow.qty <= 1 ? [uid, itemId] : [uid, itemId]);
        await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [value, uid]);

        const npcName = NPC_NAMES[npc] || npc;
        return json({
          ok: true,
          message: `*${npcName} takes it.*\n\n"${value} marks."\n\n**+${value} Ash Marks**`,
          ash_marks: (row.ash_marks || 0) + value,
        });
      }

      return err("You can't sell to that NPC.", 400);
    }

    // ── GET: Wallet ──
    if (path === "/api/wallet" && method === "GET") {
      const row = await dbGet(db, "SELECT ash_marks,ember_shards,soul_coins FROM characters WHERE user_id=?", [uid]);
      return json(row || { ash_marks:0, ember_shards:0, soul_coins:0 });
    }

    // ── GET: Progression flags (for character sheet) ──
    if (path === "/api/character/flags" && method === "GET") {
      const flags = {};
      for (const id of PROGRESSION_FLAGS) {
        flags[id] = await getFlag(db, uid, id, 0);
      }
      const othorionTrust = await getFlag(db, uid, "othorion_trust", 0);
      flags.othorion_trusted = othorionTrust >= 3 ? 1 : 0;
      return json(flags);
    }

    // ── GET: Races / Instincts (public) ──
    if (path === "/api/data/races")     return json({ races: RACES });
    if (path === "/api/data/instincts") return json({ instincts: INSTINCTS });

    // ── POST: Logout ──
    if (path === "/api/logout" && method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      if (auth.startsWith("Bearer ")) {
        await dbRun(db, "DELETE FROM sessions WHERE token=?", [auth.slice(7).trim()]);
      }
      return json({ ok: true });
    }

    return err("Not found.", 404);
    }

    return new Response("Not found", { status: 404 });
  }
};
