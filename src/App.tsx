import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Navbar } from './components/Navbar';
import { CampusMap } from './components/CampusMap';
import { RoutePanel } from './components/RoutePanel';
import { BuildingDirectory } from './components/BuildingDirectory';
import { BuildingDetailsModal } from './components/BuildingDetailsModal';
import { IndoorNavigationPage } from './components/IndoorNavigationPage';
import { AboutPage } from './components/AboutPage';
import { HomePage } from './components/HomePage';
import { SearchModal } from './components/SearchModal';
import { routingEngine } from './services/routingService';
import { isPointInsideLpuCampus, campusGates as fallbackGates } from './data/campusData';
import { ActivePage, Building, CampusGate, RouteResult, UserLocation, ArrivalDirection, GpsQuality, RouteStep, TravelMode } from './types';

// Live Turn-by-Turn Navigation Components & Services
import { LiveNavigationHUD } from './components/LiveNavigationHUD';
import { ArrivalModal } from './components/ArrivalModal';
import {
  voiceGuide,
  findClosestPointOnRoute,
  calculateRemainingDistanceAlongRoute,
  findUpcomingStep,
  getTurnInstruction,
  determineArrivalDirection,
  calculateBearing,
} from './services/liveNavigationService';
import { haversineDistanceMeters } from './services/routingService';

// Campus Data Context & Admin Editor Components (Phase 7.0)
import { CampusDataProvider, useCampusData } from './context/CampusDataContext';
import { AdminLoginModal } from './components/AdminLoginModal';
import { AdminMapToolbar } from './components/AdminMapToolbar';
import { LocationEditDrawer } from './components/LocationEditDrawer';
import { EntranceEditModal } from './components/EntranceEditModal';
import { GateManagementModal } from './components/GateManagementModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { AddLocationModal } from './components/AddLocationModal';
import { AddEventLocationModal } from './components/AddEventLocationModal';
import { EventHistoryModal } from './components/EventHistoryModal';
import { EventLocation } from './types/adminEditor';

interface UnifiedPoint {
  name: string;
  lat: number;
  lon: number;
  lng: number;
  blockNumber?: string;
}

interface LiveNavMetrics {
  destinationName: string;
  nextStep: RouteStep | null;
  distanceToNextStepMeters: number;
  instructionText: string;
  isImmediateTurn: boolean;
  remainingDistanceMeters: number;
  remainingDurationMinutes: number;
  gpsAccuracy: number;
  gpsQuality: GpsQuality;
}

interface ArrivalData {
  destinationName: string;
  direction: ArrivalDirection;
  message: string;
  totalDistance: number;
  totalDuration: number;
}

const makePoint = (
  name: string,
  lat: number,
  lonOrLng: number,
  blockNumber?: string
): UnifiedPoint => ({
  name,
  lat,
  lon: lonOrLng,
  lng: lonOrLng,
  blockNumber,
});

function AppContent() {
  // Live Campus Data Hook
  const {
    isEditMode,
    setIsEditMode,
    currentTool,
    setCurrentTool,
    selectedLocation,
    setSelectedLocation,
    getPreferredEntranceForBuilding,
    buildings,
    campusGates,
  } = useCampusData();

  // Persist active page across reloads / modifications so user stays on the map screen
  const [activePage, setActivePageState] = useState<ActivePage>(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash.replace('#', '') as ActivePage;
      if (['home', 'map', 'directory', 'indoor', 'about'].includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('lpu_wayfinder_active_page') as ActivePage;
      if (['home', 'map', 'directory', 'indoor', 'about'].includes(saved)) {
        return saved;
      }
      if (localStorage.getItem('lpu_wayfinder_edit_mode') === 'true') {
        return 'map';
      }
    }
    return 'home';
  });

  const setActivePage = useCallback((page: ActivePage) => {
    setActivePageState(page);
    try {
      localStorage.setItem('lpu_wayfinder_active_page', page);
      if (typeof window !== 'undefined' && window.location.hash !== `#${page}`) {
        window.history.replaceState(null, '', `#${page}`);
      }
    } catch (e) {}
  }, []);

  // Listen to browser hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '') as ActivePage;
      if (['home', 'map', 'directory', 'indoor', 'about'].includes(hash)) {
        setActivePageState(hash);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  // If in Edit Mode, always remain on the map screen ("stay then and there only")
  useEffect(() => {
    if (isEditMode && activePage !== 'map') {
      setActivePage('map');
    }
  }, [isEditMode, activePage, setActivePage]);

  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  // Search Modal state
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Admin Modals & Drawers state (Phase 7.0)
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [isAddLocationOpen, setIsAddLocationOpen] = useState(false);
  const [currentMapCenter, setCurrentMapCenter] = useState<{ lat: number; lon: number }>({
    lat: 31.254,
    lon: 75.704,
  });
  const [addLocationCoords, setAddLocationCoords] = useState<{ lat: number; lon: number } | undefined>(undefined);
  const [isEntranceModalOpen, setIsEntranceModalOpen] = useState(false);
  const [entranceBuildingId, setEntranceBuildingId] = useState<string | null>(null);
  const [entranceCoords, setEntranceCoords] = useState<{ lat: number; lon: number } | undefined>(undefined);
  const [isGateModalOpen, setIsGateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isAddEventLocationOpen, setIsAddEventLocationOpen] = useState(false);
  const [isEventHistoryOpen, setIsEventHistoryOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventLocation | null>(null);

  // Route Planning state
  const [startPoint, setStartPoint] = useState<UnifiedPoint | null>(null);
  const [destinationPoint, setDestinationPoint] = useState<UnifiedPoint | null>(null);

  // Travel Mode: Walk & Go vs Vehicle / Drive
  const [travelMode, setTravelMode] = useState<TravelMode>('walk');
  const travelModeRef = useRef<TravelMode>('walk');

  useEffect(() => {
    travelModeRef.current = travelMode;
  }, [travelMode]);

  const handleSelectTravelMode = useCallback(
    (mode: TravelMode) => {
      setTravelMode(mode);
      travelModeRef.current = mode;
      if (startPoint && destinationPoint) {
        const res = routingEngine.calculateRoute(
          startPoint.lat,
          startPoint.lon,
          startPoint.name,
          destinationPoint.lat,
          destinationPoint.lon,
          destinationPoint.name,
          destinationPoint.blockNumber,
          startPoint.blockNumber,
          mode
        );
        setActiveRoute(res);
      }
    },
    [startPoint, destinationPoint]
  );

  // Route Result
  const [activeRoute, setActiveRoute] = useState<RouteResult | null>(null);

  // Live Turn-by-Turn Navigation State
  const [isLiveNavigating, setIsLiveNavigating] = useState<boolean>(false);
  const [userHeading, setUserHeading] = useState<number | null>(null);
  const [isAutoCentering, setIsAutoCentering] = useState<boolean>(true);
  const [isRerouting, setIsRerouting] = useState<boolean>(false);
  const [isVoiceMuted, setIsVoiceMuted] = useState<boolean>(() => voiceGuide.getIsMuted());
  const [hasArrived, setHasArrived] = useState<boolean>(false);
  const [arrivalData, setArrivalData] = useState<ArrivalData | null>(null);
  const [liveNavMetrics, setLiveNavMetrics] = useState<LiveNavMetrics | null>(null);

  // Live Navigation Refs (to avoid stale closures in watchPosition callbacks)
  const liveNavWatchIdRef = useRef<number | null>(null);
  const activeRouteRef = useRef<RouteResult | null>(null);
  const destinationPointRef = useRef<UnifiedPoint | null>(null);
  const prevGpsCoordRef = useRef<{ lat: number; lon: number; timestamp: number } | null>(null);
  const userHeadingRef = useRef<number | null>(null);
  const offRouteCountRef = useRef<number>(0);
  const isReroutingRef = useRef<boolean>(false);
  const initialRouteDistRef = useRef<number>(0);
  const initialRouteDurRef = useRef<number>(0);
  const deviceOrientationHandlerRef = useRef<((e: DeviceOrientationEvent) => void) | null>(null);

  // Sync refs with state
  useEffect(() => {
    activeRouteRef.current = activeRoute;
  }, [activeRoute]);

  useEffect(() => {
    destinationPointRef.current = destinationPoint;
  }, [destinationPoint]);

  // Indoor page target
  const [indoorTargetBlock, setIndoorTargetBlock] = useState<string | undefined>('34');

  // GPS User Location state
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [gpsActive, setGpsActive] = useState<boolean>(false);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Flag to track whether the user has manually chosen a non-GPS start point
  const isManualStartPointRef = useRef<boolean>(false);

  // Handle explicit origin selection (user manual choice vs GPS reset)
  const handleSetStartPoint = useCallback((name: string, lat: number, lon: number) => {
    const isGps = name.toLowerCase().includes('gps');
    isManualStartPointRef.current = !isGps;
    setStartPoint(makePoint(name, lat, lon));
  }, []);

  // Request Geolocation (Always active by default, can also be triggered via Locate Me)
  const requestGps = useCallback(() => {
    if (!('geolocation' in navigator)) {
      setGpsError('Geolocation is not supported by your browser.');
      setGpsActive(false);
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    // Explicit request resets manual override so startPoint tracks current GPS
    isManualStartPointRef.current = false;

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const inside = isPointInsideLpuCampus(latitude, longitude);

        setUserLocation({
          lat: latitude,
          lon: longitude,
          accuracy,
          isInsideCampus: inside,
        });

        setGpsActive(true);
        setGpsLoading(false);
        setGpsError(null);

        // By default the start point will be the user's location until and unless the user changes it manually
        if (!isManualStartPointRef.current) {
          setStartPoint(
            makePoint(
              inside ? 'My Current GPS Location' : 'My GPS (Off Campus)',
              latitude,
              longitude
            )
          );
        }
      },
      (err) => {
        console.warn('[LPU Wayfinder] GPS acquisition error:', err.code, err.message);
        setGpsActive(false);
        setGpsLoading(false);

        let errorMsg = 'Unable to obtain GPS position.';
        if (err.code === 1) {
          errorMsg = 'Location permission denied by browser. You can select your starting gate manually.';
        } else if (err.code === 2) {
          errorMsg = 'GPS location unavailable. Please select your origin point.';
        } else if (err.code === 3) {
          errorMsg = 'Location request timed out. Please try again.';
        }
        setGpsError(errorMsg);

        // Fallback default starting location to Gate 1 (Main Entrance) if no start point yet
        setStartPoint((prev) => {
          if (!prev && !isManualStartPointRef.current) {
            const mainGate = (campusGates && campusGates[0]) || fallbackGates[0];
            return makePoint(
              mainGate.name,
              mainGate.coordinates[1],
              mainGate.coordinates[0],
              'Gate'
            );
          }
          return prev;
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 5000,
      }
    );
  }, [campusGates]);

  // Auto-request GPS on application load so the user never has to tap "Locate Me" manually
  useEffect(() => {
    requestGps();
  }, [requestGps]);

  // Continuously track GPS and keep startPoint automatically synced to user location until manually changed
  useEffect(() => {
    if (!('geolocation' in navigator)) return;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        const inside = isPointInsideLpuCampus(latitude, longitude);

        setUserLocation({
          lat: latitude,
          lon: longitude,
          accuracy,
          isInsideCampus: inside,
        });
        setGpsActive(true);
        setGpsLoading(false);
        setGpsError(null);

        // Default the start point to the user's location until and unless the user changes it manually
        if (!isManualStartPointRef.current && !isLiveNavigating) {
          setStartPoint((prev) => {
            if (!isManualStartPointRef.current) {
              return makePoint(
                inside ? 'My Current GPS Location' : 'My GPS (Off Campus)',
                latitude,
                longitude
              );
            }
            return prev;
          });
        }
      },
      (err) => {
        console.warn('[LPU Wayfinder] Background GPS tracking notice:', err.message);
      },
      { enableHighAccuracy: true, maximumAge: 3000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [isLiveNavigating]);

  // Compute Route
  const handleCalculateRoute = () => {
    if (!startPoint || !destinationPoint) return;

    // Calculate verified campus route using active travel mode (walk vs vehicle)
    const result = routingEngine.calculateRoute(
      startPoint.lat,
      startPoint.lon,
      startPoint.name,
      destinationPoint.lat,
      destinationPoint.lon,
      destinationPoint.name,
      destinationPoint.blockNumber,
      startPoint.blockNumber,
      travelModeRef.current
    );
    setActiveRoute(result);
  };

  // Clear Route
  const handleClearRoute = () => {
    if (isLiveNavigating) {
      handleExitLiveNavigation();
    }
    setDestinationPoint(null);
    setActiveRoute(null);
    if (userLocation) {
      isManualStartPointRef.current = false;
      setStartPoint(
        makePoint(
          userLocation.isInsideCampus ? 'My Current GPS Location' : 'My GPS (Off Campus)',
          userLocation.lat,
          userLocation.lon
        )
      );
    } else {
      setStartPoint(null);
    }
  };

  // Live Navigation GPS Position Handler
  const handleLiveNavGpsPosition = useCallback((pos: GeolocationPosition) => {
    const currentRoute = activeRouteRef.current;
    const currentDest = destinationPointRef.current;
    if (!currentRoute || !currentDest) return;

    const { latitude, longitude, accuracy } = pos.coords;
    const inside = isPointInsideLpuCampus(latitude, longitude);

    // Derive heading: prefer device orientation / GPS heading, or calculate bearing if moved
    let currentHeading = userHeadingRef.current;
    if (pos.coords.heading !== null && !isNaN(pos.coords.heading) && pos.coords.heading >= 0) {
      currentHeading = pos.coords.heading;
    } else if (prevGpsCoordRef.current) {
      const distMoved = haversineDistanceMeters(
        prevGpsCoordRef.current.lat,
        prevGpsCoordRef.current.lon,
        latitude,
        longitude
      );
      if (distMoved >= 2.5) {
        currentHeading = calculateBearing(
          prevGpsCoordRef.current.lat,
          prevGpsCoordRef.current.lon,
          latitude,
          longitude
        );
      }
    }

    prevGpsCoordRef.current = { lat: latitude, lon: longitude, timestamp: Date.now() };
    userHeadingRef.current = currentHeading;
    setUserHeading(currentHeading);

    setUserLocation({
      lat: latitude,
      lon: longitude,
      accuracy,
      heading: currentHeading ?? undefined,
      speed: pos.coords.speed ?? undefined,
      isInsideCampus: inside,
    });

    const pathCoords = currentRoute.pathCoordinates || currentRoute.coordinates || [];
    const gpsQuality: GpsQuality = accuracy <= 15 ? 'good' : accuracy <= 35 ? 'poor' : 'poor';

    // 1. Check Arrival Condition (~18m threshold)
    const destLat = currentDest.lat;
    const destLon = currentDest.lon;
    const distToDest = haversineDistanceMeters(latitude, longitude, destLat, destLon);

    const lastRoutePoint = pathCoords[pathCoords.length - 1];
    const distToLastRoutePoint = lastRoutePoint
      ? haversineDistanceMeters(latitude, longitude, lastRoutePoint[0], lastRoutePoint[1])
      : 999;

    if (distToDest <= 18 || distToLastRoutePoint <= 18) {
      const arr = determineArrivalDirection(
        latitude,
        longitude,
        destLat,
        destLon,
        currentHeading,
        pathCoords,
        currentDest.name
      );
      voiceGuide.speak(
        `You have arrived at ${currentDest.name}. Your destination is ${arr.message}.`,
        true
      );

      setHasArrived(true);
      setArrivalData({
        destinationName: currentDest.name,
        direction: arr.direction,
        message: arr.message,
        totalDistance: initialRouteDistRef.current || currentRoute.distanceMeters,
        totalDuration: initialRouteDurRef.current || currentRoute.durationMinutes,
      });

      if (liveNavWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(liveNavWatchIdRef.current);
        liveNavWatchIdRef.current = null;
      }
      return;
    }

    // 2. Snap to Route Polyline
    const snapResult = findClosestPointOnRoute(latitude, longitude, pathCoords);
    const { closestSegmentIndex, projectedPoint, distanceFromRouteMeters } = snapResult;

    // 3. Off-route detection and automatic rerouting
    const offRouteThreshold = Math.max(25, accuracy);
    if (distanceFromRouteMeters > offRouteThreshold) {
      offRouteCountRef.current += 1;
      if (offRouteCountRef.current >= 2 && !isReroutingRef.current) {
        isReroutingRef.current = true;
        setIsRerouting(true);
        const currentMode = travelModeRef.current || 'walk';
        voiceGuide.speak(
          currentMode === 'vehicle'
            ? 'Rerouting. Recalculating vehicular path to destination.'
            : 'Rerouting. Recalculating path to destination.',
          true
        );

        const newRoute = routingEngine.calculateRoute(
          latitude,
          longitude,
          'My Current GPS Location',
          destLat,
          destLon,
          currentDest.name,
          currentDest.blockNumber,
          undefined,
          currentMode
        );

        if (newRoute && newRoute.found) {
          setActiveRoute(newRoute);
          activeRouteRef.current = newRoute;
          offRouteCountRef.current = 0;
        }
        isReroutingRef.current = false;
        setIsRerouting(false);
        return;
      }
    } else {
      offRouteCountRef.current = 0;
    }

    // 4. Calculate Remaining Distance & Time
    const remainingDist = calculateRemainingDistanceAlongRoute(snapResult, pathCoords);
    const currentMode = travelModeRef.current || 'walk';
    const speedMps = currentMode === 'vehicle' ? (20 * 1000) / 3600 : 1.25; // 20 km/h (~5.55 m/s) vs 4.5 km/h (1.25 m/s)
    const remainingMin = Math.max(1, Math.ceil(remainingDist / (speedMps * 60)));

    // 5. Identify Next Maneuver & Step
    const upcoming = findUpcomingStep(snapResult, pathCoords, currentRoute.steps || []);

    let nextStep: RouteStep | null = null;
    let distToTurn = remainingDist;
    let isImmediate = false;
    let instruction = `Follow walkway towards ${currentDest.name}`;

    if (upcoming && upcoming.nextStep) {
      nextStep = upcoming.nextStep;
      distToTurn = upcoming.distanceToStepMeters;
      isImmediate = distToTurn <= 12;
      instruction = getTurnInstruction(nextStep, distToTurn, isImmediate);

      // Voice announcements
      if (distToTurn <= 50 && distToTurn > 15) {
        voiceGuide.announceTurnWarning(nextStep, Math.round(distToTurn));
      } else if (isImmediate) {
        voiceGuide.announceTurnImmediate(nextStep);
      }
    }

    setLiveNavMetrics({
      destinationName: currentDest.name,
      nextStep,
      distanceToNextStepMeters: Math.round(distToTurn),
      instructionText: instruction,
      isImmediateTurn: isImmediate,
      remainingDistanceMeters: Math.round(remainingDist),
      remainingDurationMinutes: remainingMin,
      gpsAccuracy: Math.round(accuracy),
      gpsQuality,
    });
  }, []);

  // Exit Live Navigation
  const handleExitLiveNavigation = useCallback(() => {
    if (liveNavWatchIdRef.current !== null) {
      navigator.geolocation.clearWatch(liveNavWatchIdRef.current);
      liveNavWatchIdRef.current = null;
    }
    if (deviceOrientationHandlerRef.current) {
      window.removeEventListener('deviceorientation', deviceOrientationHandlerRef.current, true);
      deviceOrientationHandlerRef.current = null;
    }
    voiceGuide.cancel();
    setIsLiveNavigating(false);
    setLiveNavMetrics(null);
    setIsAutoCentering(true);
    setIsRerouting(false);
    isReroutingRef.current = false;
    offRouteCountRef.current = 0;
    setHasArrived(false);
    setArrivalData(null);
  }, []);

  // Start Live Navigation Mode
  const handleStartLiveNavigation = useCallback(() => {
    const route = activeRouteRef.current || activeRoute;
    const dest = destinationPointRef.current || destinationPoint;
    if (!route || !route.found || !dest) return;

    setIsLiveNavigating(true);
    setHasArrived(false);
    setArrivalData(null);
    setIsAutoCentering(true);
    setIsRerouting(false);
    isReroutingRef.current = false;
    offRouteCountRef.current = 0;

    activeRouteRef.current = route;
    destinationPointRef.current = dest;
    initialRouteDistRef.current = route.distanceMeters;
    initialRouteDurRef.current = route.durationMinutes;

    const pathCoords = route.pathCoordinates || route.coordinates || [];
    if (!userLocation && pathCoords.length > 0) {
      setUserLocation({
        lat: pathCoords[0][0],
        lon: pathCoords[0][1],
        accuracy: 10,
        isInsideCampus: true,
      });
    }

    if (pathCoords.length >= 2) {
      const initHeading = calculateBearing(
        pathCoords[0][0],
        pathCoords[0][1],
        pathCoords[1][0],
        pathCoords[1][1]
      );
      userHeadingRef.current = initHeading;
      setUserHeading(initHeading);
    }

    const initialDist = route.distanceMeters;
    const initialMin = route.durationMinutes;
    const initialNextStep = route.steps && route.steps.length > 0 ? route.steps[0] : null;

    const isVeh = travelModeRef.current === 'vehicle';
    setLiveNavMetrics({
      destinationName: dest.name,
      nextStep: initialNextStep,
      distanceToNextStepMeters: initialNextStep ? initialNextStep.distanceMeters : initialDist,
      instructionText: initialNextStep
        ? getTurnInstruction(initialNextStep, initialNextStep.distanceMeters, false)
        : (isVeh ? `Drive along campus road towards ${dest.name}` : `Follow walkway towards ${dest.name}`),
      isImmediateTurn: false,
      remainingDistanceMeters: initialDist,
      remainingDurationMinutes: initialMin,
      gpsAccuracy: userLocation?.accuracy ? Math.round(userLocation.accuracy) : 10,
      gpsQuality: userLocation?.accuracy && userLocation.accuracy > 25 ? 'poor' : 'good',
    });

    voiceGuide.speak(
      isVeh
        ? `Starting vehicular navigation to ${dest.name}. Follow the highlighted driving route. Campus speed limit is 20 kilometers per hour.`
        : `Starting navigation to ${dest.name}. Follow the highlighted walkway.`,
      true
    );

    // Start live GPS watch
    if ('geolocation' in navigator) {
      if (liveNavWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(liveNavWatchIdRef.current);
      }

      liveNavWatchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => handleLiveNavGpsPosition(pos),
        (err) => {
          console.warn('[LPU Wayfinder] Live Nav GPS error:', err.message);
          setLiveNavMetrics((prev) => (prev ? { ...prev, gpsQuality: 'lost' } : null));
        },
        {
          enableHighAccuracy: true,
          maximumAge: 2000,
          timeout: 10000,
        }
      );

      // Also query immediately once
      navigator.geolocation.getCurrentPosition(
        (pos) => handleLiveNavGpsPosition(pos),
        (err) => console.warn('[LPU Wayfinder] Initial GPS query error:', err.message),
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 5000 }
      );
    }

    // Attach device orientation listener for compass
    try {
      const handleOrientation = (e: DeviceOrientationEvent) => {
        let heading: number | null = null;
        if ((e as any).webkitCompassHeading !== undefined) {
          heading = (e as any).webkitCompassHeading;
        } else if (e.alpha !== null && e.absolute) {
          heading = (360 - e.alpha) % 360;
        }
        if (heading !== null && !isNaN(heading)) {
          userHeadingRef.current = heading;
          setUserHeading(heading);
        }
      };
      window.addEventListener('deviceorientation', handleOrientation, true);
      deviceOrientationHandlerRef.current = handleOrientation;
    } catch (e) {}

    setActivePage('map');
  }, [activeRoute, destinationPoint, userLocation, handleLiveNavGpsPosition, setActivePage]);

  const handleToggleMute = useCallback(() => {
    const newMuted = voiceGuide.toggleMute();
    setIsVoiceMuted(newMuted);
  }, []);

  const handleRecenter = useCallback(() => {
    setIsAutoCentering(true);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveNavWatchIdRef.current !== null) {
        navigator.geolocation.clearWatch(liveNavWatchIdRef.current);
      }
      if (deviceOrientationHandlerRef.current) {
        window.removeEventListener('deviceorientation', deviceOrientationHandlerRef.current, true);
      }
      voiceGuide.cancel();
    };
  }, []);

  // Navigate to Building from Directory or Search (targets Preferred Entrance if configured)
  const handleNavigateToBuilding = (building: Building) => {
    let currentStart = startPoint;
    if (!currentStart) {
      if (userLocation && userLocation.isInsideCampus) {
        currentStart = makePoint('My GPS Location', userLocation.lat, userLocation.lon);
      } else {
        const mainGate = (campusGates && campusGates[0]) || fallbackGates[0];
        currentStart = makePoint(mainGate.name, mainGate.coordinates[1], mainGate.coordinates[0], 'Gate');
      }
      setStartPoint(currentStart);
    }

    // Check if building has a configured preferred entrance
    const prefEnt = getPreferredEntranceForBuilding ? getPreferredEntranceForBuilding(building.id) : null;

    const dest = prefEnt
      ? makePoint(
          `${building.name} (${prefEnt.name})`,
          prefEnt.latitude,
          prefEnt.longitude,
          building.block_number
        )
      : makePoint(
          building.name,
          building.coordinates.latitude,
          building.coordinates.longitude,
          building.block_number
        );

    setDestinationPoint(dest);
    setActivePage('map');

    // Calculate verified route to target entrance using active travel mode
    setTimeout(() => {
      const res = routingEngine.calculateRoute(
        currentStart.lat,
        currentStart.lon,
        currentStart.name,
        dest.lat,
        dest.lon,
        dest.name,
        dest.blockNumber,
        currentStart.blockNumber,
        travelModeRef.current
      );
      setActiveRoute(res);
    }, 150);
  };

  const handleNavigateToGate = (gate: CampusGate) => {
    let currentStart = startPoint;
    if (!currentStart) {
      if (userLocation && userLocation.isInsideCampus) {
        currentStart = makePoint('My GPS Location', userLocation.lat, userLocation.lon);
      } else {
        const mainGate = (campusGates && campusGates[0]) || fallbackGates[0];
        currentStart = makePoint(mainGate.name, mainGate.coordinates[1], mainGate.coordinates[0], 'Gate');
      }
      setStartPoint(currentStart);
    }

    const dest = makePoint(gate.name, gate.coordinates[1], gate.coordinates[0], 'Gate');
    setDestinationPoint(dest);
    setActivePage('map');

    setTimeout(() => {
      const res = routingEngine.calculateRoute(
        currentStart.lat,
        currentStart.lon,
        currentStart.name,
        dest.lat,
        dest.lon,
        dest.name,
        dest.blockNumber,
        currentStart.blockNumber,
        travelModeRef.current
      );
      setActiveRoute(res);
    }, 150);
  };

  const handleSelectRoutePreset = (
    start: { name: string; lat: number; lon: number },
    end: { name: string; lat: number; lon: number; blockNumber?: string }
  ) => {
    isManualStartPointRef.current = !start.name.toLowerCase().includes('gps');
    const origin = makePoint(start.name, start.lat, start.lon);
    const dest = makePoint(end.name, end.lat, end.lon, end.blockNumber);

    setStartPoint(origin);
    setDestinationPoint(dest);
    setActivePage('map');

    setTimeout(() => {
      const res = routingEngine.calculateRoute(
        origin.lat,
        origin.lon,
        origin.name,
        dest.lat,
        dest.lon,
        dest.name,
        dest.blockNumber,
        origin.blockNumber,
        travelModeRef.current
      );
      setActiveRoute(res);
    }, 150);
  };

  const handleViewIndoorStatus = (blockNumber: string) => {
    setIndoorTargetBlock(blockNumber);
    setActivePage('indoor');
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex flex-col bg-slate-50 text-slate-900 overflow-x-hidden">
      {/* Navigation Header */}
      <Navbar
        activePage={activePage}
        setActivePage={setActivePage}
        userLocation={userLocation}
        gpsActive={gpsActive}
        gpsLoading={gpsLoading}
        onRequestGps={requestGps}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenAdminLogin={() => setIsAdminLoginOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col w-full pb-14 md:pb-0">
        {activePage === 'home' && (
          <HomePage
            onOpenMap={() => setActivePage('map')}
            onOpenDirectory={() => setActivePage('directory')}
            onOpenIndoor={() => setActivePage('indoor')}
            onOpenSearch={() => setIsSearchOpen(true)}
            onSelectRoutePreset={handleSelectRoutePreset}
          />
        )}

        {activePage === 'map' && (
          <div className="flex-1 relative w-full h-[calc(100dvh-7rem)] md:h-[calc(100vh-4rem)] overflow-hidden">
            {/* Map Canvas */}
            <div className="absolute inset-0 w-full h-full">
              <CampusMap
                selectedBuilding={selectedBuilding}
                onSelectBuilding={(b) => setSelectedBuilding(b)}
                activeRoute={activeRoute}
                userLocation={userLocation}
                startPoint={startPoint}
                destinationPoint={destinationPoint}
                onSetStart={handleSetStartPoint}
                onSetDestination={(name, lat, lon, blockNumber) =>
                  setDestinationPoint(makePoint(name, lat, lon, blockNumber))
                }
                onNavigateToBuilding={handleNavigateToBuilding}
                onViewIndoorStatus={handleViewIndoorStatus}
                onMapCenterChange={setCurrentMapCenter}
                onOpenAddLocationAt={(coords) => {
                  setAddLocationCoords(coords);
                  setIsAddLocationOpen(true);
                }}
                onOpenAddEntranceAt={(coords) => {
                  setEntranceCoords(coords);
                  setIsEntranceModalOpen(true);
                }}
                isLiveNavigating={isLiveNavigating}
                userHeading={userHeading}
                isAutoCentering={isAutoCentering}
                onDisableAutoCentering={() => setIsAutoCentering(false)}
              />
            </div>

            {/* Admin Toolbar (Float Top Left) */}
            {isEditMode && (
              <AdminMapToolbar
                onOpenGateModal={() => setIsGateModalOpen(true)}
                onOpenHistoryModal={() => setIsHistoryModalOpen(true)}
                onOpenAddLocation={() => {
                  setAddLocationCoords(currentMapCenter);
                  setIsAddLocationOpen(true);
                }}
                onOpenAddEventLocation={() => {
                  setEditingEvent(null);
                  setIsAddEventLocationOpen(true);
                }}
                onOpenEventHistoryModal={() => setIsEventHistoryOpen(true)}
              />
            )}

            {/* Location Edit Drawer when Location is Selected */}
            {isEditMode && selectedLocation && (
              <LocationEditDrawer
                location={selectedLocation}
                onClose={() => setSelectedLocation(null)}
                onAddEntranceClick={(bId) => {
                  setEntranceBuildingId(bId);
                  setEntranceCoords(undefined);
                  setIsEntranceModalOpen(true);
                }}
              />
            )}

            {/* Live Turn-by-Turn Navigation HUD Overlay */}
            {isLiveNavigating && liveNavMetrics && (
              <LiveNavigationHUD
                destinationName={liveNavMetrics.destinationName}
                nextStep={liveNavMetrics.nextStep}
                distanceToNextStepMeters={liveNavMetrics.distanceToNextStepMeters}
                instructionText={liveNavMetrics.instructionText}
                isImmediateTurn={liveNavMetrics.isImmediateTurn}
                remainingDistanceMeters={liveNavMetrics.remainingDistanceMeters}
                remainingDurationMinutes={liveNavMetrics.remainingDurationMinutes}
                travelMode={travelMode}
                isRerouting={isRerouting}
                isMuted={isVoiceMuted}
                isAutoCentering={isAutoCentering}
                gpsAccuracy={liveNavMetrics.gpsAccuracy}
                gpsQuality={liveNavMetrics.gpsQuality}
                onToggleMute={handleToggleMute}
                onRecenter={handleRecenter}
                onExitNavigation={handleExitLiveNavigation}
              />
            )}

            {/* Normal Visitor Controls (Only shown when not editing and not in live nav) */}
            {!isEditMode && !isLiveNavigating && (
              <>
                {/* Floating Side Navigation / Route Panel */}
                <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-20 w-[calc(100%-1rem)] sm:w-96 max-w-md pointer-events-auto max-h-[calc(100dvh-8rem)] sm:max-h-[calc(100vh-6rem)] overflow-y-auto shadow-2xl rounded-2xl">
                  <RoutePanel
                    userLocation={userLocation}
                    startPoint={startPoint}
                    destinationPoint={destinationPoint}
                    activeRoute={activeRoute}
                    travelMode={travelMode}
                    onSelectTravelMode={handleSelectTravelMode}
                    onSetStart={handleSetStartPoint}
                    onSetDestination={(name, lat, lon, blockNumber) =>
                      setDestinationPoint(makePoint(name, lat, lon, blockNumber))
                    }
                    onCalculateRoute={handleCalculateRoute}
                    onClearRoute={handleClearRoute}
                    onOpenIndoorForBuilding={handleViewIndoorStatus}
                    onStartLiveNavigation={handleStartLiveNavigation}
                    onRequestGps={requestGps}
                  />
                </div>
              </>
            )}
          </div>
        )}

        {activePage === 'directory' && (
          <BuildingDirectory
            onSelectBuilding={(b) => setSelectedBuilding(b)}
            onNavigateToBuilding={handleNavigateToBuilding}
            onViewIndoorStatus={handleViewIndoorStatus}
          />
        )}

        {activePage === 'indoor' && (
          <IndoorNavigationPage
            initialBlockNumber={indoorTargetBlock}
            onNavigateOutdoorToBuilding={handleNavigateToBuilding}
          />
        )}

        {activePage === 'about' && <AboutPage />}
      </main>

      {/* Building Details Modal */}
      <BuildingDetailsModal
        building={selectedBuilding}
        onClose={() => setSelectedBuilding(null)}
        onNavigateToBuilding={handleNavigateToBuilding}
        onOpenIndoorPage={handleViewIndoorStatus}
      />

      {/* Global Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectBuilding={(b) => setSelectedBuilding(b)}
        onNavigateToBuilding={handleNavigateToBuilding}
        onNavigateToGate={handleNavigateToGate}
        onViewIndoorStatus={handleViewIndoorStatus}
      />

      {/* Admin Modals & Dialogs (Phase 7.0) */}
      <AdminLoginModal
        isOpen={isAdminLoginOpen}
        onClose={() => setIsAdminLoginOpen(false)}
        onSuccess={() => {
          setIsAdminLoginOpen(false);
          setIsEditMode(true);
          setActivePage('map');
        }}
      />

      <AddLocationModal
        isOpen={isAddLocationOpen}
        onClose={() => {
          setIsAddLocationOpen(false);
          setAddLocationCoords(undefined);
        }}
        onSuccess={(saved) => {
          setSelectedLocation(saved);
          setCurrentTool('select');
        }}
        onPickOnMap={() => {
          setIsAddLocationOpen(false);
          setCurrentTool('add_location');
        }}
        initialCoordinates={addLocationCoords || currentMapCenter}
      />

      <EntranceEditModal
        isOpen={isEntranceModalOpen}
        onClose={() => {
          setIsEntranceModalOpen(false);
          setEntranceCoords(undefined);
        }}
        buildingId={entranceBuildingId || selectedLocation?.id || ''}
        initialCoordinates={entranceCoords}
      />

      <GateManagementModal
        isOpen={isGateModalOpen}
        onClose={() => setIsGateModalOpen(false)}
        onAddGateOnMap={() => {
          setIsGateModalOpen(false);
          setCurrentTool('add_location');
        }}
      />

      <AuditHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
      />

      <AddEventLocationModal
        isOpen={isAddEventLocationOpen}
        onClose={() => {
          setIsAddEventLocationOpen(false);
          setEditingEvent(null);
        }}
        initialCoordinates={currentMapCenter}
        editingEvent={editingEvent}
        onClearEditingEvent={() => setEditingEvent(null)}
        onPickOnMap={() => {
          setIsAddEventLocationOpen(false);
          setCurrentTool('add_location');
        }}
      />

      <EventHistoryModal
        isOpen={isEventHistoryOpen}
        onClose={() => setIsEventHistoryOpen(false)}
        onEditAndReactivate={(evt) => {
          setEditingEvent(evt);
          setIsAddEventLocationOpen(true);
        }}
      />

      {/* Destination Arrival Modal */}
      {hasArrived && arrivalData && (
        <ArrivalModal
          destinationName={arrivalData.destinationName}
          arrivalDirection={arrivalData.direction}
          arrivalMessage={arrivalData.message}
          totalDistanceMeters={arrivalData.totalDistance}
          totalDurationMinutes={arrivalData.totalDuration}
          onClose={handleExitLiveNavigation}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <CampusDataProvider>
      <AppContent />
    </CampusDataProvider>
  );
}
