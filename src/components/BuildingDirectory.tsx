import React, { useState, useMemo } from 'react';
import {
  Building2,
  Navigation,
  Layers,
  Search,
  MapPin,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Home,
  Library,
  HeartPulse,
  ShoppingBag,
  CheckCircle,
  AlertTriangle,
} from 'lucide-react';
import { buildings as staticBuildings, campusMasterInventory as staticInventory } from '../data/campusData';
import { Building, CampusPlace } from '../types';
import { useCampusData } from '../context/CampusDataContext';

interface BuildingDirectoryProps {
  onSelectBuilding: (building: Building) => void;
  onNavigateToBuilding: (building: Building) => void;
  onViewIndoorStatus: (blockNumber: string) => void;
}

export const BuildingDirectory: React.FC<BuildingDirectoryProps> = ({
  onSelectBuilding,
  onNavigateToBuilding,
  onViewIndoorStatus,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const campusData = useCampusData();
  const buildings = campusData?.buildings && campusData.buildings.length > 0 ? campusData.buildings : staticBuildings;
  const campusMasterInventory = campusData?.campusMasterInventory && campusData.campusMasterInventory.length > 0 ? campusData.campusMasterInventory : staticInventory;

  const isAcademic = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('academic');
  };
  const isBoysHostel = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('boys');
  };
  const isGirlsHostel = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('girls');
  };
  const isApartment = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('apartment') || c.includes('staff') || c.includes('residence');
  };
  const isFood = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('food') || c.includes('dining') || c.includes('cafeteria') || c.includes('restaurant') || c.includes('bake');
  };
  const isMedical = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('medical') || c.includes('hospital') || c.includes('pharmacy');
  };
  const isSports = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('sport') || c.includes('cricket') || c.includes('stadium') || c.includes('ground');
  };
  const isParks = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('park') || c.includes('garden') || c.includes('lawn') || c.includes('vatika');
  };
  const isVenues = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('arena') || c.includes('auditorium') || c.includes('unipolis');
  };
  const isAdmin = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('commercial') || c.includes('administrative') || c.includes('utility') || c.includes('other landmark') || c.includes('landmark') || c.includes('office') || c.includes('parking') || c.includes('stop');
  };
  const isGates = (cat: string) => {
    const c = (cat || '').toLowerCase();
    return c.includes('gate');
  };

  const categories = [
    { id: 'all', label: `All Places (${campusMasterInventory.length})` },
    {
      id: 'academic',
      label: `Academic Blocks (${campusMasterInventory.filter((p) => isAcademic(p.category)).length})`,
    },
    {
      id: 'boys_hostel',
      label: `Boys' Hostels & Studios (${campusMasterInventory.filter((p) => isBoysHostel(p.category)).length})`,
    },
    {
      id: 'girls_hostel',
      label: `Girls' Hostels & Studios (${campusMasterInventory.filter((p) => isGirlsHostel(p.category)).length})`,
    },
    {
      id: 'apartments',
      label: `Apartments & Staff (${campusMasterInventory.filter((p) => isApartment(p.category)).length})`,
    },
    {
      id: 'food',
      label: `Food & Dining (${campusMasterInventory.filter((p) => isFood(p.category)).length})`,
    },
    {
      id: 'medical',
      label: `Medical & Hospital (${campusMasterInventory.filter((p) => isMedical(p.category)).length})`,
    },
    {
      id: 'sports',
      label: `Sports & Athletics (${campusMasterInventory.filter((p) => isSports(p.category)).length})`,
    },
    {
      id: 'parks',
      label: `Parks & Gardens (${campusMasterInventory.filter((p) => isParks(p.category)).length})`,
    },
    {
      id: 'venues',
      label: `Auditoriums & Arenas (${campusMasterInventory.filter((p) => isVenues(p.category)).length})`,
    },
    {
      id: 'admin',
      label: `Admin & Utility (${campusMasterInventory.filter((p) => isAdmin(p.category)).length})`,
    },
    {
      id: 'gates',
      label: `Campus Gates (${campusMasterInventory.filter((p) => isGates(p.category)).length})`,
    },
  ];

  const filteredPlaces = useMemo(() => {
    return campusMasterInventory.filter((p) => {
      const q = searchTerm.toLowerCase();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.id.toLowerCase().includes(q) ||
        (p.subcategory && p.subcategory.toLowerCase().includes(q)) ||
        p.notes.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      let matchesCat = false;
      if (selectedCategory === 'all') matchesCat = true;
      else if (selectedCategory === 'academic') matchesCat = isAcademic(p.category);
      else if (selectedCategory === 'boys_hostel') matchesCat = isBoysHostel(p.category);
      else if (selectedCategory === 'girls_hostel') matchesCat = isGirlsHostel(p.category);
      else if (selectedCategory === 'apartments') matchesCat = isApartment(p.category);
      else if (selectedCategory === 'food') matchesCat = isFood(p.category);
      else if (selectedCategory === 'medical') matchesCat = isMedical(p.category);
      else if (selectedCategory === 'sports') matchesCat = isSports(p.category);
      else if (selectedCategory === 'parks') matchesCat = isParks(p.category);
      else if (selectedCategory === 'venues') matchesCat = isVenues(p.category);
      else if (selectedCategory === 'admin') matchesCat = isAdmin(p.category);
      else if (selectedCategory === 'gates') matchesCat = isGates(p.category);

      return matchesSearch && matchesCat;
    });
  }, [searchTerm, selectedCategory]);

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

  const getBadgeStyle = (category: string) => {
    switch (category) {
      case 'academic_block':
        return 'bg-slate-900 text-white';
      case 'boys_hostel':
        return 'bg-blue-600 text-white';
      case 'girls_hostel':
        return 'bg-fuchsia-700 text-white';
      case 'boys_studio':
      case 'girls_studio':
        return 'bg-indigo-600 text-white';
      case 'apartments_staff':
        return 'bg-teal-700 text-white';
      case 'food_dining':
        return 'bg-amber-600 text-white';
      case 'medical':
        return 'bg-rose-600 text-white';
      case 'sports':
        return 'bg-emerald-600 text-white';
      case 'parks_gardens':
        return 'bg-green-700 text-white';
      case 'auditorium_arena':
        return 'bg-amber-700 text-white';
      case 'gate':
        return 'bg-emerald-800 text-white';
      default:
        return 'bg-slate-700 text-white';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Master Campus Directory &bull; Google Maps Ground Truth</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Verified LPU Campus Directory ({campusMasterInventory.length} Places)
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-3xl mt-1">
            Comprehensive directory of academic blocks, student hostels (BH-1 to BH-8, GH-1 to GH-6), boys & girls studios (BS-11 to BS-13, GS-1 to GS-4), staff apartments, Uni Hospital, sports arenas, food courts, and campus gates across Lovely Professional University.
          </p>
        </div>

        {/* Global Notice Badge */}
        <div className="flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs font-semibold shrink-0">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <span>All Blocks: Indoor Floor Mapping Awaited</span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col gap-2.5 sm:gap-3 bg-white p-2.5 sm:p-3 rounded-2xl shadow-xs border border-slate-200">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, block number, studio, hostel, hospital, park, food..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto pb-1 text-xs font-semibold scrollbar-thin">
          {categories.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCategory(c.id)}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl whitespace-nowrap transition-colors text-xs ${
                selectedCategory === c.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Places Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
        {filteredPlaces.map((place) => {
          const matchedBuilding = place.buildingId
            ? buildings.find((b) => b.id === place.buildingId)
            : undefined;
          const badgeClass = getBadgeStyle(place.category);
          const isGoogleVerified = place.verificationStatus === 'GOOGLE_MAPS_VERIFIED';
          const isMultiVerified = place.verificationStatus === 'MULTI_SOURCE_VERIFIED';
          const isApprox = place.verificationStatus === 'APPROXIMATE_LOCATION';

          return (
            <div
              key={place.id}
              className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group hover:border-emerald-300"
            >
              <div>
                {/* Top Tags */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-extrabold ${badgeClass} transition-colors`}
                  >
                    {place.subcategory || place.category.replace(/_/g, ' ')}
                  </span>
                  {isGoogleVerified ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>Google Verified</span>
                    </span>
                  ) : isMultiVerified ? (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-blue-800 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      <CheckCircle className="w-3 h-3 text-blue-600" />
                      <span>Multi-Source</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                      <AlertTriangle className="w-3 h-3 text-amber-600" />
                      <span>Approximate</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors mb-1 line-clamp-1">
                  {place.name}
                </h3>

                {/* Subcategory & Coordinates */}
                <div className="flex items-center space-x-2 text-[11px] text-slate-500 font-mono mb-2">
                  <span>{place.latitude.toFixed(5)}° N, {place.longitude.toFixed(5)}° E</span>
                  {matchedBuilding && (
                    <span className="font-sans font-semibold text-slate-700">&bull; {matchedBuilding.floors} Floors</span>
                  )}
                </div>

                {/* Notes / Description */}
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-3">
                  {place.notes}
                </p>

                {/* Formatted Address */}
                {place.formattedAddress && (
                  <div className="text-[11px] text-slate-500 line-clamp-1 mb-2">
                    <span className="font-semibold text-slate-700">Address:</span> {place.formattedAddress}
                  </div>
                )}

                {/* Google Maps External Button */}
                {place.googleMapsUrl && (
                  <div className="mb-4">
                    <a
                      href={place.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold transition-colors"
                    >
                      <MapPin className="w-3 h-3 text-blue-600" />
                      <span>View on Google Maps</span>
                      <ExternalLink className="w-2.5 h-2.5 text-blue-500" />
                    </a>
                  </div>
                )}
              </div>

              {/* Bottom Section */}
              <div className="pt-3 border-t border-slate-100 space-y-3">
                {/* Indoor Status Badge */}
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400 font-medium">Indoor Layout:</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
                    Floor Mapping Awaited
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => onSelectBuilding(placeToBuilding(place))}
                    className="px-2 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors text-center"
                    title="Inspect details and location specs"
                  >
                    Details
                  </button>
                  <button
                    onClick={() =>
                      onViewIndoorStatus(
                        matchedBuilding ? matchedBuilding.block_number : place.name
                      )
                    }
                    className="px-2 py-2 text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition-colors text-center"
                    title="View indoor readiness & missing data"
                  >
                    Indoor
                  </button>
                  <button
                    onClick={() => onNavigateToBuilding(placeToBuilding(place))}
                    className="px-2 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1"
                    title="Calculate outdoor route on map"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>Route</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredPlaces.length === 0 && (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="font-bold text-base text-slate-700">No campus locations match your filter</h3>
          <p className="text-xs text-slate-400 mt-1">Try resetting the search query or category filters.</p>
        </div>
      )}
    </div>
  );
};
