export const dialogue = {
  npc_id: "lifebinder_adherent",

  greeting: {
    default: "You're still here.",
    conditional: [
      {
        requires_flag: "guild_standing_halden",
        requires_flag_not: null,
        text: "You made it through Halden's trial. He doesn't make that easy. He wants to know if you can hold someone without losing yourself in the holding.",
      },
    ],
  },

  options: [
    {
      id: "lifebinder_still_here",
      label: "What do you mean, still here?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Most people pass through the Sanctum. They take warmth and they go. You stayed long enough that I noticed.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "lifebinder_binding",
      label: "What does binding mean to you?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "It means you don't look away.",
      followup: {
        label: "Even when?",
        response:
          "Not when it's hard. Not when what they need is something you don't have. You stay anyway.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "lifebinder_hearth_tenders",
      label: "What do you think of the hearth-tenders?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "They're good people. Genuinely.",
      followup: {
        label: "But?",
        response:
          "But I've watched them forget names. You can't tend to everyone and still know anyone.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "lifebinder_lost",
      label: "Who did you lose?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Someone I held too tightly.",
      followup: {
        label: "Too tightly?",
        response:
          "Or not tightly enough. I still don't know which. Halden says the not-knowing is part of it. I'm not sure that helps.",
      },
      effects: { set_flag: "lifebinder_grief_surface" },
    },
  ],

  fallback: "If you need something, I'm here. That's the whole of it.",
};
