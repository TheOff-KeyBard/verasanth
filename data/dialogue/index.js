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
import { dialogue as shadowbound_adept } from "./shadowbound_adept.js";
import { dialogue as grave_whisper_adherent } from "./grave_whisper_adherent.js";
import { dialogue as covenant_initiate } from "./covenant_initiate.js";
import { dialogue as ironblood_veteran } from "./ironblood_veteran.js";
import { dialogue as war_forged_bruiser } from "./war_forged_bruiser.js";
import { dialogue as banner_recruit } from "./banner_recruit.js";
import { dialogue as stone_watch_defender } from "./stone_watch_defender.js";
import { dialogue as stone_watch_sentinel } from "./stone_watch_sentinel.js";
import { dialogue as watch_initiate } from "./watch_initiate.js";
import { dialogue as hearth_tender } from "./hearth_tender.js";
import { dialogue as lifebinder_adherent } from "./lifebinder_adherent.js";
import { dialogue as sanctum_newcomer } from "./sanctum_newcomer.js";
import { dialogue as ember_touched_adept } from "./ember_touched_adept.js";
import { dialogue as pale_marked_survivor } from "./pale_marked_survivor.js";
import { dialogue as archive_initiate } from "./archive_initiate.js";
import { dialogue as streetcraft_operative } from "./streetcraft_operative.js";
import { dialogue as quickstep_runner } from "./quickstep_runner.js";
import { dialogue as market_initiate } from "./market_initiate.js";

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
  shadowbound_adept,
  grave_whisper_adherent,
  covenant_initiate,
  ironblood_veteran,
  war_forged_bruiser,
  banner_recruit,
  stone_watch_defender,
  stone_watch_sentinel,
  watch_initiate,
  hearth_tender,
  lifebinder_adherent,
  sanctum_newcomer,
  ember_touched_adept,
  pale_marked_survivor,
  archive_initiate,
  streetcraft_operative,
  quickstep_runner,
  market_initiate,
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
  shadowbound_adept: "shadowbound_adept",
  grave_whisper_adherent: "grave_whisper_adherent",
  covenant_initiate: "covenant_initiate",
  ironblood_veteran: "ironblood_veteran",
  war_forged_bruiser: "war_forged_bruiser",
  banner_recruit: "banner_recruit",
  stone_watch_defender: "stone_watch_defender",
  stone_watch_sentinel: "stone_watch_sentinel",
  watch_initiate: "watch_initiate",
  hearth_tender: "hearth_tender",
  lifebinder_adherent: "lifebinder_adherent",
  sanctum_newcomer: "sanctum_newcomer",
  ember_touched_adept: "ember_touched_adept",
  pale_marked_survivor: "pale_marked_survivor",
  archive_initiate: "archive_initiate",
  streetcraft_operative: "streetcraft_operative",
  quickstep_runner: "quickstep_runner",
  market_initiate: "market_initiate",
};

export const PHASE_A_GAME_NPCS = new Set(Object.keys(GAME_NPC_TO_CANONICAL));
