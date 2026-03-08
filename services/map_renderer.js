/**
 * Shared map renderer for sidebar SVG.
 * Data-driven; supports multiple maps and discovery.
 */

import { MAP_DATA, LOCATION_TO_MAP, RENDER_UNDISCOVERED_NODES } from "../data/maps.js";

let _lastRenderedDiscovered = new Set();

export function getEdgeKey(a, b) {
  return [a, b].sort().join("::");
}

export function getCurrentMapId(roomId) {
  return LOCATION_TO_MAP[roomId] || null;
}

export function getMapDefinition(mapId) {
  return MAP_DATA[mapId] || null;
}

export function getAdjacentNodeIds(mapDef, currentRoomId) {
  if (!mapDef?.links) return new Set();
  const adjacent = new Set();
  for (const [a, b] of mapDef.links) {
    if (a === currentRoomId) adjacent.add(b);
    if (b === currentRoomId) adjacent.add(a);
  }
  return adjacent;
}

export function shouldRenderNode(nodeId, currentRoomId, discoveredLocations, adjacentIds) {
  if (nodeId === currentRoomId) return true;
  if (discoveredLocations.has(nodeId)) return true;
  if (adjacentIds.has(nodeId)) return true;
  return RENDER_UNDISCOVERED_NODES;
}

/** Radius by node_type: hub largest, inn/sanctuary medium, street/safe/danger default. */
const NODE_RADIUS = { hub: 9, inn: 6, sanctuary: 6, street: 5, shop: 5, safe: 5, danger: 5, dungeon_entrance: 5 };

export function buildNodeClass(nodeMeta, isCurrent, isDiscovered, isAdjacent) {
  const parts = ["map-node"];
  if (isCurrent) parts.push("current");
  else if (isDiscovered) parts.push("discovered");
  else parts.push("undiscovered");
  if (isAdjacent && !isCurrent) parts.push("adjacent");
  if (nodeMeta?.node_type) parts.push("node-" + nodeMeta.node_type);
  return parts.join(" ");
}

function createNodeElement(meta, cls, label, nodeId = "") {
  const type = meta?.node_type || "street";
  const r = NODE_RADIUS[type] ?? 5;
  const isCurrent = cls.includes("current");
  const radius = isCurrent ? Math.max(r, 8) : r;

  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = label;

  const setCommon = (el) => {
    el.setAttribute("class", cls);
    if (nodeId) el.setAttribute("data-node-id", nodeId);
    el.appendChild(title);
  };

  if (type === "shop") {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const s = radius * 1.4;
    rect.setAttribute("x", meta.x - s / 2);
    rect.setAttribute("y", meta.y - s / 2);
    rect.setAttribute("width", s);
    rect.setAttribute("height", s);
    setCommon(rect);
    return rect;
  }
  if (type === "dungeon_entrance") {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const s = radius * 1.4;
    rect.setAttribute("x", meta.x - s / 2);
    rect.setAttribute("y", meta.y - s / 2);
    rect.setAttribute("width", s);
    rect.setAttribute("height", s);
    rect.setAttribute("transform", `rotate(45 ${meta.x} ${meta.y})`);
    setCommon(rect);
    return rect;
  }
  const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
  circle.setAttribute("cx", meta.x);
  circle.setAttribute("cy", meta.y);
  circle.setAttribute("r", radius);
  setCommon(circle);
  return circle;
}

export function updateSidebarMap(currentRoomId, discoveredLocations, locationNamesMap = {}, district = "") {
  const svgEl = document.getElementById("dynamic-map");
  const locationLabel = document.getElementById("location-label");
  const mapSubtitle = document.getElementById("map-subtitle");
  const mapDistrictLabel = document.getElementById("map-district-label");

  if (!svgEl || !locationLabel || !mapSubtitle) return;

  const mapId = getCurrentMapId(currentRoomId);
  const mapDef = getMapDefinition(mapId);

  if (!mapDef) {
    svgEl.innerHTML = "";
    svgEl.setAttribute("viewBox", "0 0 200 200");
    locationLabel.textContent = locationNamesMap[currentRoomId] || currentRoomId || "Unknown Location";
    mapSubtitle.textContent = "Map Unavailable";
    return;
  }

  const adjacentIds = getAdjacentNodeIds(mapDef, currentRoomId);
  const discovered = new Set(discoveredLocations || []);
  if (currentRoomId) discovered.add(currentRoomId);

  const drawnEdges = new Set();
  const nodesToRender = [];

  for (const nodeId of Object.keys(mapDef.nodes || {})) {
    if (!shouldRenderNode(nodeId, currentRoomId, discovered, adjacentIds)) continue;
    nodesToRender.push(nodeId);
  }

  svgEl.innerHTML = "";
  svgEl.setAttribute("viewBox", mapDef.viewBox || "0 0 200 200");

  const nodes = mapDef.nodes || {};
  const links = mapDef.links || [];

  for (const [a, b] of links) {
    const pa = nodes[a];
    const pb = nodes[b];
    if (!pa || !pb) continue;
    const key = getEdgeKey(a, b);
    if (drawnEdges.has(key)) continue;
    drawnEdges.add(key);
    if (!nodesToRender.includes(a) && !nodesToRender.includes(b)) continue;
    const bothDiscovered = discovered.has(a) && discovered.has(b);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pa.x);
    line.setAttribute("y1", pa.y);
    line.setAttribute("x2", pb.x);
    line.setAttribute("y2", pb.y);
    line.setAttribute("class", bothDiscovered ? "map-link map-link-discovered" : "map-link");
    svgEl.appendChild(line);
  }

  const isFirstRender = _lastRenderedDiscovered.size === 0;
  const newlyDiscovered = new Set();
  for (const nodeId of nodesToRender) {
    const meta = nodes[nodeId];
    if (!meta) continue;
    const isCurrent = nodeId === currentRoomId;
    const isDiscovered = discovered.has(nodeId);
    const isAdjacent = adjacentIds.has(nodeId);
    const isNewlyDiscovered = !isFirstRender && isDiscovered && !_lastRenderedDiscovered.has(nodeId);
    if (isNewlyDiscovered) newlyDiscovered.add(nodeId);
    let cls = buildNodeClass(meta, isCurrent, isDiscovered, isAdjacent);
    if (isNewlyDiscovered) cls += " node-newly-discovered";
    const label = locationNamesMap[nodeId] || meta?.label || nodeId;
    const el = createNodeElement(meta, cls, label, nodeId);
    svgEl.appendChild(el);
  }
  _lastRenderedDiscovered = new Set(discovered);
  if (newlyDiscovered.size > 0) {
    const elementsToClear = [];
    for (const nodeId of newlyDiscovered) {
      const el = svgEl.querySelector(`[data-node-id="${nodeId}"]`);
      if (el) elementsToClear.push(el);
    }
    setTimeout(() => {
      for (const el of elementsToClear) el.classList.remove("node-newly-discovered");
    }, 700);
  }

  locationLabel.textContent = locationNamesMap[currentRoomId] || nodes[currentRoomId]?.label || currentRoomId || "Unknown Location";
  mapSubtitle.textContent = mapDef.label || "Unknown Region";

  if (mapDistrictLabel) {
    mapDistrictLabel.textContent = district || "";
    mapDistrictLabel.style.display = district ? "" : "none";
  }

  const legendEl = document.getElementById("map-legend");
  if (legendEl) {
    legendEl.innerHTML = `
      <span class="map-legend-sample node-hub"></span> Hub
      <span class="map-legend-sample node-street"></span> Street
      <span class="map-legend-sample node-shop"></span> Shop
      <span class="map-legend-sample node-dungeon_entrance"></span> Dungeon
      <span class="map-legend-sample map-node current"></span> You
    `;
  }
}

function escapeHtml(s) {
  if (s == null) return "";
  const div = document.createElement("div");
  div.textContent = String(s);
  return div.innerHTML;
}
