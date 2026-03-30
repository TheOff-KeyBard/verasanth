# VERASANTH — GAME BIBLE UPDATE NOTES
## Version: 2.9 → 3.0
## Date: March 26, 2026
## Changes: Guild Mastery Trials, The Scar, Phase 3 systems, economy wiring,
##           progression visibility, The Ashen Cycle calendar, canon timeline

---

Merge these updates into Game Bible v2.9 to produce v3.0.
Do not remove or alter existing content unless explicitly instructed below.

---

## UPDATE 1 — New §6: Guild Mastery Trials

Add new §6 after the existing guild section:

### 6.1 Overview

Guild Mastery Trials are the standing progression system for all six guilds.
Implemented in `services/guild_trials.js`. Trials gate standing advancement
from 1→2, 2→3, and 3→4.

Each guild has three trials:
- **Initiation trial** (standing 1 → 2): A choice-based moral/philosophical test.
  Player selects from 2–4 options. Each response advances standing and sets a
  flag recording the choice. No wrong answers — only different ones.
- **Gate trial** (standing 2 → 3): A behavioral gate. Checks accumulated flags
  (combat_victories, sewer_expeditions, items_sold, etc.) to verify the player
  has lived in the world. Denies until thresholds are met.
- **Oath/commitment trial** (standing 3 → 4): A deeper choice-based test.
  Some choices may intentionally defer advancement (design, not bug).

**API route:** `POST /api/guild/trial` with `{ guild, trial, choice }`

**Note on playtest flags:** `helped_npc_count`, `gave_item_count`,
`social_deception_count` currently gate at 0 (passable immediately).
These will be raised when the actions that generate them are wired.

### 6.2 Trial Reference — All Six Guilds

**Ashen Archive (Vaelith)**
| Trial | Standing Gate | Choices |
|-------|--------------|---------|
| veiled_inquiry | 1→2 | oldest_source / corroborated_account / dissenting_record |
| patterns_gate | 2→3 | Requires: kelvaris_visits≥3, curator_items_sold≥1, found_foundation_stone |
| silent_room | 3→4 | reveal / deflect / lie |

Flags set: `archive_inquiry_method`, `archive_standing4_choice`

**Broken Banner (Garruk)**
| Trial | Standing Gate | Choices |
|-------|--------------|---------|
| the_line | 1→2 | protect_novices / abandon_to_complete / take_burden |
| scars_gate | 2→3 | Requires: combat_victories≥10, sewer_expeditions≥5 |
| oathfire | 3→4 | person / principle / place / yourself |

Flags set: `banner_line_choice`, `banner_oath_choice`

**Quiet Sanctum (Halden)**
| Trial | Standing Gate | Choices |
|-------|--------------|---------|
| unseen_hand | 1→2 | help_first / help_second / help_neither_find_another_way |
| kindness_gate | 2→3 | Requires: helped_npc_count≥0, harm_innocent_count=0 |
| quiet_mirror | 3→4 | name_something / say_nothing / say_not_yet |

Flags set: `sanctum_hand_choice`, `sanctum_mirror_choice`

**Veil Market (Lirael)**
| Trial | Standing Gate | Choices |
|-------|--------------|---------|
| three_doors | 1→2 | risky_trade / gray_information / safe_job |
| profit_gate | 2→3 | Requires: curator_items_sold≥15, sold_refined_reagent≥1 |
| ledger_of_names | 3→4 | vouch_kelvaris / vouch_caelir / vouch_seris |

Flags set: `market_door_choice`, `market_voucher`

**Umbral Covenant (Serix)**
| Trial | Standing Gate | Choices |
|-------|--------------|---------|
| ember_weighs | 1→2 | offer_memory / offer_item / offer_vow |
| ash_gate | 2→3 | Requires: ember_consumables_used≥3, near_death_count≥1, found_foundation_stone |
| ashbound_circle | 3→4 | change_fear / change_past / change_nature / change_nothing |

Flags set: `covenant_offering`, `covenant_circle_intent`

**Stone Watch (Rhyla)**
| Trial | Standing Gate | Choices |
|-------|--------------|---------|
| faultline | 1→2 | inspect_gate / inspect_wall / inspect_drain |
| patterns_gate | 2→3 | Requires: threats_cleared≥8, anomaly_reported, collected_structural_scrap |
| long_watch | 3→4 | protect_the_weak / protect_the_structure / protect_the_truth / protect_nothing_yet |

Flags set: `watch_faultline_choice`, `watch_long_watch_choice`

**Special case:** Stone Watch `long_watch` — choosing `protect_nothing_yet`
intentionally does NOT advance standing to 4. Player must return and choose
differently. This is by design: honest uncertainty defers commitment.

---

## UPDATE 2 — New §7: The Scar (Zone 2)

Add new §7 after the sewer section:

### 7.1 Overview

The Scar is a biological zone accessed from the deep sewer. It is not
architectural — it grew. The zone connects to the sewer via `sewer_deep`
(which exists at the boundary and leads to `scar_breach`).

Implemented in `data/scar_rooms.js`.

### 7.2 Zone Identity

The Scar is Verasanth's organism made visible. Where the sewer is maintenance
infrastructure, the Scar is tissue. The walls are fibrous and pale. The floor
is soft in places. Spore-veins pulse in overlapping rhythms. Sound is absorbed
rather than echoed.

Players who enter are not walking through a constructed space. They are moving
through something alive.

### 7.3 Node Map

```
sewer_deep ──east──→ scar_breach
                         │ north
                    scar_outer_vein
                    ├── east → scar_echo_chamber
                    │              ├── east → scar_deep_membrane
                    │              │              ├── north → scar_wound_floor
                    │              │              │              └── north → scar_root_passage
                    │              │              │                         (west → scar_outer_vein,
                    │              │              │                          dynamically added when
                    │              │              │                          first_echo_triggered=1)
                    │              │              └── south → scar_antechamber
                    │              │                              └── south → scar_fragment_chamber
                    │              └── south → scar_graft_den
                    └── west (dynamic): scar_root_passage
                         (added when first_echo_triggered=1)
```

### 7.4 Dynamic Exit

The `west` exit from `scar_outer_vein` to `scar_root_passage` is added
dynamically when `first_echo_triggered=1`. The player must reach the echo
chamber before the outer vein opens inward.

### 7.5 Node Descriptions (summary)

| Node | District | Key detail |
|------|----------|------------|
| sewer_deep | Undercity — Upper | Boundary: stone gives way to fibrous tissue |
| scar_breach | The Scar | Hole is not architectural — stone bent, not cut |
| scar_outer_vein | The Scar | Spore-veins flickering in overlapping rhythms |
| scar_echo_chamber | The Scar | Spore-vein convergence node; signal received below |
| scar_deep_membrane | The Scar | Thickest tissue; absorbs sound and light |
| scar_antechamber | The Scar | Quieter — the Scar is conserving something |
| scar_fragment_chamber | The Scar | Sphere of biological material; object at center |
| scar_wound_floor | The Scar | Floor soft; each step sinks, releases faint warmth |
| scar_root_passage | The Scar | Root-tendons twitch underfoot |
| scar_graft_den | The Scar | The Scar's attempt to process what it couldn't digest |

---

## UPDATE 3 — New §8: Phase 3 Systems (Live)

Add new §8:

### 8.1 Roaming Monsters

Two predator entities patrol fixed routes across the deep sewer.
Defined in `ROAMER_DEFS` in `index.js`.

**The Hollow Warden** (`hollow_guard`)
- Start: `broken_pump_room`
- Patrol: broken_pump_room → submerged_tunnel → flooded_hall → drowned_vault → loop
- Approach cues fire before arrival

**The Cistern Thing** (`sewer_horror`)
- Start: `drowned_vault`
- Patrol: drowned_vault → ash_pillar_hall → sump_pit → ash_pillar_hall → loop

### 8.2 Environmental Hazards

Dynamic hazards spawn in specific rooms on a timer. Defined in `HAZARD_DEFS`.

| Hazard | Rooms | Damage | Duration | Spawn Chance |
|--------|-------|--------|----------|--------------|
| gas_pocket | broken_pump_room, submerged_tunnel, overflow_channel | 3–8 | 8 min | 30% |
| rising_water | flooded_hall, overflow_channel, submerged_tunnel | 2–5 | 12 min | 20% |
| fungal_bloom | ash_pillar_hall, sump_pit, drowned_vault | 1–4 | 15 min | 25% |
| collapse_risk | drowned_vault, cathedral_floor, vermin_nest | 5–14 | 20 min | 15% |

`collapse_risk` is `one_shot: true` — fires once then expires.

### 8.3 Boss Spawn Conditions

Bosses are earned and telegraphed. Defined in `BOSS_DEFS` in `index.js`.
Boss encounters are gated — players must meet conditions before a boss
will appear. This prevents first-visit ambushes.

---

## UPDATE 4 — §4: Economy Systems Update

Update the economy section:

### Equipment-Combat Wiring (implemented)

`aggregateEquipmentStats()` and `applyInstinctAffinities()` are now wired
into combat resolution via `index.js`. The pipeline for every combat:

```
equippedMap = getEquippedItemMap(db, dbAll, uid)
baseEquipStats = aggregateEquipmentStats(equippedMap)
equipStats = applyRaceAffinities(
  applyInstinctAffinities(baseEquipStats, equippedMap, row.instinct),
  row.instinct, row.race || "human"
)
```

**Player attack:** melee_power, accuracy, crit_chance, crit_damage,
spell_power, healing_power from equipStats added to resolvePlayerAction().

**Enemy attack:** defense, dodge, block_value from equipStats added to
resolveEnemyAttack(). Armor absorb visible in combat narrative as `(X absorbed)`.
Cap: min(floor(defense/2), floor(rawDmg * 0.5)).

**Weapon die:** Derived from equipped weapon sub_type:
- dagger / wand / light_blade tag → d6
- sword / mace / spear → d8
- staff / two_handed tag → d10
- default → d6

### Vendor Catalog (implemented)

`data/vendor_catalog.js` is now the authoritative vendor source for
weaponsmith and armorsmith. Items sourced from `EQUIPMENT_DATA`.

**Anti-arbitrage invariant:** sell_price < buy_price for all catalog items.
`getSellPrice(itemId, npcId)` uses `VENDOR_BUY_RATES` from `economy.js`.

### Guild Vault Items (Ember Shard economy)

Each guild leader has a vault pool of 3 Tier 3 items purchasable with
Ember Shards. Defined in `GUILD_VAULT_POOLS` in `index.js`.

| Guild Leader | Items |
|-------------|-------|
| Vaelith | Archive Sigil Band, Ember Scholar Robes, Containment Seal |
| Garruk | Banner Vanguard Mail, Ironblood Bracer, Pressure Buckler |
| Halden | Sanctum Warden Wrap, Hearthborn Pendant, Flame Keeper Hood |
| Lirael | Veil Runner Coat, Market Cipher Ring, Street Ghost Boots |
| Rhyla | Watch Plate Shoulders, Foundation Greaves, Sentinel Shield |
| Serix | Covenant Shroud, Shadow-Threaded Wrap, Void-Touched Ring |

### Currency

1 CC (City Coin) = 100 AM (Ash Marks). Display via `formatAM()`.
Never store CC — only AM. Always display as formatted string.

---

## UPDATE 5 — §9: Progression Visibility

Add to the player-facing UI section:

### Progression Bar — Debug Only

The progression/milestone list in the character panel is **not visible to
players in production**. It is wrapped in a `data-debug="true"` container
with CSS `display: none` by default.

To reveal during development:
```javascript
window.okbDebug = true; // console toggle
```

The game engine reads progression data normally. Only the display is hidden.
This is by design: players should discover their progression through
narrative and NPC reactions, not a checklist.

---

## UPDATE 6 — New Appendix: The Ashen Cycle Calendar

Add to Appendix:

### A.4 The Ashen Cycle — Canonical Calendar

The Ashen Cycle is the in-world dating system. It is used on the website's
Ashen Ledger and will align with in-game journal timestamps.

**Structure:**
- Year = Cycle
- Month = Turn (one of 6)
- Day = Mark

**The Six Turns (fixed array, index 0–5):**
0. Turn of Embers
1. Turn of Veils
2. Turn of Stone
3. Turn of Echoes
4. Turn of Shadows
5. Turn of Ashfall

**Current era:** Cycle 6312

The city has existed since at least Cycle 1. No living person remembers
Cycle 1. The ledger records go back further than anyone has read.

**Standard date format:**
`Mark 7, Turn of Embers, Cycle 6312`

**Short format:**
`7 Embers, C6312`

**Implementation (website):** `lib/calendar.ts` — `formatVerasanthDate()`,
`formatVerasanthDateShort()`, `compareAshenDates()`

**In-game use (planned):** Journal entries and significant events should
use Ashen Cycle dates. ISO dates are never shown to players.

**Canonical dates for website Ledger entries:**
| Entry | Ashen Date |
|-------|-----------|
| First Light | Mark 3, Turn of Embers, Cycle 6312 |
| The Quiet Step | Mark 17, Turn of Embers, Cycle 6312 |
| Echoes in Stone | Mark 4, Turn of Veils, Cycle 6312 |
| The Ledger Does Not Forget | Mark 22, Turn of Veils, Cycle 6312 |
| Ash Doesn't Burn Out | Mark 8, Turn of Stone, Cycle 6312 |
| The Market Knows Your Price | Mark 19, Turn of Stone, Cycle 6312 |
| The Flame Listens Back | Mark 11, Turn of Echoes, Cycle 6312 |
| Below the Last Door | Mark 6, Turn of Shadows, Cycle 6312 |

---

## UPDATE 7 — New Appendix: Canon Timeline

Add to Appendix:

### A.5 Canon Timeline

Two-track timeline: **Public** (what players and readers know) and
**Private** (meta/design context). Public track feeds the website's
Verasanth timeline page. Private track stays in this document.

**Format:** Ashen date | Public event | Private note (if any)

---

#### Cycle 6312 — Public Events

| Ashen Date | Public Event |
|-----------|-------------|
| Mark 3, Turn of Embers | First light recorded in the Ledger. The city opens its eyes. |
| Mark 4, Turn of Veils | Echoes noted in the stone walls of the lower passages. |
| Mark 6, Turn of Shadows | The last door reported by a descender who did not come back the same. |
| Mark 7, Turn of Embers | First stranger arrives at the tavern. The ledger already had their name. |
| Mark 8, Turn of Stone | The Archive's containment flame observed shifting. Ash Doesn't Burn Out. |
| Mark 11, Turn of Echoes | The Sanctum flame observed responding. The Flame Listens Back. |
| Mark 17, Turn of Embers | The quiet step noticed in the southern alleys. |
| Mark 19, Turn of Stone | The Veil Market makes its first recorded move. |
| Mark 22, Turn of Veils | The Warden's ledger records a name twice. |

---

#### Cycle 6312 — Private / Meta Notes

| Real Date | Development Event |
|-----------|-----------------|
| March 24, 2026 | Verasanth Worker deployed live. Phase A dialogue (8 NPCs) implemented. Claude bleed-through closed. |
| March 24, 2026 | Game Bible v2.8 → v2.9. Dialogue wiring verified. |
| March 25, 2026 | theoffkeybard.com launched. Homepage, Ashen Ledger, Verasanth lore hub live. |
| March 25, 2026 | Phase B guild leaders (6) dialogue modules implemented. |
| March 25, 2026 | Equipment-combat wiring complete. Economy loop functional. |
| March 26, 2026 | The Ashen Cycle calendar implemented on website. |
| March 26, 2026 | Guild Mastery Trials implemented (services/guild_trials.js). |
| March 26, 2026 | The Scar zone added (data/scar_rooms.js). |
| March 26, 2026 | The Bard's Journal launched (/journal). |

---

#### Future Events (planned, not yet canon)

| Planned Ashen Date | Planned Event |
|-------------------|--------------|
| Turn of Ashfall, Cycle 6312 | Arc 1 climax. The resonance event completes. |
| Cycle 6313 | Arc 2 begins. What was contained responds. |

---

## UPDATE 8 — Version History

Add to document footer:

**v3.0 — March 26, 2026:**
Guild Mastery Trials documented (§6): all six guilds, three trials each,
choice flags, gate conditions, playtest threshold notes. The Scar zone
documented (§7): 10 nodes, biological identity, dynamic exit system.
Phase 3 systems documented (§8): roaming monsters (Hollow Warden, Cistern
Thing), environmental hazards (gas_pocket, rising_water, fungal_bloom,
collapse_risk), boss spawn conditions. Economy systems updated: equipment-
combat wiring confirmed, vendor catalog consolidated, guild vault items
documented, currency display rules. Progression bar moved to debug-only
visibility. The Ashen Cycle calendar added to Appendix A.4 — Cycle 6312
canonical, six Turns documented, website implementation noted. Canon timeline
added to Appendix A.5 — public events in Ashen dates, private meta notes
in real dates, future events placeholder.

---

*Merge these updates into Game Bible v2.9 to produce v3.0.*
*The Scar is open. The trials are live. The city has a calendar.*
*Cycle 6312. The ledger is current. The walls remember more than they say.*
