# Cursor Prompt — Mapping System Implementation
# Reference: verasanth_mapping_system_blueprint.md
# Touch: index.js, index.html

---

## ARCHITECTURE CONSTRAINT — READ FIRST

Verasanth runs as a single Cloudflare Worker. There is no module bundler,
no import system, and no separate files that get loaded at runtime.

- MAP_DATA and LOCATION_TO_MAP go in index.js as named constants
- All renderer functions go in index.html's script section
- Do NOT create data/maps.js or services/map_renderer.js
- Organize with clearly labeled comment blocks, not file splits

---

## ROOM ID — RESOLVE THIS FIRST

Before writing any map data, check WORLD_BASE in index.js and confirm
whether the warden area room is keyed as `north_road` or `wardens_post`.

Use whichever ID actually exists in WORLD_BASE in both MAP_DATA and
LOCATION_TO_MAP. Do not invent a room ID that isn't in WORLD_BASE.
This document uses `north_road` as the assumed canonical ID — correct
it if WORLD_BASE says otherwise.

---

## WHAT TO BUILD

A data-driven SVG sidebar map that:
- Renders the city surface from MAP_DATA
- Highlights the player's current room
- Supports discovered vs undiscovered nodes
- Updates on every room move AND on map tab switch
- Is architecturally ready for sewer floor maps without any renderer changes

Do not redesign room movement. WORLD_BASE and all navigation logic are
unchanged. This is a visualization layer only.

---

## STEP 1 — MAP_DATA Constant (index.js)

Add this as a named constant in a clearly labeled section:

```js
// ── Map Data ──────────────────────────────────────────────────────

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

  // Sewer stubs — content added in future passes, architecture ready now
  sewer_floor_1: { id: "sewer_floor_1", label: "Sewer — Floor 1", viewBox: "0 0 200 200", nodes: {}, links: [] },
  sewer_floor_2: { id: "sewer_floor_2", label: "Sewer — Floor 2", viewBox: "0 0 200 200", nodes: {}, links: [] },
  sewer_floor_3: { id: "sewer_floor_3", label: "Sewer — Floor 3", viewBox: "0 0 200 200", nodes: {}, links: [] },
  sewer_floor_4: { id: "sewer_floor_4", label: "Sewer — Floor 4", viewBox: "0 0 200 200", nodes: {}, links: [] },
  sewer_floor_5: { id: "sewer_floor_5", label: "Sewer — Floor 5", viewBox: "0 0 200 200", nodes: {}, links: [] },
};
```

---

## STEP 2 — LOCATION_TO_MAP Constant (index.js)

```js
const LOCATION_TO_MAP = {
  // City surface
  market_square:         "city_surface",
  north_road:            "city_surface",
  south_road:            "city_surface",
  east_road:             "city_surface",
  west_road:             "city_surface",
  tavern:                "city_surface",
  atelier:               "city_surface",
  mended_hide:           "city_surface",
  still_scale:           "city_surface",
  hollow_jar:            "city_surface",
  ashen_sanctuary:       "city_surface",
  sewer_entrance:        "city_surface",

  // Sewer floor 1
  sewer_upper:           "sewer_floor_1",
  sewer_den:             "sewer_floor_1",
  sewer_channel:         "sewer_floor_1",
  sewer_gate:            "sewer_floor_1",

  // Sewer floor 2
  sewer_deep:            "sewer_floor_2",
  sewer_mid_flooded:     "sewer_floor_2",
  sewer_mid_barracks:    "sewer_floor_2",
  sewer_mid_cistern:     "sewer_floor_2",
  sewer_mid_drain:       "sewer_floor_2",

  // Sewer floor 3
  sewer_deep_threshold:  "sewer_floor_3",
  sewer_deep_vault:      "sewer_floor_3",
  sewer_deep_foundation: "sewer_floor_3",
};
```

Add any additional room IDs that exist in WORLD_BASE but are missing here.

---

## STEP 3 — HTML (index.html)

Add this map section to the sidebar, inside the Map tab panel:

```html
<section class="sidebar-section" id="map-section">
  <h3 class="section-title">Map</h3>
  <div id="map-container">
    <svg id="dynamic-map" viewBox="0 0 200 200"
         preserveAspectRatio="xMidYMid meet"></svg>
  </div>
  <div id="location-label">Unknown Location</div>
  <div id="map-subtitle">Unknown Region</div>
</section>
```

---

## STEP 4 — CSS (index.html)

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

.map-link              { stroke: var(--border-warm); stroke-width: 1.5;
                         stroke-dasharray: 4; opacity: 0.7; }
.map-link.locked       { opacity: 0.3; stroke-dasharray: 2 4; }

.map-node              { fill: var(--bg); stroke: var(--border-warm);
                         stroke-width: 1; transition: all 0.25s ease; }
.map-node.discovered   { opacity: 1; }
.map-node.undiscovered { opacity: 0.15; }
.map-node.adjacent     { stroke: var(--ember); }
.map-node.current      { fill: var(--ember); stroke: #fff;
                         filter: drop-shadow(0 0 5px var(--ember)); }
.map-node.safe         { stroke-width: 1.5; }
.map-node.danger       { stroke-width: 1.5; }

#location-label {
  font-size: 0.8rem; color: var(--ember);
  text-align: center; text-transform: uppercase; letter-spacing: 1px;
}
#map-subtitle {
  font-size: 0.7rem; color: var(--muted);
  text-align: center; text-transform: uppercase; letter-spacing: 1px;
}
```

---

## STEP 5 — Renderer Functions (index.html script section)

Implement these exact functions:

```js
function getCurrentMapId(roomId) {
  return LOCATION_TO_MAP[roomId] || null;
}

function getMapDefinition(mapId) {
  return MAP_DATA[mapId] || null;
}

function getEdgeKey(a, b) {
  return [a, b].sort().join("::");
}

function getAdjacentNodeIds(mapDef, currentRoomId) {
  const adj = [];
  for (const [a, b] of mapDef.links) {
    if (a === currentRoomId) adj.push(b);
    if (b === currentRoomId) adj.push(a);
  }
  return adj;
}

function buildNodeClass(nodeMeta, isCurrent, isDiscovered, isAdjacent) {
  const parts = ["map-node", nodeMeta.node_type || ""];
  if (isCurrent)    parts.push("current");
  else if (isAdjacent)  parts.push("adjacent", "discovered");
  else if (isDiscovered) parts.push("discovered");
  else parts.push("undiscovered");
  return parts.filter(Boolean).join(" ");
}
```

---

## STEP 6 — updateSidebarMap (index.html script section)

```js
// Discovery — add rooms as player visits them
const discoveredLocations = new Set(["market_square", "west_road", "tavern"]);
const RENDER_UNDISCOVERED_NODES = false;

function updateSidebarMap(currentRoomId) {
  const svg      = document.getElementById("dynamic-map");
  const label    = document.getElementById("location-label");
  const subtitle = document.getElementById("map-subtitle");

  // Safe clear
  while (svg.firstChild) svg.removeChild(svg.firstChild);

  const mapId  = getCurrentMapId(currentRoomId);
  const mapDef = mapId ? getMapDefinition(mapId) : null;

  if (!mapDef || !currentRoomId) {
    if (label)    label.textContent = "Unknown Location";
    if (subtitle) subtitle.textContent = "Map Unavailable";
    return;
  }

  svg.setAttribute("viewBox", mapDef.viewBox || "0 0 200 200");

  const adjacentIds = getAdjacentNodeIds(mapDef, currentRoomId);
  const drawnEdges  = new Set();

  // Draw links first
  for (const [a, b] of mapDef.links) {
    const key = getEdgeKey(a, b);
    if (drawnEdges.has(key)) continue;
    drawnEdges.add(key);

    const nodeA = mapDef.nodes[a];
    const nodeB = mapDef.nodes[b];
    if (!nodeA || !nodeB) continue;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", nodeA.x); line.setAttribute("y1", nodeA.y);
    line.setAttribute("x2", nodeB.x); line.setAttribute("y2", nodeB.y);
    line.setAttribute("class", "map-link");
    svg.appendChild(line);
  }

  // Draw nodes
  for (const [nodeId, nodeMeta] of Object.entries(mapDef.nodes)) {
    const isCurrent    = nodeId === currentRoomId;
    const isDiscovered = isCurrent || discoveredLocations.has(nodeId);
    const isAdjacent   = adjacentIds.includes(nodeId);

    if (!isCurrent && !isDiscovered && !isAdjacent && !RENDER_UNDISCOVERED_NODES) continue;

    const radius = nodeMeta.node_type === "hub" ? 7 : 5;
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", nodeMeta.x);
    circle.setAttribute("cy", nodeMeta.y);
    circle.setAttribute("r",  radius);
    circle.setAttribute("class", buildNodeClass(nodeMeta, isCurrent, isDiscovered, isAdjacent));
    svg.appendChild(circle);
  }

  // Mark as discovered
  if (currentRoomId) discoveredLocations.add(currentRoomId);

  // Update labels
  const currentNode = mapDef.nodes[currentRoomId];
  if (label)    label.textContent    = currentNode?.label || currentRoomId;
  if (subtitle) subtitle.textContent = mapDef.label || "";
}
```

---

## STEP 7 — Wire Trigger Points

updateSidebarMap must be called in exactly three places:

**1. After loadGame() renders the first room:**
At the end of the loadGame() function, after renderRoom() completes,
add: `updateSidebarMap(currentLocation);`
where `currentLocation` is whatever variable holds the player's current room ID.

**2. After every room movement:**
At the end of renderRoom(data), add:
`updateSidebarMap(data.location);`

**3. On map tab switch:**
Find the click handler for the Map tab in the sidebar tab system.
Add: `updateSidebarMap(currentLocation);`
This ensures the SVG renders correctly even if the tab was hidden on initial load.

---

## VERIFICATION

1. Load the game → city map renders in sidebar
2. Player is in tavern → tavern node is ember-highlighted
3. Move to market_square → market_square highlights, tavern becomes discovered
4. Adjacent rooms to current location get ember-outlined treatment
5. Rooms never visited stay hidden (RENDER_UNDISCOVERED_NODES = false)
6. Switch to Map tab after arriving in a room → map is correct, not blank
7. Enter a sewer room → map shows "Map Unavailable" gracefully (sewer stubs have no nodes yet)
8. No duplicate link lines anywhere on city map
9. Page does not crash if a room ID is missing from LOCATION_TO_MAP

---

## DO NOT DO

- Do not modify WORLD_BASE or any navigation logic
- Do not create separate JS files
- Do not infer map links from room exit data
- Do not render all rooms by default
- Do not build a single monolithic world map
- Do not add any new API endpoints — this is frontend-only
