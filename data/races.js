import { INSTINCTS } from "./instincts.js";

/**
 * Lineage definitions. Instinct access: prefer `guild_affinity` + `INSTINCTS[].guild` (see index.js).
 * Legacy `affinity` is used when guild mode cannot apply or instinct lacks `guild`.
 * Phase 2 (TODO): third instinct/guild—usually no race change if guild ids unchanged; verify each race still matches design.
 */
export const RACES = {
  ashborn: {
    name: "Ashborn",
    stat_mods: { charisma: 2, intelligence: 1, wisdom: -1 },
    affinity: ["ember_touched", "shadowbound"],
    guild_affinity: ["ember", "shadow"],
    description:
      "Humans reshaped by Verasanth's ancient fires. Ember-veins glow faintly beneath their skin. They aren't infernal — they're city-forged.",
    visual_description:
      "At a glance, Ashborn look human. At a second glance, something is off — a warmth in the air, a tension under the skin, ember-veins branching faintly beneath the surface that pulse with emotion rather than blood. Their eyes are human in color until feeling rises, and then light flickers behind the iris. They didn't choose what they carry. The Pale Fires left something in them that the city remembers even when its records can't account for it.",
  },
  dakaridari: {
    name: "Dak'Aridari",
    stat_mods: { dexterity: 2, charisma: 1, constitution: -1 },
    affinity: ["shadowbound", "streetcraft"],
    guild_affinity: ["shadow", "street"],
    description:
      "Born in the lightless depths. They see in shades of violet and move with uncanny silence. Their culture values secrets, subtlety, and survival in places where the city forgets itself.",
    visual_description:
      "Compact and low-centered, Dak'Aridari carry the shape of people built for spaces that push back. Their skin is matte and light-absorbing, deep charcoal or muted slate with faint mineral undertones. Their eyes are the telling detail — reflective and multi-layered, tracking movement and pressure shifts before they register faces. They don't announce themselves. You notice the stillness first, and then realize they knew you were coming before you entered.",
  },
  panaridari: {
    name: "Pan'Aridari",
    stat_mods: { dexterity: 2, intelligence: 1, constitution: -1 },
    affinity: ["streetcraft", "ember_touched"],
    guild_affinity: ["street", "ember"],
    description:
      "Surface-dwellers who navigate Verasanth like it's alive — because to them, it is. They sense subtle shifts in streets, crowds, and danger.",
    visual_description:
      "Lean and never fully still, Pan'Aridari move like the moment is already happening and they are simply arriving where it's going. Their skin shifts slightly with angle and light, soft gradients of pale stone and muted blue that make them subtly different to look at twice. Their eyes settle on what is about to happen rather than what already has. You notice them by what moves around them — a crowd shifting, a path opening — before you notice them directly.",
  },
  cambral: {
    name: "Cambral",
    stat_mods: { strength: 1, constitution: 2, dexterity: -1 },
    affinity: ["ironblood", "warden"],
    guild_affinity: ["iron", "warden"],
    description:
      "Stone-touched descendants of the city's earliest builders. Their bones are dense, their skin marked with faint mineral patterns. They don't just live in Verasanth — they anchor it.",
    visual_description:
      "Broad-shouldered and deliberately weighted, Cambral move like people who mean every step. Their skin holds light rather than reflecting it — granite gray, earthen brown, deep slate — and some carry faint geometric lines beneath the surface, stress patterns pressed in from within. Their eyes settle on walls and load points before people. When a Cambral stands somewhere, that space feels decided. NPCs don't think warrior or builder. They think: if something breaks, they'll know why.",
  },
  silth: {
    name: "Silth",
    stat_mods: { strength: 2, constitution: 1, intelligence: -1 },
    affinity: ["ironblood", "warden"],
    guild_affinity: ["iron", "warden"],
    description:
      "Shaped generations ago by alchemical experiments meant to create perfect soldiers. The results were unpredictable — but powerful.",
    visual_description:
      "Silth bodies don't look developed — they look optimized. Clean muscle lines, controlled proportions, no asymmetry, no wasted mass. Their skin is smooth with a tension underneath, faint structured pathways visible beneath the surface that read less like veins and more like design. Their eyes are unnervingly clear — sharp amber or cold blue — and they assess threats, exits, and variables before they ever look at a person. NPCs don't think soldier. They think: what were they made for?",
  },
  human: {
    name: "Human",
    stat_mods: { strength: 1, dexterity: 1, intelligence: 1 },
    // Legacy fallback: all instincts defined in catalog (grows with Phase 2).
    affinity: Object.keys(INSTINCTS),
    guild_affinity: ["ember", "hearth", "street", "iron", "shadow", "warden"],
    description:
      "Adaptable and unpredictable, shaped by choice rather than lineage. In a city that reshapes people, humans reshape right back.",
    visual_description:
      "Humans have no shared silhouette, no biological marker, no inherited signature. Any height, any build, any tone — nothing about their appearance explains them. Every other race carries something visible: depth, structure, fire, design, rootedness, flow, storm. Humans carry none of it, and that absence is what people notice. Their eyes don't reflect what they are — they reflect what they decide. NPCs don't know what to expect from them. Neither does the city. Neither, sometimes, do they.",
  },
  malaridari: {
    name: "Mal'Aridari",
    stat_mods: { wisdom: 2, constitution: 1, intelligence: -1 },
    affinity: ["hearthborn", "warden"],
    guild_affinity: ["hearth", "warden"],
    description:
      "A nomadic people marked with faint vine-like patterns along their skin. Steady, loyal, and unyielding when defending those they love. They see the city as a wounded giant — and wounded things deserve tending.",
    visual_description:
      "Slender and long-limbed but never frail, Mal'Aridari stand with the patience of people who have decided where they are needed. Their most visible feature is beneath the skin — branching root-like patterns that shift subtly with emotion, becoming clearer when something nearby is wrong. Their eyes hold eye contact slightly longer than expected, warm ambers and deep soil-browns that feel less like observation and more like recognition. NPCs don't think healer. They think: they already know something's wrong.",
  },
  darmerians: {
    name: "Darmerians",
    stat_mods: { strength: 1, wisdom: 1, constitution: 1, charisma: -1 },
    affinity: ["hearthborn", "ironblood"],
    guild_affinity: ["hearth", "iron"],
    description:
      "Sea-forged people from the drowned coast beyond Verasanth. Broad-shouldered and loud-hearted, marked with faint salt-crystal patterns. They see the city as another storm to weather — and storms are faced together.",
    visual_description:
      "Storm-hardened and forward-built, Darmerians carry their history in their shape — broad shoulders, weight carried forward like someone bracing against wind or stepping into a strike, heavy brow ridges that act as natural armor. Their skin is weathered and mineral-marked, salt deposits along the arms and collarbones, scars worn openly like a record. Their eyes are the crucial distinction: intense and evaluating, not wild. They're not looking for a fight. They're deciding if you're worth one.",
  },
};
