import React from 'react';
import {
  Compass,
  Navigation,
  Building2,
  Layers,
  MapPin,
  ShieldCheck,
  Search,
  ArrowRight,
  Footprints,
  Clock,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';
import { buildings as staticBuildings, campusGates as staticGates, campusMasterInventory as staticInventory } from '../data/campusData';
import { Building, CampusGate } from '../types';
import { useCampusData } from '../context/CampusDataContext';

interface HomePageProps {
  onOpenMap: () => void;
  onOpenDirectory: () => void;
  onOpenIndoor: () => void;
  onOpenSearch: () => void;
  onSelectRoutePreset: (start: { name: string; lat: number; lon: number }, end: { name: string; lat: number; lon: number; blockNumber?: string }) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  onOpenMap,
  onOpenDirectory,
  onOpenIndoor,
  onOpenSearch,
  onSelectRoutePreset,
}) => {
  const campusData = useCampusData();
  const campusMasterInventory =
    campusData?.campusMasterInventory && campusData.campusMasterInventory.length > 0
      ? campusData.campusMasterInventory
      : staticInventory;

  const findPlace = (id: string, keyword: string, fallback: { name: string; lat: number; lon: number }) => {
    const match = campusMasterInventory.find(
      (p) => p.id === id || p.name.toLowerCase().includes(keyword.toLowerCase())
    );
    if (match) {
      return { name: match.name, lat: match.latitude, lon: match.longitude };
    }
    return fallback;
  };

  const gate1 = findPlace('LOC_1795172119524', 'Main Gate', {
    name: 'Gate 1 (Main Entrance)',
    lat: 31.259520,
    lon: 75.706476,
  });
  const block34 = findPlace('BLOCK_34', 'Block 34', {
    name: 'Block 34',
    lat: 31.257050,
    lon: 75.705700,
  });
  const lawGate = findPlace('LOC_1795172576094', 'Law Gate', {
    name: 'Law Gate / Maheru Gate',
    lat: 31.254933,
    lon: 75.700155,
  });
  const unimall = findPlace('FOOD_UNI_MALL', 'Uni-Mall', {
    name: 'Uni-Mall',
    lat: 31.255716,
    lon: 75.704998,
  });
  const bh1 = findPlace('LOC_1795172885452', 'BH-1', {
    name: 'BH-1',
    lat: 31.251470,
    lon: 75.702507,
  });
  const library = findPlace('BLOCK_37', 'Library', {
    name: 'Central Library',
    lat: 31.257500,
    lon: 75.706800,
  });
  const unipolis = findPlace('AUDI_UNIPOLIS', 'UniPolis', {
    name: 'Baldev Raj Mittal Unipolis',
    lat: 31.254000,
    lon: 75.704000,
  });

  const routePresets = [
    {
      title: `${gate1.name.split('(')[0].trim()} to ${block34.name}`,
      start: gate1,
      dest: { ...block34, blockNumber: '34' },
      tag: 'Academic',
    },
    {
      title: `${lawGate.name.split('/')[0].trim()} to ${unimall.name}`,
      start: lawGate,
      dest: { ...unimall, blockNumber: '15' },
      tag: 'Shopping & Food',
    },
    {
      title: `${bh1.name} to ${library.name}`,
      start: bh1,
      dest: { ...library, blockNumber: '37' },
      tag: 'Library & Study',
    },
    {
      title: `${gate1.name.split('(')[0].trim()} to ${unipolis.name}`,
      start: gate1,
      dest: { ...unipolis, blockNumber: 'Unipolis' },
      tag: 'Convocations & Events',
    },
  ];

  return (
    <div className="space-y-8 sm:space-y-16 pb-16">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-slate-900 to-slate-800 text-white pt-10 sm:pt-16 pb-12 sm:pb-20 px-3 sm:px-6 lg:px-8">
        {/* Subtle geometric grid background */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(#10b981 1px, transparent 1px), radial-gradient(#38bdf8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            backgroundPosition: '0 0, 20px 20px',
          }}
        ></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4 sm:space-y-6">
          <div className="inline-flex items-center space-x-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full text-[11px] sm:text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Fabrication Geographical System</span>
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight text-white leading-tight">
            LPU SMART <span className="text-emerald-400">WAYFINDER</span>
          </h1>

          <p className="text-base sm:text-xl font-medium text-slate-300 max-w-2xl mx-auto">
            From Campus Gate to Classroom.
          </p>

          <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto font-normal leading-relaxed">
            The authentic outdoor navigation platform for Lovely Professional University, mapped across 600+ acres with 133 verified pedestrian paths and 136 real building footprints.
          </p>

          {/* Quick Search Launcher */}
          <div className="pt-2 max-w-lg mx-auto">
            <div
              onClick={onOpenSearch}
              className="flex items-center justify-between w-full bg-white text-slate-500 hover:text-slate-900 p-2.5 sm:p-3.5 rounded-2xl shadow-xl cursor-pointer hover:ring-4 hover:ring-emerald-400/20 transition-all group"
            >
              <div className="flex items-center space-x-2.5 sm:space-x-3 text-xs sm:text-sm min-w-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 group-hover:scale-110 transition-transform shrink-0" />
                <span className="font-semibold text-slate-700 truncate">Search Block, Library, Hostels...</span>
              </div>
              <span className="text-[10px] sm:text-[11px] font-mono font-bold bg-slate-100 text-slate-500 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-md border border-slate-200 shrink-0">
                ⌘K
              </span>
            </div>
          </div>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 sm:gap-3 pt-2 sm:pt-4">
            <button
              onClick={onOpenMap}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <Navigation className="w-4 h-4" />
              <span>Launch Outdoor Map</span>
            </button>
            <button
              onClick={onOpenDirectory}
              className="w-full sm:w-auto px-5 sm:px-6 py-3 sm:py-3.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center justify-center space-x-2 transition-all"
            >
              <Building2 className="w-4 h-4" />
              <span>Browse 43 Campus Blocks</span>
            </button>
          </div>
        </div>
      </section>

      {/* Popular Campus Routes */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              Popular Campus Routes
            </h2>
            <p className="text-[11px] sm:text-sm text-slate-500">
              One-click verified walking directions between prominent gates and blocks
            </p>
          </div>
          <button
            onClick={onOpenMap}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center space-x-1 shrink-0"
          >
            <span>Open Map</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {routePresets.map((route, idx) => (
            <div
              key={idx}
              onClick={() => onSelectRoutePreset(route.start, route.dest)}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <span className="inline-block text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
                  {route.tag}
                </span>
                <h3 className="font-extrabold text-sm text-slate-900 group-hover:text-emerald-700 transition-colors leading-snug">
                  {route.title}
                </h3>
              </div>
              <div className="pt-4 flex items-center justify-between text-xs font-semibold text-slate-400 group-hover:text-emerald-600 transition-colors">
                <span>View Walkway Route</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Indoor Mapping Awaited Showcase */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 rounded-2xl sm:rounded-3xl border border-amber-200 p-5 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-5 sm:gap-8">
          <div className="space-y-2.5 sm:space-y-3 max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-[11px] sm:text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
              <span>Strict Academic Integrity Notice</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Indoor Floor Mapping Awaited
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              Unlike speculative apps that invent imaginary classroom corridors, LPU Smart Wayfinder marks all 43 buildings as awaiting official university architectural clearance. Our multi-level routing architecture is fully designed and ready to instantly activate vector CAD blueprints.
            </p>
          </div>

          <button
            onClick={onOpenIndoor}
            className="w-full sm:w-auto px-6 py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-bold text-xs shadow-md shrink-0 flex items-center justify-center space-x-2 transition-all hover:scale-105"
          >
            <Layers className="w-4 h-4 text-amber-400" />
            <span>Inspect Indoor Architecture &rarr;</span>
          </button>
        </div>
      </section>

      {/* Core Technology Highlights */}
      <section className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 space-y-6">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">
            Engineered for Precision & Transparency
          </h2>
          <p className="text-xs text-slate-500">
            Four foundational pillars powering the campus navigation system
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <Footprints className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">True Walkway Network</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Routes strictly follow 133 mapped pedestrian paths. No impossible straight lines across buildings.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
              <MapPin className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Live Browser GPS</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Detects outdoor campus position with accuracy radius, alongside manual campus gate fallbacks.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Layers className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Modular Indoor Spec</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Prepared for seamless vector floor map integration with standard room syntax <code>[Block]-[Floor][Room]</code>.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h3 className="font-extrabold text-sm text-slate-900">Zero Synthetic Data</h3>
            <p className="text-xs text-slate-500 leading-normal">
              Every building, gate, and pathway is backed by OpenStreetMap and university records.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
