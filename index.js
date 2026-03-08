/**
 * Verasanth — Cloudflare Worker Backend
 * Database: Cloudflare D1 (SQLite-compatible)
 * All game data embedded — no Python imports needed.
 * Design direction: see GAME_DIRECTION.md
 */

import { runAdminCommand } from "./admin.js";
import { WORLD, FIRST_VISIT_INTROS } from "./data/world.js";
import { COMBAT_DATA, FIGHTABLE_LOCATIONS, ENCOUNTER_CHANCES, ENCOUNTER_CUES, SCENT_ITEMS, PREDATOR_ENEMIES, getPredatorCue, AMBUSH_ROOMS, getAmbushCue, LOCATION_TO_FLOOR } from "./data/combat.js";
import { RACES } from "./data/races.js";
import { INSTINCTS } from "./data/instincts.js";
import { LEVEL_5_UPGRADES } from "./data/upgrades.js";
import { NPC_LOCATIONS, NPC_NAMES, NPC_TOPICS, BARTENDER_FEE } from "./data/npcs.js";
import { SERIS_NOTICES, FLAVOR_NOTICES, ANONYMOUS_NOTICES, IMPOSSIBLE_TEMPLATES, BOARD_NPC_REACTIONS } from "./data/board.js";
import { SERIS_INTEREST_ITEMS, getSellValue, displayNameToKey, TIER_BASE_VALUES } from "./data/seris.js";
import { VENDOR_STOCK, VENDOR_NPCS, CAELIR_STOCK, VEYRA_STOCK } from "./data/vendor_stock.js";
import { VENDOR_STOCK as ECON_VENDOR_STOCK, getSellPrice as econGetSellPrice, getItemForSell, rollCashLoot, rollItemDrop, LOOT_ITEMS, REFINED_REAGENTS } from "./data/economy.js";
import { getNPCResponse, boardNPCReaction } from "./services/npc_dialogue.js";
import { PIP_REACTIONS } from "./data/npc_dialogue_lines.js";
import { statMod, rollDie, maxPlayerHp, randomEnemy, resolvePlayerAction, resolveEnemyAttack, tickStatusEffects, tickStatuses, resolveEnemyTrait, getTraitDamageModifier, getStatusEffectOnHit, getTraitOnHitEffect, INSTINCT_DEFS } from "./services/combat.js";
import { resolveUpgradeAbility } from "./services/upgrade_resolver.js";
import { generateItem } from "./services/item_generator.js";
import { getCombatLoot, ROOM_LOOT } from "./data/sewer_loot.js";
import { rollLoot, ITEM_DATA, getEffectSummary } from "./data/items.js";
import { SEWER_CONDITIONS } from "./data/sewer_conditions.js";
import { getRelationship, setRelationship, getPartyMembers, triggerBetrayalCascade } from "./services/pvp.js";
import { handleQuestDialogue, recordEnemyKill, checkQuestProgressForItem, assignNextQuestIfAvailable } from "./services/quests.js";
import { QUEST_BY_ID } from "./data/quests.js";
import { rotateSewerCondition } from "./services/sewer_rotation.js";
import { LEGACY_SLOT_MAP, EQUIPMENT_SLOTS, EQUIPMENT_DATA, INSTINCT_AFFINITIES } from "./data/equipment.js";
import { getEquipmentSlot, resolveLegacySlot, isValidEquipmentSlot, canEquipItem, equipItem, unequipItem, getEquippedItemMap, getAffinityHint, getCharacterLevel } from "./services/equipment.js";
import { aggregateEquipmentStats, applyInstinctAffinities, getItemEffectiveStats } from "./services/equipment_stats.js";

// ─────────────────────────────────────────────────────────────
// ECONOMY HELPERS
// ─────────────────────────────────────────────────────────────

// Economy Blueprint v2: service costs and buff flag names
const SMITH_SERVICES = { edge_hone: 8, balanced_grip: 10, heavy_draw: 12 };
const ARMOR_SERVICES = { strap_tighten: 8, weight_redistribute: 10, shield_brace: 12 };
const THALARA_SERVICES = { cleansing_tonic: 20, ember_tonic: 18, deep_lung_draught: 15 };
const COMBAT_BUFF_FLAGS = [
  "buff_edge_hone_combats_remaining", "buff_balanced_grip_combats_remaining", "buff_heavy_draw_combats_remaining",
  "buff_strap_tighten_combats_remaining", "buff_weight_redist_combats_remaining", "buff_shield_brace_combats_remaining",
  "buff_ember_tonic_combats_remaining", "buff_deep_lung_combats_remaining",
];

async function decrementCombatBuffs(db, uid) {
  for (const flag of COMBAT_BUFF_FLAGS) {
    const v = await getFlag(db, uid, flag, 0);
    if (v > 1) await setFlag(db, uid, flag, v - 1);
    else if (v === 1) await dbRun(db, "DELETE FROM player_flags WHERE user_id=? AND flag=?", [uid, flag.toLowerCase()]);
  }
}

/** Format Ash Marks for display. 1 CC = 100 AM. Never stored. */
function formatAM(am) {
  const a = Math.floor(Number(am) || 0);
  const cc = Math.floor(a / 100);
  const rem = a % 100;
  const parts = [];
  if (cc) parts.push(`${cc} CC`);
  if (rem || !parts.length) parts.push(`${rem} AM`);
  if (cc) parts.push(`(${a} AM)`);
  return parts.join(" ");
}

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

// Phase 3: Roaming monsters — patrol routes use actual location IDs
const ROAMER_DEFS = {
  the_hollow_warden: {
    enemy_id: "hollow_guard",
    name: "The Hollow Warden",
    start_room: "broken_pump_room",
    patrol: ["broken_pump_room", "submerged_tunnel", "flooded_hall", "drowned_vault", "broken_pump_room"],
    approach_cues: [
      "*Armor scrapes against stone somewhere nearby. Getting closer.*",
      "*A rhythmic clang echoes through the walls. Regular. Deliberate.*",
      "*Something heavy is moving in the passage you just came from.*",
    ],
    arrival_cue: "*The Hollow Warden steps into the passage. It does not hurry.*",
  },
  the_cistern_thing: {
    enemy_id: "sewer_horror",
    name: "The Cistern Thing",
    start_room: "drowned_vault",
    patrol: ["drowned_vault", "ash_pillar_hall", "sump_pit", "ash_pillar_hall", "drowned_vault"],
    approach_cues: [
      "*The water in the drain shifts. Something large displaced it.*",
      "*A deep vibration travels up through the stone under your feet.*",
      "*You hear something breathing that has no rhythm you recognize.*",
    ],
    arrival_cue: "*Something rises from the dark at the far end of the chamber.*",
  },
};

function getRoomNeighbors(locationId) {
  const room = WORLD[locationId];
  if (!room?.exits) return [];
  return Object.values(room.exits).map((v) => (typeof v === "string" ? v : v?.target));
}

/** Landmark aliases for quick-travel (POST /api/go). */
const LANDMARKS = {
  market: "market_square", tavern: "tavern", inn: "tavern",
  sanctuary: "ashen_sanctuary", apothecary: "atelier", shop: "atelier",
  crucible: "crucible", naxirs: "naxirs_crucible",
  sewer: "sewer_entrance", down: "sewer_entrance",
};

/** Rooms you "enter" (building, shop, dungeon) vs "travel" (street, passage). */
const ENTER_TARGETS = new Set([
  "tavern", "atelier", "mended_hide", "still_scale", "hollow_jar", "ashen_sanctuary",
  "naxirs_crucible", "crucible", "backroom", "sewer_entrance", "cinder_cells_entrance",
  "cinder_cells_hall", "cinder_cells_block", "cinder_cells_pit", "drain_entrance",
]);

/** One-sentence travel narration by exit type. */
function getTravelNarration(fromRoom, toRoom, exitType) {
  if (exitType === "enter") {
    return `You step inside. ${(toRoom?.entry_line || "").trim()}`.trim() || "You step inside.";
  }
  const narrations = [
    `You move through the ${fromRoom?.district || "city"}.`,
    "The street shifts around you.",
    "You walk on.",
    "The way ahead opens.",
  ];
  const idx = (fromRoom?.name?.length || 0) % narrations.length;
  return narrations[idx];
}

/** Convert exit_map to typed exits for API response. */
function normalizeExits(exitMap) {
  if (!exitMap || typeof exitMap !== "object") return [];
  return Object.entries(exitMap).map(([direction, target]) => {
    const targetId = typeof target === "string" ? target : target?.target;
    if (!targetId) return null;
    const type = ENTER_TARGETS.has(targetId) ? "enter" : "travel";
    const label = WORLD[targetId]?.name || targetId;
    return { target: targetId, direction, type, label };
  }).filter(Boolean);
}

// Phase 3: Environmental hazards — sewer_hazards table (sewer_conditions is for rotation)
const HAZARD_DEFS = {
  gas_pocket: {
    label: "Sewer Gas",
    rooms: ["broken_pump_room", "submerged_tunnel", "overflow_channel"],
    damage: { min: 3, max: 8 },
    cue_enter: "*The air here has a quality that makes your eyes water. Breathe shallow.*",
    cue_damage: "*The gas burns your throat. You take {dmg} damage.*",
    duration_ms: 8 * 60 * 1000,
    spawn_chance: 0.3,
  },
  rising_water: {
    label: "Rising Water",
    rooms: ["flooded_hall", "overflow_channel", "submerged_tunnel"],
    damage: { min: 2, max: 5 },
    cue_enter: "*The water is higher than it should be. The current pulls at your legs.*",
    cue_damage: "*The current knocks you against the wall. {dmg} damage.*",
    encounter_bonus: 15,
    duration_ms: 12 * 60 * 1000,
    spawn_chance: 0.2,
  },
  fungal_bloom: {
    label: "Fungal Bloom",
    rooms: ["ash_pillar_hall", "sump_pit", "drowned_vault"],
    damage: { min: 1, max: 4 },
    cue_enter: "*The walls are thick with pale growth. The spores drift visibly in your torchlight.*",
    cue_damage: "*Spores fill your lungs. {dmg} damage. Something in the bloom pulses.*",
    encounter_bonus: 20,
    duration_ms: 15 * 60 * 1000,
    spawn_chance: 0.25,
  },
  collapse_risk: {
    label: "Unstable Ceiling",
    rooms: ["drowned_vault", "cathedral_floor", "vermin_nest"],
    damage: { min: 5, max: 14 },
    cue_enter: "*Dust falls from the ceiling in slow streams. The stone creaks overhead.*",
    cue_damage: "*Stone falls. {dmg} damage. Move fast.*",
    one_shot: true,
    duration_ms: 20 * 60 * 1000,
    spawn_chance: 0.15,
  },
};

// Phase 3: Boss spawn conditions — earned, telegraphed
const BOSS_DEFS = {
  rat_king: {
    enemy_id: "rat_king",
    name: "The Rat King",
    spawn_room: "vermin_nest",
    conditions: { kills_in_location: { location: "vermin_nest", min: 3 } },
    telegraph: [
      "*The ash on the floor shifts. Everything in the den has gone still.*",
      "*The clicking stops. Complete silence for the first time since you entered.*",
      "*Something very large moves beneath the ash pile. It has been waiting.*",
    ],
    arrival: "*The ash erupts. The Rat King rises.*",
    reward: { ash_marks: 350, item: "rat_king_musk", flag: "boss_rat_king_killed" },
  },
  the_warden_captain: {
    enemy_id: "hollow_guard",
    name: "The Warden Captain",
    spawn_room: "broken_pump_room",
    hp_override: 80,
    conditions: { player_kills_total: { min: 10 }, depth_tier: { min: 2 } },
    telegraph: [
      "*The wall orders on the board rattle. The duty roster updates itself.*",
      "*A voice — hollow, metallic — reads a name from the list. Your name is not on the list.*",
      "*The shapes under the cloth on the sleeping platforms all sit up at once.*",
    ],
    arrival: "*The Warden Captain steps through the far door. It has been waiting for someone to report to.*",
    reward: { ash_marks: 500, flag: "boss_warden_captain_killed" },
  },
  the_cistern_depth: {
    enemy_id: "sewer_horror",
    name: "The Depth",
    spawn_room: "drowned_vault",
    hp_override: 120,
    conditions: { player_kills_total: { min: 20 }, depth_tier: { min: 3 }, hazard_active: { type: "rising_water" } },
    telegraph: [
      "*The cistern water begins to drain. Slowly. All at once.*",
      "*The walkway trembles. Something is climbing the wall below you.*",
      "*The echoes stop. The cistern has gone completely silent for the first time.*",
    ],
    arrival: "*The water level drops to nothing. Something enormous fills the space where it was.*",
    reward: { ash_marks: 800, item: "custodian_core", flag: "boss_depth_killed" },
  },
};

// Boss nodes: when combat starts here and player lacks flag, force this boss. On victory, set flag.
const BOSS_NODES = {
  rusted_gate: { boss_id: "rat_king", flag: "boss_floor1" },
  spore_garden: { boss_id: "sporebound_custodian", flag: "boss_floor2" },
  drowned_vault: { boss_id: "cistern_leviathan", flag: "boss_floor3" },
  broken_regulator_chamber: { boss_id: "broken_regulator", flag: "boss_floor4" },
  ash_heart_chamber: { boss_id: "ash_heart_custodian", flag: "boss_floor5" },
};

function rollEncounter(location, modifiers = {}) {
  const base = ENCOUNTER_CHANCES[location] ?? 0;
  if (base === 0) return false;
  const { woundedBonus = 0, lootBonus = 0, crimeHeatBonus = 0, postFightBonus = 0, scentBonus = 0, reputationBonus = 0, hazardBonus = 0 } = modifiers;
  const total = base + woundedBonus + lootBonus + crimeHeatBonus + postFightBonus + scentBonus + reputationBonus + hazardBonus;
  return Math.random() * 100 < Math.min(total, 85);
}

function getEncounterCue(location) {
  for (const [prefix, cues] of Object.entries(ENCOUNTER_CUES)) {
    if (prefix === "default") continue;
    if (location.startsWith(prefix) || location === prefix) {
      return cues[Math.floor(Math.random() * cues.length)];
    }
  }
  const fallback = ENCOUNTER_CUES.default;
  return fallback[Math.floor(Math.random() * fallback.length)];
}

/** City locations where bounty hunters can spawn when crime_heat is high */
const REPUTATION_CITY_LOCATIONS = new Set(["market_square", "north_road", "south_road", "east_road", "west_road"]);

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

async function addItemToInventory(db, uid, itemId, qty = 1) {
  const displayName = ITEM_DATA[itemId]?.name || itemId;
  const tier = 1;
  await dbRun(db,
    `INSERT INTO inventory (user_id, item, qty, tier, display_name) VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id, item) DO UPDATE SET qty = qty + excluded.qty`,
    [uid, itemId, qty, tier, displayName]
  );
}

// Player sheet
async function getPlayerSheet(db, uid) {
  return await dbGet(db, `
    SELECT p.user_id, p.location, p.last_encounter_at,
           c.alignment_morality, c.alignment_order, c.crime_heat, c.archetype,
           c.name, c.race, c.instinct,
           c.strength, c.dexterity, c.constitution,
           c.intelligence, c.wisdom, c.charisma,
           c.stats_set, c.alignment_morality, c.alignment_order,
           c.ash_marks, c.ember_shards, c.soul_coins,
           c.xp, c.class_stage, c.current_hp, c.upgrades
    FROM players p
    LEFT JOIN characters c ON c.user_id=p.user_id
    WHERE p.user_id=?`, [uid]);
}

// HP
async function getPlayerHp(db, uid, row) {
  const con = row ? row.constitution : 10;
  const classStage = row?.class_stage ?? 0;
  const maxHp = maxPlayerHp(con, classStage);
  // Use NULL (not 0) as the "never initialized" sentinel.
  // 0 is a valid HP value — a player can be at 0 HP and still alive
  // (e.g. won a fight on 1 HP, took hazard damage, etc.)
  const cur = (row && row.current_hp != null) ? row.current_hp : maxHp;
  // Cap current to max so mid-run players don't die if max recalculates downward
  return { current: Math.min(cur, maxHp), max: maxHp };
}

// Consumable effect application (item use)
async function applyConsumableEffect(db, dbRun, dbGet, uid, effect, combatState) {
  const result = {
    message: effect.message,
    hp_change: 0,
    buff: null,
    status_removed: null,
    enemy_damage: 0,
  };
  const row = await dbGet(db, "SELECT constitution, current_hp, class_stage FROM characters WHERE user_id=?", [uid]);
  const hp = await getPlayerHp(db, uid, row);

  if (effect.type === "heal") {
    const newHp = Math.min(hp.max, hp.current + effect.value);
    await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [newHp, uid]);
    result.hp_change = newHp - hp.current;
  }

  if (effect.type === "buff") {
    result.buff = {
      stat: effect.stat,
      value: effect.value,
      turns_remaining: effect.duration_turns,
      source: "consumable",
    };
  }

  if (effect.type === "utility" && effect.removes_status) {
    result.status_removed = effect.removes_status;
    if (combatState?.statuses) delete combatState.statuses[effect.removes_status];
  }

  if (effect.type === "damage") {
    result.enemy_damage = effect.value;
  }

  return result;
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
  shadowbound: [-1, 0],  // chaos-leaning
  warden: [1, 1],         // moral + ordered
};

async function updateAlignment(db, uid, mercyDelta, orderDelta, instinct = "") {
  try {
    const [mb, ob] = ALIGN_INSTINCT_BIAS[instinct] || [0, 0];
    mercyDelta += mb;
    orderDelta += ob;
    const row = await dbGet(db, "SELECT alignment_morality, alignment_order, crime_heat FROM characters WHERE user_id=?", [uid]);
    if (!row) return;
    const newMercy = Math.max(-200, Math.min(200, (row.alignment_morality || 0) + mercyDelta));
    const newOrder = Math.max(-200, Math.min(200, (row.alignment_order || 0) + orderDelta));
    const archetype = computeArchetype(newMercy, newOrder, row.crime_heat || 0);
    await dbRun(db, "UPDATE characters SET alignment_morality=?, alignment_order=?, archetype=? WHERE user_id=?", [newMercy, newOrder, archetype, uid]);
  } catch {
    // Alignment update is non-critical — swallow errors so they never
    // interrupt combat, flee, death, or commune responses
  }
}

async function checkBountyThreshold(db, uid, heat) {
  const existing = await dbGet(db, "SELECT id FROM bounties WHERE target_id=? AND status='active' AND type='official'", [uid]);
  if (existing) return;
  const reward = heat >= 16 ? 1500 : heat >= 11 ? 750 : heat >= 7 ? 400 : heat >= 4 ? 200 : 0;
  if (reward === 0) return;
  const now = Date.now();
  await dbRun(db, "INSERT INTO bounties (type, target_id, reward, posted_at, expires_at, location) VALUES (?,?,?,?,?,?)",
    ["official", uid, reward, now, now + 7 * 24 * 60 * 60 * 1000, "wardens_post"]);
}

async function addCrimeHeat(db, uid, heat, crimeType, opts = {}) {
  const { mercyChange = 0, orderChange = 0, location = null, victimId = null } = typeof opts === "string" ? { location: opts } : opts;
  const row = await dbGet(db, "SELECT alignment_morality, alignment_order, crime_heat FROM characters WHERE user_id=?", [uid]);
  if (!row) return;
  const newHeat = Math.min(20, (row.crime_heat || 0) + heat);
  const archetype = computeArchetype(row.alignment_morality || 0, row.alignment_order || 0, newHeat);
  await dbRun(db, "UPDATE characters SET crime_heat=?, archetype=? WHERE user_id=?", [newHeat, archetype, uid]);
  const now = Math.floor(Date.now() / 1000);
  await dbRun(db, `INSERT INTO crime_log (user_id, crime_type, heat_added, mercy_change, order_change, location, victim_id, created_at)
    VALUES (?,?,?,?,?,?,?,?)`, [uid, crimeType, heat, mercyChange, orderChange, location, victimId, now]);
  await checkBountyThreshold(db, uid, newHeat);
  if (mercyChange !== 0 || orderChange !== 0) {
    await updateAlignment(db, uid, mercyChange, orderChange);
  }
}

async function decayAlignment(db, uid) {
  const row = await dbGet(db, "SELECT alignment_morality, alignment_order, crime_heat, last_decay FROM characters WHERE user_id=?", [uid]);
  if (!row) return;
  const now = Date.now();
  const lastDecay = row.last_decay || now;
  const hoursPassed = (now - lastDecay) / (1000 * 60 * 60);
  if (hoursPassed < 0.1) return; // throttle: ~6 min minimum between decays

  const decayAmount = Math.floor(hoursPassed * 5);
  if (decayAmount === 0) return;

  const mercy = row.alignment_morality || 0;
  const mercyDecay = mercy > 0 ? -Math.min(decayAmount, mercy) : Math.min(decayAmount, Math.abs(mercy));
  if (mercyDecay !== 0) {
    const newMercy = Math.max(-200, Math.min(200, mercy + mercyDecay));
    const archetype = computeArchetype(newMercy, row.alignment_order || 0, row.crime_heat || 0);
    await dbRun(db, "UPDATE characters SET alignment_morality=?, archetype=?, last_decay=? WHERE user_id=?", [newMercy, archetype, now, uid]);
  } else {
    await dbRun(db, "UPDATE characters SET last_decay=? WHERE user_id=?", [now, uid]);
  }
}

async function getPlayerAlignment(db, uid) {
  return await dbGet(db, "SELECT alignment_morality, alignment_order, crime_heat, archetype FROM characters WHERE user_id=?", [uid]);
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
    xp INTEGER DEFAULT 0, class_stage INTEGER DEFAULT 0, current_hp INTEGER)`);
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
  await dbRun(db, `CREATE TABLE IF NOT EXISTS predator_tracking (
    user_id INTEGER PRIMARY KEY REFERENCES players(user_id),
    predator_id TEXT NOT NULL,
    predator_ticks INTEGER DEFAULT 0)`);
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
    try {
      await dbRun(db, `ALTER TABLE players ADD COLUMN last_encounter_at INTEGER DEFAULT 0`);
    } catch (_) {}

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

    // Equipment migration: weapon -> weapon_main, armor -> chest, shield -> weapon_offhand (one-time)
    try { await dbRun(db, `CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY)`); } catch (_) {}
    const eqMigrated = await dbGet(db, "SELECT 1 FROM _migrations WHERE name=?", ["equipment_slots_v1"]);
    if (!eqMigrated) {
      try {
        const legacyRows = await dbAll(db, "SELECT user_id, slot, item FROM equipment_slots WHERE slot IN ('weapon','armor','shield')");
        for (const r of legacyRows) {
          const newSlot = LEGACY_SLOT_MAP[r.slot];
          if (newSlot && newSlot !== r.slot) {
            await dbRun(db, "DELETE FROM equipment_slots WHERE user_id=? AND slot=?", [r.user_id, r.slot]);
            await dbRun(db, "INSERT INTO equipment_slots (user_id, slot, item) VALUES (?, ?, ?)", [r.user_id, newSlot, r.item]);
          }
        }
        await dbRun(db, "INSERT OR IGNORE INTO _migrations (name) VALUES (?)", ["equipment_slots_v1"]);
      } catch (_) {}
    }

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
    // Add to characters (alignment system consolidation)
    try { await dbRun(db, `ALTER TABLE characters ADD COLUMN crime_heat INTEGER DEFAULT 0`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE characters ADD COLUMN archetype TEXT DEFAULT 'Survivor'`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE characters ADD COLUMN last_decay INTEGER`); } catch (_) {}
    try { await dbRun(db, `ALTER TABLE characters ADD COLUMN upgrades TEXT DEFAULT '{}'`); } catch (_) {}
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

    await dbRun(db, `CREATE TABLE IF NOT EXISTS sewer_conditions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      condition_id TEXT NOT NULL,
      active INTEGER DEFAULT 0,
      started_at INTEGER NOT NULL,
      ends_at INTEGER NOT NULL,
      data TEXT
    )`);

    // Phase 3: Roaming monsters
    await dbRun(db, `CREATE TABLE IF NOT EXISTS roamers (
      id TEXT PRIMARY KEY,
      enemy_id TEXT NOT NULL,
      location TEXT NOT NULL,
      last_moved_at INTEGER DEFAULT 0,
      active INTEGER DEFAULT 1
    )`);
    await dbRun(db, `CREATE TABLE IF NOT EXISTS roamer_arrivals (
      user_id INTEGER PRIMARY KEY REFERENCES players(user_id),
      roamer_id TEXT NOT NULL
    )`);

    // Phase 3: Environmental hazards (sewer_conditions is for rotating conditions)
    await dbRun(db, `CREATE TABLE IF NOT EXISTS sewer_hazards (
      location TEXT PRIMARY KEY,
      hazard_type TEXT NOT NULL,
      severity INTEGER DEFAULT 1,
      expires_at INTEGER NOT NULL,
      set_at INTEGER NOT NULL
    )`);

    // Phase 3: Boss telegraph state (stores boss_id string)
    await dbRun(db, `CREATE TABLE IF NOT EXISTS boss_telegraph_state (
      user_id INTEGER PRIMARY KEY REFERENCES players(user_id),
      boss_id TEXT NOT NULL,
      tick INTEGER DEFAULT 1
    )`);

    await dbRun(db, `CREATE TABLE IF NOT EXISTS quests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quest_id TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'static',
      status TEXT DEFAULT 'active',
      progress TEXT,
      assigned_at INTEGER NOT NULL,
      expires_at INTEGER,
      completed_at INTEGER,
      UNIQUE(user_id, quest_id)
    )`);

    // Seed sewer condition on first run (Phase 2: display only)
    const condRow = await dbGet(db, "SELECT 1 FROM sewer_conditions LIMIT 1");
    if (!condRow) {
      const cond = SEWER_CONDITIONS[0];
      const now = Date.now();
      const endsAt = now + 45 * 60 * 1000;
      await dbRun(db, `INSERT INTO sewer_conditions (condition_id, active, started_at, ends_at, data)
        VALUES (?, 1, ?, ?, ?)`,
        [cond.id, now, endsAt, JSON.stringify(cond)]);
    }

    // Phase 3: Seed roamers if empty
    const roamerCount = await dbGet(db, "SELECT COUNT(*) as n FROM roamers");
    if ((roamerCount?.n || 0) === 0) {
      for (const [id, def] of Object.entries(ROAMER_DEFS)) {
        await dbRun(db,
          "INSERT OR IGNORE INTO roamers(id, enemy_id, location, last_moved_at, active) VALUES(?,?,?,?,1)",
          [id, def.enemy_id, def.start_room, 0]);
      }
    }

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
    const alignV2 = await dbGet(db, "SELECT 1 FROM _migrations WHERE name=?", ["alignment_v2"]);
    if (!alignV2) {
      const players = await dbAll(db, "SELECT user_id, mercy_score, order_score, crime_heat, archetype, last_decay FROM players");
      for (const p of players) {
        await dbRun(db, `UPDATE characters SET alignment_morality=?, alignment_order=?, crime_heat=?, archetype=?, last_decay=? WHERE user_id=?`,
          [p.mercy_score ?? 0, p.order_score ?? 0, p.crime_heat ?? 0, p.archetype ?? 'Survivor', p.last_decay ?? null, p.user_id]);
      }
      await dbRun(db, "INSERT OR IGNORE INTO _migrations (name) VALUES (?)", ["alignment_v2"]);
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

async function getActiveSewerCondition(db) {
  const now = Date.now();
  const row = await dbGet(db, "SELECT * FROM sewer_conditions WHERE active=1 AND ends_at>? LIMIT 1", [now]);
  if (!row) return null;
  let data;
  try {
    data = row.data ? JSON.parse(row.data) : SEWER_CONDITIONS.find(c => c.id === row.condition_id);
  } catch (_) {
    data = SEWER_CONDITIONS.find(c => c.id === row.condition_id);
  }
  return data ? { name: data.name, noticeboard_text: data.noticeboard_text, floors: data.floors, effects: data.effects } : null;
}

async function getBlockedRoutes(db) {
  const cond = await getActiveSewerCondition(db);
  return cond?.effects?.route_blocked ?? [];
}

// Phase 3: Roamer tick — advance patrol, flag players in room
async function tickRoamers(db) {
  const roamers = await dbAll(db, "SELECT * FROM roamers WHERE active=1");
  for (const roamer of roamers) {
    const def = ROAMER_DEFS[roamer.id];
    if (!def) continue;
    const idx = def.patrol.indexOf(roamer.location);
    const nextIdx = idx >= 0 ? (idx + 1) % def.patrol.length : 0;
    const nextRoom = def.patrol[nextIdx];
    await dbRun(db, "UPDATE roamers SET location=?, last_moved_at=? WHERE id=?", [nextRoom, Date.now(), roamer.id]);
    const playersInRoom = await dbAll(db, "SELECT user_id FROM players WHERE location=?", [nextRoom]);
    for (const p of playersInRoom) {
      const inCombat = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [p.user_id]);
      if (!inCombat) {
        await dbRun(db, "INSERT OR REPLACE INTO roamer_arrivals(user_id, roamer_id) VALUES(?,?)", [p.user_id, roamer.id]);
      }
    }
  }
}

// Phase 3: Hazard tick — expire old, spawn new
async function tickHazards(db) {
  const now = Date.now();
  await dbRun(db, "DELETE FROM sewer_hazards WHERE expires_at < ?", [now]);
  for (const [type, def] of Object.entries(HAZARD_DEFS)) {
    if (Math.random() > def.spawn_chance) continue;
    const room = def.rooms[Math.floor(Math.random() * def.rooms.length)];
    const existing = await dbGet(db, "SELECT 1 FROM sewer_hazards WHERE location=? AND hazard_type=?", [room, type]);
    if (existing) continue;
    await dbRun(db,
      "INSERT OR REPLACE INTO sewer_hazards(location, hazard_type, severity, expires_at, set_at) VALUES(?,?,?,?,?)",
      [room, type, 1, now + def.duration_ms, now]);
  }
}

// Phase 3: Boss condition checker
async function checkBossConditions(db, uid, location) {
  const telegraphRow = await dbGet(db, "SELECT boss_id FROM boss_telegraph_state WHERE user_id=?", [uid]);
  if (telegraphRow) return null;
  for (const [bossId, def] of Object.entries(BOSS_DEFS)) {
    const flag = def.reward?.flag || `boss_${bossId}_killed`;
    if (await getFlag(db, uid, flag, 0)) continue;
    if (def.spawn_room !== location) continue;
    const c = def.conditions || {};
    let met = true;
    if (c.kills_in_location) {
      const kills = await getFlag(db, uid, `kills_in_${c.kills_in_location.location}`, 0);
      if (kills < c.kills_in_location.min) met = false;
    }
    if (c.player_kills_total) {
      const total = await getFlag(db, uid, "total_kills", 0);
      if (total < c.player_kills_total.min) met = false;
    }
    if (c.depth_tier) {
      const tier = await getFlag(db, uid, "depth_tier", 0);
      if (tier < c.depth_tier.min) met = false;
    }
    if (c.hazard_active) {
      const hazard = await dbGet(db, "SELECT 1 FROM sewer_hazards WHERE location=? AND hazard_type=?", [location, c.hazard_active.type]);
      if (!hazard) met = false;
    }
    if (met) return { bossId, def };
  }
  return null;
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
  async scheduled(controller, env, ctx) {
    const db = env.DB;
    if (!db) return;
    await initDb(db);
    ctx.waitUntil(Promise.all([
      rotateSewerCondition(db, dbGet, dbRun),
      tickRoamers(db),
      tickHazards(db),
    ]));
  },
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
      try {
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
  await dbRun(db, `UPDATE characters SET instinct=NULL, strength=10, dexterity=10, constitution=10, intelligence=10, wisdom=10, charisma=10, stats_set=0,
    alignment_morality=0, alignment_order=0, crime_heat=0, archetype='Survivor', last_decay=NULL, ash_marks=0, ember_shards=0, soul_coins=0, xp=0, class_stage=0, current_hp=NULL WHERE user_id=?`, [targetUid]);
  await dbRun(db, "DELETE FROM crime_log WHERE user_id=?", [targetUid]);
  await dbRun(db, "UPDATE bounties SET status='expired' WHERE target_id=?", [targetUid]);
  await dbRun(db, "DELETE FROM sentences WHERE user_id=?", [targetUid]);
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
      decayAlignment(db, uid).catch(() => {});
      const now = Math.floor(Date.now() / 1000);
      const downed = await dbGet(db, "SELECT downed_until FROM pvp_state WHERE user_id=? AND downed_until>0 AND downed_until<?", [uid, now]);
      if (downed) {
        const row = await getPlayerSheet(db, uid);
        await processDeathDrop(db, uid, row?.location || "tavern");
        await dbRun(db, "UPDATE characters SET current_hp=0 WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE players SET location='tavern' WHERE user_id=?", [uid]);
        const maxHp = maxPlayerHp(row?.constitution || 10, row?.class_stage ?? 0);
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
      const alignment_ui = { ...buildAlignmentUI(row.alignment_morality, row.alignment_order, row.crime_heat, row.archetype) };
      alignment_ui.has_bounty = !!(await dbGet(db, "SELECT id FROM bounties WHERE target_id=? AND status='active'", [uid]));
      return json({ ...row, current_hp: hp.current, max_hp: hp.max, alignment_ui });
    }

    if (path === "/api/alignment" && method === "GET") {
      const align = await getPlayerAlignment(db, uid);
      if (!align) return err("No character.", 404);
      const activeBounty = await dbGet(db, "SELECT reward FROM bounties WHERE target_id=? AND status='active' ORDER BY reward DESC LIMIT 1", [uid]);
      return json({
        archetype: align.archetype ?? "Survivor",
        mercy_score: align.alignment_morality ?? 0,
        order_score: align.alignment_order ?? 0,
        crime_heat: align.crime_heat ?? 0,
        has_bounty: !!activeBounty,
        bounty_reward: activeBounty?.reward ?? 0,
      });
    }

    // ── GET: Bounties (official at wardens_post) ──
    if (path === "/api/bounties/official" && method === "GET") {
      const now = Date.now();
      const rows = await dbAll(db, `SELECT b.id, b.type, b.target_id, b.reason, b.reward, b.posted_at, b.expires_at, c.name AS target_name, c.archetype, p.location AS last_location
        FROM bounties b
        LEFT JOIN characters c ON c.user_id = b.target_id
        LEFT JOIN players p ON p.user_id = b.target_id
        WHERE b.type='official' AND b.status='active' AND b.location='wardens_post' AND (b.expires_at IS NULL OR b.expires_at > ?)
        ORDER BY b.reward DESC`, [now]);
      return json({ bounties: rows });
    }

    // ── GET: Bounties (player-posted at market noticeboard) ──
    if (path === "/api/bounties/player" && method === "GET") {
      const now = Date.now();
      const rows = await dbAll(db, `SELECT b.id, b.type, b.target_id, b.poster_id, b.reason, b.reward, b.posted_at, b.expires_at, c.name AS target_name, pc.name AS poster_name
        FROM bounties b
        LEFT JOIN characters c ON c.user_id = b.target_id
        LEFT JOIN characters pc ON pc.user_id = b.poster_id
        WHERE b.type='player' AND b.status='active' AND b.location='market_square' AND (b.expires_at IS NULL OR b.expires_at > ?)
        ORDER BY b.reward DESC`, [now]);
      return json({ bounties: rows });
    }

    // ── POST: Post player bounty ──
    if (path === "/api/bounties/post" && method === "POST") {
      const { target_name, reason, reward } = body;
      const POSTING_FEE = 25;
      if (!target_name || typeof target_name !== "string") return err("target_name required.", 400);
      if (!Number.isInteger(reward) || reward < 50) return err("target_name and reward (min 50) required.", 400);
      const total = reward + POSTING_FEE;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      let targetRow = await dbGet(db, "SELECT user_id FROM accounts WHERE username=?", [String(target_name).trim().toLowerCase()]);
      if (!targetRow) targetRow = await dbGet(db, "SELECT user_id FROM characters c JOIN players p ON p.user_id=c.user_id WHERE LOWER(TRIM(c.name))=LOWER(?)", [String(target_name).trim()]);
      if (!targetRow || targetRow.user_id === uid) return err("Target not found or invalid.", 400);
      const targetUid = targetRow.user_id;
      const ash = (row.ash_marks ?? 0);
      if (ash < total) return err(`Insufficient funds. Need ${total} AM (${reward} reward + ${POSTING_FEE} posting fee).`, 400);
      await dbRun(db, "UPDATE characters SET ash_marks = ash_marks - ? WHERE user_id=?", [total, uid]);
      const now = Date.now();
      await dbRun(db, "INSERT INTO bounties (type, target_id, poster_id, reason, reward, posted_at, expires_at, location) VALUES (?,?,?,?,?,?,?,?)",
        ["player", targetUid, uid, (reason && String(reason).trim()) || null, reward, now, now + 72 * 60 * 60 * 1000, "market_square"]);
      return json({ ok: true, message: `Bounty posted. ${total} AM deducted.` });
    }

    // ── POST: Claim bounty ──
    if (path.startsWith("/api/bounties/claim/") && method === "POST") {
      const bountyId = Number(path.slice("/api/bounties/claim/".length));
      if (!bountyId) return err("Invalid bounty id.", 400);
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const bounty = await dbGet(db, "SELECT * FROM bounties WHERE id=? AND status='active'", [bountyId]);
      if (!bounty) return err("Bounty not found or already claimed.", 404);
      if (bounty.target_id === uid) return err("Cannot claim your own bounty.", 400);
      const now = Date.now();
      if (bounty.expires_at != null && bounty.expires_at < now) return err("Bounty has expired.", 400);
      const targetLoc = await dbGet(db, "SELECT location FROM players WHERE user_id=?", [bounty.target_id]);
      const targetHp = await dbGet(db, "SELECT current_hp FROM characters WHERE user_id=?", [bounty.target_id]);
      const targetDead = !targetHp || targetHp.current_hp <= 0;
      const sameLocation = targetLoc && targetLoc.location === row.location;
      if (!targetDead && !sameLocation) return err("Target must be here or dead to claim.", 400);
      await dbRun(db, "UPDATE bounties SET status='claimed', claimed_by=? WHERE id=?", [uid, bountyId]);
      await dbRun(db, "UPDATE characters SET ash_marks = ash_marks + ? WHERE user_id=?", [bounty.reward, uid]);
      const targetRow = await dbGet(db, "SELECT crime_heat, alignment_morality, alignment_order FROM characters WHERE user_id=?", [bounty.target_id]);
      if (targetRow) {
        const newHeat = Math.max(0, (targetRow.crime_heat || 0) - 2);
        const archetype = computeArchetype(targetRow.alignment_morality || 0, targetRow.alignment_order || 0, newHeat);
        await dbRun(db, "UPDATE characters SET crime_heat=?, archetype=? WHERE user_id=?", [newHeat, archetype, bounty.target_id]);
      }
      return json({ ok: true, reward: bounty.reward, message: `Bounty claimed. ${bounty.reward} Ash Marks added.` });
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
      const maxHp = maxPlayerHp(constitution, 0);
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
      const maxHp = maxPlayerHp(constitution, 0);
      await dbRun(db, `UPDATE characters SET strength=?,dexterity=?,constitution=?,
        intelligence=?,wisdom=?,charisma=?,stats_set=1,current_hp=? WHERE user_id=?`,
        [strength,dexterity,constitution,intelligence,wisdom,charisma,maxHp,uid]);
      return json({ ok: true, max_hp: maxHp });
    }

    // ── POST: Choose upgrade (level 5, etc.) ──
    if (path === "/api/character/upgrade" && method === "POST") {
      const { slot, upgrade_id } = body;
      if (slot !== "level_5" || !upgrade_id) return err("slot and upgrade_id required.", 400);
      const upgrade = LEVEL_5_UPGRADES[upgrade_id];
      if (!upgrade) return err("Unknown upgrade.", 400);
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (upgrade.instinct !== (row.instinct || "").toLowerCase()) return err("Upgrade does not match your instinct.", 400);
      const current = JSON.parse(row.upgrades || "{}");
      if (current[slot]) return err("That slot is already filled.", 400);
      const next = { ...current, [slot]: upgrade_id };
      await dbRun(db, "UPDATE characters SET upgrades=? WHERE user_id=?", [JSON.stringify(next), uid]);
      return json({ ok: true, slot, upgrade_id, display_name: upgrade.display_name });
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
        const visitFlag = loc === "market_square" ? "has_seen_market_square" : loc === "crucible" ? "seen_crucible" : "visited_" + loc;
        const seen = await getFlag(db, uid, visitFlag, 0);
        if (seen === 0 && (SEWER_LEVEL_1.includes(loc) || SEWER_LEVEL_2.includes(loc) || SEWER_LEVEL_3.includes(loc) || SEWER_LEVEL_4.includes(loc) || SEWER_LEVEL_5.includes(loc))) {
          await setFlag(db, uid, "first_sewer_visit", 1);
        }
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
      const blocked = await getBlockedRoutes(db);
      for (const e of [...exits]) {
        if (blocked.includes(exit_map[e])) {
          exits = exits.filter(x => x !== e);
          delete exit_map[e];
        }
      }

      const deathDrops = await getUnclaimedDropsAtLocation(db, loc);
      if (deathDrops.length > 0) {
        description += "\n\nSomething glints near the drain. Ash Marks — someone left them here quickly.";
      }

      // Phase 3: Hazard in room (for renderHazardWarning)
      let hazardInRoom = null;
      const hazardRow = await dbGet(db, "SELECT hazard_type FROM sewer_hazards WHERE location=? AND expires_at>?", [loc, Date.now()]);
      if (hazardRow) {
        const def = HAZARD_DEFS[hazardRow.hazard_type];
        if (def) hazardInRoom = { type: hazardRow.hazard_type, label: def.label };
      }

      // Phase 3: Roamer arrived — include encounter for frontend to trigger combat
      let roamerEncounter = null;
      const arrivedRow = await dbGet(db, "SELECT roamer_id FROM roamer_arrivals WHERE user_id=?", [uid]);
      if (arrivedRow && !inCombat && FIGHTABLE_LOCATIONS.has(loc)) {
        await dbRun(db, "DELETE FROM roamer_arrivals WHERE user_id=?", [uid]);
        const def = ROAMER_DEFS[arrivedRow.roamer_id];
        if (def) {
          const enemy = COMBAT_DATA.enemies[def.enemy_id];
          if (enemy) {
            const hp = await getPlayerHp(db, uid, row);
            const now = Date.now();
            await dbRun(db, "UPDATE players SET last_encounter_at=? WHERE user_id=?", [now, uid]);
            const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
            let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
            for (const eq of eqRows) {
              const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
              const tier = Math.min(invRow?.tier ?? 1, 3);
              if (eq.slot === "weapon_main") weaponDie = [6, 8, 10, 12][tier];
              else if (eq.slot === "chest") armorReduction = [0, 2, 4, 6][tier];
              else if (eq.slot === "weapon_offhand") shieldBonus = 2;
            }
            const state = {
              enemy_id: def.enemy_id,
              enemy_name: def.name,
              enemy_hp: enemy.hp,
              enemy_hp_max: enemy.hp,
              player_hp: hp.current,
              player_hp_max: hp.max,
              ability_cooldown: 0, ability_used: false, npc_ability_used: false, statuses: {}, enemy_statuses: {}, player_statuses: {}, turn: 1, turn_count: 1,
              round: 1,
              location: loc,
              weapon_die: weaponDie,
              armor_reduction: armorReduction,
              shield_bonus: shieldBonus,
              enemy_staggered: false,
              status_effects: [],
              trait_state: {},
              armor_break_effects: [],
              active_buffs: [],
              auto_triggered: true,
              roamer: true,
            };
            await decrementCombatBuffs(db, uid);
            await dbRun(db,
              "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
              [uid, JSON.stringify(state)]);
            roamerEncounter = {
              triggered: true,
              roamer: true,
              cue: def.arrival_cue,
              enemy_name: def.name,
              enemy_desc: enemy.desc || "",
              combat_state: state,
            };
          }
        }
      }

      const typedExits = normalizeExits(exit_map);
      const locPayload = {
        location: loc, name: room.name, district: room.district || "", description,
        exits: typedExits,
        exit_map,  // keep for backward compat
        objects: Object.keys(room.objects || {}),
        items: [],  // room items seeded statically for now
        npcs: npcsHere,
        in_combat: roamerEncounter ? true : inCombat,
        fightable: FIGHTABLE_LOCATIONS.has(loc),
        death_drops_present: deathDrops.length > 0,
      };
      if (roamerEncounter) locPayload.encounter = roamerEncounter;
      if (hazardInRoom) locPayload.hazard = hazardInRoom;
      if (room.pvpve) locPayload.pvpve = room.pvpve;
      return json(locPayload);
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

      // Phase 3: Roamer arrived in current room — trigger combat before moving
      const arrivedRow = await dbGet(db, "SELECT roamer_id FROM roamer_arrivals WHERE user_id=?", [uid]);
      if (arrivedRow) {
        await dbRun(db, "DELETE FROM roamer_arrivals WHERE user_id=?", [uid]);
        const def = ROAMER_DEFS[arrivedRow.roamer_id];
        if (def && FIGHTABLE_LOCATIONS.has(row.location)) {
          const enemy = COMBAT_DATA.enemies[def.enemy_id];
          if (enemy) {
            const hp = await getPlayerHp(db, uid, row);
            const now = Date.now();
            await dbRun(db, "UPDATE players SET last_encounter_at=? WHERE user_id=?", [now, uid]);
            const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
            let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
            for (const eq of eqRows) {
              const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
              const tier = Math.min(invRow?.tier ?? 1, 3);
              if (eq.slot === "weapon_main") weaponDie = [6, 8, 10, 12][tier];
              else if (eq.slot === "chest") armorReduction = [0, 2, 4, 6][tier];
              else if (eq.slot === "weapon_offhand") shieldBonus = 2;
            }
            const state = {
              enemy_id: def.enemy_id,
              enemy_name: def.name,
              enemy_hp: enemy.hp,
              enemy_hp_max: enemy.hp,
              player_hp: hp.current,
              player_hp_max: hp.max,
              ability_cooldown: 0, ability_used: false, npc_ability_used: false, statuses: {}, enemy_statuses: {}, player_statuses: {}, turn: 1, turn_count: 1,
              round: 1,
              location: row.location,
              weapon_die: weaponDie,
              armor_reduction: armorReduction,
              shield_bonus: shieldBonus,
              enemy_staggered: false,
              status_effects: [],
              trait_state: {},
              armor_break_effects: [],
              active_buffs: [],
              auto_triggered: true,
              roamer: true,
            };
            await decrementCombatBuffs(db, uid);
            await dbRun(db,
              "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
              [uid, JSON.stringify(state)]);
            const room = WORLD[row.location];
            const destExits = Object.keys(room?.exits || {});
            const destExitMap = { ...(room?.exits || {}) };
            const npcsHere = Object.entries(NPC_LOCATIONS).filter(([, l]) => l === row.location).map(([id]) => id);
            const deathDrops = await getUnclaimedDropsAtLocation(db, row.location);
            return json({
              location: row.location,
              name: room?.name,
              description: room?.description,
              exits: destExits,
              exit_map: destExitMap,
              objects: Object.keys(room?.objects || {}),
              items: [],
              npcs: npcsHere,
              ambient: null,
              fightable: FIGHTABLE_LOCATIONS.has(row.location),
              death_drops_present: deathDrops.length > 0,
              encounter: {
                triggered: true,
                roamer: true,
                cue: def.arrival_cue,
                enemy_name: def.name,
                enemy_desc: enemy.desc || "",
                combat_state: state,
              },
            });
          }
        }
      }

      const room = WORLD[row.location];
      let directionUsed = direction;
      let dest = room?.exits?.[direction];
      if (body.target) {
        const exitMap = { ...(room?.exits || {}) };
        if (row.location === "market_square") exitMap.down = "sewer_entrance";
        directionUsed = Object.entries(exitMap).find(([, t]) => t === body.target)?.[0];
        dest = directionUsed ? exitMap[directionUsed] : null;
      }
      if (row.location === "market_square" && directionUsed === "down") dest = "sewer_entrance";
      if (row.location === "cinder_cells_block" && directionUsed === "deeper" && (row.crime_heat ?? 0) < 11) {
        dest = null;
      }
      // Floor gates: block deeper/down if player lacks required boss flag
      const gate = FLOOR_GATES[row.location];
      if (gate && directionUsed === gate.exit_dir && gate.requires_flag) {
        const hasFlag = await getFlag(db, uid, gate.requires_flag, 0);
        if (!hasFlag) dest = null;
      }
      const blocked = await getBlockedRoutes(db);
      if (dest && blocked.includes(dest)) return err("The passage is impassable. The noticeboard warned of this.", 400);
      if (!dest) return err(`You can't go ${directionUsed || direction || "there"} from here.`);
      if (!WORLD[dest]) return err("That path leads nowhere.");

      await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", [dest, uid]);

      // Ambient events
      let ambient = null;
      if (dest === "flooded_hall") {
        const r = Math.random();
        if (r < 0.1) ambient = "*A single bubble rises from the still water. The surface does not ripple.*";
        else if (r < 0.225) ambient = "*Something skitters just beyond your torchlight. The sound stops the moment you turn.*";
      }

      // Phase 3: Footstep cue — roamer in adjacent room
      const neighbors = getRoomNeighbors(dest);
      if (neighbors.length > 0) {
        const placeholders = neighbors.map(() => "?").join(",");
        const roamersNearby = await dbAll(db,
          `SELECT * FROM roamers WHERE active=1 AND location IN (${placeholders})`,
          neighbors);
        if (roamersNearby.length > 0) {
          const nearRoamer = roamersNearby[Math.floor(Math.random() * roamersNearby.length)];
          const def = ROAMER_DEFS[nearRoamer.id];
          if (def) {
            const cue = def.approach_cues[Math.floor(Math.random() * def.approach_cues.length)];
            ambient = ambient ? ambient + "\n\n" + cue : cue;
          }
        }
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
        const visitFlag = dest === "market_square" ? "has_seen_market_square" : dest === "crucible" ? "seen_crucible" : "visited_" + dest;
        const hadVisited = await getFlag(db, uid, visitFlag, 0);
        if (FIRST_VISIT_INTROS[dest] && hadVisited === 0) {
          destDescription = FIRST_VISIT_INTROS[dest] + destRoom.description;
        }
      }
      const exitType = ENTER_TARGETS.has(dest) ? "enter" : "travel";
      const narration = getTravelNarration(room, destRoom, exitType);
      destDescription = `*${narration}*\n\n${destDescription}`;

      // Depth flag (sewer floors 2–5)
      if (SEWER_LEVEL_2.includes(dest) || SEWER_LEVEL_3.includes(dest) || SEWER_LEVEL_4.includes(dest) || SEWER_LEVEL_5.includes(dest)) {
        await setFlag(db, uid, "warned_mid_sewer", 1);
      }
      if (dest === "market_square") {
        await setFlag(db, uid, "has_seen_market_square", 1);
      }
      await setFlag(db, uid, dest === "crucible" ? "seen_crucible" : "visited_" + dest, 1);
      if (dest === "crucible") await setFlag(db, uid, "visited_crucible", 1);
      if (SEWER_LEVEL_1.includes(dest) || SEWER_LEVEL_2.includes(dest) || SEWER_LEVEL_3.includes(dest) || SEWER_LEVEL_4.includes(dest) || SEWER_LEVEL_5.includes(dest)) {
        await setFlag(db, uid, "first_sewer_visit", 1);
      }

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
      const destBlocked = await getBlockedRoutes(db);
      for (const e of [...destExits]) {
        if (destBlocked.includes(destExitMap[e])) {
          destExits = destExits.filter(x => x !== e);
          delete destExitMap[e];
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

      // Phase 3: Environmental hazard check
      let hazardData = null;
      let hazardEncounterBonus = 0;
      const now = Date.now();
      const activeHazard = await dbGet(db, "SELECT * FROM sewer_hazards WHERE location=? AND expires_at>?", [dest, now]);
      if (activeHazard) {
        const def = HAZARD_DEFS[activeHazard.hazard_type];
        if (def) {
          const dmg = Math.floor(Math.random() * (def.damage.max - def.damage.min + 1)) + def.damage.min;
          const hp = await getPlayerHp(db, uid, row);
          const newHp = Math.max(0, hp.current - dmg);
          await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [newHp, uid]);
          if (def.one_shot) {
            await dbRun(db, "DELETE FROM sewer_hazards WHERE location=? AND hazard_type=?", [dest, activeHazard.hazard_type]);
          }
          hazardData = {
            type: activeHazard.hazard_type,
            label: def.label,
            cue_enter: def.cue_enter,
            cue_damage: def.cue_damage.replace("{dmg}", String(dmg)),
            damage: dmg,
            player_hp: newHp,
            player_hp_max: hp.max,
          };
          if (def.encounter_bonus) hazardEncounterBonus = def.encounter_bonus;
        }
      }

      // Phase 3: Boss telegraph check — before normal encounter
      let encounterData = null;
      const telegraphRow = await dbGet(db, "SELECT boss_id, tick FROM boss_telegraph_state WHERE user_id=?", [uid]);
      if (telegraphRow) {
        const def = BOSS_DEFS[telegraphRow.boss_id];
        if (def && def.spawn_room === dest) {
          const telegraphTick = (telegraphRow.tick || 1) + 1;
          if (telegraphTick >= def.telegraph.length) {
            await dbRun(db, "DELETE FROM boss_telegraph_state WHERE user_id=?", [uid]);
            const baseEnemy = COMBAT_DATA.enemies[def.enemy_id];
            const enemy = baseEnemy ? { ...baseEnemy, hp: def.hp_override ?? baseEnemy.hp } : null;
            if (enemy) {
              const hp = await getPlayerHp(db, uid, row);
              const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
              let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
              for (const eq of eqRows) {
                const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
                const tier = Math.min(invRow?.tier ?? 1, 3);
                if (eq.slot === "weapon_main") weaponDie = [6, 8, 10, 12][tier];
                else if (eq.slot === "chest") armorReduction = [0, 2, 4, 6][tier];
                else if (eq.slot === "weapon_offhand") shieldBonus = 2;
              }
              const state = {
                enemy_id: def.enemy_id,
                enemy_name: def.name,
                enemy_hp: enemy.hp,
                enemy_hp_max: enemy.hp,
                player_hp: hp.current,
                player_hp_max: hp.max,
                ability_cooldown: 0, ability_used: false, npc_ability_used: false, statuses: {}, enemy_statuses: {}, player_statuses: {}, fade_used: false, hearth_healed: false,
                turn: 1, turn_count: 1,
                round: 1,
                location: dest,
                weapon_die: weaponDie,
                armor_reduction: armorReduction,
                shield_bonus: shieldBonus,
                enemy_staggered: false,
                status_effects: [],
                trait_state: {},
                armor_break_effects: [],
                active_buffs: [],
                auto_triggered: true,
                boss: true,
                boss_id: telegraphRow.boss_id,
                boss_reward: def.reward,
              };
              await decrementCombatBuffs(db, uid);
              await dbRun(db,
                "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
                [uid, JSON.stringify(state)]);
              encounterData = {
                triggered: true,
                boss: true,
                cue: def.arrival,
                enemy_name: def.name,
                enemy_desc: "",
                combat_state: state,
              };
            }
          } else {
            await dbRun(db, "UPDATE boss_telegraph_state SET tick=? WHERE user_id=?", [telegraphTick, uid]);
            ambient = (ambient ? ambient + "\n\n" : "") + def.telegraph[telegraphTick - 1];
          }
        }
      }

      // Phase 3: Check for new boss conditions if no telegraph active
      if (!telegraphRow) {
        const bossMatch = await checkBossConditions(db, uid, dest);
        if (bossMatch) {
          await dbRun(db, "INSERT OR REPLACE INTO boss_telegraph_state(user_id, boss_id, tick) VALUES(?,?,1)", [uid, bossMatch.bossId]);
          ambient = (ambient ? ambient + "\n\n" : "") + bossMatch.def.telegraph[0];
        }
      }

      // ── Dynamic encounter check ───────────────────────────────────
      const predRow = await dbGet(db, "SELECT predator_id, predator_ticks FROM predator_tracking WHERE user_id=?", [uid]);
      if (predRow) {
        if (FIGHTABLE_LOCATIONS.has(dest)) {
          const newTicks = (predRow.predator_ticks || 0) + 1;
          await dbRun(db, "UPDATE predator_tracking SET predator_ticks=? WHERE user_id=?", [newTicks, uid]);
          if (newTicks >= 2) {
            await dbRun(db, "DELETE FROM predator_tracking WHERE user_id=?", [uid]);
            const enemy = COMBAT_DATA.enemies[predRow.predator_id];
            if (enemy) {
              const hp = await getPlayerHp(db, uid, row);
              const now = Date.now();
              await dbRun(db, "UPDATE players SET last_encounter_at=? WHERE user_id=?", [now, uid]);
              const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
              let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
              for (const eq of eqRows) {
                const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
                const tier = Math.min(invRow?.tier ?? 1, 3);
                if (eq.slot === "weapon_main") weaponDie = [6, 8, 10, 12][tier];
                else if (eq.slot === "chest") armorReduction = [0, 2, 4, 6][tier];
                else if (eq.slot === "weapon_offhand") shieldBonus = 2;
              }
              const state = {
                enemy_id: enemy.id,
                enemy_name: enemy.name,
                enemy_hp: enemy.hp,
                enemy_hp_max: enemy.hp,
                player_hp: hp.current,
                player_hp_max: hp.max,
                ability_cooldown: 0, ability_used: false, npc_ability_used: false, statuses: {}, enemy_statuses: {}, player_statuses: {}, fade_used: false, hearth_healed: false,
                turn: 1, turn_count: 1,
                round: 1,
                location: dest,
                weapon_die: weaponDie,
                armor_reduction: armorReduction,
                shield_bonus: shieldBonus,
                enemy_staggered: false,
                status_effects: [],
                trait_state: {},
                armor_break_effects: [],
                active_buffs: [],
                auto_triggered: true,
              };
              await decrementCombatBuffs(db, uid);
              await dbRun(db,
                "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
                [uid, JSON.stringify(state)]);
              encounterData = {
                triggered: true,
                predator_strike: true,
                cue: "*It found you.*",
                enemy_name: enemy.name,
                enemy_desc: enemy.desc || "",
                combat_state: state,
              };
            }
          }
        } else {
          await dbRun(db, "DELETE FROM predator_tracking WHERE user_id=?", [uid]);
          ambient = "*Whatever was following you has stopped. For now.*";
        }
      }

      // Reputation: high crime in city — bounty hunter
      if (!encounterData && REPUTATION_CITY_LOCATIONS.has(dest) && (row.crime_heat ?? 0) >= 8 && Math.random() < 0.6) {
        const enemy = COMBAT_DATA.enemies.city_watchman;
        if (enemy) {
          const hp = await getPlayerHp(db, uid, row);
          const now = Date.now();
          await dbRun(db, "UPDATE players SET last_encounter_at=? WHERE user_id=?", [now, uid]);
          const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
          let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
          for (const eq of eqRows) {
            const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
            const tier = Math.min(invRow?.tier ?? 1, 3);
            if (eq.slot === "weapon_main") weaponDie = [6, 8, 10, 12][tier];
            else if (eq.slot === "chest") armorReduction = [0, 2, 4, 6][tier];
            else if (eq.slot === "weapon_offhand") shieldBonus = 2;
          }
          const state = {
            enemy_id: enemy.id,
            enemy_name: enemy.name,
            enemy_hp: enemy.hp,
            enemy_hp_max: enemy.hp,
            player_hp: hp.current,
            player_hp_max: hp.max,
            ability_cooldown: 0, ability_used: false, npc_ability_used: false, statuses: {}, enemy_statuses: {}, player_statuses: {}, fade_used: false, hearth_healed: false,
            turn: 1, turn_count: 1,
            round: 1,
            location: dest,
            weapon_die: weaponDie,
            armor_reduction: armorReduction,
            shield_bonus: shieldBonus,
            enemy_staggered: false,
            status_effects: [],
            trait_state: {},
            armor_break_effects: [],
            auto_triggered: true,
          };
          await decrementCombatBuffs(db, uid);
          await dbRun(db,
            "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
            [uid, JSON.stringify(state)]);
          encounterData = {
            triggered: true,
            cue: "*The watch has your description. They have had it for a while.*",
            enemy_name: enemy.name,
            enemy_desc: enemy.desc || "",
            combat_state: state,
          };
        }
      }

      if (!encounterData && FIGHTABLE_LOCATIONS.has(dest)) {
        const now = Date.now();
        const lastEnc = row.last_encounter_at || 0;
        const onCooldown = (now - lastEnc) < 12000;

        if (!onCooldown) {
          const hp = await getPlayerHp(db, uid, row);
          const hpPct = hp.max > 0 ? hp.current / hp.max : 1;
          const woundedBonus = hpPct < 0.5 ? 20 : 0;

          let crimeHeatBonus = 0;
          if ((row.crime_heat ?? 0) >= 7) crimeHeatBonus = 15;

          const postFight = await getFlag(db, uid, "post_fight_noise", 0);
          const postFightBonus = postFight ? 15 : 0;
          if (postFight) await setFlag(db, uid, "post_fight_noise", 0);

          let scentBonus = 0, scentLabel = null;
          const invRows = await dbAll(db, "SELECT item FROM inventory WHERE user_id=? AND qty>0", [uid]);
          for (const r of invRows) {
            const def = SCENT_ITEMS[r.item];
            if (def && def.bonus > scentBonus) { scentBonus = def.bonus; scentLabel = def.label; }
          }

          const order = row.alignment_order ?? 0;
          const morality = row.alignment_morality ?? 0;
          let reputationBonus = 0;
          let woundedNpcChance = 0;
          if (order <= -15) reputationBonus += 20;
          if (order >= 15) reputationBonus += -15;
          if (morality >= 15) woundedNpcChance = 0.25;

          const triggered = rollEncounter(dest, {
            woundedBonus,
            crimeHeatBonus,
            postFightBonus,
            scentBonus,
            reputationBonus,
            hazardBonus: hazardEncounterBonus,
          });

          if (triggered) {
            await dbRun(db, "UPDATE players SET last_encounter_at=? WHERE user_id=?", [now, uid]);

            const rawCue = getEncounterCue(dest);
            const cue = scentLabel ? `${scentLabel}\n\n${rawCue}` : rawCue;
            const activeCondition = await getActiveSewerCondition(db);
            const enemy = randomEnemy(dest, activeCondition);

            const predDef = PREDATOR_ENEMIES[enemy.id];
            if (predDef && predDef.eligible.has(dest) && Math.random() < predDef.chance && !predRow) {
              await dbRun(db, "INSERT OR REPLACE INTO predator_tracking(user_id, predator_id, predator_ticks) VALUES(?,?,0)", [uid, enemy.id]);
              encounterData = {
                triggered: false,
                predator_detected: true,
                cue: getPredatorCue(dest, enemy.id),
              };
            } else {
            const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
            let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
            for (const eq of eqRows) {
              const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
              const tier = Math.min(invRow?.tier ?? 1, 3);
              if (eq.slot === "weapon_main") weaponDie = [6, 8, 10, 12][tier];
              else if (eq.slot === "chest") armorReduction = [0, 2, 4, 6][tier];
              else if (eq.slot === "weapon_offhand") shieldBonus = 2;
            }

            const state = {
              enemy_id: enemy.id,
              enemy_name: enemy.name,
              enemy_hp: enemy.hp,
              enemy_hp_max: enemy.hp,
              player_hp: hp.current,
              player_hp_max: hp.max,
              ability_cooldown: 0, statuses: {}, enemy_statuses: {}, player_statuses: {}, fade_used: false, hearth_healed: false,
              turn: 1, turn_count: 1,
              round: 1,
              location: dest,
              weapon_die: weaponDie,
              armor_reduction: armorReduction,
              shield_bonus: shieldBonus,
              enemy_staggered: false,
              status_effects: [],
              trait_state: {},
              armor_break_effects: [],
              auto_triggered: true,
            };
            await decrementCombatBuffs(db, uid);
            await dbRun(db,
              "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
              [uid, JSON.stringify(state)]);

            encounterData = {
              triggered: true,
              cue,
              enemy_name: enemy.name,
              enemy_desc: enemy.desc || "",
              combat_state: state,
            };
            }
          }
        }
      }
      // ── End encounter check ─────────────────────────────────────────

      // PvPvE: Ash Heart Chamber group warning when solo
      let pvpveWarning = null;
      if (dest === "ash_heart_chamber") {
        const partyMembers = await getPartyMembers(db, dbAll, uid);
        if (partyMembers.length === 0) {
          pvpveWarning = "The cathedral floor demanded more than one. The guardians have always known this.";
        }
      }

      const movePayload = {
        location: dest, name: destRoom.name, district: destRoom.district || "", description: destDescription,
        exits: normalizeExits(destExitMap),
        exit_map: destExitMap,
        objects: Object.keys(destRoom.objects || {}),
        items: [], npcs: npcsHere, ambient,
        fightable: FIGHTABLE_LOCATIONS.has(dest),
        death_drops_present: deathDrops.length > 0,
        encounter: encounterData,
      };
      if (hazardData) movePayload.hazard = hazardData;
      if (destRoom.pvpve) movePayload.pvpve = destRoom.pvpve;
      if (pvpveWarning) movePayload.pvpve_warning = pvpveWarning;
      return json(movePayload);
    }

    // ── POST: Go (landmark quick-travel) ──
    if (path === "/api/go" && method === "POST") {
      const { landmark } = body;
      if (!landmark || typeof landmark !== "string") return err("landmark required.", 400);
      const target = LANDMARKS[landmark.trim().toLowerCase()];
      if (!target) return err("Unknown landmark.", 400);

      let row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (OLD_SEWER_LOCATIONS.has(row.location)) {
        await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", ["drain_entrance", uid]);
        row = await getPlayerSheet(db, uid);
      }
      const inCombat = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
      if (inCombat) return err("You're in combat. Flee first.", 400);

      const flagRows = await dbAll(db, "SELECT flag FROM player_flags WHERE user_id=? AND (flag LIKE 'visited_%' OR flag='has_seen_market_square')", [uid]);
      const discovered = new Set();
      for (const r of flagRows) {
        if (r.flag === "has_seen_market_square") discovered.add("market_square");
        else if (r.flag.startsWith("visited_")) discovered.add(r.flag.slice(9));
      }
      if (!discovered.has(target)) return json({ success: false, message: "You don't know the way to that place yet." });

      const blocked = await getBlockedRoutes(db);
      const start = row.location;
      if (start === target) {
        const room = WORLD[target];
        const exitMap = { ...(room?.exits || {}) };
        if (target === "market_square") exitMap.down = "sewer_entrance";
        const typedExits = normalizeExits(exitMap);
        return json({ success: true, path: [target], message: `${"You're already there."}`, location: target, name: room?.name, district: room?.district || "", description: room?.description, exits: typedExits, exit_map: exitMap, objects: Object.keys(room?.objects || {}), items: [], npcs: [], fightable: FIGHTABLE_LOCATIONS.has(target), death_drops_present: false });
      }

      const queue = [{ loc: start, path: [start] }];
      const visited = new Set([start]);
      let found = null;
      while (queue.length > 0) {
        const { loc, path } = queue.shift();
        let exitMap = { ...(WORLD[loc]?.exits || {}) };
        if (loc === "market_square") exitMap.down = "sewer_entrance";
        const gate = FLOOR_GATES[loc];
        if (gate?.requires_flag) {
          const hasFlag = await getFlag(db, uid, gate.requires_flag, 0);
          if (!hasFlag) delete exitMap[gate.exit_dir];
        }
        for (const val of Object.values(exitMap)) {
          const dest = typeof val === "string" ? val : val?.target;
          if (!dest || blocked.includes(dest) || visited.has(dest) || !WORLD[dest]) continue;
          const newPath = [...path, dest];
          if (dest === target) {
            found = newPath;
            break;
          }
          visited.add(dest);
          queue.push({ loc: dest, path: newPath });
        }
        if (found) break;
      }
      if (!found) return json({ success: false, message: "You don't know the way to that place yet." });

      await dbRun(db, "UPDATE players SET location=? WHERE user_id=?", [target, uid]);
      await setFlag(db, uid, target === "market_square" ? "has_seen_market_square" : target === "crucible" ? "seen_crucible" : "visited_" + target, 1);
      if (target === "crucible") await setFlag(db, uid, "visited_crucible", 1);

      const destRoom = WORLD[target];
      let destExits = Object.keys(destRoom.exits || {});
      let destExitMap = { ...(destRoom.exits || {}) };
      if (target === "market_square") { destExits = [...destExits, "down"]; destExitMap.down = "sewer_entrance"; }
      const destGate = FLOOR_GATES[target];
      if (destGate?.requires_flag) {
        const hasFlag = await getFlag(db, uid, destGate.requires_flag, 0);
        if (!hasFlag) { destExits = destExits.filter(e => e !== destGate.exit_dir); delete destExitMap[destGate.exit_dir]; }
      }
      const destBlocked = await getBlockedRoutes(db);
      for (const e of [...destExits]) {
        if (destBlocked.includes(destExitMap[e])) { destExits = destExits.filter(x => x !== e); delete destExitMap[e]; }
      }
      const npcsHere = Object.entries(NPC_LOCATIONS).filter(([, l]) => l === target).map(([id]) => id);
      if (target === "cinder_cells_hall" && (row.crime_heat ?? 0) >= 4 && !npcsHere.includes("warden")) npcsHere.push("warden");
      const deathDrops = await getUnclaimedDropsAtLocation(db, target);
      let destDescription = destRoom.description;
      if (deathDrops.length > 0) destDescription += "\n\nSomething glints near the drain. Ash Marks — someone left them here quickly.";
      const destTypedExits = normalizeExits(destExitMap);
      const roomName = destRoom.name || target;
      return json({ success: true, path: found, message: `You make your way to ${roomName}.`, location: target, name: roomName, district: destRoom.district || "", description: destDescription, exits: destTypedExits, exit_map: destExitMap, objects: Object.keys(destRoom.objects || {}), items: [], npcs: npcsHere, fightable: FIGHTABLE_LOCATIONS.has(target), death_drops_present: deathDrops.length > 0 });
    }

    // ── POST: Linger (idle encounter check) ──
    if (path === "/api/linger" && method === "POST") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!FIGHTABLE_LOCATIONS.has(row.location)) return json({ encounter: null });
      const existing = await dbGet(db, "SELECT 1 FROM combat_state WHERE user_id=?", [uid]);
      if (existing) return json({ encounter: null });

      const now = Date.now();
      const lastEnc = row.last_encounter_at || 0;
      if ((now - lastEnc) < 12000) return json({ encounter: null });

      const hp = await getPlayerHp(db, uid, row);
      const hpPct = hp.max > 0 ? hp.current / hp.max : 1;
      const { ticks = 1 } = body;
      const lingerBase = Math.min(20 + (ticks * 8), 60);
      const woundedBonus = hpPct < 0.5 ? 25 : 0;
      let scentBonus = 0, scentLabel = null;
      const invRows = await dbAll(db, "SELECT item FROM inventory WHERE user_id=? AND qty>0", [uid]);
      for (const r of invRows) {
        const def = SCENT_ITEMS[r.item];
        if (def && def.bonus > scentBonus) { scentBonus = def.bonus; scentLabel = def.label; }
      }
      const triggered = Math.random() * 100 < (lingerBase + woundedBonus + scentBonus);

      if (!triggered) {
        const cue = getEncounterCue(row.location);
        return json({ encounter: null, ambient: cue });
      }

      await dbRun(db, "UPDATE players SET last_encounter_at=? WHERE user_id=?", [now, uid]);

      const rawCue = getEncounterCue(row.location);
      const cue = scentLabel ? `${scentLabel}\n\n${rawCue}` : rawCue;
      const activeCondition = await getActiveSewerCondition(db);
      const enemy = randomEnemy(row.location, activeCondition);

      const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
      let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
      for (const eq of eqRows) {
        const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
        const tier = Math.min(invRow?.tier ?? 1, 3);
        if (eq.slot === "weapon_main") weaponDie = [6, 8, 10, 12][tier];
        else if (eq.slot === "chest") armorReduction = [0, 2, 4, 6][tier];
        else if (eq.slot === "weapon_offhand") shieldBonus = 2;
      }

      const state = {
        enemy_id: enemy.id,
        enemy_name: enemy.name,
        enemy_hp: enemy.hp,
        enemy_hp_max: enemy.hp,
        player_hp: hp.current,
        player_hp_max: hp.max,
        ability_cooldown: 0, ability_used: false, npc_ability_used: false, statuses: {}, enemy_statuses: {}, player_statuses: {}, fade_used: false, hearth_healed: false,
        turn: 1, turn_count: 1,
        round: 1,
        location: row.location,
        weapon_die: weaponDie,
        armor_reduction: armorReduction,
        shield_bonus: shieldBonus,
        enemy_staggered: false,
        status_effects: [],
        trait_state: {},
        armor_break_effects: [],
        active_buffs: [],
        auto_triggered: true,
      };
      await decrementCombatBuffs(db, uid);
      await dbRun(db,
        "INSERT INTO combat_state(user_id,state_json) VALUES(?,?) ON CONFLICT(user_id) DO UPDATE SET state_json=excluded.state_json",
        [uid, JSON.stringify(state)]);

      return json({
        encounter: {
          triggered: true,
          cue,
          enemy_name: enemy.name,
          enemy_desc: enemy.desc || "",
          combat_state: state,
        },
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
      let desc = obj.desc;
      if (target === "pip" && row.location === "crucible") {
        const hasCisternArtifact = await getFlag(db, uid, "cistern_artifact_found", 0);
        desc = hasCisternArtifact
          ? "Pip sits on the edge of the table. When you enter, it turns. Pip raises one small arm and points. Not at the stone fragment. At you. Othorion glances up. He looks at Pip. Then at you. Then back at Pip. \"...Hm,\" he says. He does not continue working immediately."
          : "Pip sits on the edge of the table, watching the room with bright, attentive eyes. When you look at it, Pip raises one small arm and points toward the mounted stone fragment across the room. Othorion glances up briefly. \"Yes, yes, I know,\" he mutters. \"You're very helpful.\" He flips through a notebook. \"Familiar behavior inconsistent with any known arcane taxonomy.\" Pip continues pointing.";
        return json({ target, desc, actions: obj.actions || [] });
      }
      if (target === "pip" && room?.objects?.pip && PIP_REACTIONS.length > 0) {
        const reaction = PIP_REACTIONS[Math.floor(Math.random() * PIP_REACTIONS.length)];
        desc = `${desc}\n\n${reaction}`;
      }
      return json({ target, desc, actions: obj.actions || [] });
    }

    // ── POST: Search (room/object loot) ──
    if (path === "/api/search" && method === "POST") {
      const { object } = body;
      if (!object || typeof object !== "string") return err("object required.", 400);
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const key = `${row.location}:${object}`;
      const entry = ROOM_LOOT[key];
      if (!entry) return err("Nothing to find.", 404);
      const hasFlag = await getFlag(db, uid, entry.flag);
      if (hasFlag) return err("Nothing to find.", 404);
      await setFlag(db, uid, entry.flag, 1);
      const invRow = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, entry.item]);
      const displayName = entry.display_name || entry.item;
      if (invRow) {
        await dbRun(db, "UPDATE inventory SET qty=qty+? WHERE user_id=? AND item=?", [entry.qty, uid, entry.item]);
      } else {
        await dbRun(db, `INSERT INTO inventory (user_id, item, qty, tier, corrupted, curse, curse_identified, special_property, display_name)
          VALUES (?, ?, ?, 1, 0, NULL, 0, NULL, ?)`,
          [uid, entry.item, entry.qty, displayName]);
      }
      const itemLabel = entry.qty > 1 ? `${displayName} x${entry.qty}` : displayName;
      return json({ ok: true, item: itemLabel, message: `*You find ${itemLabel}.*` });
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
      const morality    = row.alignment_morality ?? row.mercy_score ?? 0;
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
      if (npc === "herbalist") {
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
      const guildStandingVaelith = await getFlag(db, uid, "guild_standing_vaelith") || 0;
      const guildStandingGarruk = await getFlag(db, uid, "guild_standing_garruk") || 0;
      const guildStandingHalden = await getFlag(db, uid, "guild_standing_halden") || 0;
      const guildStandingLirael = await getFlag(db, uid, "guild_standing_lirael") || 0;
      const guildStandingSerix = await getFlag(db, uid, "guild_standing_serix") || 0;
      const guildStandingRhyla = await getFlag(db, uid, "guild_standing_rhyla") || 0;

      const playerContext = {
        items_sold: itemsSold, deaths, morality, depth_tier: depthTier,
        instinct: row.instinct || null,
        has_corruption: !!(await getFlag(db, uid, "has_corruption")),
        guild_standing: {
          vaelith: guildStandingVaelith,
          garruk: guildStandingGarruk,
          halden: guildStandingHalden,
          lirael: guildStandingLirael,
          serix: guildStandingSerix,
          rhyla: guildStandingRhyla,
        },
        alignment: morality >= 40 ? "light" : morality <= -40 ? "dark" : "neutral",
        archetype: row.archetype ?? "Survivor",
        mercy_score: row.alignment_morality ?? row.mercy_score ?? 0,
        order_score: row.alignment_order ?? row.order_score ?? 0,
        crime_heat: row.crime_heat ?? 0,
        has_bounty: !!(await dbGet(db, "SELECT id FROM bounties WHERE target_id=? AND status='active'", [uid])),
        bounty_reward: (await dbGet(db, "SELECT reward FROM bounties WHERE target_id=? AND status='active' ORDER BY reward DESC LIMIT 1", [uid]))?.reward ?? 0,
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
      if (npc === "herbalist") {
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

      const questResult = await handleQuestDialogue(db, dbGet, dbAll, dbRun, uid, npc, topic, playerContext, getFlag, setFlag);
      if (questResult) {
        return json({ response: questResult.response });
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
      if (npc === "herbalist") {
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

      await assignNextQuestIfAvailable(db, dbGet, dbAll, dbRun, uid, npc, getFlag);

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

    // ── GET: Map discovered locations (persisted; survives death/refresh) ──
    if (path === "/api/map/discovered" && method === "GET") {
      // #region agent log
      const _rows = await dbAll(db, "SELECT flag FROM player_flags WHERE user_id=? AND (flag LIKE 'visited_%' OR flag='has_seen_market_square')", [uid]);
      fetch('http://127.0.0.1:7611/ingest/b76c038c-517a-4b96-b04d-519ffd35bf60',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'1e9205'},body:JSON.stringify({sessionId:'1e9205',location:'index.js:map/discovered',message:'DB query result',data:{uid,rowCount:_rows?.length,flags:_rows?.map(r=>r.flag).slice(0,15)},timestamp:Date.now(),hypothesisId:'C'})}).catch(()=>{});
      const rows = _rows;
      // #endregion
      const discovered = new Set();
      for (const r of rows) {
        if (r.flag === "has_seen_market_square") discovered.add("market_square");
        else if (r.flag.startsWith("visited_")) discovered.add(r.flag.slice(9));
      }
      return json({ discovered: Array.from(discovered) });
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
      let npc = (NOTICEBOARD_NPC_NOTICES[location] || []).map((n, i) => ({
        id: n.id || `npc-${location}-${i}`,
        title: n.title || "",
        message: n.message || "",
        player_name: n.player_name || "The City",
        pinned: n.pinned ? 1 : 0,
        created_at: 0,
        is_npc: true,
      }));
      if (location === "market_square" || location === "sewer_entrance") {
        const cond = await getActiveSewerCondition(db);
        if (cond) {
          npc = [{ id: "sewer-condition", title: cond.name, message: cond.noticeboard_text, player_name: "The City", pinned: 1, created_at: 0, is_npc: true }, ...npc];
        }
      }
      const combined = [...npc, ...rowsWithOwn];
      combined.sort((a, b) => (b.pinned - a.pinned) || ((b.created_at || 0) - (a.created_at || 0)));
      return json({ notices: combined });
    }

    // ── GET: Conditions (Phase 3 — hazards + roamers for noticeboard/world state) ──
    if (path === "/api/conditions" && method === "GET") {
      const conditions = await dbAll(db, "SELECT location, hazard_type, severity, expires_at FROM sewer_hazards WHERE expires_at > ?", [Date.now()]);
      const roamers = await dbAll(db, "SELECT id, enemy_id, location FROM roamers WHERE active=1");
      return json({ conditions, roamers });
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

      const activeCondition = await getActiveSewerCondition(db);
      let enemy;
      const bossNode = BOSS_NODES[row.location];
      const forceBoss = bossNode && !(await getFlag(db, uid, bossNode.flag, 0));
      if (forceBoss) {
        const bossData = COMBAT_DATA.enemies[bossNode.boss_id];
        enemy = bossData ? { ...bossData, id: bossData.id } : randomEnemy(row.location, activeCondition);
      } else {
        // Optional: set player_flags.force_combat_test=1 for deterministic gutter_rat spawn (playtest).
        const forceCombatTest = await getFlag(db, uid, "force_combat_test");
        if (forceCombatTest) {
          const gutterRat = COMBAT_DATA.enemies.gutter_rat;
          enemy = { ...gutterRat, id: gutterRat.id };
        } else {
          enemy = randomEnemy(row.location, activeCondition);
        }
      }
      const eqRows = await dbAll(db, "SELECT slot, item FROM equipment_slots WHERE user_id=?", [uid]);
      let weaponDie = 6, armorReduction = 0, shieldBonus = 0;
      for (const eq of eqRows) {
        const invRow = await dbGet(db, "SELECT tier FROM inventory WHERE user_id=? AND item=?", [uid, eq.item]);
        const tier = Math.min(invRow?.tier ?? 1, 3);
        if (eq.slot === "weapon_main") weaponDie = [6, 8, 10, 12][tier];
        else if (eq.slot === "chest") armorReduction = [0, 2, 4, 6][tier];
        else if (eq.slot === "weapon_offhand") shieldBonus = 2;
      }
      const state = {
        enemy_id: enemy.id, enemy_name: enemy.name,
        enemy_hp: enemy.hp, enemy_hp_max: enemy.hp,
        player_hp: hp.current, player_hp_max: hp.max,
        ability_cooldown: 0, ability_used: false, npc_ability_used: false, statuses: {}, enemy_statuses: {}, player_statuses: {}, turn: 1, turn_count: 1, round: 1, location: row.location,
        weapon_die: weaponDie, armor_reduction: armorReduction, shield_bonus: shieldBonus,
        enemy_staggered: false, status_effects: [], trait_state: {},
        armor_break_effects: [], active_buffs: [],
      };
      await decrementCombatBuffs(db, uid);
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
        try {
          await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        } catch {}
        await updateAlignment(db, uid, 0, -1, instinct);
        return json({
          result: "fled",
          player_hp: state.player_hp,
          message: "*You retreat into the dark.*",
        });
      }

      if (action === "ability" && (state.ability_cooldown ?? 0) > 0) return err(`Ability recharging — ${state.ability_cooldown} turn${state.ability_cooldown !== 1 ? 's' : ''} remaining.`);

      const useAbility = action === "ability";
      const usePass = action === "pass";  // Used after item use — skip player action, run enemy turn

      // Ensure new state fields exist (backwards compat)
      state.status_effects = state.status_effects ?? [];
      state.trait_state = state.trait_state ?? {};
      state.armor_break_effects = state.armor_break_effects ?? [];
      state.statuses = state.statuses ?? {};
      state.enemy_statuses = state.enemy_statuses ?? {};
      state.player_statuses = state.player_statuses ?? state.statuses ?? {};
      state.turn_count = state.turn_count ?? state.turn ?? 1;
      state.ability_used = state.ability_used ?? false;
      state.npc_ability_used = state.npc_ability_used ?? false;
      state.fade_used = state.fade_used ?? false;
      state.hearth_healed = state.hearth_healed ?? false;
      state.round = state.round ?? state.turn ?? 1;
      state.active_buffs = state.active_buffs ?? [];

      // Decay active buffs at turn start
      if (state.active_buffs?.length) {
        state.active_buffs = state.active_buffs
          .map((b) => ({ ...b, turns_remaining: (b.turns_remaining ?? 1) - 1 }))
          .filter((b) => (b.turns_remaining ?? 0) > 0);
      }

      // Equipment stat bonuses (add ON TOP of tier values)
      const equippedItemMap = await getEquippedItemMap(db, dbAll, uid);
      const baseEquipStats = aggregateEquipmentStats(equippedItemMap);
      const equippedStats = applyInstinctAffinities(baseEquipStats, equippedItemMap, instinct);
      const activeBonuses = {};
      for (const buff of (state.active_buffs || [])) {
        activeBonuses[buff.stat] = (activeBonuses[buff.stat] || 0) + (buff.value ?? 0);
      }
      // Economy Blueprint v2: combat buff flags (smith/armor/thalara services)
      const edgeHone = await getFlag(db, uid, "buff_edge_hone_combats_remaining", 0);
      if (edgeHone > 0) activeBonuses.melee_power = (activeBonuses.melee_power || 0) + 1;
      const balancedGrip = await getFlag(db, uid, "buff_balanced_grip_combats_remaining", 0);
      if (balancedGrip > 0) activeBonuses.accuracy = (activeBonuses.accuracy || 0) + 3;
      const strapTighten = await getFlag(db, uid, "buff_strap_tighten_combats_remaining", 0);
      if (strapTighten > 0) activeBonuses.defense = (activeBonuses.defense || 0) + 1;
      const weightRedist = await getFlag(db, uid, "buff_weight_redist_combats_remaining", 0);
      if (weightRedist > 0) activeBonuses.dodge = (activeBonuses.dodge || 0) + 1;
      const shieldBrace = await getFlag(db, uid, "buff_shield_brace_combats_remaining", 0);
      if (shieldBrace > 0) activeBonuses.block = (activeBonuses.block || 0) + 2;
      const emberTonic = await getFlag(db, uid, "buff_ember_tonic_combats_remaining", 0);
      if (emberTonic > 0) activeBonuses.spell_power = (activeBonuses.spell_power || 0) + 1;

      // 1. Tick status effects (bleed/poison/fire_touch)
      const statusDmg = tickStatusEffects(state);
      let playerHp = state.player_hp - statusDmg;

      // 2. Tick armor_break (decay duration)
      state.armor_break_effects = state.armor_break_effects
        .map((e) => ({ ...e, duration: e.duration - 1 }))
        .filter((e) => e.duration > 0);

      const upgradesJson = JSON.parse(row.upgrades || "{}");
      const level5Upgrade = LEVEL_5_UPGRADES[upgradesJson?.level_5];

      const armorBreakReduction = state.armor_break_effects.reduce((s, e) => s + (e.defense_reduction ?? 0), 0);
      const baseTierArmor = Math.max(0, (state.armor_reduction ?? 0) - armorBreakReduction);
      const equipDefense = (equippedStats.defense || 0) + (activeBonuses.defense || 0);
      let effectiveArmor = baseTierArmor + equipDefense;

      // Passive: battle_hardened, stone_guard, quiet_prayer
      const playerHpPercent = (state.player_hp_max ?? 1) > 0 ? (state.player_hp ?? 0) / state.player_hp_max : 0;
      const turnCount = state.turn_count ?? state.turn ?? 1;
      if (level5Upgrade?.id === "quiet_prayer" && turnCount > 0 && turnCount % 3 === 0) {
        const healAmt = Math.max(1, Math.floor((state.player_hp_max ?? 20) * (level5Upgrade.heal_percent ?? 0.08)));
        playerHp = Math.min(playerHp + healAmt, state.player_hp_max);
        const negStatuses = ["armor_break", "bleed", "poison", "burn", "weakened", "blind", "stun"];
        const toRemove = negStatuses.find((s) => (state.statuses?.[s] ?? 0) > 0);
        if (toRemove && (level5Upgrade.remove_statuses ?? 0) > 0) {
          delete state.statuses[toRemove];
        }
      }
      if (level5Upgrade?.id === "battle_hardened") {
        const baseResist = level5Upgrade.passive_defense_bonus ?? 0.15;
        const lowHpBonus = playerHpPercent < (level5Upgrade.low_hp_threshold ?? 0.4) ? (level5Upgrade.low_hp_bonus_resist ?? 0.2) : 0;
        effectiveArmor = Math.floor(effectiveArmor * (1 + baseResist + lowHpBonus));
      }

      // 3. Resolve player action (pass = no action, e.g. after item use)
      let attack;
      if (usePass) {
        attack = { dmg: 0, heal: 0, skip_retaliation: false };
      } else if (useAbility) {
        if (level5Upgrade) {
          if (level5Upgrade.type === "passive") return err(`${level5Upgrade.display_name} is passive — it activates automatically.`, 400);
          if (state.ability_used) return err(`${level5Upgrade.display_name} has already been used this combat.`, 400);
          attack = resolveUpgradeAbility(level5Upgrade, row, state, enemy, equippedItemMap);
          state.ability_used = true;
      } else {
        state.accuracy_bonus = activeBonuses.accuracy ?? 0;
        attack = resolvePlayerAction(stats, enemy, true, instinct, state, undefined);
        }
      } else {
        state.accuracy_bonus = activeBonuses.accuracy ?? 0;
        attack = resolvePlayerAction(stats, enemy, false, instinct, state, undefined);
      }

      // Add equipment + buff attack bonus (melee_power or spell_power) — NOT for Level 5 upgrade abilities
      const usedUpgradeAbility = useAbility && level5Upgrade;
      if (!usedUpgradeAbility && !attack.heal && attack.dmg != null && attack.dmg > 0) {
        const weaponMainId = equippedItemMap?.weapon_main;
        const weaponDef = weaponMainId ? EQUIPMENT_DATA[weaponMainId] : null;
        const isSpellWeapon = weaponDef && ["wand", "staff"].includes(weaponDef.sub_type || "");
        const atkBonus = isSpellWeapon
          ? ((equippedStats.spell_power || 0) + (activeBonuses.spell_power || 0))
          : ((equippedStats.melee_power || 0) + (activeBonuses.melee_power || 0));
        attack.dmg = (attack.dmg || 0) + atkBonus;
      }

      if (attack.fade_triggered) state.fade_used = true;
      if (attack.stealth_consumed) delete state.statuses.stealth;
      if (attack.set_flag === "hearth_healed") state.hearth_healed = true;

      if (useAbility) {
        if (level5Upgrade) {
          state.ability_cooldown = 0;  // Level 5 upgrades are once-per-combat, no cooldown
        } else {
          const def = INSTINCT_DEFS[instinct];
          state.ability_cooldown = def?.primary?.cadence ?? 3;
        }
      } else {
        state.ability_cooldown = Math.max(0, (state.ability_cooldown ?? 0) - 1);
      }

      let enemyHp = state.enemy_hp;

      if (attack.heal) {
        playerHp = Math.min(playerHp + attack.heal, state.player_hp_max);
      } else {
        const guardMod = getTraitDamageModifier(enemy, state);
        const playerDmg = Math.floor((attack.dmg ?? 0) * guardMod);
        enemyHp = Math.max(0, enemyHp - playerDmg);
      }

      if (attack.status_on_enemy) {
        const dur = attack.status_duration_enemy ?? attack.status_duration ?? 1;
        const status = attack.status_on_enemy;
        if (status === "burn") {
          const cur = state.enemy_statuses?.burn ?? 0;
          state.enemy_statuses = state.enemy_statuses || {};
          state.enemy_statuses.burn = cur > 0 ? cur + dur : dur;
        } else if (status === "stagger" || status === "stun") {
          if ((state.enemy_statuses?.[status] ?? 0) <= 0) {
            state.enemy_statuses = state.enemy_statuses || {};
            state.enemy_statuses[status] = dur;
          }
        } else {
          state.enemy_statuses = state.enemy_statuses || {};
          state.enemy_statuses[status] = dur;
        }
      }
      if (attack.status_on_player) {
        const dur = attack.status_duration_player ?? attack.status_duration ?? 1;
        const status = attack.status_on_player;
        if (status === "shield" && attack.status_value != null) {
          const cur = typeof state.statuses?.shield === "object" ? (state.statuses.shield?.value ?? 0) : 0;
          if (attack.status_value > cur) {
            state.statuses = state.statuses || {};
            state.statuses.shield = { duration: dur, value: attack.status_value };
          }
        } else {
          state.statuses = state.statuses || {};
          state.statuses[status] = attack.status_value != null ? { duration: dur, value: attack.status_value } : dur;
        }
      }

      // 4. Enemy retaliation (skip if staggered or skip_retaliation)
      let enemyDmg = 0;
      let enemyHit = false;
      let enemySkippedStagger = false;
      let dodged = false;
      const skipRetaliation = attack.skip_retaliation ?? attack.skipRetaliation ?? false;
      const staggered = (state.enemy_statuses?.staggered ?? 0) > 0;
      const stunned = (state.enemy_statuses?.stun ?? 0) > 0;
      const untargetable = (state.statuses?.untargetable ?? 0) > 0;

      if (!skipRetaliation) {
        if (staggered || stunned || untargetable) {
          enemySkippedStagger = true;
        } else {
          const traitResult = resolveEnemyTrait(enemy, state);
          let attackResult;
          if (traitResult?.summonMinion) {
            state.summoned_minion = { id: traitResult.summonMinion, hp: (COMBAT_DATA.enemies[traitResult.summonMinion]?.hp ?? 16), hp_max: (COMBAT_DATA.enemies[traitResult.summonMinion]?.hp ?? 16) };
            attackResult = { dmg: 0, hit: false };
          } else if (traitResult?.skipAction) {
            attackResult = { dmg: 0, hit: false };
          } else if (traitResult?.replacementAttack) {
            attackResult = {
              dmg: traitResult.replacementAttack.damage,
              hit: traitResult.replacementAttack.hit,
            };
          } else {
            const offhandId = equippedItemMap?.weapon_offhand;
            const offhandDef = offhandId ? EQUIPMENT_DATA[offhandId] : null;
            const isShield = offhandDef && ["shield", "buckler"].includes(offhandDef.sub_type || "");
            const effectiveShieldBonus = isShield
              ? ((state.shield_bonus ?? 0) + (equippedStats.block_value || 0))
              : (state.shield_bonus ?? 0);
            attackResult = resolveEnemyAttack(enemy, stats, state.statuses, state.enemy_statuses, effectiveShieldBonus);
          }
          enemyDmg = attackResult.dmg ?? 0;
          enemyHit = attackResult.hit ?? false;

          enemyDmg = Math.floor(enemyDmg * (attack.damageReduction ? 1 - attack.damageReduction : 1));
          enemyDmg = Math.max(0, enemyDmg - effectiveArmor);

          // Passive: stone_guard (20% resist when above 50% HP)
          if (level5Upgrade?.id === "stone_guard" && playerHpPercent > (level5Upgrade.hp_threshold ?? 0.5)) {
            enemyDmg = Math.floor(enemyDmg * (1 - (level5Upgrade.passive_resist_above_threshold ?? 0.2)));
          }

          // damage_resist, shield (Level 5 status effects)
          const resistVal = state.damage_resist_value ?? 0.4;
          if ((state.statuses?.damage_resist ?? 0) > 0 || (typeof state.statuses?.damage_resist === "object" && state.statuses?.damage_resist?.duration > 0)) {
            enemyDmg = Math.floor(enemyDmg * (1 - resistVal));
          }
          const shieldEntry = state.statuses?.shield;
          const shieldVal = typeof shieldEntry === "object" ? shieldEntry?.value ?? 0 : 0;
          if (shieldVal > 0) {
            const absorbed = Math.min(enemyDmg, shieldVal);
            enemyDmg = Math.max(0, enemyDmg - absorbed);
            if (typeof shieldEntry === "object") shieldEntry.value = Math.max(0, shieldEntry.value - absorbed);
          }

          // Dodge check
          const dodgeChance = (equippedStats.dodge || 0) + (activeBonuses.dodge || 0);
          dodged = dodgeChance > 0 && Math.random() * 100 < dodgeChance;
          if (dodged && enemyHit) {
            enemyDmg = 0;
            enemyHit = false;
          }

          if (instinct === "warden" && playerHp < state.player_hp_max * 0.5) enemyDmg = Math.max(0, enemyDmg - 1);

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

      state.statuses = tickStatuses(state.statuses);
      state.enemy_statuses = tickStatuses(state.enemy_statuses);

      playerHp = Math.max(0, playerHp - enemyDmg);

      // Iron Walkway fall_risk: knocked back in combat → fall damage 15, DEX check to catch chain
      let fallRiskMsg = "";
      const combatLoc = state.location || "";
      if (combatLoc === "iron_walkway" && enemyHit && enemyDmg >= 8) {
        const dexMod = statMod(row.dexterity);
        const dexRoll = rollDie(20) + dexMod;
        const FALL_DC = 12;
        if (dexRoll < FALL_DC) {
          const fallDmg = 15;
          playerHp = Math.max(0, playerHp - fallDmg);
          fallRiskMsg = `\n\n*The blow drives you toward the edge. You miss the chain — **${fallDmg}** fall damage.*`;
        } else if (enemyDmg > 0) {
          fallRiskMsg = "\n\n*You catch the chain. The walkway holds.*";
        }
      }

      // Victory — or transition to summoned minion
      if (enemyHp <= 0) {
        // Summoned minion: transition to fight minion instead of victory
        if (state.summoned_minion) {
          const minion = COMBAT_DATA.enemies[state.summoned_minion.id];
          if (minion) {
            state.enemy_id = state.summoned_minion.id;
            state.enemy_name = minion.name;
            state.enemy_hp = state.summoned_minion.hp;
            state.enemy_hp_max = state.summoned_minion.hp_max;
            delete state.summoned_minion;
            state.enemy_staggered = false;
            state.enemy_statuses = {};
            await dbRun(db, "UPDATE combat_state SET state_json=? WHERE user_id=?", [JSON.stringify(state), uid]);
            await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);
            const summonMsg = `*The Rat King falls — but something else rises from the ash.*\n\n*${minion.name} emerges.*`;
            return json({ result: "ongoing", message: summonMsg, player_hp: playerHp, enemy_hp: state.enemy_hp, enemy_hp_max: state.enemy_hp_max, ability_cooldown: state.ability_cooldown ?? 0, ability_used: state.ability_used ?? false, statuses: state.statuses ?? {}, enemy_statuses: state.enemy_statuses ?? {}, active_buffs: state.active_buffs ?? [] });
          }
        }

        // spore_burst: fungal_shambler / sporebound_custodian deal 4 damage on death
        const sporeBurstEnemies = ["fungal_shambler", "sporebound_custodian"];
        if (sporeBurstEnemies.includes(state.enemy_id)) {
          playerHp = Math.max(0, playerHp - 4);
          if (playerHp <= 0) {
            const deathLoc = state.location || "drain_entrance";
            const { ashLost } = await processDeathDrop(db, uid, deathLoc);
            await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
            await dbRun(db, "UPDATE characters SET current_hp=0 WHERE user_id=?", [uid]);
            await dbRun(db, "UPDATE players SET location='tavern' WHERE user_id=?", [uid]);
            const maxHp = maxPlayerHp(row.constitution, row.class_stage ?? 0);
            await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [maxHp, uid]);
            await setFlag(db, uid, "death_count", (await getFlag(db, uid, "death_count", 0)) + 1);
            await setFlag(db, uid, "just_respawned", 1);
            await updateAlignment(db, uid, 0, -2, instinct);
            let deathMsg = `*${enemy.name} bursts — spores fill your lungs. You fall.*\n\n*You wake in the Shadow Hearth Inn.*`;
            if (ashLost > 0) deathMsg += `\n\nYou lost ${ashLost} Ash Marks. They're still where you fell.`;
            return json({ result: "death", message: deathMsg });
          }
        }

        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

        // Set boss_floorN flag when defeating a floor boss
        const bossFlags = { rat_king: "boss_floor1", sporebound_custodian: "boss_floor2", cistern_leviathan: "boss_floor3", broken_regulator: "boss_floor4", ash_heart_custodian: "boss_floor5" };
        const bossFlag = bossFlags[state.enemy_id];
        if (bossFlag) await setFlag(db, uid, bossFlag, 1);

        const victoryLoc = state.location || "drain_entrance";
        if (victoryLoc === "vermin_nest") await setFlag(db, uid, "nest_cleared_floor1", 1);
        await recordEnemyKill(db, dbAll, dbRun, uid, state.enemy_id);
        await setFlag(db, uid, "post_fight_noise", 1);

        // Phase 3: Kill tracking for boss spawn conditions
        const killsInLoc = await getFlag(db, uid, `kills_in_${victoryLoc}`, 0);
        await setFlag(db, uid, `kills_in_${victoryLoc}`, killsInLoc + 1);
        const totalKills = await getFlag(db, uid, "total_kills", 0);
        await setFlag(db, uid, "total_kills", totalKills + 1);
        const locTier = SEWER_LEVEL_5.includes(victoryLoc) ? 3 : SEWER_LEVEL_4.includes(victoryLoc) || SEWER_LEVEL_3.includes(victoryLoc) ? 2 : SEWER_LEVEL_1.includes(victoryLoc) || SEWER_LEVEL_2.includes(victoryLoc) ? 1 : 0;
        if (locTier > 0) {
          const curTier = await getFlag(db, uid, "depth_tier", 0);
          if (locTier > curTier) await setFlag(db, uid, "depth_tier", locTier);
        }

        const xpGain = enemy.xp || 50;
        const xpRow  = await dbGet(db, "SELECT xp,class_stage,upgrades FROM characters WHERE user_id=?", [uid]);
        const newXp  = (xpRow.xp || 0) + xpGain;
        await dbRun(db, "UPDATE characters SET xp=? WHERE user_id=?", [newXp, uid]);
        const canAdvance = newXp >= [0,500,1500,3500,7500,15000][(xpRow.class_stage||0)+1];
        let newClassStage = xpRow.class_stage ?? 0;
        if (canAdvance) {
          newClassStage = newClassStage + 1;
          await dbRun(db, "UPDATE characters SET class_stage=? WHERE user_id=?", [newClassStage, uid]);
        }

        // Loot — tiered cash + item drop (Economy Blueprint v2)
        const floor = LOCATION_TO_FLOOR[state.location || "drain_entrance"] ?? 1;
        const enemyTier = floor <= 2 ? 1 : floor <= 4 ? 2 : 3;
        let lootAsh = rollCashLoot(enemyTier);
        let bossRewardLine = "";
        let lootItemLine = "";

        // Phase 3: Boss reward (telegraphed boss from BOSS_DEFS)
        if (state.boss && state.boss_reward) {
          const reward = state.boss_reward;
          if (reward.ash_marks) {
            lootAsh += reward.ash_marks;
          }
          if (reward.item) {
            await addItemToInventory(db, uid, reward.item, 1);
            const itemName = ITEM_DATA[reward.item]?.name || reward.item;
            bossRewardLine = ` | **${itemName}** (boss)`;
          }
          if (reward.flag) await setFlag(db, uid, reward.flag, 1);
        }

        await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [lootAsh, uid]);

        const itemDrop = rollItemDrop(enemyTier);
        if (itemDrop) {
          const lootDef = LOOT_ITEMS[itemDrop];
          const isUnidentifiedRelic = lootDef?.category === "loot_relic" || lootDef?.category === "loot_artifact";
          const dropName = isUnidentifiedRelic ? "Strange Object" : (lootDef?.name || ITEM_DATA[itemDrop]?.name || itemDrop);
          await dbRun(db, `INSERT INTO inventory (user_id, item, qty, tier, display_name) VALUES (?, ?, 1, 1, ?)
            ON CONFLICT(user_id, item) DO UPDATE SET qty = qty + 1`,
            [uid, itemDrop, dropName]);
          lootItemLine = ` | **${dropName}**`;
        }

        // Loot — floor-specific from sewer_loot, or procedural fallback
        const playerLevel = 1 + newClassStage;
        const locationId = state.location || "drain_entrance";
        const isBoss = !!bossFlag;
        const lootCondition = await getActiveSewerCondition(db);
        const { items: lootItems, procedural } = getCombatLoot(state.enemy_id, locationId, isBoss, playerLevel, lootCondition);

        const itemLines = [];
        for (const it of lootItems) {
          const specProp = null;
          const invRow = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, it.item]);
          if (invRow) {
            await dbRun(db, "UPDATE inventory SET qty=qty+?, tier=?, display_name=? WHERE user_id=? AND item=?",
              [it.qty, it.tier, it.display_name, uid, it.item]);
          } else {
            await dbRun(db, `INSERT INTO inventory (user_id, item, qty, tier, corrupted, curse, curse_identified, special_property, display_name)
              VALUES (?, ?, ?, ?, 0, NULL, 0, ?, ?)`,
              [uid, it.item, it.qty, it.tier, specProp, it.display_name]);
          }
          itemLines.push(it.display_name || it.item);
        }
        if (procedural) {
          await dbRun(db, `INSERT INTO inventory (user_id, item, qty, tier, corrupted, curse, curse_identified, special_property, display_name)
            VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?)`,
            [uid, procedural.id, procedural.tier, procedural.corrupted ? 1 : 0, procedural.curse || null, procedural.curse_identified || 0, procedural.special_property || null, procedural.display_name || null]);
          itemLines.push(procedural.display_name || procedural.id);
        }

        // Weight-based loot from fetch quest economy
        const rollDrops = rollLoot(state.enemy_id);
        for (const { itemId, qty } of rollDrops) {
          await addItemToInventory(db, uid, itemId, qty);
          await checkQuestProgressForItem(db, dbGet, dbAll, dbRun, uid, itemId, qty, getFlag, setFlag);
          const itemName = ITEM_DATA[itemId]?.name || itemId;
          itemLines.push(qty > 1 ? `${itemName} x${qty}` : itemName);
        }

        // Boss kill flags for quest system
        if (bossFlag) {
          await setFlag(db, uid, `boss_killed_${state.enemy_id}`, 1);
        }

        const mKill = instinct === "ironblood" ? 0 : -1;
        await updateAlignment(db, uid, mKill, 1, instinct);

        const itemLine = itemLines.length ? ` | **${itemLines.join("**, **")}**` : "";
        let victoryMsg = `*${enemy.name} falls.*\n\n${attack.narrative}${fallRiskMsg ? fallRiskMsg : ""}`;
        if (sporeBurstEnemies.includes(state.enemy_id)) victoryMsg += `\n\n*It bursts — spores fill your lungs. **4** damage.*`;
        victoryMsg += `\n\n**+${xpGain} XP** | **+${lootAsh} Ash Marks**${bossRewardLine || ""}${lootItemLine || ""}${itemLine}`;
        const resp = { result: "victory", message: victoryMsg, can_advance: !!canAdvance, player_hp: playerHp };
        if (itemDrop) {
          resp.loot_item = itemDrop;
          resp.loot_item_name = LOOT_ITEMS[itemDrop]?.name || itemDrop;
        }
        if (newClassStage === 5) {
          const upgradesJson = JSON.parse(xpRow.upgrades || "{}");
          if (!upgradesJson?.level_5) {
            resp.upgrade_pending = true;
            resp.instinct = (row.instinct || "").toLowerCase();
          }
        }
        return json(resp);
      }

      // Death
      if (playerHp <= 0) {
        const deathLoc = state.location || "drain_entrance";
        const { ashLost } = await processDeathDrop(db, uid, deathLoc);
        await dbRun(db, "DELETE FROM combat_state WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE characters SET current_hp=0 WHERE user_id=?", [uid]);
        await dbRun(db, "UPDATE players SET location='tavern' WHERE user_id=?", [uid]);
        const maxHp = maxPlayerHp(row.constitution, row.class_stage ?? 0);
        await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [maxHp, uid]);
        const dc = await getFlag(db, uid, "death_count");
        await setFlag(db, uid, "death_count", dc + 1);
        await setFlag(db, uid, "just_respawned", 1);
        await updateAlignment(db, uid, 0, -2, instinct);
        let deathMsg = `*${enemy.name} stands over you.*`;
        if (fallRiskMsg) deathMsg += `\n\nThe blow drove you toward the edge. The chain was not enough.`;
        deathMsg += `\n\n*You wake in the Shadow Hearth Inn.*`;
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
      state.turn_count = (state.turn_count ?? state.turn ?? 1) + 1;
      state.round = (state.round ?? state.turn) + 1;
      await dbRun(db, "UPDATE combat_state SET state_json=? WHERE user_id=?", [JSON.stringify(state), uid]);
      await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [playerHp, uid]);

      let msg = attack.narrative;
      if (equippedStats.dual_wield && !attack.heal && (attack.dmg ?? 0) > 0) {
        const offhandId = equippedItemMap?.weapon_offhand;
        const offhandDef = offhandId ? EQUIPMENT_DATA[offhandId] : null;
        const offhandPower = offhandDef?.stat_modifiers?.melee_power || 0;
        const offhandBonus = Math.floor(offhandPower / 2);
        if (offhandBonus > 0) msg += ` Your offhand strikes for ${offhandBonus} additional damage.`;
      }
      if (statusDmg > 0) msg += `\n\n*Bleed/poison/fire — ${statusDmg} damage.*`;
      if (state.summoned_minion) msg += `\n\n*${enemy.name} summons something from the ash. A Gutter Rat emerges.*`;
      else if (enemySkippedStagger) msg += `\n\n*${enemy.name} staggers — it loses its turn.*`;
      else if (dodged) msg += `\n\n*You sidestep the attack.*`;
      else msg += `\n\n*${enemy.name} retaliates — ${enemyDmg > 0 ? `${enemyDmg} damage.` : "misses."}*`;
      if (fallRiskMsg) msg += fallRiskMsg;

      return json({
        result: "ongoing",
        message: msg,
        player_hp: playerHp, enemy_hp: enemyHp,
        enemy_hp_max: state.enemy_hp_max,
        ability_cooldown: state.ability_cooldown ?? 0,
        ability_used: state.ability_used ?? false,
        statuses: state.statuses ?? {},
        active_buffs: state.active_buffs ?? [],
        enemy_statuses: state.enemy_statuses ?? {},
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
      const targetChar = await dbGet(db, "SELECT constitution, class_stage FROM characters WHERE user_id=?", [targetUid]);
      const maxHp = maxPlayerHp(targetChar?.constitution || 10, targetChar?.class_stage ?? 0);
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
      const finishChar = await dbGet(db, "SELECT constitution, class_stage FROM characters WHERE user_id=?", [targetUid]);
      const maxHp = maxPlayerHp(finishChar?.constitution || 10, finishChar?.class_stage ?? 0);
      await dbRun(db, "UPDATE characters SET current_hp=? WHERE user_id=?", [maxHp, targetUid]);
      const dc = await getFlag(db, targetUid, "death_count");
      await setFlag(db, targetUid, "death_count", dc + 1);
      await setFlag(db, targetUid, "just_respawned", 1);
      await dbRun(db, "INSERT INTO pvp_state (user_id, downed_until, downed_by, created_at, updated_at) VALUES (?, 0, NULL, ?, ?) ON CONFLICT(user_id) DO UPDATE SET downed_until=0, downed_by=NULL, updated_at=excluded.updated_at", [targetUid, Math.floor(Date.now() / 1000), Math.floor(Date.now() / 1000)]);
      await addCrimeHeat(db, uid, 3, "murder", { location: row.location });
      await updateAlignment(db, uid, -50, 0, (row.instinct || "").toLowerCase());
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
      const newHp = Math.max(0, (targetRow.current_hp || maxPlayerHp(targetRow.constitution, targetRow.class_stage ?? 0)) - dmg);
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
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== "tavern") return err("You need to be at the Shadow Hearth Inn.");
      if ((row.ash_marks || 0) < BARTENDER_FEE) {
        return json({ ok: false, message: `*Kelvaris doesn't look at you.*\n\n"Ten marks. That's what a room costs."\n\nYou have **${row.ash_marks || 0}** Ash Marks.` });
      }
      const maxHp = maxPlayerHp(row.constitution, row.class_stage ?? 0);
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

    // ── POST: Shop sell offers (Economy Blueprint v2) ──
    if (path === "/api/shop/sell_offers" && method === "POST") {
      const npc_id = body.npc_id;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!npc_id) return err("Missing npc_id.", 400);
      const npcLoc = NPC_LOCATIONS[npc_id];
      if (!npcLoc || npcLoc !== row.location) return err("Vendor is not here.", 400);
      const invRows = await dbAll(db, "SELECT item,qty,display_name FROM inventory WHERE user_id=?", [uid]);
      const offers = {};
      for (const r of invRows) {
        const itemForSell = getItemForSell(r.item, ITEM_DATA);
        if (!itemForSell) continue;
        const price = econGetSellPrice(itemForSell, npc_id);
        if (price > 0) offers[r.item] = price;
      }
      return json({ offers });
    }

    // ── POST: Shop browse (Economy Blueprint v2) ──
    if (path === "/api/shop/browse" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const npc_id = body.npc_id;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!npc_id) return err("Missing npc_id.", 400);
      const npcLoc = NPC_LOCATIONS[npc_id];
      if (!npcLoc || npcLoc !== row.location) return err("Vendor is not here.", 400);
      const items = ECON_VENDOR_STOCK[npc_id];
      if (!items) return err("Unknown vendor.", 404);
      return json({ items });
    }

    // ── POST: Shop buy (Economy Blueprint v2) ──
    if (path === "/api/shop/buy" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const { npc_id, item_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!npc_id || !item_id) return err("Missing npc_id or item_id.", 400);
      const npcLoc = NPC_LOCATIONS[npc_id];
      if (!npcLoc || npcLoc !== row.location) return err("Vendor is not here.", 400);
      const items = ECON_VENDOR_STOCK[npc_id];
      if (!items) return err("Unknown vendor.", 404);
      const entry = items.find((s) => s.id === item_id);
      if (!entry) return err("Item not in stock.", 404);
      const ash = Number(row.ash_marks ?? 0);
      if (ash < entry.price) return err(`You need ${entry.price} Ash Marks. You have ${ash}.`, 400);
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?", [entry.price, uid]);
      const invRow = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      if (invRow) {
        await dbRun(db, "UPDATE inventory SET qty=qty+1 WHERE user_id=? AND item=?", [uid, item_id]);
      } else {
        await dbRun(db, "INSERT INTO inventory (user_id, item, qty, display_name) VALUES (?, ?, 1, ?)", [uid, item_id, entry.name]);
      }
      const newBal = ash - entry.price;
      return json({ ok: true, message: `*You purchase ${entry.name} for ${entry.price} Ash Marks.*`, new_balance: newBal });
    }

    // ── POST: Shop sell (Economy Blueprint v2) ──
    if (path === "/api/shop/sell" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const { npc_id, item_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!npc_id || !item_id) return err("Missing npc_id or item_id.", 400);
      const npcLoc = NPC_LOCATIONS[npc_id];
      if (!npcLoc || npcLoc !== row.location) return err("Vendor is not here.", 400);
      const invRow = await dbGet(db, "SELECT item,qty,display_name FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      if (!invRow || invRow.qty < 1) return err(`You don't have that item.`, 400);
      const itemForSell = getItemForSell(item_id, ITEM_DATA);
      if (!itemForSell) return err("That vendor won't buy that.", 400);
      const amount = econGetSellPrice(itemForSell, npc_id);
      if (amount <= 0) return err("That vendor won't buy that.", 400);
      if (invRow.qty <= 1) {
        await dbRun(db, "DELETE FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      } else {
        await dbRun(db, "UPDATE inventory SET qty=qty-1 WHERE user_id=? AND item=?", [uid, item_id]);
      }
      const newBalance = (row.ash_marks || 0) + amount;
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [amount, uid]);
      return json({ ok: true, message: `*They take it.*\n\n"${amount} marks."`, amount_received: amount, new_balance: newBalance });
    }

    // ── POST: Identify (Seris, 40 AM) ──
    if (path === "/api/identify" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const { item_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== NPC_LOCATIONS.curator) return err("Seris is not here.", 400);
      if (!item_id) return err("Missing item_id.", 400);
      const loot = LOOT_ITEMS[item_id];
      const isRelic = loot?.category === "loot_relic";
      const isArtifact = loot?.category === "loot_artifact";
      if (!isRelic && !isArtifact) return err("That isn't something Seris identifies.", 400);
      const invRow = await dbGet(db, "SELECT item,qty,display_name FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      if (!invRow || invRow.qty < 1) return err("You don't have that item.", 400);
      const identified = invRow.display_name && invRow.display_name !== "Strange Object";
      if (identified) return err("You already know what that is.", 400);
      const cost = 40;
      if ((row.ash_marks || 0) < cost) return err(`You need ${cost} Ash Marks. You have ${row.ash_marks || 0}.`, 400);
      const realName = loot?.name || ITEM_DATA[item_id]?.name || item_id;
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?", [cost, uid]);
      await dbRun(db, "UPDATE inventory SET display_name=? WHERE user_id=? AND item=?", [realName, uid, item_id]);
      return json({ ok: true, message: `*Seris turns it over once. Twice.*\n\n"${realName}. Worth something to the right buyer."`, new_balance: (row.ash_marks || 0) - cost });
    }

    // ── POST: Appraise (Othorion, 25 AM) ──
    if (path === "/api/appraise" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const { item_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== NPC_LOCATIONS.othorion) return err("Othorion is not here.", 400);
      if (!item_id) return err("Missing item_id.", 400);
      const invRow = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      if (!invRow || invRow.qty < 1) return err("You don't have that item.", 400);
      const loot = LOOT_ITEMS[item_id];
      const cost = 25;
      if ((row.ash_marks || 0) < cost) return err(`You need ${cost} Ash Marks. You have ${row.ash_marks || 0}.`, 400);
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?", [cost, uid]);
      const routes = loot?.category === "loot_relic" ? ["Seris", "the Archive", "the Veil Market"] : ["Seris", "Still Scale"];
      const advice = routes[Math.floor(Math.random() * routes.length)];
      return json({ ok: true, message: `*Othorion peers at it.*\n\n"Someone like ${advice} would pay for that. I don't buy — I only look."`, new_balance: (row.ash_marks || 0) - cost });
    }

    // ── POST: Compress (Thalara, 15 AM) ──
    if (path === "/api/compress" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const { item_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== NPC_LOCATIONS.herbalist) return err("Thalara is not here.", 400);
      if (!item_id) return err("Missing item_id.", 400);
      const refined = REFINED_REAGENTS[item_id];
      if (!refined) return err("That reagent can't be compressed.", 400);
      const invRow = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      if (!invRow || invRow.qty < 3) return err("You need three of the same reagent.", 400);
      const cost = 15;
      if ((row.ash_marks || 0) < cost) return err(`You need ${cost} Ash Marks. You have ${row.ash_marks || 0}.`, 400);
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?", [cost, uid]);
      if (invRow.qty === 3) {
        await dbRun(db, "DELETE FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      } else {
        await dbRun(db, "UPDATE inventory SET qty=qty-3 WHERE user_id=? AND item=?", [uid, item_id]);
      }
      const existingRefined = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, refined.id]);
      if (existingRefined) {
        await dbRun(db, "UPDATE inventory SET qty=qty+1 WHERE user_id=? AND item=?", [uid, refined.id]);
      } else {
        await dbRun(db, "INSERT INTO inventory (user_id, item, qty, display_name) VALUES (?, ?, 1, ?)", [uid, refined.id, refined.name]);
      }
      return json({ ok: true, message: `*Thalara works it down to a single vial.*\n\n"${refined.name}. Cleaner. Stronger."`, new_balance: (row.ash_marks || 0) - cost });
    }

    // ── POST: Smith service (Caelir, 8–12 AM) ──
    if (path === "/api/smith_service" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const { service_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== NPC_LOCATIONS.weaponsmith) return err("Caelir is not here.", 400);
      const cost = SMITH_SERVICES[service_id];
      if (!cost) return err("Unknown service.", 400);
      if ((row.ash_marks || 0) < cost) return err(`You need ${cost} Ash Marks. You have ${row.ash_marks || 0}.`, 400);
      const combats = service_id === "heavy_draw" ? 3 : 5;
      const flag = service_id === "edge_hone" ? "buff_edge_hone_combats_remaining" : service_id === "balanced_grip" ? "buff_balanced_grip_combats_remaining" : "buff_heavy_draw_combats_remaining";
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?", [cost, uid]);
      await setFlag(db, uid, flag, combats);
      return json({ ok: true, message: `*Caelir works the blade.*\n\n"Should hold for a few fights."`, new_balance: (row.ash_marks || 0) - cost });
    }

    // ── POST: Armor service (Veyra, 8–12 AM) ──
    if (path === "/api/armor_service" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const { service_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== NPC_LOCATIONS.armorsmith) return err("Veyra is not here.", 400);
      const cost = ARMOR_SERVICES[service_id];
      if (!cost) return err("Unknown service.", 400);
      if ((row.ash_marks || 0) < cost) return err(`You need ${cost} Ash Marks. You have ${row.ash_marks || 0}.`, 400);
      const combats = service_id === "shield_brace" ? 3 : 5;
      const flag = service_id === "strap_tighten" ? "buff_strap_tighten_combats_remaining" : service_id === "weight_redistribute" ? "buff_weight_redist_combats_remaining" : "buff_shield_brace_combats_remaining";
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?", [cost, uid]);
      await setFlag(db, uid, flag, combats);
      return json({ ok: true, message: `*Veyra adjusts the straps.*\n\n"Should hold for a few fights."`, new_balance: (row.ash_marks || 0) - cost });
    }

    // ── POST: Thalara service (15–20 AM) ──
    if (path === "/api/thalara_service" && method === "POST") {
      if (body.currency === "soul_coins" || (body.amount_sc && body.amount_sc > 0)) {
        return json({ ok: false, message: "Take that thing out of my shop before someone sees." });
      }
      const { service_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== NPC_LOCATIONS.herbalist) return err("Thalara is not here.", 400);
      const cost = THALARA_SERVICES[service_id];
      if (!cost) return err("Unknown service.", 400);
      if ((row.ash_marks || 0) < cost) return err(`You need ${cost} Ash Marks. You have ${row.ash_marks || 0}.`, 400);
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks-? WHERE user_id=?", [cost, uid]);
      if (service_id === "cleansing_tonic") {
        await dbRun(db, "DELETE FROM player_flags WHERE user_id=? AND flag=?", [uid, "corruption_residue"]);
        return json({ ok: true, message: `*Thalara hands you a bitter draught.*\n\n"Drink. It'll clear the residue."`, new_balance: (row.ash_marks || 0) - cost });
      }
      const combats = service_id === "ember_tonic" ? 5 : 8;
      const flag = service_id === "ember_tonic" ? "buff_ember_tonic_combats_remaining" : "buff_deep_lung_combats_remaining";
      await setFlag(db, uid, flag, combats);
      return json({ ok: true, message: `*Thalara measures and mixes.*\n\n"Should hold for a few fights."`, new_balance: (row.ash_marks || 0) - cost });
    }

    // ── POST: Black market sell (Lirael, veil_market_hidden) ──
    if (path === "/api/shop/sell_black_market" && method === "POST") {
      const { item_id } = body;
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (row.location !== "veil_market_hidden") return err("Lirael is not here.", 400);
      if (!item_id) return err("Missing item_id.", 400);
      const invRow = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      if (!invRow || invRow.qty < 1) return err("You don't have that item.", 400);
      const itemForSell = getItemForSell(item_id, ITEM_DATA);
      if (!itemForSell) return err("Lirael won't take that.", 400);
      const gross = Math.floor(itemForSell.base_value * 0.55);
      const cut = Math.floor(gross * 0.15);
      const net = gross - cut;
      if (invRow.qty <= 1) {
        await dbRun(db, "DELETE FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      } else {
        await dbRun(db, "UPDATE inventory SET qty=qty-1 WHERE user_id=? AND item=?", [uid, item_id]);
      }
      const newBalance = (row.ash_marks || 0) + net;
      await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [net, uid]);
      return json({ ok: true, message: `Lirael takes her cut. You receive ${net} AM.`, amount_received: net, new_balance: newBalance });
    }

    // ── GET: Stats (aggregated equipment + affinity) ──
    if (path === "/api/stats" && method === "GET") {
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      const equipment = await getEquippedItemMap(db, dbAll, uid);
      const baseStats = aggregateEquipmentStats(equipment);
      const instinct = (row.instinct || "").toLowerCase();
      const stats = applyInstinctAffinities(baseStats, equipment, instinct);
      const characterLevel = getCharacterLevel(row);
      return json({ ...stats, character_level: characterLevel, instinct: row.instinct || "" });
    }

    // ── GET: Equipped (full item details per slot) ──
    if (path === "/api/equipped" && method === "GET") {
      const equipment = await getEquippedItemMap(db, dbAll, uid);
      const invRows = await dbAll(db, "SELECT item, display_name FROM inventory WHERE user_id=?", [uid]);
      const displayNames = Object.fromEntries(invRows.map((r) => [r.item, r.display_name || r.item]));
      const result = {};
      for (const [slot, itemId] of Object.entries(equipment)) {
        if (!itemId) continue;
        const def = EQUIPMENT_DATA[itemId];
        const statMods = def ? getItemEffectiveStats(def) : {};
        result[slot] = {
          item_id: itemId,
          name: displayNames[itemId] || def?.name || itemId,
          stat_modifiers: statMods,
        };
      }
      return json(result);
    }

    // ── GET: Inventory ──
    if (path === "/api/inventory" && method === "GET") {
      const rows = await dbAll(db, "SELECT item,qty,display_name,tier,equipped FROM inventory WHERE user_id=? ORDER BY item", [uid]);
      const raw = url.searchParams.get("raw");
      if (raw) {
        return json({ items: rows.map((r) => ({ id: r.item, qty: r.qty })) });
      }
      const equipment = await getEquippedItemMap(db, dbAll, uid);
      const equipmentMap = new Set(Object.values(equipment).filter(Boolean));
      const charRow = await dbGet(db, "SELECT instinct FROM characters WHERE user_id=?", [uid]);
      const instinct = (charRow?.instinct || "").toLowerCase();
      const items = rows.map(r => {
        const label = r.display_name || r.item;
        return r.qty === 1 ? label : `${label} x${r.qty}`;
      });
      const itemDetails = rows.map(r => {
        const slot = getEquipmentSlot(r.item) ?? resolveLegacySlot(getItemSlot(r.item, r.display_name)) ?? null;
        const equipped = !!(r.equipped || equipmentMap.has(r.item));
        const itemDef = ITEM_DATA[r.item];
        const effect = itemDef?.effect;
        const eqDef = EQUIPMENT_DATA[r.item];
        const affinity = slot && instinct && eqDef ? getAffinityHint(eqDef, instinct) : null;
        const statMods = eqDef ? getItemEffectiveStats(eqDef) : null;
        return {
          id: r.item,
          display_name: r.display_name || r.item,
          qty: r.qty,
          tier: r.tier ?? 1,
          slot: slot ?? null,
          equipped,
          item_type: itemDef?.item_type ?? "loot",
          effect_summary: getEffectSummary(r.item, itemDef),
          in_combat: effect?.in_combat ?? false,
          out_of_combat: effect?.out_of_combat ?? true,
          value_am: itemDef?.value ?? 0,
          affinity_marker: affinity?.marker ?? null,
          affinity_tooltip: affinity?.tooltip ?? null,
          affinity_details: affinity ? { hasBonuses: affinity.hasBonuses, hasPenalties: affinity.hasPenalties, bonusStats: affinity.bonusStats, penaltyStats: affinity.penaltyStats } : null,
          stat_modifiers: statMods && Object.keys(statMods).length ? statMods : null,
        };
      });
      const offhandLocked = !!(await getFlag(db, uid, "offhand_locked", 0));
      const baseStats = aggregateEquipmentStats(equipment);
      return json({ items, itemDetails, equipment, offhand_locked: offhandLocked, dual_wield: !!baseStats.dual_wield });
    }

    // ── POST: Item Use (consumables) ──
    if (path === "/api/item/use" && method === "POST") {
      const { item_id } = body;
      if (!item_id) return err("Missing item_id.", 400);
      const itemDef = ITEM_DATA[item_id];
      if (!itemDef || itemDef.item_type !== "consumable" || !itemDef.effect) return err("That item cannot be used.", 400);
      const invRow = await dbGet(db, "SELECT item,qty FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      if (!invRow || invRow.qty < 1) return err("You don't have that item.", 404);
      const effect = itemDef.effect;

      const csRow = await dbGet(db, "SELECT state_json FROM combat_state WHERE user_id=?", [uid]);
      const inCombat = !!csRow;
      let combatState = csRow ? JSON.parse(csRow.state_json) : null;

      if (inCombat && !effect.in_combat) return err("Can't use that during combat.", 400);
      if (!inCombat && !effect.out_of_combat) return err("That only works in combat.", 400);

      const applyResult = await applyConsumableEffect(db, dbRun, dbGet, uid, effect, combatState);

      if (applyResult.buff && combatState) {
        combatState.active_buffs = combatState.active_buffs ?? [];
        combatState.active_buffs.push(applyResult.buff);
        await dbRun(db, "UPDATE combat_state SET state_json=? WHERE user_id=?", [JSON.stringify(combatState), uid]);
      }

      if (applyResult.enemy_damage > 0 && combatState) {
        combatState.enemy_hp = Math.max(0, (combatState.enemy_hp ?? 0) - applyResult.enemy_damage);
        await dbRun(db, "UPDATE combat_state SET state_json=? WHERE user_id=?", [JSON.stringify(combatState), uid]);
      }

      if (invRow.qty <= 1) {
        await dbRun(db, "DELETE FROM inventory WHERE user_id=? AND item=?", [uid, item_id]);
      } else {
        await dbRun(db, "UPDATE inventory SET qty=qty-1 WHERE user_id=? AND item=?", [uid, item_id]);
      }

      const hpRow = await dbGet(db, "SELECT constitution, current_hp, class_stage FROM characters WHERE user_id=?", [uid]);
      const hp = await getPlayerHp(db, uid, hpRow);

      let resultStatus = "ok";
      if (combatState && combatState.enemy_hp <= 0) resultStatus = "victory";

      return json({
        success: true,
        message: applyResult.message,
        player_hp: hp.current,
        player_hp_max: hp.max,
        active_buffs: combatState?.active_buffs ?? [],
        enemy_hp: combatState?.enemy_hp ?? null,
        result: resultStatus,
      });
    }

    // ── GET: Quests (active and recent) ──
    if (path === "/api/quests" && method === "GET") {
      const active = await dbAll(db,
        "SELECT * FROM quests WHERE user_id=? AND status='active' ORDER BY assigned_at DESC", [uid]);
      const recent = await dbAll(db,
        "SELECT * FROM quests WHERE user_id=? AND status='complete' ORDER BY completed_at DESC LIMIT 5", [uid]);
      const enrich = (q) => {
        const def = QUEST_BY_ID[q.quest_id] || {};
        const obj = def.objective || {};
        const prog = q.progress ? JSON.parse(q.progress) : {};
        let progress = "";
        let objective_qty_current = 0;
        let objective_qty_required = 1;
        if (obj.type === "item") {
          objective_qty_current = (prog.item_collected || {})[obj.item] ?? 0;
          objective_qty_required = obj.qty || 1;
          progress = `${objective_qty_current}/${objective_qty_required}`;
        } else if (obj.type === "enemy_kills") {
          objective_qty_current = (prog.kills || {})[obj.enemy_id] ?? 0;
          objective_qty_required = obj.count || 1;
          progress = `${objective_qty_current}/${objective_qty_required}`;
        } else if (obj.type === "flag") {
          progress = "—";
        }
        const npc = def.npc || q.quest_id.split("_")[0] || "?";
        return {
          ...q,
          title: def.title || q.quest_id,
          progress,
          objective_qty_current,
          objective_qty_required,
          npc_display: npc.charAt(0).toUpperCase() + npc.slice(1),
        };
      };
      return json({ active: active.map(enrich), recent: recent.map(enrich) });
    }

    // ── GET: Sell value (check before selling) ──
    if (path.startsWith("/api/sell/value/") && method === "GET") {
      const itemId = path.slice("/api/sell/value/".length);
      const itemDef = ITEM_DATA[itemId];
      if (!itemDef) return err("Unknown item.", 404);
      const sellPrice = itemDef.value === 0 ? 0 : Math.max(1, Math.floor(itemDef.value * 0.5));
      return json({ item: itemDef.name, sell_price: sellPrice, sellable: itemDef.value > 0 });
    }

    // ── POST: Equip ──
    if (path === "/api/inventory/equip" && method === "POST") {
      const { item: itemId, slot: slotParam } = body;
      if (!itemId) return err("Missing item.", 400);
      const invRow = await dbGet(db, "SELECT item,qty,display_name,tier FROM inventory WHERE user_id=? AND item=?", [uid, itemId]);
      if (!invRow) return err("You don't have that item.", 404);
      const itemDef = EQUIPMENT_DATA[itemId] || null;
      const legacySlot = getItemSlot(itemId, invRow.display_name);
      const itemSlot = itemDef?.slot ?? (legacySlot ? resolveLegacySlot(legacySlot) : null);
      const targetSlot = slotParam ?? itemSlot;
      if (!targetSlot) return err("Not equippable.", 400);
      const resolvedSlot = resolveLegacySlot(targetSlot) || targetSlot;
      if (!isValidEquipmentSlot(resolvedSlot)) return err("Invalid slot.", 400);
      const row = await getPlayerSheet(db, uid);
      const check = await canEquipItem(row, itemDef || { slot: itemSlot }, resolvedSlot, { db, uid, getFlag });
      if (!check.ok) return err(check.message || "Cannot equip.", 400);
      const result = await equipItem(db, dbRun, dbGet, uid, itemId, resolvedSlot, { getFlag, setFlag });
      return json({ ok: true, slot: result.slot, item: itemId });
    }

    // ── POST: Unequip ──
    if (path === "/api/inventory/unequip" && method === "POST") {
      const { slot } = body;
      if (!slot) return err("Missing slot.", 400);
      const targetSlot = resolveLegacySlot(slot) || slot;
      if (!isValidEquipmentSlot(targetSlot)) return err("Invalid slot.", 400);
      await unequipItem(db, dbRun, dbGet, uid, targetSlot, { getFlag, setFlag });
      return json({ ok: true, slot: targetSlot });
    }

    // ── POST: Sell (to NPC) ──
    if (path === "/api/sell" && method === "POST") {
      const itemId = body.item_id || body.item;
      const npcId = body.npc_id || body.npc;
      const sellQty = Math.max(1, Math.min(parseInt(body.qty, 10) || 1, 999));
      const row = await getPlayerSheet(db, uid);
      if (!row) return err("No character.", 404);
      if (!npcId || !itemId) return err("item_id and npc_id required.", 400);

      const itemDef = ITEM_DATA[itemId];
      if (itemDef && itemDef.value === 0) return err(`${itemDef.name} cannot be sold.`, 400);

      const npcLoc = NPC_LOCATIONS[npcId];
      if (!npcLoc || npcLoc !== row.location) return err(`${npcId} is not here.`);

      const invRow = await dbGet(db, "SELECT item,qty,display_name,tier FROM inventory WHERE user_id=? AND item=?", [uid, itemId]);
      if (!invRow || invRow.qty < sellQty) return err(`You don't have ${sellQty > 1 ? sellQty + "x " : ""}${invRow?.display_name || itemId}.`, 400);

      const displayName = invRow.display_name || invRow.item;
      const tier = invRow.tier || 1;

      if (npcId === "curator") {
        const value = getSellValue(displayName, tier, "loot") || (itemDef ? Math.floor(itemDef.value * 0.5) : 0);
        if (value <= 0) return err("Seris won't buy that.", 400);
        const serisValue = Math.floor(value * 1.5) * sellQty;

        const key = displayNameToKey(displayName);
        const interest = key ? SERIS_INTEREST_ITEMS[key] : null;

        if (invRow.qty <= sellQty) {
          await dbRun(db, "DELETE FROM inventory WHERE user_id=? AND item=?", [uid, itemId]);
        } else {
          await dbRun(db, "UPDATE inventory SET qty=qty-? WHERE user_id=? AND item=?", [sellQty, uid, itemId]);
        }
        await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [serisValue, uid]);

        const sold = await getFlag(db, uid, "curator_items_sold");
        await setFlag(db, uid, "curator_items_sold", (sold || 0) + sellQty);

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
            item: displayName,
            qty: sellQty,
            earned: serisValue,
            message: `${dialogue}\n\n**+${serisValue} Ash Marks**`,
            ash_marks: (row.ash_marks || 0) + serisValue,
            seris_reaction: true,
          });
        }

        return json({
          ok: true,
          item: displayName,
          qty: sellQty,
          earned: serisValue,
          message: `*Seris takes it.*\n\n"${serisValue} marks."\n\n**+${serisValue} Ash Marks**`,
          ash_marks: (row.ash_marks || 0) + serisValue,
        });
      }

      if (npcId === "weaponsmith" || npcId === "armorsmith" || npcId === "herbalist") {
        if (!VENDOR_NPCS[npcId]?.sell) return err("You can't sell to that NPC.", 400);
        const base = (itemDef ? itemDef.value : TIER_BASE_VALUES[Math.min(tier || 1, 6)] ?? 10);
        const value = Math.max(1, Math.floor(base * 0.5)) * sellQty;

        if (invRow.qty <= sellQty) {
          await dbRun(db, "DELETE FROM inventory WHERE user_id=? AND item=?", [uid, itemId]);
        } else {
          await dbRun(db, "UPDATE inventory SET qty=qty-? WHERE user_id=? AND item=?", [sellQty, uid, itemId]);
        }
        await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [value, uid]);

        const npcName = NPC_NAMES[npcId] || npcId;
        return json({
          ok: true,
          item: displayName,
          qty: sellQty,
          earned: value,
          message: `*${npcName} takes it.*\n\n"${value} marks."\n\n**+${value} Ash Marks**`,
          ash_marks: (row.ash_marks || 0) + value,
        });
      }

      return err("You can't sell to that NPC.", 400);
    }

    // ── GET: Wallet ──
    if (path === "/api/wallet" && method === "GET") {
      const row = await dbGet(db, "SELECT ash_marks,ember_shards,soul_coins FROM characters WHERE user_id=?", [uid]);
      const r = row || { ash_marks: 0, ember_shards: 0, soul_coins: 0 };
      return json({
        ash_marks: r.ash_marks,
        ember_shards: r.ember_shards,
        soul_coins: r.soul_coins,
        formatted_am: formatAM(r.ash_marks),
      });
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

      } catch (e) {
        const corsHeaders = {
          "Access-Control-Allow-Origin": "*",
          "Content-Type": "application/json",
        };
        return new Response(
          JSON.stringify({ error: "Internal server error.", detail: e.message }),
          { status: 500, headers: corsHeaders }
        );
      }
    }

    return new Response("Not found", { status: 404 });
  }
};
