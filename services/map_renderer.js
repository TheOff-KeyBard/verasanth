/**
 * Shared map renderer for sidebar SVG.
 * Data-driven; supports multiple maps and discovery.
 */

import { MAP_DATA, LOCATION_TO_MAP, RENDER_UNDISCOVERED_NODES } from "../data/maps.js";

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

export function buildNodeClass(nodeMeta, isCurrent, isDiscovered, isAdjacent) {
  const parts = ["map-node"];
  if (isCurrent) parts.push("current");
  else if (isDiscovered) parts.push("discovered");
  else parts.push("undiscovered");
  if (isAdjacent && !isCurrent) parts.push("adjacent");
  if (nodeMeta?.node_type) parts.push(nodeMeta.node_type);
  return parts.join(" ");
}

export function updateSidebarMap(currentRoomId, discoveredLocations, locationNamesMap = {}) {
  const svgEl = document.getElementById("dynamic-map");
  const locationLabel = document.getElementById("location-label");
  const mapSubtitle = document.getElementById("map-subtitle");

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
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pa.x);
    line.setAttribute("y1", pa.y);
    line.setAttribute("x2", pb.x);
    line.setAttribute("y2", pb.y);
    line.setAttribute("class", "map-link");
    svgEl.appendChild(line);
  }

  for (const nodeId of nodesToRender) {
    const meta = nodes[nodeId];
    if (!meta) continue;
    const isCurrent = nodeId === currentRoomId;
    const isDiscovered = discovered.has(nodeId);
    const isAdjacent = adjacentIds.has(nodeId);
    const cls = buildNodeClass(meta, isCurrent, isDiscovered, isAdjacent);
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", meta.x);
    circle.setAttribute("cy", meta.y);
    circle.setAttribute("r", isCurrent ? 8 : 6);
    circle.setAttribute("class", cls);
    const label = locationNamesMap[nodeId] || meta?.label || nodeId;
    const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
    title.textContent = label;
    circle.appendChild(title);
    svgEl.appendChild(circle);
  }

  locationLabel.textContent = locationNamesMap[currentRoomId] || nodes[currentRoomId]?.label || currentRoomId || "Unknown Location";
  mapSubtitle.textContent = mapDef.label || "Unknown Region";

  const legendEl = document.getElementById("map-legend");
  if (legendEl) {
    const items = nodesToRender.map((nodeId) => {
      const label = locationNamesMap[nodeId] || nodes[nodeId]?.label || nodeId;
      const isCurrent = nodeId === currentRoomId;
      return { nodeId, label, isCurrent };
    });
    legendEl.innerHTML = items
      .map(({ label, isCurrent }) => `<span class="map-legend-item${isCurrent ? " current" : ""}">${escapeHtml(label)}</span>`)
      .join("");
  }
}

function escapeHtml(s) {
  if (s == null) return "";
  const div = document.createElement("div");
  div.textContent = String(s);
  return div.innerHTML;
}
