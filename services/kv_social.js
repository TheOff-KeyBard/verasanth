/**
 * KV-backed social layer (echoes, activity, presence, global chat history, tavern board).
 * All writes use expirationTtl. Failures are swallowed where noted.
 */

const CHAT_HISTORY_KEY = "chat:global:history";
const BOARD_POSTS_KEY = "board:posts";
const GLOBAL_PRESENCE_KEY = "presence:global:count";

const TEN_MIN_MS = 10 * 60 * 1000;
const GLOBAL_PRESENCE_TTL = 30 * 60; // seconds

export async function kvGetJson(ns, key) {
  if (!ns) return null;
  try {
    const raw = await ns.get(key);
    if (raw == null || raw === "") return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function kvPutJson(ns, key, value, expirationTtl) {
  if (!ns) return;
  try {
    await ns.put(key, JSON.stringify(value), { expirationTtl });
  } catch (e) {
    console.error("kvPutJson", key, e?.message || e);
  }
}

function displayRaceInstinct(val) {
  if (val == null) return "unknown";
  const s = String(val).trim();
  return s ? s.replace(/_/g, " ") : "unknown";
}

function normPlayerName(n) {
  return (n != null && String(n).trim()) ? String(n).trim().toLowerCase() : "";
}

export async function recordMoveSocialKv(env, row, locationId) {
  const echoes = env.ECHOES;
  if (!echoes || !locationId) return;
  const now = Date.now();
  const name =
    row?.name != null && String(row.name).trim()
      ? String(row.name).trim()
      : "A traveller";
  const race = displayRaceInstinct(row?.race);
  const instinct = displayRaceInstinct(row?.instinct);

  await kvPutJson(
    echoes,
    `room:${locationId}:echo`,
    {
      name,
      race,
      instinct,
      message: null,
      timestamp: now,
    },
    86400,
  );

  await kvPutJson(
    echoes,
    `room:${locationId}:activity`,
    { timestamp: now },
    3600,
  );

  const pKey = `presence:${locationId}`;
  const prev = await kvGetJson(echoes, pKey);
  let count = 1;
  if (
    prev &&
    typeof prev.timestamp === "number" &&
    now - prev.timestamp < TEN_MIN_MS
  ) {
    count = Math.max(1, (prev.count || 0) + 1);
  }
  await kvPutJson(echoes, pKey, { count, timestamp: now }, 600);
}

export function buildRoomSocialAppendBlocks(echoRaw, activityRaw, presenceRaw, viewerName) {
  const blocks = [];
  const now = Date.now();
  const viewerNorm = normPlayerName(viewerName);

  if (echoRaw && typeof echoRaw === "object") {
    const en = echoRaw.name != null && String(echoRaw.name).trim()
      ? String(echoRaw.name).trim()
      : "A traveller";
    const echoNorm = normPlayerName(en);
    const echoAge = typeof echoRaw.timestamp === "number" ? now - echoRaw.timestamp : Infinity;
    const skipEcho =
      (viewerNorm &&
        echoNorm &&
        viewerNorm === echoNorm &&
        en !== "A traveller") ||
      (!viewerNorm && echoNorm === "a traveller" && echoAge < 12000);
    if (!skipEcho) {
      const er = displayRaceInstinct(echoRaw.race);
      const ei = displayRaceInstinct(echoRaw.instinct);
      let t =
        "A faint echo lingers here.\n" +
        `— ${en} (${er}, ${ei})\n` +
        "passed through recently.";
      if (echoRaw.message != null && String(echoRaw.message).trim()) {
        t += "\n" + String(echoRaw.message).trim();
      }
      blocks.push(t);
    }
  }

  if (activityRaw && typeof activityRaw.timestamp === "number") {
    const age = now - activityRaw.timestamp;
    const m5 = 5 * 60 * 1000;
    const m30 = 30 * 60 * 1000;
    const m60 = 60 * 60 * 1000;
    if (age < m5) {
      blocks.push("The air here feels recently disturbed.");
    } else if (age < m30) {
      blocks.push("Something passed through here not long ago.");
    } else if (age < m60) {
      blocks.push("The ground is still unsettled.");
    }
  }

  if (
    presenceRaw &&
    typeof presenceRaw.timestamp === "number" &&
    now - presenceRaw.timestamp < TEN_MIN_MS
  ) {
    const c = presenceRaw.count || 0;
    if (c === 1) blocks.push("A presence lingers here.");
    else if (c >= 2 && c <= 3) blocks.push("Voices were heard here recently.");
    else if (c > 3) blocks.push("This place has seen activity lately.");
  }

  return blocks;
}

export async function appendRoomSocialToDescription(env, locationId, description, viewerName) {
  const echoes = env.ECHOES;
  if (!echoes || !locationId) return description;
  const echoRaw = await kvGetJson(echoes, `room:${locationId}:echo`);
  const activityRaw = await kvGetJson(echoes, `room:${locationId}:activity`);
  const presenceRaw = await kvGetJson(echoes, `presence:${locationId}`);
  const parts = buildRoomSocialAppendBlocks(echoRaw, activityRaw, presenceRaw, viewerName);
  if (!parts.length) return description;
  return description + "\n\n" + parts.join("\n\n");
}

export async function appendGlobalChatHistory(env, entry) {
  const g = env.GLOBAL;
  if (!g) return;
  const prev = (await kvGetJson(g, CHAT_HISTORY_KEY)) || [];
  const list = Array.isArray(prev) ? prev : [];
  list.push(entry);
  const trimmed = list.slice(-30);
  await kvPutJson(g, CHAT_HISTORY_KEY, trimmed, 604800);
}

export async function getGlobalChatHistoryTail(env, n) {
  const g = env.GLOBAL;
  if (!g) return [];
  const prev = (await kvGetJson(g, CHAT_HISTORY_KEY)) || [];
  const list = Array.isArray(prev) ? prev : [];
  return list.slice(-n);
}

export async function adjustGlobalWandererCount(env, delta) {
  const g = env.GLOBAL;
  if (!g) return;
  const prev = await kvGetJson(g, GLOBAL_PRESENCE_KEY);
  let n = prev && typeof prev.n === "number" ? prev.n : 0;
  n = Math.max(0, n + delta);
  await kvPutJson(g, GLOBAL_PRESENCE_KEY, { n, updated: Date.now() }, GLOBAL_PRESENCE_TTL);
}

export async function getGlobalWandererCount(env) {
  const g = env.GLOBAL;
  if (!g) return 0;
  const prev = await kvGetJson(g, GLOBAL_PRESENCE_KEY);
  if (prev && typeof prev.n === "number") return prev.n;
  return 0;
}

export async function getBoardPosts(env) {
  const b = env.BOARD;
  if (!b) return [];
  const prev = (await kvGetJson(b, BOARD_POSTS_KEY)) || [];
  return Array.isArray(prev) ? prev : [];
}

export async function saveBoardPosts(env, posts) {
  const b = env.BOARD;
  if (!b) return;
  await kvPutJson(b, BOARD_POSTS_KEY, posts, 604800);
}

const HOUR_MS = 60 * 60 * 1000;

export async function boardPostAllowed(env, uid) {
  const b = env.BOARD;
  if (!b) return false;
  const key = `board:rate:${uid}`;
  const now = Date.now();
  const row = await kvGetJson(b, key);
  if (!row || typeof row.windowStart !== "number" || now - row.windowStart >= HOUR_MS) {
    return true;
  }
  return (row.count || 0) < 3;
}

export async function recordBoardPostRate(env, uid) {
  const b = env.BOARD;
  if (!b) return;
  const key = `board:rate:${uid}`;
  const now = Date.now();
  let row = await kvGetJson(b, key);
  if (!row || typeof row.windowStart !== "number" || now - row.windowStart >= HOUR_MS) {
    row = { count: 1, windowStart: now };
  } else {
    row = { count: (row.count || 0) + 1, windowStart: row.windowStart };
  }
  await kvPutJson(b, key, row, 3600);
}

export { CHAT_HISTORY_KEY, BOARD_POSTS_KEY, GLOBAL_PRESENCE_KEY };
