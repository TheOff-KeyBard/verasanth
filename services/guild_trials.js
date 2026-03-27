/**
 * Guild Mastery Trials — Standing 2–4.
 * @see cursor_guild_mastery_trials.md
 */

export async function handleGuildTrial(db, uid, guild, trial, choice, standing, row, { getFlag, setFlag, getGuildStanding, setGuildStanding }) {
  const advance = async (newStanding, message, flagsToSet = {}) => {
    await setGuildStanding(db, uid, guild, newStanding);
    for (const [flag, val] of Object.entries(flagsToSet)) {
      await setFlag(db, uid, flag, val);
    }
    return { ok: true, new_standing: newStanding, message };
  };

  const deny = (message) => ({ ok: false, message });

  // Playtest: gates that use helped_npc_count, gave_item_count, social_deception_count
  // have no wired actions yet — use 0 threshold so gates are passable
  const PLAYTEST_HELPED = 0;
  const PLAYTEST_GAVE_ITEM = 0;
  const PLAYTEST_DECEPTIONS = 0;

  // ── ASHEN ARCHIVE ──────────────────────────────────────────
  if (guild === "ashen_archive") {
    if (trial === "veiled_inquiry" && standing === 1) {
      if (!["oldest_source", "corroborated_account", "dissenting_record"].includes(choice)) {
        return deny("Choose a source: oldest_source, corroborated_account, or dissenting_record.");
      }
      const responses = {
        oldest_source: 'Vaelith considers you for a long moment. "Age is not authority. But you chose deliberately. The Archive notes that."',
        corroborated_account: '"Two sources in agreement are two sources with shared incentive. You weighted them anyway. Interesting method."',
        dissenting_record: '"The least comfortable source. You have instincts worth examining."',
      };
      return advance(2, responses[choice], { archive_inquiry_method: choice === "dissenting_record" ? 3 : choice === "oldest_source" ? 1 : 2 });
    }
    if (trial === "patterns_gate" && standing === 2) {
      const kvVisits = await getFlag(db, uid, "kelvaris_visits", 0);
      const itemsSold = await getFlag(db, uid, "curator_items_sold", 0);
      const foundFoundation = await getFlag(db, uid, "found_foundation_stone", 0);
      if (kvVisits < 3 || itemsSold < 1 || !foundFoundation) {
        return deny("Vaelith says nothing. The Archive is watching. Keep going.");
      }
      return advance(3, 'Vaelith does not announce anything. She simply hands you a folded document. "You have been paying attention. The Archive noticed before you did."');
    }
    if (trial === "silent_room" && standing === 3) {
      if (!["reveal", "deflect", "lie"].includes(choice)) {
        return deny("Answer honestly: reveal, deflect, or lie.");
      }
      const responses = {
        reveal: '"Good." She closes the door. "The Archive keeps what it is given. The room is now yours as much as ours."',
        deflect: '"You chose not to answer. That is an answer." She opens the door. "The Archive accommodates silence."',
        lie: 'A long pause. "You know we can tell." Another pause. "We admit the lie anyway. That is a kind of honesty." She opens the door.',
      };
      return advance(4, responses[choice], { archive_standing4_choice: choice });
    }
  }

  // ── BROKEN BANNER ──────────────────────────────────────────
  if (guild === "broken_banner") {
    if (trial === "the_line" && standing === 1) {
      if (!["protect_novices", "abandon_to_complete", "take_burden"].includes(choice)) {
        return deny("Choose: protect_novices, abandon_to_complete, or take_burden.");
      }
      const responses = {
        protect_novices: 'Garruk nods once. "That\'s the job. The job is the point." He marks something down.',
        abandon_to_complete: 'A long silence. "You finished it. I know why." He marks something down. "We don\'t always like the answer."',
        take_burden: '"That\'s the wrong answer," he says. "And I respect it." He marks something down.',
      };
      const flagVal = choice === "protect_novices" ? 1 : choice === "take_burden" ? 2 : 0;
      return advance(2, responses[choice], { banner_line_choice: flagVal });
    }
    if (trial === "scars_gate" && standing === 2) {
      const cv = await getFlag(db, uid, "combat_victories", 0);
      const se = await getFlag(db, uid, "sewer_expeditions", 0);
      const helpedNpc = await getFlag(db, uid, "helped_npc_count", 0);
      if (cv < 10 || se < 5 || helpedNpc < PLAYTEST_HELPED) {
        return deny('Garruk looks you over. "Not yet. Come back when you\'ve earned it."');
      }
      return advance(3, 'Garruk puts down what he was holding. "You\'ve been going down there and coming back up. That\'s not nothing." He gestures at a chair. "Sit down."');
    }
    if (trial === "oathfire" && standing === 3) {
      if (!["person", "principle", "place", "yourself"].includes(choice)) {
        return deny("Choose what you will not abandon: person, principle, place, or yourself.");
      }
      const responses = {
        person: '"One name," he says. "That\'s enough. The fire\'s seen it." He stamps the ledger.',
        principle: '"That\'ll hold you when the name doesn\'t," he says. He stamps the ledger.',
        place: '"Good. A place gives you something to come back to." He stamps the ledger.',
        yourself: 'He looks at you for a long moment. "That\'s the hardest one to keep." He stamps the ledger anyway.',
      };
      return advance(4, responses[choice], { banner_oath_choice: choice });
    }
  }

  // ── QUIET SANCTUM ──────────────────────────────────────────
  if (guild === "quiet_sanctum") {
    if (trial === "unseen_hand" && standing === 1) {
      if (!["help_first", "help_second", "help_neither_find_another_way"].includes(choice)) {
        return deny("Choose: help_first, help_second, or help_neither_find_another_way.");
      }
      const responses = {
        help_first: 'Halden listens. "And the second?" You explain. "You weighed them. That is enough."',
        help_second: 'Halden listens. "And the first?" You explain. "You chose the harder need. That is a reasonable answer."',
        help_neither_find_another_way: '"There often isn\'t another way," he says quietly. "But you looked for one. That matters."',
      };
      return advance(2, responses[choice], { sanctum_hand_choice: choice === "help_neither_find_another_way" ? 2 : 1 });
    }
    if (trial === "kindness_gate" && standing === 2) {
      const helpedNpc = await getFlag(db, uid, "helped_npc_count", 0);
      const harmedInnocent = await getFlag(db, uid, "harm_innocent_count", 0);
      const gaveItem = await getFlag(db, uid, "gave_item_count", 0);
      if (helpedNpc < PLAYTEST_HELPED || harmedInnocent > 0 || gaveItem < PLAYTEST_GAVE_ITEM) {
        return deny('Halden smiles. "Come back when you have more behind you."');
      }
      return advance(3, '"I have been watching," Halden says. He does not say this like a warning. "The Sanctum has been watching. Come in."');
    }
    if (trial === "quiet_mirror" && standing === 3) {
      if (!["name_something", "say_nothing", "say_not_yet"].includes(choice)) {
        return deny("Sit with the question: name_something, say_nothing, or say_not_yet.");
      }
      const responses = {
        name_something: 'He nods. He does not comment on what you named. "The Sanctum carries what you cannot. That is part of its purpose."',
        say_nothing: '"Also an answer," he says. "The Sanctum accepts silence."',
        say_not_yet: '"That is the most honest answer," he says. "We will wait."',
      };
      return advance(4, responses[choice], { sanctum_mirror_choice: choice });
    }
  }

  // ── VEIL MARKET ──────────────────────────────────────────
  if (guild === "veil_market") {
    if (trial === "three_doors" && standing === 1) {
      if (!["risky_trade", "gray_information", "safe_job"].includes(choice)) {
        return deny("Choose a door: risky_trade, gray_information, or safe_job.");
      }
      const responses = {
        risky_trade: '"High risk, high read," Lirael says. "You understood the offer before you took it. Good start."',
        gray_information: '"The morally interesting door. You took it without pretending it wasn\'t gray. I appreciate that."',
        safe_job: '"A conservative instinct. We have uses for caution, too." She smiles. "Do not mistake this for a low evaluation."',
      };
      return advance(2, responses[choice], { market_door_choice: choice });
    }
    if (trial === "profit_gate" && standing === 2) {
      const itemsSold = await getFlag(db, uid, "curator_items_sold", 0);
      const refinedSold = await getFlag(db, uid, "sold_refined_reagent", 0);
      const deceptions = await getFlag(db, uid, "social_deception_count", 0);
      if (itemsSold < 15 || refinedSold < 1 || deceptions < PLAYTEST_DECEPTIONS) {
        return deny('Lirael tilts her head. "You\'re not there yet. I\'ll know when you are."');
      }
      return advance(3, 'Lirael sets down what she was holding. "I\'ve been tracking your transactions," she says pleasantly. "You\'re starting to move like someone who knows what things are actually worth."');
    }
    if (trial === "ledger_of_names" && standing === 3) {
      if (!["vouch_kelvaris", "vouch_caelir", "vouch_seris"].includes(choice)) {
        return deny("Choose who vouches for you: vouch_kelvaris, vouch_caelir, or vouch_seris.");
      }
      const responses = {
        vouch_kelvaris: '"Kelvaris — long memory behind the bar," Lirael says. "That\'s a careful choice. A stable reputation, if not a loud one."',
        vouch_caelir: '"The Panaridari smith who can\'t leave. Interesting. His reputation is clean. Also, leverageable." She writes something down.',
        vouch_seris: 'A pause. A genuine one. "You vouch through the curator." She closes the ledger. "That tells me quite a lot about what you think the Market is."',
      };
      return advance(4, responses[choice], { market_voucher: choice });
    }
  }

  // ── UMBRAL COVENANT ──────────────────────────────────────────
  if (guild === "umbral_covenant") {
    if (trial === "ember_weighs" && standing === 1) {
      if (!["offer_memory", "offer_item", "offer_vow"].includes(choice)) {
        return deny("The Covenant waits. Choose what you offer: offer_memory, offer_item, or offer_vow.");
      }
      const responses = {
        offer_memory: 'Serix is quiet for a long moment. "The Covenant accepts memory. Memory is the heaviest thing." The candle nearest you dims by half.',
        offer_item: 'He takes it without examination. "What was it worth to you?" Whatever you answer, he says: "The Covenant notes the weight."',
        offer_vow: '"Vows are the most dangerous offering," he says. "Because they do not end when you forget them." He accepts it.',
      };
      return advance(2, responses[choice], { covenant_offering: choice });
    }
    if (trial === "ash_gate" && standing === 2) {
      const ec = await getFlag(db, uid, "ember_consumables_used", 0);
      const ndc = await getFlag(db, uid, "near_death_count", 0);
      const foundFoundation = await getFlag(db, uid, "found_foundation_stone", 0);
      if (ec < 3 || ndc < 1 || !foundFoundation) {
        return deny("The room is silent. Something is still waiting.");
      }
      return advance(3, 'Serix does not greet you when you enter. He looks up, then back down. "Something changed," he says. "The Covenant felt it before you told us." He gestures toward the inner room.');
    }
    if (trial === "ashbound_circle" && standing === 3) {
      if (!["change_fear", "change_past", "change_nature", "change_nothing"].includes(choice)) {
        return deny("The circle waits. Choose: change_fear, change_past, change_nature, or change_nothing.");
      }
      const responses = {
        change_fear: '"The Covenant does not remove fear," he says. "It teaches the fire to use it." The circle completes.',
        change_past: 'A long silence. "The Covenant cannot change the past," he says. "But it can change what the past means." The circle completes.',
        change_nature: '"That is the only honest answer," he says. The candles burn lower. The circle completes.',
        change_nothing: 'He looks at you for a long time. "Then you are already what you came to become," he says. The circle completes.',
      };
      return advance(4, responses[choice], { covenant_circle_intent: choice });
    }
  }

  // ── STONE WATCH ──────────────────────────────────────────
  if (guild === "stone_watch") {
    if (trial === "faultline" && standing === 1) {
      if (!["inspect_gate", "inspect_wall", "inspect_drain"].includes(choice)) {
        return deny("Rhyla spreads the map. Choose your first inspection: inspect_gate, inspect_wall, or inspect_drain.");
      }
      const responses = {
        inspect_gate: '"The gate controls access," Rhyla says. "You start with the failure that spreads fastest. Good prioritization."',
        inspect_wall: '"The structural fault," she says. "Collapse risk. Reasonable first priority for long-term integrity."',
        inspect_drain: '"Flow and pressure. If the drain fails, the walls come later." She marks the map. "Unconventional. Not wrong."',
      };
      return advance(2, responses[choice], { watch_faultline_choice: choice });
    }
    if (trial === "patterns_gate" && standing === 2) {
      const tc = await getFlag(db, uid, "threats_cleared", 0);
      const ar = await getFlag(db, uid, "anomaly_reported", 0);
      const scraps = await getFlag(db, uid, "collected_structural_scrap", 0);
      if (tc < 8 || !ar || !scraps) {
        return deny('Rhyla looks at the map. "Not enough pattern yet. Keep moving."');
      }
      return advance(3, 'Rhyla puts the map down. "You\'ve been clearing the right things," she says. "Reporting the right things." She does not explain how she knows. "Come."');
    }
    if (trial === "long_watch" && standing === 3) {
      if (!["protect_the_weak", "protect_the_structure", "protect_the_truth", "protect_nothing_yet"].includes(choice)) {
        return deny("Rhyla waits. Choose what you protect: protect_the_weak, protect_the_structure, protect_the_truth, or protect_nothing_yet.");
      }
      const responses = {
        protect_the_weak: '"That\'s the one that costs the most," she says. "And the one the Watch was built for." She doesn\'t look away from the city.',
        protect_the_structure: '"The long answer," she says. "Structure protects everyone, including people you never meet." She nods.',
        protect_the_truth: '"Harder than the other two," she says. "Because the city lies constantly." She turns toward you for the first time.',
        protect_nothing_yet: '"That\'s honest," she says. She keeps looking at the city. "Come back when you know." She does not dismiss you.',
      };
      const grantStanding = choice === "protect_nothing_yet" ? 3 : 4; // only choice that doesn't advance
      if (choice === "protect_nothing_yet") {
        return deny(responses[choice]); // Honest answer defers advancement — by design
      }
      return advance(4, responses[choice], { watch_long_watch_choice: choice });
    }
  }

  return { ok: false, message: "No matching trial found." };
}
