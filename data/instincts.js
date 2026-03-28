/**
 * Player-facing instinct copy (API + character creation cards + sheet).
 * Eligibility: `guild` + race `guild_affinity` (see index.js / races.js). Roster size is not assumed elsewhere.
 *
 * Phase 2 (TODO): third instinct per guild—add keys here; mirror in INSTINCT_DEFS, STARTER_LOADOUTS,
 * LEVEL_5_UPGRADES (×3 actives each), INSTINCT_AFFINITIES, ALIGN_INSTINCT_BIAS, GUILD_INSTINCT trial map.
 */

export const INSTINCTS = {
  ember_touched: {
    guild: "ember",
    label: "Ember-Touched",
    memory: "You remember flame.",
    stat_mods: { intelligence: 2, charisma: 1 },
    role: "Burn-mark arcanist",
    ability: "Kindle",
    ability_desc:
      "Arcane fire and the Burning mark for a few beats—not a crawling wound. While it holds, your own weapon strikes bite deeper.",
  },
  hearthborn: {
    guild: "hearth",
    label: "Hearthborn",
    memory: "You remember warmth.",
    stat_mods: { wisdom: 2, constitution: 1 },
    role: "Mender",
    ability: "Kindle the Hearth",
    ability_desc:
      "Mend yourself; Resolve shaves a quarter of what reaches you for two beats. The first mend each fight runs a little deeper.",
  },
  streetcraft: {
    guild: "street",
    label: "Streetcraft",
    memory: "You remember the streets.",
    stat_mods: { dexterity: 2, charisma: 1 },
    role: "Opportunist blade",
    ability: "Opportunist Strike",
    ability_desc:
      "A cruel cut; against a bloodied foe you take more. The steel sometimes finds a deeper line—no promised bleed, only weight.",
  },
  ironblood: {
    guild: "iron",
    label: "Ironblood",
    memory: "You remember battle.",
    stat_mods: { strength: 2, constitution: 1 },
    role: "Frontline bruiser",
    ability: "Crushing Blow",
    ability_desc:
      "Heavy steel; you brace and shave what comes back. Often staggers—while staggered, they cannot answer you this beat.",
  },
  shadowbound: {
    guild: "shadow",
    label: "Shadowbound",
    memory: "You remember the dark.",
    stat_mods: { dexterity: 2, intelligence: 1 },
    role: "Shadow striker",
    ability: "Veil Cut",
    ability_desc:
      "Steel from the dark; damage and a sip of life back. Between abilities, your first ordinary strike each fight rolls the hit twice and keeps the better (Fade).",
  },
  warden: {
    guild: "warden",
    label: "Warden",
    memory: "You remember duty.",
    stat_mods: { constitution: 2, wisdom: 1 },
    role: "Bastion",
    ability: "Stand Fast",
    ability_desc:
      "No blow—raise a shield that turns harm aside for two beats. Below half life, one less point finds you anyway.",
  },
  pale_marked: {
    guild: "ember",
    label: "Pale-Marked",
    memory: "You remember the white heat.",
    stat_mods: { intelligence: 2, constitution: 1 },
    role: "Pale drain",
    ability: "Siphon Burn",
    ability_desc: "Pale flame scores; you draw warmth back through the same thread. No lingering burn—only the theft.",
  },
  lifebinder: {
    guild: "hearth",
    label: "Lifebinder",
    memory: "You remember the pulse.",
    stat_mods: { wisdom: 2, charisma: 1 },
    role: "Ward and mend",
    ability: "Vital Thread",
    ability_desc: "Mend in one motion; a skin-tight ward absorbs harm for three beats.",
  },
  quickstep: {
    guild: "street",
    label: "Quickstep",
    memory: "You remember the rhythm.",
    stat_mods: { dexterity: 2, wisdom: 1 },
    role: "Slip-fighter",
    ability: "Flow State",
    ability_desc:
      "A light cut; you are Untargetable for the beat—they cannot answer you. Not a true vanish, only pace.",
  },
  war_forged: {
    guild: "iron",
    label: "War-Forged",
    memory: "You remember the drill.",
    stat_mods: { strength: 2, wisdom: 1 },
    role: "Tactical line",
    ability: "Tactical Strike",
    ability_desc: "Measured steel; they carry Weakened—their blows land softer for two beats.",
  },
  grave_whisper: {
    guild: "shadow",
    label: "Grave-Whisper",
    memory: "You remember the silence.",
    stat_mods: { intelligence: 2, wisdom: 1 },
    role: "Hollow curse",
    ability: "Death's Grasp",
    ability_desc:
      "Hollow harm; Blind frays their aim for one beat; you sip life from the gap. No crawling rot—only the instant.",
  },
  sentinel: {
    guild: "warden",
    label: "Sentinel",
    memory: "You remember the watch.",
    stat_mods: { constitution: 2, dexterity: 1 },
    role: "Shield wall",
    ability: "Vigilant Guard",
    ability_desc:
      "Raise a stronger ward for three beats; for one beat they carry Weakened—softer blows, not a riposte. Weight and slack in their arms.",
  },
};
