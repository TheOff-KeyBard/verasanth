/**
 * Guild rooms — Ashen Archive, Broken Banner, Quiet Sanctum, Veil Market,
 * Umbral Covenant, Stone Watch. From cursor_guild_npcs_v2.md
 */

export const GUILD_ROOMS = {
  ember_quarter_south: {
    name: "Ember Quarter — South End",
    district: "Ember Quarter",
    description: "The southern end of the Ember Quarter, where the district narrows between older buildings. The architecture here is darker than the road above — the stonework denser, the windows higher and narrower. Ash drifts in the air with a deliberateness that has nothing to do with wind. At the far end of the lane, a structure rises above the roofline like the skeleton of something that refused to fall. The Archive. Its doors are visible from here. The warmth it radiates reaches you before you can read the runes on the entrance.",
    exits: { north: "east_road", south: "ashen_archive_entrance", east: "crucible" },
    objects: {
      ash_drift: { desc: "The ash here moves in the wrong direction — drifting upward in slow spirals rather than settling. It has been doing this long enough that the residents of the lane no longer look up.", actions: ["inspect"] },
      archive_silhouette: { desc: "The Archive's upper towers are visible above the roofline, dark volcanic stone against the sky. The red glow of the windows is constant — never brighter, never dimmer. Whatever burns inside has been burning a very long time.", actions: ["inspect"] }
    },
    items: []
  },

  ashen_archive_entrance: {
    name: "The Ashen Archive — Entrance",
    district: "Ember Quarter",
    description: "The Archive rises from the Ember Quarter like the blackened skeleton of a cathedral that refused to collapse. Dark volcanic stone veined with red glass windows that glow without any visible flame. Ash drifts from the upper towers on a wind that exists only here. The massive entrance doors are carved with spiral runes — fire becoming ash becoming something the rune-carver ran out of language for. The air radiates unnatural warmth. A concealed spiral stair behind a scorched stone relief leads into the Archive's lower halls.",
    exits: { north: "ember_quarter_south", down: "ashen_archive_hall" },
    objects: {
      carved_doors: { desc: "Spiral runes from floor to lintel — fire becoming ash becoming something unnamed. The stone around the frame is warmer than the stone beside it. Warmer than the Archive's general warmth. Something specific is behind these doors.", actions: ["inspect"] },
      scorched_relief: { desc: "A stone relief panel beside the entrance — a burning figure, arms raised, face worn smooth by contact rather than time. Behind it, when you press the right stone, a spiral stair descends. Someone built this to look accidental. It is not.", actions: ["inspect", "press"] }
    },
    items: []
  },

  ashen_archive_hall: {
    name: "The Ashen Archive — Ember Hall",
    district: "Ember Quarter",
    description: "The heart of the Archive. A vast circular chamber where ash particles float through shafts of ember-light without settling. A suspended iron brazier holds a flame that has apparently never gone out and never grown. Shelves curve along the walls between sealed vault doors. Scholars move through the room with the careful economy of people who have learned what happens when they don't. The air is warm, dry, and tastes faintly of old paper and hot metal. Vaelith Xyrelle works at a long stone table near the brazier, reading something she turns face-down as you approach.",
    exits: { up: "ashen_archive_entrance" },
    objects: {
      vaelith: { desc: "Vaelith Xyrelle — tall, ash-grey skin marked with ember-colored sigils that shift faintly when she moves. Soot-black robes threaded with copper filaments. A ritual brand across her collarbone shaped like a burning spiral. She does not look up immediately. When she does, her attention is complete and slightly uncomfortable, like being the subject of an experiment you were not consulted about.", actions: ["talk", "inspect"] },
      eternal_brazier: { desc: "An iron brazier suspended from the ceiling by four chains, holding a flame that burns without fuel and without variation. The heat is real. The light angles slightly wrong. The chain anchor points have been recently checked — fresh stone dust around each one.", actions: ["inspect"] },
      archive_shelves: { desc: "Bound volumes, clay tablets, sealed metal cylinders, and objects filed like books. Some are chained shut. Some are labeled in a script that rearranges slightly each time you look away. One shelf near the sealed vault is notably empty — the hooks still present, the dust line around where things sat still sharp.", actions: ["inspect", "browse"] }
    },
    items: []
  },

  threshold_road: {
    name: "Threshold Road — Eastern Approach",
    district: "Threshold District",
    description: "The road that cuts northeast from the main district toward the Watch fortress. The cobblestones here are larger and more deliberate than elsewhere — built to carry heavy loads, heavy armor, heavy things that needed moving without questions. Stone towers are visible ahead, banners hanging still in air that should be moving them. The road is empty in the way of places under active surveillance. Whatever patrols this stretch has already seen you.",
    exits: { southeast: "north_road", north: "stone_watch_gate" },
    objects: {
      watch_towers: { desc: "The towers above the Watch gate are occupied — you can see the movement of figures in the high windows, the methodical rotation of someone doing a job they have been doing long enough to do it without thinking. They have noted your presence. You can tell because nothing changed.", actions: ["inspect"] },
      heavy_paving: { desc: "The stones here are twice the thickness of the market district's cobbles. This road was built for siege equipment, prisoner transport, and things heavier than both. It has seen all three.", actions: ["inspect"] }
    },
    items: []
  },

  stone_watch_gate: {
    name: "The Stone Watch — Gate",
    district: "Threshold District",
    description: "Built directly into Verasanth's outer defensive wall. Massive iron gates, held at sixty degrees open — not from negligence, from policy. Stone towers fly the Watch banner. The building is less a guild hall and more the thing preventing the city from learning what it would do without it. The guards at the gate look at you the way professionals look at things that have not yet been categorized.",
    exits: { south: "threshold_road", in: "stone_watch_hall" },
    objects: {
      iron_gates: { desc: "Twice your height, held open at a fixed angle by a mechanism that could close them in under a minute if the order came. The closing wheel has never been used. The grease on it is a formality maintained by someone who understands that formalities exist to prevent the moment when they are needed.", actions: ["inspect"] },
      watch_banners: { desc: "Stone Watch banners on each tower — grey field, a single vertical line. Not a sword, not a shield. A wall. The symbol is older than the current Watch and predates whatever the Watch replaced.", actions: ["inspect"] }
    },
    items: []
  },

  stone_watch_hall: {
    name: "The Stone Watch — Shield Hall",
    district: "Threshold District",
    description: "Long stone corridors. Footsteps somewhere else in the fortress, always. The smell of oil and polished metal. Wardens rotate through in pairs exchanging shorthand you lack the context for. The Shield Hall has formation marks worn into the stone — centuries of refinement in where to stand, how to hold a line. Rhyla Thornshield reviews patrol reports at a standing desk. She finishes the line she is reading before she looks up.",
    exits: { out: "stone_watch_gate" },
    objects: {
      rhyla: { desc: "Rhyla Thornshield — compact, powerful, every movement deliberate. Armor of steel plates reinforced with rune-carved stone. A tower shield etched with defensive runes against the wall beside her. Braided beard threaded with iron rings marking past battles. Her assessment of you takes under two seconds. Whatever she concluded, she keeps it.", actions: ["talk", "inspect"] },
      formation_marks: { desc: "Positions worn into the stone floor — for two, four, eight people. The marks have been revised over time; an older set of positions is visible beneath the current ones, slightly different angle. Someone has been teaching people how to hold this specific line for longer than the current Watch has existed.", actions: ["inspect"] },
      patrol_board: { desc: "Patrol routes, incident logs, deployment maps. In the lower right corner, circled twice in a way that is quieter than the rest of the board — not flagged, not colored, just noted separately. Whatever it describes has not been shared with the wider Watch.", actions: ["inspect", "read"] },
      foundation_seam: { desc: "Worn symbol near the base of a load-bearing wall, partially erased. Same style as the marks in Veyra's shop.", actions: ["inspect"] }
    },
    items: []
  },

  broken_banner_gate: {
    name: "The Broken Banner — Gate",
    district: "Pale Rise",
    description: "A former military fortress in Pale Rise, built into the hillside. Thick stone walls. Old battle standards hang from the ramparts — many torn, many burned. At the entrance, a massive banner split cleanly down the middle. Not age. Something cut this in one stroke. Garruk kept both halves and hung them here. The training courtyard beyond is never quiet.",
    exits: { south: "west_road", in: "broken_banner_yard" },
    objects: {
      split_banner: { desc: "Two halves of a heavy military banner, each hanging from its own iron rod. The fabric around the split is still strong — whatever cut this banner did it cleanly and without effort. Both halves have been here long enough that the iron rods have oxidized to the same shade. Garruk did not just keep them. He preserved them.", actions: ["inspect"] },
      gate_arch: { desc: "The arch over the entrance is marked with accumulated signatures — fighters who passed through and came back. Some in paint, some in blood, all deliberate. The oldest marks at the top have been carved deeper by the weather into something that no longer looks like names.", actions: ["inspect"] }
    },
    items: []
  },

  broken_banner_yard: {
    name: "The Broken Banner — Training Yard",
    district: "Pale Rise",
    description: "A massive open arena — weapon racks, training dummies worked past their original shape, sparring circles ground into stone. The air smells of sweat and iron and forge smoke from the workshop at the east end. Recruits run drills under veterans who correct with one word. Nothing here is for show. Garruk Stonehide stands at the edge of the main sparring circle watching a bout with the patience of someone who already knows how it ends.",
    exits: { out: "broken_banner_gate" },
    objects: {
      garruk: { desc: "Garruk Stonehide — massive in the Silth way, layered bone and muscle under scarred armor maintained with care that borders on ritual. The tattered banner across his shoulders. Ritual combat scars on his skin. He does not look up from the bout when you enter. When he does look up, his assessment takes one second and he keeps the conclusion.", actions: ["talk", "inspect"] },
      sparring_circles: { desc: "Three rings in the stone, different sizes. The stone in the largest ring is stained darker than the rest — years of contact. A fighter is down in it now. The instructor above them is saying nothing. That is worse.", actions: ["inspect"] },
      weapon_racks: { desc: "Swords, axes, spears, training blades, and several weapons modified by their last user into something more specific to how they fight. Every weapon is sharp. Nothing is decorative.", actions: ["inspect", "browse"] }
    },
    items: []
  },

  quiet_sanctum_entrance: {
    name: "The Quiet Sanctum",
    district: "Ember Quarter",
    description: "The Sanctum sits beside the Ashen Sanctuary like a smaller temple grown from the same stone. Warm lantern light from tall arched windows. The air smells of herbs, incense, and clean linen. Visitors lower their voices without deciding to. The room is never empty but the noise people make here is absorbed rather than reflected. Brother Halden Marr moves between those present with the unhurried attention of someone who has learned that presence is itself a form of treatment. He notices you before you speak.",
    exits: { south: "ashen_sanctuary" },
    objects: {
      halden: { desc: "Brother Halden Marr — silver hair close-cropped, deep lines in a face that bitterness has not hollowed. Simple ash-grey robes. A cracked prayer focus on a retied cord. His hands emit faint golden warmth when still. He looks at you with the full attention of someone who has already decided you are worth his time.", actions: ["talk", "inspect"] },
      healing_pool: { desc: "A naturally heated spring in the back alcove — smooth stone, warm water with a faint glow that has nothing to do with the lanterns. Several people sit near it without touching it. Proximity alone does something. The stone around the spring is the same age as the Sanctuary next door. Halden did not build this. He found it and stayed.", actions: ["inspect"] },
      lantern_cloister: { desc: "A covered courtyard through an arched doorway — apprentices practicing something that looks like reaching without moving. The lanterns burn warmer here than in the main room. A color that makes the people near them look better than they did a moment ago.", actions: ["inspect"] }
    },
    items: []
  },

  veil_market_surface: {
    name: "The Veil Market — Surface",
    district: "Low Quarter",
    description: "From the street it looks like a cluster of Low Quarter stalls — spices, cloth, trinkets, nothing worth a second look. You would walk past it. That is the point. Between two stalls, a gap in the wall narrows to a passage. At the end, a heavy curtain. Behind it, stairs going down. You would not have found this without knowing where to look. That is also the point.",
    exits: { north: "south_road", down: "veil_market_hidden" },
    objects: {
      market_stalls: { desc: "Spices with no labels. Cloth that shifts color in different light. Small carved objects that may be decorative. The vendors make brief eye contact and then don't. They are doing two things at once. The second thing is not selling you anything.", actions: ["inspect", "browse"] },
      hidden_passage: { desc: "The gap between two stalls is exactly wide enough to walk through sideways. The wall at the end looks solid until you notice the curtain's edge. Behind it, stairs going down. The curtain is recent. The stairs are not.", actions: ["inspect", "enter"] }
    },
    items: []
  },

  veil_market_hidden: {
    name: "The Veil Market — The Hidden Bazaar",
    district: "Low Quarter",
    description: "Lanterns in narrow corridors below the Low Quarter. Conversations in whispers. Shadows move along the walls as figures slip between exits that are not exits until someone shows you how they work. The smell of spices, smoke, and things that did not arrive through any official channel. Lirael Quickstep is at a table at the back of the room with nothing on it, watching you arrive with the attention of someone who knew you were coming before you did.",
    exits: { up: "veil_market_surface" },
    objects: {
      lirael: { desc: "Lirael Quickstep — long pale hair in a loose braid, dark layered leathers, a cloak with more pockets than any legitimate use would require, silver rings on nearly every finger. Her eyes are sharp and in constant motion. She appears relaxed. She is not relaxed. She sets down what she was reading before you can see it and smiles with the warmth of someone who already knows what you want.", actions: ["talk", "inspect"] },
      ledger_room: { desc: "A small chamber off the main room — just visible through a doorway. Table, two chairs, lamp, a shelf of records organized in a system no outsider would parse. The records go back further than the Low Quarter has officially existed. Lirael does not invite you in.", actions: ["inspect"] },
      slipway: { desc: "A rooftop agility course visible through a narrow window above — beams, drops, angled surfaces, all in near-darkness. Three figures running it without slowing. One drops from a height that should matter more than it does.", actions: ["inspect"] }
    },
    items: []
  },

  umbral_covenant_descent: {
    name: "The Umbral Covenant — Descent",
    district: "Pale Rise",
    description: "No surface structure. Access through a stairway beneath Pale Rise that most people walk past without seeing. Descending feels like entering another place — not dramatic, just a change in the air partway down, and after the change you understand that the air above was doing something for you that air does not normally do, and now it has stopped. The walls transition from cut stone to something older and less cut. Violet light from below. The feeling of being watched, which Covenant members will tell you is correct.",
    exits: { up: "west_road", down: "umbral_covenant_hall" },
    objects: {
      stairway_walls: { desc: "Cut stone in the upper section — ordinary, recent. Halfway down, the material changes: darker, too smooth to be worked, as if it was always this way. The transition is precise. Whoever built the stairs knew exactly where old ended and new began.", actions: ["inspect"] },
      voidcrystals: { desc: "Small crystals set into the wall at irregular intervals, emitting faint violet light. Not warm. Not cold. Pressing your hand near one produces a sensation that is not temperature — something adjacent to it. Your body does not have a word for it.", actions: ["inspect"] }
    },
    items: []
  },

  umbral_covenant_hall: {
    name: "The Umbral Covenant — The Gloom Hall",
    district: "Pale Rise",
    description: "Carved directly into the bedrock beneath the city. Halls lit by voidcrystals in faint violet. Shadows stretch unnaturally — longer than the light sources would produce, bending at wrong angles. Some corridors seem longer than they should be. Something is watching you. Serix Vaunt stands in the center of the Gloom Hall as if placed there, waiting without impatience for however long it took.",
    exits: { up: "umbral_covenant_descent" },
    objects: {
      serix: { desc: "Serix Vaunt — deep hood of black velvet, faint cracks of violet light across the skin beneath as though something presses outward. Horns curving back, etched with runic carvings. Robes that absorb nearby light. When he moves, the air cools slightly. His voice is soft, deliberate, and makes you want to choose your words carefully.", actions: ["talk", "inspect"] },
      void_mirror: { desc: "A black ritual pool set into the floor. Surface perfectly still, reflecting the violet light. Your reflection looks back correctly. Then it looks slightly left of where you are standing. You move. It does not immediately follow.", actions: ["inspect"] },
      gloom_shadows: { desc: "The shadows in this room do not correspond to anything casting them. They move slowly — not dramatically, just not being where they were. Covenant members pass through them without acknowledgment. Either they have learned not to notice or they have learned something worse.", actions: ["inspect", "look"] }
    },
    items: []
  }
};
