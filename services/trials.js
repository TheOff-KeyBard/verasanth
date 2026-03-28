/**
 * Guild Initiation Trials — Standing 0 to 1.
 * @see cursor_guild_trials_initiation.md
 * Mechanic branches use instinct *family* (data/instincts.js `guild`); see services/guild_family.js.
 */

import { COMBAT_DATA } from "../data/combat.js";
import { statMod, rollDie } from "./combat.js";
import { instinctGuildFamily } from "./guild_family.js";

export const GUILD_LOCATIONS = {
  vaelith: "ashen_archive_hall",
  garruk: "broken_banner_yard",
  halden: "quiet_sanctum_entrance",
  lirael: "veil_market_hidden",
  rhyla: "stone_watch_hall",
  serix: "umbral_covenant_hall",
};

const WATCHER_PATROL = ["stall_a", "stall_b", "stall_c", "entrance"];

export function getGuildLocation(guild) {
  return GUILD_LOCATIONS[guild];
}

export function getInitialTrialState(guild, playerHp, playerHpMax, instinct) {
  switch (guild) {
    case "vaelith":
      return {
        guild: "vaelith",
        phase: "active",
        trial_type: "containment",
        turn: 0,
        sigil_stability: 100,
        leaks_defeated: 0,
        on_sigil: false,
        leak_active: false,
      };
    case "garruk":
      return {
        guild: "garruk",
        phase: "active",
        trial_type: "pressure_valve",
        rounds_survived: 0,
        rounds_needed: 10,
        player_hp: playerHp,
        player_hp_max: playerHpMax,
      };
    case "halden":
      return {
        guild: "halden",
        phase: "active",
        trial_type: "the_feeding",
        flame_energy: 100,
        distance_traveled: 0,
        enemies_present: 0,
      };
    case "rhyla":
      return {
        guild: "rhyla",
        phase: "active",
        trial_type: "foundation_support",
        construct_hp: 60,
        construct_hp_max: 60,
        player_hp: playerHp,
        player_hp_max: playerHpMax,
        tremor_active: false,
        at_pillar: false,
        tremor_countdown: 3,
        turn: 0,
        pillars_held: 0,
      };
    case "lirael":
      return {
        guild: "lirael",
        phase: "active",
        trial_type: "asset_retrieval",
        items_retrieved: 0,
        items_needed: 3,
        watcher_alert: 0,
        position: "entrance",
        watcher_at: "stall_b",
        turn: 0,
        stalls_retrieved: {},
      };
    case "serix":
      return {
        guild: "serix",
        phase: "active",
        trial_type: "veil_recognition",
        turn: 0,
        clarity: 50,
        truths_found: 0,
        illusions_active: true,
        current_echo: null,
      };
    default:
      return null;
  }
}

export function getTrialIntro(guild) {
  const intros = {
    vaelith: `The lower hall seals itself behind you.

Three containment sigils glow on the floor — the same pattern
as the foundation far below. Between them, shadow leaks press
through gaps in the stonework. Where they touch stone, the glow
dims.

Vaelith stands at the far end. She does not intervene.

The sigils are destabilizing. If they go dark, the Archive falls.`,
    garruk: `The yard gates close.

Garruk stands at the edge of the sparring circle. He has not
moved. He will not move.

"Ten rounds," he says. "That's all."

He doesn't tell you what you're surviving. He doesn't need to.
The first one is already in the yard with you.`,
    halden: `Halden places a small flame in your hands. Not a torch — something
smaller, closer. It sits in your palm without burning.

"The corridor ahead is dark," he says. "The dark here is not
empty. It has been fed for a long time."

"Keep the flame alive. Reach the far end."

He steps aside. The corridor is very quiet.`,
    rhyla: `The floor of the Shield Hall shifts.

Something beneath the city is moving. It has been moving for
a long time, but tonight it is closer to the surface than usual.

A tectonic construct assembles itself from the floor — stone
and old iron and something that was once architectural support
and has been waiting to become something else.

Three shield pillars activate in the corners of the room.

Rhyla stands at the doorway. This is the Watch's oldest
recorded exercise. She does not know why it takes this form.
She has never asked.

"Hold the pillars during tremors," she says. "Then take it apart."`,
    lirael: `Lirael gestures to the deeper market.

"Three items. Marked with a white thread. The Watchers don't
know you're here yet."

She pauses.

"Don't fight them. That's not what this is."

The Watchers are the market's own security — the city's
institutional memory for who belongs and who doesn't. They
have been here longer than Lirael has. She has never fully
understood their jurisdiction.`,
    serix: `The hall is empty.

You are certain of that.

Then you are not.

Something stands in the center of the room — or you remember
that something should be there.

Serix's voice does not come from any direction.

"Not everything here is false," he says.
"That would be simple."

"Find what remains true."

The room shifts slightly. You are no longer certain you moved.`,
  };
  return intros[guild] || "";
}

function getGarrukEnemy(round) {
  if (round <= 3) return COMBAT_DATA.enemies.sewer_wretch;
  if (round <= 6) return COMBAT_DATA.enemies.hollow_guard;
  if (round <= 9) return COMBAT_DATA.enemies.drain_lurker;
  return COMBAT_DATA.enemies.heat_wraith;
}

export function handleTrialAction(state, action, character, instinct) {
  const guild = state.guild;
  const handler = {
    vaelith: handleVaelith,
    garruk: handleGarruk,
    halden: handleHalden,
    rhyla: handleRhyla,
    lirael: handleLirael,
    serix: handleSerix,
  }[guild];
  if (!handler) return { result: "failed", message: "Unknown trial.", state, actions: [] };
  return handler(state, action, character, instinct);
}

function handleVaelith(state, action, character, instinct) {
  const actions = ["stand_on_sigil", "attack_leak", "leave_sigil"];
  let s = { ...state };
  let message = "";

  if (action === "stand_on_sigil") {
    s.on_sigil = true;
    message = "You step onto the sigil. The glow steadies under your feet.";
  } else if (action === "leave_sigil") {
    s.on_sigil = false;
    message = "You step off the sigil.";
  } else if (action === "attack_leak") {
    if (s.on_sigil) {
      message = "You cannot attack from the sigil without breaking the connection.";
      return { result: "ongoing", message, state: s, actions };
    }
    if (!s.leak_active) {
      message = "There is no leak to attack.";
      return { result: "ongoing", message, state: s, actions };
    }
    if (instinctGuildFamily(instinct) === "ember") {
      s.leaks_defeated += 1;
      s.leak_active = false;
      message = "The flame in you recognizes the leak. It collapses before you touch it.";
    } else {
      const roll = rollDie(6);
      if (roll >= 3) {
        s.leaks_defeated += 1;
        s.leak_active = false;
        message = "The leak collapses under your strike.";
      } else {
        s.sigil_stability = Math.max(0, s.sigil_stability - 10);
        message = "The leak evades. The sigil dims.";
      }
    }
  } else {
    message = "The sigils pulse. Choose an action.";
  }

  s.turn += 1;

  if (s.leak_active) {
    s.sigil_stability = s.on_sigil ? Math.min(100, s.sigil_stability + 10) : Math.max(0, s.sigil_stability - 15);
  } else {
    s.sigil_stability = s.on_sigil ? Math.min(100, s.sigil_stability + 5) : Math.max(0, s.sigil_stability - 5);
  }

  if (!s.leak_active && s.turn > 0 && s.turn % 2 === 0) {
    s.leak_active = true;
  }

  if (s.sigil_stability <= 0) {
    return {
      result: "failed",
      message: `The last sigil goes dark.

The shadow does not advance. It simply settles, the way smoke
settles. The hall is very quiet.

Vaelith walks to the nearest sigil and begins the resetting process.
She does not look at you.

The hall unseals itself. You can try again.`,
      state: s,
      actions: [],
    };
  }

  if (s.leaks_defeated >= 3) {
    return {
      result: "complete",
      message: `The third leak collapses. The sigils stabilize.

For a moment, the containment flame burns brighter than it should.
Vaelith watches it carefully. The extra light lasts three seconds.
She has been doing this for a very long time. She has never seen
the flame do that before.

"...interesting."

She does not explain what she means.`,
      state: s,
      actions: [],
    };
  }

  return { result: "ongoing", message, state: s, actions };
}

function handleGarruk(state, action, character, instinct) {
  const actions = ["fight", "hold", "flee"];
  let s = { ...state };
  let message = "";
  const round = (s.rounds_survived ?? 0) + 1;
  const enemy = getGarrukEnemy(round);

  if (action === "flee") {
    return {
      result: "failed",
      message: `You leave the yard. The gate opens before you reach it. Garruk doesn't
call after you. He just marks something on the board.`,
      state: s,
      actions: [],
    };
  }

  if (action === "hold") {
    const dmg = enemy.damage ? Math.floor((enemy.damage.min + enemy.damage.max) / 2) : 5;
    const halfDmg = Math.max(1, Math.floor(dmg / 2));
    s.player_hp = Math.max(0, (s.player_hp ?? 20) - halfDmg);
    s.rounds_survived = (s.rounds_survived ?? 0) + 1;
    message = "You hold your ground. The Banner keeps its dead on their feet.";
    if (s.player_hp <= 0) {
      return {
        result: "failed",
        message: `The yard gate opens.

Garruk is already turning back to the board when you reach the
threshold. He marks something. Not your name. Just a tally.

You can return when you're ready.`,
        state: s,
        actions: [],
      };
    }
    return { result: "ongoing", message, state: s, actions };
  }

  if (action === "fight") {
    const strMod = statMod(character?.strength ?? 10);
    const playerRoll = rollDie(8) + strMod;
    const playerDmg = rollDie(6) + 8 + (instinctGuildFamily(instinct) === "iron" ? 2 : 0);
    const enemyDef = enemy.defense ?? 0;
    const enemyHp = enemy.hp ?? 22;
    const dr = enemy.damage ? { min: enemy.damage.min, max: enemy.damage.max } : { min: 2, max: 6 };
    const enemyDmg = rollDie(dr.max - dr.min + 1) + dr.min - 1;

    const hit = playerRoll > enemyDef;
    const killed = hit && playerDmg >= enemyHp;
    const retaliate = killed ? Math.max(1, Math.floor(enemyDmg / 2)) : enemyDmg;

    s.player_hp = Math.max(0, (s.player_hp ?? 20) - retaliate);
    s.rounds_survived = (s.rounds_survived ?? 0) + 1;

    if (killed) {
      const flavor = instinctGuildFamily(instinct) === "iron" ? " The pressure in your chest is familiar. You've been here before." : "";
      message = `You strike true. ${enemy.name} goes down.${flavor}`;
    } else if (hit) {
      message = `You land a blow but it's not enough. ${enemy.name} retaliates.`;
    } else {
      message = `You miss. ${enemy.name} strikes back.`;
    }

    if (s.player_hp <= 0) {
      return {
        result: "failed",
        message: `The yard gate opens.

Garruk is already turning back to the board when you reach the
threshold. He marks something. Not your name. Just a tally.

You can return when you're ready.`,
        state: s,
        actions: [],
      };
    }
  }

  if (s.rounds_survived >= 10) {
    return {
      result: "complete",
      message: `The tenth one goes down.

The yard is quiet.

Garruk walks to the center of the sparring circle. He looks at
you for a long moment. Not the way he looks at recruits.

"You didn't leave," he says.

He left once. You held ten rounds without knowing the significance
of that. He knows. He does not say anything else.`,
      state: s,
      actions: [],
    };
  }

  return { result: "ongoing", message, state: s, actions };
}

function handleHalden(state, action, character, instinct) {
  const actions = ["advance", "tend_flame", "fight_shadow", "retreat"];
  let s = { ...state };
  let message = "";

  const passiveDrain = 5 + (s.enemies_present ? 8 : 0);
  const tendAmount = instinctGuildFamily(instinct) === "hearth" ? 35 : 20;

  if (action === "advance") {
    s.distance_traveled += 1;
    s.flame_energy = Math.max(0, (s.flame_energy ?? 100) - passiveDrain);
    if (s.flame_energy > 60) message = "The flame pushes the dark back.";
    else if (s.flame_energy >= 30) message = "The flame flickers. The dark leans in.";
    else message = "The flame is barely there. The dark is very close.";
    if (!s.enemies_present && Math.random() < 0.3) s.enemies_present = 1;
  } else if (action === "tend_flame") {
    s.flame_energy = Math.min(100, (s.flame_energy ?? 100) - passiveDrain + tendAmount);
    message = instinctGuildFamily(instinct) === "hearth"
      ? "The flame recognizes something in you. It brightens before you even touch it."
      : "You cup the flame. It responds to the attention.";
  } else if (action === "fight_shadow") {
    if (s.enemies_present) {
      const roll = rollDie(6);
      if (roll >= 4) {
        s.enemies_present = 0;
        message = "The shadow disperses.";
      } else {
        s.flame_energy = Math.max(0, (s.flame_energy ?? 100) - passiveDrain - 15);
        message = "The shadow holds. It feeds on the struggle.";
      }
    } else {
      s.flame_energy = Math.max(0, (s.flame_energy ?? 100) - passiveDrain);
      message = "There is no shadow to fight.";
    }
  } else if (action === "retreat") {
    s.distance_traveled = Math.max(0, (s.distance_traveled ?? 0) - 1);
    s.flame_energy = Math.min(100, (s.flame_energy ?? 100) - passiveDrain + 10);
    message = "You step back. The entrance is closer.";
  } else {
    message = "The corridor waits.";
  }

  if (s.flame_energy <= 0) {
    return {
      result: "failed",
      message: `The flame goes out.

Not gradually. All at once, the way a held breath releases.

The corridor is not more dangerous without it. It is quieter.
That is worse.

Halden is beside you before you know he moved. He says nothing
about the dark. He walks you back to the entrance.

"The city has been fed here for a very long time," he says.
"You interrupted it for a while. That matters."

You can try again.`,
      state: s,
      actions: [],
    };
  }

  if (s.distance_traveled >= 8) {
    return {
      result: "complete",
      message: `You reach the far end of the corridor.

The flame is still burning.

Halden is waiting. He looks at the flame, not at you.

"It survived," he says. He means the flame. He may also mean
something else.

He has a theory about what the city consumes to maintain itself.
He has not been able to test it until now. The flame reaching
the end is data he did not expect to have.`,
      state: s,
      actions: [],
    };
  }

  return { result: "ongoing", message, state: s, actions };
}

function handleRhyla(state, action, character, instinct) {
  const actions = ["attack_construct", "move_to_pillar", "hold_position", "flee"];
  let s = { ...state };
  let message = "";

  if (action === "flee") {
    return {
      result: "failed",
      message: `The construct stands over you.

The tremor passes. The room is still.

Rhyla is beside you before the ringing stops. She does not
help you up — she checks your condition the way a warden
checks a wall. Efficient. Thorough.

"The structure will hold," she says. It is not clear if
she means the building or something else.

You can try again when you're ready.`,
      state: s,
      actions: [],
    };
  }

  s.turn += 1;
  s.tremor_countdown -= 1;

  if (s.tremor_countdown <= 0) {
    s.tremor_active = true;
    s.tremor_countdown = 3;
  }

  if (s.tremor_active) {
    if (action === "attack_construct") {
      message = "The ground is moving. You cannot land a clean strike.";
    } else if (action === "move_to_pillar") {
      s.at_pillar = true;
      message = "You brace against the pillar. The room shudders but holds.";
    } else if (action === "hold_position") {
      const wardenFamily = instinctGuildFamily(instinct) === "warden";
      if (s.at_pillar) {
        s.pillars_held = (s.pillars_held ?? 0) + 1;
        message = wardenFamily
          ? "The structure speaks to you. You know where to stand before the tremor reaches you."
          : "The tremor passes. The pillar held.";
      } else if (!wardenFamily) {
        s.player_hp = Math.max(0, (s.player_hp ?? 20) - 8);
        message = "The ground throws you. You hit the wall hard.";
      } else {
        message = "The structure speaks to you. You know where to stand before the tremor reaches you.";
      }
    }
    s.tremor_active = false;
  } else {
    if (action === "attack_construct") {
      const roll = rollDie(8) + statMod(character?.strength ?? 10);
      if (roll > 15) {
        const dmg = rollDie(6) + 8;
        s.construct_hp = Math.max(0, (s.construct_hp ?? 60) - dmg);
        const retaliate = rollDie(8) + 3;
        s.player_hp = Math.max(0, (s.player_hp ?? 20) - retaliate);
        message = `You land a solid blow. The construct retaliates.`;
      } else {
        const retaliate = rollDie(8) + 3;
        s.player_hp = Math.max(0, (s.player_hp ?? 20) - retaliate);
        message = "You miss. The construct strikes back.";
      }
    } else if (action === "move_to_pillar") {
      s.at_pillar = true;
      message = "You move to the pillar.";
    } else if (action === "hold_position") {
      message = "You hold your position.";
    }
  }

  if (s.player_hp <= 0) {
    return {
      result: "failed",
      message: `The construct stands over you.

The tremor passes. The room is still.

Rhyla is beside you before the ringing stops. She does not
help you up — she checks your condition the way a warden
checks a wall. Efficient. Thorough.

"The structure will hold," she says. It is not clear if
she means the building or something else.

You can try again when you're ready.`,
      state: s,
      actions: [],
    };
  }

  if (s.construct_hp <= 0) {
    return {
      result: "complete",
      message: `The construct collapses.

The tremors stop. The room settles.

Rhyla walks to the center of the hall. She examines the floor
where the construct stood. The stone is unmarked — whatever
animated it left nothing behind.

"The pillars held longer than they should have," she says.

She is not speaking to you. She is noting it for herself, the
way she notes everything that does not fit the record.

She does not know why the pillars hold differently for some
people. The Watch has been running this exercise for generations.
She is the first to think to ask.`,
      state: s,
      actions: [],
    };
  }

  return { result: "ongoing", message, state: s, actions };
}

function handleLirael(state, action, character, instinct) {
  const stalls = ["stall_a", "stall_b", "stall_c"];
  let s = { ...state };
  s.stalls_retrieved = s.stalls_retrieved || {};
  let message = "";
  const streetFamily = instinctGuildFamily(instinct) === "street";

  const idx = WATCHER_PATROL.indexOf(s.watcher_at);
  s.watcher_at = WATCHER_PATROL[(idx + 1) % WATCHER_PATROL.length];

  if (action === "wait") {
    s.watcher_alert = Math.max(0, (s.watcher_alert ?? 0) - 10);
    message = "You stay still. The suspicion fades.";
  } else if (action.startsWith("move_to_stall_")) {
    const stall = action.replace("move_to_stall_", "stall_");
    if (stalls.includes(stall)) {
      s.position = stall;
      if (!streetFamily) s.watcher_alert = Math.min(100, (s.watcher_alert ?? 0) + 5);
      message = `You move to ${stall.replace("_", " ").toUpperCase()}.`;
    }
  } else if (action === "move_to_exit") {
    if (s.items_retrieved >= 3) {
      return {
        result: "complete",
        message: `You reach the exit. Three items retrieved. Watcher unaware.

Lirael examines the items without touching them.

"You were gathered," she says.

She has a theory about Verasanth — that the city collects
exceptional people the way a tide pool collects particular
shells. She has been testing it for a long time. She adds
your result to the collection without comment.

The items were hers to begin with.`,
        state: s,
        actions: [],
      };
    }
    message = "You need all three items first.";
  } else if (action === "retrieve_item") {
    if (!stalls.includes(s.position)) {
      message = "You must be at a stall to retrieve an item.";
    } else if (s.stalls_retrieved[s.position]) {
      message = "You already took the item from this stall.";
    } else {
      s.stalls_retrieved[s.position] = true;
      s.items_retrieved += 1;
      s.watcher_alert = Math.min(100, (s.watcher_alert ?? 0) + (streetFamily ? 10 : 20));
      const itemNarr = {
        stall_a: "A bronze sigil on a leather cord. The thread marks it.",
        stall_b: "A rolled document. The thread is tied around it twice.",
        stall_c: "A small sealed jar. The thread is knotted in a pattern you recognize from somewhere you cannot place.",
      };
      message = itemNarr[s.position] || "You take the item.";
    }
  }

  if (s.position === s.watcher_at) {
    s.watcher_alert = Math.min(100, (s.watcher_alert ?? 0) + 40);
  }

  if (s.watcher_alert >= 100) {
    return {
      result: "failed",
      message: `The Watcher stops.

It looks at you with the specific attention of something that
has been cataloguing arrivals and departures for longer than
the market has existed.

It does not attack you. It does not speak. It simply stands
between you and the exit until you leave.

Lirael is waiting outside. She is not surprised.

"City security is not the same as city opposition," she says.
"Understanding the difference is part of what I'm testing."

You can try again.`,
      state: s,
      actions: [],
    };
  }

  if (!message) message = "The market watches. Choose your move.";

  const actions = ["move_to_stall_a", "move_to_stall_b", "move_to_stall_c", "retrieve_item", "wait"];
  if (s.items_retrieved >= 3) actions.push("move_to_exit");

  return { result: "ongoing", message, state: s, actions };
}

const SERIX_ECHO_CYCLE = ["figure", "door", "voice", "memory"];

function handleSerix(state, action, character, instinct) {
  const actions = ["observe", "interact", "deny", "center"];
  let s = { ...state };
  let message = "";
  const shadowFamily = instinctGuildFamily(instinct) === "shadow";

  function spawnEchoIfNeeded() {
    if (s.current_echo == null) {
      const i = (s.truths_found + s.turn) % SERIX_ECHO_CYCLE.length;
      s.current_echo = SERIX_ECHO_CYCLE[i];
    }
  }

  if (action === "observe") {
    if (shadowFamily) {
      s.clarity = Math.min(100, (s.clarity ?? 50) + 10);
      message =
        "You hold still. The edges of the room refuse to agree with each other — but one line stays straight. You fix on it until the rest settles.";
    } else {
      s.clarity = Math.max(0, (s.clarity ?? 50) - 5);
      message =
        "You look hard. The harder you look, the more the hall offers versions of itself. None of them commit.";
    }
  } else if (action === "interact") {
    spawnEchoIfNeeded();
    const echo = s.current_echo;
    const roll = rollDie(6);
    if (shadowFamily || roll >= 4) {
      s.truths_found = (s.truths_found ?? 0) + 1;
      s.current_echo = null;
      const echoNarr = {
        figure: "Your hand passes through where a face should be. What remains is not a person — only the fact that something was believed.",
        door: "The frame is wrong until you stop asking for a room beyond it. What remains is threshold — honest, useless, true.",
        voice: "The words dissolve. What remains is rhythm without meaning — the shape of speech with nothing sold.",
        memory: "The image tears. What remains is not the scene — only that you once thought it was yours.",
      };
      message = echoNarr[echo] || "Something holds. The rest drains away.";
    } else {
      s.clarity = Math.max(0, (s.clarity ?? 50) - 15);
      message =
        "You grasp at shape. Your fingers close on agreement that was never offered. The veil tightens.";
    }
  } else if (action === "deny") {
    spawnEchoIfNeeded();
    const roll = rollDie(6);
    if (shadowFamily || roll >= 4) {
      s.current_echo = null;
      message =
        "You refuse it. Not with force — with a simple no the room cannot spend. The echo starves and lets go.";
    } else {
      s.clarity = Math.max(0, (s.clarity ?? 50) - 10);
      message = "You push it away. It leans closer, pleased you noticed it.";
    }
  } else if (action === "center") {
    s.clarity = Math.min(100, (s.clarity ?? 50) + 15);
    message = shadowFamily
      ? "You name the floor under you. Not the story of it — the weight. The hall stops borrowing your balance."
      : "You breathe until the room runs out of arguments. It does not forgive you — it waits.";
  } else {
    message = "The veil holds. Choose an action.";
  }

  s.turn = (s.turn ?? 0) + 1;

  if ((s.clarity ?? 0) <= 0) {
    return {
      result: "failed",
      message: `The last of it slips.

You reach for something solid. Your hands close on empty air.

Serix does not move. The hall is empty again — clearly, certainly empty.

"You mistook noise for signal," he says. "The Covenant notes it."

The door opens. The cold on the stairs is honest.`,
      state: s,
      actions: [],
    };
  }

  if ((s.truths_found ?? 0) >= 3) {
    return {
      result: "complete",
      message: `Three threads hold. The rest falls away.

Serix inclines his head — not approval. Recognition.

"What remains is yours to keep," he says. "The rest was never here."

The hall steadies. For the first time, the floor agrees with your feet.

You leave with one certainty you did not bring in: truth is not loud. It is what survives when everything eloquent has spent itself.`,
      state: s,
      actions: [],
    };
  }

  return { result: "ongoing", message, state: s, actions };
}

export function getTrialActions(guild, state) {
  const byType = {
    containment: ["stand_on_sigil", "attack_leak", "leave_sigil"],
    pressure_valve: ["fight", "hold", "flee"],
    the_feeding: ["advance", "tend_flame", "fight_shadow", "retreat"],
    foundation_support: ["attack_construct", "move_to_pillar", "hold_position", "flee"],
    veil_recognition: ["observe", "interact", "deny", "center"],
    asset_retrieval: (s) => {
      const a = ["move_to_stall_a", "move_to_stall_b", "move_to_stall_c", "retrieve_item", "wait"];
      if (s?.items_retrieved >= 3) a.push("move_to_exit");
      return a;
    },
  };
  const list = byType[state?.trial_type] ?? byType.containment;
  return typeof list === "function" ? list(state) : list;
}

export function getTrialStatusBar(state) {
  switch (state.trial_type) {
    case "containment":
      return `Sigil Stability: ${state.sigil_stability ?? 100}% | Leaks Defeated: ${state.leaks_defeated ?? 0}/3`;
    case "pressure_valve":
      return `Round: ${(state.rounds_survived ?? 0) + 1}/10 | HP: ${state.player_hp ?? 0}/${state.player_hp_max ?? 20}`;
    case "the_feeding":
      return `Flame: ${state.flame_energy ?? 100}% | Progress: ${state.distance_traveled ?? 0}/8`;
    case "foundation_support":
      return `Construct HP: ${state.construct_hp ?? 60}/${state.construct_hp_max ?? 60} | HP: ${state.player_hp ?? 0}/${state.player_hp_max ?? 20} | Tremor in: ${state.tremor_countdown ?? 3} turns`;
    case "asset_retrieval":
      return `Items: ${state.items_retrieved ?? 0}/3 | Alert: ${state.watcher_alert ?? 0}%`;
    case "veil_recognition":
      return `Clarity: ${state.clarity ?? 50}% | Truths Found: ${state.truths_found ?? 0}/3`;
    default:
      return "";
  }
}

export const ACTION_LABELS = {
  stand_on_sigil: "Step onto Sigil",
  attack_leak: "Attack Leak",
  leave_sigil: "Leave Sigil",
  fight: "Fight",
  hold: "Hold Position",
  flee: "Abandon Trial",
  advance: "Advance",
  tend_flame: "Tend Flame",
  fight_shadow: "Dispel Shadow",
  retreat: "Retreat",
  attack_construct: "Attack Construct",
  move_to_pillar: "Move to Pillar",
  hold_position: "Hold Position",
  move_to_stall_a: "Move to Stall A",
  move_to_stall_b: "Move to Stall B",
  move_to_stall_c: "Move to Stall C",
  retrieve_item: "Retrieve Item",
  move_to_exit: "Move to Exit",
  wait: "Wait",
  observe: "Observe",
  interact: "Reach for Echo",
  deny: "Reject Echo",
  center: "Center Yourself",
};
