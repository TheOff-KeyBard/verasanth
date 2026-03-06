/**
 * Quest assignment, progress, and completion logic.
 * Phase 3 from sewer_complete.md.
 */

import {
  OTHORION_QUESTS,
  THALARA_QUESTS,
  CAELIR_QUESTS,
  SERIS_QUESTS,
  GROMMASH_BOUNTIES,
  getNextAssignableQuest,
  hasDialogueUnlock,
  QUEST_REWARD_ITEMS,
} from "../data/quests.js";

const NPC_TO_QUESTS = {
  othorion: OTHORION_QUESTS,
  alchemist: THALARA_QUESTS,
  weaponsmith: CAELIR_QUESTS,
  curator: SERIS_QUESTS,
  warden: GROMMASH_BOUNTIES,
};

const QUEST_TOPICS = {
  weaponsmith: ["work"],
  alchemist: ["work"],
  curator: ["work", "shop", "items"],
  othorion: ["work", "research"],
  warden: ["work", "bounty"],
};

/**
 * Handle quest turn-in or assignment when player talks to NPC with work topic.
 * Returns { response } if handled, null to fall through to AI.
 */
export async function handleQuestDialogue(db, dbGet, dbAll, dbRun, uid, npc, topic, ctx, getFlag, setFlag) {
  if (!QUEST_TOPICS[npc]?.includes(topic)) return null;

  const questList = NPC_TO_QUESTS[npc];
  if (!questList) return null;

  // Build quest context (load visited flags for first_sewer_visit)
  const visitedDrain = await getFlag(db, uid, "visited_drain_entrance");
  const visitedOverflow = await getFlag(db, uid, "visited_overflow_channel");
  const visitedVermin = await getFlag(db, uid, "visited_vermin_nest");
  const visitedFungal = await getFlag(db, uid, "visited_fungal_bloom_chamber");
  const questCtx = {
    ...ctx,
    visited_drain_entrance: !!visitedDrain,
    visited_overflow_channel: !!visitedOverflow,
    visited_vermin_nest: !!visitedVermin,
    visited_fungal_bloom_chamber: !!visitedFungal,
    first_sewer_visit: !!(visitedDrain || visitedOverflow || visitedVermin || visitedFungal),
    nest_cleared_floor1: !!(await getFlag(db, uid, "nest_cleared_floor1")),
    boss_floor3: !!(await getFlag(db, uid, "boss_floor3")),
    othorion_q1_complete: !!(await getFlag(db, uid, "othorion_q1_complete")),
    othorion_q2_complete: !!(await getFlag(db, uid, "othorion_q2_complete")),
    thalara_q1_complete: !!(await getFlag(db, uid, "thalara_q1_complete")),
    thalara_arc_seed: !!(await getFlag(db, uid, "thalara_arc_seed")),
    caelir_q1_complete: !!(await getFlag(db, uid, "caelir_q1_complete")),
    caelir_q2_complete: !!(await getFlag(db, uid, "caelir_q2_complete")),
    seris_arc_interest: !!(await getFlag(db, uid, "seris_arc_interest")),
    grommash_b1_complete: !!(await getFlag(db, uid, "grommash_b1_complete")),
  };

  const activeRows = await dbAll(db, "SELECT quest_id, progress FROM quests WHERE user_id=? AND status='active'", [uid]);
  const activeQuestIds = activeRows.map((r) => r.quest_id);
  const completedRows = await dbAll(db, "SELECT quest_id FROM quests WHERE user_id=? AND status='complete'", [uid]);
  questCtx.completedQuestIds = completedRows.map((r) => r.quest_id);

  // 1. Check turn-in: any active quest for this NPC with objective met?
  for (const q of questList) {
    if (!activeQuestIds.includes(q.id)) continue;
    const row = activeRows.find((r) => r.quest_id === q.id);
    const met = await isObjectiveMet(db, dbGet, dbAll, uid, q, row?.progress, getFlag);
    if (met) {
      await completeQuest(db, dbGet, dbRun, dbAll, uid, q, getFlag, setFlag);
      const rewardLine = q.reward.ash_marks ? ` **+${q.reward.ash_marks} Ash Marks**` : "";
      const itemLine = q.reward.item ? ` **${QUEST_REWARD_ITEMS[q.reward.item]?.display_name || q.reward.item}**` : "";
      return {
        response: `*${q.completion_dialogue}*\n\n${rewardLine}${itemLine}`.trim() || q.completion_dialogue,
      };
    }
  }

  // 2. Check assignment: can we assign next quest?
  const nextQuest = getNextAssignableQuest(npc, questCtx, activeQuestIds);
  if (nextQuest) {
    const now = Math.floor(Date.now() / 1000);
    const progress = nextQuest.objective.type === "enemy_kills" ? JSON.stringify({ kills: { [nextQuest.objective.enemy_id]: 0 } }) : null;
    await dbRun(db, `INSERT OR IGNORE INTO quests (user_id, quest_id, type, status, progress, assigned_at)
      VALUES (?, ?, 'static', 'active', ?, ?)`,
      [uid, nextQuest.id, progress, now]);
    const obj = nextQuest.objective;
    let desc = "";
    if (obj.type === "item") desc = `Bring ${obj.qty} ${obj.item.replace(/_/g, " ")}.`;
    else if (obj.type === "flag") desc = `Clear the vermin nest on Floor 1.`;
    else if (obj.type === "enemy_kills") desc = `Slay ${obj.count} ${obj.enemy_id.replace(/_/g, " ")}.`;
    return {
      response: `*"${nextQuest.title}."* ${desc} Reward: ${nextQuest.reward.ash_marks || 0} Ash Marks${nextQuest.reward.item ? `, ${QUEST_REWARD_ITEMS[nextQuest.reward.item]?.display_name || nextQuest.reward.item}` : ""}.`,
    };
  }

  return null;
}

async function isObjectiveMet(db, dbGet, dbAll, uid, quest, progressJson, getFlag) {
  const obj = quest.objective;
  if (obj.type === "item") {
    const invRows = await dbAll(db, "SELECT item, qty FROM inventory WHERE user_id=?", [uid]);
    let count = 0;
    const target = obj.item.toLowerCase().replace(/\s/g, "_");
    for (const r of invRows) {
      const key = (r.item || "").toLowerCase().replace(/\s/g, "_");
      if (key === target) count += r.qty || 1;
    }
    return count >= obj.qty;
  }
  if (obj.type === "flag") {
    return !!(await getFlag(db, uid, obj.flag));
  }
  if (obj.type === "enemy_kills") {
    const progress = progressJson ? JSON.parse(progressJson) : { kills: {} };
    const count = progress.kills?.[obj.enemy_id] ?? 0;
    return count >= obj.count;
  }
  return false;
}

async function completeQuest(db, dbGet, dbRun, dbAll, uid, quest, getFlag, setFlag) {
  const now = Math.floor(Date.now() / 1000);

  // Remove items if item objective
  const obj = quest.objective;
  if (obj.type === "item") {
    const invRows = await dbAll(db, "SELECT item, qty FROM inventory WHERE user_id=?", [uid]);
    const target = obj.item.toLowerCase().replace(/\s/g, "_");
    let toRemove = obj.qty;
    for (const r of invRows) {
      if (toRemove <= 0) break;
      const key = (r.item || "").toLowerCase().replace(/\s/g, "_");
      if (key === target) {
        const take = Math.min(toRemove, r.qty || 1);
        toRemove -= take;
        if ((r.qty || 1) <= take) {
          await dbRun(db, "DELETE FROM inventory WHERE user_id=? AND item=?", [uid, r.item]);
        } else {
          await dbRun(db, "UPDATE inventory SET qty=qty-? WHERE user_id=? AND item=?", [take, uid, r.item]);
        }
      }
    }
  }

  // Mark quest complete
  await dbRun(db, "UPDATE quests SET status='complete', completed_at=? WHERE user_id=? AND quest_id=?", [now, uid, quest.id]);

  // Set completion flag
  if (quest.completion_flag) await dbRun(db, "INSERT OR REPLACE INTO player_flags (user_id, flag, value) VALUES (?, ?, 1)", [uid, quest.completion_flag]);

  // Give rewards
  if (quest.reward.ash_marks) {
    await dbRun(db, "UPDATE characters SET ash_marks=ash_marks+? WHERE user_id=?", [quest.reward.ash_marks, uid]);
  }
  if (quest.reward.order_score) {
    await dbRun(db, "UPDATE players SET order_score=order_score+? WHERE user_id=?", [quest.reward.order_score, uid]);
  }
  if (quest.reward.item) {
    const entry = QUEST_REWARD_ITEMS[quest.reward.item];
    if (entry) {
      const specProp = null;
      const existing = await dbGet(db, "SELECT item, qty FROM inventory WHERE user_id=? AND item=?", [uid, quest.reward.item]);
      if (existing) {
        await dbRun(db, "UPDATE inventory SET qty=qty+1 WHERE user_id=? AND item=?", [uid, quest.reward.item]);
      } else {
        await dbRun(db, `INSERT INTO inventory (user_id, item, qty, tier, corrupted, curse, curse_identified, special_property, display_name)
          VALUES (?, ?, 1, ?, 0, NULL, 0, ?, ?)`,
          [uid, quest.reward.item, entry.tier || 1, specProp, entry.display_name]);
      }
    }
  }
  if (quest.reward.trust) {
    const trustFlag = quest.npc === "othorion" ? "othorion_trust" : null;
    if (trustFlag) {
      const current = await getFlag(db, uid, trustFlag, 0);
      await dbRun(db, "INSERT OR REPLACE INTO player_flags (user_id, flag, value) VALUES (?, ?, ?)", [uid, trustFlag, (current || 0) + quest.reward.trust]);
    }
  }
}

/**
 * Update enemy kill progress for bounty quests.
 */
export async function recordEnemyKill(db, dbAll, dbRun, uid, enemyId) {
  const rows = await dbAll(db, "SELECT id, quest_id, progress FROM quests WHERE user_id=? AND status='active'", [uid]);
  for (const row of rows) {
    const questList = Object.values(NPC_TO_QUESTS).flat();
    const quest = questList.find((q) => q.id === row.quest_id);
    if (!quest || quest.objective?.type !== "enemy_kills" || quest.objective.enemy_id !== enemyId) continue;
    const progress = row.progress ? JSON.parse(row.progress) : { kills: {} };
    progress.kills = progress.kills || {};
    progress.kills[enemyId] = (progress.kills[enemyId] || 0) + 1;
    await dbRun(db, "UPDATE quests SET progress=? WHERE id=?", [JSON.stringify(progress), row.id]);
    break;
  }
}
