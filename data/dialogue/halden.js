export const dialogue = {
  npc_id: "halden",

  greeting: {
    default: "The flame holds. Sit, if you need to.",
    conditional: [
      {
        requires_flag: "has_ashbound_resonance",
        requires_flag_not: null,
        text: "That tone you carry unsettles the flame. Not in fear. In recognition.",
      },
      {
        requires_flag: "has_corruption",
        requires_flag_not: null,
        text: "You're carrying something that isn't yours. Let me help before it roots deeper.",
      },
      {
        requires_flag: "guild_standing_halden",
        requires_flag_not: null,
        text: "You've learned to keep your light steady. Good. Others will need it.",
      },
    ],
  },

  options: [
    {
      id: "halden_hope",
      label: "Ask about hope",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Hope is not a shield. It's a direction.",
      followup: null,
      effects: null,
    },
    {
      id: "halden_fear",
      label: "Ask about fear in the city",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "The city listens more closely when people are afraid. Try not to give it reason.",
      followup: null,
      effects: null,
    },
    {
      id: "halden_darkness",
      label: "Ask about the dark feeling in Verasanth",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "If the dark feels heavier than usual, breathe. It passes. Eventually.",
      followup: null,
      effects: null,
    },
    {
      id: "halden_mending",
      label: "Ask what he can heal",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "I mend what I can. The rest... the city keeps.",
      followup: null,
      effects: null,
    },
    {
      id: "halden_wounds",
      label: "Ask about unseen wounds",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Some wounds don't bleed. Those are the ones I worry about.",
      followup: null,
      effects: null,
    },
    {
      id: "halden_despair",
      label: "Ask what he means by despair",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "The city feeds on despair. I wish that were metaphor.",
      followup: {
        label: "Ask how he knows",
        response:
          "Because when the flame dims for no reason, someone has given up somewhere in the city. I feel it before I know who.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "halden_flame_dim",
      label: "Ask about the dimming flame",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "When the flame dims without wind or cause, something in the city has taken hold of someone.",
      followup: null,
      effects: null,
    },
    {
      id: "halden_silence",
      label: "Ask about the wrong kind of silence",
      requires_trust_min: 25,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If you ever hear silence where there should be sound, leave. That's the city holding its breath.",
      followup: null,
      effects: null,
    },
  ],

  fallback:
    "If you need rest, take it. If you need answers... be certain you want them.",
};
