export const dialogue = {
  npc_id: "sanctum_newcomer",

  greeting: {
    default: "I didn't expect it to feel like this.",
    conditional: [
      {
        requires_flag: "guild_standing_halden",
        requires_flag_not: null,
        text: "You've already been through Halden's trial. I keep meaning to ask you what it was like. I'm not sure I'm ready to hear it.",
      },
    ],
  },

  options: [
    {
      id: "sanctum_newcomer_expected",
      label: "What did you expect?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "I don't know. Something quieter, maybe.",
      followup: {
        label: "Quieter how?",
        response:
          "The warmth here isn't soft. It has weight to it.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "sanctum_newcomer_two_sides",
      label: "What's the difference between the two sides?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "One of them holds the door open. The other one sits down with you.",
      followup: {
        label: "Which do you want?",
        response:
          "I keep thinking I want the door. Then someone sits down with me and I'm not sure anymore.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "sanctum_newcomer_halden",
      label: "What do you think of Halden?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "He never seems depleted. But I don't think that's because he has more than everyone else.",
      followup: {
        label: "Then why?",
        response:
          "I think he's just been carrying it long enough that he's learned to carry it differently.",
      },
      effects: null,
    },
    {
      id: "sanctum_newcomer_drawn",
      label: "Which way are you drawn?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "To the lifebinders, if I'm honest. But I feel guilty about it.",
      followup: {
        label: "Why guilty?",
        response:
          "Like wanting to be held by one person means you're taking something from everyone else.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "sanctum_newcomer_brought",
      label: "What brought you here?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "I needed somewhere that wouldn't ask me to be fine.",
      followup: {
        label: "And here?",
        response:
          "The Sanctum doesn't do that. Whatever else it is, it doesn't do that.",
      },
      effects: null,
    },
  ],

  fallback:
    "I'm still finding my footing. But it's warmer here than anywhere else I've been.",
};
