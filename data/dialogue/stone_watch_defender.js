export const dialogue = {
  npc_id: "stone_watch_defender",

  greeting: {
    default: "You're early.",
    conditional: [
      {
        requires_flag: "guild_standing_rhyla",
        requires_flag_not: null,
        text: "You've been through Rhyla's trial. Then you know — the Watch isn't about anticipating. It's about being there when it matters.",
      },
    ],
  },

  options: [
    {
      id: "sw_defender_holding_line",
      label: "What does holding the line mean?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Exactly what it sounds like. You don't move until you have to. You don't guess. You wait, and you're ready.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "sw_defender_sentinels",
      label: "What do you think of the Sentinels?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "They're good at watching.",
      followup: {
        label: "And beyond that?",
        response:
          "But they act on what they think is coming. Sometimes they're right. Sometimes they create the problem they were trying to prevent.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "sw_defender_rhyla_teaches",
      label: "What does Rhyla teach?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Patience. Real patience — not waiting because you're afraid. Waiting because you understand the ground.",
      followup: {
        label: "What do you mean?",
        response:
          "Most people mistake hesitation for patience. They're not the same thing.",
      },
      effects: null,
    },
    {
      id: "sw_defender_warden_killed",
      label: "What gets a Warden killed?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Moving before the threat is real.",
      followup: {
        label: "Say more.",
        response:
          "The city will show you things that aren't there. If you respond to all of them, you'll be exhausted when the real one arrives.",
      },
      effects: null,
    },
  ],

  fallback: "Stand where you are. Watch. That's the whole job.",
};
