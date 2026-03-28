export const dialogue = {
  npc_id: "war_forged_bruiser",

  greeting: {
    default: "You're hesitating.",
    conditional: [
      {
        requires_flag: "guild_standing_garruk",
        requires_flag_not: null,
        text: "You made it through Garruk's trial. Good. Now stop thinking like it's over.",
      },
    ],
  },

  options: [
    {
      id: "banner_bruiser_mean",
      label: "What do you mean?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "You're waiting. For what? Permission?",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "banner_bruiser_fighting",
      label: "How should I be fighting?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Forward. If you're not forcing the fight, you're losing it.",
      followup: {
        label: "And winning?",
        response:
          "You don't win by reacting. You win by making them react.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "banner_bruiser_ironblood",
      label: "What do you think of the Ironblood?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "They're solid.",
      followup: {
        label: "Is that praise?",
        response:
          "They call it discipline. I call it giving your enemy time to kill you.",
      },
      effects: null,
    },
    {
      id: "banner_bruiser_strength",
      label: "What does strength actually look like here?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Decisive. You see the opening, you take it. No second guesses.",
      followup: {
        label: "And if you wait?",
        response: "A held strike is a wasted strike.",
      },
      effects: null,
    },
    {
      id: "banner_bruiser_killed",
      label: "Have you ever gotten it wrong?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Yeah.",
      followup: {
        label: "What happened?",
        response:
          "Almost did. Once. The gap was there. I knew it was there. Still waited.\n\nYou wait for the perfect moment, and you die in the imperfect one.",
      },
      effects: { set_flag: "banner_bruiser_hesitation_cost" },
    },
  ],

  fallback: "Move. Don't think about it — move.",
};
