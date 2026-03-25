/**
 * Scar rooms — Zone 2 Verdant Scar escape path.
 * Used by /api/warden/flee for move resolution.
 * sewer_deep connects scar_breach to drain_entrance.
 */
export const SCAR_NODES = {
  sewer_deep: {
    name: "The Deep Passage",
    district: "The Undercity — Upper",
    description: "The passage narrows where the sewer meets something older. Stone gives way to fibrous tissue at the edges. The breach is east. The ladder up is behind you.",
    exits: { east: "scar_breach", up: "drain_entrance" },
    objects: {},
    items: [],
  },
  scar_breach: {
    name: "The Breach",
    district: "The Scar",
    description: "The hole is not architectural. The edges of it are wrong — stone bent rather than cut, older than the sewer around it. On the other side, the air changed. The walls here are fibrous, pale, and faintly pulsing.",
    exits: { west: "sewer_deep", north: "scar_outer_vein" },
    objects: {},
    items: [],
  },
  scar_outer_vein: {
    name: "The Outer Vein",
    district: "The Scar",
    description: "The passage narrows and curves, following a logic that is biological rather than architectural. The walls are dense with spore-veins, flickering in overlapping rhythms.",
    // west: scar_root_passage added dynamically when first_echo_triggered=1
    exits: { south: "scar_breach", east: "scar_echo_chamber" },
    objects: {},
    items: [],
  },
  scar_echo_chamber: {
    name: "The Echo Chamber",
    district: "The Scar",
    description: "A node where the spore-veins converge. The walls pulse in rhythm. Something below received the signal.",
    exits: { west: "scar_outer_vein", east: "scar_deep_membrane", south: "scar_graft_den" },
    objects: {},
    items: [],
  },
  scar_deep_membrane: {
    name: "The Deep Membrane",
    district: "The Scar",
    description: "The Scar's deepest outer layer — the tissue here is thickest, layered to a density that absorbs both sound and light.",
    exits: { west: "scar_echo_chamber", north: "scar_wound_floor", south: "scar_antechamber" },
    objects: {},
    items: [],
  },
  scar_antechamber: {
    name: "The Antechamber",
    district: "The Scar",
    description: "One room before the fragment. The Scar is quieter here — not peaceful, but conserving something.",
    exits: { north: "scar_deep_membrane", south: "scar_fragment_chamber" },
    objects: {},
    items: [],
  },
  scar_fragment_chamber: {
    name: "The Fragment Chamber",
    district: "The Scar",
    description: "A sphere of biological material, every surface smooth, every spore-vein converging on the object at the centre.",
    exits: { north: "scar_antechamber" },
    objects: {},
    items: [],
  },
  scar_wound_floor: {
    name: "The Wound Floor",
    district: "The Scar",
    description: "The floor here is soft — not dangerously, but enough that each step sinks slightly and releases a faint warmth.",
    exits: { north: "scar_root_passage", east: "scar_deep_membrane" },
    objects: {},
    items: [],
  },
  scar_root_passage: {
    name: "The Root Passage",
    district: "The Scar",
    description: "A narrow tunnel formed entirely from the Scar's biological material. The floor is covered in root-tendons that twitch occasionally underfoot.",
    exits: { east: "scar_outer_vein", south: "scar_wound_floor" },
    objects: {},
    items: [],
  },
  scar_graft_den: {
    name: "The Graft Den",
    district: "The Scar",
    description: "The Scar's attempt to process something it could not digest. Pale, fibrous forms press out from the tissue.",
    exits: { north: "scar_echo_chamber" },
    objects: {},
    items: [],
  },
};
