export const dialogue = {
  npc_id: "grave_whisper_adherent",

  greeting: {
    default: "Something just shifted. Did you feel that?",
    conditional: [
      {
        requires_flag: "guild_standing_serix",
        requires_flag_not: null,
        text: "You passed the trial. Then you heard it too — the thing that holds when everything else fails. That's what we listen for.",
      },
    ],
  },

  options: [
    {
      id: "covenant_adherent_listening",
      label: "What are you listening to?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "The hall. The crystals. The — space between things. Most people think silence is empty. It isn't. It's full of what's already happened.",
      followup: null,
      effects: { trust_delta: 1 },
    },
    {
      id: "covenant_adherent_already_happened",
      label: "What do you mean, already happened?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Truth doesn't live in the present. It settles. Like sediment. You have to be very still to hear it.",
      followup: {
        label: "And the others here?",
        response:
          "The others think you can chase it. You can't. You have to wait for it to surface.",
      },
      effects: null,
    },
    {
      id: "covenant_adherent_others",
      label: "What do you make of the others here?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "They look for things. I understand the impulse. But looking disturbs the surface.",
      followup: {
        label: "What happens then?",
        response: "You can't hear what you're frightening away.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "covenant_adherent_heard_recently",
      label: "Have you heard something recently?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Yes. Something old. From below the hall. I don't know if it's warning or memory. Sometimes those are the same.",
      followup: null,
      effects: { set_flag: "grave_whisper_heard_below" },
    },
  ],

  fallback: "Be still for a moment. You'll understand.",
};
