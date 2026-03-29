export const dialogue = {
  npc_id: "grommash",

  greeting: {
    default: "Warden's post. State your business.",
    conditional: [
      {
        requires_flag: "cinder_cells_escaped",
        text: "You've got a lot of nerve. I should put you back in. I won't. But I should.",
      },
      {
        requires_flag: "has_active_bounty",
        text: "You've got heat on you. I can see it. You've got one chance to tell me what happened before I make a decision about what to do with you.",
      },
      {
        requires_crime_heat_min: 8,
        text:
          "You have a lot of nerve walking up to this post.\n\nI'm going to need you to think very carefully about your next move.",
      },
      {
        requires_crime_heat_min: 5,
        text:
          "There's paper on you.\n\nYou know what that means. Don't make this harder than it needs to be.",
      },
      {
        requires_crime_heat_min: 2,
        text: "Your name's come up.\n\nNot officially. Not yet.",
      },
    ],
  },

  options: [
    {
      id: "grommash_inquiry",
      label: "I'm looking for someone who was brought in.",
      requires_trust_min: 0,
      response:
        "I run a clean operation. If they're here, they're here legally. If they're not here, they weren't brought in. The ledger doesn't lie.",
      followup: {
        label: "What if the ledger is wrong?",
        response: "The ledger is truth. That's the end of that conversation.",
      },
      effects: null,
    },
    {
      id: "grommash_heat",
      label: "I have some heat on me. What happens now?",
      requires_trust_min: 0,
      response:
        "Depends on how much and what kind. City Watchers bring you in, you get processed. Bounty brings you in, you get processed and whoever posted gets their escrow. Either way, you end up here until we sort it out.",
      followup: null,
      effects: null,
    },
    {
      id: "grommash_clear_heat",
      label: "I want to clear my record.",
      requires_trust_min: 0,
      requires_crime_heat_min: 2,
      response: "You want this cleaned up.",
      followup: {
        label: "What will it take?",
        response:
          "That's going to cost you. And it doesn't erase what you did — it just means the city stops looking for you. For now.",
      },
      effects: null,
    },
    {
      id: "grommash_heat_source",
      label: "What's generating the heat in the cells? It doesn't feel like a furnace.",
      requires_trust_min: 20,
      response:
        "It's not. I've looked. The heat comes from below the foundation stones — predates the cells by a long way. Whatever it is, it was here before I started building. I built around it because it was useful. I don't ask questions about things that are useful.",
      followup: {
        label: "Have you tried to find the source?",
        response:
          "I dug down once. Twenty feet. The heat got stronger. I stopped digging. Some things you don't need to find the bottom of.",
      },
      effects: null,
    },
    {
      id: "grommash_truth_rune",
      label: "That rune in the pit — did you install that?",
      requires_trust_min: 25,
      response:
        "No. Found it. The pit was already carved in the right shape when I got here. The rune was already there, cut into the floor. I asked a few people what it meant. Nobody had a clear answer. It pulses when someone in the pit lies. I find that useful.",
      followup: {
        label: "What if they're not lying but they're wrong?",
        response:
          "Hasn't happened yet. Or if it has, the rune didn't distinguish. I choose to take that as consistent.",
      },
      effects: { set_flag: "grommash_rune_discussed" },
    },
    {
      id: "grommash_purpose",
      label: "Do you know what you're actually guarding here?",
      requires_trust_min: 40,
      requires_flag: "grommash_rune_discussed",
      response:
        "The prisoners. The city's order. The ledger. That's the job.",
      followup: {
        label: "What if the job is something else and you don't know it?",
        response:
          "Then I'm doing it well enough that I don't need to know. The ledger says what it says. The heat does what it does. I keep the post. That's enough.",
      },
      effects: null,
    },
  ],

  fallback: "Say what you mean. I don't have time for riddles.",
};
