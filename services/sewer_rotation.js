/**
 * Sewer condition rotation — runs every 45 min via Cloudflare Cron.
 * Phase 4 from sewer_complete.md.
 */

import { SEWER_CONDITIONS } from "../data/sewer_conditions.js";

const WEIGHTS = [3, 2, 2, 1, 3, 2];

function weightedRandom(pool, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < pool.length; i++) {
    r -= weights[i] ?? 0;
    if (r <= 0) return pool[i];
  }
  return pool[pool.length - 1];
}

/**
 * Rotate to a new active sewer condition.
 * Deactivates current, selects weighted random, inserts new row.
 */
export async function rotateSewerCondition(db, dbGet, dbRun) {
  const current = await dbGet(db, "SELECT id FROM sewer_conditions WHERE active=1 LIMIT 1");
  if (current) {
    await dbRun(db, "UPDATE sewer_conditions SET active=0 WHERE id=?", [current.id]);
  }
  const selected = weightedRandom(SEWER_CONDITIONS, WEIGHTS);
  const now = Date.now();
  const endsAt = now + 45 * 60 * 1000;
  await dbRun(db, `INSERT INTO sewer_conditions (condition_id, active, started_at, ends_at, data)
    VALUES (?, 1, ?, ?, ?)`,
    [selected.id, now, endsAt, JSON.stringify(selected)]);
}
