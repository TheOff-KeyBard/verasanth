/**
 * Equipment system — slot model, stat keys, schema, sewer gear catalog.
 * @see verasanth_equipment_system_blueprint.md
 */

// ── Slot model ─────────────────────────────────────────────────────────────
export const EQUIPMENT_SLOTS = [
  "weapon_main",
  "weapon_offhand",
  "head",
  "chest",
  "hands",
  "legs",
  "feet",
  "cloak",
  "ring_1",
  "ring_2",
  "charm",
  "relic",
];

/** Legacy 3-slot → new slot mapping for migration. */
export const LEGACY_SLOT_MAP = {
  weapon: "weapon_main",
  armor: "chest",
  shield: "weapon_offhand",
};

// ── Stat modifier keys ─────────────────────────────────────────────────────
export const EQUIPMENT_STAT_KEYS = [
  "max_hp",
  "max_stamina",
  "melee_power",
  "ranged_power",
  "spell_power",
  "healing_power",
  "accuracy",
  "defense",
  "dodge",
  "block_value",
  "crit_chance",
  "crit_damage",
  "initiative",
  "perception",
  "carry_capacity",
  "resist_poison",
  "resist_bleed",
  "resist_fire",
  "resist_shadow",
];

/** Default zero stat modifiers object. */
export function createEmptyStatModifiers() {
  const mod = {};
  for (const k of EQUIPMENT_STAT_KEYS) mod[k] = 0;
  return mod;
}

/** Create empty loadout: slot -> null. */
export function createEmptyEquipmentLoadout() {
  const loadout = {};
  for (const slot of EQUIPMENT_SLOTS) loadout[slot] = null;
  return loadout;
}

// ── Instinct gear affinities (bonuses/penalties by tag) ──────────────────────
// Phase 1: tuned entries for six “root” instincts; same-guild alts use empty fallback until extended.
// Phase 2 (TODO): add rows for pale_marked, lifebinder, quickstep, war_forged, grave_whisper, sentinel + new ids.
export const INSTINCT_AFFINITIES = {
  ironblood: {
    tag_bonuses: {
      heavy:       { defense: 2, max_hp: 4 },
      heavy_armor: { defense: 3, block_value: 1 },
      two_handed:  { melee_power: 3 },
    },
    tag_penalties: {
      stealth:     { dodge: -2, initiative: -1 },
      light_blade: { melee_power: -1 },
      arcane:      { spell_power: -2 },
    },
    preferred_slots: ["weapon_main", "chest", "weapon_offhand"],
    avoid_slots: ["cloak", "charm"],
  },
  streetcraft: {
    tag_bonuses: {
      light_blade: { crit_chance: 2, initiative: 1 },
      stealth:     { dodge: 2, initiative: 1 },
      light_armor: { dodge: 1 },
      perception:  { perception: 2 },
    },
    tag_penalties: {
      heavy_armor: { dodge: -3, initiative: -2 },
      heavy:       { dodge: -1, initiative: -1 },
      two_handed:  { accuracy: -2 },
    },
    preferred_slots: ["weapon_main", "weapon_offhand", "cloak", "charm", "feet"],
    avoid_slots: [],
  },
  shadowbound: {
    tag_bonuses: {
      light_blade: { crit_chance: 3, crit_damage: 2 },
      shadow:      { crit_chance: 2, resist_shadow: 2 },
      stealth:     { dodge: 2 },
      corruption:  { crit_chance: 1, melee_power: 1 },
    },
    tag_penalties: {
      heavy_armor: { dodge: -4, initiative: -3 },
      heavy:       { dodge: -2 },
      arcane:      { accuracy: -1 },
    },
    preferred_slots: ["weapon_main", "weapon_offhand", "cloak", "relic"],
    avoid_slots: [],
  },
  ember_touched: {
    tag_bonuses: {
      arcane:       { spell_power: 4, crit_chance: 1 },
      arcane_focus: { spell_power: 3, healing_power: 1 },
      shadow:       { spell_power: 1, resist_shadow: 1 },
      perception:   { perception: 1 },
    },
    tag_penalties: {
      heavy_armor:  { spell_power: -3 },
      heavy:        { spell_power: -2 },
      two_handed:   { spell_power: -3 },
    },
    preferred_slots: ["weapon_main", "weapon_offhand", "ring_1", "ring_2", "relic"],
    avoid_slots: [],
  },
  hearthborn: {
    tag_bonuses: {
      arcane_focus: { healing_power: 4, max_hp: 2 },
      heavy:        { max_hp: 2, defense: 1 },
      stealth:      { healing_power: 1 },
    },
    tag_penalties: {
      shadow:       { healing_power: -2 },
      corruption:   { healing_power: -3 },
      two_handed:   { healing_power: -2 },
    },
    preferred_slots: ["weapon_offhand", "charm", "relic"],
    avoid_slots: [],
  },
  warden: {
    tag_bonuses: {
      heavy_armor:  { defense: 2, resist_poison: 1, resist_shadow: 1 },
      heavy:        { defense: 1, block_value: 1 },
      arcane_focus: { resist_shadow: 2, resist_fire: 1 },
      perception:   { perception: 2 },
    },
    tag_penalties: {
      light_blade:  { defense: -1 },
      stealth:      { defense: -1 },
      corruption:   { resist_shadow: -3, resist_poison: -2 },
    },
    preferred_slots: ["weapon_offhand", "chest", "relic"],
    avoid_slots: [],
  },
};

// ── Sewer starter equipment catalog ─────────────────────────────────────────
function eq(id, name, slot, subType, overrides = {}) {
  const base = {
    id,
    name,
    item_type: "equipment",
    sub_type: subType,
    slot,
    rarity: "common",
    quality: "worn",
    tier: 1,
    biome_tier: 1,
    level_requirement: 1,
    value_am: 10,
    weight: 1,
    stackable: false,
    max_stack: 1,
    equippable: true,
    instinct_required: null,
    tags: ["sewer"],
    stat_modifiers: createEmptyStatModifiers(),
    on_equip_effects: [],
    on_hit_effects: [],
    passive_effects: [],
    corruption: null,
    lore: "",
    vendor_targets: [],
  };
  return { ...base, ...overrides };
}

export const EQUIPMENT_DATA = {
  // weapon_main (8)
  rusted_blade: eq("rusted_blade", "Rusted Blade", "weapon_main", "sword", {
    stat_modifiers: { ...createEmptyStatModifiers(), melee_power: 2 },
    value_am: 15,
    lore: "A blade left too long in wet stone.",
  }),
  pipe_shiv: eq("pipe_shiv", "Pipe Shiv", "weapon_main", "dagger", {
    tags: ["sewer", "light_blade"],
    stat_modifiers: { ...createEmptyStatModifiers(), melee_power: 1 },
    value_am: 8,
    lore: "Sharpened pipe. Improvised.",
  }),
  ash_caked_club: eq("ash_caked_club", "Ash-Caked Club", "weapon_main", "mace", {
    tags: ["sewer", "heavy"],
    stat_modifiers: { ...createEmptyStatModifiers(), melee_power: 2 },
    value_am: 12,
    lore: "Heavy. The ash never quite comes off.",
  }),
  hooked_knife: eq("hooked_knife", "Hooked Knife", "weapon_main", "dagger", {
    tags: ["sewer", "light_blade"],
    stat_modifiers: { ...createEmptyStatModifiers(), melee_power: 2, accuracy: 1 },
    value_am: 14,
    lore: "Good for gutting. And other things.",
  }),
  drain_spear: eq("drain_spear", "Drain Spear", "weapon_main", "spear", {
    stat_modifiers: { ...createEmptyStatModifiers(), melee_power: 2, initiative: 1 },
    value_am: 18,
    lore: "Salvaged from a grate. Keeps things at arm's length.",
  }),
  worn_mace: eq("worn_mace", "Worn Mace", "weapon_main", "mace", {
    tags: ["sewer", "heavy"],
    stat_modifiers: { ...createEmptyStatModifiers(), melee_power: 3 },
    value_am: 22,
    tier: 2,
    lore: "Heavier than it looks.",
  }),
  sewer_wand: eq("sewer_wand", "Sewer Wand", "weapon_main", "wand", {
    tags: ["sewer", "arcane"],
    stat_modifiers: { ...createEmptyStatModifiers(), spell_power: 2 },
    value_am: 25,
    lore: "Twisted wood. Still holds a spark.",
  }),
  charred_staff: eq("charred_staff", "Charred Staff", "weapon_main", "staff", {
    tags: ["sewer", "arcane"],
    stat_modifiers: { ...createEmptyStatModifiers(), spell_power: 3 },
    value_am: 30,
    tier: 2,
    lore: "Burned but not consumed.",
  }),

  // weapon_offhand (4)
  cracked_buckler: eq("cracked_buckler", "Cracked Buckler", "weapon_offhand", "buckler", {
    tags: ["sewer", "heavy"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1, block_value: 1 },
    value_am: 12,
    lore: "Small. Better than nothing.",
  }),
  scrap_shield: eq("scrap_shield", "Scrap Shield", "weapon_offhand", "shield", {
    tags: ["sewer", "heavy"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 2, block_value: 2 },
    value_am: 20,
    lore: "Pieced together from drain covers.",
  }),
  oil_lantern: eq("oil_lantern", "Oil Lantern", "weapon_offhand", "lantern", {
    tags: ["sewer", "perception"],
    stat_modifiers: { ...createEmptyStatModifiers(), perception: 2 },
    value_am: 15,
    lore: "Light in the dark. Sometimes that matters.",
  }),
  bone_focus: eq("bone_focus", "Bone Focus", "weapon_offhand", "focus", {
    tags: ["sewer", "arcane", "arcane_focus"],
    stat_modifiers: { ...createEmptyStatModifiers(), spell_power: 1, healing_power: 1 },
    value_am: 18,
    lore: "Something old. It hums.",
  }),

  // head (4)
  threadbare_hood: eq("threadbare_hood", "Threadbare Hood", "head", "hood", {
    stat_modifiers: { ...createEmptyStatModifiers(), dodge: 1 },
    value_am: 8,
    lore: "Keeps the drip off.",
  }),
  rusted_cap: eq("rusted_cap", "Rusted Cap", "head", "cap", {
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1 },
    value_am: 10,
    lore: "Metal. Cold against the skull.",
  }),
  sewer_mask: eq("sewer_mask", "Sewer Mask", "head", "mask", {
    stat_modifiers: { ...createEmptyStatModifiers(), resist_poison: 1 },
    value_am: 14,
    lore: "Filters the worst of it.",
  }),
  bent_helm: eq("bent_helm", "Bent Helm", "head", "helm", {
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 2, dodge: -1 },
    value_am: 22,
    tier: 2,
    lore: "Salvaged. Still protects.",
  }),

  // chest (5)
  patchwork_jerkin: eq("patchwork_jerkin", "Patchwork Jerkin", "chest", "patchwork_armor", {
    tags: ["sewer", "light_armor"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1 },
    value_am: 12,
    lore: "Stitched from scraps.",
  }),
  mold_stained_vest: eq("mold_stained_vest", "Mold-Stained Vest", "chest", "cloth_armor", {
    tags: ["sewer", "light_armor"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1, resist_poison: 1 },
    value_am: 14,
    lore: "The mold doesn't spread. You hope.",
  }),
  sewer_leathers: eq("sewer_leathers", "Sewer Leathers", "chest", "leather_armor", {
    tags: ["sewer", "light_armor"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 2 },
    value_am: 20,
    lore: "Treated. Mostly.",
  }),
  riveted_coat: eq("riveted_coat", "Riveted Coat", "chest", "chain_armor", {
    tags: ["sewer", "heavy_armor"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 3, dodge: -1 },
    value_am: 28,
    tier: 2,
    lore: "Heavy. Reliable.",
  }),
  riveted_plate: eq("riveted_plate", "Riveted Plate", "chest", "plate_armor", {
    tags: ["sewer", "heavy_armor"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 4, dodge: -1 },
    value_am: 35,
    tier: 2,
    quality: "serviceable",
    lore: "Scavenged plates. Held together.",
  }),

  // hands (3)
  cloth_wraps: eq("cloth_wraps", "Cloth Wraps", "hands", "wraps", {
    stat_modifiers: { ...createEmptyStatModifiers(), dodge: 1 },
    value_am: 6,
    lore: "Worn thin.",
  }),
  tinker_gloves: eq("tinker_gloves", "Tinker Gloves", "hands", "gloves", {
    stat_modifiers: { ...createEmptyStatModifiers(), accuracy: 1 },
    value_am: 12,
    lore: "Reinforced palms.",
  }),
  rust_linked_gauntlets: eq("rust_linked_gauntlets", "Rust-Linked Gauntlets", "hands", "gauntlets", {
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 2 },
    value_am: 18,
    lore: "Heavy. Protective.",
  }),

  // legs (3)
  patched_trousers: eq("patched_trousers", "Patched Trousers", "legs", "trousers", {
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1 },
    value_am: 8,
    lore: "Mended many times.",
  }),
  sewer_leg_wraps: eq("sewer_leg_wraps", "Sewer Leg Wraps", "legs", "leather_leggings", {
    stat_modifiers: { ...createEmptyStatModifiers(), dodge: 1 },
    value_am: 10,
    lore: "Wrapped tight.",
  }),
  reinforced_greaves: eq("reinforced_greaves", "Reinforced Greaves", "legs", "greaves", {
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 2 },
    value_am: 20,
    tier: 2,
    lore: "Metal strips. They hold.",
  }),

  // feet (4)
  worn_boots: eq("worn_boots", "Worn Boots", "feet", "boots", {
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1 },
    value_am: 10,
    lore: "Soles thin but intact.",
  }),
  slickstep_boots: eq("slickstep_boots", "Slickstep Boots", "feet", "boots", {
    stat_modifiers: { ...createEmptyStatModifiers(), dodge: 1, initiative: 1 },
    value_am: 14,
    lore: "Light. Quick.",
  }),
  footwraps: eq("footwraps", "Footwraps", "feet", "footwraps", {
    stat_modifiers: { ...createEmptyStatModifiers(), initiative: 1 },
    value_am: 5,
    lore: "Barely there.",
  }),
  heavy_sewer_boots: eq("heavy_sewer_boots", "Heavy Sewer Boots", "feet", "heavy_boots", {
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 2, initiative: -1 },
    value_am: 18,
    lore: "Thick. You feel every step.",
  }),

  // cloak (3)
  ash_cloak: eq("ash_cloak", "Ash Cloak", "cloak", "cloak", {
    tags: ["sewer", "stealth"],
    stat_modifiers: { ...createEmptyStatModifiers(), dodge: 1, resist_fire: 1 },
    value_am: 16,
    lore: "Ash-woven. Warm.",
  }),
  drip_cloak: eq("drip_cloak", "Drip-Cloak", "cloak", "cloak", {
    tags: ["sewer", "stealth"],
    stat_modifiers: { ...createEmptyStatModifiers(), resist_poison: 1 },
    value_am: 12,
    lore: "Waxed. Repels the worst.",
  }),
  faded_mantle: eq("faded_mantle", "Faded Mantle", "cloak", "mantle", {
    tags: ["sewer", "stealth"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1 },
    value_am: 14,
    lore: "Once fine. Now just serviceable.",
  }),

  // rings (4 — go in ring_1 or ring_2)
  tarnished_band: eq("tarnished_band", "Tarnished Band", "ring_1", "ring", {
    stat_modifiers: { ...createEmptyStatModifiers(), accuracy: 1 },
    value_am: 8,
    lore: "Faint engraving. Unreadable.",
  }),
  bent_copper_ring: eq("bent_copper_ring", "Bent Copper Ring", "ring_1", "ring", {
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1 },
    value_am: 6,
    lore: "Bent but wearable.",
  }),
  dull_iron_signet: eq("dull_iron_signet", "Dull Iron Signet", "ring_1", "ring", {
    stat_modifiers: { ...createEmptyStatModifiers(), melee_power: 1 },
    value_am: 12,
    lore: "House mark worn away.",
  }),
  sewer_signet: eq("sewer_signet", "Sewer Signet", "ring_1", "ring", {
    stat_modifiers: { ...createEmptyStatModifiers(), resist_bleed: 1 },
    value_am: 10,
    lore: "Someone's mark. Not yours.",
  }),
  coil_ring: eq("coil_ring", "Coil Ring", "ring_2", "ring", {
    stat_modifiers: { ...createEmptyStatModifiers(), dodge: 1 },
    value_am: 9,
    lore: "Wire wound tight.",
  }),
  iron_band: eq("iron_band", "Iron Band", "ring_2", "ring", {
    stat_modifiers: { ...createEmptyStatModifiers(), max_hp: 2 },
    value_am: 14,
    lore: "Heavy. Steadying.",
  }),

  // charm (4)
  rat_bone_charm: eq("rat_bone_charm", "Rat-Bone Charm", "charm", "charm", {
    stat_modifiers: { ...createEmptyStatModifiers(), perception: 1 },
    value_am: 8,
    lore: "Small bones. They rattle.",
  }),
  salt_thread_token: eq("salt_thread_token", "Salt Thread Token", "charm", "token", {
    stat_modifiers: { ...createEmptyStatModifiers(), resist_shadow: 1 },
    value_am: 12,
    lore: "Wrapped in salt-soaked thread.",
  }),
  sewer_saint_knot: eq("sewer_saint_knot", "Sewer Saint Knot", "charm", "fetish", {
    stat_modifiers: { ...createEmptyStatModifiers(), healing_power: 1 },
    value_am: 14,
    lore: "Knots. Prayers. Hope.",
  }),
  bone_fetish: eq("bone_fetish", "Bone Fetish", "charm", "fetish", {
    stat_modifiers: { ...createEmptyStatModifiers(), resist_poison: 1 },
    value_am: 10,
    lore: "Old. Protective.",
  }),

  // relic (3)
  cracked_reliquary_shard: eq("cracked_reliquary_shard", "Cracked Reliquary Shard", "relic", "relic", {
    stat_modifiers: { ...createEmptyStatModifiers(), resist_shadow: 1 },
    value_am: 25,
    lore: "Something holy. Broken.",
  }),
  whisper_stone_fragment: eq("whisper_stone_fragment", "Whisper Stone Fragment", "relic", "shard", {
    stat_modifiers: { ...createEmptyStatModifiers(), perception: 2 },
    value_am: 30,
    lore: "It hums when you're not looking.",
  }),
  ash_script_token: eq("ash_script_token", "Ash-Script Token", "relic", "idol", {
    stat_modifiers: { ...createEmptyStatModifiers(), spell_power: 1 },
    value_am: 28,
    lore: "Script you can't read. You feel it.",
  }),

  // Corrupted test items (4)
  bloodbound_pipe_shiv: eq("bloodbound_pipe_shiv", "Bloodbound Pipe Shiv", "weapon_main", "dagger", {
    tags: ["sewer", "light_blade", "corruption"],
    stat_modifiers: { ...createEmptyStatModifiers(), melee_power: 3, crit_chance: 2 },
    value_am: 35,
    quality: "corrupted",
    corruption: {
      corruption_type: "bloodbound",
      positive_effects: { melee_power: 3, crit_chance: 2 },
      negative_effects: { max_hp: -4 },
      passive_text: "The blade drinks from the hand that grips it.",
    },
    lore: "It hums when you hold it.",
  }),
  whispering_lantern: eq("whispering_lantern", "Whispering Lantern", "weapon_offhand", "lantern", {
    tags: ["sewer", "perception", "corruption"],
    stat_modifiers: { ...createEmptyStatModifiers(), perception: 3 },
    value_am: 40,
    quality: "corrupted",
    corruption: {
      corruption_type: "whisper",
      positive_effects: { perception: 3 },
      negative_effects: { resist_shadow: -2 },
      passive_text: "It shows you things. You're not sure you want to see.",
    },
    lore: "The flame never quite goes out.",
  }),
  ash_bitten_cloak: eq("ash_bitten_cloak", "Ash-Bitten Cloak", "cloak", "cloak", {
    tags: ["sewer", "stealth", "corruption"],
    stat_modifiers: { ...createEmptyStatModifiers(), dodge: 2, resist_fire: 1 },
    value_am: 45,
    quality: "corrupted",
    corruption: {
      corruption_type: "ashbound",
      positive_effects: { dodge: 2, resist_fire: 1 },
      negative_effects: { max_hp: -2 },
      passive_text: "The ash moves when you're not looking.",
    },
    lore: "Warm. Too warm.",
  }),
  split_iron_charm: eq("split_iron_charm", "Split-Iron Charm", "charm", "charm", {
    tags: ["sewer", "corruption"],
    stat_modifiers: { ...createEmptyStatModifiers(), defense: 1 },
    value_am: 30,
    quality: "corrupted",
    corruption: {
      corruption_type: "split",
      positive_effects: { defense: 1, block_value: 1 },
      negative_effects: { accuracy: -1 },
      passive_text: "Two halves. Never quite whole.",
    },
    lore: "It aches in the rain.",
  }),
};
