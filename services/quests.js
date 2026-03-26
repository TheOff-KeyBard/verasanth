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
  QUEST_REWARD_ITEMS,
  QUEST_BY_ID,
} from "../data/quests.js";

const NPC_TO_QUESTS = {
  othorion: OTHORION_QUESTS,
  herbalist: THALARA_QUESTS,
  weaponsmith: CAELIR_QUESTS,
  curator: SERIS_QUESTS,
  warden: GROMMASH_BOUNTIES,
};

const QUEST_TOPICS = {
  weaponsmith: ["work"],
  herbalist: ["work"],
  curator: ["work", "shop", "items"],
  othorion: ["work", "research"],
  warden: ["work", "bounty"],
};

/**
 * Quest unlock context read only from D1 (player_flags + quest completions).
 * Do not merge request/playerContext here — stale or inferred fields could satisfy hasDialogueUnlock incorrectly.
 */
async function loadQuestAssignContext(db, uid, getFlag, dbAll) {
  const t = async (flag) => {
    const v = await getFlag(db, uid, flag);
    return !!v && Number(v) > 0;
  };
  const n = async (flag) => Number(await getFlag(db, uid, flag, 0)) || 0;

  const visited_drain_entrance = await t("visited_drain_entrance");
  const visited_overflow_channel = await t("visited_overflow_channel");
  const visited_vermin_nest = await t("visited_vermin_nest");
  const visited_fungal_bloom_chamber = await t("visited_fungal_bloom_chamber");
  const first_sewer_flag = await t("first_sewer_visit");

  const ctx = {
    visited_drain_entrance,
    visited_overflow_channel,
    visited_vermin_nest,
    visited_fungal_bloom_chamber,
    first_sewer_visit:
      first_sewer_flag ||
      visited_drain_entrance ||
      visited_overflow_channel ||
      visited_vermin_nest ||
      visited_fungal_bloom_chamber,
    nest_cleared_floor1: await t("nest_cleared_floor1"),
    boss_floor3: await t("boss_floor3"),
    thalara_visits: await n("thalara_visits"),
    caelir_visits: await n("caelir_visits"),
    othorion_q1_complete: await t("othorion_q1_complete"),
    othorion_q2_complete: await t("othorion_q2_complete"),
    thalara_q1_complete: await t("thalara_q1_complete"),
    thalara_arc_seed: await t("thalara_arc_seed"),
    caelir_q1_complete: await t("caelir_q1_complete"),
    caelir_q2_complete: await t("caelir_q2_complete"),
    seris_arc_interest: await t("seris_arc_interest"),
    grommash_b1_complete: await t("grommash_b1_complete"),
  };

  const completedRows = await dbAll(db, "SELECT quest_id FROM quests WHERE user_id=? AND status='complete'", [uid]);
  ctx.completedQuestIds = completedRows.map((r) => r.quest_id);
  return ctx;
}

function computeArchetype(mercy, order, heat) {
  if (heat >= 16) return "Ash Wraith";
  if (heat >= 11) return "Dread";
  if (heat >= 7) return "Butcher";
  if (heat >= 4) return "Killer";
  if (heat >= 1) return "Ruffian";
  const mHi = mercy >= 60, mLo = mercy <= -60;
  const oHi = order >= 60, oLo = order <= -60;
  if (mHi && oHi) return "Protector";
  if (mHi && oLo) return "Vigilante";
  if (mHi) return "Wanderer";
  if (mLo && oHi) return "Mercenary";
  if (mLo && oLo) return "Butcher";
  if (mLo) return "Predator";
  if (oHi) return "Enforcer";
  if (oLo) return "Cutpurse";
  return "Survivor";
}

/**
 * Handle quest turn-in or assignment when player talks to NPC with work topic.
 * Unlock checks use loadQuestAssignContext (live D1 only — no merged playerContext).
 * Returns { response } if handled, null to fall through to AI.
 */
export async function handleQuestDialogue(db, dbGet, dbAll, dbRun, uid, npc, topic, _playerContext, getFlag, setFlag) {
  if (!QUEST_TOPICS[npc]?.includes(topic)) return null;

  const questList = NPC_TO_QUESTS[npc];
  if (!questList) return null;

  const questCtx = await loadQuestAssignContext(db, uid, getFlag, dbAll);

  const activeRows = await dbAll(db, "SELECT quest_id, progress FROM quests WHERE user_id=? AND status='active'", [uid]);
  const activeQuestIds = activeRows.map((r) => r.quest_id);

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

  const nextQuest = getNextAssignableQuest(npc, questCtx, activeQuestIds);
  if (nextQuest) {
    const now = Math.floor(Date.now() / 1000);
    let progress = null;
    if (nextQuest.objective.type === "enemy_kills") {
      progress = JSON.stringify({ kills: { [nextQuest.objective.enemy_id]: 0 } });
    } else if (nextQuest.objective.type === "item") {
      progress = JSON.stringify({ item_collected: {} });
    }
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

/**
 * After Phase A NPC dialogue, assign the next quest if dialogue_unlock is satisfied (live D1 flags only).
 */
export async function assignNextQuestIfAvailable(db, dbGet, dbAll, dbRun, uid, npcId, getFlag) {
  if (!QUEST_TOPICS[npcId]) return;
  const questList = NPC_TO_QUESTS[npcId];
  if (!questList) return;

  const questCtx = await loadQuestAssignContext(db, uid, getFlag, dbAll);
  const activeRows = await dbAll(db, "SELECT quest_id FROM quests WHERE user_id=? AND status='active'", [uid]);
  const activeQuestIds = activeRows.map((r) => r.quest_id);

  const nextQuest = getNextAssignableQuest(npcId, questCtx, activeQuestIds);
  if (!nextQuest) return;

  const now = Math.floor(Date.now() / 1000);
  let progress = null;
  if (nextQuest.objective.type === "enemy_kills") {
    progress = JSON.stringify({ kills: { [nextQuest.objective.enemy_id]: 0 } });
  } else if (nextQuest.objective.type === "item") {
    progress = JSON.stringify({ item_collected: {} });
  }
  await dbRun(db, `INSERT OR IGNORE INTO quests (user_id, quest_id, type, status, progress, assigned_at)
    VALUES (?, ?, 'static', 'active', ?, ?)`,
    [uid, nextQuest.id, progress, now]);
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
    const row = await dbGet(db, "SELECT alignment_morality, alignment_order, crime_heat FROM characters WHERE user_id=?", [uid]);
    if (row) {
      const newOrder = Math.max(-200, Math.min(200, (row.alignment_order || 0) + quest.reward.order_score));
      const archetype = computeArchetype(row.alignment_morality || 0, newOrder, row.crime_heat || 0);
      await dbRun(db, "UPDATE characters SET alignment_order=?, archetype=? WHERE user_id=?", [newOrder, archetype, uid]);
    }
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
 * Update item collect progress for fetch quests. Call when player picks up items (e.g. combat loot).
 * Auto-completes quest when objective is met.
 */
export async function checkQuestProgressForItem(db, dbGet, dbAll, dbRun, uid, itemId, qty, getFlag, setFlag) {
  const rows = await dbAll(db, "SELECT id, quest_id, progress FROM quests WHERE user_id=? AND status='active'", [uid]);
  const target = String(itemId).toLowerCase().replace(/\s/g, "_");

  for (const row of rows) {
    const quest = QUEST_BY_ID[row.quest_id];
    if (!quest || quest.objective?.type !== "item") continue;
    const objItem = (quest.objective.item || "").toLowerCase().replace(/\s/g, "_");
    if (objItem !== target) continue;

    const progress = row.progress ? JSON.parse(row.progress) : { item_collected: {} };
    progress.item_collected = progress.item_collected || {};
    const prev = progress.item_collected[target] ?? 0;
    const newCount = prev + qty;
    progress.item_collected[target] = newCount;

    await dbRun(db, "UPDATE quests SET progress=? WHERE id=?", [JSON.stringify(progress), row.id]);

    if (newCount >= (quest.objective.qty || 1)) {
      await completeQuest(db, dbGet, dbRun, dbAll, uid, quest, getFlag, setFlag);
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
