export const dialogue = {
  npc_id: "ironblood_veteran",

  greeting: {
    default: "You're wasting movement.",
    conditional: [
      {
        requires_flag: "guild_standing_garruk",
        requires_flag_not: null,
        text: "You've been through Garruk's trial. Good. Then you know this isn't about looking strong.",
      },
    ],
  },

  options: [
    {
      id: "banner_veteran_wrong",
      label: "What did I do wrong?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "You stepped before your weight settled. You do that in a real fight, you don't get a second mistake.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "banner_veteran_focus",
      label: "What should I be focusing on?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Control. Your stance. Your breath. The space you occupy. Everything else comes after.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "banner_veteran_war_forged",
      label: "What do you think of the War-Forged?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "They hit hard.",
      followup: {
        label: "And beyond that?",
        response:
          "But they mistake momentum for control. Momentum runs out.",
      },
      effects: null,
    },
    {
      id: "banner_veteran_garruk_teaches",
      label: "What does Garruk actually teach?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Survival. Not glory. Not victory. Survival.",
      followup: {
        label: "Why survival?",
        response:
          "You're no use to anyone if you don't make it through the fight.",
      },
      effects: null,
    },
    {
      id: "banner_veteran_killed",
      label: "What gets people killed?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Overconfidence. Usually disguised as aggression.",
      followup: {
        label: "How does that kill them?",
        response:
          "They think ending the fight fast keeps them safe. It just makes the mistake come sooner.",
      },
      effects: null,
    },
  ],

  fallback: "Set your feet. Then try again.",
};
