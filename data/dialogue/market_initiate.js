export const dialogue = {
  npc_id: "market_initiate",

  greeting: {
    default: "How do they do that?",
    conditional: [
      {
        requires_flag: "guild_standing_lirael",
        requires_flag_not: null,
        text: "You've already done Lirael's trial. I keep watching how you move through the room. I can't tell if you planned it or just — went.",
      },
    ],
  },

  options: [
    {
      id: "market_initiate_do_what",
      label: "Do what?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Both of them. At the same time.",
      followup: {
        label: "How?",
        response:
          "One's already clocked every exit before they sit down. The other was through the door before I saw them move. I can't tell which one I'm supposed to be learning.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "market_initiate_difference",
      label: "What's the difference between them?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "One of them owns the situation. The other one slips through it.",
      followup: {
        label: "Which is harder?",
        response:
          "I keep trying to do both and ending up doing neither.",
      },
      effects: { trust_delta: 2 },
    },
    {
      id: "market_initiate_lirael",
      label: "What does Lirael say?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Not much. She watches.",
      followup: {
        label: "Anything else?",
        response:
          "Once she told me: 'The Market teaches you what works for you. Not what works.' I've been trying to figure out what that means ever since.",
      },
      effects: null,
    },
    {
      id: "market_initiate_leaning",
      label: "Which way are you leaning?",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Quickstep, if I'm honest. Planning makes me freeze.",
      followup: {
        label: "But?",
        response:
          "But then I watch the operative miss something because they didn't move fast enough and I think — maybe I just need to get better at both.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "market_initiate_hardest",
      label: "What's the hardest part?",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "The pace.",
      followup: {
        label: "What about the pace?",
        response:
          "Everything in the Market is already happening. You're never at the start of something. You're always in the middle of it.",
      },
      effects: null,
    },
  ],

  fallback: "Still working it out. Faster than yesterday, at least.",
};
