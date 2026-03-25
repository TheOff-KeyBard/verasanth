export const dialogue = {
  npc_id: "trader",

  greeting: {
    default: "I have what you need. I usually do.",
    conditional: [
      {
        requires_flag: "arc1_climax_reached",
        text: "Ah. You found it. I thought you might.",
      },
    ],
  },

  options: [
    {
      id: "trader_browse",
      label: "Show me what you have.",
      requires_trust_min: 0,
      response: "General stock on the board. Prices are consistent. I don't bargain.",
      followup: null,
      effects: null,
    },
    {
      id: "trader_sell",
      label: "I want to sell something.",
      requires_trust_min: 0,
      response: "Show me. I'll tell you what it's worth here.",
      followup: null,
      effects: null,
    },
    {
      id: "trader_how_long",
      label: "How long have you been here?",
      requires_trust_min: 0,
      response: "Long enough to know what people need when they arrive.",
      followup: {
        label: "How did you know what to stock?",
        response: "Experience.",
      },
      effects: null,
    },
    {
      id: "trader_map",
      label: "That map behind you — that's not Verasanth.",
      requires_trust_min: 0,
      response: "No.",
      followup: {
        label: "What city is it?",
        response: "One I've been to. Are you buying something?",
      },
      effects: null,
    },
    {
      id: "trader_soul_coin",
      label: "I have a Soul Coin.",
      requires_trust_min: 0,
      response: "Take that out of my shop before someone sees it. Put it away.",
      followup: null,
      effects: null,
    },
  ],

  fallback: "I don't have an answer for that. I do have goods, if you're interested.",
};
