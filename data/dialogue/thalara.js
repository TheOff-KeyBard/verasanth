export const dialogue = {
  npc_id: "thalara",

  greeting: {
    default: "Come in carefully — I'm in the middle of something. What do you need?",
    conditional: [
      {
        requires_flag: "thalara_arc_2_active",
        text: "Good timing. I've been wanting to show you something. Close the door.",
      },
      {
        requires_flag: "has_corruption",
        text: "I can smell the residue on you. Don't touch anything. Sit on the stool and let me look at you first.",
      },
    ],
  },

  options: [
    {
      id: "thalara_browse",
      label: "What do you have?",
      requires_trust_min: 0,
      response:
        "Consumables on the left shelf. Reagents and extracts on the right. If you're selling, I'll look at what you've got.",
      followup: null,
      effects: null,
    },
    {
      id: "thalara_heal",
      label: "I need a cleansing tonic.",
      requires_trust_min: 0,
      response:
        "Twenty AM. Removes corruption residue. If you're not corrupted it'll just taste unpleasant. Worth having regardless.",
      followup: null,
      effects: null,
    },
    {
      id: "thalara_sewer",
      label: "Someone I know went into the sewer and didn't come back.",
      requires_trust_min: 0,
      response: "I know. They usually don't, eventually. How long has it been?",
      followup: {
        label: "Long enough that I'm asking you.",
        response:
          "Then I'm sorry. The sewer doesn't give things back easily. Sometimes it doesn't give them back at all. You can sit here as long as you need to.",
      },
      effects: null,
    },
    {
      id: "thalara_jars",
      label: "What are those jars labeled 'Iteration'?",
      requires_trust_min: 15,
      response:
        "Samples from different — periods. Different conditions in the city. I've been here through several of them. The city changes. I document what it leaves behind.",
      followup: {
        label: "How many iterations have there been?",
        response:
          "More than four. That's what the labels say. I don't remember all of them clearly. The earlier ones are like trying to remember a dream you had about another dream.",
      },
      effects: { set_flag: "thalara_arc_seed" },
    },
    {
      id: "thalara_drawing",
      label:
        "That drawing on your wall — the market square doesn't look like that from any angle I've found.",
      requires_trust_min: 25,
      requires_flag: "thalara_arc_seed",
      response:
        "No. It doesn't. I drew it from memory. The memory is from an earlier iteration — the city was arranged slightly differently then. More open in the center. Something happened and they closed it off. I don't remember what. Just the shape of what came before.",
      followup: {
        label: "Why do you stay, if you know this happens over and over?",
        response:
          "Because something keeps almost working. Each iteration gets a little further. I want to see what happens when it works.",
      },
      effects: { set_flag: "thalara_arc_2_active" },
    },
  ],

  fallback: "I'm not following you. Try me again when I'm not measuring something.",
};
