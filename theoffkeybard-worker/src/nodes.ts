/**
 * Minimal Phase 1 world (5–8 nodes). Node copy is server-side only.
 */

export type Direction =
  | "north"
  | "south"
  | "east"
  | "west"
  | "up"
  | "down";

export type NodeEnemy = {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
};

export type GameNode = {
  id: string;
  description: string;
  exits: Partial<Record<Direction, string>>;
  items: string[];
  npcs: string[];
  enemy?: NodeEnemy;
};

export const NODES: Record<string, GameNode> = {
  crossroads: {
    id: "crossroads",
    description:
      "Four worn stones mark where old roads disagree. Fog clings to the cobbles; a gate's shadow lies north, warmth east, silence west, and a sour draft rises from the south.",
    exits: {
      north: "old_gate",
      south: "sewers_mouth",
      east: "market_stall",
      west: "tavern_yard",
    },
    items: [],
    npcs: [],
  },
  old_gate: {
    id: "old_gate",
    description:
      "The gate stands open more often than the law prefers. Beyond, the mountain's shoulder hides the sky. No guard meets your eye—only wind in the hinges.",
    exits: { south: "crossroads" },
    items: [],
    npcs: ["gate_watcher"],
  },
  sewers_mouth: {
    id: "sewers_mouth",
    description:
      "Iron rungs vanish into black water smell. Something scrapes stone below—not constant, but patient.",
    exits: { north: "crossroads" },
    items: [],
    npcs: [],
    enemy: {
      id: "sewer_rat",
      name: "sewer rat",
      hp: 8,
      maxHp: 8,
      attack: 3,
      defense: 2,
    },
  },
  market_stall: {
    id: "market_stall",
    description:
      "Awnings slump under cold. Traders count coins without joy. A brass scale catches what little light there is.",
    exits: { west: "crossroads" },
    items: ["healing_draught"],
    npcs: ["quiet_vendor"],
  },
  tavern_yard: {
    id: "tavern_yard",
    description:
      "Mud and straw. A door hangs slightly wrong in its frame; laughter inside is rare enough to notice.",
    exits: { east: "crossroads", north: "tavern_interior" },
    items: [],
    npcs: [],
  },
  tavern_interior: {
    id: "tavern_interior",
    description:
      "Low beams, smoke that does not rise straight, and a hearth that remembers more winters than the patrons do. A chipped mug waits on the sill.",
    exits: { south: "tavern_yard" },
    items: ["wooden_mug"],
    npcs: ["keeper"],
  },
};

export const START_NODE = "crossroads";

export function normalizeDirection(raw: string): Direction | null {
  const s = raw.trim().toLowerCase();
  const map: Record<string, Direction> = {
    n: "north",
    north: "north",
    s: "south",
    south: "south",
    e: "east",
    east: "east",
    w: "west",
    west: "west",
    u: "up",
    up: "up",
    d: "down",
    down: "down",
  };
  return map[s] ?? null;
}
