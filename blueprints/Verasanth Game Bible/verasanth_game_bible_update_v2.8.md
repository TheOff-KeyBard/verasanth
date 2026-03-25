# VERASANTH — GAME BIBLE UPDATE NOTES
## Version: 2.7 → 2.8
## Date: March 24, 2026
## Change: Phase A Authored Dialogue System

---

These are the additions and corrections to merge into Game Bible v2.7 to produce v2.8.
Add each section to the indicated location in the Bible. Do not remove or alter existing content.

---

## UPDATE 1 — Part 5 Technical: New Service File

Add to §5.2 Architecture file tree:

```
  └── services/authored_dialogue.js  — greetings, option filters, effects, use_ai stub
```

Add to §5.2 after the file tree:

### Authored Dialogue Service (`services/authored_dialogue.js`)

Handles all authored NPC dialogue logic. Functions:
- `getGreeting(npc_id, player_flags, inventory)` — returns greeting string, checks conditional overrides in order
- `getOptions(npc_id, trust_score, player_flags, character_level)` — returns filtered visible options array `[{ id, label }]`
- `selectOption(npc_id, option_id, followup)` — returns `{ response, followup, effects }`
- `matchFreeText(npc_id, text)` — substring match against option labels; returns matched option or null
- `applyEffects(effects, player_id, db)` — writes `set_flag`, `trust_delta`, `give_item` to D1
- `use_ai stub` — any option with `use_ai: true` returns `{ defer: true }`, routing to existing Claude API path

**`has_ashbound_resonance` rule:** Checked via inventory table query, not player_flags. The item exists in inventory or it does not. Do not add it as a player_flag.

**`has_active_bounty` rule:** Checked via bounties table. Not a player_flag.

---

## UPDATE 2 — Part 5 Technical: New API Endpoints

Add to §5.2 after existing route documentation:

### Dialogue API Routes

```
GET  /api/npc/:id/options   → getGreeting + getOptions for authenticated player
POST /api/npc/:id/select    → selectOption or matchFreeText + applyEffects
```

**GET /api/npc/:id/options**
- Auth required (Bearer token)
- `:id` accepts game NPC id (e.g. `bartender`) or canonical id (e.g. `kelvaris`)
- ID mapping via `GAME_NPC_TO_CANONICAL` registry in `data/dialogue/index.js`
- Response: `{ ok, npc_id, game_npc_id, greeting, options: [{ id, label }] }`

**POST /api/npc/:id/select**
- Body variants:
  - `{ option_id }` — select a specific option
  - `{ option_id, followup: true }` — retrieve the follow-up for a previously selected option
  - `{ text }` or `{ message }` — free-text input, substring matched against option labels
- Response: `{ ok, response, followup?, effects_applied, option_id?, fallback? }`

**POST /api/talk (modified)**
- For Phase A NPCs: empty `topic` → authored greeting (no Claude call)
- For Phase A NPCs: non-empty `topic` → authored matcher + fallback if match found; Claude path if no authored match
- Extra response fields when dialogue system handles: `dialogue_followup`, `dialogue_fallback`, `dialogue_option_id`
- For NPCs not in Phase A: unchanged Claude API path

---

## UPDATE 3 — Part 5 Technical: Database Tables

Update §5.3 Core Database Tables:

Change `npc_trust` status from `[IMPLEMENTED]` to confirmed implemented with note:

```
| npc_trust | Per-NPC trust score per player | [IMPLEMENTED — live, indexes added] |
```

Add note below table:

**Trust compatibility rule:** `getEffectiveTrust` uses `MAX(npc_trust.score, legacyBoost)` where `legacyBoost` is derived from existing visit flags and legacy NPC flags. This ensures existing player saves can reach trust-gated dialogue options without a data migration. Do not remove the legacy boost logic.

Add to §5.3:

**Indexes confirmed live:**
```sql
CREATE INDEX idx_npc_trust_player ON npc_trust(player_id, npc_id);
CREATE INDEX idx_player_flags_player ON player_flags(player_id, flag);
```

---

## UPDATE 4 — Part 5 Technical: Dialogue Data

Add new §5.7:

### 5.7 Dialogue Data Architecture

**Location:** `data/dialogue/`

**Registry:** `data/dialogue/index.js`
- Exports all NPC dialogue modules
- Contains `GAME_NPC_TO_CANONICAL` map: game NPC ids → canonical NPC ids
- All authored dialogue lookups go through this registry

**Module format:** `data/dialogue/[npc_id].js`
Each module exports a `dialogue` object:
```javascript
{
  npc_id: string,
  greeting: { default: string, conditional: [{ requires_flag, requires_flag_not, text }] },
  options: [{
    id, label,
    requires_trust_min,   // int, default 0
    requires_flag,        // player_flags key, must be 1
    requires_flag_not,    // player_flags key, must be 0 or absent
    requires_level_min,   // character level floor
    response,
    followup: { label, response } | null,
    effects: { set_flag?, trust_delta?, give_item? } | null,
    use_ai: boolean       // if true, defer to Claude API path
  }],
  fallback: string
}
```

**Phase A NPCs (implemented):**
- `kelvaris.js` — Kelvaris Thornbeard, tavern
- `caelir.js` — Caelir Dawnforge, atelier
- `veyra.js` — Veyra Emberhide, mended_hide
- `thalara.js` — Thalara Mirebloom, hollow_jar
- `trader.js` — The Trader, still_scale
- `seris.js` — Seris Vantrel, market_square
- `othorion.js` — Othorion, crucible
- `grommash.js` — Grommash, cinder_cells

**Flag name corrections (live DB keys):**
The dialogue spec used inferred flag names. These were normalized to match live DB keys:
- `boss_floor1_defeated` → `boss_floor1` (Kelvaris Rat King conditional)
- `boss_floor2_defeated` → `boss_floor2` (Kelvaris floor 2 conditional)
- `seen_sewer_level3` → `boss_floor3` (Kelvaris ledger gap gate)

**Phase B NPCs (next):** Six guild leaders. See §3.12 for cross-talk dialogue content.

**Phase C (future):** `use_ai: true` options for late-game or arc-specific interactions. Stub is in place. Claude API path is preserved and will be called when `use_ai: true` is encountered.

---

## UPDATE 5 — UI

Add to §5.2 or new §5.8:

### 5.8 Authored Dialogue UI (`index.html`)

**Element:** `#dialogue-authored`

**Behavior:**
- Numbered option buttons rendered from `GET /api/npc/:id/options` response
- Player can click a button or type its number
- Follow-up renders as a single button after response — not a new full option list
- Free text still sent via topic buttons / `askTopic` → `POST /api/talk`
- After actions that may change options (flag sets, trust changes): GET `/options` refreshes the list
- `lastDialogueUiMeta` preserves ES/trial chrome state across refreshes without extra round-trips

---

## UPDATE 6 — Module Index

Update the APPENDIX — MODULE INDEX:

Add new row:
```
| Authored Dialogue System | data/dialogue/ + services/authored_dialogue.js | [IMPLEMENTED — Phase A] |
```

---

## UPDATE 7 — Version History

Add to document footer:

**v2.8 — March 24, 2026:**
Phase A authored dialogue system implemented. Replaces Claude API calls for 8 core city NPCs with authored dialogue option bundles. New endpoints: GET /api/npc/:id/options, POST /api/npc/:id/select. Modified: POST /api/talk (authored path for Phase A NPCs, Claude path preserved for others and for use_ai options). New service: services/authored_dialogue.js. npc_trust table confirmed live with indexes. GAME_NPC_TO_CANONICAL registry in data/dialogue/index.js. Trust legacy boost preserves existing saves. has_ashbound_resonance checked via inventory (not flags). Phase B (guild leaders) and Phase C (AI reintroduction) deferred.

---

*Merge these updates into Game Bible v2.7 to produce v2.8.*
*The city remembers. The NPCs now speak from memory, not inference.*
