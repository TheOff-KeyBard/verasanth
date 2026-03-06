/**
 * Static fetch quests — Phase 3 from sewer_complete.md.
 * dialogue_unlock: flag that must be set for quest to be offered.
 * objective: { item, qty } | { item, qty, location } | { flag } | { enemy_kills }
 * reward: { ash_marks, item?, trust? }
 */

export const OTHORION_QUESTS = [
  {
    id: "othorion_q1",
    npc: "othorion",
    title: "Reagent Run — Fungi",
    dialogue_unlock: "first_sewer_visit",
    objective: { type: "item", item: "sewer_fungi", qty: 3 },
    reward: { ash_marks: 80, item: "spore_extract", trust: 1 },
    completion_flag: "othorion_q1_complete",
    completion_dialogue: "These are the right strain. Pip already knew you'd bring them.",
  },
  {
    id: "othorion_q2",
    npc: "othorion",
    title: "Reagent Run — Deep Ash",
    dialogue_unlock: "othorion_q1_complete",
    objective: { type: "item", item: "deep_vent_ash", qty: 2 },
    reward: { ash_marks: 200, item: "listening_ash_elixir", trust: 2 },
    completion_flag: "othorion_q2_complete",
    completion_dialogue: "The ash from the vents is different from the surface ash. You noticed that, yes? Good.",
  },
  {
    id: "othorion_q3",
    npc: "othorion",
    title: "The Rat King",
    dialogue_unlock: "othorion_q2_complete",
    objective: { type: "item", item: "rat_king_musk", qty: 1 },
    reward: { ash_marks: 150, item: "pale_sight_elixir", trust: 2 },
    completion_flag: "othorion_q3_complete",
    completion_dialogue: "The musk has a resonance signature I did not expect. I'll need time with this.",
  },
];

export const THALARA_QUESTS = [
  {
    id: "thalara_q1",
    npc: "herbalist",
    title: "Common Reagents",
    dialogue_unlock: "first_meeting_thalara",
    objective: { type: "item", item: "slime_residue", qty: 3 },
    reward: { ash_marks: 60, item: "channel_salt" },
    completion_flag: "thalara_q1_complete",
    completion_dialogue: "These will do.",
  },
  {
    id: "thalara_q2",
    npc: "herbalist",
    title: "The Flood Records",
    dialogue_unlock: "thalara_q1_complete",
    objective: { type: "item", item: "flood_record_page", qty: 1 },
    reward: { ash_marks: 120, item: "deep_antidote" },
    completion_flag: "thalara_arc_seed",
    completion_dialogue: "This name. This date. That's not — how old is this record?",
  },
  {
    id: "thalara_q3",
    npc: "herbalist",
    title: "Someone's Kit",
    dialogue_unlock: "thalara_arc_seed",
    objective: { type: "item", item: "personal_effects_bundle", qty: 1 },
    reward: { ash_marks: 200, item: "ashbound_elixir" },
    completion_flag: "thalara_arc_2_active",
    completion_dialogue: "*She holds it for a long time.* This belonged to someone I was looking for.",
  },
];

export const CAELIR_QUESTS = [
  {
    id: "caelir_q1",
    npc: "weaponsmith",
    title: "Lost Tool",
    dialogue_unlock: "first_meeting_caelir",
    objective: { type: "item", item: "worn_tool", qty: 1 },
    reward: { ash_marks: 75, item: "worn_blade_upgraded" },
    completion_flag: "caelir_q1_complete",
    completion_dialogue: "*He examines it without expression.* Third generation design. Interesting.",
  },
  {
    id: "caelir_q2",
    npc: "weaponsmith",
    title: "Mechanist Scrap",
    dialogue_unlock: "caelir_q1_complete",
    objective: { type: "item", item: "crafting_scrap", qty: 5 },
    reward: { ash_marks: 180, item: "forged_blade" },
    completion_flag: "caelir_q2_complete",
    completion_dialogue: "Adequate.",
  },
  {
    id: "caelir_q3",
    npc: "weaponsmith",
    title: "Heart Pump Fragment",
    dialogue_unlock: "caelir_q2_complete",
    objective: { type: "item", item: "heart_pump_fragment", qty: 1 },
    reward: { ash_marks: 400, item: "ember_forged_weapon" },
    completion_flag: "caelir_arc_advance",
    completion_dialogue: "*A long pause. He sets down what he is working on.* Where did you find this.",
  },
];

export const SERIS_QUESTS = [
  {
    id: "seris_q1",
    npc: "curator",
    title: "Resonant Scraps",
    dialogue_unlock: "first_sewer_visit",
    objective: { type: "item", item: "resonant_scrap", qty: 2 },
    reward: { ash_marks: 150 },
    completion_flag: "seris_arc_interest",
    completion_dialogue: "These carry a trace. I will need more.",
  },
  {
    id: "seris_q2",
    npc: "curator",
    title: "Custodian Fragment",
    dialogue_unlock: "seris_arc_interest",
    objective: { type: "item", item: "custodian_core", qty: 1 },
    reward: { ash_marks: 300 },
    completion_flag: "seris_arc_1_primed",
    completion_dialogue: "*Her composure shifts — just slightly.* This resonates with the pattern I've been mapping.",
  },
];

export const GROMMASH_BOUNTIES = [
  {
    id: "grommash_b1",
    npc: "warden",
    title: "Nest Clear",
    dialogue_unlock: "first_sewer_visit",
    objective: { type: "flag", flag: "nest_cleared_floor1" },
    reward: { ash_marks: 100, order_score: 30 },
    completion_flag: "grommash_b1_complete",
    completion_dialogue: "Vermin nests destabilize the lower passages. You've done the city a service.",
  },
  {
    id: "grommash_b2",
    npc: "warden",
    title: "Construct Culling",
    dialogue_unlock: "boss_floor3",
    objective: { type: "enemy_kills", enemy_id: "gearbound_sentinel", count: 3 },
    reward: { ash_marks: 350, order_score: 40 },
    completion_flag: "grommash_b2_complete",
    completion_dialogue: "The constructs that have lost their programming are a hazard. They do not know what they guard anymore.",
  },
];

const NPC_TO_QUESTS = {
  othorion: OTHORION_QUESTS,
  herbalist: THALARA_QUESTS,
  weaponsmith: CAELIR_QUESTS,
  curator: SERIS_QUESTS,
  warden: GROMMASH_BOUNTIES,
};

/** Map quest_id -> quest def for progress/complete lookups */
export const ALL_QUESTS = [...OTHORION_QUESTS, ...THALARA_QUESTS, ...CAELIR_QUESTS, ...SERIS_QUESTS, ...GROMMASH_BOUNTIES];
export const QUEST_BY_ID = Object.fromEntries(ALL_QUESTS.map((q) => [q.id, q]));

/**
 * Resolve dialogue_unlock to a boolean from player flags.
 */
export function hasDialogueUnlock(ctx, unlock) {
  if (!unlock) return true;
  switch (unlock) {
    case "first_sewer_visit":
      return !!(ctx.first_sewer_visit || ctx.visited_drain_entrance || ctx.visited_overflow_channel || ctx.visited_vermin_nest || ctx.visited_fungal_bloom_chamber);
    case "first_meeting":
    case "first_meeting_thalara":
      return !!((ctx.thalara_visits ?? 0) >= 1);
    case "first_meeting_caelir":
      return !!((ctx.caelir_visits ?? 0) >= 1);
    case "nest_cleared_floor1":
      return !!ctx.nest_cleared_floor1;
    case "boss_floor3":
      return !!ctx.boss_floor3;
    default:
      return !!ctx[unlock];
  }
}

/**
 * Get quests this NPC can assign, given player flags.
 */
export function getAssignableQuests(npcId, ctx) {
  const list = NPC_TO_QUESTS[npcId];
  if (!list) return [];
  return list.filter((q) => {
    if (ctx.completedQuestIds?.includes(q.id)) return false;
    return hasDialogueUnlock(ctx, q.dialogue_unlock);
  });
}

/**
 * Get the next quest in chain that can be assigned (first unassigned, unlock met).
 */
export function getNextAssignableQuest(npcId, ctx, assignedQuestIds) {
  const list = NPC_TO_QUESTS[npcId];
  if (!list) return null;
  for (const q of list) {
    if (assignedQuestIds.includes(q.id)) continue;
    if (ctx.completedQuestIds?.includes(q.id)) continue;
    if (!hasDialogueUnlock(ctx, q.dialogue_unlock)) return null;
    return q;
  }
  return null;
}

/** Quest reward items — id, display_name, tier */
export const QUEST_REWARD_ITEMS = {
  spore_extract: { display_name: "Spore Extract", tier: 2 },
  listening_ash_elixir: { display_name: "Listening Ash Elixir", tier: 3 },
  pale_sight_elixir: { display_name: "Pale Sight Elixir", tier: 2 },
  channel_salt: { display_name: "Channel Salt", tier: 1 },
  deep_antidote: { display_name: "Deep Antidote", tier: 2 },
  ashbound_elixir: { display_name: "Ashbound Elixir", tier: 4 },
  worn_blade_upgraded: { display_name: "Worn Blade (Upgraded)", tier: 2 },
  forged_blade: { display_name: "Forged Blade", tier: 3 },
  ember_forged_weapon: { display_name: "Ember-Forged Weapon", tier: 4 },
};
