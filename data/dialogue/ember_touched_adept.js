export const dialogue = {
  npc_id: "ember_touched_adept",

  greeting: {
    default: "You're watching the brazier.",
    conditional: [
      {
        requires_flag: "guild_standing_vaelith",
        requires_flag_not: null,
        text: "You've been through Vaelith's trial. Then you know — the Archive doesn't test your power. It tests whether your power knows where it ends.",
      },
    ],
  },

  options: [
    {
      id: "ember_adept_working",
      label: "What are you working on?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Precision. The same thing, every day.",
      followup: {
        label: "What about the flame?",
        response:
          "The flame does what you train it to do. Until it doesn't. You want to know about the until.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "ember_adept_pale_marked",
      label: "What do you think of the Pale-Marked?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "They survived something. I don't dismiss that.",
      followup: {
        label: "And beyond that?",
        response:
          "But survival isn't mastery. Knowing what you lost isn't the same as knowing what you have.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "ember_adept_archive_feel",
      label: "What does the Archive feel like to you?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Like something is paying attention.",
      followup: {
        label: "Paying attention to what?",
        response:
          "Not to what I'm doing. To what I'm remembering while I do it. I've stopped trying to explain it.",
      },
      effects: null,
    },
    {
      id: "ember_adept_surprised",
      label: "Has the flame ever surprised you?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Once. It remembered something I hadn't thought of in years.",
      followup: {
        label: "What was it?",
        response:
          "I don't know if that was the flame or the Archive or something older than both. Vaelith said: 'Note it. Don't chase it.' I'm still deciding if that's wisdom or caution.",
      },
      effects: { set_flag: "ember_adept_flame_memory" },
    },
  ],

  fallback: "Control it before it remembers differently.",
};
