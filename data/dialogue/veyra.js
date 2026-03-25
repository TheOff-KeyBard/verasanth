export const dialogue = {
  npc_id: "veyra",

  greeting: {
    default:
      "If it needs mending, I can mend it. If it needs replacing, I'll tell you honestly. What have you got?",
    conditional: [
      {
        requires_flag: "seen_sewer_wall_markings",
        text: "You've seen the marks in the sewer walls. I can tell. People come back with a certain look. Sit down. We should talk before you go back.",
      },
    ],
  },

  options: [
    {
      id: "veyra_browse",
      label: "What do you have for sale?",
      requires_trust_min: 0,
      response:
        "Armor and shields on the rack. Everything's priced fair. I don't inflate for desperation.",
      followup: null,
      effects: null,
    },
    {
      id: "veyra_repair",
      label: "I need something repaired.",
      requires_trust_min: 0,
      response:
        "Show me what you've got. I'll tell you if it's worth fixing or worth replacing.",
      followup: null,
      effects: null,
    },
    {
      id: "veyra_strap_tighten",
      label: "Strap tighten — eight AM.",
      requires_trust_min: 0,
      response:
        "Eight AM. +1 defense for five combats. Basic but reliable. Worth it before the deeper floors.",
      followup: null,
      effects: null,
    },
    {
      id: "veyra_work",
      label: "How long have you worked leather?",
      requires_trust_min: 0,
      response:
        "Longer than I've been in this city, which is longer than I can account for. The hands remember even when the years get unclear.",
      followup: null,
      effects: null,
    },
    {
      id: "veyra_symbols",
      label: "I saw symbols in the sewer walls. Like the ones inside your armor.",
      requires_trust_min: 20,
      requires_flag: "seen_sewer_wall_markings",
      response:
        "I've been putting those marks in my work since I arrived. Protection marks — that's what I told myself. I didn't know where I learned them. Then I went into the sewer on an errand and saw them in the stone. Old. Much older than me. I've been copying something I didn't understand.",
      followup: {
        label: "What do they mean?",
        response:
          "I think they're a record. Each one is an acknowledgment of a debt. Someone put them in the stone to remember what they owed. I've been doing the same thing without knowing it. I don't know who I learned it from. I don't think I learned it from a person.",
      },
      effects: { set_flag: "veyra_symbols_discussed" },
    },
    {
      id: "veyra_face_down",
      label: "There's something on your workbench you keep face-down.",
      requires_trust_min: 35,
      requires_flag: "veyra_symbols_discussed",
      response:
        "A name. Someone I made armor for. It didn't help them. I keep it face-down because I can work better when I'm not looking at it. I keep it at all because I shouldn't be allowed to forget.",
      followup: {
        label: "Where are they now?",
        response:
          "The sewer. Or past it. I stopped looking for them after the third floor. I'm not sure which of us that says more about.",
      },
      effects: null,
    },
  ],

  fallback: "Not following you. Try again or try someone else.",
};
