import React, { useState, useMemo } from 'react';
import {
  X,
  History,
  CalendarClock,
  MapPin,
  Clock,
  Search,
  Sparkles,
  RefreshCw,
  RotateCcw,
  CheckCircle,
  Archive,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useCampusData } from '../context/CampusDataContext';
import { EventLocation } from '../types/adminEditor';

interface EventHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEditAndReactivate?: (event: EventLocation) => void;
}

export const EventHistoryModal: React.FC<EventHistoryModalProps> = ({
  isOpen,
  onClose,
  onEditAndReactivate,
}) => {
  const { eventHistory, restoreEventRecord, refreshEvents } = useCampusData();

  const [searchQuery, setSearchQuery] = useState('');
  const [restoringId, setRestoringId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredHistory = (eventHistory || []).filter((evt) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      evt.eventName.toLowerCase().includes(q) ||
      evt.locationName.toLowerCase().includes(q) ||
      (evt.description || '').toLowerCase().includes(q)
    );
  });

  const handleQuickReactivate = async (evt: EventLocation) => {
    const hoursStr = window.prompt(
      `Re-activate "${evt.eventName}" on the campus map?\nHow many hours from right now should it be visible?`,
      '24'
    );
    if (!hoursStr) return;

    const hours = parseFloat(hoursStr);
    if (isNaN(hours) || hours <= 0) {
      alert('Please enter a valid positive number of hours.');
      return;
    }

    setRestoringId(evt.id);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const newEndTime = new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
      await restoreEventRecord(evt.id, newEndTime);
      setSuccessMsg(`"${evt.eventName}" re-activated on campus map for ${hours} hours!`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to re-activate event.');
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300">
                <CalendarClock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-black tracking-tight">Campus Event History</h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
                    Admin Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium">
                  Past, completed, and automatically expired temporary event locations
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Search bar inside header */}
          <div className="mt-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by event name (e.g. Youth Vibe, One World), venue, or notes..."
              className="w-full bg-slate-800/80 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-400 rounded-xl pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Feedback alerts */}
        {errorMsg && (
          <div className="mx-5 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mx-5 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content list */}
        <div className="p-5 overflow-y-auto space-y-3 flex-1">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-slate-400 space-y-2">
              <Archive className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No expired event locations recorded in history.</p>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                When temporary event locations reach their scheduled end time, they are automatically removed from the public campus map and stored here permanently.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-500 pb-1 border-b border-slate-100">
                <span>Archived Records ({filteredHistory.length})</span>
                <button
                  type="button"
                  onClick={() => refreshEvents()}
                  className="flex items-center space-x-1 text-purple-700 hover:underline"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              </div>

              {filteredHistory.map((evt) => {
                const startDate = new Date(evt.startTime);
                const endDate = new Date(evt.endTime);
                const isAutoExpired = endDate < new Date();

                return (
                  <div
                    key={evt.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-300 transition-all shadow-xs space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center space-x-2">
                        <span className="font-extrabold text-sm text-slate-900">{evt.eventName}</span>
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 flex items-center space-x-1">
                          <Archive className="w-3 h-3 text-slate-500" />
                          <span>{isAutoExpired ? 'EXPIRED' : 'ARCHIVED'}</span>
                        </span>
                      </div>

                      <div className="flex items-center space-x-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => handleQuickReactivate(evt)}
                          disabled={restoringId === evt.id}
                          className="px-2.5 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1 border border-purple-200"
                          title="Re-activate and restore this event to the active map"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>Re-activate</span>
                        </button>
                        {onEditAndReactivate && (
                          <button
                            type="button"
                            onClick={() => {
                              onEditAndReactivate(evt);
                              onClose();
                            }}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                            title="Edit details and schedule as new"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                      <div className="flex items-center space-x-1.5">
                        <MapPin className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="font-medium">Venue: {evt.locationName}</span>
                      </div>
                      <div className="flex items-center space-x-1.5 font-mono text-[11px] text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>
                          {startDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{' '}
                          ➔{' '}
                          {endDate.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {evt.description && (
                      <p className="text-xs text-slate-500 bg-slate-50 p-2 rounded-xl italic">
                        "{evt.description}"
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100 font-mono">
                      <span>Coords: {evt.latitude.toFixed(5)}, {evt.longitude.toFixed(5)}</span>
                      <span>ID: {evt.id}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Records are stored in SQLite <code className="text-purple-700 font-mono">event_locations</code>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Close History
          </button>
        </div>
      </div>
    </div>
  );
};
