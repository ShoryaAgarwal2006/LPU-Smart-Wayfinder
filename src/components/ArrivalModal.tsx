import React from 'react';
import { CheckCircle2, Navigation, MapPin, Footprints, Clock, ArrowRight, CornerDownRight, CornerDownLeft } from 'lucide-react';
import { ArrivalDirection } from '../types';

interface ArrivalModalProps {
  destinationName: string;
  arrivalDirection?: ArrivalDirection;
  arrivalMessage?: string;
  totalDistanceMeters: number;
  totalDurationMinutes: number;
  onClose: () => void;
}

export const ArrivalModal: React.FC<ArrivalModalProps> = ({
  destinationName,
  arrivalDirection = 'arrived',
  arrivalMessage,
  totalDistanceMeters,
  totalDurationMinutes,
  onClose,
}) => {
  const getDirectionBadge = () => {
    if (arrivalDirection === 'left') {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
          <CornerDownLeft className="w-4 h-4 text-blue-600" />
          <span>On Your Left</span>
        </div>
      );
    }
    if (arrivalDirection === 'right') {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">
          <CornerDownRight className="w-4 h-4 text-blue-600" />
          <span>On Your Right</span>
        </div>
      );
    }
    if (arrivalDirection === 'straight') {
      return (
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>Straight Ahead</span>
        </div>
      );
    }
    return (
      <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        <span>Arrived</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center p-5 sm:p-7 space-y-4 sm:space-y-5 animate-in zoom-in-95 duration-200">
        {/* Animated Trophy / Checkmark Icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto ring-8 ring-emerald-50 shadow-inner">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>

        {/* Title & Message */}
        <div className="space-y-2">
          {getDirectionBadge()}
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            You Have Arrived!
          </h2>
          <p className="text-sm font-bold text-slate-700 max-w-xs mx-auto leading-normal">
            {arrivalMessage || `You have arrived at ${destinationName}.`}
          </p>
        </div>

        {/* Summary Metrics */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
          <div>
            <div className="flex items-center justify-center text-blue-600 space-x-1 mb-0.5">
              <Footprints className="w-4 h-4" />
              <span className="text-lg font-black text-slate-900">
                {totalDistanceMeters >= 1000
                  ? `${(totalDistanceMeters / 1000).toFixed(2)} km`
                  : `${totalDistanceMeters} m`}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Total Walked
            </div>
          </div>

          <div className="border-l border-slate-200">
            <div className="flex items-center justify-center text-emerald-600 space-x-1 mb-0.5">
              <Clock className="w-4 h-4" />
              <span className="text-lg font-black text-slate-900">
                {Math.max(1, totalDurationMinutes)} min
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              Walking Time
            </div>
          </div>
        </div>

        {/* Exit Button */}
        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-emerald-600/25 transition-all hover:scale-[1.02] active:scale-98 flex items-center justify-center space-x-2"
        >
          <span>Complete Navigation</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
