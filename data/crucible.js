/**
 * The Crucible — Ember Quarter Research Annex.
 * @see cursor_crucible_othorion_pip.md
 */

export const CRUCIBLE_ROOM = {
  name: "The Crucible",
  district: "Ember Quarter",
  description: "The Crucible is less a workshop and more a battlefield between ideas. Tables are crowded with half-disassembled artifacts, mechanical fragments, alchemical glassware, and stacks of parchment filled with tight, impatient handwriting. Charcoal diagrams cover the stone walls — containment circles, structural models of the city's foundations, sketches of sewer machinery that no longer exists. In the center of the room stands a heavy iron examination table surrounded by instruments that look part surgical, part arcane. Several items lie under glass domes, each labeled with neat brass tags. A small creature sits on the edge of the table. Pip. The creature tilts its head and raises one small arm and points at a cracked piece of stone mounted in a frame on the far wall. Othorion does not notice. He is busy arguing quietly with a notebook.",
  exits: { west: "ashen_sanctuary" },
  objects: {
    othorion: {
      desc: "Othorion — lean, relentless, and currently in the middle of a disagreement with a notebook. He does not look up immediately. When he does, his attention is complete and evaluating, the way a researcher looks at new data. He has the particular stillness of someone who has stopped being surprised by the city itself and is now only surprised by his own models of it being wrong.",
      actions: ["talk", "inspect"],
    },
    pip: {
      desc: "Pip sits on the edge of the table, watching the room with bright, attentive eyes. When you look at it, Pip raises one small arm and points toward the mounted stone fragment across the room. Othorion glances up briefly. \"Yes, yes, I know,\" he mutters. \"You're very helpful.\" He flips through a notebook. \"Familiar behavior inconsistent with any known arcane taxonomy.\" Pip continues pointing.",
      actions: ["inspect"],
    },
    examination_table: {
      desc: "The iron table is scratched and heat-scored from years of experiments. Straps hang from its sides — not for prisoners, but for holding unstable artifacts in place while Othorion works. The surface is covered in chalk notes written directly onto the metal. Several phrases repeat over and over: 'Containment response?' 'Structural resonance?' 'Why does it react to the sewer levels?'",
      actions: ["inspect"],
    },
    wall_diagrams: {
      desc: "The walls are layered with diagrams drawn over older diagrams. One series shows the sewer system as if it were part of a machine — pipes replaced with channels, chambers labeled as pressure regulators. Another shows the city itself drawn inside a massive circular sigil. Most of the notes beside it read simply: UNKNOWN PURPOSE.",
      actions: ["inspect"],
    },
    artifact_domes: {
      desc: "Several artifacts sit beneath glass domes with careful brass labels. Each label attempts to classify the item: RELIC — ORIGIN UNKNOWN. RELIC — SEWER STRUCTURAL COMPONENT. ARCANE FOCUS — PROBABLE. One dome has no label at all. Inside is a fragment of blackened metal that seems to absorb the room's light. The empty label beside it reads: Classification pending.",
      actions: ["inspect"],
    },
    othorion_notebook: {
      desc: "The notebook is filled with careful attempts to classify Pip. Several headings are crossed out. ARCANE FAMILIAR — rejected. ELEMENTAL FRAGMENT — rejected. ANOMALOUS CONSTRUCT — rejected. BOUND SPIRIT — rejected. The newest heading reads: 'Environmental Sensor?' Below it, Othorion has written the same note three times. 'It only reacts when something is wrong.'",
      actions: ["inspect", "read"],
    },
    stone_fragment: {
      desc: "A cracked piece of stone mounted in a brass frame. Thin lines are carved into the surface — not decorative, but precise. They resemble part of a larger sigil. Several of the carved lines glow faintly. Othorion has written a note beneath the frame. 'Found in sewer floor three.' Below it: 'Pip indicated it immediately.'",
      actions: ["inspect"],
    },
  },
  items: [],
};
