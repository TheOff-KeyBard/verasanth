export const dialogue = {
  npc_id: "watch_initiate",

  greeting: {
    default: "You're not Watch yet either, are you?",
    conditional: [
      {
        requires_flag: "guild_standing_rhyla",
        requires_flag_not: null,
        text: "You've already done Rhyla's trial. I keep putting it off. I'm not sure what I'm waiting for.",
      },
    ],
  },

  options: [
    {
      id: "watch_initiate_training",
      label: "What's it like training here?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Structured. More than anywhere I've been.",
      followup: {
        label: "What's hard about that?",
        response:
          "The hard part is that structure means different things to different people here.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "watch_initiate_two_sides",
      label: "What's the difference between the two sides?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "One watches what's there. The other watches what isn't there yet.",
      followup: {
        label: "Which is right?",
        response:
          "I've been trying to figure out which one is right. I think Rhyla knows and isn't saying.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "watch_initiate_rhyla",
      label: "What do you think of Rhyla?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "She sees everything. You can tell because she never looks surprised.",
      followup: {
        label: "Why do you think that is?",
        response:
          "I don't know if that's because she predicted it or because she's seen enough that nothing surprises her anymore.",
      },
      effects: null,
    },
    {
      id: "watch_initiate_leaning",
      label: "Which way are you leaning?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "I don't know. When I'm near the defender I feel steady. When I'm near the sentinel I feel like I've been missing something the whole time.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "watch_initiate_figure_out",
      label: "What are you trying to figure out?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Whether the city is something you read or something you endure.",
      followup: {
        label: "Why does that matter?",
        response:
          "Because the answer changes everything about how you stand in it.",
      },
      effects: null,
    },
  ],

  fallback: "I'm watching. Still working out what I'm watching for.",
};
