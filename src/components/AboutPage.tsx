import React from 'react';
import { Compass, ShieldCheck, Database, Layers, ExternalLink, MapPin, Building2, Footprints } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 space-y-6 sm:space-y-10">
      {/* Title & Badge */}
      <div className="text-center space-y-2 sm:space-y-3">
        <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Academic Project & Research Report</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          About LPU Smart Wayfinder
        </h1>
        <p className="text-xs sm:text-base text-slate-600 max-w-2xl mx-auto font-normal">
          A high-accuracy outdoor and indoor navigation system engineered specifically for Lovely Professional University, Phagwara, Punjab, India.
        </p>
      </div>

      {/* Core Principles Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-2 sm:space-y-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <Footprints className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">Outdoor Navigation (Live)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            Built upon verified OpenStreetMap spatial surveys. Uses an authentic network of 133 pedestrian footways, service corridors, and perimeter access gates. Routing is computed via graph-based A* algorithms without drawing imaginary straight lines over buildings.
          </p>
        </div>

        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200 shadow-sm space-y-2 sm:space-y-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
          <h3 className="text-base sm:text-lg font-black text-slate-900">Indoor Navigation (Awaited)</h3>
          <p className="text-xs text-slate-600 leading-relaxed">
            In strict compliance with academic integrity protocols, zero synthetic room layouts or fictional classroom paths are invented. All 43 audited buildings are explicitly designated as awaiting official CAD vector clearance from the LPU Division of Campus Development.
          </p>
        </div>
      </div>

      {/* Project Statistics */}
      <div className="bg-slate-900 text-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 border border-slate-800 shadow-xl space-y-4 sm:space-y-6">
        <h3 className="text-base font-extrabold uppercase tracking-wider text-emerald-400">
          Campus Geospatial Audit Metrics
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
          <div>
            <div className="text-3xl sm:text-4xl font-black text-white">600+</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Campus Acres Mapped</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-emerald-400">136</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Building Footprints</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-blue-400">133</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Walkway Segments</div>
          </div>
          <div>
            <div className="text-3xl sm:text-4xl font-black text-amber-400">43</div>
            <div className="text-xs text-slate-400 font-medium mt-1">Audited Blocks & Hostels</div>
          </div>
        </div>
      </div>

      {/* Primary Data Provenance */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-lg font-black text-slate-900">Authoritative Data Provenance</h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Every spatial coordinate and semantic attribute in this project originates from verifiable public and institutional records:
        </p>

        <div className="divide-y divide-slate-100 text-xs">
          <div className="py-3 flex items-start justify-between">
            <div>
              <span className="font-bold text-slate-900 block">OpenStreetMap Relation 21599790</span>
              <span className="text-slate-500 text-[11px]">
                Defines the legal multipolygon boundary of Lovely Professional University on GT Road.
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Verified
            </span>
          </div>

          <div className="py-3 flex items-start justify-between">
            <div>
              <span className="font-bold text-slate-900 block">LPU Official Portal (`lpu.in`) & UMS (`ums.lpu.in`)</span>
              <span className="text-slate-500 text-[11px]">
                Institutional directories, school names, room numbering syntax `[Block]-[Floor][Room]`.
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Verified
            </span>
          </div>

          <div className="py-3 flex items-start justify-between">
            <div>
              <span className="font-bold text-slate-900 block">LPU Entry, Exit and Parking Guidelines</span>
              <span className="text-slate-500 text-[11px]">
                Verified coordinates and functions for Gate 1 (Main), Gate 2, Gate 3, Gate 4, and Law Gate.
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Verified
            </span>
          </div>

          <div className="py-3 flex items-start justify-between">
            <div>
              <span className="font-bold text-slate-900 block">University Grants Commission Act</span>
              <span className="text-slate-500 text-[11px]">
                Punjab Act No. 25 of 2005 legal address and territorial limits.
              </span>
            </div>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Verified
            </span>
          </div>
        </div>
      </div>

      {/* Research Documentation Files */}
      <div className="p-6 bg-slate-50 rounded-3xl border border-slate-200 space-y-3">
        <h4 className="font-bold text-slate-900 text-sm">Associated Research Deliverables</h4>
        <p className="text-xs text-slate-500 leading-relaxed">
          The underlying data structures, methodology, and missing data audits are permanently recorded in the project repository:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2">
            <span className="font-mono font-bold text-emerald-700">source_references.md</span>
            <span className="text-[11px] text-slate-500">— Complete provenance citations</span>
          </div>
          <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center space-x-2">
            <span className="font-mono font-bold text-amber-700">missing_data_report.md</span>
            <span className="text-[11px] text-slate-500">— Floor-by-floor blueprint audit</span>
          </div>
        </div>
      </div>
    </div>
  );
};
