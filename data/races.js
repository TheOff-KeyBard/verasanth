export const RACES = {
  ashborn: {
    name: "Ashborn",
    stat_mods: { charisma: 2, intelligence: 1, wisdom: -1 },
    affinity: ["ember_touched", "shadowbound"],
    description:
      "Humans reshaped by Verasanth's ancient fires. Ember-veins glow faintly beneath their skin. They aren't infernal — they're city-forged.",
  },
  dakaridari: {
    name: "Dak'Aridari",
    stat_mods: { dexterity: 2, charisma: 1, constitution: -1 },
    affinity: ["shadowbound", "streetcraft"],
    description:
      "Born in the lightless depths. They see in shades of violet and move with uncanny silence. Their culture values secrets, subtlety, and survival in places where the city forgets itself.",
  },
  panaridari: {
    name: "Pan'Aridari",
    stat_mods: { dexterity: 2, intelligence: 1, constitution: -1 },
    affinity: ["streetcraft", "ember_touched"],
    description:
      "Surface-dwellers who navigate Verasanth like it's alive — because to them, it is. They sense subtle shifts in streets, crowds, and danger.",
  },
  cambral: {
    name: "Cambral",
    stat_mods: { strength: 1, constitution: 2, dexterity: -1 },
    affinity: ["ironblood", "warden"],
    description:
      "Stone-touched descendants of the city's earliest builders. Their bones are dense, their skin marked with faint mineral patterns. They don't just live in Verasanth — they anchor it.",
  },
  silth: {
    name: "Silth",
    stat_mods: { strength: 2, constitution: 1, intelligence: -1 },
    affinity: ["ironblood", "warden"],
    description:
      "Shaped generations ago by alchemical experiments meant to create perfect soldiers. The results were unpredictable — but powerful.",
  },
  human: {
    name: "Human",
    stat_mods: { strength: 1, dexterity: 1, intelligence: 1 },
    affinity: [
      "ember_touched",
      "hearthborn",
      "streetcraft",
      "ironblood",
      "shadowbound",
      "warden",
    ],
    description:
      "Adaptable and unpredictable, shaped by choice rather than lineage. In a city that reshapes people, humans reshape right back.",
  },
  malaridari: {
    name: "Mal'Aridari",
    stat_mods: { wisdom: 2, constitution: 1, intelligence: -1 },
    affinity: ["hearthborn", "warden"],
    description:
      "A nomadic people marked with faint vine-like patterns along their skin. Steady, loyal, and unyielding when defending those they love. They see the city as a wounded giant — and wounded things deserve tending.",
  },
  darmerians: {
    name: "Darmerians",
    stat_mods: { strength: 1, wisdom: 1, constitution: 1, charisma: -1 },
    affinity: ["hearthborn", "ironblood"],
    description:
      "Sea-forged people from the drowned coast beyond Verasanth. Broad-shouldered and loud-hearted, marked with faint salt-crystal patterns. They see the city as another storm to weather — and storms are faced together.",
  },
};
