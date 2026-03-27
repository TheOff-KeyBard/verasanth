export const dialogue = {
  npc_id: "seris",

  greeting: {
    default:
      "The stall's open. I deal in relics, artifacts, and identification. If you've found something in the sewers you don't understand, I can usually help.",
    conditional: [
      {
        requires_flag: "has_ashbound_resonance",
        text: "At last. Good. Don't say anything yet — not out here. Come closer.",
      },
      {
        requires_flag: "arc1_climax_reached",
        requires_flag_not: "has_ashbound_resonance",
        text: "You went to the foundation. I know because the city felt different for an hour. What did you find?",
      },
      {
        requires_flag: "seris_arc_1_complete",
        text: "You've done what I needed you to do. I won't pretend I'm not grateful. Carefully grateful.",
      },
    ],
  },

  options: [
    {
      id: "seris_identify",
      label: "I found something I don't understand.",
      requires_trust_min: 0,
      response:
        "Forty AM for identification. I can tell you name, lore, and any hidden properties. Relics and artifacts only — I don't appraise scrap.",
      followup: null,
      effects: null,
    },
    {
      id: "seris_relics",
      label: "What are you looking for?",
      requires_trust_min: 0,
      response:
        "Artifacts with a specific kind of resonance. The kind the sewer produces in its deeper layers. You'll know them when you find them — they feel different from ordinary loot.",
      followup: {
        label: "What are you going to do with them?",
        response: "Calibrate something. I'll tell you more when I trust you more.",
      },
      effects: null,
    },
    {
      id: "seris_mechanism",
      label: "What do you know about the mechanism under the city?",
      requires_trust_min: 20,
      requires_flag: "seris_arc_interest",
      response:
        "More than most. Less than I need to. The mechanism was built to do something specific. I've been trying to determine what for a long time. The Resonance is part of the answer — the calibration instrument. When it's properly aligned, the mechanism will activate.",
      followup: {
        label: "What does activation do?",
        response: "Opens something. I believe it's an exit. I've staked a great deal on that belief.",
      },
      effects: null,
    },
    {
      id: "seris_arc_1",
      label: "You said you needed something from the deep foundation.",
      requires_trust_min: 30,
      requires_flag: "seris_arc_1_primed",
      response:
        "The Ashbound Resonance. It's in the deepest chamber of the sewer — past the Custodian. I can't retrieve it myself. The mechanism responds poorly to me directly. You have a different relationship to it. I don't understand why. I'd like to.",
      followup: {
        label: "And if I bring it to you?",
        response:
          "I'll owe you something real. And we'll both be closer to understanding what this city actually is.",
      },
      effects: null,
    },
    {
      id: "seris_resonance",
      label: "I have the Ashbound Resonance.",
      requires_trust_min: 30,
      requires_flag: "has_ashbound_resonance",
      response:
        "I can feel it from here. You need to understand — I know what that is, and I know what it means that you're holding it stable. Most people can't. The city is paying attention to you right now in ways I can't fully measure. Be careful. That's not a metaphor.",
      followup: {
        label: "What do you need from me now?",
        response:
          "Time. And for you not to let anyone take that from you. I'll find you when the calibration is ready.",
      },
      effects: { set_flag: "seris_arc_1_complete" },
    },
    {
      id: "seris_gautrorn_hint",
      label:
        "Ask if she has noticed anything unusual about anyone in the city.",
      requires_trust_min: 20,
      requires_flag_not: "gautrorn_name_revealed",
      response:
        "You're asking the right questions. Not quite the right moment.",
      followup: null,
      effects: null,
    },
    {
      id: "seris_gautrorn_mid",
      label: "Ask if she has seen names written before they exist.",
      requires_trust_min: 20,
      requires_flag: "gautrorn_dreams_discussed",
      requires_flag_not: "ledger_gautrorn_confirmed",
      response:
        "There is a man in this district who dreams of places that do not exist. If you meet him, listen carefully. His memories are not entirely his own.",
      followup: null,
      effects: null,
    },
    {
      id: "seris_ledger_question",
      label: "Ask her directly — is his name already in the ledger?",
      requires_trust_min: 25,
      requires_flag: "gautrorn_name_revealed",
      requires_flag_not: "ledger_gautrorn_confirmed",
      response:
        "Gautrorn Haargoth. The Darmerian with the storm-scarred eyes. He remembers a world that never touched Verasanth. The ledger has already accounted for him.",
      followup: {
        label: "Ask why.",
        response:
          "Because he does not belong to a single version of the story. And the city notices inconsistencies.",
      },
      effects: null,
    },
    {
      id: "seris_after_ledger",
      label: "Ask what it means that his name was there.",
      requires_trust_min: 25,
      requires_flag: "ledger_gautrorn_confirmed",
      response:
        "It means the city marked him before he ever arrived. Whether that is a gift or a claim — I have not yet decided.",
      followup: {
        label: "Ask if she has told him.",
        response: "No. She does not elaborate.",
      },
      effects: { trust_delta: 1 },
    },
  ],

  fallback: "I don't deal in guesswork. Come back with something specific.",
};
