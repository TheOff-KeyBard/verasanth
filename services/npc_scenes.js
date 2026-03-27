import { NPC_SCENES } from "../data/npc_scenes.js";

/** Flat ordered list (same order as NPC_SCENES) for INTEGER player_flags indexing. */
export const NPC_SCENE_LIST = NPC_SCENES;

/**
 * @param {Record<string, number>} flags player_flags map
 * @param {Record<string, number>} npcTrust seris, trader, warden (warden = grommash trust)
 */
export function getEligibleScenes(locationId, flags, npcTrust, moveCount) {
  return NPC_SCENES.filter((scene) => {
    if (!scene.locations.includes(locationId)) return false;

    const req = scene.requires_flags || {};
    for (const [flag, val] of Object.entries(req)) {
      if (Number(flags[flag] || 0) !== Number(val)) return false;
    }

    if (
      scene.requires_flag_not &&
      Number(flags[scene.requires_flag_not] || 0) >= 1
    ) {
      return false;
    }

    const trustReq = scene.requires_npc_trust || {};
    for (const [npc, minTrust] of Object.entries(trustReq)) {
      if (Number(npcTrust[npc] || 0) < Number(minTrust)) return false;
    }

    const lastKey = `last_scene_${scene.id}_move`;
    const lastMove = Number(flags[lastKey] || 0);
    if (moveCount - lastMove < 10) return false;

    return true;
  });
}

export function pickScene(eligible) {
  if (!eligible.length) return null;
  return eligible[Math.floor(Math.random() * eligible.length)];
}

export function formatNpcSceneAppend(scene) {
  let out = "\n\n" + (scene.text || "");
  if (scene.interactive && scene.options?.length) {
    for (let i = 0; i < scene.options.length; i++) {
      out += `\n[S${i + 1}] ${scene.options[i].label}`;
    }
    out += "\n[S0] Say nothing.";
  } else {
    out += "\n[S0] Say nothing.";
  }
  return out;
}
