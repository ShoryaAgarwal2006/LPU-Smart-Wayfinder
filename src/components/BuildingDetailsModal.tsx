import React, { useState } from 'react';
import { X, Building2, MapPin, Navigation, Layers, AlertCircle, ShieldAlert, CheckCircle, Info, ExternalLink, DoorOpen } from 'lucide-react';
import { Building, IndoorBuilding } from '../types';
import { indoorBuildings } from '../data/campusData';
import { useCampusData } from '../context/CampusDataContext';

interface BuildingDetailsModalProps {
  building: Building | null;
  onClose: () => void;
  onNavigateToBuilding: (building: Building) => void;
  onOpenIndoorPage: (blockNumber: string) => void;
}

export const BuildingDetailsModal: React.FC<BuildingDetailsModalProps> = ({
  building,
  onClose,
  onNavigateToBuilding,
  onOpenIndoorPage,
}) => {
  const [selectedFloor, setSelectedFloor] = useState<number>(0);
  const { getEntrancesForBuilding, getPreferredEntranceForBuilding, getPreferredGateForBuilding } = useCampusData();

  if (!building) return null;

  const indoorRecord = indoorBuildings.find((b) => b.building_id === building.id);
  const floors = Array.from({ length: building.floors }, (_, i) => i);
  const entrances = getEntrancesForBuilding(building.id);
  const preferredEntrance = getPreferredEntranceForBuilding(building.id);
  const preferredGate = getPreferredGateForBuilding(building.id);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh]">
        {/* Modal Header */}
        <div className="relative p-4 sm:p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between">
          <div>
            <div className="flex items-center space-x-2 mb-2">
              <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-emerald-500 text-white tracking-wider">
                BLOCK {building.block_number}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {building.campus_zone}
              </span>
              {building.verificationStatus && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-emerald-400" />
                  <span>{building.verificationStatus === 'GOOGLE_MAPS_VERIFIED' ? 'Google Maps Verified' : 'Multi-Source Verified'}</span>
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {building.name}
            </h2>
            <p className="text-xs font-medium text-emerald-400 mt-1">{building.category}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* Overview & Description */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-1.5">Overview</h4>
            <p className="text-slate-600 leading-normal">{building.description}</p>
          </div>

          {/* Google Maps Link & External Navigation */}
          {building.googleMapsUrl && (
            <div className="flex items-center justify-between p-3 bg-blue-50/70 border border-blue-200 rounded-2xl">
              <div className="flex items-center space-x-2">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="text-xs font-bold text-blue-900">Google Maps Ground Truth</span>
              </div>
              <a
                href={building.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs"
              >
                <span>View on Google Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          )}

          {/* Occupants & Schools */}
          <div>
            <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider mb-2">
              Departments & Facilities
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {(building.primary_occupants || [building.category]).map((occ, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-800 text-xs font-medium"
                >
                  {occ}
                </span>
              ))}
            </div>
          </div>

          {/* Geographical Specs */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs">
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Geographic Coordinates
              </span>
              <span className="font-mono font-bold text-slate-800">
                {building.coordinates.latitude.toFixed(6)}° N, {building.coordinates.longitude.toFixed(6)}° E
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Total Storeys
              </span>
              <span className="font-bold text-slate-800">{building.floors} Floors</span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Spatial Footprint Type
              </span>
              <span className="font-semibold text-slate-800 text-[11px] block mt-0.5">
                {building.osm_way_id ? (
                  <span className="text-slate-800 flex items-center space-x-1.5">
                    <span className="font-mono">OSM Way {building.osm_way_id}</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">Polygon Footprint</span>
                  </span>
                ) : (
                  <span className="text-amber-800 flex items-center space-x-1.5">
                    <span className="text-[11px] font-bold">Representative Grid Point</span>
                    <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">Approximate Access</span>
                  </span>
                )}
              </span>
            </div>
            <div>
              <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                Data Provenance
              </span>
              <span className="text-slate-600 line-clamp-1">{building.source}</span>
            </div>
            {building.googlePlaceId && (
              <div className="col-span-2 pt-2 border-t border-slate-200/60">
                <span className="text-slate-400 font-semibold block text-[10px] uppercase">
                  Google Maps Place ID
                </span>
                <span className="font-mono text-slate-700 text-xs">{building.googlePlaceId}</span>
              </div>
            )}
          </div>

          {/* Entrances & Gate Access (Phase 7.0) */}
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <DoorOpen className="w-4 h-4 text-emerald-700" />
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Campus Entrances & Access Points
                </h4>
              </div>
              {preferredGate && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300">
                  Approach: {preferredGate.name}
                </span>
              )}
            </div>

            {entrances.length > 0 ? (
              <div className="space-y-1.5 pt-1">
                {entrances.map((ent) => (
                  <div
                    key={ent.id}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs border ${
                      ent.isPreferred
                        ? 'bg-white border-emerald-300 shadow-xs'
                        : 'bg-white/80 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span className="text-sm">🚪</span>
                      <div>
                        <span className="font-bold text-slate-900">{ent.name}</span>
                        {ent.isPreferred && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold uppercase">
                            Preferred Entrance
                          </span>
                        )}
                        {ent.description && (
                          <p className="text-[10px] text-slate-500 mt-0.5">{ent.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-[10px] text-slate-400">
                      {ent.latitude.toFixed(5)}, {ent.longitude.toFixed(5)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 italic">
                General building perimeter access. Dedicated entrance doors can be mapped via Map Editor.
              </p>
            )}
          </div>

          {/* Spatial Approximation Notice for Grid-Mapped Buildings */}
          {!building.osm_way_id && (
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs flex items-start space-x-2 text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] leading-relaxed">
                <strong>Spatial Geometry Note:</strong> Block {building.block_number} is represented by an institutional centroid coordinate on the campus grid. Its physical building polygon footprint and exact entrance doorways have not yet been segmented in the open vector dataset and await on-site architectural surveying.
              </p>
            </div>
          )}

          {/* Indoor Navigation Section (Clearly Awaited) */}
          <div className="border border-amber-200 bg-amber-50/70 rounded-2xl p-4 space-y-3">
            <div className="flex items-center space-x-2 text-amber-900">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h4 className="font-extrabold text-sm text-amber-950">
                  INDOOR FLOOR MAPPING AWAITED
                </h4>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  Verified floor-plan data has not yet been added. Ground-truth CAD drawings are restricted by university administration.
                </p>
              </div>
            </div>

            {/* Floor Selector Preview */}
            <div>
              <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider mb-2">
                Floor Plan Architecture ({building.floors} Floors Available in System):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {floors.map((floor) => (
                  <button
                    key={floor}
                    onClick={() => setSelectedFloor(floor)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedFloor === floor
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white text-amber-900 border border-amber-300 hover:bg-amber-100'
                    }`}
                  >
                    {floor === 0 ? 'Ground' : `Floor ${floor}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Floor Status Preview Box */}
            <div className="p-3 bg-white border border-amber-200 rounded-xl text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">
                  {selectedFloor === 0 ? 'Ground Floor' : `Floor ${selectedFloor}`} Layout
                </span>
                <span className="text-[10px] font-extrabold text-amber-700 bg-amber-100 px-2 py-0.5 rounded">
                  Pending Official CAD
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">
                Classroom numbering follows{' '}
                <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-800 font-mono">
                  {building.block_number}-{selectedFloor}XX
                </code>
                . In strict compliance with zero-fabrication guidelines, no synthetic room polygons are rendered until verified drawings are activated.
              </p>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="p-4 sm:p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            onClick={() => onOpenIndoorPage(building.block_number)}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-colors"
          >
            Indoor Readiness Module
          </button>
          <button
            onClick={() => {
              onNavigateToBuilding(building);
              onClose();
            }}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center space-x-2 transition-all hover:scale-105"
          >
            <Navigation className="w-4 h-4" />
            <span>Navigate to Entrance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
