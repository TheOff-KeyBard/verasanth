/**
 * Player-facing instinct copy (API + character creation cards + sheet).
 * Eligibility is guild-family based (see `guild` + race `guild_affinity` in index / races).
 *
 * Phase 1: 12 instincts (2 per guild × 6 guilds). Keep role/ability/ability_desc aligned with
 *   services/combat.js INSTINCT_DEFS primaries.
 * Phase 2 (TODO): 18 instincts (3 per guild)—add rows here + INSTINCT_DEFS + STARTER_LOADOUTS +
 *   INSTINCT_AFFINITIES (and any content tables) as needed.
 */

export const INSTINCTS = {
  ember_touched: {
    guild: "ember",
    label: "Ember-Touched",
    memory: "You remember flame.",
    stat_mods: { intelligence: 2, charisma: 1 },
    role: "Arcane fire",
    ability: "Kindle",
    ability_desc: "Arcane fire; leaves them Burning. While they burn, your own blows bite harder.",
  },
  hearthborn: {
    guild: "hearth",
    label: "Hearthborn",
    memory: "You remember warmth.",
    stat_mods: { wisdom: 2, constitution: 1 },
    role: "Mender",
    ability: "Kindle the Hearth",
    ability_desc: "Mend yourself; Resolve dulls what reaches you. The first mend each fight runs deeper.",
  },
  streetcraft: {
    guild: "street",
    label: "Streetcraft",
    memory: "You remember the streets.",
    stat_mods: { dexterity: 2, charisma: 1 },
    role: "Opportunist blade",
    ability: "Opportunist Strike",
    ability_desc: "A cruel cut—sometimes it sinks to the hilt. Wounded prey bleed worse.",
  },
  ironblood: {
    guild: "iron",
    label: "Ironblood",
    memory: "You remember battle.",
    stat_mods: { strength: 2, constitution: 1 },
    role: "Frontline bruiser",
    ability: "Crushing Blow",
    ability_desc: "A heavy swing; you set your stance. Often staggers—when it lands, they miss their answer this turn.",
  },
  shadowbound: {
    guild: "shadow",
    label: "Shadowbound",
    memory: "You remember the dark.",
    stat_mods: { dexterity: 2, intelligence: 1 },
    role: "Shadow striker",
    ability: "Veil Cut",
    ability_desc: "Steel from the dark; the wound pays a little back. Your first swing each fight still takes the kinder die (Fade).",
  },
  warden: {
    guild: "warden",
    label: "Warden",
    memory: "You remember duty.",
    stat_mods: { constitution: 2, wisdom: 1 },
    role: "Bastion",
    ability: "Stand Fast",
    ability_desc: "No blow—only a raised ward, brief, sized to your frame. It eats what comes next.",
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
    role: "Ward and pulse",
    ability: "Vital Thread",
    ability_desc: "Knot flesh shut and bind a shield to skin for a handful of turns.",
  },
  quickstep: {
    guild: "street",
    label: "Quickstep",
    memory: "You remember the rhythm.",
    stat_mods: { dexterity: 2, wisdom: 1 },
    role: "Slip-fighter",
    ability: "Flow State",
    ability_desc: "A light cut, then you are gone from the line—they cannot answer you this turn.",
  },
  war_forged: {
    guild: "iron",
    label: "War-Forged",
    memory: "You remember the drill.",
    stat_mods: { strength: 2, wisdom: 1 },
    role: "Tactical line",
    ability: "Tactical Strike",
    ability_desc: "Measured steel; their swing dulls for a short span after.",
  },
  grave_whisper: {
    guild: "shadow",
    label: "Grave-Whisper",
    memory: "You remember the silence.",
    stat_mods: { intelligence: 2, wisdom: 1 },
    role: "Hollow curse",
    ability: "Death's Grasp",
    ability_desc: "Hollow damage; sight frays; you sip a thread of what you took. No crawling rot—only the moment.",
  },
  sentinel: {
    guild: "warden",
    label: "Sentinel",
    memory: "You remember the watch.",
    stat_mods: { constitution: 2, dexterity: 1 },
    role: "Shield wall",
    ability: "Vigilant Guard",
    ability_desc:
      "Raise a lasting ward; your bearing makes them hold back—not a riposte, only weight and a slack in their arms.",
  },
};
