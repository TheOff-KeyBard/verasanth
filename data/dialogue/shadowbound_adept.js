export const dialogue = {
  npc_id: "shadowbound_adept",

  greeting: {
    default: "You're looking at the wrong things.",
    conditional: [
      {
        requires_flag: "guild_standing_serix",
        requires_flag_not: null,
        text: "You've been through the trial. Then you know. Most people look at what's in the dark. The work is looking at what the dark interrupts.",
      },
    ],
  },

  options: [
    {
      id: "covenant_adept_watching",
      label: "What are you watching?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "The inconsistencies. Light that falls wrong. Crystals that hum out of step. The room tells you more than the people in it, if you know how to read it.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "covenant_adept_others",
      label: "What do you make of the others here?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Some of them wait for the dead to speak. I find that — optimistic.",
      followup: {
        label: "What do you mean?",
        response:
          "The dead are gone. What remains is residue. Residue is not testimony.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "covenant_adept_teach",
      label: "What does the Covenant teach you?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Discipline. Restraint. You cannot uncover what you cannot approach without flinching.",
      followup: {
        label: "Does Serix agree?",
        response: "Serix agrees. On method, at least.",
      },
      effects: null,
    },
    {
      id: "covenant_adept_distrust",
      label: "What don't you trust?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Interpretation without evidence. There are those here who hear meaning in silence.",
      followup: {
        label: "On silence",
        response: "Silence is where people start inventing signal.",
      },
      effects: null,
    },
  ],

  fallback: "Keep watching. You'll start to see it.",
};
