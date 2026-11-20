import React, { useState } from 'react';
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
  CornerUpRight,
  CornerUpLeft,
  ArrowUp,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { GoogleRouteResult, GoogleRouteStep } from '../types/googleMaps';
import { UserLocation } from '../types';

interface GoogleRoutePanelProps {
  userLocation: UserLocation | null;
  startPoint: { name: string; lat: number; lng: number } | null;
  destinationPoint: { name: string; lat: number; lng: number } | null;
  activeRoute: GoogleRouteResult | null;
  onSetStart: (name: string, lat: number, lng: number) => void;
  onSetDestination: (name: string, lat: number, lng: number) => void;
  onCalculateRoute: () => void;
  onClearRoute: () => void;
  onOpenIndoorForBuilding?: (blockName: string) => void;
  isCalculating?: boolean;
}

export const GoogleRoutePanel: React.FC<GoogleRoutePanelProps> = ({
  userLocation,
  startPoint,
  destinationPoint,
  activeRoute,
  onSetStart,
  onSetDestination,
  onCalculateRoute,
  onClearRoute,
  onOpenIndoorForBuilding,
  isCalculating = false,
}) => {
  const [showDirections, setShowDirections] = useState(true);

  // Common LPU Gate & Hub Presets for easy selection
  const campusOriginPresets = [
    { name: 'Gate 1 (Main Entrance - GT Road)', lat: 31.2576, lng: 75.7088 },
    { name: 'Law Gate / Maheru Gate', lat: 31.254933, lng: 75.700155 },
    { name: 'Gate 2 (Academic Access)', lat: 31.2585, lng: 75.7078 },
    { name: 'Gate 4 (Residential Gate)', lat: 31.2562, lng: 75.7092 },
  ];

  const handleSwap = () => {
    if (startPoint && destinationPoint) {
      const oldStart = { ...startPoint };
      const oldDest = { ...destinationPoint };
      onSetStart(oldDest.name, oldDest.lat, oldDest.lng);
      onSetDestination(oldStart.name, oldStart.lat, oldStart.lng);
    }
  };

  const getStepIcon = (instruction: string) => {
    const lower = instruction.toLowerCase();
    if (lower.includes('left')) {
      return <CornerUpLeft className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />;
    }
    if (lower.includes('right')) {
      return <CornerUpRight className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />;
    }
    if (lower.includes('destination') || lower.includes('arrive')) {
      return <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />;
    }
    return <ArrowUp className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />;
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-200 p-4 sm:p-5 flex flex-col space-y-4 max-h-[85vh] overflow-y-auto">
      {/* Title */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center space-x-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base">Google Maps Walking Route</h3>
            <div className="text-[10px] text-slate-400 font-semibold">Official Walking Directions</div>
          </div>
        </div>
        {(startPoint || destinationPoint || activeRoute) && (
          <button
            onClick={onClearRoute}
            className="text-xs font-semibold text-slate-500 hover:text-red-600 flex items-center space-x-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Start and Destination Selection */}
      <div className="space-y-3 relative">
        {/* Origin */}
        <div className="relative">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Origin
          </label>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-blue-600 ring-4 ring-blue-100 shrink-0"></div>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800">
              {startPoint ? (
                <span className="truncate block font-bold text-slate-900">{startPoint.name}</span>
              ) : (
                <span className="text-slate-400 font-normal">Select origin or choose a campus gate...</span>
              )}
            </div>
          </div>
          {/* Quick Origin Selectors */}
          {!startPoint && (
            <div className="flex flex-wrap gap-1 mt-1.5 pl-5">
              {userLocation && (
                <button
                  onClick={() => onSetStart('My GPS Location', userLocation.lat, userLocation.lon)}
                  className="text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md hover:bg-blue-100 transition-colors"
                >
                  📍 My GPS
                </button>
              )}
              {campusOriginPresets.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() => onSetStart(preset.name, preset.lat, preset.lng)}
                  className="text-[10px] font-medium bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  🚪 {preset.name.split('(')[0].trim()}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Swap button */}
        <div className="absolute left-[5px] top-[46px] z-10">
          <button
            onClick={handleSwap}
            disabled={!startPoint || !destinationPoint}
            className="w-6 h-6 rounded-full bg-white border border-slate-300 shadow-xs flex items-center justify-center text-slate-500 hover:text-slate-900 hover:scale-110 disabled:opacity-40 disabled:hover:scale-100 transition-all"
            title="Swap origin and destination"
          >
            <ArrowRightLeft className="w-3 h-3 rotate-90" />
          </button>
        </div>

        {/* Destination */}
        <div className="relative pt-1">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
            Destination
          </label>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-emerald-600 ring-4 ring-emerald-100 shrink-0"></div>
            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-semibold text-slate-800">
              {destinationPoint ? (
                <span className="truncate block font-bold text-slate-900">{destinationPoint.name}</span>
              ) : (
                <span className="text-slate-400 font-normal">Search place or click marker on map...</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Calculate Route CTA */}
      <button
        onClick={onCalculateRoute}
        disabled={!startPoint || !destinationPoint || isCalculating}
        className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all"
      >
        <Navigation className="w-4 h-4" />
        <span>{isCalculating ? 'Calculating Walking Route...' : 'Get Google Walking Directions'}</span>
      </button>

      {/* Route Result Display */}
      {activeRoute && (
        <div className="pt-2 border-t border-slate-100 space-y-3">
          {activeRoute.found ? (
            <>
              {/* Metrics Strip */}
              <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-3 text-center">
                <div>
                  <div className="flex items-center justify-center text-emerald-600 space-x-1 mb-0.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span className="text-base font-extrabold text-slate-900">
                      {activeRoute.durationMinutes}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">min</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Walking Time</div>
                </div>

                <div className="border-x border-slate-200">
                  <div className="flex items-center justify-center text-blue-600 space-x-1 mb-0.5">
                    <Footprints className="w-3.5 h-3.5" />
                    <span className="text-base font-extrabold text-slate-900">
                      {activeRoute.distanceText}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Walking Distance</div>
                </div>

                <div>
                  <div className="flex items-center justify-center text-amber-600 space-x-1 mb-0.5">
                    <Flame className="w-3.5 h-3.5" />
                    <span className="text-base font-extrabold text-slate-900">
                      {Math.round(activeRoute.distanceMeters * 0.05)}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">kcal</span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium">Est. Calories</div>
                </div>
              </div>

              {/* Indoor Mapping Awaited Notice */}
              <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-amber-900 text-xs">
                <div className="flex items-start space-x-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold text-amber-950">
                      INDOOR FLOOR MAPPING AWAITED
                    </div>
                    <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                      This route guides you along mapped outdoor campus pedestrian walkways. Internal floor plans, corridor paths, and classroom coordinates require verified CAD mapping.
                    </p>
                  </div>
                </div>
              </div>

              {/* Open in Google Maps External Button */}
              {activeRoute.googleMapsDirectionsUrl && (
                <a
                  href={activeRoute.googleMapsDirectionsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
                >
                  <span>Open Route in Google Maps App</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}

              {/* Step-by-Step Directions */}
              {activeRoute.steps.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowDirections(!showDirections)}
                    className="w-full flex items-center justify-between py-1 text-xs font-bold text-slate-700 hover:text-slate-900"
                  >
                    <span>Turn-by-Turn Steps ({activeRoute.steps.length})</span>
                    {showDirections ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>

                  {showDirections && (
                    <div className="mt-2 space-y-2 border-t border-slate-100 pt-2">
                      {activeRoute.steps.map((step, idx) => (
                        <div
                          key={idx}
                          className="flex items-start space-x-2 text-xs text-slate-700 py-1"
                        >
                          {getStepIcon(step.instruction)}
                          <div className="flex-1">
                            <div>{step.instruction}</div>
                            {(step.distance || step.duration) && (
                              <div className="text-[10px] text-slate-400 mt-0.5">
                                {step.distance} &bull; {step.duration}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-900 text-xs">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-red-950">Walking Route Unavailable</div>
                  <p className="text-[11px] text-red-800 mt-1 leading-relaxed">
                    {activeRoute.error || 'Google Maps cannot calculate a pedestrian route between these coordinates.'}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
