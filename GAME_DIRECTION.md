# Verasanth — Game Direction Blueprint (For Cursor Plan/Agent)

## 1. Core Vision

Verasanth is a dark, atmospheric hub city built in the shadow of a massive mountain. It serves as the central location for a text-based roguelite RPG where players return between runs. The city is defined by pressure, scarcity, subtle magic, and environmental storytelling. NPCs speak briefly but meaningfully. The world expands outward into dungeons, forests, sewers, and mountain tunnels.

The tone is grounded, quiet, and mysterious, with emphasis on player discovery rather than exposition.

## 2. Gameplay Structure

- The game is a **hub → run → return** loop.
- **Verasanth** acts as the persistent hub where:
  - NPCs offer services, upgrades, and story fragments.
  - Shops and crafting stations exist.
  - The player receives quests, rumors, and world hints.
- **Runs** occur in procedurally structured zones:
  - Mountain tunnels
  - Forest outskirts
  - Sewer undercity
  - Future expansions (modular)

Each run provides:
- Loot
- Resources
- Lore fragments
- NPC relationship progress

## 3. World Pillars

These guide tone, writing, and design:

- **Oppression** — The mountain blocks sunlight; fog and cold dominate.
- **Decay** — Old stone, old magic, old grudges.
- **Subtlety** — NPCs reveal little; the world hints rather than explains.
- **Resilience** — People endure, adapt, and survive.
- **Environmental Storytelling** — Walls, objects, and spaces tell stories.

## 4. City Layout (High-Level)

The city is compact, vertical, and claustrophobic.

- **Mountain-Facing Quarter** — Shadowed homes, strange noises, cold air.
- **Market Veins** — Narrow streets with smiths, traders, alchemists.
- **Central Spine** — Taverns, guild halls, adventurer hubs.
- **Forest Gate** — City edge leading to the woods.
- **Undercity Sewers** — Tunnels, runoff chambers, forgotten shrines.

Each district should be modular and expandable.

## 5. Key NPCs (Tone + Function)

NPCs speak in short, grounded lines. They rarely reveal full truths.

- **Kelvaris Thornbeard (Bartender)**
  - Tone: Polite, observant, grounded.
  - Function: Social hub, rumors, light quest hooks.

- **Caelir Dawnforge (Weaponsmith)**
  - Tone: Elegant, precise, out-of-place refinement.
  - Function: Weapon upgrades, crafted gear.

- **Veyra (Silent Shopkeeper)**
  - Tone: Minimal speech, heavy environmental storytelling.
  - Function: Rare items, mysterious lore fragments.

- **Seris Vantrel (General Trader)**
  - Tone: Calm, enigmatic, quietly dangerous.
  - Function: General goods, consumables, run supplies.

- **Alchemist/Herbalist (In Development)**
  - Tone: Practical with hints of the uncanny.
  - Function: Potions, buffs, run modifiers.

NPCs should evolve as the player progresses.

## 6. Systems to Support

These are the systems Cursor should help build over time:

- Dialogue system (short lines, branching but minimal)
- Inventory + item system
- Shop system
- Run generation system (zones, encounters, loot tables)
- NPC progression system
- Environmental storytelling objects
- Save/load persistence
- Modular content expansion framework

## 7. Writing Style Guide

- Keep dialogue short, grounded, and suggestive, not expository.
- Avoid lore dumps.
- Use sensory details (cold air, stone, fog, echoes).
- Use implied history rather than explicit explanations.
- Maintain a tone of quiet tension and subtle magic.

## 8. Technical Goals

- Code should be modular and easy to expand.
- Zones should be defined as data-driven structures (JSON or similar).
- NPCs should have stateful progression.
- Runs should be semi-randomized but curated.
- UI should be simple, readable, and atmospheric.

## 9. Long-Term Direction

- Expand Verasanth with new districts.
- Add new run zones tied to city lore.
- Introduce faction systems.
- Add dynamic city events that reflect player progress.
- Build toward a layered, interconnected world.

## 10. Constraints

- No high fantasy tropes (no flashy magic, no verbose wizards).
- No comedic tone.
- No modern slang.
- Everything must feel old, weathered, and lived-in.
- NPCs never fully explain themselves.

## 11. What Cursor Should Prioritize

- Maintain tone consistency.
- Keep systems modular.
- Build reusable components.
- Avoid overcomplication.
- Always align new content with the city's themes and atmosphere.

---

## Alignment (Current Codebase vs Blueprint)

*For future plans and agents: what already matches and what to adjust.*

### Already aligned

- **Hub**: Verasanth as persistent hub; tavern/inn (Kelvaris), market square, roads.
- **Run zones**: Sewers implemented as first dungeon; combat, loot (Ash Marks), death/respawn at tavern.
- **NPCs**: Kelvaris (bartender), Caelir (weaponsmith at Dawnforge Atelier), Thalara (alchemist at Hollow Jar), Seris Vantrel (curator at market stall), Veyra (armorsmith at Mended Hide).
- **Tone**: Short Claude-driven dialogue; atmospheric room descriptions; environmental storytelling (objects, board, sanctuary, Dask thread).
- **Persistence**: D1 backend; character, flags, inventory, combat state, sessions.

### Naming / role mismatches

- **Blueprint**: "Veyra = Silent Shopkeeper" (rare items, lore fragments). **Code**: Veyra is armorsmith at Mended Hide (armor, repair). Decide whether to relabel in blueprint or add rare/lore role in code.
- **Blueprint**: "Seris Vantrel = General Trader" (general goods, consumables). **Code**: Seris is Veiled Curator at market stall (notices, sell/browse); Still Scale has a separate generic "trader" for general stock. Either map "General Trader" to Still Scale in the doc or treat Seris as trader + curator hybrid.

### District labels

- **Blueprint**: Mountain-Facing Quarter, Market Veins, Central Spine, Forest Gate, Undercity Sewers.
- **Code**: North Road (Threshold District), South Road (Low Quarter), East Road (Ember Quarter), West Road (Pale Rise), market_square, sewer_* rooms. Use code IDs as canonical; optional one-time mapping in this doc if adding blueprint names to UI later.

### Systems to build (from §6)

- Run generation (procedural zones/encounters beyond fixed sewer).
- Fuller shop/inventory flow (buy/sell, item use).
- NPC progression (relationship/quest hooks).
- Modular content framework (e.g. zones as data files rather than single WORLD const).

Prioritize in a separate technical roadmap when ready.
