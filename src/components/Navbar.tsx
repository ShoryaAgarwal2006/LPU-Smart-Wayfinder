import React from 'react';
import {
  MapPin,
  Navigation,
  Building2,
  Layers,
  Info,
  Compass,
  ShieldCheck,
  Edit3,
  Lock,
  Search,
  Home,
} from 'lucide-react';
import { ActivePage, UserLocation } from '../types';
import { useCampusData } from '../context/CampusDataContext';
import { isAuthenticated, logoutAdmin } from '../services/adminApiService';

interface NavbarProps {
  activePage: ActivePage;
  setActivePage: (page: ActivePage) => void;
  userLocation: UserLocation | null;
  gpsActive: boolean;
  gpsLoading?: boolean;
  onRequestGps: () => void;
  onOpenSearch: () => void;
  onOpenAdminLogin?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activePage,
  setActivePage,
  userLocation,
  gpsActive,
  gpsLoading,
  onRequestGps,
  onOpenSearch,
  onOpenAdminLogin,
}) => {
  const campusData = useCampusData();
  const isEditMode = campusData?.isEditMode ?? false;
  const setIsEditMode = campusData?.setIsEditMode;

  const handleToggleEdit = () => {
    if (isEditMode) {
      setIsEditMode?.(false);
    } else {
      if (isAuthenticated()) {
        setIsEditMode?.(true);
        setActivePage('map');
      } else {
        onOpenAdminLogin?.();
      }
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16">
            {/* Logo & Branding */}
            <div
              className="flex items-center space-x-2 sm:space-x-3 cursor-pointer group shrink-0"
              onClick={() => setActivePage('home')}
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform shrink-0">
                <Compass className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center space-x-1.5 sm:space-x-2">
                  <span className="font-extrabold text-sm sm:text-lg text-slate-900 tracking-tight whitespace-nowrap">
                    LPU <span className="text-emerald-600">SMART</span> WAYFINDER
                  </span>
                  <span className="hidden lg:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-3 h-3 mr-1" /> Verified Data
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium tracking-normal hidden md:block">
                  From Campus Gate to Classroom
                </p>
              </div>
            </div>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              <button
                onClick={() => setActivePage('home')}
                className={`px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activePage === 'home'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setActivePage('map')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activePage === 'map'
                    ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Navigation className="w-4 h-4" />
                <span>Campus Map</span>
              </button>
              <button
                onClick={() => setActivePage('directory')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activePage === 'directory'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Directory</span>
              </button>
              <button
                onClick={() => setActivePage('indoor')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activePage === 'indoor'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Indoor Nav</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-100 text-amber-800 tracking-wider">
                  Awaited
                </span>
              </button>
              <button
                onClick={() => setActivePage('about')}
                className={`flex items-center space-x-1.5 px-3 py-1.5 lg:px-3.5 lg:py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${
                  activePage === 'about'
                    ? 'bg-slate-100 text-slate-900'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Info className="w-4 h-4" />
                <span>About</span>
              </button>
            </nav>

            {/* Quick Actions & GPS Status */}
            <div className="flex items-center space-x-1.5 sm:space-x-2">
              {/* Search Trigger */}
              <button
                onClick={onOpenSearch}
                className="flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 text-xs font-medium transition-colors"
                title="Search campus blocks (Ctrl+K)"
              >
                <Search className="w-3.5 h-3.5 text-slate-600" />
                <span className="hidden sm:inline">Search Campus...</span>
                <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-300 rounded text-slate-500 shadow-2xs">
                  ⌘K
                </kbd>
              </button>

              {/* GPS Button */}
              <button
                onClick={onRequestGps}
                className={`flex items-center space-x-1.5 p-2 sm:px-3 sm:py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  gpsActive
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : gpsLoading
                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
                title={
                  gpsActive
                    ? `GPS active (±${Math.round(userLocation?.accuracy || 0)}m)`
                    : gpsLoading
                    ? 'Acquiring GPS position...'
                    : 'Acquire browser GPS location'
                }
              >
                <MapPin
                  className={`w-3.5 h-3.5 ${
                    gpsActive
                      ? 'text-blue-600 animate-pulse'
                      : gpsLoading
                      ? 'text-amber-600 animate-spin'
                      : 'text-slate-500'
                  }`}
                />
                <span className="hidden sm:inline">
                  {gpsActive
                    ? `GPS Active (±${Math.round(userLocation?.accuracy || 0)}m)`
                    : gpsLoading
                    ? 'Acquiring...'
                    : 'Locate Me'}
                </span>
              </button>

              {/* Edit Campus Map Button */}
              <button
                onClick={handleToggleEdit}
                className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-[11px] sm:text-xs font-bold transition-all shadow-xs ${
                  isEditMode
                    ? 'bg-amber-500 hover:bg-amber-600 text-white border border-amber-600 shadow-amber-500/20 ring-2 ring-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700'
                }`}
                title={isEditMode ? 'Exit Map Editor' : 'Enter Campus Map Editor (Admin Password Protected)'}
              >
                <Edit3 className={`w-3.5 h-3.5 ${isEditMode ? 'text-white animate-spin' : 'text-white'}`} />
                <span className="font-extrabold tracking-wide">
                  {isEditMode ? 'EXIT' : 'EDIT MAP'}
                </span>
                {isEditMode && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping ml-0.5" />
                )}
              </button>

              {/* Lock Admin Session Button (visible in edit mode) */}
              {isEditMode && (
                <button
                  onClick={() => {
                    logoutAdmin();
                    setIsEditMode?.(false);
                  }}
                  className="flex items-center space-x-1 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-900 text-slate-200 border border-slate-700 transition-all shadow-xs"
                  title="Lock Editor & Log Out Admin"
                >
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span className="hidden sm:inline">Lock</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Modern Mobile Bottom Navigation Bar (Fixed for phones & small tablets) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 py-1.5 px-2 flex md:hidden items-center justify-around shadow-lg select-none">
        <button
          onClick={() => setActivePage('home')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activePage === 'home'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Home className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Home</span>
        </button>

        <button
          onClick={() => setActivePage('map')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activePage === 'map'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Navigation className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Map</span>
        </button>

        <button
          onClick={() => setActivePage('directory')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activePage === 'directory'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">Directory</span>
        </button>

        <button
          onClick={() => setActivePage('indoor')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all relative ${
            activePage === 'indoor'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <div className="relative">
            <Layers className="w-4 h-4 mb-0.5" />
            <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-500" />
          </div>
          <span className="text-[10px]">Indoor</span>
        </button>

        <button
          onClick={() => setActivePage('about')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
            activePage === 'about'
              ? 'text-emerald-700 font-bold bg-emerald-50/80 scale-105'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <Info className="w-4 h-4 mb-0.5" />
          <span className="text-[10px]">About</span>
        </button>
      </nav>
    </>
  );
};
