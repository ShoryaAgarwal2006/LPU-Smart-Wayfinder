import React from 'react';
import { GoogleCampusPlace } from '../types/googleMaps';
import {
  MapPin,
  ExternalLink,
  Navigation,
  Clock,
  Star,
  ShieldAlert,
  X,
  Compass,
  Building2,
} from 'lucide-react';

interface GooglePlaceDetailsProps {
  place: GoogleCampusPlace | null;
  onClose: () => void;
  onSetStart: (name: string, lat: number, lng: number) => void;
  onSetDestination: (name: string, lat: number, lng: number) => void;
  onViewIndoorStatus?: (name: string) => void;
}

export const GooglePlaceDetails: React.FC<GooglePlaceDetailsProps> = ({
  place,
  onClose,
  onSetStart,
  onSetDestination,
  onViewIndoorStatus,
}) => {
  if (!place) return null;

  return (
    <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col w-full max-w-sm sm:max-w-md animate-in slide-in-from-bottom-4 duration-200">
      {/* Photo header if available */}
      {place.photos && place.photos.length > 0 && (
        <div className="relative h-36 w-full bg-slate-900 overflow-hidden">
          <img
            src={place.photos[0].url}
            alt={place.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
          {place.photos[0].htmlAttributions && place.photos[0].htmlAttributions.length > 0 && (
            <div
              className="absolute bottom-1 right-2 text-[9px] text-white/70"
              dangerouslySetInnerHTML={{ __html: place.photos[0].htmlAttributions[0] }}
            />
          )}
        </div>
      )}

      {/* Header */}
      <div className="p-5 pb-3">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
            <span>Google Maps Ground Truth</span>
          </div>
          {(!place.photos || place.photos.length === 0) && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* EXACT GOOGLE MAPS PLACE NAME */}
        <h3 className="text-lg font-black text-slate-900 tracking-tight leading-snug">
          {place.name}
        </h3>

        {/* Rating and Reviews */}
        {place.rating !== undefined && (
          <div className="flex items-center space-x-1.5 mt-1 text-xs">
            <div className="flex items-center text-amber-500 font-bold">
              <Star className="w-3.5 h-3.5 fill-amber-400 mr-0.5" />
              <span>{place.rating.toFixed(1)}</span>
            </div>
            {place.userRatingsTotal && (
              <span className="text-slate-400 text-[11px]">
                ({place.userRatingsTotal} reviews)
              </span>
            )}
          </div>
        )}
      </div>

      {/* Body details */}
      <div className="px-5 py-2 space-y-3 text-xs text-slate-600">
        {/* Address */}
        {place.formattedAddress && (
          <div className="flex items-start space-x-2 text-slate-700">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{place.formattedAddress}</span>
          </div>
        )}

        {/* Coordinates & Place ID */}
        <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1 font-mono text-[11px]">
          <div className="flex justify-between text-slate-700">
            <span className="text-slate-400">Coordinates:</span>
            <span>{place.location.lat.toFixed(6)}° N, {place.location.lng.toFixed(6)}° E</span>
          </div>
          <div className="flex justify-between text-slate-700 truncate">
            <span className="text-slate-400">Place ID:</span>
            <span className="truncate max-w-[180px]">{place.placeId}</span>
          </div>
        </div>

        {/* Indoor Floor Mapping Awaited Notice */}
        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start space-x-2 text-amber-900 text-[11px]">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <strong>INDOOR FLOOR MAPPING AWAITED:</strong> Ground-truth indoor floor plans and classroom layouts are pending institutional surveying.
          </div>
        </div>

        {/* Direct Google Maps External Link */}
        <div>
          <a
            href={place.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center space-x-1.5 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl font-bold text-xs transition-colors"
          >
            <span>Open in Official Google Maps</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2 mt-2">
        <button
          onClick={() => {
            onSetStart(place.name, place.location.lat, place.location.lng);
            onClose();
          }}
          className="flex-1 py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs transition-colors text-center"
        >
          Start Here
        </button>
        <button
          onClick={() => {
            onSetDestination(place.name, place.location.lat, place.location.lng);
            onClose();
          }}
          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-colors flex items-center justify-center space-x-1 shadow-xs"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Walk Here</span>
        </button>
      </div>
    </div>
  );
};
