export const RACES = {
  human:    { name: 'Human',    stat_mods: { strength:1, dexterity:1, intelligence:1 }, affinity: ['streetcraft','ironblood','ember_touched','shadowbound','warden','hearthborn'] },
  dwarf:    { name: 'Dwarf',    stat_mods: { strength:1, constitution:2, dexterity:-1 }, affinity: ['ironblood','warden'] },
  elf:      { name: 'Elf',      stat_mods: { dexterity:2, intelligence:1, constitution:-1 }, affinity: ['streetcraft','ember_touched'] },
  dark_elf: { name: 'Dark Elf', stat_mods: { dexterity:2, charisma:1, constitution:-1 }, affinity: ['shadowbound','streetcraft'] },
  tiefling: { name: 'Tiefling', stat_mods: { charisma:2, intelligence:1, wisdom:-1 }, affinity: ['ember_touched','shadowbound'] },
  orc:      { name: 'Orc',      stat_mods: { strength:2, constitution:1, intelligence:-1 }, affinity: ['ironblood','warden'] },
};
