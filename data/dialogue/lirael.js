export const dialogue = {
  npc_id: "lirael",

  greeting: {
    default: "You move like someone with questions.",
    conditional: [
      {
        requires_flag: "has_ashbound_resonance",
        requires_flag_not: null,
        text: "That tone you're carrying? The Market hears it. Doors shift when you walk by.",
      },
      {
        requires_flag: "has_corruption",
        requires_flag_not: null,
        text: "Shadow on your heels. Not Covenant work. Something older. Don't let it settle.",
      },
      {
        requires_flag: "guild_standing_lirael",
        requires_flag_not: null,
        text: "You're moving cleaner. Less noise. Good. The Market likes quiet feet.",
      },
    ],
  },

  options: [
    {
      id: "lirael_information",
      label: "Ask about information in the Market",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "Information's a currency. Most people spend it without realizing.",
      followup: null,
      effects: null,
    },
    {
      id: "lirael_doors",
      label: "Ask how doors open here",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response: "Doors open for those who know where to stand. Or who to watch.",
      followup: null,
      effects: null,
    },
    {
      id: "lirael_market_visibility",
      label: "Ask what the Market hides",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "The Market doesn't hide things. It just shows them to the right people.",
      followup: null,
      effects: null,
    },
    {
      id: "lirael_reading_people",
      label: "Ask what she notices about people",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "You can tell a lot about someone by how they enter a room. You… hesitate.",
      followup: null,
      effects: null,
    },
    {
      id: "lirael_watchers",
      label: "Ask about the Watchers",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If a Watcher looks at you twice, leave. If it looks at you once too long, run.",
      followup: null,
      effects: null,
    },
    {
      id: "lirael_collection",
      label: "Ask about the city collecting people",
      requires_trust_min: 15,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "The city collects exceptional people. I don't know why. I just know the pattern.",
      followup: {
        label: "Press her on why",
        response: "If I knew that, I'd be somewhere safer. Or nowhere at all.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "lirael_not_accident",
      label: "Ask if being here is coincidence",
      requires_trust_min: 20,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "You're not here by accident. None of us are. Some of us just notice sooner.",
      followup: null,
      effects: null,
    },
    {
      id: "lirael_guided_alleys",
      label: "Ask about the alleys guiding people",
      requires_trust_min: 25,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      response:
        "If you ever feel like the alleys are guiding you, don't panic. That means you're interesting.",
      followup: null,
      effects: null,
    },
    {
      id: "lirael_grief_surface_echo",
      label:
        "You read people quickly. What do you see when someone's carrying grief?",
      requires_trust_min: 0,
      requires_flag: "lifebinder_grief_surface",
      requires_flag_not: null,
      requires_level_min: null,
      response: "Timing.",
      followup: {
        label: "Timing how?",
        response:
          "Grief slows some people. Speeds others. Makes them reach too soon or not at all.\n\nYou've been near someone who held on too tightly. I can see it in how you watch the exits — like you're waiting for someone who isn't coming back.\n\nDon't let it choose your moment for you.",
      },
      effects: null,
    },
    {
      id: "lirael_hesitation_cost_echo",
      label: "Ever hesitated at the wrong moment?",
      requires_trust_min: 0,
      requires_flag: "banner_bruiser_hesitation_cost",
      requires_flag_not: null,
      requires_level_min: null,
      response: "Once.",
      followup: {
        label: "And after?",
        response:
          "Everyone does. The trick is not pretending it didn't happen.\n\nYou've spoken to someone who learned that lesson the hard way. I can see it — the way you check the gap before you move.\n\nGood. Just don't let the memory of the miss slow you down.",
      },
      effects: null,
    },
    {
      id: "lirael_banner_standing_echo",
      label: "Do you read Banner-trained fighters differently?",
      requires_trust_min: 0,
      requires_flag: null,
      requires_flag_not: null,
      requires_level_min: null,
      requires_guild_standing_key: "broken_banner",
      requires_guild_standing_min: 3,
      response: "Yes. You commit.",
      followup: {
        label: "Is that a problem?",
        response:
          "Most people I work with stay fluid — keep options open. You've trained the hesitation out. That's impressive. It also means I can see exactly what you're about to do.",
      },
      effects: null,
    },
  ],

  fallback: "If you're not buying or running, you're wasting daylight.",
};
