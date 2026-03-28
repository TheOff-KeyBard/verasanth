export const dialogue = {
  npc_id: "stone_watch_sentinel",

  greeting: {
    default:
      "You came in from the east approach. You hesitated at the gate. Not long — but long enough.",
    conditional: [
      {
        requires_flag: "guild_standing_rhyla",
        requires_flag_not: null,
        text: "Rhyla's trial is about seeing the fault before it opens. You did that. Most don't.",
      },
    ],
  },

  options: [
    {
      id: "sw_sentinel_how_know",
      label: "How did you know that?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "I've been watching the gate for two hours. You're the fourth person through. The other three didn't pause. You did. That's either caution or something else.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "sw_sentinel_watching_for",
      label: "What are you watching for?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Pattern breaks. Something that was one way yesterday and is different today.",
      followup: {
        label: "What happens when you find one?",
        response:
          "By the time it's a threat, it's already too late to stop it cleanly.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "sw_sentinel_defenders",
      label: "What do you think of the defenders?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "They're solid. Dependable.",
      followup: {
        label: "But?",
        response:
          "But they wait for the wall to crack before they act. I'd rather seal it before it does.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "sw_sentinel_rhyla_believes",
      label: "What does Rhyla actually believe?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "She reads the city the way I do. She just doesn't move on it until she's certain.",
      followup: {
        label: "And?",
        response:
          "I think certainty is a luxury. The city doesn't wait for it.",
      },
      effects: { set_flag: "sentinel_reads_rhyla" },
    },
  ],

  fallback: "Keep your eyes on the seams, not the surface.",
};
