import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Building2,
  MapPin,
  Navigation,
  Layers,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { buildings as staticBuildings, campusGates as staticGates, campusMasterInventory as staticInventory } from '../data/campusData';
import { Building, CampusGate, CampusPlace } from '../types';
import { useCampusData } from '../context/CampusDataContext';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectBuilding: (building: Building) => void;
  onNavigateToBuilding: (building: Building) => void;
  onNavigateToGate: (gate: CampusGate) => void;
  onViewIndoorStatus: (blockNumber: string) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  isOpen,
  onClose,
  onSelectBuilding,
  onNavigateToBuilding,
  onNavigateToGate,
  onViewIndoorStatus,
}) => {
  const [query, setQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const campusData = useCampusData();
  const buildings = campusData?.buildings && campusData.buildings.length > 0 ? campusData.buildings : staticBuildings;
  const campusGates = campusData?.campusGates && campusData.campusGates.length > 0 ? campusData.campusGates : staticGates;
  const campusMasterInventory = campusData?.campusMasterInventory && campusData.campusMasterInventory.length > 0 ? campusData.campusMasterInventory : staticInventory;

  // Handle keyboard ESC and Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const placeToBuilding = (p: CampusPlace): Building => {
    const existing = buildings.find((b) => b.id === p.id || (p.buildingId && b.id === p.buildingId));
    if (existing) return existing;
    return {
      id: p.id,
      name: p.name,
      block_number: p.blockNumber || p.id.replace('BLOCK_', ''),
      category: p.subcategory || p.category.replace(/_/g, ' '),
      campus_zone: 'LPU Campus',
      floors: 1,
      coordinates: {
        latitude: p.latitude,
        longitude: p.longitude,
      },
      primary_occupants: [p.subcategory || p.name],
      description: p.notes,
      source: p.sourceReferences?.join(', ') || 'Ground Truth Record',
      osm_way_id:
        p.osmFeatureId && p.osmFeatureId.startsWith('way/')
          ? parseInt(p.osmFeatureId.replace('way/', ''), 10)
          : null,
      googlePlaceId: p.googlePlaceId,
      googleMapsUrl: p.googleMapsUrl,
      verificationStatus: p.verificationStatus,
    };
  };

  const filteredPlaces = useMemo(() => {
    const q = query.trim().toLowerCase();

    return campusMasterInventory.filter((p) => {
      const cat = (p.category || '').toLowerCase();
      let matchesCat = false;
      if (filterCategory === 'all') matchesCat = true;
      else if (filterCategory === 'academic')
        matchesCat = cat.includes('academic');
      else if (filterCategory === 'hostel_studio')
        matchesCat =
          cat.includes('hostel') ||
          cat.includes('studio') ||
          cat.includes('apartment') ||
          cat.includes('residence') ||
          cat.includes('staff');
      else if (filterCategory === 'medical')
        matchesCat = cat.includes('medical') || cat.includes('hospital') || cat.includes('pharmacy');
      else if (filterCategory === 'food')
        matchesCat =
          cat.includes('food') ||
          cat.includes('dining') ||
          cat.includes('cafeteria') ||
          cat.includes('restaurant') ||
          cat.includes('bake');
      else if (filterCategory === 'sports_parks')
        matchesCat =
          cat.includes('sport') ||
          cat.includes('arena') ||
          cat.includes('park') ||
          cat.includes('garden') ||
          cat.includes('ground') ||
          cat.includes('stadium') ||
          cat.includes('auditorium');
      else if (filterCategory === 'gates')
        matchesCat = cat.includes('gate') || p.id.startsWith('GATE_');
      else if (filterCategory === 'events')
        matchesCat = cat.includes('event') || p.id.startsWith('EVENT_');

      if (!matchesCat) return false;
      if (!q) return true;

      const inName = p.name.toLowerCase().includes(q);
      const inId = p.id.toLowerCase().includes(q);
      const inNotes = (p.notes || '').toLowerCase().includes(q);
      const inSubcat = p.subcategory ? p.subcategory.toLowerCase().includes(q) : false;
      const inAddress = p.formattedAddress ? p.formattedAddress.toLowerCase().includes(q) : false;
      const inBlock = p.blockNumber ? p.blockNumber.toLowerCase().includes(q) : false;

      return inName || inId || inNotes || inSubcat || inAddress || inBlock;
    });
  }, [query, filterCategory, campusMasterInventory]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start sm:items-center justify-center p-2.5 sm:p-6 pt-4 sm:pt-0 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[80vh]">
        {/* Search Input Bar */}
        <div className="relative p-4 border-b border-slate-100 flex items-center space-x-3 bg-slate-50/50">
          <Search className="w-5 h-5 text-emerald-600 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search block (e.g. 34, 38), studio (BS-11, GS-1), hospital, food, gate..."
            className="w-full bg-transparent text-sm sm:text-base font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills */}
        <div className="px-4 py-2 border-b border-slate-100 flex items-center space-x-2 overflow-x-auto text-xs font-semibold scrollbar-thin">
          {[
            { id: 'all', label: `All (${campusMasterInventory.length})` },
            ...(campusMasterInventory.some((p) => (p.category || '').toLowerCase().includes('event') || p.id.startsWith('EVENT_'))
              ? [{ id: 'events', label: '🎉 Events' }]
              : []),
            { id: 'academic', label: 'Academic Blocks' },
            { id: 'hostel_studio', label: 'Hostels & Studios' },
            { id: 'medical', label: 'Hospital & Medical' },
            { id: 'food', label: 'Food & Dining' },
            { id: 'sports_parks', label: 'Sports & Parks' },
            { id: 'gates', label: 'Campus Gates' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors ${
                filterCategory === cat.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Results List */}
        <div className="overflow-y-auto divide-y divide-slate-100 p-2">
          {filteredPlaces.length > 0 ? (
            <div className="py-1">
              <div className="px-3 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Matching Campus Places ({filteredPlaces.length})
              </div>
              {filteredPlaces.map((p) => {
                const isGate = p.category === 'gate';
                const isGoogleVerified = p.verificationStatus === 'GOOGLE_MAPS_VERIFIED';
                const isMultiVerified = p.verificationStatus === 'MULTI_SOURCE_VERIFIED';
                const bldg = placeToBuilding(p);

                const getIconAndBg = () => {
                  const cat = (p.category || '').toLowerCase();
                  if (cat.includes('event') || p.id.startsWith('EVENT_'))
                    return { icon: '🎉', bg: 'bg-purple-100 text-purple-800' };
                  if (isGate || cat.includes('gate') || p.id.startsWith('GATE_'))
                    return { icon: '🚪', bg: 'bg-emerald-100 text-emerald-800' };
                  if (cat.includes('medical') || cat.includes('hospital') || cat.includes('pharmacy'))
                    return { icon: '🏥', bg: 'bg-rose-100 text-rose-800' };
                  if (cat.includes('food') || cat.includes('dining') || cat.includes('cafeteria') || cat.includes('restaurant') || cat.includes('bake'))
                    return { icon: '🍴', bg: 'bg-amber-100 text-amber-800' };
                  if (cat.includes('sport') || cat.includes('arena') || cat.includes('ground') || cat.includes('stadium'))
                    return { icon: '⚽', bg: 'bg-emerald-100 text-emerald-800' };
                  if (cat.includes('park') || cat.includes('garden') || cat.includes('lawn'))
                    return { icon: '🌿', bg: 'bg-green-100 text-green-800' };
                  if (cat.includes('studio'))
                    return { icon: '🏢', bg: 'bg-indigo-100 text-indigo-800' };
                  if (cat.includes('boys'))
                    return { icon: '🏠', bg: 'bg-blue-100 text-blue-800' };
                  if (cat.includes('girls'))
                    return { icon: '🌸', bg: 'bg-purple-100 text-purple-800' };
                  return { icon: '🏢', bg: 'bg-slate-100 text-slate-800' };
                };

                const { icon, bg } = getIconAndBg();

                return (
                  <div
                    key={p.id}
                    className="px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors"
                  >
                    <div
                      className="flex items-center space-x-3 cursor-pointer flex-1"
                      onClick={() => {
                        if (isGate) {
                          const gateObj = campusGates.find(
                            (g) => g.id.toLowerCase() === p.id.toLowerCase()
                          ) || {
                            id: p.id,
                            name: p.name,
                            coordinates: [p.longitude, p.latitude] as [number, number],
                            description: p.notes,
                            is_main_entrance: p.id === 'GATE_1_MAIN',
                            source: p.sourceReferences[0],
                          };
                          onNavigateToGate(gateObj);
                        } else {
                          onSelectBuilding(bldg);
                        }
                        onClose();
                      }}
                    >
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm shrink-0 ${bg}`}
                      >
                        {icon}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors flex items-center space-x-1.5">
                          <span>{p.name}</span>
                          {isGoogleVerified && (
                            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                              ✓ Google
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 line-clamp-1">
                          <span className="font-semibold text-slate-700">
                            {p.subcategory || p.category.replace(/_/g, ' ')}
                          </span>{' '}
                          &bull; {p.latitude.toFixed(4)}°N, {p.longitude.toFixed(4)}°E
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                      {p.googleMapsUrl && (
                        <a
                          href={p.googleMapsUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Open in Google Maps"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      {!isGate && (
                        <button
                          onClick={() => {
                            onViewIndoorStatus(p.id.replace('BLOCK_', ''));
                            onClose();
                          }}
                          className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded text-[10px] font-bold border border-amber-200"
                          title="Inspect indoor floor mapping status"
                        >
                          Indoor
                        </button>
                      )}
                      <button
                        onClick={() => {
                          if (isGate) {
                            const gateObj = campusGates.find(
                              (g) => g.id.toLowerCase() === p.id.toLowerCase()
                            ) || {
                              id: p.id,
                              name: p.name,
                              coordinates: [p.longitude, p.latitude] as [number, number],
                              description: p.notes,
                              is_main_entrance: p.id === 'GATE_1_MAIN',
                              source: p.sourceReferences[0],
                            };
                            onNavigateToGate(gateObj);
                          } else {
                            onNavigateToBuilding(bldg);
                          }
                          onClose();
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold shadow-xs flex items-center space-x-1"
                        title="Calculate walking path to this location"
                      >
                        <Navigation className="w-3 h-3" />
                        <span className="hidden sm:inline">Navigate</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">
              <Building2 className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-medium text-sm text-slate-600">
                No campus locations found matching "{query}"
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for block numbers (e.g. "34", "38"), studios ("BS-11", "GS-1"), hostels ("BH-1", "GH-1"), or landmarks ("Library", "Uni Hospital", "Uni-Mall").
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
