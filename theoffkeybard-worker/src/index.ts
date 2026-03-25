import {
  hashPassphrase,
  signSessionToken,
  verifyPassphrase,
  verifySessionToken,
} from "./auth";
import {
  attackArmorClass,
  computeDamage,
  fleeSuccess,
  playerAttackMod,
  rollDie,
} from "./combat";
import {
  NODES,
  START_NODE,
  normalizeDirection,
  type Direction,
  type GameNode,
} from "./nodes";
import type { Env } from "./types";

const ITEM_DEFS: Record<
  string,
  { label: string; description: string; heal?: number }
> = {
  healing_draught: {
    label: "healing draught",
    description: "Glass and bitter herbs. It steadies the hands.",
    heal: 5,
  },
  wooden_mug: {
    label: "wooden mug",
    description: "Rings hollow. Someone drank here recently.",
  },
};

const NPC_BLURBS: Record<string, string> = {
  gate_watcher:
    "A figure in a dull cloak nods once, then returns to watching nothing in particular.",
  quiet_vendor:
    "The vendor weighs your silence the same as your coin. Neither seems to satisfy.",
  keeper:
    "The keeper wipes a rim that was already clean. Eyes old enough to stop pretending surprise.",
};

function allowedOrigin(request: Request, env: Env): string {
  const origin = request.headers.get("Origin") ?? "";
  const list = (env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (origin && list.includes(origin)) return origin;
  return list[0] ?? "*";
}

function corsHeaders(request: Request, env: Env): HeadersInit {
  const o = allowedOrigin(request, env);
  return {
    "Access-Control-Allow-Origin": o,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
  };
}

function json(
  request: Request,
  env: Env,
  data: unknown,
  status = 200,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      ...corsHeaders(request, env),
    },
  });
}

async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

async function requirePlayer(
  request: Request,
  env: Env,
): Promise<
  | { ok: true; playerId: string }
  | { ok: false; response: Response }
> {
  const auth = request.headers.get("Authorization");
  if (!auth?.startsWith("Bearer ")) {
    return {
      ok: false,
      response: json(request, env, { error: "Missing bearer token" }, 401),
    };
  }
  const token = auth.slice(7).trim();
  const secret = env.SESSION_SECRET;
  if (!secret) {
    return {
      ok: false,
      response: json(request, env, { error: "Server misconfigured" }, 500),
    };
  }
  const playerId = await verifySessionToken(token, secret);
  if (!playerId) {
    return {
      ok: false,
      response: json(request, env, { error: "Invalid or expired token" }, 401),
    };
  }
  return { ok: true, playerId };
}

type PlayerRow = {
  id: string;
  name: string;
  current_node: string;
  hp: number;
  max_hp: number;
  level: number;
  xp: number;
  equipped_json: string;
};

async function loadPlayer(
  db: D1Database,
  id: string,
): Promise<PlayerRow | null> {
  const row = await db
    .prepare(
      "SELECT id, name, current_node, hp, max_hp, level, xp, equipped_json FROM players WHERE id = ?",
    )
    .bind(id)
    .first<PlayerRow>();
  return row ?? null;
}

async function loadInventory(db: D1Database, playerId: string) {
  const { results } = await db
    .prepare(
      "SELECT item_id, quantity FROM inventory WHERE player_id = ? ORDER BY item_id",
    )
    .bind(playerId)
    .all<{ item_id: string; quantity: number }>();
  return results ?? [];
}

async function loadFlags(db: D1Database, playerId: string) {
  const { results } = await db
    .prepare("SELECT flag_key, flag_value FROM flags WHERE player_id = ?")
    .bind(playerId)
    .all<{ flag_key: string; flag_value: number }>();
  const out: Record<string, number> = {};
  for (const r of results ?? []) out[r.flag_key] = r.flag_value;
  return out;
}

function visibleItems(node: GameNode, flags: Record<string, number>): string[] {
  return node.items.filter((id) => !flags[`taken_${id}`]);
}

function nodeForResponse(
  node: GameNode,
  flags: Record<string, number>,
): Record<string, unknown> {
  return {
    id: node.id,
    description: node.description,
    exits: node.exits,
    items: visibleItems(node, flags),
    npcs: node.npcs,
    enemy: node.enemy,
  };
}

async function buildStatePayload(
  env: Env,
  playerId: string,
  extraMessage?: string,
) {
  const db = env.DB;
  const p = await loadPlayer(db, playerId);
  if (!p) return null;
  const node = NODES[p.current_node];
  if (!node) return null;
  const inventory = await loadInventory(db, playerId);
  const flags = await loadFlags(db, playerId);
  const enc = await db
    .prepare(
      "SELECT id, enemy_id, enemy_hp, enemy_max_hp, status FROM encounters WHERE player_id = ?",
    )
    .bind(playerId)
    .first<{
      id: number;
      enemy_id: string;
      enemy_hp: number;
      enemy_max_hp: number;
      status: string;
    }>();

  let equipped: Record<string, string> = {};
  try {
    equipped = JSON.parse(p.equipped_json || "{}") as Record<string, string>;
  } catch {
    equipped = {};
  }

  const payload: Record<string, unknown> = {
    player: {
      id: p.id,
      name: p.name,
      currentNode: p.current_node,
      hp: p.hp,
      maxHp: p.max_hp,
      level: p.level,
      xp: p.xp,
      equipped,
    },
    node: nodeForResponse(node, flags),
    inventory,
    flags,
    encounter: enc
      ? {
          id: enc.id,
          enemyId: enc.enemy_id,
          enemyHp: enc.enemy_hp,
          enemyMaxHp: enc.enemy_max_hp,
          status: enc.status,
        }
      : null,
  };
  if (extraMessage) payload.message = extraMessage;
  return payload;
}

async function handleStart(request: Request, env: Env): Promise<Response> {
  const body = await readJson<{
    action?: string;
    name?: string;
    passphrase?: string;
  }>(request);
  if (!body?.action || !body.name?.trim() || !body.passphrase) {
    return json(request, env, { error: "name, passphrase, and action required" }, 400);
  }
  const name = body.name.trim();
  if (name.length < 2 || name.length > 32) {
    return json(request, env, { error: "Invalid name length" }, 400);
  }
  const secret = env.SESSION_SECRET;
  if (!secret) {
    return json(request, env, { error: "Server misconfigured" }, 500);
  }

  const db = env.DB;

  if (body.action === "create") {
    const existing = await db
      .prepare("SELECT id FROM players WHERE name = ?")
      .bind(name)
      .first<{ id: string }>();
    if (existing) {
      return json(request, env, { error: "Name already taken" }, 409);
    }
    const { salt, hash } = await hashPassphrase(body.passphrase);
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);
    await db
      .prepare(
        `INSERT INTO players (id, name, passphrase_salt, passphrase_hash, current_node, hp, max_hp, level, xp, equipped_json, created_at)
         VALUES (?, ?, ?, ?, ?, 20, 20, 1, 0, '{}', ?)`,
      )
      .bind(id, name, salt, hash, START_NODE, now)
      .run();
    const token = await signSessionToken(id, secret);
    const state = await buildStatePayload(env, id);
    return json(request, env, { token, state });
  }

  if (body.action === "login") {
    const row = await db
      .prepare(
        "SELECT id, passphrase_salt, passphrase_hash FROM players WHERE name = ?",
      )
      .bind(name)
      .first<{ id: string; passphrase_salt: string; passphrase_hash: string }>();
    if (!row) {
      return json(request, env, { error: "Unknown name or wrong passphrase" }, 401);
    }
    const ok = await verifyPassphrase(
      body.passphrase,
      row.passphrase_salt,
      row.passphrase_hash,
    );
    if (!ok) {
      return json(request, env, { error: "Unknown name or wrong passphrase" }, 401);
    }
    const token = await signSessionToken(row.id, secret);
    const state = await buildStatePayload(env, row.id);
    return json(request, env, { token, state });
  }

  return json(request, env, { error: "Invalid action" }, 400);
}

async function handleState(request: Request, env: Env): Promise<Response> {
  const auth = await requirePlayer(request, env);
  if (!auth.ok) return auth.response;
  const state = await buildStatePayload(env, auth.playerId);
  if (!state) {
    return json(request, env, { error: "Player not found" }, 404);
  }
  return json(request, env, state);
}

async function handleMove(request: Request, env: Env): Promise<Response> {
  const auth = await requirePlayer(request, env);
  if (!auth.ok) return auth.response;
  const body = await readJson<{ direction?: string }>(request);
  const dir = body?.direction ? normalizeDirection(body.direction) : null;
  if (!dir) {
    return json(request, env, { error: "direction required" }, 400);
  }

  const db = env.DB;
  const playerId = auth.playerId;

  const active = await db
    .prepare("SELECT id FROM encounters WHERE player_id = ? AND status = 'active'")
    .bind(playerId)
    .first<{ id: number }>();
  if (active) {
    return json(
      request,
      env,
      { error: "Cannot move while in combat. Fight or flee." },
      400,
    );
  }

  const p = await loadPlayer(db, playerId);
  if (!p) return json(request, env, { error: "Player not found" }, 404);
  const node = NODES[p.current_node];
  if (!node) return json(request, env, { error: "Invalid world state" }, 500);

  const nextId = node.exits[dir as Direction];
  if (!nextId) {
    return json(request, env, { error: "You cannot go that way." }, 400);
  }

  await db
    .prepare("UPDATE players SET current_node = ? WHERE id = ?")
    .bind(nextId, playerId)
    .run();

  const flags = await loadFlags(db, playerId);
  const nextNode = NODES[nextId];
  let message = `You travel ${dir}.`;

  if (nextNode?.enemy && !flags.rat_defeated && nextNode.id === "sewers_mouth") {
    const e = nextNode.enemy;
    await db
      .prepare(
        `INSERT INTO encounters (player_id, enemy_id, enemy_hp, enemy_max_hp, enemy_attack, enemy_defense, status, log_json)
         VALUES (?, ?, ?, ?, ?, ?, 'active', '[]')
         ON CONFLICT(player_id) DO UPDATE SET
           enemy_id = excluded.enemy_id,
           enemy_hp = excluded.enemy_hp,
           enemy_max_hp = excluded.enemy_max_hp,
           enemy_attack = excluded.enemy_attack,
           enemy_defense = excluded.enemy_defense,
           turn_count = 0,
           status = 'active',
           log_json = '[]'`,
      )
      .bind(playerId, e.id, e.hp, e.maxHp, e.attack, e.defense)
      .run();
    message += ` A ${e.name} blocks the wet dark.`;
  }

  const state = await buildStatePayload(env, playerId, message);
  return json(request, env, { message, state });
}

async function handleInteract(request: Request, env: Env): Promise<Response> {
  const auth = await requirePlayer(request, env);
  if (!auth.ok) return auth.response;
  const body = await readJson<{
    verb?: string;
    target?: string;
  }>(request);
  const verb = body?.verb?.toLowerCase();
  const target = body?.target?.trim().toLowerCase().replace(/\s+/g, "_");
  if (!verb) {
    return json(request, env, { error: "verb required" }, 400);
  }

  const db = env.DB;
  const playerId = auth.playerId;

  const active = await db
    .prepare("SELECT id FROM encounters WHERE player_id = ? AND status = 'active'")
    .bind(playerId)
    .first();
  if (active && verb !== "look") {
    return json(
      request,
      env,
      { error: "In combat — use /api/combat or finish the fight first." },
      400,
    );
  }

  const p = await loadPlayer(db, playerId);
  if (!p) return json(request, env, { error: "Player not found" }, 404);
  const node = NODES[p.current_node];
  if (!node) return json(request, env, { error: "Invalid node" }, 500);
  const flags = await loadFlags(db, playerId);
  const stateChanges: Record<string, unknown> = {};

  if (verb === "look") {
    const visible = visibleItems(node, flags);
    const lines = [
      node.description,
      Object.keys(node.exits).length
        ? `Exits: ${Object.keys(node.exits).join(", ")}.`
        : "",
      visible.length ? `Here: ${visible.join(", ")}.` : "",
      node.npcs.length ? `Figures: ${node.npcs.join(", ")}.` : "",
    ].filter(Boolean);
    return json(request, env, {
      message: lines.join(" "),
      stateChanges,
    });
  }

  if (verb === "talk") {
    if (!target || !node.npcs.includes(target)) {
      return json(request, env, { error: "No one like that to talk to." }, 400);
    }
    const line = NPC_BLURBS[target] ?? "They listen more than they answer.";
    return json(request, env, { message: line, stateChanges });
  }

  if (verb === "inspect") {
    if (!target) {
      return json(request, env, { error: "Inspect what?" }, 400);
    }
    if (ITEM_DEFS[target] && visibleItems(node, flags).includes(target)) {
      return json(request, env, {
        message: ITEM_DEFS[target].description,
        stateChanges,
      });
    }
    if (node.npcs.includes(target)) {
      return json(request, env, {
        message: `You study ${target.replace(/_/g, " ")}. ${NPC_BLURBS[target] ?? "Little new reveals itself."}`,
        stateChanges,
      });
    }
    const inv = await loadInventory(db, playerId);
    if (inv.some((i) => i.item_id === target) && ITEM_DEFS[target]) {
      return json(request, env, {
        message: ITEM_DEFS[target].description,
        stateChanges,
      });
    }
    return json(request, env, { error: "You see nothing special there." }, 400);
  }

  if (verb === "take") {
    if (!target) {
      return json(request, env, { error: "Take what?" }, 400);
    }
    if (!visibleItems(node, flags).includes(target)) {
      return json(request, env, { error: "Nothing like that to take." }, 400);
    }
    await db
      .prepare(
        `INSERT INTO inventory (player_id, item_id, quantity) VALUES (?, ?, 1)
         ON CONFLICT(player_id, item_id) DO UPDATE SET quantity = quantity + 1`,
      )
      .bind(playerId, target)
      .run();
    await db
      .prepare(
        "INSERT INTO flags (player_id, flag_key, flag_value) VALUES (?, ?, 1) ON CONFLICT(player_id, flag_key) DO UPDATE SET flag_value = 1",
      )
      .bind(playerId, `taken_${target}`)
      .run();
    stateChanges.inventory = true;
    stateChanges.flags = { [`taken_${target}`]: 1 };
    return json(request, env, {
      message: `You take the ${ITEM_DEFS[target]?.label ?? target}.`,
      stateChanges,
    });
  }

  if (verb === "use") {
    if (!target) {
      return json(request, env, { error: "Use what?" }, 400);
    }
    const inv = await loadInventory(db, playerId);
    const row = inv.find((i) => i.item_id === target);
    if (!row || row.quantity < 1) {
      return json(request, env, { error: "You do not have that." }, 400);
    }
    const def = ITEM_DEFS[target];
    if (def?.heal) {
      const newHp = Math.min(p.max_hp, p.hp + def.heal);
      await db
        .prepare("UPDATE players SET hp = ? WHERE id = ?")
        .bind(newHp, playerId)
        .run();
      const left = row.quantity - 1;
      if (left <= 0) {
        await db
          .prepare("DELETE FROM inventory WHERE player_id = ? AND item_id = ?")
          .bind(playerId, target)
          .run();
      } else {
        await db
          .prepare(
            "UPDATE inventory SET quantity = ? WHERE player_id = ? AND item_id = ?",
          )
          .bind(left, playerId, target)
          .run();
      }
      stateChanges.hp = newHp;
      stateChanges.inventory = true;
      return json(request, env, {
        message: `You drink the draught. Warmth returns (${def.heal} hp).`,
        stateChanges,
      });
    }
    return json(request, env, { error: "You cannot use that here." }, 400);
  }

  return json(request, env, { error: "Unknown verb" }, 400);
}

async function handleCombat(request: Request, env: Env): Promise<Response> {
  const auth = await requirePlayer(request, env);
  if (!auth.ok) return auth.response;
  const body = await readJson<{
    action?: string;
    itemId?: string;
  }>(request);
  const action = body?.action?.toLowerCase();
  if (!action || !["attack", "use_item", "flee"].includes(action)) {
    return json(request, env, { error: "action attack|use_item|flee" }, 400);
  }

  const db = env.DB;
  const playerId = auth.playerId;

  const enc = await db
    .prepare(
      "SELECT id, enemy_id, enemy_hp, enemy_max_hp, enemy_attack, enemy_defense, turn_count, log_json, status FROM encounters WHERE player_id = ?",
    )
    .bind(playerId)
    .first<{
      id: number;
      enemy_id: string;
      enemy_hp: number;
      enemy_max_hp: number;
      enemy_attack: number;
      enemy_defense: number;
      turn_count: number;
      log_json: string;
      status: string;
    }>();

  if (!enc || enc.status !== "active") {
    return json(request, env, { error: "No active encounter." }, 400);
  }

  const p = await loadPlayer(db, playerId);
  if (!p) return json(request, env, { error: "Player not found" }, 404);

  let logs: string[] = [];
  try {
    logs = JSON.parse(enc.log_json || "[]") as string[];
  } catch {
    logs = [];
  }

  const roundLog: string[] = [];
  const push = (s: string) => {
    logs.push(s);
    roundLog.push(s);
  };

  let enemyHp = enc.enemy_hp;
  let playerHp = p.hp;
  let outcome: "ongoing" | "victory" | "fled" | "defeat" = "ongoing";

  if (action === "flee") {
    const { roll, ok } = fleeSuccess();
    push(`Flee: rolled d20 = ${roll} (need ≥12).`);
    if (ok) {
      await db
        .prepare("DELETE FROM encounters WHERE player_id = ?")
        .bind(playerId)
        .run();
      outcome = "fled";
      push("You slip away into the stink and dark.");
      await db
        .prepare("UPDATE players SET hp = ? WHERE id = ?")
        .bind(playerHp, playerId)
        .run();
      const state = await buildStatePayload(env, playerId);
      return json(request, env, {
        log: roundLog,
        outcome,
        playerHp,
        enemyHp,
        state,
      });
    }
    push("Your foot finds slick stone. No escape yet.");
  }

  if (action === "use_item") {
    const itemId = body?.itemId?.trim();
    if (itemId !== "healing_draught") {
      return json(request, env, { error: "Only healing_draught in combat for now." }, 400);
    }
    const inv = await loadInventory(db, playerId);
    const row = inv.find((i) => i.item_id === itemId);
    if (!row || row.quantity < 1) {
      return json(request, env, { error: "You do not have that." }, 400);
    }
    const heal = ITEM_DEFS.healing_draught.heal ?? 5;
    playerHp = Math.min(p.max_hp, playerHp + heal);
    const left = row.quantity - 1;
    if (left <= 0) {
      await db
        .prepare("DELETE FROM inventory WHERE player_id = ? AND item_id = ?")
        .bind(playerId, itemId)
        .run();
    } else {
      await db
        .prepare(
          "UPDATE inventory SET quantity = ? WHERE player_id = ? AND item_id = ?",
        )
        .bind(left, playerId, itemId)
        .run();
    }
    push(`You drink healing_draught: +${heal} hp (now ${playerHp}).`);
  }

  if (action === "attack" || action === "use_item" || action === "flee") {
    if (outcome === "fled") {
      /* already returned */
    } else if (enemyHp > 0 && outcome !== "defeat") {
      if (action === "attack") {
        const mod = playerAttackMod(p.level);
        const roll = rollDie(20);
        const ac = attackArmorClass(enc.enemy_defense);
        const total = roll + mod;
        push(`Attack: d20(${roll}) + ${mod} = ${total} vs AC ${ac}.`);
        if (total >= ac) {
          const dmg = computeDamage(p.level);
          enemyHp = Math.max(0, enemyHp - dmg);
          push(`Hit for ${dmg} damage. ${enc.enemy_id} hp: ${enemyHp}/${enc.enemy_max_hp}.`);
        } else {
          push("Miss.");
        }
      }

      if (enemyHp > 0 && outcome !== "fled") {
        const eroll = rollDie(20);
        const eatk = enc.enemy_attack;
        const pac = 10 + Math.floor(p.level / 2);
        const etotal = eroll + eatk;
        push(`Enemy attacks: d20(${eroll}) + ${eatk} = ${etotal} vs your AC ${pac}.`);
        if (etotal >= pac) {
          const edmg = rollDie(4) + 1;
          playerHp = Math.max(0, playerHp - edmg);
          push(`You take ${edmg} damage. Your hp: ${playerHp}/${p.max_hp}.`);
        } else {
          push("The enemy's blow goes wide.");
        }
      }

      if (enemyHp <= 0) {
        outcome = "victory";
        push(`${enc.enemy_id} falls. The tunnel exhales, as if relieved.`);
        await db
          .prepare(
            "INSERT INTO flags (player_id, flag_key, flag_value) VALUES (?, 'rat_defeated', 1) ON CONFLICT(player_id, flag_key) DO UPDATE SET flag_value = 1",
          )
          .bind(playerId)
          .run();
        await db
          .prepare("DELETE FROM encounters WHERE player_id = ?")
          .bind(playerId)
          .run();
        const xpGain = 15;
        await db
          .prepare("UPDATE players SET xp = xp + ?, hp = ?, current_node = ? WHERE id = ?")
          .bind(xpGain, playerHp, p.current_node, playerId)
          .run();
        push(`You gain ${xpGain} xp.`);
      } else if (playerHp <= 0) {
        outcome = "defeat";
        playerHp = 0;
        push("Dark takes the edges of your sight.");
        await db
          .prepare("DELETE FROM encounters WHERE player_id = ?")
          .bind(playerId)
          .run();
        await db
          .prepare(
            "UPDATE players SET hp = max_hp, current_node = ? WHERE id = ?",
          )
          .bind(START_NODE, playerId)
          .run();
        playerHp = p.max_hp;
        push("You wake at the crossroads, bruised but breathing.");
      } else {
        await db
          .prepare(
            "UPDATE encounters SET enemy_hp = ?, turn_count = turn_count + 1, log_json = ? WHERE id = ?",
          )
          .bind(enemyHp, JSON.stringify(logs), enc.id)
          .run();
      }
    }
  }

  await db
    .prepare("UPDATE players SET hp = ? WHERE id = ?")
    .bind(playerHp, playerId)
    .run();

  const state = await buildStatePayload(env, playerId);
  return json(request, env, {
    log: roundLog,
    outcome,
    playerHp,
    enemyHp,
    state,
  });
}

export default {
  async fetch(
    request: Request,
    env: Env,
    _ctx: ExecutionContext,
  ): Promise<Response> {
    const url = new URL(request.url);
    if (!url.pathname.startsWith("/api/")) {
      return new Response("Not found", { status: 404 });
    }

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders(request, env) });
    }

    try {
      const path = url.pathname;
      if (path === "/api/start" && request.method === "POST") {
        return handleStart(request, env);
      }
      if (path === "/api/state" && request.method === "GET") {
        return handleState(request, env);
      }
      if (path === "/api/move" && request.method === "POST") {
        return handleMove(request, env);
      }
      if (path === "/api/interact" && request.method === "POST") {
        return handleInteract(request, env);
      }
      if (path === "/api/combat" && request.method === "POST") {
        return handleCombat(request, env);
      }
      return json(request, env, { error: "Not found" }, 404);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "error";
      return json(request, env, { error: msg }, 500);
    }
  },
};
