export const dialogue = {
  npc_id: "quickstep_runner",

  greeting: {
    default: "You hesitated at the curtain.",
    conditional: [
      {
        requires_flag: "guild_standing_lirael",
        requires_flag_not: null,
        text: "You got through Lirael's trial. Good. Now stop treating every room like a problem to solve before you enter it.",
      },
    ],
  },

  options: [
    {
      id: "quickstep_careful",
      label: "I was being careful.",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "You were being slow.",
      followup: {
        label: "Careful isn't slow.",
        response:
          "Careful is fine. But the curtain was already open. The moment was already there. You just didn't take it.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "quickstep_read_room",
      label: "How do you read a room that fast?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "You don't read it. You move and it tells you.",
      followup: {
        label: "What about thinking?",
        response:
          "By the time you've analyzed it, it's changed. Trust your feet first. Your head catches up.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "quickstep_streetcraft",
      label: "What do you think of the Streetcraft side?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Smart. Really smart.",
      followup: {
        label: "But?",
        response:
          "They set everything up perfectly for a situation that doesn't exist anymore. The street moved while they were planning.",
      },
      effects: null,
    },
    {
      id: "quickstep_hardest",
      label: "What's the hardest thing to learn?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Trusting the first read.",
      followup: {
        label: "What goes wrong?",
        response:
          "You feel the opening. Then you second-guess it. Then it's gone. Every time. The instinct was right. The thinking killed it.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "quickstep_wrong",
      label: "Have you ever gotten it wrong?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Yeah.",
      followup: {
        label: "What happened?",
        response:
          "Committed to a gap that wasn't there. Overread the flow. Lirael watched the whole thing. Didn't say a word. Didn't have to.",
      },
      effects: { set_flag: "quickstep_overcommit_acknowledged" },
    },
  ],

  fallback: "Move. Think while you're moving. In that order.",
};
