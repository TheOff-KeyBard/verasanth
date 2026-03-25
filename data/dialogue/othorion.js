export const dialogue = {
  npc_id: "othorion",

  greeting: {
    default: "Othorion. I'm cataloguing. If you need something specific, say so quickly.",
    conditional: [
      {
        requires_flag: "arc1_climax_reached",
        text: "You've changed. Not visually — structurally. Pip's been pointing at you since you walked in. He never points at the same person twice without reason.",
      },
      {
        requires_flag: "has_ashbound_resonance",
        text: "He's never done that before. Not once. He thinks you are the instability now. Or the key. I'm trying to determine which.",
      },
    ],
  },

  options: [
    {
      id: "othorion_appraise",
      label: "I need something appraised.",
      requires_trust_min: 0,
      response:
        "Twenty-five AM. I'll tell you the best buyer for whatever you've found. I don't deal in sentiment — I deal in optimal routing.",
      followup: null,
      effects: null,
    },
    {
      id: "othorion_structural",
      label: "Can you show me a sewer node on the map?",
      requires_trust_min: 0,
      response:
        "One ES. I can mark a node as discovered — you'll see it on your map without visiting. Worth it if you need to plan a route.",
      followup: null,
      effects: null,
    },
    {
      id: "othorion_pip",
      label: "What is Pip?",
      requires_trust_min: 0,
      response:
        "Unknown. I found it near the Crucible three months ago. It appears to be a constructed object of some kind — not biological, not quite mechanical in any framework I recognize. It points at things. I've been cataloguing what it points at.",
      followup: {
        label: "Have you found a pattern?",
        response:
          "Yes. That's the problem. The pattern is consistent with structural anomaly detection — the kind you'd use to find instability in a load-bearing system. I don't know what system. I don't know what the load is.",
      },
      effects: null,
    },
    {
      id: "othorion_city_data",
      label: "What have you found out about the city?",
      requires_trust_min: 15,
      response:
        "Too much and not enough. I've been cataloguing anomalies for two years. The anomaly rate is increasing. The city is stable by every metric I have. The anomaly rate is still increasing. Those two facts are contradictory and both are true. I find that professionally unsettling.",
      followup: {
        label: "What's causing the anomalies?",
        response:
          "Pip keeps pointing at the sewer. Specifically the lower floors. Specifically the chamber at the foundation. I haven't gone there yet. I'm still deciding if I want to be right about what I think is down there.",
      },
      effects: null,
    },
    {
      id: "othorion_collection",
      label: "Do you think the city collects people intentionally?",
      requires_trust_min: 30,
      requires_flag: "othorion_arc_seed",
      response:
        "Lirael's theory. Yes. I've been testing it. The data is consistent with deliberate collection — exceptional individuals arriving without clear memory of how, city mechanics subtly routing them toward specific roles. If it's intentional, the question is: intentional for what purpose?",
      followup: {
        label: "What do you think the purpose is?",
        response:
          "I think the city needs something that people carry. Not skills. Not knowledge. Something intrinsic. Soul-signatures, if you want to use an imprecise term. I'm still building the model. Pip finds this line of inquiry very interesting. He's been pointing at me since I started.",
      },
      effects: null,
    },
  ],

  fallback: "I need more information to respond to that. Be specific.",
};
