import { dialogue as kelvaris } from "./kelvaris.js";
import { dialogue as caelir } from "./caelir.js";
import { dialogue as veyra } from "./veyra.js";
import { dialogue as thalara } from "./thalara.js";
import { dialogue as trader } from "./trader.js";
import { dialogue as seris } from "./seris.js";
import { dialogue as othorion } from "./othorion.js";
import { dialogue as grommash } from "./grommash.js";
import { dialogue as vaelith } from "./vaelith.js";
import { dialogue as garruk } from "./garruk.js";
import { dialogue as halden } from "./halden.js";
import { dialogue as lirael } from "./lirael.js";
import { dialogue as serix } from "./serix.js";
import { dialogue as rhyla } from "./rhyla.js";

/** Canonical Phase A ids (spec / URLs). */
export const DIALOGUE_REGISTRY = {
  kelvaris,
  caelir,
  veyra,
  thalara,
  trader,
  seris,
  othorion,
  grommash,
  vaelith,
  garruk,
  halden,
  lirael,
  serix,
  rhyla,
};

/** Game `npc` keys from NPC_LOCATIONS → canonical dialogue id */
export const GAME_NPC_TO_CANONICAL = {
  bartender: "kelvaris",
  weaponsmith: "caelir",
  armorsmith: "veyra",
  herbalist: "thalara",
  trader: "trader",
  curator: "seris",
  othorion: "othorion",
  warden: "grommash",
  vaelith: "vaelith",
  pyrekeeper: "vaelith",
  garruk: "garruk",
  halden: "halden",
  lirael: "lirael",
  serix: "serix",
  rhyla: "rhyla",
};

export const PHASE_A_GAME_NPCS = new Set(Object.keys(GAME_NPC_TO_CANONICAL));
