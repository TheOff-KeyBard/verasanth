export const dialogue = {
  npc_id: "covenant_initiate",

  greeting: {
    default:
      "You're new here too, aren't you? Or — newer than some.",
    conditional: [
      {
        requires_flag: "guild_standing_serix",
        requires_flag_not: null,
        text: "You've already been through the trial. I'm still — I haven't yet. Serix says when I'm ready. I'm not sure how I'll know.",
      },
    ],
  },

  options: [
    {
      id: "covenant_initiate_duration",
      label: "How long have you been here?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Long enough to know I don't understand it yet. The adept says that's the first honest thing anyone admits in the Covenant.",
      followup: null,
      effects: { trust_delta: 2 },
    },
    {
      id: "covenant_initiate_factions",
      label: "What do you make of the two factions?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "I keep trying to decide which one is right. I think that might be the wrong question. I'm not sure yet.",
      followup: {
        label: "What does Serix do?",
        response:
          "Serix watches both of them the same way. Like he's waiting to see what the argument produces.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "covenant_initiate_why_come",
      label: "What made you come to the Covenant?",
      requires_trust_min: 10,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "I heard something I couldn't explain. I came here because I thought someone would tell me what it was. Nobody has. They say that's the point.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "covenant_initiate_trust_who",
      label: "Who do you trust more — the adept or the adherent?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "I don't know. Some days the adept sounds right. Some days I stand near the adherent and something in the room changes and I think — maybe. I think Serix already knows which way I'll go. He just hasn't told me.",
      followup: null,
      effects: null,
    },
  ],

  fallback: "I'm still working it out. Ask me again later.",
};
