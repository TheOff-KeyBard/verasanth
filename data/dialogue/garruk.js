export const dialogue = {
  npc_id: "garruk",

  greeting: {
    default: "You here to train or to talk?",
    conditional: [
      {
        requires_flag: "has_ashbound_resonance",
        requires_flag_not: null,
        text: "The thing you're carrying hums. Don't let it distract you. Pressure tests everything.",
      },
      {
        requires_flag: "boss_floor2",
        requires_flag_not: null,
        text: "You've been deeper than most. Good. The city doesn't respect the untested.",
      },
      {
        requires_flag: "guild_standing_garruk",
        requires_flag_not: null,
        text: "You're holding your ground better. Banner steel's settling into your bones.",
      },
    ],
  },

  options: [
    {
      id: "garruk_strength",
      label: "Ask what strength means here",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Strength isn't hitting hard. It's staying upright when everything else falls.",
      followup: null,
      effects: null,
    },
    {
      id: "garruk_survival",
      label: "Ask about surviving Verasanth",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Most people break before the city touches them. You're still here. Good.",
      followup: null,
      effects: null,
    },
    {
      id: "garruk_drills",
      label: "Ask about Banner drills",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Banner drills aren't about winning. They're about not dying.",
      followup: null,
      effects: null,
    },
    {
      id: "garruk_yard",
      label: "Ask about the training yard",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If you can't hold the yard for ten breaths, you're not ready for the sewers.",
      followup: null,
      effects: null,
    },
    {
      id: "garruk_pressure",
      label: "Ask about pressure",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Pressure makes cracks. Or steel. Depends on what you are.",
      followup: null,
      effects: null,
    },
    {
      id: "garruk_deep_gate",
      label: "Ask about the gate below the city",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "There's a gate below the city I don't talk about. Don't ask why.",
      followup: {
        label: "Press him about what happened there",
        response: "I held the line. Then I didn't.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "garruk_survival_cost",
      label: "Ask what survival costs",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Surviving isn't the same as doing the right thing. Sometimes it's the opposite.",
      followup: null,
      effects: null,
    },
    {
      id: "garruk_deep_tunnels",
      label: "Ask about the deep tunnels",
      requires_trust_min: 25,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If you ever hear metal groaning in the deep tunnels, turn back. That's not the city shifting. That's memory.",
      followup: null,
      effects: null,
    },
  ],

  fallback: "If you're done talking, pick up a weapon.",
};
