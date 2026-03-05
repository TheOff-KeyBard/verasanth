/**
 * Admin Command System — Verasanth
 * Registry, validation, and handlers for admin-only commands.
 * Call via POST /api/admin/command with X-Admin-Key header.
 */

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

function validateParams(paramSpec, params) {
  for (const spec of paramSpec) {
    const val = params[spec.name];
    if (val === undefined || val === null) {
      if (spec.optional) continue;
      return { ok: false, error: `Missing required parameter: ${spec.name}` };
    }
    if (spec.type === "playerId" || spec.type === "number") {
      const n = Number(val);
      if (!Number.isInteger(n)) return { ok: false, error: `${spec.name} must be an integer` };
      if (spec.type === "playerId" && n < 1) return { ok: false, error: `${spec.name} must be a positive integer` };
    } else if (spec.type === "string" && typeof val !== "string") {
      return { ok: false, error: `${spec.name} must be a string` };
    }
  }
  return { ok: true };
}

function parseParams(paramSpec, params) {
  const out = {};
  for (const spec of paramSpec) {
    let val = params[spec.name];
    if (val === undefined && spec.optional && spec.default !== undefined) val = spec.default;
    if (val === undefined && spec.optional) continue;
    if (spec.type === "playerId" || spec.type === "number") out[spec.name] = Number(val);
    else out[spec.name] = val;
  }
  return out;
}

const STAT_KEYS = ["strength", "dexterity", "constitution", "intelligence", "wisdom", "charisma"];
const PROGRESSION_FLAGS = [
  "seen_sewer_wall_markings",
  "seen_sewer_graffiti",
  "seen_dask_roster",
  "seen_tier2_graffiti",
  "seen_rusted_pipe",
  "seen_foundation_dask",
  "warned_mid_sewer",
  "has_seen_market_square",
  "found_foundation_stone",
  "has_room",
];

const registry = {
  wipeCharacter: {
    name: "wipeCharacter",
    description: "Reset character to initial state (location=tavern, clear stats/flags/inventory/combat)",
    paramSpec: [{ name: "playerID", type: "playerId" }],
    handler: async (db, env, params) => {
      const uid = params.playerID;
      await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", ["tavern", uid]);
      await dbRun(
        db,
        `UPDATE characters SET instinct=NULL, strength=5, dexterity=5, constitution=5, intelligence=5, wisdom=5, charisma=5, stats_set=0,
        alignment_morality=0, alignment_order=0, ash_marks=0, ember_shards=0, soul_coins=0, xp=0, class_stage=0, current_hp=0 WHERE user_id=?`,
        [uid]
      );
      await dbRun(db, "DELETE FROM player_flags WHERE user_id=?", [uid]);
      await dbRun(db, "DELETE FROM inventory WHERE user_id=?", [uid]);
      await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
      return { success: true, message: "Character wiped. Player reset to tavern." };
    },
  },

  wipePlayer: {
    name: "wipePlayer",
    description: "Delete player and all related data (inventory, flags, character, sessions, account)",
    paramSpec: [{ name: "playerID", type: "playerId" }],
    handler: async (db, env, params) => {
      const uid = params.playerID;
      await dbRun(db, "DELETE FROM inventory WHERE user_id=?", [uid]);
      await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
      await dbRun(db, "DELETE FROM player_flags WHERE user_id=?", [uid]);
      await dbRun(db, "DELETE FROM characters WHERE user_id=?", [uid]);
      await dbRun(db, "DELETE FROM sessions WHERE user_id=?", [uid]);
      await dbRun(db, "DELETE FROM accounts WHERE user_id=?", [uid]);
      await dbRun(db, "DELETE FROM players WHERE user_id=?", [uid]);
      return { success: true, message: `Player ${uid} and all data removed.` };
    },
  },

  wipeAllPlayers: {
    name: "wipeAllPlayers",
    description: "Delete all players and all related data",
    paramSpec: [],
    handler: async (db) => {
      const players = await dbAll(db, "SELECT user_id FROM players", []);
      for (const p of players) {
        const uid = p.user_id;
        await dbRun(db, "DELETE FROM inventory WHERE user_id=?", [uid]);
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "DELETE FROM player_flags WHERE user_id=?", [uid]);
        await dbRun(db, "DELETE FROM characters WHERE user_id=?", [uid]);
        await dbRun(db, "DELETE FROM sessions WHERE user_id=?", [uid]);
        await dbRun(db, "DELETE FROM accounts WHERE user_id=?", [uid]);
      }
      await dbRun(db, "DELETE FROM players");
      return { success: true, message: "All players wiped." };
    },
  },

  resetStats: {
    name: "resetStats",
    description: "Reset character stats to 5, stats_set=0, current_hp=0",
    paramSpec: [{ name: "playerID", type: "playerId" }],
    handler: async (db, env, params) => {
      const uid = params.playerID;
      await dbRun(
        db,
        "UPDATE characters SET strength=5, dexterity=5, constitution=5, intelligence=5, wisdom=5, charisma=5, stats_set=0, current_hp=0 WHERE user_id=?",
        [uid]
      );
      return { success: true, message: `Stats reset for player ${uid}.` };
    },
  },

  setStat: {
    name: "setStat",
    description: "Set one stat (strength, dexterity, constitution, intelligence, wisdom, charisma)",
    paramSpec: [
      { name: "playerID", type: "playerId" },
      { name: "statName", type: "string" },
      { name: "value", type: "number" },
    ],
    handler: async (db, env, params) => {
      const { playerID, statName, value } = params;
      if (!STAT_KEYS.includes(statName))
        return { success: false, error: `statName must be one of: ${STAT_KEYS.join(", ")}` };
      const v = Number(value);
      if (!Number.isInteger(v))
        return { success: false, error: "value must be an integer" };
      await dbRun(db, `UPDATE characters SET ${statName}=? WHERE user_id=?`, [v, playerID]);
      return { success: true, message: `Set ${statName}=${v} for player ${playerID}.` };
    },
  },

  giveItem: {
    name: "giveItem",
    description: "Give item to player",
    paramSpec: [
      { name: "playerID", type: "playerId" },
      { name: "itemID", type: "string" },
      { name: "amount", type: "number", optional: true, default: 1 },
    ],
    handler: async (db, env, params) => {
      const uid = params.playerID;
      const item = String(params.itemID).trim();
      const amount = Math.max(1, Number(params.amount) || 1);
      const row = await dbGet(db, "SELECT qty FROM inventory WHERE user_id=? AND item=?", [uid, item]);
      if (row) {
        await dbRun(db, "UPDATE inventory SET qty=qty+? WHERE user_id=? AND item=?", [amount, uid, item]);
      } else {
        await dbRun(db, "INSERT INTO inventory(user_id,item,qty) VALUES(?,?,?)", [uid, item, amount]);
      }
      return { success: true, message: `Gave ${amount} ${item} to player ${uid}.` };
    },
  },

  removeItem: {
    name: "removeItem",
    description: "Remove item from player",
    paramSpec: [
      { name: "playerID", type: "playerId" },
      { name: "itemID", type: "string" },
      { name: "amount", type: "number", optional: true, default: 1 },
    ],
    handler: async (db, env, params) => {
      const uid = params.playerID;
      const item = String(params.itemID).trim();
      const amount = Math.max(1, Number(params.amount) || 1);
      const row = await dbGet(db, "SELECT qty FROM inventory WHERE user_id=? AND item=?", [uid, item]);
      if (!row) return { success: false, error: "Player does not have that item." };
      const newQty = row.qty - amount;
      if (newQty <= 0) {
        await dbRun(db, "DELETE FROM inventory WHERE user_id=? AND item=?", [uid, item]);
        return { success: true, message: `Removed all ${item} from player ${uid}.` };
      }
      await dbRun(db, "UPDATE inventory SET qty=? WHERE user_id=? AND item=?", [newQty, uid, item]);
      return { success: true, message: `Removed ${amount} ${item} from player ${uid}.` };
    },
  },

  setCurrency: {
    name: "setCurrency",
    description: "Set player ash_marks",
    paramSpec: [
      { name: "playerID", type: "playerId" },
      { name: "amount", type: "number" },
    ],
    handler: async (db, env, params) => {
      const uid = params.playerID;
      const amount = Math.max(0, Math.floor(Number(params.amount)) || 0);
      await dbRun(db, "UPDATE characters SET ash_marks=? WHERE user_id=?", [amount, uid]);
      return { success: true, message: `Set ash_marks=${amount} for player ${uid}.` };
    },
  },

  resetWorldRegion: {
    name: "resetWorldRegion",
    description: "Reset world region (stub)",
    paramSpec: [{ name: "regionID", type: "string", optional: true }],
    handler: async () => ({ success: true, message: "No region state to reset." }),
  },

  setTime: {
    name: "setTime",
    description: "Set time (stub)",
    paramSpec: [{ name: "timeValue", type: "string", optional: true }],
    handler: async () => ({ success: true, message: "Time not implemented." }),
  },

  setWeather: {
    name: "setWeather",
    description: "Set weather (stub)",
    paramSpec: [{ name: "weatherType", type: "string", optional: true }],
    handler: async () => ({ success: true, message: "Weather not implemented." }),
  },

  tp: {
    name: "tp",
    description: "Teleport player to location (room ID)",
    paramSpec: [
      { name: "playerID", type: "playerId" },
      { name: "location", type: "string" },
    ],
    handler: async (db, env, params) => {
      const loc = String(params.location).trim();
      const WORLD = env.WORLD || {};
      if (!WORLD[loc]) return { success: false, error: `Unknown location: ${loc}` };
      await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", [loc, params.playerID]);
      return { success: true, message: `Player ${params.playerID} moved to ${loc}.` };
    },
  },

  spawnNPC: {
    name: "spawnNPC",
    description: "Spawn NPC (stub — NPCs are static)",
    paramSpec: [
      { name: "npcID", type: "string", optional: true },
      { name: "location", type: "string", optional: true },
    ],
    handler: async () => ({ success: true, message: "NPCs are static." }),
  },

  setFlag: {
    name: "setFlag",
    description: "Set player flag",
    paramSpec: [
      { name: "playerID", type: "playerId" },
      { name: "flagID", type: "string" },
      { name: "value", type: "number", optional: true, default: 1 },
    ],
    handler: async (db, env, params) => {
      const setFlagFn = env.setFlag;
      if (typeof setFlagFn !== "function") return { success: false, error: "setFlag not available" };
      await setFlagFn(params.playerID, params.flagID, params.value ?? 1);
      return { success: true, message: `Set flag ${params.flagID}=${params.value ?? 1} for player ${params.playerID}.` };
    },
  },

  getFlag: {
    name: "getFlag",
    description: "Get player flag value",
    paramSpec: [
      { name: "playerID", type: "playerId" },
      { name: "flagID", type: "string" },
    ],
    handler: async (db, env, params) => {
      const getFlagFn = env.getFlag;
      if (typeof getFlagFn !== "function") return { success: false, error: "getFlag not available" };
      const value = await getFlagFn(params.playerID, params.flagID);
      return { success: true, data: value, message: `Flag ${params.flagID}=${value}.` };
    },
  },

  unlockAll: {
    name: "unlockAll",
    description: "Set all progression flags for player",
    paramSpec: [{ name: "playerID", type: "playerId" }],
    handler: async (db, env, params) => {
      const setFlagFn = env.setFlag;
      if (typeof setFlagFn !== "function") return { success: false, error: "setFlag not available" };
      const uid = params.playerID;
      for (const flag of PROGRESSION_FLAGS) {
        await setFlagFn(uid, flag, 1);
      }
      return { success: true, message: `Set all progression flags for player ${uid}.` };
    },
  },

  forceEvent: {
    name: "forceEvent",
    description: "Force event (stub)",
    paramSpec: [{ name: "eventID", type: "string", optional: true }],
    handler: async () => ({ success: true, message: "Events not implemented." }),
  },

  getPlayerState: {
    name: "getPlayerState",
    description: "Get full player state (character, location, inventory, flags) by player ID or username",
    paramSpec: [{ name: "playerIDOrUsername", type: "string" }],
    handler: async (db, env, params) => {
      const raw = String(params.playerIDOrUsername || "").trim();
      if (!raw) return { success: false, error: "playerIDOrUsername is required." };
      let uid = null;
      const num = parseInt(raw, 10);
      if (String(num) === raw && num >= 1) {
        uid = num;
      } else {
        const acc = await dbGet(db, "SELECT user_id FROM accounts WHERE username=?", [raw.toLowerCase()]);
        if (!acc) return { success: false, error: `No account found for username: ${raw}` };
        uid = acc.user_id;
      }
      const player = await dbGet(db, "SELECT user_id, location FROM players WHERE user_id=?", [uid]);
      if (!player) return { success: false, error: `No player found for ID: ${uid}` };
      const character = await dbGet(db, "SELECT name, race, instinct, strength, dexterity, constitution, intelligence, wisdom, charisma, stats_set, ash_marks, ember_shards, soul_coins, current_hp, xp, class_stage FROM characters WHERE user_id=?", [uid]);
      const inventory = await dbAll(db, "SELECT item, qty FROM inventory WHERE user_id=?", [uid]);
      const flags = await dbAll(db, "SELECT flag, value FROM player_flags WHERE user_id=?", [uid]);
      const maxHp = character ? 8 + Math.floor((Number(character.constitution) - 10) / 2) * 2 : 0;
      return {
        success: true,
        data: {
          playerId: uid,
          location: player.location,
          character: character ? { ...character, max_hp: maxHp } : null,
          inventory: inventory.map((r) => ({ item: r.item, qty: r.qty })),
          flags: flags.map((r) => ({ flag: r.flag, value: r.value })),
        },
        message: `Player ${uid} state loaded.`,
      };
    },
  },

  listPlayers: {
    name: "listPlayers",
    description: "List all players with their user_id, username, location, and character name",
    paramSpec: [],
    handler: async (db) => {
      const players = await dbAll(db, `
        SELECT a.user_id, a.username, p.location, c.name
        FROM accounts a
        LEFT JOIN players p ON p.user_id = a.user_id
        LEFT JOIN characters c ON c.user_id = a.user_id
        ORDER BY a.user_id ASC
      `, []);
      return { success: true, data: players, message: `${players.length} players.` };
    },
  },

  listCommands: {
    name: "listCommands",
    description: "List all admin commands and their paramSpec",
    paramSpec: [],
    handler: async (db, env) => {
      const data = Object.entries(registry).map(([name, entry]) => ({
        name: entry.name,
        description: entry.description,
        paramSpec: entry.paramSpec,
      }));
      return { success: true, data, message: `${data.length} commands.` };
    },
  },
};

async function runAdminCommand(db, env, command, params) {
  const cmd = registry[command];
  if (!cmd) return { success: false, error: `Unknown command: ${command}` };
  const validation = validateParams(cmd.paramSpec, params || {});
  if (!validation.ok) return { success: false, error: validation.error };
  const parsed = parseParams(cmd.paramSpec, params || {});
  try {
    return await cmd.handler(db, env, parsed);
  } catch (e) {
    return { success: false, error: e.message || String(e) };
  }
}

export { registry, runAdminCommand };
