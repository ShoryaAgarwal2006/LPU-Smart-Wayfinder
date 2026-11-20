import React from 'react';
import {
  MousePointer,
  Move,
  PlusCircle,
  DoorOpen,
  Sliders,
  Undo2,
  Redo2,
  History,
  Check,
  AlertCircle,
  X,
  ShieldCheck,
  Building,
  Lock,
  Sparkles,
  CalendarClock,
} from 'lucide-react';
import { useCampusData } from '../context/CampusDataContext';
import { EditorTool } from '../types/adminEditor';
import { logoutAdmin } from '../services/adminApiService';

interface AdminMapToolbarProps {
  onOpenGateModal: () => void;
  onOpenHistoryModal: () => void;
  onOpenAddLocation: () => void;
  onOpenAddEventLocation: () => void;
  onOpenEventHistoryModal: () => void;
}

export const AdminMapToolbar: React.FC<AdminMapToolbarProps> = ({
  onOpenGateModal,
  onOpenHistoryModal,
  onOpenAddLocation,
  onOpenAddEventLocation,
  onOpenEventHistoryModal,
}) => {
  const {
    isEditMode,
    setIsEditMode,
    currentTool,
    setCurrentTool,
    undoAction,
    redoAction,
    saveStatus,
    selectedLocation,
  } = useCampusData();

  if (!isEditMode) return null;

  const tools: { id: EditorTool; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      id: 'select',
      label: 'Select & Edit',
      icon: <MousePointer className="w-4 h-4" />,
      desc: 'Click any building marker or footprint to edit details, name, or category',
    },
    {
      id: 'move',
      label: 'Drag & Move',
      icon: <Move className="w-4 h-4" />,
      desc: 'Drag any marker directly across the map to correct its geographical position',
    },
    {
      id: 'add_location',
      label: '+ Add Location',
      icon: <PlusCircle className="w-4 h-4" />,
      desc: 'Click anywhere on the map to add a new building, park, or facility',
    },
    {
      id: 'add_entrance',
      label: '+ Add Entrance',
      icon: <DoorOpen className="w-4 h-4" />,
      desc: 'Click on the map to place an entrance point for the selected building',
    },
  ];

  return (
    <div className="absolute top-3 left-1/2 -translate-x-1/2 z-30 max-w-4xl w-[calc(100%-1.5rem)] px-2 pointer-events-auto animate-in slide-in-from-top duration-200">
      <div className="bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700/80 p-2 sm:p-2.5 flex flex-wrap items-center justify-between gap-2">
        {/* Left Status & Admin Badge */}
        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">ADMIN EDITING ACTIVE</span>
            <span className="sm:hidden">EDIT MODE</span>
          </div>

          {/* SQLite DB Status */}
          <div className="hidden md:flex items-center space-x-1 text-[11px] text-slate-300 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700">
            {saveStatus === 'saving' && (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>Saving to SQLite...</span>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-300">Database Synced</span>
              </>
            )}
            {saveStatus === 'idle' && (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>SQLite Connected</span>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span className="text-red-300">Sync Error</span>
              </>
            )}
          </div>
        </div>

        {/* Center Tools */}
        <div className="flex items-center space-x-1 bg-slate-800/80 p-1 rounded-xl border border-slate-700 overflow-x-auto max-w-full scrollbar-none">
          {tools.map((t) => (
            <button
              key={t.id}
              onClick={() => {
                if (t.id === 'add_location') {
                  onOpenAddLocation();
                } else {
                  setCurrentTool(t.id);
                }
              }}
              className={`px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 sm:space-x-1.5 shrink-0 ${
                currentTool === t.id
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={t.desc}
            >
              {t.icon}
              <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}

          <button
            onClick={onOpenGateModal}
            className="px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-700 transition-all flex items-center space-x-1 sm:space-x-1.5 shrink-0"
            title="Manage Campus Gates and Highway Entrances"
          >
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Gates</span>
          </button>

          {/* Add Event Location (Admin Only) */}
          <button
            onClick={onOpenAddEventLocation}
            className="px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-xs transition-all flex items-center space-x-1 sm:space-x-1.5 cursor-pointer shrink-0"
            title="Add or Modify Temporary Campus Event Location with Date & Time"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">Add Event Location</span>
            <span className="sm:hidden">+ Event</span>
          </button>

          {/* Event History (Admin Only) */}
          <button
            onClick={onOpenEventHistoryModal}
            className="px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-bold text-purple-300 hover:text-white hover:bg-slate-700 transition-all flex items-center space-x-1 sm:space-x-1.5 border border-purple-500/30 cursor-pointer shrink-0"
            title="View Past, Expired and Archived Event Locations"
          >
            <CalendarClock className="w-3.5 h-3.5 text-purple-400" />
            <span className="hidden sm:inline">History</span>
          </button>
        </div>

        {/* Right Undo / Redo & Exit */}
        <div className="flex items-center space-x-1.5">
          <button
            onClick={() => undoAction()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Undo last change"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={() => redoAction()}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            title="Redo last change"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={onOpenHistoryModal}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center space-x-1"
            title="View Audit Change History"
          >
            <History className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsEditMode(false)}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-700 hover:bg-slate-600 text-white transition-colors flex items-center space-x-1"
            title="Exit Map Editor (Return to Visitor Mode)"
          >
            <X className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <button
            onClick={() => {
              logoutAdmin();
              setIsEditMode(false);
            }}
            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-red-600/90 hover:bg-red-600 text-white transition-colors flex items-center space-x-1"
            title="Lock Editor &amp; Log Out Admin"
          >
            <Lock className="w-3.5 h-3.5 text-white" />
            <span className="hidden sm:inline">Lock</span>
          </button>
        </div>
      </div>

      {/* Selected Location Guidance Prompt */}
      {currentTool === 'add_location' && (
        <div className="mt-2 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-200 px-4 py-2 rounded-xl text-xs flex flex-wrap items-center justify-between gap-2 shadow-lg animate-in fade-in duration-150">
          <div className="flex items-center space-x-2">
            <PlusCircle className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
            <span>
              Click anywhere on your visible map to place the new landmark, or enter details at screen center:
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenAddLocation}
              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition-colors shadow-2xs cursor-pointer"
            >
              Open Form at View Center
            </button>
            <button
              onClick={() => setCurrentTool('select')}
              className="text-[11px] font-bold text-slate-300 hover:text-white underline ml-1 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {currentTool === 'add_entrance' && (
        <div className="mt-2 bg-emerald-950/90 backdrop-blur-md border border-emerald-500/50 text-emerald-200 px-4 py-2 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <DoorOpen className="w-4 h-4 text-emerald-400 shrink-0 animate-bounce" />
            <span>
              {selectedLocation
                ? `Click anywhere on the map to place an entrance point for "${selectedLocation.name}"`
                : 'Please click a building first, then click on the map to add its entrance.'}
            </span>
          </div>
          <button
            onClick={() => setCurrentTool('select')}
            className="text-[11px] font-bold text-emerald-400 hover:underline ml-2"
          >
            Cancel
          </button>
        </div>
      )}

      {currentTool === 'move' && (
        <div className="mt-2 bg-blue-950/90 backdrop-blur-md border border-blue-500/50 text-blue-200 px-4 py-2 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center space-x-2">
            <Move className="w-4 h-4 text-blue-400 shrink-0" />
            <span>Drag any marker on the map to reposition it. Changes update coordinates in real time.</span>
          </div>
          <button
            onClick={() => setCurrentTool('select')}
            className="text-[11px] font-bold text-blue-400 hover:underline ml-2"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
};
