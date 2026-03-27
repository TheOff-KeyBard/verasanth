/**
 * Gautrorn Haargoth — Still Scale. Darmerian.
 * Flags: gautrorn_dreams_discussed, gautrorn_name_revealed,
 *        told_gautrorn_about_ledger (via player); ledger_gautrorn_confirmed (Seris).
 */

export const dialogue = {
  npc_id: "trader",

  greeting: {
    default: "The Scale doesn't tip itself. What do you need?",
    conditional: [
      {
        requires_flag: "told_gautrorn_about_ledger",
        text: "You came back. I thought you might. I've been thinking about what you told me. Haven't stopped.",
      },
      {
        requires_flag: "gautrorn_name_revealed",
        requires_flag_not: "told_gautrorn_about_ledger",
        text: "You look like someone carrying a question they haven't asked yet.",
      },
      {
        requires_flag: "guild_standing_lirael",
        text: "You've been spending time in the shadows. Smart. Or unlucky. Hard to tell yet.",
      },
    ],
  },

  options: [
    {
      id: "trader_goods",
      label: "What are you selling?",
      requires_trust_min: 0,
      response:
        "Rope. Oil. Tools. Spices. The things that keep you alive down there. Take a look.",
      followup: null,
      effects: null,
    },
    {
      id: "trader_scale",
      label: "What is this place?",
      requires_trust_min: 0,
      response:
        "The Still Scale. General goods. People pass through — traders, couriers, wanderers. Those who prefer not to be remembered. I don't ask which kind you are.",
      followup: null,
      effects: null,
    },
    {
      id: "trader_dreams_low",
      label: "Ask if he dreams.",
      requires_trust_min: 0,
      requires_flag_not: "gautrorn_dreams_discussed",
      response:
        "Dreams? Aye, I have them. Same as anyone. Storms, ships, nonsense. Nothing worth troubling a stranger with.",
      followup: {
        label: "Press him.",
        response:
          "Some dreams feel real. Doesn't make them so. Verasanth has a way of putting things in your head.",
      },
      effects: null,
    },
    {
      id: "trader_dreams_mid",
      label: "Ask about the coastline.",
      requires_trust_min: 15,
      requires_flag_not: "gautrorn_dreams_discussed",
      response:
        "I'll tell you something odd. Sometimes I dream of a coastline I've never walked. Smell salt on a wind that doesn't blow here. It lingers longer than it should.",
      followup: {
        label: "Ask what it feels like.",
        response:
          "Feels less like dreaming. More like remembering something I never lived.",
      },
      effects: { set_flag: "gautrorn_dreams_discussed", trust_delta: 1 },
    },
    {
      id: "trader_haargoth_run",
      label: "Ask about the trade route.",
      requires_trust_min: 25,
      requires_flag: "gautrorn_dreams_discussed",
      requires_flag_not: "gautrorn_name_revealed",
      response:
        "There's a name that comes back to me. Haargoth's Run. A trade route. I can see it clear as day — reefs, currents, markets along the shore. But it doesn't exist.",
      followup: {
        label: "Ask how he knows it doesn't exist.",
        response: "That's the part that doesn't sit right. I don't.",
      },
      effects: { trust_delta: 1 },
    },
    {
      id: "trader_ledger_dream",
      label: "Ask about the ledger he saw.",
      requires_trust_min: 35,
      requires_flag: "gautrorn_dreams_discussed",
      requires_flag_not: "gautrorn_name_revealed",
      response:
        "Last night... I saw a ledger. Not paper. Stone. Pages turning on their own. My name was already there. Before I was.",
      followup: {
        label: "Tell him it doesn't sound like madness.",
        response:
          "Or maybe the city remembers things before they happen. Tell me — does that sound like madness to you?",
      },
      effects: { set_flag: "gautrorn_name_revealed", trust_delta: 1 },
    },
    {
      id: "trader_told_ledger",
      label: "Tell him his name was in the ledger. Before he arrived.",
      requires_trust_min: 35,
      requires_flag: "ledger_gautrorn_confirmed",
      requires_flag_not: "told_gautrorn_about_ledger",
      response:
        "My name... written before I lived it? No. That's not how things work. I had a life. A crew. A sea I remember clear as day. Don't I?",
      followup: {
        label: "Wait for him to continue.",
        response:
          "Tell me something. When the ledger wrote my name... did it feel like it was remembering me? Or deciding I existed? If the city made me... then I'll make sure it doesn't get the last word.",
      },
      effects: { set_flag: "told_gautrorn_about_ledger", trust_delta: 2 },
    },
    {
      id: "trader_after_revelation",
      label: "Ask how he's been since.",
      requires_trust_min: 35,
      requires_flag: "told_gautrorn_about_ledger",
      response: "Same as always. Mostly.",
      followup: null,
      effects: null,
    },
  ],

  fallback: "The Scale remembers every face. Keep that in mind.",
};
