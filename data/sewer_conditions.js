/**
 * Sewer dynamic conditions — rotate every 45 min (Phase 4).
 * Phase 2: display only; single seed on first run.
 * @see sewer_complete.md
 */

export const SEWER_CONDITIONS = [
  {
    id: "fungal_bloom_surge",
    name: "Fungal Bloom Surge",
    floors: [1, 2],
    noticeboard_text: "SPORE SURGE ACTIVE — Othorion paying 2× for glowing spores tonight. Mind the bloom.",
    effects: {
      enemy_spawn_bonus: { mold_vermin: 1, fungal_shambler: 1 },
      loot_bonus: { glowing_spores: 3, spore_cluster: 2 },
    },
    description_mods: {
      fungal_bloom_chamber: " A thick grey bloom coats the walls — fresh, still settling. Something disturbed it recently.",
      spore_garden: " A thick grey bloom coats the walls — fresh, still settling. Something disturbed it recently.",
    },
  },
  {
    id: "water_pressure_spike",
    name: "Water Pressure Spike",
    floors: [3, 4],
    noticeboard_text: "PRESSURE SPIKE — Submerged tunnel impassable tonight. Alternate routes advised.",
    effects: {
      enemy_spawn_bonus: { flood_serpent: 1, drowned_thrall: 1 },
      loot_bonus: { drowned_relic: 2, resonant_scrap: 3 },
      route_blocked: ["submerged_tunnel"],
    },
    description_mods: {
      flooded_hall: " The water is higher than usual — up to the waterline markings on the wall. Movement is slower.",
    },
  },
  {
    id: "construct_malfunction",
    name: "Construct Malfunction",
    floors: [4],
    noticeboard_text: "CONSTRUCT ALERT — Gear Hall unstable. Caelir offering bonus for mechanical scrap recovered tonight.",
    effects: {
      enemy_spawn_bonus: { gearbound_sentinel: 2, rust_golem: 1 },
      loot_bonus: { crafting_scrap: 4, gear_fragment: 2 },
    },
  },
  {
    id: "ash_whisper_event",
    name: "Ash Whisper Event",
    floors: [5],
    noticeboard_text: "ASH WHISPER ACTIVE — Seris: 'The cathedral is louder tonight. I need samples urgently.'",
    effects: {
      enemy_spawn_bonus: { cathedral_wraith: 2, ashborn_acolyte: 1 },
      loot_bonus: { cathedral_rune_shard: 1, resonant_scrap: 3 },
    },
  },
  {
    id: "vermin_migration",
    name: "Vermin Migration",
    floors: [1, 2],
    noticeboard_text: "VERMIN SURGE — Grommash: 'Clear the nests. Bounty active for verified kills tonight.'",
    effects: {
      enemy_spawn_bonus: { gutter_rat: 3, ash_crawler: 2 },
      loot_bonus: { rat_pelt: 5, slime_residue: 3 },
    },
    description_mods: {
      drain_entrance: " The ash floor is churned — dozens of prints, all moving the same direction.",
      overflow_channel: " The ash floor is churned — dozens of prints, all moving the same direction.",
      vermin_nest: " The ash floor is churned — dozens of prints, all moving the same direction.",
    },
  },
  {
    id: "heat_vent_instability",
    name: "Heat Vent Instability",
    floors: [4, 5],
    noticeboard_text: "VENT INSTABILITY — Othorion: 'The heat signature is anomalous. I need vent ash samples immediately.'",
    effects: {
      enemy_spawn_bonus: { heat_wraith: 3 },
      loot_bonus: { deep_vent_ash: 4, gear_fragment: 2 },
    },
    description_mods: {
      gear_hall: " The air here is hotter than usual. The stone is warm to the touch.",
      steam_vent_corridor: " The air here is hotter than usual. The stone is warm to the touch.",
      ash_pillar_hall: " The air here is hotter than usual. The stone is warm to the touch.",
    },
  },
  {
    id: "mechanism_pulse",
    name: "Mechanism Pulse",
    floors: [5],
    noticeboard_text: "MECHANISM ACTIVE — The foundation hums tonight. Othorion requests readings.",
    effects: {
      loot_bonus: { resonant_scrap: 2 },
    },
    description_mods: {
      sewer_deep_foundation: " The origin pattern on the floor is faintly luminous. The lines pulse at long intervals — once every thirty seconds or so. The room is more alive than usual.",
      rune_lit_corridor: " The lines under your finger are warm. Warmer than the last time you were here.",
    },
  },
];
