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
  },
  {
    id: "water_pressure_spike",
    name: "Water Pressure Spike",
    floors: [3, 4],
    noticeboard_text: "PRESSURE SPIKE — Submerged tunnel impassable tonight. Alternate routes advised.",
  },
  {
    id: "construct_malfunction",
    name: "Construct Malfunction",
    floors: [4],
    noticeboard_text: "CONSTRUCT ALERT — Gear Hall unstable. Caelir offering bonus for mechanical scrap recovered tonight.",
  },
  {
    id: "ash_whisper_event",
    name: "Ash Whisper Event",
    floors: [5],
    noticeboard_text: "ASH WHISPER ACTIVE — Seris: 'The cathedral is louder tonight. I need samples urgently.'",
  },
  {
    id: "vermin_migration",
    name: "Vermin Migration",
    floors: [1, 2],
    noticeboard_text: "VERMIN SURGE — Grommash: 'Clear the nests. Bounty active for verified kills tonight.'",
  },
  {
    id: "heat_vent_instability",
    name: "Heat Vent Instability",
    floors: [4, 5],
    noticeboard_text: "VENT INSTABILITY — Othorion: 'The heat signature is anomalous. I need vent ash samples immediately.'",
  },
];
