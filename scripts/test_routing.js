import fs from 'fs';

const geo = JSON.parse(fs.readFileSync('lpu_outdoor.geojson', 'utf-8'));
const buildingsData = JSON.parse(fs.readFileSync('buildings.json', 'utf-8'));

function haversineDistanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Build Graph
const nodes = new Map();
const lines = geo.features
  .filter((f) => f.properties?.feature_type === 'walkway_road')
  .map((f) => f.geometry.coordinates);

function coordKey(lon, lat) {
  return `${lon.toFixed(6)},${lat.toFixed(6)}`;
}

function getOrCreateNode(lon, lat) {
  const key = coordKey(lon, lat);
  let node = nodes.get(key);
  if (!node) {
    node = { id: key, lon, lat, neighbors: [] };
    nodes.set(key, node);
  }
  return node;
}

for (const line of lines) {
  for (let i = 0; i < line.length - 1; i++) {
    const [lon1, lat1] = line[i];
    const [lon2, lat2] = line[i + 1];
    const n1 = getOrCreateNode(lon1, lat1);
    const n2 = getOrCreateNode(lon2, lat2);
    const dist = haversineDistanceMeters(lat1, lon1, lat2, lon2);
    if (!n1.neighbors.some((nbr) => nbr.node.id === n2.id)) {
      n1.neighbors.push({ node: n2, distance: dist });
    }
    if (!n2.neighbors.some((nbr) => nbr.node.id === n1.id)) {
      n2.neighbors.push({ node: n1, distance: dist });
    }
  }
}

// Largest component
const visited = new Set();
const components = [];
for (const [id] of nodes) {
  if (!visited.has(id)) {
    const comp = [];
    const queue = [id];
    visited.add(id);
    while (queue.length > 0) {
      const currId = queue.shift();
      comp.push(currId);
      const currNode = nodes.get(currId);
      for (const nbr of currNode.neighbors) {
        if (!visited.has(nbr.node.id)) {
          visited.add(nbr.node.id);
          queue.push(nbr.node.id);
        }
      }
    }
    components.push(comp);
  }
}
components.sort((a, b) => b.length - a.length);
const mainComponentNodes = new Set(components[0]);

function findNearestNode(lat, lon, maxRadius = 350) {
  let best = null;
  let minDist = Infinity;
  for (const id of mainComponentNodes) {
    const n = nodes.get(id);
    const d = haversineDistanceMeters(lat, lon, n.lat, n.lon);
    if (d < minDist) {
      minDist = d;
      best = n;
    }
  }
  return minDist <= maxRadius ? best : null;
}

function calculateRoute(startLat, startLon, endLat, endLon) {
  const startNode = findNearestNode(startLat, startLon);
  const endNode = findNearestNode(endLat, endLon);
  if (!startNode || !endNode) return { found: false, error: 'Cannot snap to walkway network' };

  const openSet = new Set([startNode.id]);
  const cameFrom = new Map();
  const gScore = new Map([[startNode.id, 0]]);
  const fScore = new Map([[startNode.id, haversineDistanceMeters(startNode.lat, startNode.lon, endNode.lat, endNode.lon)]]);

  while (openSet.size > 0) {
    let currentId = null;
    let lowestF = Infinity;
    for (const id of openSet) {
      const score = fScore.get(id) ?? Infinity;
      if (score < lowestF) {
        lowestF = score;
        currentId = id;
      }
    }
    if (!currentId) break;

    if (currentId === endNode.id) {
      const path = [];
      let curr = currentId;
      while (curr) {
        const n = nodes.get(curr);
        path.unshift([n.lat, n.lon]);
        curr = cameFrom.get(curr);
      }
      let dist = 0;
      for (let i = 0; i < path.length - 1; i++) {
        dist += haversineDistanceMeters(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
      }
      return { found: true, distanceMeters: Math.round(dist), durationMinutes: Math.max(1, Math.round(dist / 75)), stepsCount: path.length };
    }

    openSet.delete(currentId);
    const currentG = gScore.get(currentId) ?? Infinity;
    for (const edge of nodes.get(currentId).neighbors) {
      const nbrId = edge.node.id;
      const tentativeG = currentG + edge.distance;
      if (tentativeG < (gScore.get(nbrId) ?? Infinity)) {
        cameFrom.set(nbrId, currentId);
        gScore.set(nbrId, tentativeG);
        fScore.set(nbrId, tentativeG + haversineDistanceMeters(edge.node.lat, edge.node.lon, endNode.lat, endNode.lon));
        openSet.add(nbrId);
      }
    }
  }
  return { found: false, error: 'No path in graph' };
}

console.log('=== RUNNING ROUTING VERIFICATION TESTS ===');

// Test 1: Gate 1 -> Block 34 (CSE)
const r1 = calculateRoute(31.259520, 75.706476, 31.257050, 75.705700);
console.log('Test 1 (Gate 1 -> Block 34 CSE):', r1);

// Test 2: Law Gate -> Uni-Mall
const r2 = calculateRoute(31.254933, 75.700155, 31.255716, 75.704998);
console.log('Test 2 (Law Gate -> Uni-Mall Block 15):', r2);

// Test 3: BH-1 -> Central Library (Block 37)
const r3 = calculateRoute(31.251470, 75.702507, 31.2575, 75.7068);
console.log('Test 3 (BH-1 -> Central Library Block 37):', r3);

// Test 4: Block 32 -> Block 38
const r4 = calculateRoute(31.256922, 75.705431, 31.256288, 75.704666);
console.log('Test 4 (Block 32 MSB -> Block 38 AI Hub):', r4);

// Test 5: Off-campus coordinates (Jalandhar City Center)
const r5 = calculateRoute(31.3260, 75.5762, 31.257050, 75.705700);
console.log('Test 5 (Off-campus start -> Block 34):', r5);
