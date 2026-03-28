export const dialogue = {
  npc_id: "banner_recruit",

  greeting: {
    default: "You just got here too?",
    conditional: [
      {
        requires_flag: "guild_standing_garruk",
        requires_flag_not: null,
        text: "You've already gone through Garruk's trial… I haven't yet.",
      },
    ],
  },

  options: [
    {
      id: "banner_recruit_training",
      label: "How's training been?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Rough. They don't agree on anything.",
      followup: {
        label: "On anything?",
        response: "Except that you're wrong.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "banner_recruit_difference",
      label: "What's the difference between them?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "One tells you to slow down. The other tells you to stop hesitating.",
      followup: {
        label: "Which is right?",
        response:
          "I think they're both trying to keep you alive. I just don't know which one works.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "banner_recruit_garruk",
      label: "What do you think of Garruk?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "He doesn't pick a side. He just stops you when you're about to do something stupid.",
      followup: {
        label: "Does he favor one of them?",
        response:
          "I think he knows exactly who's right. He just won't say it.",
      },
      effects: null,
    },
    {
      id: "banner_recruit_leaning",
      label: "Which way are you leaning?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Depends on the day. Some days I feel like if I don't act, I'll freeze.",
      followup: {
        label: "Other days?",
        response:
          "Other days I see someone overcommit and I think — yeah, that's how you die.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "banner_recruit_learn",
      label: "What are you trying to learn?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "How to make the right mistake.",
      followup: {
        label: "The right mistake?",
        response:
          "Because it feels like you're going to make one either way.",
      },
      effects: null,
    },
  ],

  fallback: "I'm still figuring it out.",
};
