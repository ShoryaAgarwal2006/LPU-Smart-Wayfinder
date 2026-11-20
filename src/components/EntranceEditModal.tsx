import React, { useState } from 'react';
import { DoorOpen, X, Save, Star, MapPin, CheckCircle } from 'lucide-react';
import { BuildingEntrance, EntranceType } from '../types/adminEditor';
import { useCampusData } from '../context/CampusDataContext';

interface EntranceEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  buildingId: string;
  initialCoordinates?: { lat: number; lon: number };
}

export const EntranceEditModal: React.FC<EntranceEditModalProps> = ({
  isOpen,
  onClose,
  buildingId,
  initialCoordinates,
}) => {
  const { locations, saveEntranceRecord } = useCampusData();

  const building = locations.find((l) => l.id === buildingId);

  const [name, setName] = useState('Main Entrance');
  const [entranceType, setEntranceType] = useState<EntranceType>('main');
  const [latitude, setLatitude] = useState(initialCoordinates?.lat || building?.latitude || 31.25);
  const [longitude, setLongitude] = useState(initialCoordinates?.lon || building?.longitude || 75.70);
  const [isPreferred, setIsPreferred] = useState(true);
  const [isRestricted, setIsRestricted] = useState(false);
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveEntranceRecord({
        id: `ENT_${buildingId}_${Date.now()}`,
        buildingId,
        name,
        entranceType,
        latitude: Number(latitude),
        longitude: Number(longitude),
        isPreferred,
        isRestricted,
        isAvailable: true,
        description,
      });
      setIsSaving(false);
      onClose();
    } catch (err) {
      setIsSaving(false);
      alert('Failed to save entrance.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <DoorOpen className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">Add Building Entrance</h3>
              <p className="text-[11px] text-slate-300 truncate max-w-[220px]">
                Building: {building?.name || buildingId}
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
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs text-slate-700">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Entrance Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Main Entrance, West Lobby Porch, Service Gate"
              required
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-slate-900 text-xs font-semibold outline-none"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Entrance Type
            </label>
            <select
              value={entranceType}
              onChange={(e) => setEntranceType(e.target.value as EntranceType)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs font-semibold outline-none"
            >
              <option value="main">Main Visitor Entrance</option>
              <option value="side">Side / Secondary Entrance</option>
              <option value="service">Service &amp; Delivery Entrance</option>
              <option value="accessible">Accessible (Ramp / Elevator)</option>
              <option value="emergency">Emergency Exit / Evacuation Door</option>
            </select>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Entrance Doorway Coordinates
            </span>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] text-slate-500">Latitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={latitude}
                  onChange={(e) => setLatitude(parseFloat(e.target.value))}
                  required
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] text-slate-500">Longitude</label>
                <input
                  type="number"
                  step="0.000001"
                  value={longitude}
                  onChange={(e) => setLongitude(parseFloat(e.target.value))}
                  required
                  className="w-full px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-mono text-slate-900 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPreferred}
                onChange={(e) => setIsPreferred(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-bold text-slate-800">
                Set as Preferred Destination Entrance
              </span>
            </label>

            <label className="flex items-center space-x-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isRestricted}
                onChange={(e) => setIsRestricted(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-700">
                Restricted (Staff/Authorized Access Only)
              </span>
            </label>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
              Description / Wayfinding Guidance
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Ramp accessible, near reception desk"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none"
            />
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
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
              <span>{isSaving ? 'Saving...' : 'Save Entrance'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
