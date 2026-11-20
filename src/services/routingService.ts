import { outdoorGeoJson, buildings, campusGates } from '../data/campusData';
import { RouteResult, RouteStep, TravelMode } from '../types';

export interface GraphNode {
  id: string; // "lon,lat"
  lon: number;
  lat: number;
  neighbors: { node: GraphNode; distance: number }[];
}

// Haversine distance in meters
export function haversineDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000; // Earth radius in meters
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

// Calculate bearing in degrees from north (0-360)
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

class RoutingEngine {
  private walkNodes: Map<string, GraphNode> = new Map();
  private largestWalkComponentNodes: Set<string> = new Set();

  private vehicleNodes: Map<string, GraphNode> = new Map();
  private largestVehicleComponentNodes: Set<string> = new Set();
  private initialized = false;

  constructor() {
    this.buildGraphs();
  }

  private coordKey(lon: number, lat: number): string {
    return `${lon.toFixed(6)},${lat.toFixed(6)}`;
  }

  private getOrCreateNode(map: Map<string, GraphNode>, lon: number, lat: number): GraphNode {
    const key = this.coordKey(lon, lat);
    let node = map.get(key);
    if (!node) {
      node = {
        id: key,
        lon: Number(lon.toFixed(6)),
        lat: Number(lat.toFixed(6)),
        neighbors: [],
      };
      map.set(key, node);
    }
    return node;
  }

  private buildGraphs() {
    const features = outdoorGeoJson.features as any[];

    // Extract line strings for Walk and Vehicle networks
    for (const f of features) {
      if (f.geometry?.type === 'LineString') {
        const coords = f.geometry.coordinates as [number, number][];
        const hw = (f.properties?.highway || '').toLowerCase();
        const isPedOnly =
          f.properties?.is_pedestrian === true ||
          hw === 'footway' ||
          hw === 'pedestrian';

        for (let i = 0; i < coords.length - 1; i++) {
          const [lon1, lat1] = coords[i];
          const [lon2, lat2] = coords[i + 1];
          const dist = haversineDistanceMeters(lat1, lon1, lat2, lon2);

          // 1. Walk Network: all pedestrian paths + accessible roads
          const w1 = this.getOrCreateNode(this.walkNodes, lon1, lat1);
          const w2 = this.getOrCreateNode(this.walkNodes, lon2, lat2);
          if (!w1.neighbors.some((nbr) => nbr.node.id === w2.id)) {
            w1.neighbors.push({ node: w2, distance: dist });
          }
          if (!w2.neighbors.some((nbr) => nbr.node.id === w1.id)) {
            w2.neighbors.push({ node: w1, distance: dist });
          }

          // 2. Vehicle Network: motorable roads only (tertiary, unclassified, residential, service, living_street)
          if (!isPedOnly) {
            const v1 = this.getOrCreateNode(this.vehicleNodes, lon1, lat1);
            const v2 = this.getOrCreateNode(this.vehicleNodes, lon2, lat2);
            if (!v1.neighbors.some((nbr) => nbr.node.id === v2.id)) {
              v1.neighbors.push({ node: v2, distance: dist });
            }
            if (!v2.neighbors.some((nbr) => nbr.node.id === v1.id)) {
              v2.neighbors.push({ node: v1, distance: dist });
            }
          }
        }
      }
    }

    this.largestWalkComponentNodes = this.extractLargestComponent(this.walkNodes);
    this.largestVehicleComponentNodes = this.extractLargestComponent(this.vehicleNodes);
    this.initialized = true;

    console.log(
      `[RoutingEngine] Built Walk graph (${this.largestWalkComponentNodes.size} nodes) and Vehicle graph (${this.largestVehicleComponentNodes.size} nodes).`
    );
  }

  private extractLargestComponent(nodesMap: Map<string, GraphNode>): Set<string> {
    const visited = new Set<string>();
    const components: string[][] = [];

    for (const [id] of nodesMap) {
      if (!visited.has(id)) {
        const comp: string[] = [];
        const queue: string[] = [id];
        visited.add(id);

        while (queue.length > 0) {
          const currId = queue.shift()!;
          comp.push(currId);
          const currNode = nodesMap.get(currId);
          if (currNode) {
            for (const nbr of currNode.neighbors) {
              if (!visited.has(nbr.node.id)) {
                visited.add(nbr.node.id);
                queue.push(nbr.node.id);
              }
            }
          }
        }
        components.push(comp);
      }
    }

    components.sort((a, b) => b.length - a.length);
    return new Set(components[0] || []);
  }

  // Find nearest node on the primary walkable component
  public findNearestWalkwayNode(lat: number, lon: number, maxRadiusMeters = 350): GraphNode | null {
    return this.findNearestInSet(this.walkNodes, this.largestWalkComponentNodes, lat, lon, maxRadiusMeters);
  }

  // Find nearest node on the motorable vehicle component
  public findNearestVehicleNode(lat: number, lon: number, maxRadiusMeters = 350): GraphNode | null {
    return this.findNearestInSet(this.vehicleNodes, this.largestVehicleComponentNodes, lat, lon, maxRadiusMeters);
  }

  private findNearestInSet(
    map: Map<string, GraphNode>,
    set: Set<string>,
    lat: number,
    lon: number,
    maxRadiusMeters: number
  ): GraphNode | null {
    let bestNode: GraphNode | null = null;
    let minDistance = Infinity;

    for (const nodeId of set) {
      const node = map.get(nodeId);
      if (node) {
        const d = haversineDistanceMeters(lat, lon, node.lat, node.lon);
        if (d < minDistance) {
          minDistance = d;
          bestNode = node;
        }
      }
    }

    if (minDistance <= maxRadiusMeters) {
      return bestNode;
    }
    return null;
  }

  // A* Routing algorithm supporting both Walk and Vehicle modes
  public calculateRoute(
    startLat: number,
    startLon: number,
    startName: string,
    endLat: number,
    endLon: number,
    endName: string,
    endBlockNumber?: string,
    startBlockNumber?: string,
    mode: TravelMode = 'walk'
  ): RouteResult {
    const isVehicle = mode === 'vehicle';
    const activeNodes = isVehicle ? this.vehicleNodes : this.walkNodes;
    const activeComp = isVehicle ? this.largestVehicleComponentNodes : this.largestWalkComponentNodes;

    const startNode = isVehicle
      ? this.findNearestVehicleNode(startLat, startLon, 350)
      : this.findNearestWalkwayNode(startLat, startLon, 350);
    const endNode = isVehicle
      ? this.findNearestVehicleNode(endLat, endLon, 350)
      : this.findNearestWalkwayNode(endLat, endLon, 350);

    const startSnapDist = startNode ? haversineDistanceMeters(startLat, startLon, startNode.lat, startNode.lon) : 0;
    const endSnapDist = endNode ? haversineDistanceMeters(endLat, endLon, endNode.lat, endNode.lon) : 0;

    const classifyPoint = (name: string, lat: number, lon: number, snapDist: number, blockNum?: string) => {
      const isGate =
        name.toLowerCase().includes('gate') ||
        blockNum === 'Gate' ||
        blockNum === 'LawGate' ||
        campusGates.some((g) => haversineDistanceMeters(lat, lon, g.coordinates[1], g.coordinates[0]) <= 25) ||
        snapDist <= 6;

      if (isGate) {
        return {
          entranceType: 'verified_gate' as const,
          isApproximateEntrance: false,
          snapDistanceMeters: Math.round(snapDist),
        };
      }

      const matchedBuilding = buildings.find(
        (b) =>
          b.block_number === blockNum ||
          b.name.toLowerCase() === name.toLowerCase() ||
          haversineDistanceMeters(lat, lon, b.coordinates.latitude, b.coordinates.longitude) <= 15
      );

      if (matchedBuilding && matchedBuilding.osm_way_id === null) {
        return {
          entranceType: 'representative_grid' as const,
          isApproximateEntrance: true,
          snapDistanceMeters: Math.round(snapDist),
        };
      }

      return {
        entranceType: 'mapped_footprint_perimeter' as const,
        isApproximateEntrance: true,
        snapDistanceMeters: Math.round(snapDist),
      };
    };

    const startClass = classifyPoint(startName, startLat, startLon, startSnapDist, startBlockNumber);
    const endClass = classifyPoint(endName, endLat, endLon, endSnapDist, endBlockNumber);

    if (!startNode || !endNode) {
      return {
        found: false,
        distanceMeters: 0,
        durationMinutes: 0,
        mode,
        pathCoordinates: [],
        steps: [],
        startPoint: {
          name: startName,
          lat: startLat,
          lon: startLon,
          isApproximateEntrance: startClass.isApproximateEntrance,
          snapDistanceMeters: startClass.snapDistanceMeters,
          entranceType: startClass.entranceType,
        },
        endPoint: {
          name: endName,
          lat: endLat,
          lon: endLon,
          blockNumber: endBlockNumber,
          isApproximateEntrance: endClass.isApproximateEntrance,
          snapDistanceMeters: endClass.snapDistanceMeters,
          entranceType: endClass.entranceType,
        },
        warningMessage: isVehicle
          ? 'No accessible vehicular campus road could be reached from the selected origin or destination. Please select a mapped campus road or gate.'
          : 'No verified pedestrian pathway could be reached from the selected origin or destination. Please choose a mapped campus location or entrance gate.',
      };
    }

    // A* algorithm data structures
    const openSet = new Set<string>([startNode.id]);
    const cameFrom = new Map<string, string>();

    const gScore = new Map<string, number>();
    gScore.set(startNode.id, 0);

    const fScore = new Map<string, number>();
    fScore.set(startNode.id, haversineDistanceMeters(startNode.lat, startNode.lon, endNode.lat, endNode.lon));

    while (openSet.size > 0) {
      // Find node in openSet with lowest fScore
      let currentId: string | null = null;
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
        // Reconstruct path
        const path: [number, number][] = [];
        let curr: string | undefined = currentId;
        while (curr) {
          const n = activeNodes.get(curr)!;
          path.unshift([n.lat, n.lon]);
          curr = cameFrom.get(curr);
        }

        // Add exact start and end coordinate connectors if slightly offset
        const fullPath: [number, number][] = [];
        if (haversineDistanceMeters(startLat, startLon, path[0][0], path[0][1]) > 5) {
          fullPath.push([startLat, startLon]);
        }
        fullPath.push(...path);
        if (
          haversineDistanceMeters(endLat, endLon, path[path.length - 1][0], path[path.length - 1][1]) > 5
        ) {
          fullPath.push([endLat, endLon]);
        }

        // Calculate total distance along path
        let totalDistance = 0;
        for (let i = 0; i < fullPath.length - 1; i++) {
          totalDistance += haversineDistanceMeters(
            fullPath[i][0],
            fullPath[i][1],
            fullPath[i + 1][0],
            fullPath[i + 1][1]
          );
        }

        // Speed:
        // Walk: 4.5 km/h = 75 m/min
        // Vehicle: 20 km/h campus speed limit = 333 m/min
        const speedMetersPerMin = isVehicle ? 333 : 75;
        const durationMinutes = Math.max(1, Math.round(totalDistance / speedMetersPerMin));
        const calories = isVehicle ? undefined : Math.max(1, Math.round(totalDistance * 0.05));
        const speedLimitKmh = isVehicle ? 20 : undefined;

        // Generate Turn-by-Turn instructions with entrance classification
        const steps = this.generateTurnByTurn(fullPath, startName, endName, startClass, endClass, mode);

        return {
          found: true,
          distanceMeters: Math.round(totalDistance),
          durationMinutes,
          mode,
          calories,
          speedLimitKmh,
          pathCoordinates: fullPath,
          coordinates: fullPath,
          steps,
          startPoint: {
            name: startName,
            lat: startLat,
            lon: startLon,
            isApproximateEntrance: startClass.isApproximateEntrance,
            snapDistanceMeters: startClass.snapDistanceMeters,
            entranceType: startClass.entranceType,
          },
          endPoint: {
            name: endName,
            lat: endLat,
            lon: endLon,
            blockNumber: endBlockNumber,
            isApproximateEntrance: endClass.isApproximateEntrance,
            snapDistanceMeters: endClass.snapDistanceMeters,
            entranceType: endClass.entranceType,
          },
        };
      }

      openSet.delete(currentId);
      const currentNode = activeNodes.get(currentId)!;
      const currentG = gScore.get(currentId) ?? Infinity;

      for (const edge of currentNode.neighbors) {
        if (!activeComp.has(edge.node.id)) continue;
        const neighborId = edge.node.id;
        const tentativeG = currentG + edge.distance;

        if (tentativeG < (gScore.get(neighborId) ?? Infinity)) {
          cameFrom.set(neighborId, currentId);
          gScore.set(neighborId, tentativeG);
          const h = haversineDistanceMeters(edge.node.lat, edge.node.lon, endNode.lat, endNode.lon);
          fScore.set(neighborId, tentativeG + h);
          openSet.add(neighborId);
        }
      }
    }

    // No path found in graph
    return {
      found: false,
      distanceMeters: 0,
      durationMinutes: 0,
      mode,
      pathCoordinates: [],
      steps: [],
      startPoint: {
        name: startName,
        lat: startLat,
        lon: startLon,
        isApproximateEntrance: startClass.isApproximateEntrance,
        snapDistanceMeters: startClass.snapDistanceMeters,
        entranceType: startClass.entranceType,
      },
      endPoint: {
        name: endName,
        lat: endLat,
        lon: endLon,
        blockNumber: endBlockNumber,
        isApproximateEntrance: endClass.isApproximateEntrance,
        snapDistanceMeters: endClass.snapDistanceMeters,
        entranceType: endClass.entranceType,
      },
      warningMessage: isVehicle
        ? 'A vehicular road path could not be resolved between these two locations on the campus road network. Please check if vehicle access is permitted in this sector.'
        : 'A verified pedestrian pathway could not be resolved between these two campus locations on the mapped network. A direct line has not been drawn to avoid showing unverified shortcuts.',
    };
  }

  private generateTurnByTurn(
    path: [number, number][],
    startName: string,
    endName: string,
    startClass: { entranceType: 'verified_gate' | 'mapped_footprint_perimeter' | 'representative_grid'; snapDistanceMeters: number },
    endClass: { entranceType: 'verified_gate' | 'mapped_footprint_perimeter' | 'representative_grid'; snapDistanceMeters: number },
    mode: TravelMode = 'walk'
  ): RouteStep[] {
    const isVeh = mode === 'vehicle';
    const steps: RouteStep[] = [];
    if (path.length < 2) return steps;

    let startDesc = isVeh
      ? `Start driving from ${startName} onto campus vehicular roadway`
      : `Start walking from ${startName}`;
    if (!isVeh) {
      if (startClass.entranceType === 'verified_gate') {
        startDesc = `Start walking from ${startName} (Verified Gate Entrance)`;
      } else if (startClass.entranceType === 'representative_grid') {
        startDesc = `Start walking from nearest walkway access near ${startName} (~${startClass.snapDistanceMeters}m from representative grid point)`;
      } else {
        startDesc = `Start walking from perimeter walkway access near ${startName} (~${startClass.snapDistanceMeters}m from building centroid)`;
      }
    } else {
      if (startClass.entranceType === 'verified_gate') {
        startDesc = `Start driving from ${startName} (Campus Gate Entry)`;
      } else {
        startDesc = `Start driving from vehicular drop-off point near ${startName}`;
      }
    }

    steps.push({
      instruction: isVeh
        ? `${startDesc} (Follow campus 20 km/h speed limit)`
        : `${startDesc} along the paved campus pedestrian path`,
      distanceMeters: Math.round(haversineDistanceMeters(path[0][0], path[0][1], path[1][0], path[1][1])),
      type: 'start',
      coordinate: path[0],
    });

    let accumulatedDist = 0;
    let lastBearing = calculateBearing(path[0][0], path[0][1], path[1][0], path[1][1]);

    for (let i = 1; i < path.length - 1; i++) {
      const segDist = haversineDistanceMeters(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);
      const currentBearing = calculateBearing(path[i][0], path[i][1], path[i + 1][0], path[i + 1][1]);

      let diff = (currentBearing - lastBearing + 360) % 360;
      if (diff > 180) diff -= 360;

      accumulatedDist += segDist;

      // Detect notable directional turns (greater than 30 degrees)
      if (Math.abs(diff) >= 30 && accumulatedDist >= 20) {
        let type: RouteStep['type'] = 'straight';
        let text = isVeh ? 'Continue along campus road' : 'Continue straight';

        if (diff > 60) {
          type = 'turn_right';
          text = isVeh ? 'Turn right onto connecting road' : 'Turn right onto connecting walkway';
        } else if (diff > 25) {
          type = 'slight_right';
          text = isVeh ? 'Bear slight right on campus roadway' : 'Bear slight right along pedestrian spine';
        } else if (diff < -60) {
          type = 'turn_left';
          text = isVeh ? 'Turn left onto connecting road' : 'Turn left onto connecting walkway';
        } else if (diff < -25) {
          type = 'slight_left';
          text = isVeh ? 'Bear slight left on campus roadway' : 'Bear slight left along pedestrian spine';
        }

        steps.push({
          instruction: `${text} and proceed for ${Math.round(accumulatedDist)}m`,
          distanceMeters: Math.round(accumulatedDist),
          type,
          coordinate: path[i],
        });

        accumulatedDist = 0;
        lastBearing = currentBearing;
      }
    }

    if (accumulatedDist > 0) {
      steps.push({
        instruction: isVeh
          ? `Follow campus road forward for ${Math.round(accumulatedDist)}m toward destination`
          : `Follow the main path forward for ${Math.round(accumulatedDist)}m toward destination`,
        distanceMeters: Math.round(accumulatedDist),
        type: 'straight',
        coordinate: path[path.length - 2],
      });
    }

    let arriveDesc = isVeh ? `Arrive at vehicle drop-off / parking point for ${endName}` : `Arrive at ${endName}`;
    if (!isVeh) {
      if (endClass.entranceType === 'verified_gate') {
        arriveDesc = `Arrive at ${endName} (Verified Campus Gate Entrance)`;
      } else if (endClass.entranceType === 'representative_grid') {
        arriveDesc = `Arrive at nearest walkway access for ${endName} (Approximate Entrance • ~${endClass.snapDistanceMeters}m from building reference point)`;
      } else {
        arriveDesc = `Arrive at perimeter walkway access for ${endName} (Approximate Entrance • ~${endClass.snapDistanceMeters}m from building centroid)`;
      }
    } else {
      if (endClass.entranceType === 'verified_gate') {
        arriveDesc = `Arrive at ${endName} (Campus Gate Vehicle Checkpoint)`;
      } else {
        arriveDesc = `Arrive at vehicular drop-off point near ${endName} (~${endClass.snapDistanceMeters}m from entrance)`;
      }
    }

    steps.push({
      instruction: arriveDesc,
      distanceMeters: 0,
      type: 'arrive',
      coordinate: path[path.length - 1],
    });

    return steps;
  }
}

export const routingEngine = new RoutingEngine();
