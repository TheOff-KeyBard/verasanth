export const dialogue = {
  npc_id: "hearth_tender",

  greeting: {
    default: "You look like you've been somewhere cold.",
    conditional: [
      {
        requires_flag: "guild_standing_halden",
        requires_flag_not: null,
        text: "You've been through Halden's trial. Then you know — the flame isn't yours. You're just the one holding it for everyone else.",
      },
    ],
  },

  options: [
    {
      id: "hearth_tender_meaning",
      label: "What does tending the hearth mean?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "It means you don't get to put it down. Even when your arms ache. Especially then.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "hearth_tender_lifebinders",
      label: "What do you think of the Lifebinders?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "They love deeply. I've seen it.",
      followup: {
        label: "And beyond that?",
        response:
          "But a fire that only warms one person isn't a hearth. It's a candle.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "hearth_tender_halden_teaches",
      label: "What does Halden teach?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "That the flame is a responsibility, not a gift.",
      followup: {
        label: "What do people misunderstand?",
        response:
          "Some people come here expecting warmth. They leave when they realize they're also expected to give it.",
      },
      effects: null,
    },
    {
      id: "hearth_tender_cost",
      label: "What's the cost?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "You stop being able to tell when you're cold yourself.",
      followup: {
        label: "What then?",
        response:
          "You give so much of it away that the absence becomes normal. Halden knows. He doesn't warn you because he doesn't think it would help.",
      },
      effects: { set_flag: "hearth_tender_cost_revealed" },
    },
  ],

  fallback: "Sit near the flame for a moment. It helps more than you'd think.",
};
