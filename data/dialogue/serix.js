export const dialogue = {
  npc_id: "serix",

  greeting: {
    default: "Your shadow arrived before you did.",
    conditional: [
      {
        requires_flag: "has_ashbound_resonance",
        requires_flag_not: null,
        text: "The tone you carry resonates with the deep halls. Not with fear. With recognition.",
      },
      {
        requires_flag: "has_corruption",
        requires_flag_not: null,
        text: "You're touched by something old. Not Covenant work. Something beneath us.",
      },
      {
        requires_flag: "guild_standing_serix",
        requires_flag_not: null,
        text: "You've walked the lower halls. They've noticed. So have I.",
      },
    ],
  },

  options: [
    {
      id: "serix_shadow_clarifies",
      label: "Ask what shadow does",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Shadow doesn't corrupt. It clarifies.",
      followup: null,
      effects: null,
    },
    {
      id: "serix_fear_of_shadow",
      label: "Ask why people fear shadow",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Most people fear what follows them. You should fear what walks beside you.",
      followup: null,
      effects: null,
    },
    {
      id: "serix_covenant_honesty",
      label: "Ask what the Covenant teaches",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "The Covenant doesn't teach power. It teaches honesty.",
      followup: null,
      effects: null,
    },
    {
      id: "serix_dark_pull",
      label: "Ask about the dark pulling at people",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If the dark pulls at you, don't resist. It's only trying to show you something.",
      followup: null,
      effects: null,
    },
    {
      id: "serix_light_hides",
      label: "Ask why the city prefers light",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Light hides more than it reveals. That's why the city prefers it.",
      followup: null,
      effects: null,
    },
    {
      id: "serix_internal_change",
      label: "Ask if shadow changes people",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "You've begun to change. Not visibly. Internally. That's where it matters.",
      followup: null,
      effects: null,
    },
    {
      id: "serix_truth_of_shadow",
      label: "Ask what shadow reveals",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "It means the dark has no patience for masks.",
      followup: {
        label: "Ask what it would reveal about you",
        response: "Something you already suspect.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "serix_echoing_thoughts",
      label: "Ask about thoughts echoing back",
      requires_trust_min: 25,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If you ever feel your thoughts echo, don't panic. That's the city listening.",
      followup: null,
      effects: null,
    },
  ],

  fallback: "If you fear the dark, you're not listening to it.",
};
