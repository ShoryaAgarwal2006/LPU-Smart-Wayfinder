import React, { useState, useMemo } from 'react';
import {
  Navigation,
  MapPin,
  ArrowRightLeft,
  Clock,
  Footprints,
  Flame,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  RotateCcw,
  Compass,
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  CheckCircle2,
  Car,
  Gauge,
  Zap,
} from 'lucide-react';
import { buildings as staticBuildings, campusGates as staticGates, campusMasterInventory as staticInventory } from '../data/campusData';
import { Building, CampusGate, RouteResult, RouteStep, UserLocation, TravelMode } from '../types';
import { useCampusData } from '../context/CampusDataContext';

interface RoutePanelProps {
  userLocation: UserLocation | null;
  startPoint: { name: string; lat: number; lon: number } | null;
  destinationPoint: { name: string; lat: number; lon: number; blockNumber?: string } | null;
  activeRoute: RouteResult | null;
  travelMode?: TravelMode;
  onSelectTravelMode?: (mode: TravelMode) => void;
  onSetStart: (name: string, lat: number, lon: number) => void;
  onSetDestination: (name: string, lat: number, lon: number, blockNumber?: string) => void;
  onCalculateRoute: () => void;
  onClearRoute: () => void;
  onOpenIndoorForBuilding: (blockNumber: string) => void;
  onStartLiveNavigation?: () => void;
  onRequestGps?: () => void;
}

export const RoutePanel: React.FC<RoutePanelProps> = ({
  userLocation,
  startPoint,
  destinationPoint,
  activeRoute,
  travelMode = 'walk',
  onSelectTravelMode,
  onSetStart,
  onSetDestination,
  onCalculateRoute,
  onClearRoute,
  onOpenIndoorForBuilding,
  onStartLiveNavigation,
  onRequestGps,
}) => {
  const [showDirections, setShowDirections] = useState(true);
  const [showGpsPrompt, setShowGpsPrompt] = useState(false);
  const [isMobileCollapsed, setIsMobileCollapsed] = useState(false);

  // Check if startPoint is currently user GPS position
  const isGpsStart = Boolean(
    startPoint?.name.toLowerCase().includes('gps') ||
      (userLocation &&
        startPoint &&
        Math.abs(startPoint.lat - userLocation.lat) < 0.0001 &&
        Math.abs(startPoint.lon - userLocation.lon) < 0.0001)
  );

  const handleStartLiveNavClick = () => {
    if (!activeRoute || !activeRoute.found) return;

    if (!isGpsStart) {
      setShowGpsPrompt(true);
      return;
    }

    onStartLiveNavigation?.();
  };

  const handleConfirmGpsAndStart = () => {
    setShowGpsPrompt(false);
    onRequestGps?.();
    if (userLocation) {
      onSetStart('My Current GPS Location', userLocation.lat, userLocation.lon);
      setTimeout(() => {
        onCalculateRoute();
        setTimeout(() => {
          onStartLiveNavigation?.();
        }, 150);
      }, 50);
    } else {
      onStartLiveNavigation?.();
    }
  };

  // Connect to live canonical data context
  const campusData = useCampusData();
  const campusMasterInventory =
    campusData?.campusMasterInventory && campusData.campusMasterInventory.length > 0
      ? campusData.campusMasterInventory
      : staticInventory;

  // Normalized category matchers
  const isGate = (cat: string) => (cat || '').toLowerCase().includes('gate');
  const isAcademic = (cat: string) => (cat || '').toLowerCase().includes('academic');
  const isBoys = (cat: string) => (cat || '').toLowerCase().includes('boys');
  const isGirls = (cat: string) => (cat || '').toLowerCase().includes('girls');
  const isFood = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('food') || c.includes('dining') || c.includes('cafeteria') || c.includes('restaurant') || c.includes('bake');
  };
  const isMedical = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('medical') || c.includes('hospital') || c.includes('pharmacy');
  };
  const isSportsOrParks = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('sport') || c.includes('park') || c.includes('garden') || c.includes('arena') || c.includes('ground') || c.includes('auditorium') || c.includes('unipolis');
  };

  // Quick preset destinations resolving to canonical names and live coordinates
  const quickTargetKeys = [
    { key: 'BLOCK_34', fallback: 'Block 34', block: '34' },
    { key: 'BLOCK_37', fallback: 'Central Library', block: '37' },
    { key: 'MED_UNI_HOSPITAL', fallback: 'Uni Hospital', block: '3' },
    { key: 'FOOD_UNI_MALL', fallback: 'Uni-Mall', block: '15' },
    { key: 'BLOCK_32', fallback: 'Block 32', block: '32' },
    { key: 'BS_11', fallback: 'BS-11', block: 'BS-11' },
    { key: 'LOC_1795168524613', fallback: 'GS-11', block: 'GS-11' },
    { key: 'LOC_1795172885452', fallback: 'BH-1', block: 'BH-1' },
    { key: 'GH_01', fallback: 'GH-1', block: 'GH-1' },
    { key: 'LOC_1795172576094', fallback: 'Law Gate', block: 'Gate' },
    { key: 'LOC_1795172119524', fallback: 'Main Gate', block: 'Gate' },
    { key: 'AUDI_UNIPOLIS', fallback: 'Baldev Raj Mittal Unipolis', block: 'Unipolis' },
  ];

  const quickDestinations = useMemo(() => {
    return quickTargetKeys.map((item) => {
      const match = campusMasterInventory.find(
        (p) =>
          p.id === item.key ||
          p.name.toLowerCase().includes(item.fallback.toLowerCase()) ||
          p.id.toLowerCase().includes(item.fallback.toLowerCase())
      );
      if (match) {
        return {
          name: match.name,
          block: item.block,
          lat: match.latitude,
          lon: match.longitude,
        };
      }
      return {
        name: item.fallback,
        block: item.block,
        lat: 31.254,
        lon: 75.704,
      };
    });
  }, [campusMasterInventory]);

  const handleSwap = () => {
    if (startPoint && destinationPoint) {
      const oldStart = { ...startPoint };
      const oldDest = { ...destinationPoint };
      onSetStart(oldDest.name, oldDest.lat, oldDest.lon);
      onSetDestination(oldStart.name, oldStart.lat, oldStart.lon);
    }
  };

  const getStepIcon = (type: RouteStep['type']) => {
    switch (type) {
      case 'turn_left':
      case 'slight_left':
        return <CornerUpLeft className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />;
      case 'turn_right':
      case 'slight_right':
        return <CornerUpRight className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />;
      case 'arrive':
        return <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />;
      default:
        return <ArrowUp className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />;
    }
  };

  if (isMobileCollapsed) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-200 p-3 flex items-center justify-between gap-2 animate-in fade-in duration-150">
        <div
          className="flex items-center space-x-2.5 min-w-0 flex-1 cursor-pointer"
          onClick={() => setIsMobileCollapsed(false)}
        >
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              travelMode === 'vehicle'
                ? 'bg-blue-100 text-blue-700'
                : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            {travelMode === 'vehicle' ? <Car className="w-5 h-5" /> : <Footprints className="w-5 h-5" />}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-black text-slate-900 truncate">
              {destinationPoint ? destinationPoint.name : 'Select Destination Point'}
            </div>
            <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 truncate">
              <span className="truncate max-w-[90px]">{startPoint ? startPoint.name.split('(')[0].trim() : 'Origin'}</span>
              <span>&rarr;</span>
              {activeRoute && activeRoute.found ? (
                <span className={`font-bold ${travelMode === 'vehicle' ? 'text-blue-600' : 'text-emerald-600'}`}>
                  {activeRoute.durationMinutes} min &bull; {activeRoute.distanceMeters >= 1000 ? `${(activeRoute.distanceMeters / 1000).toFixed(1)}km` : `${activeRoute.distanceMeters}m`}
                </span>
              ) : (
                <span>Tap to route</span>
              )}
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsMobileCollapsed(false)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold text-white transition-all flex items-center space-x-1 shrink-0 ${
            travelMode === 'vehicle'
              ? 'bg-blue-600 hover:bg-blue-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
          title="Open route planner"
        >
          <span>Plan</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-3 sm:p-5 flex flex-col space-y-3 sm:space-y-4 max-h-[calc(100dvh-7.5rem)] sm:max-h-[85vh] overflow-y-auto">
      {/* Title & Controls */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm sm:text-base">Outdoor Wayfinder</h3>
        </div>

        <div className="flex items-center space-x-1.5">
          {/* Minimize on Mobile to View Map */}
          <button
            type="button"
            onClick={() => setIsMobileCollapsed(true)}
            className="sm:hidden text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center space-x-1 px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors"
            title="Minimize panel to view full map"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>

          {(startPoint || destinationPoint || activeRoute) && (
            <button
              onClick={onClearRoute}
              className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center space-x-1 transition-colors px-1.5 py-1 rounded-lg hover:bg-slate-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Mode Selector: Walk & Go vs Vehicle */}
      <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1.5 border border-slate-200">
        <button
          type="button"
          onClick={() => onSelectTravelMode?.('walk')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            travelMode === 'walk'
              ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30 scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
          title="Pedestrian walkway navigation via paved campus footpaths and plazas"
        >
          <Footprints className="w-4 h-4" />
          <span>Walk &amp; Go</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTravelMode?.('vehicle')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center space-x-2 cursor-pointer ${
            travelMode === 'vehicle'
              ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 scale-[1.02]'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
          }`}
          title="Vehicular navigation on driveable campus roads and parking access"
        >
          <Car className="w-4 h-4" />
          <span>Vehicle / Drive</span>
        </button>
      </div>

      {/* Start and Destination Selection */}
      <div className="space-y-3 relative">
        {/* Start Point Input */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Start Location
          </label>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100 shrink-0"></div>
            <select
              value={
                startPoint?.name.toLowerCase().includes('gps')
                  ? 'gps'
                  : startPoint
                  ? `${startPoint.lat},${startPoint.lon}`
                  : ''
              }
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                if (val === 'gps') {
                  if (userLocation) {
                    onSetStart('My Current GPS Location', userLocation.lat, userLocation.lon);
                  } else {
                    onRequestGps?.();
                    onSetStart('My Current GPS Location', 31.2588, 75.7062);
                  }
                } else {
                  const [lat, lon, ...nameParts] = val.split(',');
                  onSetStart(nameParts.join(','), parseFloat(lat), parseFloat(lon));
                }
              }}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="">Select origin point...</option>
              <option value="gps">
                {userLocation
                  ? `📍 My GPS Location (±${Math.round(userLocation.accuracy)}m)`
                  : '📍 My Current GPS Location (Locating...)'}
              </option>
              {campusMasterInventory.some((p) => (p.category || '').toLowerCase().includes('event') || p.id.startsWith('EVENT_')) && (
                <optgroup label="🎉 Active Campus Events">
                  {campusMasterInventory
                    .filter((p) => (p.category || '').toLowerCase().includes('event') || p.id.startsWith('EVENT_'))
                    .map((evt) => (
                      <option
                        key={evt.id}
                        value={`${evt.latitude},${evt.longitude},${evt.name}`}
                      >
                        🎉 {evt.name}
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="Campus Entrance Gates">
                {campusMasterInventory
                  .filter((p) => isGate(p.category) || p.id.startsWith('GATE_'))
                  .map((gate) => (
                    <option
                      key={gate.id}
                      value={`${gate.latitude},${gate.longitude},${gate.name}`}
                    >
                      🚪 {gate.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Academic Blocks">
                {campusMasterInventory
                  .filter((p) => isAcademic(p.category) && !isGate(p.category) && !p.id.startsWith('GATE_'))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.name}`}
                    >
                      🏢 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Boys Hostels & Studios">
                {campusMasterInventory
                  .filter((p) => isBoys(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.name}`}
                    >
                      🏠 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Girls Hostels & Studios">
                {campusMasterInventory
                  .filter((p) => isGirls(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.name}`}
                    >
                      🌸 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Food Courts & Dining">
                {campusMasterInventory
                  .filter((p) => isFood(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.name}`}
                    >
                      🍴 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Hospital & Medical Care">
                {campusMasterInventory
                  .filter((p) => isMedical(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.name}`}
                    >
                      🏥 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Sports, Parks & Arenas">
                {campusMasterInventory
                  .filter((p) => isSportsOrParks(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.name}`}
                    >
                      ⚽ {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Other Landmarks & Campus Services">
                {campusMasterInventory
                  .filter(
                    (p) =>
                      !isGate(p.category) &&
                      !p.id.startsWith('GATE_') &&
                      !isAcademic(p.category) &&
                      !isBoys(p.category) &&
                      !isGirls(p.category) &&
                      !isFood(p.category) &&
                      !isMedical(p.category) &&
                      !isSportsOrParks(p.category)
                  )
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.name}`}
                    >
                      📍 {p.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>

        {/* Swap button */}
        <div className="absolute left-[5px] top-[48px] z-10">
          <button
            onClick={handleSwap}
            disabled={!startPoint || !destinationPoint}
            className="w-6 h-6 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-900 hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 transition-all"
            title="Swap origin and destination"
          >
            <ArrowRightLeft className="w-3 h-3 rotate-90" />
          </button>
        </div>

        {/* Destination Point Input */}
        <div className="relative pt-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Destination
          </label>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100 shrink-0"></div>
            <select
              value={destinationPoint ? `${destinationPoint.lat},${destinationPoint.lon}` : ''}
              onChange={(e) => {
                const val = e.target.value;
                if (!val) return;
                const [lat, lon, block, ...nameParts] = val.split(',');
                onSetDestination(nameParts.join(','), parseFloat(lat), parseFloat(lon), block);
              }}
              className="w-full text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <option value="">Select destination point...</option>
              {campusMasterInventory.some((p) => (p.category || '').toLowerCase().includes('event') || p.id.startsWith('EVENT_')) && (
                <optgroup label="🎉 Active Campus Events">
                  {campusMasterInventory
                    .filter((p) => (p.category || '').toLowerCase().includes('event') || p.id.startsWith('EVENT_'))
                    .map((evt) => (
                      <option
                        key={evt.id}
                        value={`${evt.latitude},${evt.longitude},Event,${evt.name}`}
                      >
                        🎉 {evt.name}
                      </option>
                    ))}
                </optgroup>
              )}
              <optgroup label="Academic Blocks">
                {campusMasterInventory
                  .filter((p) => isAcademic(p.category) && !isGate(p.category) && !p.id.startsWith('GATE_'))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.blockNumber || p.id.replace('BLOCK_', '')},${p.name}`}
                    >
                      🏢 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Boys Hostels & Studios">
                {campusMasterInventory
                  .filter((p) => isBoys(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.blockNumber || p.id.replace('_', '-')},${p.name}`}
                    >
                      🏠 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Girls Hostels & Studios">
                {campusMasterInventory
                  .filter((p) => isGirls(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},${p.blockNumber || p.id.replace('_', '-')},${p.name}`}
                    >
                      🌸 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Hospital & Medical Care">
                {campusMasterInventory
                  .filter((p) => isMedical(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},Hospital,${p.name}`}
                    >
                      🏥 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Food Courts & Dining">
                {campusMasterInventory
                  .filter((p) => isFood(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},Dining,${p.name}`}
                    >
                      🍴 {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Sports, Parks & Arenas">
                {campusMasterInventory
                  .filter((p) => isSportsOrParks(p.category))
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},Facility,${p.name}`}
                    >
                      ⚽ {p.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Campus Entrance Gates">
                {campusMasterInventory
                  .filter((p) => isGate(p.category) || p.id.startsWith('GATE_'))
                  .map((gate) => (
                    <option
                      key={gate.id}
                      value={`${gate.latitude},${gate.longitude},Gate,${gate.name}`}
                    >
                      🚪 {gate.name}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Other Landmarks & Campus Services">
                {campusMasterInventory
                  .filter(
                    (p) =>
                      !isGate(p.category) &&
                      !p.id.startsWith('GATE_') &&
                      !isAcademic(p.category) &&
                      !isBoys(p.category) &&
                      !isGirls(p.category) &&
                      !isFood(p.category) &&
                      !isMedical(p.category) &&
                      !isSportsOrParks(p.category)
                  )
                  .map((p) => (
                    <option
                      key={p.id}
                      value={`${p.latitude},${p.longitude},Landmark,${p.name}`}
                    >
                      📍 {p.name}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Destination Chips */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5">Quick Landmarks:</div>
        <div className="flex flex-wrap gap-1.5">
          {quickDestinations.map((d) => (
            <button
              key={d.name}
              onClick={() => onSetDestination(d.name, d.lat, d.lon, d.block)}
              className="text-[11px] font-medium bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg transition-colors"
            >
              {d.name}
            </button>
          ))}
        </div>
      </div>

      {/* Calculate Route CTA */}
      <button
        onClick={onCalculateRoute}
        disabled={!startPoint || !destinationPoint}
        className={`w-full py-3.5 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-extrabold rounded-xl shadow-md flex items-center justify-center space-x-2 transition-all hover:scale-[1.01] cursor-pointer ${
          travelMode === 'vehicle'
            ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/25'
            : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/25'
        }`}
      >
        {travelMode === 'vehicle' ? <Car className="w-4 h-4" /> : <Footprints className="w-4 h-4" />}
        <span>
          {travelMode === 'vehicle' ? 'Calculate Vehicle Route' : 'Calculate Walk & Go Route'}
        </span>
      </button>

      {/* Active Route Result Display */}
      {activeRoute && (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          {activeRoute.found ? (
            <>
              {/* Entrance Type & Walkway Snapping Provenance Indicator */}
              <div className="flex items-center justify-between px-3 py-2 rounded-xl text-xs border font-medium bg-slate-50 border-slate-200">
                <span className="text-[11px] text-slate-500">Destination Access Point:</span>
                {travelMode === 'vehicle' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-lg text-[10px]">
                    <Car className="w-3 h-3 text-blue-600" />
                    Vehicular Drop-off Bay (~{activeRoute.endPoint.snapDistanceMeters || 15}m)
                  </span>
                ) : activeRoute.endPoint.entranceType === 'verified_gate' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px]">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Verified Gate Entrance
                  </span>
                ) : activeRoute.endPoint.entranceType === 'representative_grid' ? (
                  <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg text-[10px]">
                    <AlertTriangle className="w-3 h-3 text-amber-600" />
                    Approximate Walkway Snap (~{activeRoute.endPoint.snapDistanceMeters || 15}m)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-lg text-[10px]">
                    <Footprints className="w-3 h-3 text-emerald-600" />
                    Perimeter Walkway Snap (~{activeRoute.endPoint.snapDistanceMeters || 15}m)
                  </span>
                )}
              </div>

              {/* Prominent START Live Navigation Button */}
              <div className="space-y-2">
                <button
                  onClick={handleStartLiveNavClick}
                  className={`w-full py-3.5 text-white text-xs sm:text-sm font-black rounded-xl shadow-lg flex items-center justify-center space-x-2.5 transition-all hover:scale-[1.01] active:scale-98 cursor-pointer ${
                    travelMode === 'vehicle'
                      ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 shadow-blue-600/30'
                      : 'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/30'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
                    {travelMode === 'vehicle' ? (
                      <Car className="w-3.5 h-3.5 text-white" />
                    ) : (
                      <Navigation className="w-3.5 h-3.5 fill-current text-white" />
                    )}
                  </div>
                  <span className="tracking-wide">
                    {travelMode === 'vehicle' ? 'START VEHICLE NAVIGATION' : 'START LIVE NAVIGATION'}
                  </span>
                </button>

                {showGpsPrompt && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl space-y-2 text-left animate-in fade-in duration-150">
                    <div className="flex items-start space-x-2">
                      <Compass className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="text-xs font-bold text-blue-950">
                          Live Navigation Requires Your GPS Location
                        </div>
                        <p className="text-[11px] text-blue-800 mt-0.5 leading-relaxed">
                          Your route currently starts from <b>&quot;{startPoint?.name}&quot;</b>. To track your live {travelMode === 'vehicle' ? 'driving' : 'walking'} progress and update turns in real time, live navigation will use your current device location.
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={handleConfirmGpsAndStart}
                          className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
                        >
                          Use My GPS &amp; Start
                        </button>
                        <button
                          onClick={() => {
                            setShowGpsPrompt(false);
                            onStartLiveNavigation?.();
                          }}
                          className={`flex-1 py-2 text-white rounded-lg text-xs font-bold shadow-xs transition-colors ${
                            travelMode === 'vehicle' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700'
                          }`}
                        >
                          Start from Origin
                        </button>
                      </div>
                      <button
                        onClick={() => setShowGpsPrompt(false)}
                        className="w-full py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                <div>
                  <div className={`flex items-center justify-center space-x-1 mb-0.5 ${
                    travelMode === 'vehicle' ? 'text-blue-600' : 'text-emerald-600'
                  }`}>
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-base font-extrabold text-slate-900">
                      {activeRoute.durationMinutes}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">min</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">
                    {travelMode === 'vehicle' ? 'Driving Time' : 'Walking Time'}
                  </div>
                </div>

                <div className="border-x border-slate-200">
                  <div className="flex items-center justify-center text-blue-600 space-x-1 mb-0.5">
                    {travelMode === 'vehicle' ? <Car className="w-3.5 h-3.5" /> : <Footprints className="w-3.5 h-3.5" />}
                    <span className="text-base font-extrabold text-slate-900">
                      {activeRoute.distanceMeters >= 1000
                        ? `${(activeRoute.distanceMeters / 1000).toFixed(2)}`
                        : activeRoute.distanceMeters}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {activeRoute.distanceMeters >= 1000 ? 'km' : 'm'}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Exact Distance</div>
                </div>

                <div>
                  {travelMode === 'vehicle' ? (
                    <>
                      <div className="flex items-center justify-center text-indigo-600 space-x-1 mb-0.5">
                        <Gauge className="w-3.5 h-3.5" />
                        <span className="text-base font-extrabold text-slate-900">20</span>
                        <span className="text-xs font-semibold text-slate-500">km/h</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Campus Limit</div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center text-amber-600 space-x-1 mb-0.5">
                        <Flame className="w-3.5 h-3.5" />
                        <span className="text-base font-extrabold text-slate-900">
                          {activeRoute.calories || Math.round(activeRoute.distanceMeters * 0.05)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">kcal</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">Est. Calories</div>
                    </>
                  )}
                </div>
              </div>

              {/* Indoor Mapping Awaited Notice for Destination */}
              {destinationPoint?.blockNumber && destinationPoint.blockNumber !== 'Gate' && (
                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <div className="flex items-start space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold text-amber-950">
                        Indoor Floor Mapping Awaited &bull; {destinationPoint.name}
                      </div>
                      <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                        {activeRoute.endPoint.entranceType === 'representative_grid'
                          ? `This outdoor route guides you to the nearest pedestrian walkway (~${activeRoute.endPoint.snapDistanceMeters || 15}m from representative grid point). Architectural entrance doors and classroom layouts have not yet been surveyed.`
                          : `This outdoor route guides you to the building perimeter walkway (~${activeRoute.endPoint.snapDistanceMeters || 15}m from footprint centroid). Internal classroom and corridor layouts have not yet been surveyed.`}
                      </p>
                      <button
                        onClick={() => onOpenIndoorForBuilding(destinationPoint.blockNumber!)}
                        className="mt-1.5 inline-flex items-center text-[11px] font-bold text-amber-900 underline hover:text-amber-950"
                      >
                        Inspect Indoor Readiness Status &rarr;
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Turn-by-Turn Collapsible Directions */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setShowDirections(!showDirections)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-slate-100 text-xs font-bold text-slate-800 transition-colors"
                >
                  <span className="flex items-center space-x-1.5">
                    <Compass className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Turn-by-Turn Directions ({activeRoute.steps.length} steps)</span>
                  </span>
                  {showDirections ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {showDirections && (
                  <div className="p-3 space-y-2 bg-white max-h-56 overflow-y-auto divide-y divide-slate-100 text-xs">
                    {activeRoute.steps.map((step, idx) => (
                      <div key={idx} className="pt-2 first:pt-0 flex items-start space-x-2.5">
                        {getStepIcon(step.type)}
                        <div className="flex-1">
                          <p className="text-slate-800 font-medium leading-tight">
                            {step.instruction}
                          </p>
                          {step.distanceMeters > 0 && (
                            <span className="text-[10px] font-semibold text-slate-400">
                              For {step.distanceMeters} meters
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Warning / Route Not Found */
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-900 text-xs flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-red-950">Walkway Route Unavailable</div>
                <p className="text-[11px] text-red-800 mt-1">
                  {activeRoute.warningMessage ||
                    'A verified pedestrian pathway could not be resolved. Imaginary direct lines across buildings are never drawn.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
