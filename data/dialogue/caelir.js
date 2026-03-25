export const dialogue = {
  npc_id: "caelir",

  greeting: {
    default:
      "Atelier's open. If you're here for work done right, you're in the right place. If you want it done fast, try somewhere else.",
    conditional: [
      {
        requires_flag: "caelir_arc_advance",
        text: "I've been thinking about what you found in the sewers. Don't say anything yet. Let me finish this edge and then we'll talk.",
      },
    ],
  },

  options: [
    {
      id: "caelir_browse",
      label: "Show me what you have.",
      requires_trust_min: 0,
      response:
        "Weapons on the left, edge work and conditioning services on the board. Prices are what they are. I don't negotiate.",
      followup: null,
      effects: null,
    },
    {
      id: "caelir_edge_hone",
      label: "Edge hone — eight AM.",
      requires_trust_min: 0,
      response: "Eight AM. +1 melee for five combats. Worth it if you're about to go somewhere that matters.",
      followup: null,
      effects: null,
    },
    {
      id: "caelir_craft",
      label: "Can you make something specific?",
      requires_trust_min: 0,
      response:
        "Depends what it is. I don't work from vague requests. Come back when you know exactly what you need.",
      followup: null,
      effects: null,
    },
    {
      id: "caelir_work",
      label: "How long have you been here?",
      requires_trust_min: 10,
      response:
        "Long enough that I stopped counting years. The work is what matters. The work is always here.",
      followup: {
        label: "What's that count scratched into the table?",
        response:
          "Tally marks. I've been making them since I got here. I don't know why I started. I can't stop. The number is very large.",
      },
      effects: null,
    },
    {
      id: "caelir_marks",
      label: "Those marks on your table — what language is that?",
      requires_trust_min: 20,
      response:
        "I don't know. I've shown it to Vaelith. She got very quiet and said she needed to check something. She hasn't come back to me about it. That was four months ago.",
      followup: {
        label: "What do you think they mean?",
        response:
          "I think I'm counting something I can't see. And whatever I'm counting has been here a very long time.",
      },
      effects: null,
    },
    {
      id: "caelir_chest",
      label: "What's in the locked chest?",
      requires_trust_min: 30,
      response:
        "A blade I can't finish. I've started it seventeen times. Something goes wrong at the same point every time. The steel's fine. The technique is right. It just — stops being right at a specific moment. I've started burning the failures now so I don't have to look at them.",
      followup: {
        label: "What moment does it go wrong?",
        response:
          "When I try to put a name on it. The blade doesn't want a name yet. I don't know what it's waiting for.",
      },
      effects: { set_flag: "caelir_chest_discussed" },
    },
  ],

  fallback: "Not sure what you're after. Come back when you know what you need.",
};
