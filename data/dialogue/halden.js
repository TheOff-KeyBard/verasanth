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
    {
      id: "halden_flame_remember_echo",
      label: "Have you ever felt the flame remember something through you?",
      requires_trust_min: 0,
      requires_flag: "ember_adept_flame_memory",
      requires_flag_not: null,
      requires_level_min: null,
      response: "Not the flame. But something like it.",
      followup: {
        label: "What is it, then?",
        response:
          "There are moments when you carry more than you meant to — a memory that isn't yours, a weight that didn't start with you. Most people think that's exhaustion. It isn't. It's being used as a vessel.\n\nYou're not the first. And you won't be the last. Just don't mistake it for strength.",
      },
      effects: null,
    },
    {
      id: "halden_archive_mark_echo",
      label: "Does the Archive leave a mark on people?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      requires_guild_standing_key: "ashen_archive",
      requires_guild_standing_min: 3,
      response: "A different kind than the sewer does.",
      followup: {
        label: "What kind?",
        response:
          "What the Archive takes isn't warmth. It's something older. I can tend to grief. I can tend to exhaustion. What you're carrying — I can sit with it. I can't fix it. That distinction matters.",
      },
      effects: null,
    },
    {
      id: "halden_banner_cost_echo",
      label: "Is there a cost to Banner training over time?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      requires_guild_standing_key: "broken_banner",
      requires_guild_standing_min: 3,
      response: "Yes. You've already started paying it.",
      followup: {
        label: "Paying how?",
        response:
          "The Banner teaches you to absorb. Pressure, impact, consequence. That's discipline, not recklessness. But the body learns to expect impact. After a while it stops registering the smaller ones. That's the cost — not injury. Numbness.\n\nCome here when you notice it. That's all I ask.",
      },
      effects: null,
    },
  ],

  fallback:
    "If you need rest, take it. If you need answers... be certain you want them.",
};
