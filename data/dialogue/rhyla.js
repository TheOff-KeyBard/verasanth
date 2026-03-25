export const dialogue = {
  npc_id: "rhyla",

  greeting: {
    default: "Hold your footing.",
    conditional: [
      {
        requires_flag: "has_ashbound_resonance",
        requires_flag_not: null,
        text: "Whatever you're carrying is affecting the load distribution. The walls react when you enter.",
      },
      {
        requires_flag: "boss_floor3",
        requires_flag_not: null,
        text: "You've been near the deep supports. Good. You know how loud the bones can get.",
      },
      {
        requires_flag: "guild_standing_rhyla",
        requires_flag_not: null,
        text: "Your stance is better. You're learning to brace instead of dodge. That's Watch discipline.",
      },
    ],
  },

  options: [
    {
      id: "rhyla_stability",
      label: "Ask what stability means here",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Stability isn't a feeling. It's a measurement.",
      followup: null,
      effects: null,
    },
    {
      id: "rhyla_ground_shift",
      label: "Ask what to do when the ground shifts",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If the ground shifts under you, don't run. Brace. Running gets people killed.",
      followup: null,
      effects: null,
    },
    {
      id: "rhyla_walls",
      label: "Ask what she sees in the walls",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Most people look at walls and see stone. I see strain.",
      followup: null,
      effects: null,
    },
    {
      id: "rhyla_leaning_city",
      label: "Ask if the city is changing",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "The city's been leaning more lately. You can feel it if you know where to stand.",
      followup: null,
      effects: null,
    },
    {
      id: "rhyla_foundation_groan",
      label: "Ask about noises in the foundations",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If you hear a low groan in the foundations, report it. If you feel it, leave.",
      followup: null,
      effects: null,
    },
    {
      id: "rhyla_sealed_passages",
      label: "Ask about sealed passages beneath the Watch",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "There are passages beneath the Watch that weren't there last season. I've been sealing them quietly.",
      followup: null,
      effects: null,
    },
    {
      id: "rhyla_shifting_foundations",
      label: "Ask what she means by shifting foundations",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "It means the city is moving in ways it shouldn't.",
      followup: {
        label: "Ask how it's moving",
        response:
          "Not settling. Not cracking. Redirecting weight. Like it's preparing for something.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "rhyla_rib_pressure",
      label: "Ask about pressure in the ribs underground",
      requires_trust_min: 25,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If you ever feel pressure in your ribs when you're underground, that's not fear. That's the structure warning you.",
      followup: null,
      effects: null,
    },
  ],

  fallback: "If you're not reinforcing something, don't get in the way.",
};
