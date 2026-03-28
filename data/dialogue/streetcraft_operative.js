export const dialogue = {
  npc_id: "streetcraft_operative",

  greeting: {
    default: "You came in through the main entrance.",
    conditional: [
      {
        requires_flag: "guild_standing_lirael",
        requires_flag_not: null,
        text: "You made it through Lirael's trial. Then you know — the Market doesn't reward speed. It rewards setup.",
      },
    ],
  },

  options: [
    {
      id: "streetcraft_problem",
      label: "Is that a problem?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Depends who's watching.",
      followup: {
        label: "Who's watching?",
        response:
          "There are three other ways in. Two of them nobody checks. You'll learn which ones.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "streetcraft_working",
      label: "What are you working on?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Reading the room. Same as always.",
      followup: {
        label: "How?",
        response:
          "Most people look at where someone is. I look at where they were ten seconds ago. The gap tells you more.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "streetcraft_quickstep",
      label: "What do you think of the Quickstep runners?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Fast. Genuinely fast.",
      followup: {
        label: "But?",
        response:
          "But speed without setup is just noise. They move through openings they didn't make. Eventually the opening isn't there and they've already committed.",
      },
      effects: null,
    },
    {
      id: "streetcraft_lirael_teaches",
      label: "What does Lirael actually teach?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "She doesn't teach. She watches what works and what doesn't.",
      followup: {
        label: "How do you learn from that?",
        response:
          "She's never told me I did something wrong. She's just looked at the outcome long enough that I understood it myself.",
      },
      effects: null,
    },
    {
      id: "streetcraft_advantage",
      label: "What's the real advantage?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "You want the moment before the moment. That's it.",
      followup: {
        label: "Say more.",
        response:
          "If you're reacting, you're already behind. The street is always moving. You move it first, or you move with it. There's no third option.",
      },
      effects: { set_flag: "streetcraft_angle_doctrine" },
    },
  ],

  fallback: "Slow down. The street already told you what it wants.",
};
