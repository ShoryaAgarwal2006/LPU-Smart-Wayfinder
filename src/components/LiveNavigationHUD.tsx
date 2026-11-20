import React from 'react';
import {
  CornerUpLeft,
  CornerUpRight,
  ArrowUp,
  CheckCircle2,
  Volume2,
  VolumeX,
  X,
  Crosshair,
  RotateCcw,
  Navigation2,
  Footprints,
  Clock,
  AlertTriangle,
  Car,
} from 'lucide-react';
import { RouteStep, ArrivalDirection, TravelMode } from '../types';

interface LiveNavigationHUDProps {
  destinationName: string;
  nextStep: RouteStep | null;
  distanceToNextStepMeters: number;
  instructionText: string;
  isImmediateTurn: boolean;
  remainingDistanceMeters: number;
  remainingDurationMinutes: number;
  travelMode?: TravelMode;
  isRerouting: boolean;
  isMuted: boolean;
  isAutoCentering: boolean;
  gpsAccuracy: number;
  gpsQuality: 'good' | 'poor' | 'searching' | 'lost' | 'denied';
  onToggleMute: () => void;
  onRecenter: () => void;
  onExitNavigation: () => void;
}

export const LiveNavigationHUD: React.FC<LiveNavigationHUDProps> = ({
  destinationName,
  nextStep,
  distanceToNextStepMeters,
  instructionText,
  isImmediateTurn,
  remainingDistanceMeters,
  remainingDurationMinutes,
  travelMode = 'walk',
  isRerouting,
  isMuted,
  isAutoCentering,
  gpsAccuracy,
  gpsQuality,
  onToggleMute,
  onRecenter,
  onExitNavigation,
}) => {
  const isVehicle = travelMode === 'vehicle';

  // Estimated arrival time calculated from remaining duration
  const etaTime = React.useMemo(() => {
    const d = new Date(Date.now() + Math.max(1, remainingDurationMinutes) * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [remainingDurationMinutes]);

  const getManeuverIcon = () => {
    if (isRerouting) {
      return <RotateCcw className="w-8 h-8 text-amber-400 animate-spin" />;
    }

    if (!nextStep) {
      return isVehicle ? (
        <Car className="w-8 h-8 text-blue-400" />
      ) : (
        <Navigation2 className="w-8 h-8 text-emerald-400" />
      );
    }

    const iconColor = isVehicle ? 'text-blue-300' : 'text-emerald-300';
    const arriveColor = isVehicle ? 'text-blue-400' : 'text-emerald-400';

    switch (nextStep.type) {
      case 'turn_left':
      case 'slight_left':
        return <CornerUpLeft className={`w-7 h-7 sm:w-9 sm:h-9 ${iconColor} stroke-[2.5]`} />;
      case 'turn_right':
      case 'slight_right':
        return <CornerUpRight className={`w-7 h-7 sm:w-9 sm:h-9 ${iconColor} stroke-[2.5]`} />;
      case 'arrive':
        return <CheckCircle2 className={`w-7 h-7 sm:w-9 sm:h-9 ${arriveColor} stroke-[2.5]`} />;
      default:
        return <ArrowUp className={`w-7 h-7 sm:w-9 sm:h-9 ${iconColor} stroke-[2.5]`} />;
    }
  };

  return (
    <div className="pointer-events-none fixed inset-0 z-40 flex flex-col justify-between p-2.5 sm:p-4 select-none">
      {/* Top Turn-by-Turn Instruction Banner (Google Maps Navigation Style) */}
      <div className="w-full max-w-xl mx-auto pointer-events-auto animate-in slide-in-from-top-4 duration-200">
        <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 text-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-700/80 p-3 sm:p-5 flex items-center justify-between gap-2.5 sm:gap-4 backdrop-blur-md">
          {/* Turn Icon */}
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl flex items-center justify-center shrink-0 shadow-inner border ${
              isVehicle
                ? 'bg-blue-950/80 border-blue-500/40'
                : 'bg-emerald-950/80 border-emerald-500/40'
            }`}
          >
            {getManeuverIcon()}
          </div>

          {/* Turn Text & Distance */}
          <div className="flex-1 min-w-0">
            {isRerouting ? (
              <div>
                <div className="flex items-center space-x-1 text-amber-400 text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-0.5">
                  <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span>Off Route</span>
                </div>
                <h2 className="text-sm sm:text-lg font-black text-white leading-tight">
                  Rerouting to destination...
                </h2>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-0.5">
                  {isVehicle ? 'Recalculating vehicular route (20 km/h)' : 'Finding nearest pedestrian walkway'}
                </p>
              </div>
            ) : (
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2 mb-0.5">
                  <span className="text-xl sm:text-3xl font-black text-white tracking-tight">
                    {distanceToNextStepMeters >= 1000
                      ? `${(distanceToNextStepMeters / 1000).toFixed(1)} km`
                      : `${Math.round(distanceToNextStepMeters)} m`}
                  </span>
                  {isImmediateTurn && (
                    <span
                      className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full animate-pulse ${
                        isVehicle ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-slate-950'
                      }`}
                    >
                      NOW
                    </span>
                  )}
                  {/* Mode Badge */}
                  <span
                    className={`inline-flex items-center space-x-1 px-1.5 sm:px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] font-bold ${
                      isVehicle
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-400/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/30'
                    }`}
                  >
                    {isVehicle ? (
                      <>
                        <Car className="w-3 h-3" />
                        <span>Drive &bull; 20 km/h</span>
                      </>
                    ) : (
                      <>
                        <Footprints className="w-3 h-3" />
                        <span>Walk & Go</span>
                      </>
                    )}
                  </span>
                </div>
                <p className="text-xs sm:text-sm font-bold text-slate-200 truncate mt-0.5">
                  {instructionText}
                </p>
              </div>
            )}
          </div>

          {/* Audio Mute & GPS Quality Status */}
          <div className="flex flex-col items-center gap-1 shrink-0">
            <button
              onClick={onToggleMute}
              className={`p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all ${
                isMuted
                  ? 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700 hover:text-white'
                  : isVehicle
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md shadow-blue-600/30 hover:bg-blue-500'
                  : 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-600/30 hover:bg-emerald-500'
              }`}
              title={isMuted ? 'Unmute voice navigation' : 'Mute voice navigation'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
            </button>

            {gpsQuality === 'poor' && (
              <span className="text-[8px] sm:text-[9px] font-bold text-amber-400 bg-amber-950/60 px-1 py-0.5 rounded border border-amber-500/30">
                ±{Math.round(gpsAccuracy)}m
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Floating Recenter Button (appears when map auto-centering is disabled) */}
      {!isAutoCentering && (
        <div className="w-full max-w-xl mx-auto flex justify-end pointer-events-auto pr-2 mb-2 animate-in fade-in duration-150">
          <button
            onClick={onRecenter}
            className="flex items-center space-x-1.5 px-3 sm:px-4 py-2 sm:py-2.5 bg-white text-slate-800 rounded-full shadow-xl border border-slate-200 text-xs font-bold hover:bg-slate-50 transition-all hover:scale-105 active:scale-95"
          >
            <Crosshair className={`w-4 h-4 ${isVehicle ? 'text-blue-600' : 'text-emerald-600'}`} />
            <span>Recenter Map</span>
          </button>
        </div>
      )}

      {/* Bottom Status & Control Bar */}
      <div className="w-full max-w-xl mx-auto pointer-events-auto animate-in slide-in-from-bottom-4 duration-200">
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 p-3 sm:p-5 flex items-center justify-between gap-3 sm:gap-4">
          {/* Trip Metrics */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            <div>
              <div className="flex items-baseline space-x-1">
                <span
                  className={`text-xl sm:text-3xl font-black ${
                    isVehicle ? 'text-blue-700' : 'text-emerald-700'
                  }`}
                >
                  {Math.max(1, remainingDurationMinutes)}
                </span>
                <span className="text-xs sm:text-sm font-extrabold text-slate-500">min</span>
              </div>
              <div className="text-[10px] sm:text-[11px] font-semibold text-slate-400 flex items-center space-x-1">
                <span>
                  {remainingDistanceMeters >= 1000
                    ? `${(remainingDistanceMeters / 1000).toFixed(2)} km`
                    : `${remainingDistanceMeters} m`}
                </span>
                <span>&bull;</span>
                <span>ETA {etaTime}</span>
              </div>
            </div>

            <div className="hidden sm:block h-10 w-px bg-slate-200" />

            {/* Destination Name */}
            <div className="hidden sm:block min-w-0 max-w-[200px]">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Navigating to
              </div>
              <div className="text-xs font-bold text-slate-800 truncate" title={destinationName}>
                {destinationName}
              </div>
            </div>
          </div>

          {/* Exit Navigation Button */}
          <button
            onClick={onExitNavigation}
            className="px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-red-50 hover:bg-red-100 text-red-700 hover:text-red-800 border border-red-200 text-xs sm:text-sm font-extrabold transition-all shadow-xs flex items-center space-x-1.5 active:scale-95"
            title="Exit Live Navigation Mode"
          >
            <X className="w-4 h-4" />
            <span>Exit</span>
          </button>
        </div>
      </div>
    </div>
  );
};
