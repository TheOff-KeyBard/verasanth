# Verasanth Mapping System Blueprint
**Version:** 0.2  
**Audience:** Cursor Planner / Cursor Coder  
**Scope:** Mapping system only. Do not redesign movement, combat, quests, or world progression in this phase.  
**Purpose:** Upgrade Verasanth's current node-based map display into a data-driven, multi-map SVG sidebar renderer that supports discovery, future sewer floor maps, and later expansion to forest/caves without replacing the working room-node movement system.

---

## ARCHITECTURE NOTE — READ FIRST

Verasanth runs as a single Cloudflare Worker (`index.js`) with no module bundler or import system. All map constants, data structures, and server-side helpers must live inside `index.js` as named constants. All renderer functions must live inside `index.html`'s script section. References in this blueprint to `data/maps.js` or `services/map_renderer.js` describe logical grouping only — implement them as clearly comment-headed sections within the appropriate single file.

---

## 0. Rules for Cursor

1. Do not redesign room movement in this phase.
2. Do not replace `WORLD_BASE` as the source of room navigation.
3. Do not hardcode the map directly into the renderer.
4. Do not build the forest, caves, catacombs, or portal maps yet.
5. Do not tie rendering logic to one hardcoded city-only function.
6. Do not assume one global map is enough. Build for multiple maps now.
7. Do not reveal all rooms automatically. Discovery must be supported.
8. Implement this as a visualization and data-architecture improvement, not a movement rewrite.

---

## 1. Current State & Design Principle

Verasanth uses a node-based room system that works well for text MMO navigation, encounter checks, NPC location logic, and quest hooks. The weakness is not that nodes exist — it is that the map display layer does not scale to city/sewer floor separation, discovered vs undiscovered rooms, hidden routes, locked routes, or party markers.

**Design principle: Keep the node-based room graph for movement. Upgrade the map metadata and rendering layer only.**

---

## 2. Core Architecture

Separate the system into four distinct responsibilities:

| Constant / Function | Responsibility |
|---|---|
| `WORLD_BASE` | Navigation truth — rooms, exits, encounter logic. Unchanged. |
| `MAP_DATA` | Visual map truth — node coordinates, links, labels, node types. |
| `LOCATION_TO_MAP` | Registry mapping each room ID to its parent map ID. |
| `updateSidebarMap()` | Shared SVG renderer called on every room change and tab switch. |

`MAP_DATA` and `LOCATION_TO_MAP` live in `index.js` as named constants. `updateSidebarMap()` and all renderer helpers live in `index.html`'s script section.

---

## 3. Room ID Clarification — wardens_post vs north_road

> **Warning:** The original v0.1 blueprint referenced `wardens_post` as a map node. The actual room ID in `WORLD_BASE` is `north_road`. These must match.

Before implementation, confirm which ID is canonical in `WORLD_BASE`. Use that ID in both `MAP_DATA` and `LOCATION_TO_MAP`. Do not create a `wardens_post` room that does not exist in `WORLD_BASE`, and do not reference `north_road` in map data if `WORLD_BASE` uses `wardens_post`. One source of truth.

---

## 4. MAP_DATA Structure

Implement as a constant named `MAP_DATA` in `index.js`. City surface must be fully populated in this phase. Sewer floor IDs must exist as empty stubs now so the architecture is ready.

```js
const MAP_DATA = {
  city_surface: {
    id: "city_surface",
    label: "City Surface",
    viewBox: "0 0 200 200",
    nodes: {
      market_square:   { x: 100, y: 100, label: "Market Square",     node_type: "hub" },
      north_road:      { x: 100, y: 70,  label: "North Road",        node_type: "street" },
      south_road:      { x: 100, y: 130, label: "South Road",        node_type: "street" },
      east_road:       { x: 130, y: 100, label: "East Road",         node_type: "street" },
      west_road:       { x: 70,  y: 100, label: "Pale Rise",         node_type: "street" },
      tavern:          { x: 70,  y: 70,  label: "Shadow Hearth",     node_type: "inn" },
      atelier:         { x: 130, y: 70,  label: "Dawnforge Atelier", node_type: "shop" },
      mended_hide:     { x: 70,  y: 130, label: "The Mended Hide",   node_type: "shop" },
      still_scale:     { x: 130, y: 130, label: "The Still Scale",   node_type: "shop" },
      hollow_jar:      { x: 150, y: 115, label: "The Hollow Jar",    node_type: "shop" },
      ashen_sanctuary: { x: 150, y: 140, label: "Ashen Sanctuary",   node_type: "sanctuary" },
      sewer_entrance:  { x: 100, y: 155, label: "Sewer Entrance",    node_type: "dungeon_entrance" }
    },
    links: [
      ["market_square", "north_road"],
      ["market_square", "south_road"],
      ["market_square", "east_road"],
      ["market_square", "west_road"],
      ["west_road",     "tavern"],
      ["east_road",     "atelier"],
      ["south_road",    "mended_hide"],
      ["south_road",    "still_scale"],
      ["east_road",     "hollow_jar"],
      ["east_road",     "ashen_sanctuary"],
      ["market_square", "sewer_entrance"]
    ]
  },

  // Sewer floor stubs — architecture ready, content added in future passes
  sewer_floor_1: { id: "sewer_floor_1", label: "Sewer — Floor 1", viewBox: "0 0 200 200", nodes: {}, links: [] },
  sewer_floor_2: { id: "sewer_floor_2", label: "Sewer — Floor 2", viewBox: "0 0 200 200", nodes: {}, links: [] },
  sewer_floor_3: { id: "sewer_floor_3", label: "Sewer — Floor 3", viewBox: "0 0 200 200", nodes: {}, links: [] },
  sewer_floor_4: { id: "sewer_floor_4", label: "Sewer — Floor 4", viewBox: "0 0 200 200", nodes: {}, links: [] },
  sewer_floor_5: { id: "sewer_floor_5", label: "Sewer — Floor 5", viewBox: "0 0 200 200", nodes: {}, links: [] },
};
```

> Links are explicit, not inferred from room exits. This allows future hidden, locked, or one-way routes to exist in `WORLD_BASE` without appearing on the player map.

---

## 5. LOCATION_TO_MAP Registry

Maps every room ID to its parent map. Must cover all current city surface rooms and all known sewer rooms:

```js
const LOCATION_TO_MAP = {
  // City surface
  market_square:    "city_surface",
  north_road:       "city_surface",
  south_road:       "city_surface",
  east_road:        "city_surface",
  west_road:        "city_surface",
  tavern:           "city_surface",
  atelier:          "city_surface",
  mended_hide:      "city_surface",
  still_scale:      "city_surface",
  hollow_jar:       "city_surface",
  ashen_sanctuary:  "city_surface",
  sewer_entrance:   "city_surface",

  // Sewer floor 1 — The Drains
  drain_entrance:        "sewer_floor_1",
  overflow_channel:      "sewer_floor_1",
  broken_pipe_room:      "sewer_floor_1",
  vermin_nest:           "sewer_floor_1",
  workers_alcove:        "sewer_floor_1",
  rusted_gate:           "sewer_floor_1",

  // Sewer floor 2 — Forgotten Channels
  fungal_bloom_chamber:  "sewer_floor_2",
  collapsed_passage:     "sewer_floor_2",
  old_maintenance_room:  "sewer_floor_2",
  echoing_hall:          "sewer_floor_2",
  spore_garden:          "sewer_floor_2",
  cracked_aqueduct:      "sewer_floor_2",

  // Sewer floor 3 — Cistern Depths
  flooded_hall:          "sewer_floor_3",
  drowned_archive:       "sewer_floor_3",
  submerged_tunnel:      "sewer_floor_3",
  broken_pump_room:      "sewer_floor_3",
  drowned_vault:         "sewer_floor_3",
  sluice_gate:           "sewer_floor_3",

  // Sewer floor 4 — Mechanist's Spine
  gear_hall:             "sewer_floor_4",
  steam_vent_corridor:   "sewer_floor_4",
  broken_regulator_chamber: "sewer_floor_4",
  iron_walkway:          "sewer_floor_4",
  heart_pump:            "sewer_floor_4",
  pressure_valve_shaft:  "sewer_floor_4",

  // Sewer floor 5 — Sump Cathedral + Foundation
  ash_pillar_hall:       "sewer_floor_5",
  whispering_chamber:    "sewer_floor_5",
  rune_lit_corridor:     "sewer_floor_5",
  cathedral_floor:       "sewer_floor_5",
  ash_heart_chamber:     "sewer_floor_5",
  sump_pit:              "sewer_floor_5",
  sewer_deep_foundation: "sewer_floor_5",
};
```

---

## 6. Node Types

Support node typing via CSS classes, not hardcoded room-specific logic.

| Type | Visual Meaning | Example CSS |
|------|---------------|-------------|
| `hub` | Slightly larger radius | `map-node hub` |
| `street` | Standard neutral node | `map-node street` |
| `shop` | Neutral, commerce feel | `map-node shop` |
| `inn` | Safe/rest feeling | `map-node inn` |
| `sanctuary` | Unique outline | `map-node sanctuary` |
| `dungeon_entrance` | Visually distinct, ominous | `map-node dungeon_entrance` |
| `safe` | Thicker warm border | `map-node safe` |
| `danger` | Sharper/warning appearance | `map-node danger` |

---

## 7. CSS Requirements

```css
#map-container {
  width: 100%;
  height: 250px;
  background: var(--bg3);
  border: 1px solid var(--border-warm);
  border-radius: 4px;
  position: relative;
  overflow: hidden;
  margin-bottom: 10px;
}

#dynamic-map { width: 100%; height: 100%; }

.map-link              { stroke: var(--border-warm); stroke-width: 1.5; stroke-dasharray: 4; opacity: 0.7; }
.map-link.locked       { opacity: 0.3; stroke-dasharray: 2 4; }

.map-node              { fill: var(--bg); stroke: var(--border-warm); stroke-width: 1; transition: all 0.25s ease; }
.map-node.discovered   { opacity: 1; }
.map-node.undiscovered { opacity: 0.15; }
.map-node.adjacent     { stroke: var(--ember); }
.map-node.current      { fill: var(--ember); stroke: #fff; filter: drop-shadow(0 0 5px var(--ember)); }
.map-node.safe         { stroke-width: 1.5; }
.map-node.danger       { stroke-width: 1.5; }

#location-label {
  font-size: 0.8rem;
  color: var(--ember);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}

#map-subtitle {
  font-size: 0.7rem;
  color: var(--muted);
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1px;
}
```

---

## 8. HTML Structure

```html
<section class="sidebar-section" id="map-section">
  <h3 class="section-title">Map</h3>
  <div id="map-container">
    <svg id="dynamic-map" viewBox="0 0 200 200" preserveAspectRatio="xMidYMid meet"></svg>
  </div>
  <div id="location-label">Unknown Location</div>
  <div id="map-subtitle">Unknown Region</div>
</section>
```

`#location-label` shows current room display name. `#map-subtitle` shows active map label (e.g. `City Surface`). Neither should be hardcoded in HTML.

---

## 9. Required Renderer Functions

All implemented as named functions in `index.html`'s script section.

```js
getCurrentMapId(roomId)
// Looks up LOCATION_TO_MAP, returns map ID or null

getMapDefinition(mapId)
// Returns MAP_DATA[mapId] or null

getEdgeKey(a, b)
// Returns sorted "a::b" string to prevent duplicate link rendering

getAdjacentNodeIds(mapDef, currentRoomId)
// Returns array of node IDs directly linked to current room via links array

shouldRenderNode(nodeId, currentRoomId, discoveredLocations, adjacentIds)
// Returns boolean based on discovery and adjacency state

buildNodeClass(nodeMeta, isCurrent, isDiscovered, isAdjacent)
// Returns CSS class string for the node element

updateSidebarMap(currentRoomId, discoveredLocations)
// Master renderer — clears SVG and redraws entire map
```

### updateSidebarMap Responsibilities

1. Determine active `mapId` from `LOCATION_TO_MAP`
2. Load map definition from `MAP_DATA`
3. Safely clear the SVG element
4. Set SVG `viewBox` from map metadata
5. Draw links first using `getEdgeKey` deduplication
6. Draw nodes second with correct CSS classes
7. Highlight the current node
8. Update `#location-label` with current room display name
9. Update `#map-subtitle` with active map label
10. Fail safely and silently if any data is missing — no crash

---

## 10. Discovery System

The map must not auto-reveal all rooms. Pass a `discoveredLocations` Set into the renderer:

```js
// First-pass default — player starts knowing the tavern area
const discoveredLocations = new Set(["market_square", "west_road", "tavern"]);

// Control whether fully undiscovered nodes render at all
const RENDER_UNDISCOVERED_NODES = false;
```

**Discovery rules:**
- Current location always renders regardless of discovery state
- Discovered nodes render at full opacity with class `discovered`
- Adjacent nodes (directly linked to current room) get class `adjacent`
- Undiscovered nodes render at 0.15 opacity or are hidden per `RENDER_UNDISCOVERED_NODES`

Add each room to `discoveredLocations` when the player first visits it. Persist in character flags or a DB column in a future pass.

---

## 11. updateSidebarMap Trigger Points

> **This function must be called in all three situations below or the map will fall out of sync.**

| Trigger | Where to wire it |
|---------|-----------------|
| Initial character load | After `loadGame()` renders the first room |
| After every room movement | At the end of `doMove()` / `renderRoom()` |
| On map tab switch | When the player clicks the Map tab in the sidebar — SVG may not have rendered yet if the tab was hidden on load |

---

## 12. Implementation Order

1. Add HTML map section placeholder
2. Add all CSS classes for container, nodes, links, labels, and states
3. Add `MAP_DATA` constant with `city_surface` fully populated and sewer floors as empty stubs
4. Add `LOCATION_TO_MAP` constant covering all current rooms
5. Implement shared renderer helper functions
6. Implement `updateSidebarMap()`
7. Wire `updateSidebarMap()` into `renderRoom()` and initial `loadGame()`
8. Wire `updateSidebarMap()` into map tab switch handler
9. Implement discovery-aware rendering
10. Add adjacent node styling

---

## 13. Test Cases

### Basic Render
- City map renders in sidebar on first load
- Current room node is highlighted ember
- Room label matches current room name
- Map subtitle shows "City Surface"

### Link Behavior
- All city links render once — no duplicate overlapping lines
- `getEdgeKey` deduplication is active

### Discovery
- Discovered nodes render at full opacity
- Undiscovered nodes do not break the SVG
- Current node always renders even if not in `discoveredLocations`

### Fallback
- Missing current room does not crash the page
- Missing map data does not crash the page
- Invalid node coordinates fail safely

### Tab Switch
- Switching to the Map tab when already in a room renders the correct map
- No blank SVG after tab switch

### Extensibility
- Changing `LOCATION_TO_MAP` for a room to point at `sewer_floor_1` switches the rendered map without touching the renderer function

---

## 14. Hard Do-Not-Do List

1. Do not rewrite navigation to a grid system.
2. Do not embed all map coordinates inside `WORLD_BASE`.
3. Do not infer every visual connection directly from room exits.
4. Do not show undiscovered late-game zones by default.
5. Do not build a single monolithic world map for all biomes.
6. Do not tie map rendering to one hardcoded city-only function.
7. Do not break current room travel while improving the map.
8. Do not implement hidden-route logic yet beyond structural support.

---

## 15. Phase Exit Conditions

This phase is complete when:

1. Verasanth has a data-driven SVG sidebar map.
2. City surface map renders from `MAP_DATA`, not hardcoded renderer logic.
3. Current room is highlighted correctly.
4. Sidebar displays both current room name and current map label.
5. Duplicate links are prevented via `getEdgeKey`.
6. Discovery-aware rendering is supported.
7. Map updates correctly on room movement AND on map tab switch.
8. Architecture is ready for sewer floor map metadata to be added without renderer changes.
9. Room movement still uses the existing node-based system unchanged.

---

## One-Sentence Summary

**Implement a multi-map, data-driven SVG sidebar map renderer for Verasanth that keeps node-based movement intact while adding discovery, current-location highlighting, and future-ready support for sewer floor maps.**
