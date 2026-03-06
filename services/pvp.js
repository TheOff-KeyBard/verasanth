/**
 * PvPvE system — relationships, party, betrayal cascade.
 * Design: pvpve_system.md
 */

/** Normalize player pair: always player_a < player_b */
function normPair(uidA, uidB) {
  const a = Number(uidA);
  const b = Number(uidB);
  return a < b ? [a, b] : [b, a];
}

/**
 * @param {object} db — D1 database
 * @param {Function} dbGet — (db, sql, params) => row
 * @param {number} uidA
 * @param {number} uidB
 * @returns {Promise<{state:string,trust_level:string,trust_points:number}|null>}
 */
export async function getRelationship(db, dbGet, uidA, uidB) {
  if (uidA === uidB) return null;
  const [a, b] = normPair(uidA, uidB);
  const row = await dbGet(db, "SELECT state, trust_level, trust_points FROM player_relationships WHERE player_a=? AND player_b=?", [a, b]);
  if (!row) return { state: "neutral", trust_level: "stranger", trust_points: 0 };
  return {
    state: row.state || "neutral",
    trust_level: row.trust_level || "stranger",
    trust_points: row.trust_points || 0,
  };
}

/**
 * @param {object} db — D1 database
 * @param {Function} dbRun — (db, sql, params) => void
 * @param {number} uidA
 * @param {number} uidB
 * @param {string} state — neutral|party|contract|hostile
 * @param {number} [trustPoints]
 */
export async function setRelationship(db, dbRun, uidA, uidB, state, trustPoints = 0) {
  if (uidA === uidB) return;
  const [a, b] = normPair(uidA, uidB);
  const now = Math.floor(Date.now() / 1000);
  const trustLevel = trustPoints >= 15 ? "bloodbound" : trustPoints >= 10 ? "trusted" : trustPoints >= 5 ? "known" : "stranger";
  await dbRun(db, `INSERT INTO player_relationships (player_a, player_b, state, trust_level, trust_points, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(player_a, player_b) DO UPDATE SET
       state=excluded.state,
       trust_level=excluded.trust_level,
       trust_points=excluded.trust_points,
       updated_at=excluded.updated_at`, [a, b, state, trustLevel, trustPoints, now, now]);
}

/**
 * Get all party members for a player (state=party).
 * @param {object} db
 * @param {Function} dbAll
 * @param {number} uid
 * @returns {Promise<number[]>}
 */
export async function getPartyMembers(db, dbAll, uid) {
  const rows = await dbAll(db, `SELECT player_a, player_b FROM player_relationships
     WHERE state='party' AND (player_a=? OR player_b=?)`, [uid, uid]);
  const members = new Set();
  for (const r of rows) {
    members.add(r.player_a);
    members.add(r.player_b);
  }
  members.delete(Number(uid));
  return [...members];
}

/**
 * Betrayal cascade: cruelty -80, chaos -60, trust reset, crime heat, Oathbreaker title.
 * @param {Function} setFlagFn — async (uid, flag, value) => void
 */
export async function triggerBetrayalCascade(db, dbGet, dbRun, betrayerUid, victimUid, setFlagFn) {
  const row = await dbGet(db, "SELECT alignment_morality, alignment_order FROM characters WHERE user_id=?", [betrayerUid]);
  if (row) {
    const newM = Math.max(-100, (row.alignment_morality || 0) - 80);
    const newO = Math.max(-100, (row.alignment_order || 0) - 60);
    await dbRun(db, "UPDATE characters SET alignment_morality=?, alignment_order=? WHERE user_id=?", [newM, newO, betrayerUid]);
  }
  const [a, b] = normPair(betrayerUid, victimUid);
  const now = Math.floor(Date.now() / 1000);
  await dbRun(db, `UPDATE player_relationships SET state='hostile', trust_points=0, trust_level='stranger', updated_at=? WHERE player_a=? AND player_b=?`, [now, a, b]);
  await setFlagFn(betrayerUid, "crime_heat", 50);
  await setFlagFn(betrayerUid, "title_oathbreaker", 1);
}
