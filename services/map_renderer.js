/**
 * Shared map renderer for sidebar SVG.
 * Data-driven; supports multiple maps and discovery.
 */

import { MAP_DATA, LOCATION_TO_MAP, RENDER_UNDISCOVERED_NODES } from "../data/maps.js";
import { formatId } from "./format_id.js";

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

/** Radius by node_type — current node adds +4 in createNodeElement. */
const NODE_RADIUS = {
  hub: 12,
  inn: 9,
  sanctuary: 8,
  street: 6,
  shop: 7,
  guild: 7,
  research: 7,
  safe: 6,
  danger: 6,
  dungeon_entrance: 8,
};

function shortLabel(label) {
  if (!label) return "";
  if (label.length <= 14) return label;
  const words = label.split(/\s+/).filter(Boolean);
  const start = ["The", "A"].includes(words[0]) ? 1 : 0;
  return words.slice(start, start + 2).join(" ");
}

function labelFontPx(nodeType, isCurrent) {
  if (isCurrent) return 8;
  if (["hub", "inn", "sanctuary"].includes(nodeType)) return 8;
  return 7;
}

function labelYBelowShape(meta, type, radius) {
  if (["shop", "guild", "research"].includes(type) || type === "dungeon_entrance") {
    const s = radius * 1.4;
    return meta.y + s / 2 + 8;
  }
  return meta.y + radius + 8;
}

export function buildNodeClass(nodeMeta, isCurrent, isDiscovered, isAdjacent) {
  const parts = ["map-node"];
  if (isCurrent) parts.push("current");
  else if (isDiscovered) parts.push("discovered");
  else parts.push("undiscovered");
  if (isAdjacent && !isCurrent) parts.push("adjacent");
  if (nodeMeta?.node_type) parts.push("node-" + nodeMeta.node_type);
  return parts.join(" ");
}

/**
 * @param {object} options
 * @param {boolean} options.isCurrent
 * @param {boolean} options.isDiscovered
 * @param {boolean} options.showLabel — current or discovered (not adjacent-only fog)
 */
function createNodeElement(meta, cls, fullLabel, nodeId, options = {}) {
  const { isCurrent = false, isDiscovered = false, showLabel = false } = options;
  const type = meta?.node_type || "street";
  const r = NODE_RADIUS[type] ?? 6;
  const isCurrentNode = cls.includes("current");
  const radius = isCurrentNode ? r + 4 : r;

  const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
  if (nodeId) g.setAttribute("data-node-id", nodeId);

  const title = document.createElementNS("http://www.w3.org/2000/svg", "title");
  title.textContent = fullLabel;
  g.appendChild(title);

  const setCommon = (el) => {
    el.setAttribute("class", cls);
    if (nodeId) el.setAttribute("data-node-id", nodeId);
  };

  if (["shop", "guild", "research"].includes(type)) {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const s = radius * 1.4;
    rect.setAttribute("x", meta.x - s / 2);
    rect.setAttribute("y", meta.y - s / 2);
    rect.setAttribute("width", s);
    rect.setAttribute("height", s);
    setCommon(rect);
    g.appendChild(rect);
  } else if (type === "dungeon_entrance") {
    const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    const s = radius * 1.4;
    rect.setAttribute("x", meta.x - s / 2);
    rect.setAttribute("y", meta.y - s / 2);
    rect.setAttribute("width", s);
    rect.setAttribute("height", s);
    rect.setAttribute("transform", `rotate(45 ${meta.x} ${meta.y})`);
    setCommon(rect);
    g.appendChild(rect);
  } else {
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", meta.x);
    circle.setAttribute("cy", meta.y);
    circle.setAttribute("r", radius);
    setCommon(circle);
    g.appendChild(circle);
  }

  if (showLabel && (isCurrent || isDiscovered)) {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", meta.x);
    text.setAttribute("y", labelYBelowShape(meta, type, radius));
    text.setAttribute("class", isCurrent ? "map-label map-label-current" : "map-label");
    text.setAttribute("font-size", labelFontPx(type, isCurrent) + "px");
    if (isCurrent) text.setAttribute("font-weight", "bold");
    text.textContent = shortLabel(fullLabel);
    g.appendChild(text);
  }

  return g;
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
    locationLabel.textContent =
      locationNamesMap[currentRoomId] || formatId(currentRoomId) || "Unknown Location";
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
  const defaultVB = mapDef.viewBox || "0 0 300 280";
  svgEl.setAttribute("viewBox", defaultVB);

  if (!svgEl.dataset.zoomBound) {
    svgEl.dataset.zoomBound = "1";
    let isPanning = false;
    let panStart = { x: 0, y: 0 };
    let panOrigin = { x: 0, y: 0, w: 0, h: 0 };

    svgEl.addEventListener(
      "wheel",
      function (e) {
        e.preventDefault();
        const vbStr = svgEl.getAttribute("viewBox") || defaultVB;
        const parts = vbStr.split(" ").map(Number);
        const [x, y, w, h] = parts;
        const factor = e.deltaY > 0 ? 1.15 : 0.87;
        const cx = x + w / 2;
        const cy = y + h / 2;
        const newW = Math.max(60, Math.min(500, w * factor));
        const newH = Math.max(60, Math.min(500, h * factor));
        svgEl.setAttribute("viewBox", [cx - newW / 2, cy - newH / 2, newW, newH].join(" "));
      },
      { passive: false },
    );

    svgEl.addEventListener("mousedown", function (e) {
      if (e.button !== 0) return;
      if (typeof e.target.closest === "function" && e.target.closest("[data-node-id]")) return;
      isPanning = true;
      panStart = { x: e.clientX, y: e.clientY };
      const vb = (svgEl.getAttribute("viewBox") || defaultVB).split(" ").map(Number);
      panOrigin = { x: vb[0], y: vb[1], w: vb[2], h: vb[3] };
      svgEl.style.cursor = "grabbing";
      e.preventDefault();
    });

    svgEl.addEventListener("mousemove", function (e) {
      if (!isPanning) return;
      const svgRect = svgEl.getBoundingClientRect();
      const scaleX = panOrigin.w / svgRect.width;
      const scaleY = panOrigin.h / svgRect.height;
      const dx = (e.clientX - panStart.x) * scaleX;
      const dy = (e.clientY - panStart.y) * scaleY;
      svgEl.setAttribute("viewBox", [panOrigin.x - dx, panOrigin.y - dy, panOrigin.w, panOrigin.h].join(" "));
    });

    svgEl.addEventListener("mouseup", function () {
      isPanning = false;
      svgEl.style.cursor = "grab";
    });

    svgEl.addEventListener("mouseleave", function () {
      isPanning = false;
      svgEl.style.cursor = "";
    });

    svgEl.style.cursor = "grab";
  }

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
    const eitherIsCurrent = a === currentRoomId || b === currentRoomId;
    const bothDiscovered = discovered.has(a) && discovered.has(b);
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", pa.x);
    line.setAttribute("y1", pa.y);
    line.setAttribute("x2", pb.x);
    line.setAttribute("y2", pb.y);
    line.setAttribute(
      "class",
      eitherIsCurrent
        ? "map-link map-link-adjacent"
        : bothDiscovered
          ? "map-link map-link-discovered"
          : "map-link",
    );
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
    const label = locationNamesMap[nodeId] || meta?.label || formatId(nodeId);
    const showLabel = isCurrent || isDiscovered;
    const el = createNodeElement(meta, cls, label, nodeId, {
      isCurrent,
      isDiscovered,
      showLabel,
    });
    svgEl.appendChild(el);
    if (isAdjacent && !isCurrent) {
      el.style.cursor = "pointer";
      el.addEventListener("click", () => {
        if (window.mapNavigateTo) {
          window.mapNavigateTo(nodeId);
        }
      });
    }
  }
  _lastRenderedDiscovered = new Set(discovered);
  if (newlyDiscovered.size > 0) {
    const elementsToClear = [];
    for (const nodeId of newlyDiscovered) {
      const el = svgEl.querySelector(`[data-node-id="${nodeId}"]`);
      if (el) elementsToClear.push(el);
    }
    setTimeout(() => {
      for (const el of elementsToClear) {
        const shape = el.querySelector(".map-node");
        if (shape) shape.classList.remove("node-newly-discovered");
      }
    }, 700);
  }

  locationLabel.textContent =
    locationNamesMap[currentRoomId] ||
    nodes[currentRoomId]?.label ||
    formatId(currentRoomId) ||
    "Unknown Location";
  mapSubtitle.textContent = mapDef.label || "Unknown Region";

  if (mapDistrictLabel) {
    mapDistrictLabel.textContent = district || "";
    mapDistrictLabel.style.display = district ? "" : "none";
  }

  const legendEl = document.getElementById("map-legend");
  if (legendEl) {
    legendEl.innerHTML = `
      <span><svg width="10" height="10" style="vertical-align:middle"><circle cx="5" cy="5" r="5" class="node-hub"/></svg> Hub</span>
      <span><svg width="10" height="10" style="vertical-align:middle"><circle cx="5" cy="5" r="4" class="node-street"/></svg> Street</span>
      <span><svg width="10" height="10" style="vertical-align:middle"><rect x="1" y="1" width="8" height="8" class="node-shop"/></svg> Shop</span>
      <span><svg width="10" height="10" style="vertical-align:middle"><rect x="1" y="1" width="8" height="8" class="node-guild"/></svg> Guild</span>
      <span><svg width="12" height="12" style="vertical-align:middle"><rect x="2" y="2" width="8" height="8" transform="rotate(45 6 6)" class="node-dungeon_entrance"/></svg> Sewer</span>
      <span><svg width="10" height="10" style="vertical-align:middle"><circle cx="5" cy="5" r="4" class="node-current node-discovered"/></svg> You</span>
    `;
  }
}
