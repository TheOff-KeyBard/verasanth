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
import { getNPCResponse, boardNPCReaction } from "./services/npc_dialogue.js";
import { statMod, rollDie, maxPlayerHp, randomEnemy, playerAttack, enemyAttack } from "./services/combat.js";

// ─────────────────────────────────────────────────────────────
// GAME DATA (remaining in index)
// ─────────────────────────────────────────────────────────────

const PROGRESSION_FLAGS = [
  "seen_sewer_wall_markings", "seen_sewer_graffiti", "seen_dask_roster", "seen_tier2_graffiti",
  "seen_rusted_pipe", "seen_foundation_dask", "warned_mid_sewer", "has_seen_market_square",
  "found_foundation_stone", "has_room", "has_seen_awakening",
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
  sewer_upper: [
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

// Alignment tick
const ALIGN_INSTINCT_BIAS = {
  hearthborn:    [1, 0],
  ember_touched: [0, 0],
  ironblood:     [0, 0],
  streetcraft:   [0, -1],
  shadowbound:   [0, 0],
  warden:        [0, 0],
};

async function tickAlignment(db, uid, mDelta, oDelta, instinct = "") {
  const [mb, ob] = ALIGN_INSTINCT_BIAS[instinct] || [0, 0];
  mDelta += mb; oDelta += ob;
  const row = await dbGet(db, "SELECT alignment_morality, alignment_order FROM characters WHERE user_id=?", [uid]);
  if (!row) return;
  const newM = Math.max(-100, Math.min(100, (row.alignment_morality || 0) + mDelta));
  const newO = Math.max(-100, Math.min(100, (row.alignment_order    || 0) + oDelta));
  await dbRun(db, "UPDATE characters SET alignment_morality=?, alignment_order=? WHERE user_id=?", [newM, newO, uid]);
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
    strength INTEGER DEFAULT 5, dexterity INTEGER DEFAULT 5,
    constitution INTEGER DEFAULT 5, intelligence INTEGER DEFAULT 5,
    wisdom INTEGER DEFAULT 5, charisma INTEGER DEFAULT 5,
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
  await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", ["tavern", targetUid]);
  await dbRun(db, `UPDATE characters SET instinct=NULL, strength=5, dexterity=5, constitution=5, intelligence=5, wisdom=5, charisma=5, stats_set=0,
    alignment_morality=0, alignment_order=0, ash_marks=0, ember_shards=0, soul_coins=0, xp=0, class_stage=0, current_hp=0 WHERE user_id=?`, [targetUid]);
  await dbRun(db, "DELETE FROM player_flags WHERE user_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM inventory WHERE user_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [targetUid]);
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
    if (uid) await updateLastSeen(db, uid);

    // ── GET: Character ──
    if (path === "/api/character" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const hp = await getPlayerHp(db, uid, row);
      return json({ ...row, max_hp: hp.max });
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
            strength: Number(baseStatsBody.strength) || 5,
            dexterity: Number(baseStatsBody.dexterity) || 5,
            constitution: Number(baseStatsBody.constitution) || 5,
            intelligence: Number(baseStatsBody.intelligence) || 5,
            wisdom: Number(baseStatsBody.wisdom) || 5,
            charisma: Number(baseStatsBody.charisma) || 5,
          }
        : { strength: 5, dexterity: 5, constitution: 5, intelligence: 5, wisdom: 5, charisma: 5 };

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
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const loc  = row.location;
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

      const npcsHere = Object.entries(NPC_LOCATIONS)
        .filter(([,l]) => l === loc).map(([id]) => id);

      const combatRow = await dbGet(db, "SELECT state_json FROM combat_state WHERE user_id=?", [uid]);
      const inCombat  = !!combatRow;

      let exits = Object.keys(room.exits || {});
      let exit_map = { ...(room.exits || {}) };
      if (loc === "market_square") {
        exits = [...exits, "down"];
        exit_map.down = "sewer_entrance";
      }

      return json({
        location: loc, name: room.name, description,
        exits, exit_map,
        objects: Object.keys(room.objects || {}),
        items: [],  // room items seeded statically for now
        npcs: npcsHere,
        in_combat: inCombat,
        fightable: FIGHTABLE_LOCATIONS.has(loc),
      });
    }

    // ── POST: Move ──
    if (path === "/api/move" && method === "POST") {
      const { direction } = body;
      const row  = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const inCombat = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
      if (inCombat) return err("You're in combat. Flee first.");

      const room = WORLD[row.location];
      let dest = room?.exits?.[direction];
      if (row.location === "market_square" && direction === "down") dest = "sewer_entrance";
      if (!dest) return err(`You can't go ${direction} from here.`);
      if (!WORLD[dest]) return err("That path leads nowhere.");

      await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", [dest, uid]);

      // Ambient events
      let ambient = null;
      if (dest === "sewer_mid_cistern") {
        const r = Math.random();
        if (r < 0.1) ambient = "*A single bubble rises from the center of the cistern. The water does not ripple.*";
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

      // Depth flag
      if (dest.startsWith("sewer_mid") || dest.startsWith("sewer_deep") || dest === "sewer_gate") {
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
      const npcsHere = Object.entries(NPC_LOCATIONS)
        .filter(([,l]) => l === dest).map(([id]) => id);

      return json({
        location: dest, name: destRoom.name, description: destDescription,
        exits: destExits,
        exit_map: destExitMap,
        objects: Object.keys(destRoom.objects || {}),
        items: [], npcs: npcsHere, ambient,
        fightable: FIGHTABLE_LOCATIONS.has(dest),
      });
    }

    // ── GET: Inspect ──
    if (path.startsWith("/api/inspect/") && method === "GET") {
      const target = path.slice("/api/inspect/".length);
      const row  = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const room = WORLD[row.location];
      const obj  = room?.objects?.[target];
      if (!obj) return err(`Nothing called '${target}' here.`, 404);
      return json({ target, desc: obj.desc, actions: obj.actions || [] });
    }

    // ── POST: Talk ──
    if (path === "/api/talk" && method === "POST") {
      const { npc, topic = "" } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);

      const npcLoc = NPC_LOCATIONS[npc];
      if (!npcLoc || npcLoc !== row.location) return err(`${npc} is not here.`);

      // Build player context for NPCs (Seris/Thalara + Kelvaris stateful intro)
      const itemsSold   = await getFlag(db, uid, "curator_items_sold");
      const deaths      = await getFlag(db, uid, "death_count");
      const justRespawned = await getFlag(db, uid, "just_respawned");
      const morality    = row.alignment_morality || 0;
      const depthTier   = await getFlag(db, uid, "found_foundation_stone") ? 2
                        : await getFlag(db, uid, "warned_mid_sewer")        ? 1 : 0;
      const kelvarisVisits = await getFlag(db, uid, "kelvaris_visits");
      const hasSeenMarket  = await getFlag(db, uid, "has_seen_market_square");
      const warnedMidSewer  = await getFlag(db, uid, "warned_mid_sewer");
      const hasSeenAwakening = await getFlag(db, uid, "has_seen_awakening", 0);
      const hp = await getPlayerHp(db, uid, row);

      const playerContext = {
        items_sold: itemsSold, deaths, morality, depth_tier: depthTier,
        alignment: morality >= 40 ? "light" : morality <= -40 ? "dark" : "neutral",
        kelvaris_visits: kelvarisVisits,
        has_instinct: !!(row.instinct && row.instinct.trim()),
        stats_set: !!(row.stats_set),
        has_seen_market_square: !!hasSeenMarket,
        has_seen_awakening: !!hasSeenAwakening,
        warned_mid_sewer: !!warnedMidSewer,
        wisdom: row.wisdom,
        charisma: row.charisma,
        intelligence: row.intelligence,
        current_hp: hp.current,
        max_hp: hp.max,
        just_respawned: !!justRespawned,
      };

      const response = await getNPCResponse(env, npc, topic, playerContext);

      if (npc === "bartender") {
        await setFlag(db, uid, "kelvaris_visits", kelvarisVisits + 1);
        if (justRespawned) await setFlag(db, uid, "just_respawned", 0);
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
      await dbRun(db, `UPDATE players SET ash_marks = ? WHERE id = ?`, [ash - 5, uid]);
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
      await tickAlignment(db, uid, mComm, 1, instinct);

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
      // Optional: set player_flags.force_combat_test=1 for deterministic cinder_rat spawn (playtest).
      const forceCombatTest = await getFlag(db, uid, "force_combat_test");
      if (forceCombatTest) {
        const cinderRat = COMBAT_DATA.enemies.cinder_rat;
        enemy = { ...cinderRat, id: cinderRat.id };
      } else {
        enemy = randomEnemy(row.location);
      }
      const state = {
        enemy_id: enemy.id, enemy_name: enemy.name,
        enemy_hp: enemy.hp, enemy_hp_max: enemy.hp,
        player_hp: hp.current, player_hp_max: hp.max,
        ability_used: false, turn: 1, location: row.location,
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

      if (action === "flee") {
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await tickAlignment(db, uid, 0, -1, instinct);
        return json({ result: "fled", message: "*You retreat into the dark.*" });
      }

      if (action === "ability" && state.ability_used) return err("Ability already used.");

      const useAbility = action === "ability";
      const attack     = playerAttack(stats, enemy, useAbility, instinct);
      const enemyDmg   = action === "ability" && attack.skipRetaliation ? 0
                       : Math.floor(enemyAttack(enemy, stats) * (attack.damageReduction ? (1 - attack.damageReduction) : 1));

      if (useAbility) state.ability_used = true;

      let playerHp = state.player_hp;
      let enemyHp  = state.enemy_hp;

      if (attack.heal) {
        playerHp = Math.min(playerHp + attack.heal, state.player_hp_max);
      } else {
        enemyHp  = Math.max(0, enemyHp - attack.dmg);
      }
      playerHp = Math.max(0, playerHp - enemyDmg);

      // Victory
      if (enemyHp <= 0) {
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

        const xpGain = enemy.xp || 50;
        const xpRow  = await dbGet(db, "SELECT xp,class_stage FROM characters WHERE user_id=?", [uid]);
        const newXp  = (xpRow.xp || 0) + xpGain;
        await dbRun(db, "UPDATE characters SET xp=? WHERE user_id=?", [newXp, uid]);
        const canAdvance = newXp >= [0,500,1500,3500,7500,15000][(xpRow.class_stage||0)+1];

        // Loot — simple cash drop
        const lootAsh = Math.floor(Math.random() * 15) + 5;
        await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [lootAsh, uid]);

        const mKill = instinct === "ironblood" ? 0 : -1;
        await tickAlignment(db, uid, mKill, 1, instinct);

        return json({
          result: "victory",
          message: `*${enemy.name} falls.*\n\n${attack.narrative}\n\n**+${xpGain} XP** | **+${lootAsh} Ash Marks**`,
          can_advance: !!canAdvance, player_hp: playerHp,
        });
      }

      // Death
      if (playerHp <= 0) {
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE characters SET current_hp=0, ash_marks=0 WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE players SET location='tavern' WHERE user_id=?", [uid]);
        const maxHp = maxPlayerHp(row.constitution);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [maxHp, uid]);
        const dc = await getFlag(db, uid, "death_count");
        await setFlag(db, uid, "death_count", dc + 1);
        await setFlag(db, uid, "just_respawned", 1);
        await tickAlignment(db, uid, 0, -2, instinct);
        return json({
          result: "death",
          message: `*${enemy.name} stands over you.*\n\n*You wake in the Shadow Hearth Inn. Your marks are gone.*`,
        });
      }

      // Ongoing
      state.enemy_hp  = enemyHp;
      state.player_hp = playerHp;
      state.turn++;
      await dbRun(db, "UPDATE combat_state SET state_json=? WHERE user_id=?", [JSON.stringify(state), uid]);
      await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

      return json({
        result: "ongoing",
        message: `${attack.narrative}\n\n*${enemy.name} retaliates — ${enemyDmg > 0 ? `${enemyDmg} damage.` : "misses."}*`,
        player_hp: playerHp, enemy_hp: enemyHp,
        enemy_hp_max: state.enemy_hp_max,
      });
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
      await tickAlignment(db, uid, 1, 2, instinct);
      return json({ ok: true, message: `*Kelvaris takes the marks and sets a key on the bar.*\n\n"Room's yours until morning."\n\n**Your HP is fully restored.**`, hp: maxHp });
    }

    // ── GET: Inventory ──
    if (path === "/api/inventory" && method === "GET") {
      const rows = await dbAll(db, "SELECT item,qty FROM inventory WHERE user_id=? ORDER BY item", [uid]);
      const items = rows.map(r => r.qty === 1 ? r.item : `${r.item} x${r.qty}`);
      return json({ items });
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
