/**
 * Status effects for Level 5 upgrades.
 * @see verasanth_level5_upgrades_spec.md Section 2
 */

export const STATUS_EFFECTS = {
  burn: {
    id: "burn",
    display_name: "Burning",
    tick_timing: "start_of_enemy_turn",
    tick_type: "percent_max_hp",
    tick_value: 5,
    target: "enemy",
    stackable: false,
    combat_log: "{target} writhes as the ember works deeper.",
  },

  stagger: {
    id: "stagger",
    display_name: "Staggered",
    tick_timing: null,
    effect_type: "damage_dealt_modifier",
    effect_value: -0.20,
    target: "enemy",
    stackable: false,
    combat_log: "{target} is staggered, their strikes losing force.",
  },

  blind: {
    id: "blind",
    display_name: "Blinded",
    tick_timing: null,
    effect_type: "accuracy_modifier",
    effect_value: -40,
    target: "enemy",
    stackable: false,
    combat_log: "{target} claws at their eyes, unable to land a clean hit.",
  },

  stun: {
    id: "stun",
    display_name: "Stunned",
    tick_timing: null,
    effect_type: "skip_turn",
    target: "enemy",
    stackable: false,
    duration_override: 1,
    combat_log: "{target} reels from the impact, unable to act.",
  },

  marked: {
    id: "marked",
    display_name: "Marked",
    tick_timing: null,
    effect_type: "incoming_damage_modifier",
    effect_value: 0.15,
    ability_damage_bonus: 0.30,
    target: "enemy",
    stackable: false,
    combat_log: "{target} is marked — they cannot escape what comes next.",
  },

  shield: {
    id: "shield",
    display_name: "Shielded",
    tick_timing: null,
    effect_type: "absorb_incoming",
    shield_value: null,
    target: "self",
    stackable: false,
    combat_log: "A ward of light takes shape around {target}.",
  },

  damage_resist: {
    id: "damage_resist",
    display_name: "Damage Resist",
    tick_timing: null,
    effect_type: "incoming_damage_modifier",
    effect_value: -0.40,
    retaliate_damage: true,
    target: "self",
    stackable: false,
    combat_log: "Ash wraps around {target}, deflecting the worst of it.",
  },

  empowered: {
    id: "empowered",
    display_name: "Empowered",
    tick_timing: null,
    effect_type: "damage_dealt_modifier",
    effect_value: 0.40,
    uses_remaining: 2,
    hp_cost_per_use: 0.05,
    target: "self",
    stackable: false,
    combat_log: "{target} surges forward, fury eclipsing the pain.",
  },

  untargetable: {
    id: "untargetable",
    display_name: "Untargetable",
    tick_timing: null,
    effect_type: "skip_enemy_attack",
    next_attack_crit_bonus: 50,
    target: "self",
    duration_override: 1,
    stackable: false,
    combat_log: "{target} vanishes in a swirl of smoke.",
  },

  weakened: {
    id: "weakened",
    display_name: "Weakened",
    tick_timing: null,
    effect_type: "damage_dealt_modifier",
    effect_value: -0.25,
    target: "enemy",
    stackable: false,
    combat_log: "{target}'s strength fails them. Their attacks feel hollow.",
  },

  corrupted_power: {
    id: "corrupted_power",
    display_name: "Corrupted Power",
    tick_timing: null,
    effect_type: "damage_dealt_modifier",
    effect_value: 0.50,
    hp_cost_on_activate: 0.15,
    target: "self",
    stackable: false,
    combat_log: "Something tears. The power floods in, taking its price immediately.",
  },
};
