#!/usr/bin/env node
/**
 * Playtest: create → inn → town → sewers → combat → rest
 * Run with: node playtest-sewer-combat.mjs
 * Optional: BASE_URL=http://localhost:8787 node playtest-sewer-combat.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:8787";

function log(msg) {
  const ts = new Date().toISOString().slice(11, 23);
  console.log(`[${ts}] ${msg}`);
}

async function fetchApi(method, path, body = null, token = null) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (token) opts.headers["Authorization"] = `Bearer ${token}`;
  if (body && (method === "POST" || method === "GET")) {
    if (method === "POST") opts.body = JSON.stringify(body);
    else if (method === "GET" && Object.keys(body).length) path += "?" + new URLSearchParams(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`Non-JSON: ${text.slice(0, 200)}`);
  }
  if (!res.ok) throw new Error(data.error || data.detail || res.statusText);
  return data;
}

async function main() {
  const findings = [];
  log("Playtest: create → inn → town → sewers → combat → rest");
  log(`BASE_URL=${BASE_URL}`);

  const username = `playtest-${Date.now()}`;
  const password = "playtest123";
  const name = "Playtest";
  const race = "human";

  let token;

  // ── 1) Register ──
  try {
    const reg = await fetchApi("POST", "/api/register", { username, password, name, race });
    token = reg.token;
    log("OK Register → token received");
  } catch (e) {
    log(`FAIL Register: ${e.message}`);
    findings.push({ step: "register", error: e.message });
    process.exit(1);
  }

  // ── 2) Character completion (instinct + stats) ──
  try {
    const char = await fetchApi("GET", "/api/character", null, token);
    if (!char.instinct || !char.stats_set) {
      await fetchApi("POST", "/api/character/instinct", { instinct: "streetcraft" }, token);
      await fetchApi("POST", "/api/character/stats", {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 8,
      }, token);
      log("OK Character: instinct + point-buy stats set");
    } else {
      log("OK Character: already complete");
    }
  } catch (e) {
    log(`FAIL Character: ${e.message}`);
    findings.push({ step: "character", error: e.message });
    process.exit(1);
  }

  // ── 3) Inn: look + talk Kelvaris ──
  try {
    const look = await fetchApi("GET", "/api/look", null, token);
    if (look.location !== "tavern") {
      findings.push({ step: "inn_look", warning: `Expected location tavern, got ${look.location}` });
    } else {
      log("OK Look: tavern");
    }
    const talk = await fetchApi("POST", "/api/talk", { npc: "bartender", topic: "" }, token);
    if (!talk.response || typeof talk.response !== "string") {
      findings.push({ step: "inn_talk", warning: "No Kelvaris response" });
    } else {
      log("OK Talk: Kelvaris responded");
    }
  } catch (e) {
    log(`FAIL Inn: ${e.message}`);
    findings.push({ step: "inn", error: e.message });
  }

  // ── 4) Town: move to market square ──
  try {
    await fetchApi("POST", "/api/move", { direction: "east" }, token); // tavern → north_road
    await fetchApi("POST", "/api/move", { direction: "south" }, token); // north_road → market_square
    const look = await fetchApi("GET", "/api/look", null, token);
    if (look.location !== "market_square") {
      findings.push({ step: "town", error: `Expected market_square, got ${look.location}` });
    } else {
      log("OK Town: market_square");
    }
  } catch (e) {
    log(`FAIL Town: ${e.message}`);
    findings.push({ step: "town", error: e.message });
    process.exit(1);
  }

  // ── 5) Sewers: down twice → sewer_upper ──
  try {
    await fetchApi("POST", "/api/move", { direction: "down" }, token); // market_square → sewer_entrance
    const move2 = await fetchApi("POST", "/api/move", { direction: "down" }, token); // sewer_entrance → sewer_upper
    if (!move2.location || !move2.fightable) {
      findings.push({ step: "sewers", warning: "Expected fightable sewer location" });
    } else {
      log(`OK Sewers: ${move2.location} (fightable)`);
    }
  } catch (e) {
    log(`FAIL Sewers: ${e.message}`);
    findings.push({ step: "sewers", error: e.message });
    process.exit(1);
  }

  // ── 6) Combat: start then attack until victory or death ──
  try {
    const start = await fetchApi("POST", "/api/combat/start", {}, token);
    if (!start.enemy_name) {
      findings.push({ step: "combat_start", error: "No enemy in combat start" });
    } else {
      log(`OK Combat start: ${start.enemy_name}`);
    }

    let result;
    let turns = 0;
    const maxTurns = 50;
    while (turns < maxTurns) {
      const action = await fetchApi("POST", "/api/combat/action", { action: "attack" }, token);
      result = action.result;
      turns++;
      if (result === "victory" || result === "death") break;
    }

    if (result === "victory") {
      log(`OK Combat: victory after ${turns} turn(s)`);
      findings.push({ step: "combat", result: "victory", turns });
    } else if (result === "death") {
      log("OK Combat: death (respawn at tavern)");
      findings.push({ step: "combat", result: "death", turns });
    } else {
      findings.push({ step: "combat", warning: `No victory/death after ${maxTurns} turns`, result });
    }
  } catch (e) {
    log(`FAIL Combat: ${e.message}`);
    findings.push({ step: "combat", error: e.message });
  }

  // ── 7) Rest (if at tavern and have 10 marks) ──
  try {
    const look = await fetchApi("GET", "/api/look", null, token);
    const wallet = await fetchApi("GET", "/api/wallet", null, token);
    const marks = wallet.ash_marks ?? 0;

    if (look.location !== "tavern") {
      log(`Rest skip: not at tavern (at ${look.location}); moving back.`);
      // Return path: sewer_upper → up → sewer_entrance → up → market_square → north → north_road → west → tavern
      try {
        await fetchApi("POST", "/api/move", { direction: "up" }, token);
        await fetchApi("POST", "/api/move", { direction: "up" }, token);
        await fetchApi("POST", "/api/move", { direction: "north" }, token); // market_square → north_road
        await fetchApi("POST", "/api/move", { direction: "west" }, token); // north_road → tavern
      } catch (e2) {
        log(`Could not return to tavern: ${e2.message}`);
      }
    }

    const look2 = await fetchApi("GET", "/api/look", null, token);
    const wallet2 = await fetchApi("GET", "/api/wallet", null, token);
    const marks2 = wallet2.ash_marks ?? 0;

    if (look2.location === "tavern" && marks2 >= 10) {
      const rest = await fetchApi("POST", "/api/rest", {}, token);
      if (rest.ok && rest.hp) {
        log("OK Rest: HP restored");
        findings.push({ step: "rest", ok: true });
      } else {
        findings.push({ step: "rest", warning: rest.message || "Rest failed" });
      }
    } else {
      log(`Rest skip: at ${look2.location}, marks=${marks2} (need 10 at tavern)`);
      findings.push({ step: "rest", skipped: true, location: look2.location, marks: marks2 });
    }
  } catch (e) {
    log(`FAIL Rest: ${e.message}`);
    findings.push({ step: "rest", error: e.message });
  }

  // ── Summary ──
  log("--- Playtest complete ---");
  const errors = findings.filter((f) => f.error);
  const warnings = findings.filter((f) => f.warning);
  if (errors.length) {
    console.log("Errors:", errors);
  }
  if (warnings.length) {
    console.log("Warnings:", warnings);
  }
  if (!errors.length && !warnings.length) {
    log("All steps passed. Combat/UX loop validated.");
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
