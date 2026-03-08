export const BOARD_NPC_REACTIONS = {
  bartender:   "\"The board's been here longer than the square. Don't think too hard about it.\"",
  weaponsmith: "\"I've seen notices appear while no one was near it. I stopped asking why.\"",
  armorsmith:  "\"If a notice feels wrong, ignore it. The board has moods.\"",
  herbalist:   "\"It posts what it needs to. Or what the city needs. Hard to tell the difference.\"",
  curator:     "\"The board and I have an understanding. It posts. I read.\"",
  othorion:    "\"The board reflects the city's stated concerns. I track what the city hasn't named yet.\"",
  vaelith:     "\"The board posts what the city wants found. And what it has not yet decided to forget.\"",
  garruk:      "\"Read it. Then decide if it's worth the risk.\"",
  halden:      "\"Some of those notices are older than the city admits. The ink does not fade here.\"",
  lirael:      "\"I read it before the ink dries. It helps.\"",
  serix:       "\"The board and the city share an understanding. So do I.\"",
  rhyla:       "\"We post our own notices. The board posts others. I watch both.\"",
};

export function boardNPCReaction(npcId) {
  return BOARD_NPC_REACTIONS[npcId] || "They glance at the board and say nothing.";
}

export const SERIS_NOTICES = {
  early: [
    { title: "MATERIALS SOUGHT", body: "Seeking vermin carapaces. Condition irrelevant. Payment fair.\n\n— Unsigned" },
    { title: "STONES THAT HUM", body: "Looking for stones that produce sensation when held. Not warmth. Not vibration. Something else.\n\n— Unsigned" },
  ],
  mid: [
    { title: "DEEP-LAYER MOSS", body: "Samples from the lower tunnels. Bring what you find.\n\n— Unsigned" },
    { title: "URGENT: DASK BADGE", body: "If you find it, bring it immediately. Do not keep it. Do not show others first.\n\n— Unsigned" },
  ],
  late: [
    { title: "SOMETHING HEAVY", body: "Objects heavier than they should be — do not keep them. Bring them to the stall.\n\n— Unsigned" },
    { title: "THE SINGING", body: "If you hear singing in the dark, follow only long enough to retrieve what sings.\n\n— Unsigned" },
  ],
};

export const FLAVOR_NOTICES = [
  { title: "LOST BOOT", body: "Lost: one boot. Found: one rat wearing a boot.\nContact the inn if you can explain this." },
  { title: "SPARRING PARTNER", body: "Sparring partner sought. Must not cry easily." },
  { title: "MUSHROOMS FOR SALE", body: "Mushrooms for sale. Probably safe. Tested on myself. Still here." },
  { title: "RATS ATE JORIN", body: "RATS ATE JORIN. DON'T BE JORIN." },
  { title: "MISSING CAT", body: "Missing: one grey cat. Last seen near the sewer grate. Please do not look too hard." },
];

export const ANONYMOUS_NOTICES = [
  "The walls moved again.",
  "Do not trust the quiet.",
  "If the grate rattles, leave the square.",
  "The dog knows.",
  "The city remembers you.",
  "Count the doors. Count them again.",
  "He is not what he seems.",
];

export const IMPOSSIBLE_TEMPLATES = [
  "Welcome, {name}.",
  "You died last night. Be careful today.",
  "The mountain is listening.",
  "Do not go to the atelier today.",
  "{name}. We remember you.",
  "You were here before.",
  "You are not the first {name} to stand here.",
  "Something followed you here. It is still here.",
  "If you feel watched, you are.",
];
