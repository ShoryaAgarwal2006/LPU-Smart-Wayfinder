import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  MapPin,
  Calendar,
  Clock,
  Crosshair,
  AlertCircle,
  Check,
  Edit2,
  Trash2,
  Layers,
  Info,
} from 'lucide-react';
import { useCampusData } from '../context/CampusDataContext';
import { EventLocation } from '../types/adminEditor';

interface AddEventLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPickOnMap?: () => void;
  initialCoordinates?: { lat: number; lon: number };
  editingEvent?: EventLocation | null;
  onClearEditingEvent?: () => void;
}

export const AddEventLocationModal: React.FC<AddEventLocationModalProps> = ({
  isOpen,
  onClose,
  onPickOnMap,
  initialCoordinates,
  editingEvent = null,
  onClearEditingEvent,
}) => {
  const {
    saveEventRecord,
    deleteEventRecord,
    activeEvents,
    allEvents,
    saveStatus,
  } = useCampusData();

  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Fields
  const [eventName, setEventName] = useState('');
  const [locationName, setLocationName] = useState('');
  const [latitude, setLatitude] = useState<number>(31.254);
  const [longitude, setLongitude] = useState<number>(75.704);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [description, setDescription] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Helper to format Date into datetime-local string (YYYY-MM-DDTHH:mm)
  const toDateTimeLocal = (date: Date) => {
    const pad = (n: number) => (n < 10 ? '0' + n : n);
    const yyyy = date.getFullYear();
    const mm = pad(date.getMonth() + 1);
    const dd = pad(date.getDate());
    const hh = pad(date.getHours());
    const min = pad(date.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  // Reset form or populate from editing event
  useEffect(() => {
    if (!isOpen) return;

    if (editingEvent) {
      setEditingId(editingEvent.id);
      setEventName(editingEvent.eventName);
      setLocationName(editingEvent.locationName);
      setLatitude(editingEvent.latitude);
      setLongitude(editingEvent.longitude);
      try {
        setStartTime(toDateTimeLocal(new Date(editingEvent.startTime)));
        setEndTime(toDateTimeLocal(new Date(editingEvent.endTime)));
      } catch (e) {
        setStartTime(editingEvent.startTime);
        setEndTime(editingEvent.endTime);
      }
      setDescription(editingEvent.description || '');
      setActiveTab('create');
    } else {
      setEditingId(null);
      setEventName('');
      setLocationName('');
      setDescription('');
      if (initialCoordinates) {
        setLatitude(Number(initialCoordinates.lat.toFixed(6)));
        setLongitude(Number(initialCoordinates.lon.toFixed(6)));
      } else {
        setLatitude(31.254);
        setLongitude(75.704);
      }
      const now = new Date();
      const defaultEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // +3 days
      setStartTime(toDateTimeLocal(now));
      setEndTime(toDateTimeLocal(defaultEnd));
    }
    setErrorMsg(null);
    setSuccessMsg(null);
  }, [isOpen, editingEvent, initialCoordinates]);

  if (!isOpen) return null;

  const handleEditClick = (evt: EventLocation) => {
    setEditingId(evt.id);
    setEventName(evt.eventName);
    setLocationName(evt.locationName);
    setLatitude(evt.latitude);
    setLongitude(evt.longitude);
    try {
      setStartTime(toDateTimeLocal(new Date(evt.startTime)));
      setEndTime(toDateTimeLocal(new Date(evt.endTime)));
    } catch (e) {
      setStartTime(evt.startTime);
      setEndTime(evt.endTime);
    }
    setDescription(evt.description || '');
    setActiveTab('create');
  };

  const handleApplyPreset = (hours: number) => {
    const start = startTime ? new Date(startTime) : new Date();
    const end = new Date(start.getTime() + hours * 60 * 60 * 1000);
    setEndTime(toDateTimeLocal(end));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!eventName.trim()) {
      setErrorMsg('Event Name is required (e.g. "Youth Vibe", "One World", "Spectra").');
      return;
    }
    if (!locationName.trim()) {
      setErrorMsg('Location / Venue Name is required (e.g. "Baldev Raj Mittal Unipolis", "Block 34 Lawn").');
      return;
    }
    if (isNaN(latitude) || isNaN(longitude)) {
      setErrorMsg('Valid geographical coordinates (Latitude & Longitude) are required.');
      return;
    }
    if (!startTime || !endTime) {
      setErrorMsg('Start date/time and End date/time are both required.');
      return;
    }

    const startDate = new Date(startTime);
    const endDate = new Date(endTime);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      setErrorMsg('Please select valid start and end dates.');
      return;
    }
    if (endDate <= startDate) {
      setErrorMsg('Event End time must be after Start time.');
      return;
    }

    try {
      const payload: Partial<EventLocation> = {
        id: editingId || `EVENT_${Date.now()}`,
        eventName: eventName.trim(),
        locationName: locationName.trim(),
        category: 'Campus Event',
        latitude: Number(latitude.toFixed(6)),
        longitude: Number(longitude.toFixed(6)),
        startTime: startDate.toISOString(),
        endTime: endDate.toISOString(),
        description: description.trim(),
        status: endDate.getTime() <= Date.now() ? 'expired' : 'active',
      };

      await saveEventRecord(payload);
      setSuccessMsg(
        editingId
          ? `Event "${payload.eventName}" location updated successfully!`
          : `Event "${payload.eventName}" added to campus map until ${endDate.toLocaleString()}!`
      );

      setTimeout(() => {
        if (!editingId) {
          // If newly created, close or reset
          onClose();
        } else {
          setEditingId(null);
          onClearEditingEvent?.();
          setActiveTab('list');
        }
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to save event location. Please try again.');
    }
  };

  const handleDeleteEvent = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove "${name}" from the active campus map? It will be archived into Event History.`)) {
      try {
        await deleteEventRecord(id);
        if (editingId === id) {
          setEditingId(null);
          setEventName('');
          setLocationName('');
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to delete event location.');
      }
    }
  };

  // Events list for tab
  const displayEvents = allEvents && allEvents.length > 0 ? allEvents : activeEvents;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="relative bg-gradient-to-r from-purple-700 via-indigo-700 to-emerald-700 text-white p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2.5">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
                <Sparkles className="w-5 h-5 text-amber-300" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight">
                  {editingId ? 'Modify Event Location' : 'Add Temporary Event Location'}
                </h3>
                <p className="text-xs text-purple-200 font-medium">
                  Visible to campus visitors from start time until automatically archived at end time
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center space-x-2 mt-4 bg-black/20 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'create'
                  ? 'bg-white text-purple-900 shadow-sm'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{editingId ? 'Edit Event Details' : '+ New Event Location'}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center space-x-1.5 ${
                activeTab === 'list'
                  ? 'bg-white text-purple-900 shadow-sm'
                  : 'text-purple-200 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Active Events ({displayEvents.length})</span>
            </button>
          </div>
        </div>

        {/* Tab 1: Create / Edit Form */}
        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4">
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl flex items-center space-x-2 animate-in fade-in">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Event Name & Venue Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Event Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Youth Vibe 2026, One World"
                  value={eventName}
                  onChange={(e) => setEventName(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">Users can search for this exact name</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Venue Display Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baldev Raj Mittal Unipolis"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  className="w-full text-xs sm:text-sm font-semibold bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">Where within campus it takes place</p>
              </div>
            </div>

            {/* Start and End Date & Time */}
            <div className="p-3.5 bg-purple-50/60 border border-purple-200 rounded-2xl space-y-3">
              <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                <Calendar className="w-4 h-4 text-purple-600" />
                <span>Event Active Schedule (When shown on campus map)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-purple-950 mb-1">
                    Start Date & Time (Show on map from)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-purple-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-purple-950 mb-1">
                    End Date & Time (Auto-deleted & archived)
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full text-xs font-medium bg-white border border-purple-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              {/* Quick Preset Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] font-bold text-purple-800">Quick Duration:</span>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(12)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-purple-700 border border-purple-200 hover:bg-purple-100"
                >
                  +12 Hours
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(24)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-purple-700 border border-purple-200 hover:bg-purple-100"
                >
                  +1 Day
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(72)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-purple-700 border border-purple-200 hover:bg-purple-100"
                >
                  +3 Days (Fest)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset(168)}
                  className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white text-purple-700 border border-purple-200 hover:bg-purple-100"
                >
                  +1 Week
                </button>
              </div>
            </div>

            {/* Coordinates Selector */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-800">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Geographical Coordinates</span>
                </div>
                {onPickOnMap && (
                  <button
                    type="button"
                    onClick={() => {
                      onPickOnMap();
                    }}
                    className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    <span>Pick on Visible Map</span>
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    required
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full text-xs font-mono bg-white border border-slate-300 rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Additional Description / Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Event Details / Entry Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="e.g. Main stage entrance through Gate 2. Food stalls setup near Uni-Mall ground."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:bg-white resize-none"
              />
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              {editingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    onClearEditingEvent?.();
                    setEventName('');
                    setLocationName('');
                  }}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 rounded-xl"
                >
                  Cancel Edit
                </button>
              ) : (
                <div className="flex items-center space-x-1 text-[11px] text-slate-500">
                  <Info className="w-3.5 h-3.5 text-purple-600" />
                  <span>Auto-saved to SQLite</span>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={saveStatus === 'saving'}
                  className="px-5 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md shadow-purple-500/25 transition-all flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{editingId ? 'Update Event Location' : 'Save Event to Map'}</span>
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Tab 2: Active Events List for Admin */}
        {activeTab === 'list' && (
          <div className="p-5 overflow-y-auto space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-600">
                Scheduled & Active Campus Events ({displayEvents.length})
              </span>
              <button
                type="button"
                onClick={() => {
                  setEditingId(null);
                  setActiveTab('create');
                }}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center space-x-1"
              >
                <Sparkles className="w-3 h-3" />
                <span>+ Add Another</span>
              </button>
            </div>

            {displayEvents.length === 0 ? (
              <div className="text-center py-8 text-slate-400">
                <Sparkles className="w-8 h-8 mx-auto mb-2 text-slate-300 animate-pulse" />
                <p className="text-xs font-semibold">No active event locations registered right now.</p>
                <p className="text-[11px] mt-1">
                  Click "+ New Event Location" to add an event with temporary map availability.
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {displayEvents.map((evt) => {
                  const isCurrentlyActive =
                    new Date(evt.startTime) <= new Date() && new Date(evt.endTime) >= new Date();
                  return (
                    <div
                      key={evt.id}
                      className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-purple-50/40 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-sm text-slate-900">{evt.eventName}</span>
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              isCurrentlyActive
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {isCurrentlyActive ? 'LIVE ON MAP' : 'SCHEDULED'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-600 flex items-center space-x-1">
                          <MapPin className="w-3 h-3 text-purple-600" />
                          <span>Venue: {evt.locationName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 flex items-center space-x-1 font-mono">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>
                            {new Date(evt.startTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}{' '}
                            ➔{' '}
                            {new Date(evt.endTime).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleEditClick(evt)}
                          className="px-2.5 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-bold transition-colors flex items-center space-x-1"
                          title="Modify event name, location, coordinates or duration"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteEvent(evt.id, evt.eventName)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition-colors"
                          title="Archive event to Event History"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
