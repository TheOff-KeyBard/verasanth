export const dialogue = {
  npc_id: "kelvaris",

  greeting: {
    default: "Fire's been going since before you arrived. What do you need?",
    conditional: [
      {
        requires_flag: "arc1_climax_reached",
        text: "The room went flat when you came back. I know what that means. I won't pretend otherwise. Sit down.",
      },
      {
        requires_flag: "has_ashbound_resonance",
        requires_flag_not: "arc1_climax_reached",
        text: "Something in your pack is making the fire behave oddly. I'm going to need you to tell me what that is.",
      },
      {
        requires_flag: "boss_floor1",
        requires_flag_not: "boss_floor2",
        text: "The Rat King's dealt with. The drains are quieter. Good work — though I'd keep that to yourself if I were you.",
      },
      {
        requires_crime_heat_min: 8,
        text:
          "I'm not going to ask what happened.\n\nSit down if you need to. The fire doesn't judge. I've learned not to either.",
      },
      {
        requires_crime_heat_min: 5,
        text:
          "You're carrying something heavy.\n\nThe room felt it before you sat down.",
      },
      {
        requires_crime_heat_min: 2,
        text:
          "The city's been talking about someone.\n\nThe fire's been doing that thing it does.",
      },
    ],
  },

  options: [
    {
      id: "kelvaris_room",
      label: "I need a room.",
      requires_trust_min: 0,
      response:
        "Twenty AM a night. You've already paid for tonight — you woke up here. After that, you settle up before you sleep.",
      followup: null,
      effects: null,
    },
    {
      id: "kelvaris_food",
      label: "Anything to eat?",
      requires_trust_min: 0,
      response: "Ash stew. Don't ask what's in it. Eight AM. It's better than it sounds.",
      followup: null,
      effects: null,
    },
    {
      id: "kelvaris_city_general",
      label: "Tell me about the city.",
      requires_trust_min: 0,
      response:
        "Old. Strange. Doesn't let people go easily. Beyond that, you'll have to find out yourself — I'm not a guide service.",
      followup: {
        label: "That sounds like a warning.",
        response: "It's an observation. You'll decide what to do with it.",
      },
      effects: null,
    },
    {
      id: "kelvaris_ledger",
      label: "What is that ledger?",
      requires_trust_min: 10,
      response: "A record. Everyone who stays here gets written down. I write them. Mostly.",
      followup: {
        label: "What do you mean, mostly?",
        response:
          "Some entries I don't remember writing. The handwriting's mine. The ink is dry. I didn't write them. I've stopped trying to explain it.",
      },
      effects: null,
    },
    {
      id: "kelvaris_cant_leave",
      label: "Have you ever left the tavern?",
      requires_trust_min: 20,
      response:
        "Yes. I walked out the front door seventeen times. Each time I was back inside before I understood how. I've stopped trying. The city seems to have an opinion about where I belong.",
      followup: {
        label: "Doesn't that frighten you?",
        response:
          "It did. Then it was just the truth. Truth stops frightening you eventually. It just sits there being true.",
      },
      effects: null,
    },
    {
      id: "kelvaris_ledger_gap",
      label: "There's a page in the ledger that's blank. It shouldn't be.",
      requires_trust_min: 30,
      requires_flag: "boss_floor3",
      response:
        "I found that gap eight months ago. I tore the page out. It came back. The gap came back with it. Whatever should be there — both sides decided to leave at the same time. That's not a coincidence. That's an agreement between something and something else, and neither side consulted me.",
      followup: null,
      effects: { set_flag: "kelvaris_gap_discussed" },
    },
    {
      id: "kelvaris_player_name",
      label: "My name is already in there. From before I arrived.",
      requires_trust_min: 35,
      requires_flag: "kelvaris_gap_discussed",
      response:
        "I know. I noticed when you walked in. I've been thinking about what to say to you about it for three days. I still don't have anything useful. Your name is there. The date is wrong. I didn't write it. That's everything I know.",
      followup: {
        label: "What does it say after my name?",
        response: "Nothing. Just the name. And a date that hasn't happened yet.",
      },
      effects: { set_flag: "kelvaris_name_revealed" },
    },
  ],

  fallback: "The fire's got no opinion on that. I'm not much better placed.",
};
