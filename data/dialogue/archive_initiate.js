export const dialogue = {
  npc_id: "archive_initiate",

  greeting: {
    default: "Do you hear that?",
    conditional: [
      {
        requires_flag: "guild_standing_vaelith",
        requires_flag_not: null,
        text: "You've been through Vaelith's trial. I keep standing outside the door. I'm not sure if I'm waiting until I'm ready or waiting to find out if I ever will be.",
      },
    ],
  },

  options: [
    {
      id: "archive_initiate_hear",
      label: "Hear what?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "I don't know. It's not sound exactly.",
      followup: {
        label: "Then what is it?",
        response:
          "It's more like — the Archive is between words. And occasionally it uses one.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "archive_initiate_drew",
      label: "What drew you to the Archive?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "I had a memory that wasn't mine.",
      followup: {
        label: "What kind of memory?",
        response:
          "Not a dream. A memory. Clear, specific, wrong. I came here because I thought someone would tell me where it came from. Vaelith said: 'Good. Hold onto it.' That's all.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "archive_initiate_two_sides",
      label: "What do you make of the two sides?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "One of them thinks you can hold the flame still enough to understand it. The other thinks understanding it means letting it move through you.",
      followup: {
        label: "Which is right?",
        response:
          "I think they're both describing the same thing. I think that's the part neither of them will say out loud.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "archive_initiate_inside",
      label: "What does the Archive feel like from inside?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Like something is remembering through the shelves. Not us — something older, using the space we occupy to hold a thought it had before we arrived.",
      followup: {
        label: "What did Vaelith say?",
        response:
          "I mentioned that to Vaelith. She didn't look surprised. She said: 'Yes. Try not to interrupt it.'",
      },
      effects: null,
    },
  ],

  fallback: "I'm still listening. I think that might be the whole point.",
};
