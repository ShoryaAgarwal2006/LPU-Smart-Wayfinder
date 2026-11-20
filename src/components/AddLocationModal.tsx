import React, { useState, useEffect } from 'react';
import { PlusCircle, X, Save, MapPin, Building2, CheckCircle2, Eye, Crosshair } from 'lucide-react';
import { CAMPUS_CATEGORIES, AdminLocation } from '../types/adminEditor';
import { useCampusData } from '../context/CampusDataContext';

interface AddLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCoordinates?: { lat: number; lon: number };
  onSuccess?: (savedLocation: AdminLocation) => void;
  onPickOnMap?: () => void;
}

export const AddLocationModal: React.FC<AddLocationModalProps> = ({
  isOpen,
  onClose,
  initialCoordinates,
  onSuccess,
  onPickOnMap,
}) => {
  const { saveLocationRecord } = useCampusData();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<string>('Academic Blocks');
  const [subcategory, setSubcategory] = useState('');
  const [latitude, setLatitude] = useState<number>(initialCoordinates?.lat || 31.255);
  const [longitude, setLongitude] = useState<number>(initialCoordinates?.lon || 75.704);
  const [geographicalArea, setGeographicalArea] = useState('Central Academic Spine');
  const [description, setDescription] = useState('');
  const [isInsideCampus, setIsInsideCampus] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Synchronize coordinates whenever modal opens or new coordinates are passed
  useEffect(() => {
    if (isOpen) {
      if (initialCoordinates) {
        setLatitude(Number(initialCoordinates.lat.toFixed(6)));
        setLongitude(Number(initialCoordinates.lon.toFixed(6)));
      }
      setName('');
      setDescription('');
    }
  }, [isOpen, initialCoordinates]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSaving(true);
    try {
      const generatedId = `LOC_${Date.now()}`;
      const saved = await saveLocationRecord({
        id: generatedId,
        name: name.trim(),
        exactName: name.trim(),
        category,
        subcategory,
        latitude: Number(latitude),
        longitude: Number(longitude),
        geographicalArea,
        description,
        notes: description,
        verificationStatus: 'ADMIN_VERIFIED',
        isInsideCampus,
      });
      setIsSaving(false);
      onSuccess?.(saved);
      onClose();
    } catch (err: any) {
      setIsSaving(false);
      alert(err.message || 'Failed to save new location.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Add New Campus Landmark</h3>
              <p className="text-xs text-slate-300">
                Create a new building, park, dining hall or student facility
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs text-slate-700">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Landmark Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Block 60, Central Botanical Garden, North Food Pavilion"
              required
              autoFocus
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-900 text-xs font-bold outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold outline-none"
              >
                {CAMPUS_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                Subcategory / Division
              </label>
              <input
                type="text"
                value={subcategory}
                onChange={(e) => setSubcategory(e.target.value)}
                placeholder="e.g. School of Physics, Dining Hall"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none"
              />
            </div>
          </div>

          <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-emerald-900 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Geographic Coordinates
              </span>
              {onPickOnMap && (
                <button
                  type="button"
                  onClick={onPickOnMap}
                  className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors flex items-center gap-1 shadow-2xs cursor-pointer"
                  title="Click a point directly on the map"
                >
                  <Crosshair className="w-3 h-3 text-emerald-600" />
                  <span>Pick on Map</span>
                </button>
              )}
            </div>
            <div className="text-[11px] text-emerald-800 flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Location will originate directly on your visible screen</span>
            </div>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  required
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Campus Sector / Area
            </label>
            <input
              type="text"
              value={geographicalArea}
              onChange={(e) => setGeographicalArea(e.target.value)}
              placeholder="e.g. North Sector, Central Academic Spine, West Campus"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Description &amp; Wayfinding Guidance
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief details about facilities, classrooms, or hours..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none"
            />
          </div>

          <label className="flex items-center space-x-2 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={isInsideCampus}
              onChange={(e) => setIsInsideCampus(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-xs font-semibold text-slate-800">
              Location is officially inside university campus boundary
            </span>
          </label>

          <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Add to Database'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
