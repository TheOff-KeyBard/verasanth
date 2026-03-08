/**
 * Static dialogue lines from verasanth_expanded_npc_dialogue.md
 * Used as context-aware pools before LLM fallback in getNPCResponse
 */

export const NPC_DIALOGUE_LINES = {
  bartender: {
    greeting: [
      '"Door\'s open. Means you\'re alive."',
      '"Ale\'s warm. That\'s the best promise this city offers."',
      '"Sit down before the floor claims you."',
      '"You look like the stone woke you up hard."',
      '"Most folks stumble in here eventually."',
    ],
    observations: [
      '"Your boots say you\'ve been somewhere damp."',
      '"You carry sewer dust."',
      '"City\'s been restless today."',
      '"Something moved in the night."',
    ],
    sewer_return: [
      '"You went below. I can smell it."',
      '"That place keeps pieces of people."',
      '"Stone down there hears things."',
      '"You come back quieter each time."',
    ],
    violent_player: [
      '"Your shadow\'s grown heavier."',
      '"Some folks bring trouble with them."',
      '"City notices blood quicker than rain."',
    ],
    high_trust: [
      '"The ledger forgets things sometimes."',
      '"This city repeats itself."',
      '"If you start hearing whispers, come talk to me first."',
    ],
  },
  weaponsmith: {
    greeting: [
      '"Steel waits."',
      '"If you\'re buying, speak. If not, move."',
      '"Metal doesn\'t like hesitation."',
    ],
    crafting: [
      '"Good steel starts with good ore."',
      '"Bring me metal worth shaping."',
      '"Blades remember their makers."',
    ],
    sewer_materials: [
      '"That metal\'s wrong."',
      '"Where did you find this scrap?"',
      '"I\'ve seen iron like this once before."',
    ],
    corrupted_gear: [
      '"Take that cursed thing away from my forge."',
      '"I won\'t hammer something that screams."',
      '"Steel shouldn\'t feel alive."',
    ],
    high_trust: [
      '"One day I\'ll finish that blade."',
      '"Some weapons choose their moment."',
    ],
  },
  armorsmith: {
    greeting: [
      '"Turn around."',
      '"Let me see how the armor sits."',
      '"Armor tells truths."',
    ],
    observations: [
      '"Stone dust in your seams."',
      '"You\'ve been somewhere deep."',
      '"The city marks those who wander."',
    ],
    sewer_symbols: [
      '"You saw the markings."',
      '"Most don\'t notice."',
      '"They\'re warnings."',
    ],
    high_trust: [
      '"If the symbols stop appearing, turn back."',
      '"Someone carved them for a reason."',
    ],
  },
  herbalist: {
    greeting: [
      '"Sit before you collapse."',
      '"You look like you fought the city itself."',
      '"You\'re not dying yet."',
    ],
    potion: [
      '"Careful with that vial."',
      '"Some mixtures wake things."',
      '"Every remedy has a cost."',
    ],
    sewer_reactions: [
      '"You smell like deep water."',
      '"The sewer isn\'t meant to breathe like that."',
      '"Something down there changed."',
    ],
    high_trust: [
      '"Someone I knew went below."',
      '"If you see a broken lantern... leave it."',
    ],
  },
  othorion: {
    greeting: [
      '"Observation continues."',
      '"You again. Good."',
      '"Data improves with repetition."',
    ],
    sewer_return: [
      '"Your boots carry residue."',
      '"Hold still. I need to examine that."',
      '"Interesting contamination pattern."',
    ],
    artifact_detection: [
      '"That resonance is impossible."',
      '"You feel it too, yes?"',
      '"This object should not exist."',
    ],
    model_failure: [
      '"...That contradicts the data."',
      '"My projections were wrong."',
      '"This city refuses prediction."',
    ],
    pip: [
      '*Pip points toward the sewer entrance.*',
      '*Pip taps the table twice.*',
      '*Pip shrugs slowly.*',
      '*Pip nods once.*',
      '*Pip points at you, then at the ground.*',
    ],
  },
  warden: {
    greeting: [
      '"State your purpose."',
      '"Keep the peace."',
      '"Trouble ends badly here."',
    ],
    crime_reaction: [
      '"The ledger grows heavier."',
      '"Your name is appearing too often."',
      '"The city records everything."',
    ],
    honorable_player: [
      '"You keep your word."',
      '"Order suits you."',
    ],
    dangerous_player: [
      '"You\'re walking close to the edge."',
      '"Even the city has limits."',
    ],
  },
  curator: {
    greeting: [
      '"Ah, you return."',
      '"Did you bring something interesting?"',
      '"Your timing is acceptable."',
      '"Buying or browsing?"',
      '"Everything has value."',
      '"Trade keeps the city alive."',
    ],
    artifact_interest: [
      '"Fascinating."',
      '"You continue to surprise me."',
      '"This changes several assumptions."',
    ],
    player_questions_motives: [
      '"Motives are irrelevant."',
      '"Results are what matter."',
      '"Curiosity can be dangerous."',
    ],
    emotional_crack: [
      '"...That reaction was stronger than expected."',
      '"Interesting."',
    ],
    selling_items: [
      '"Yes, someone will buy this."',
      '"Rare goods travel far."',
      '"You won\'t find another offer like mine."',
    ],
    ominous: [
      '"You arrived sooner than most."',
      '"That item has history."',
    ],
  },
};

export const PIP_REACTIONS = [
  '*Pip points toward the sewer entrance.*',
  '*Pip taps the table twice.*',
  '*Pip shrugs slowly.*',
  '*Pip nods once.*',
  '*Pip points at you, then at the ground.*',
];

export const DYNAMIC_FLAVOR_LINES = [
  '"The city shifts when people sleep."',
  '"Some doors open twice."',
  '"Have you noticed the shadows moving wrong?"',
  '"Someone went missing again."',
  '"The sewer water rose last night."',
  '"Something echoed below the streets."',
];
