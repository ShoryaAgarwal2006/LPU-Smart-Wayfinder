import { RouteResult, RouteStep, ArrivalDirection, LiveNavigationUpdate } from '../types';
import { haversineDistanceMeters } from './routingService';

// Calculate bearing in degrees (0 - 360) from point 1 to point 2
export function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const y = Math.sin((lon2 - lon1) * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180));
  const x =
    Math.cos(lat1 * (Math.PI / 180)) * Math.sin(lat2 * (Math.PI / 180)) -
    Math.sin(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.cos((lon2 - lon1) * (Math.PI / 180));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

// Perpendicular projection of point P onto line segment A-B
export function projectPointOnSegment(
  pLat: number,
  pLon: number,
  aLat: number,
  aLon: number,
  bLat: number,
  bLon: number
): { lat: number; lon: number; t: number; distanceMeters: number } {
  const latMid = ((aLat + bLat) / 2) * (Math.PI / 180);
  const cosLat = Math.cos(latMid);
  const mPerDegLat = 111132;
  const mPerDegLon = 111320 * cosLat;

  const ax = aLon * mPerDegLon;
  const ay = aLat * mPerDegLat;
  const bx = bLon * mPerDegLon;
  const by = bLat * mPerDegLat;
  const px = pLon * mPerDegLon;
  const py = pLat * mPerDegLat;

  const abx = bx - ax;
  const aby = by - ay;
  const abLenSq = abx * abx + aby * aby;

  let t = 0;
  if (abLenSq > 0.0001) {
    t = ((px - ax) * abx + (py - ay) * aby) / abLenSq;
    t = Math.max(0, Math.min(1, t));
  }

  const projLat = aLat + t * (bLat - aLat);
  const projLon = aLon + t * (bLon - aLon);
  const dist = haversineDistanceMeters(pLat, pLon, projLat, projLon);

  return { lat: projLat, lon: projLon, t, distanceMeters: dist };
}

export interface RouteSnapResult {
  closestSegmentIndex: number;
  projectedPoint: [number, number]; // [lat, lon]
  distanceFromRouteMeters: number;
  t: number;
}

// Find closest point on active route polyline
export function findClosestPointOnRoute(
  userLat: number,
  userLon: number,
  pathCoordinates: [number, number][]
): RouteSnapResult {
  if (!pathCoordinates || pathCoordinates.length === 0) {
    return {
      closestSegmentIndex: 0,
      projectedPoint: [userLat, userLon],
      distanceFromRouteMeters: 0,
      t: 0,
    };
  }

  if (pathCoordinates.length === 1) {
    const d = haversineDistanceMeters(userLat, userLon, pathCoordinates[0][0], pathCoordinates[0][1]);
    return {
      closestSegmentIndex: 0,
      projectedPoint: pathCoordinates[0],
      distanceFromRouteMeters: d,
      t: 0,
    };
  }

  let minDistance = Infinity;
  let bestIndex = 0;
  let bestPoint: [number, number] = pathCoordinates[0];
  let bestT = 0;

  for (let i = 0; i < pathCoordinates.length - 1; i++) {
    const [aLat, aLon] = pathCoordinates[i];
    const [bLat, bLon] = pathCoordinates[i + 1];

    const proj = projectPointOnSegment(userLat, userLon, aLat, aLon, bLat, bLon);
    if (proj.distanceMeters < minDistance) {
      minDistance = proj.distanceMeters;
      bestIndex = i;
      bestPoint = [proj.lat, proj.lon];
      bestT = proj.t;
    }
  }

  return {
    closestSegmentIndex: bestIndex,
    projectedPoint: bestPoint,
    distanceFromRouteMeters: minDistance,
    t: bestT,
  };
}

// Calculate remaining walking distance along the route polyline from snapped user position
export function calculateRemainingDistanceAlongRoute(
  snap: RouteSnapResult,
  pathCoordinates: [number, number][]
): number {
  if (!pathCoordinates || pathCoordinates.length < 2) return 0;

  const { closestSegmentIndex, projectedPoint } = snap;
  const nextVertex = pathCoordinates[closestSegmentIndex + 1];

  // 1. Distance from projected point to the end of current segment
  let totalDist = haversineDistanceMeters(
    projectedPoint[0],
    projectedPoint[1],
    nextVertex[0],
    nextVertex[1]
  );

  // 2. Sum of all subsequent segments
  for (let i = closestSegmentIndex + 1; i < pathCoordinates.length - 1; i++) {
    totalDist += haversineDistanceMeters(
      pathCoordinates[i][0],
      pathCoordinates[i][1],
      pathCoordinates[i + 1][0],
      pathCoordinates[i + 1][1]
    );
  }

  return Math.round(totalDist);
}

// Find the upcoming navigation turn step ahead of the user
export function findUpcomingStep(
  snap: RouteSnapResult,
  pathCoordinates: [number, number][],
  steps: RouteStep[]
): {
  nextStep: RouteStep | null;
  stepIndex: number;
  distanceToStepMeters: number;
} {
  if (!steps || steps.length === 0) {
    return { nextStep: null, stepIndex: -1, distanceToStepMeters: 0 };
  }

  // Map each step to its closest polyline vertex
  const stepIndices: number[] = steps.map((step) => {
    let bestDist = Infinity;
    let bestIdx = 0;
    for (let i = 0; i < pathCoordinates.length; i++) {
      const d = haversineDistanceMeters(
        step.coordinate[0],
        step.coordinate[1],
        pathCoordinates[i][0],
        pathCoordinates[i][1]
      );
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    return bestIdx;
  });

  // Find the first turn step that is ahead of the user's current segment
  for (let s = 0; s < steps.length; s++) {
    const targetVertexIdx = stepIndices[s];

    // If target vertex is ahead of current segment index
    if (targetVertexIdx > snap.closestSegmentIndex) {
      // Calculate path distance from snapped point to this step
      let dist = haversineDistanceMeters(
        snap.projectedPoint[0],
        snap.projectedPoint[1],
        pathCoordinates[snap.closestSegmentIndex + 1][0],
        pathCoordinates[snap.closestSegmentIndex + 1][1]
      );

      for (let i = snap.closestSegmentIndex + 1; i < targetVertexIdx; i++) {
        dist += haversineDistanceMeters(
          pathCoordinates[i][0],
          pathCoordinates[i][1],
          pathCoordinates[i + 1][0],
          pathCoordinates[i + 1][1]
        );
      }

      return {
        nextStep: steps[s],
        stepIndex: s,
        distanceToStepMeters: Math.round(dist),
      };
    } else if (targetVertexIdx === snap.closestSegmentIndex) {
      // Step is on the current segment ahead of user
      const distToStep = haversineDistanceMeters(
        snap.projectedPoint[0],
        snap.projectedPoint[1],
        steps[s].coordinate[0],
        steps[s].coordinate[1]
      );

      // If user hasn't passed it yet (at least 5m ahead)
      if (distToStep > 5) {
        return {
          nextStep: steps[s],
          stepIndex: s,
          distanceToStepMeters: Math.round(distToStep),
        };
      }
    }
  }

  // If all steps passed or at destination
  const lastStep = steps[steps.length - 1];
  const distToEnd = haversineDistanceMeters(
    snap.projectedPoint[0],
    snap.projectedPoint[1],
    lastStep.coordinate[0],
    lastStep.coordinate[1]
  );

  return {
    nextStep: lastStep,
    stepIndex: steps.length - 1,
    distanceToStepMeters: Math.round(distToEnd),
  };
}

// Generate Google Maps-style turn instruction text
export function getTurnInstruction(step: RouteStep, distanceMeters: number, isImmediate: boolean): string {
  const type = step.type;

  let turnVerb = 'continue straight';
  if (type === 'turn_left') turnVerb = 'turn left';
  else if (type === 'turn_right') turnVerb = 'turn right';
  else if (type === 'slight_left') turnVerb = 'take a slight left';
  else if (type === 'slight_right') turnVerb = 'take a slight right';
  else if (type === 'arrive') turnVerb = 'arrive at destination';

  if (isImmediate) {
    if (type === 'turn_left') return 'Turn left now';
    if (type === 'turn_right') return 'Turn right now';
    if (type === 'slight_left') return 'Bear slight left now';
    if (type === 'slight_right') return 'Bear slight right now';
    if (type === 'arrive') return 'Arrive at destination';
    return 'Continue straight forward';
  }

  if (distanceMeters <= 55) {
    return `In ${Math.max(5, Math.round(distanceMeters))} metres, ${turnVerb}`;
  }

  return step.instruction || `Follow path for ${Math.round(distanceMeters)}m`;
}

// Determine if destination is on the left, right, or straight ahead
export function determineArrivalDirection(
  userLat: number,
  userLon: number,
  destLat: number,
  destLon: number,
  userHeading: number | null,
  pathCoordinates: [number, number][] = [],
  destinationName: string = 'destination'
): { direction: ArrivalDirection; announcement: string; message: string } {
  // If we have heading or approach path bearing
  let approachBearing: number | null = userHeading;

  if (approachBearing === null || isNaN(approachBearing) || approachBearing === 0) {
    if (pathCoordinates && pathCoordinates.length >= 2) {
      const pPrev = pathCoordinates[pathCoordinates.length - 2];
      const pLast = pathCoordinates[pathCoordinates.length - 1];
      approachBearing = calculateBearing(pPrev[0], pPrev[1], pLast[0], pLast[1]);
    }
  }

  const destBearing = calculateBearing(userLat, userLon, destLat, destLon);

  if (approachBearing !== null && !isNaN(approachBearing)) {
    const diff = (destBearing - approachBearing + 360) % 360;

    if (diff > 25 && diff < 155) {
      return {
        direction: 'right',
        announcement: `Your destination, ${destinationName}, is on your right.`,
        message: 'on your right',
      };
    } else if (diff > 205 && diff < 335) {
      return {
        direction: 'left',
        announcement: `Your destination, ${destinationName}, is on your left.`,
        message: 'on your left',
      };
    } else if (diff <= 25 || diff >= 335) {
      return {
        direction: 'straight',
        announcement: `Your destination, ${destinationName}, is straight ahead.`,
        message: 'straight ahead',
      };
    }
  }

  return {
    direction: 'arrived',
    announcement: `You have arrived at ${destinationName}.`,
    message: 'straight ahead',
  };
}

// Voice Speech Synthesis Manager
export class VoiceGuideService {
  private _isMuted: boolean = false;
  private lastAnnouncedKey: string = '';
  private lastAnnouncementTime: number = 0;

  constructor() {
    if (typeof window !== 'undefined') {
      this._isMuted = localStorage.getItem('lpu_wayfinder_voice_muted') === 'true';
    }
  }

  public setMuted(muted: boolean) {
    this._isMuted = muted;
    try {
      localStorage.setItem('lpu_wayfinder_voice_muted', muted ? 'true' : 'false');
    } catch (e) {}

    if (muted && typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this._isMuted;
  }

  public isMuted(): boolean {
    return this._isMuted;
  }

  public toggleMute(): boolean {
    this.setMuted(!this._isMuted);
    return this._isMuted;
  }

  public cancel(): void {
    this.stop();
  }

  public speak(text: string, keyOrForce?: string | boolean, force = false) {
    if (this._isMuted || typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const now = Date.now();
    const strKey = typeof keyOrForce === 'string' ? keyOrForce : '';
    const isForce = typeof keyOrForce === 'boolean' ? keyOrForce : force;

    if (!isForce && strKey) {
      if (this.lastAnnouncedKey === strKey && now - this.lastAnnouncementTime < 15000) {
        return; // Avoid duplicate announcements
      }
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.05;
      utterance.pitch = 1.0;
      utterance.lang = 'en-US';

      if (strKey) {
        this.lastAnnouncedKey = strKey;
        this.lastAnnouncementTime = now;
      }

      window.speechSynthesis.speak(utterance);
    } catch (err) {
      console.warn('[VoiceGuideService] Speech synthesis error:', err);
    }
  }

  public announceTurnWarning(step: RouteStep, distMeters: number): void {
    this.speak(`In ${distMeters} meters, ${step.instruction}`, `turn_warn_${step.instruction}`);
  }

  public announceTurnImmediate(step: RouteStep): void {
    this.speak(step.instruction, `turn_now_${step.instruction}`);
  }

  public stop() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }
}

export const voiceGuide = new VoiceGuideService();
