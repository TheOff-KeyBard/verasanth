export const dialogue = {
  npc_id: "pale_marked_survivor",

  greeting: {
    default: "It doesn't burn the same way anymore.",
    conditional: [
      {
        requires_flag: "guild_standing_vaelith",
        requires_flag_not: null,
        text: "You made it through Vaelith's trial. Then you felt it — the moment the Archive decides whether you're containing the flame or the flame is containing you.",
      },
    ],
  },

  options: [
    {
      id: "pale_marked_burn",
      label: "What doesn't burn the same?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Everything. Once you've been through the pale side of it, bright fire looks different.",
      followup: {
        label: "Different how?",
        response:
          "Not weaker. Just — further away. Like it's on the other side of something you crossed.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "pale_marked_survive",
      label: "What did you survive?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "I don't talk about the specifics.",
      followup: {
        label: "Anything you can say?",
        response:
          "But I'll tell you this: what the flame takes, it keeps. And what stays behind isn't less than what left. It's just different.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "pale_marked_ember_touched",
      label: "What do you think of the Ember-Touched?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "They believe in control. I understand why.",
      followup: {
        label: "Did you?",
        response:
          "I believed it too. Right up until the moment the flame showed me something I hadn't given it permission to show me.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "pale_marked_showed",
      label: "What did it show you?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Something old. Not a memory — older than memory.",
      followup: {
        label: "Older than memory?",
        response:
          "I think the Archive is full of things like that. Things that were here before the flame had a name. Vaelith knows. She files them and moves on. I'm still working out how she does that.",
      },
      effects: { set_flag: "pale_marked_old_sight" },
    },
  ],

  fallback:
    "That's how I know it's still there. It doesn't burn the same way anymore.",
};
