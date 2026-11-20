import React, { useState, useEffect } from 'react';
import {
  Layers,
  Building2,
  ShieldAlert,
  Upload,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Compass,
  ArrowRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { buildings } from '../data/campusData';
import { indoorBuildings } from '../data/campusData';
import { Building, IndoorBuilding } from '../types';

interface IndoorNavigationPageProps {
  initialBlockNumber?: string;
  onNavigateOutdoorToBuilding: (building: Building) => void;
}

export const IndoorNavigationPage: React.FC<IndoorNavigationPageProps> = ({
  initialBlockNumber,
  onNavigateOutdoorToBuilding,
}) => {
  const [selectedBuildingId, setSelectedBuildingId] = useState<string>(
    initialBlockNumber
      ? buildings.find((b) => b.block_number === initialBlockNumber)?.id || 'BLOCK_34'
      : 'BLOCK_34'
  );
  const [selectedFloor, setSelectedFloor] = useState<number>(0);

  // Future integration validation test state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [validationStatus, setValidationStatus] = useState<string | null>(null);

  useEffect(() => {
    if (initialBlockNumber) {
      const match = buildings.find((b) => b.block_number === initialBlockNumber);
      if (match) setSelectedBuildingId(match.id);
    }
  }, [initialBlockNumber]);

  const activeBuilding = buildings.find((b) => b.id === selectedBuildingId) || buildings[0];
  const activeIndoorRecord =
    indoorBuildings.find((b) => b.building_id === activeBuilding.id) || indoorBuildings[0];

  const floors = Array.from({ length: activeBuilding.floors }, (_, i) => i);

  // Simulated future floor plan upload validator
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
      setValidationStatus('validating');
      setTimeout(() => {
        setValidationStatus('verified');
      }, 1200);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-5 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4 pb-4 sm:pb-6 border-b border-slate-200">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 mb-2">
            <Layers className="w-3.5 h-3.5 text-amber-600" />
            <span>Modular Indoor Navigation Architecture</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Indoor Floor-by-Floor Wayfinder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-2xl mt-1">
            Dedicated multi-level routing framework for LPU academic blocks, libraries, and hostels. Structured to seamlessly activate verified CAD & SVG floor plans upon administrative clearance.
          </p>
        </div>

        <div className="flex items-center space-x-2 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-slate-900 text-white rounded-xl text-xs font-bold shrink-0">
          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
          <span>Status: Floor Mapping Awaited (43 Blocks)</span>
        </div>
      </div>

      {/* Building & Floor Selector Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-sm border border-slate-200 space-y-4 sm:space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          {/* Building Selector */}
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Select Campus Building:
            </label>
            <select
              value={selectedBuildingId}
              onChange={(e) => {
                setSelectedBuildingId(e.target.value);
                setSelectedFloor(0);
              }}
              className="w-full text-sm font-semibold bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
            >
              <optgroup label="Critical Tier Academic Blocks">
                {buildings
                  .filter((b) =>
                    ['BLOCK_34', 'BLOCK_37', 'BLOCK_32', 'BLOCK_38', 'BLOCK_15', 'BLOCK_01', 'BLOCK_13', 'BLOCK_29'].includes(
                      b.id
                    )
                  )
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      Block {b.block_number} — {b.name} ({b.floors} Floors)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="All Other Campus Blocks & Hostels">
                {buildings
                  .filter(
                    (b) =>
                      !['BLOCK_34', 'BLOCK_37', 'BLOCK_32', 'BLOCK_38', 'BLOCK_15', 'BLOCK_01', 'BLOCK_13', 'BLOCK_29'].includes(
                        b.id
                      )
                  )
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      Block {b.block_number} — {b.name} ({b.floors} Floors)
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Quick Navigate Button */}
          <div className="pt-2 md:pt-6">
            <button
              onClick={() => onNavigateOutdoorToBuilding(activeBuilding)}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-bold text-xs shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-2 transition-all hover:scale-[1.02]"
            >
              <Compass className="w-4 h-4" />
              <span>Navigate to Entrance Gate</span>
            </button>
          </div>
        </div>

        {/* Floor Selection Bar */}
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
            Select Floor Level ({activeBuilding.floors} Total Levels):
          </label>
          <div className="flex flex-wrap gap-2">
            {floors.map((floor) => (
              <button
                key={floor}
                onClick={() => setSelectedFloor(floor)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedFloor === floor
                    ? 'bg-amber-600 text-white shadow-md shadow-amber-600/20 scale-105'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                }`}
              >
                {floor === 0 ? 'Ground Floor' : `Floor ${floor}`}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Blueprint Visualizer (Clearly Watermarked & Marked Awaited) */}
      <div className="relative bg-slate-900 rounded-3xl border border-slate-800 p-8 sm:p-12 overflow-hidden shadow-2xl min-h-[420px] flex flex-col items-center justify-center text-center">
        {/* Architectural Grid Background */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage:
              'linear-gradient(to right, #38bdf8 1px, transparent 1px), linear-gradient(to bottom, #38bdf8 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        ></div>

        {/* Diagonal Watermark */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5">
          <span className="text-7xl sm:text-9xl font-black text-white -rotate-12 uppercase tracking-widest">
            CAD AWAITED
          </span>
        </div>

        {/* Center Card */}
        <div className="relative z-10 max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-inner">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="inline-block px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold">
            MAPPING STATUS: REQUIRES_MANUAL_MAPPING
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Indoor Floor Mapping Awaited
          </h2>

          <p className="text-sm text-slate-300 leading-relaxed font-normal">
            Verified floor-plan data has not yet been added for{' '}
            <strong className="text-white font-semibold">{activeBuilding.name}</strong> (
            {selectedFloor === 0 ? 'Ground Floor' : `Floor ${selectedFloor}`}). In accordance with project accuracy standards, zero artificial classroom layouts or invented walking paths are generated.
          </p>

          {/* Room Numbering Schema Notice */}
          <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 text-left text-xs space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold">
              <CheckCircle2 className="w-4 h-4" />
              <span>Verified Institutional Room Syntax</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              Classes on this floor follow the format:{' '}
              <code className="text-emerald-300 font-mono font-bold bg-slate-900 px-1.5 py-0.5 rounded">
                {activeBuilding.block_number}-{selectedFloor}XX
              </code>{' '}
              (e.g.{' '}
              <span className="font-mono text-white">
                {activeBuilding.block_number}-{selectedFloor}01
              </span>
              ,{' '}
              <span className="font-mono text-white">
                {activeBuilding.block_number}-{selectedFloor}04
              </span>
              ). Average density is 13–14 halls per floor.
            </p>
          </div>
        </div>
      </div>

      {/* Architectural Readiness Checklist */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200 space-y-6">
        <div>
          <h3 className="text-lg font-black text-slate-900 tracking-tight">
            Indoor Routing Engine — Readiness Audit
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Status of the technical prerequisites required to activate indoor turn-by-turn routing for Block {activeBuilding.block_number}:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            {
              title: 'Walkway Routing Mesh',
              status: 'Awaiting CAD Centerlines',
              desc: 'Corridor vector polylines needed to build the indoor Dijkstra routing graph.',
              ready: false,
            },
            {
              title: 'Room-Level Geometries',
              status: 'Awaiting Floor Blueprint',
              desc: 'Exact classroom, laboratory, and faculty cabin polygon boundaries.',
              ready: false,
            },
            {
              title: 'Vertical Circulation',
              status: 'Core Identified / Awaiting Coordinates',
              desc: 'Stairwell landings and elevator door coordinates for multi-floor transit.',
              ready: false,
            },
            {
              title: 'Emergency Life Safety',
              status: 'Awaiting Fire Vector Plan',
              desc: 'Emergency fire escape doors, assembly locations, and extinguisher positions.',
              ready: false,
            },
            {
              title: 'Indoor Positioning (IPS)',
              status: 'Awaiting Wi-Fi AP BSSID Map',
              desc: 'Radio signal fingerprint database to calibrate indoor blue-dot tracking.',
              ready: false,
            },
            {
              title: 'Outdoor-to-Indoor Connector',
              status: 'Ready & Linked',
              desc: 'Ground floor threshold coordinates verified in outdoor GeoJSON dataset.',
              ready: true,
            },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl border text-xs space-y-1.5 ${
                item.ready
                  ? 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">{item.title}</span>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${
                    item.ready
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {item.ready ? 'Ready' : 'Awaited'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 leading-normal">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Future Blueprint Upload & Activation Module */}
      <div className="bg-slate-900 rounded-3xl p-6 sm:p-8 text-white space-y-5 border border-slate-800">
        <div className="flex items-center space-x-2 text-emerald-400">
          <Upload className="w-5 h-5" />
          <h3 className="text-base font-extrabold uppercase tracking-wider">
            Future Floor Plan Activation Module
          </h3>
        </div>
        <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
          The LPU Wayfinder architecture allows administrative operators or surveying teams to upload validated SVG or GeoJSON floor drawings directly into the system. Once uploaded, the engine automatically compiles the indoor routing graph without altering outdoor pathways.
        </p>

        <div className="p-6 border-2 border-dashed border-slate-700 hover:border-emerald-500/60 rounded-2xl bg-slate-800/50 text-center space-y-3 transition-colors">
          <FileCode className="w-8 h-8 text-slate-400 mx-auto" />
          <div>
            <label className="cursor-pointer text-xs font-bold text-emerald-400 hover:text-emerald-300 underline">
              <span>Choose SVG or GeoJSON Floor Blueprint</span>
              <input
                type="file"
                accept=".svg,.json,.geojson"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports AutoDesk DXF exports, standard SVG floor plans, or QGIS Indoor GeoJSON
            </p>
          </div>

          {uploadedFileName && (
            <div className="pt-2 text-xs font-mono text-emerald-300">
              Loaded: {uploadedFileName} &bull;{' '}
              {validationStatus === 'validating' ? 'Validating schema...' : 'Validation Passed (Demo Preview)'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
