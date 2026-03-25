# VERASANTH — GAME BIBLE UPDATE NOTES
## Version: 2.8 → 2.9
## Date: March 24, 2026
## Change: Dialogue wiring verification + Claude bleed-through closed

---

Merge these updates into Game Bible v2.8 to produce v2.9.
Do not remove or alter existing content unless explicitly instructed below.

---

## UPDATE 1 — Correct §5.7 function names (v2.8 spec vs real implementation)

The v2.8 spec described function names that were inferred before the implementation
was inspected. The real authored_dialogue.js uses different names. Replace the
function list in §5.7 "Authored Dialogue Service" with the following:

**Real exported symbols from `services/authored_dialogue.js`:**

```
isPhaseAGameNpc(npc)             — returns bool; checks PHASE_A_GAME_NPCS set
npcPresentAtPlayer(...)          — presence check
getEffectiveTrust(db, dbGet, uid, canonicalId, getFlag)
                                 — returns trust score; MAX(npc_trust.score, legacyBoost)
resolveAuthoredGreeting(dialogue, db, uid, getFlag, dbGet)
                                 — resolves greeting string; checks conditional overrides
getVisibleOptions(dialogue, db, uid, getFlag, dbGet, trust, level)
                                 — returns filtered options array [{id, label}]
incrementPhaseAVisit(db, uid, npc, getFlag, setFlag, row)
                                 — increments visit tracking for Phase A NPC
handleNpcOptionsGet(deps, routeSegment)
                                 — handles GET /api/npc/:id/options; calls
                                   resolveAuthoredGreeting + getVisibleOptions
handleNpcSelectPost(deps, routeSegment, body)
                                 — handles POST /api/npc/:id/select; free-text
                                   matching, option selection, effects, followup
tryAuthoredTalkFromTopic(...)    — used by POST /api/talk; delegates to
                                   handleNpcSelectPost with {text: topic}
```

**Internal (not exported):**
```
applyDialogueEffects(...)        — writes set_flag, trust_delta, give_item to D1
resolveRouteNpc(routeSegment)    — resolves game id or canonical id via
                                   GAME_NPC_TO_CANONICAL and DIALOGUE_REGISTRY
optionFlagsOk(option, getFlag)   — evaluates requires_flag / requires_flag_not
```

**Naming corrections from v2.8 spec:**

| v2.8 spec name | Real name |
|----------------|-----------|
| getGreeting | resolveAuthoredGreeting |
| getOptions | getVisibleOptions |
| selectOption | handleNpcSelectPost (internal) |
| matchFreeText | handleNpcSelectPost (free-text branch) |
| applyEffects | applyDialogueEffects (internal) |

**`use_ai` stub correction:**
v2.8 spec stated the stub returns `{ defer: true }`.
Real implementation returns `{ useAi: true }`.
Functionally equivalent — routes to Claude API path.
Do not change the code. This note corrects the documentation only.

---

## UPDATE 2 — Add §5.9: Phase A dialogue wiring status (verified)

Add new §5.9 after §5.8:

### 5.9 Phase A Dialogue Wiring — Verified State (v2.9)

**All paths verified against live Worker code. Behavioral contract:**

| Case | Phase A NPC + module present | Phase A NPC + module missing |
|------|------------------------------|------------------------------|
| Empty topic | Authored greeting via `resolveAuthoredGreeting` — no Claude | `getNPCResponse` (safety net) |
| Free-text topic | Authored match or fallback via `tryAuthoredTalkFromTopic` — no Claude | `getNPCResponse` (safety net) |
| board/notice/notices | `tryAuthoredTalkFromTopic` returns null → module `fallback` — no Claude | `getNPCResponse` (safety net) |
| `use_ai` option | `handleNpcSelectPost` returns `{ useAi: true }` → Claude (intentional) | n/a |
| Any stray fallthrough | Safety net in `index.js` returns module `fallback` — no Claude | `getNPCResponse` (safety net) |
| Non-Phase-A NPC | `getNPCResponse` unchanged | n/a |

**Claude bleed-through: closed as of v2.9.**
Previously, `tryAuthoredTalkFromTopic` returning null (board/notice/notices,
`use_ai`, or `result.error`) allowed Phase A NPCs to fall through to
`getNPCResponse`. Fixed in v2.9 — fallback line returned instead.

**Safety net location:** `index.js`, POST /api/talk handler, immediately before
`getNPCResponse` call. Checks `isPhaseAGameNpc(npc)` + registry presence.
If module exists, returns fallback. If module missing, allows `getNPCResponse`.
All 8 Phase A modules exist — safety net should never fire in production.

**`incrementPhaseAVisit` + `assignNextQuestIfAvailable`** are called on all
Phase A response paths including the fallback path. Quest assignment and visit
tracking are not skipped when the fallback fires.

---

## UPDATE 3 — Update §5.2 legacy file annotations

Add to §5.2 Architecture, under `data/npc_dialogue_lines.js`:

```
data/npc_dialogue_lines.js  — LEGACY
  NPC_DIALOGUE_LINES  used by services/npc_dialogue.js: static response pool
                      for non-Phase-A NPCs (30% path in getNPCResponse).
                      Phase A NPCs no longer use this pool.
  PIP_REACTIONS       used by index.js: Pip behavior is NOT part of the
                      dialogue refactor and remains here permanently.
  Do not remove until all non-Phase-A NPCs are migrated to authored system.
```

Add to §5.2 Architecture, under `services/npc_dialogue.js`:

```
services/npc_dialogue.js   — handles getNPCResponse for non-Phase-A NPCs.
                             NPC_DIALOGUE_LINES import is LEGACY — static pool
                             for non-Phase-A NPCs only. Phase A NPCs are
                             handled by authored_dialogue.js.
```

---

## UPDATE 4 — Update §5.7 GAME_NPC_TO_CANONICAL map

Replace the GAME_NPC_TO_CANONICAL listing in §5.7 with the verified live map:

| Game NPC id | Canonical id |
|-------------|--------------|
| bartender | kelvaris |
| weaponsmith | caelir |
| armorsmith | veyra |
| herbalist | thalara |
| trader | trader |
| curator | seris |
| othorion | othorion |
| warden | grommash |

Note: canonical ids are also accepted directly in route segments
(`/api/npc/kelvaris/options` works) because `resolveRouteNpc`
checks `DIALOGUE_REGISTRY` keys as well as `GAME_NPC_TO_CANONICAL`.

---

## UPDATE 5 — Update Module Index

In APPENDIX — MODULE INDEX, update the authored dialogue row:

```
| Authored Dialogue System | data/dialogue/ + services/authored_dialogue.js | [IMPLEMENTED — Phase A, bleed-through closed] |
```

---

## UPDATE 6 — Version History

Add to document footer:

**v2.9 — March 24, 2026:**
Dialogue wiring verified against live Worker code. Corrected v2.8 function name
documentation to match real implementation (resolveAuthoredGreeting, getVisibleOptions,
handleNpcOptionsGet, handleNpcSelectPost, tryAuthoredTalkFromTopic, applyDialogueEffects).
Corrected use_ai stub return value: { useAi: true } not { defer: true }.
Closed Phase A Claude bleed-through: tryAuthoredTalkFromTopic returning null for Phase A
NPCs now returns authored fallback instead of falling through to getNPCResponse.
Safety net added in index.js before getNPCResponse call. Legacy file annotations added
to npc_dialogue_lines.js and services/npc_dialogue.js. Phase A wiring contract verified
and documented in new §5.9.

---

*Merge these updates into Game Bible v2.8 to produce v2.9.*
*The city remembers. The NPCs now speak from memory, not inference.*
*The Claude path is closed for Phase A. It remains open for those who have not yet been authored.*
