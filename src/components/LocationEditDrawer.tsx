import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Trash2,
  MapPin,
  DoorOpen,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Star,
  Plus,
  Navigation,
  Compass,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { useCampusData } from '../context/CampusDataContext';
import { AdminLocation, CAMPUS_CATEGORIES, BuildingEntrance } from '../types/adminEditor';

interface LocationEditDrawerProps {
  location: AdminLocation | null;
  onClose: () => void;
  onAddEntranceClick: (buildingId: string) => void;
}

export const LocationEditDrawer: React.FC<LocationEditDrawerProps> = ({
  location,
  onClose,
  onAddEntranceClick,
}) => {
  const {
    saveLocationRecord,
    deleteLocationRecord,
    getEntrancesForBuilding,
    saveEntranceRecord,
    deleteEntranceRecord,
    gates,
    relationships,
    saveRelationshipRecord,
    saveStatus,
  } = useCampusData();

  const [formData, setFormData] = useState<Partial<AdminLocation>>({});
  const [isDeleting, setIsDeleting] = useState(false);
  const [preferredGateId, setPreferredGateId] = useState<string>('');
  const [approachNotes, setApproachNotes] = useState<string>('');

  useEffect(() => {
    if (location) {
      setFormData({
        id: location.id,
        name: location.name,
        exactName: location.exactName || location.name,
        category: location.category,
        subcategory: location.subcategory || '',
        latitude: location.latitude,
        longitude: location.longitude,
        description: location.description || location.notes || '',
        notes: location.description || location.notes || '',
        verificationStatus: location.verificationStatus || 'GOOGLE_MAPS_VERIFIED',
        geographicalArea: location.geographicalArea || '',
        isInsideCampus: location.isInsideCampus !== false,
      });

      // Find relationship if any
      const rel = relationships.find((r) => r.buildingId === location.id);
      if (rel) {
        setPreferredGateId(rel.preferredGateId || '');
        setApproachNotes(rel.approachNotes || '');
      } else {
        setPreferredGateId('');
        setApproachNotes('');
      }
      setIsDeleting(false);
    }
  }, [location, relationships]);

  if (!location) return null;

  const buildingEntrances = getEntrancesForBuilding(location.id);

  const handleFieldChange = (field: keyof AdminLocation, val: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: val,
      ...(field === 'name' ? { exactName: val } : {}),
    }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await saveLocationRecord(formData);
      if (preferredGateId) {
        await saveRelationshipRecord({
          buildingId: location.id,
          preferredGateId,
          approachNotes,
        });
      }
    } catch (err) {
      console.error('Failed to save location', err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to permanently delete "${location.name}"?`)) {
      try {
        await deleteLocationRecord(location.id);
        onClose();
      } catch (err) {
        alert('Failed to delete location.');
      }
    }
  };

  const handleSetPreferredEntrance = async (entrance: BuildingEntrance) => {
    await saveEntranceRecord({
      ...entrance,
      isPreferred: true,
    });
  };

  const handleDeleteEntrance = async (entranceId: string) => {
    if (window.confirm('Delete this entrance point?')) {
      await deleteEntranceRecord(entranceId);
    }
  };

  return (
    <div className="absolute top-16 right-3 sm:right-4 z-30 w-[calc(100%-1.5rem)] sm:w-96 max-w-md bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[calc(100vh-6rem)] pointer-events-auto animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-white leading-tight truncate max-w-[200px]">
              {formData.name || 'Edit Location'}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">ID: {location.id}</span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Form Body */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        {/* Name Input */}
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Location Name
          </label>
          <input
            type="text"
            value={formData.name || ''}
            onChange={(e) => handleFieldChange('name', e.target.value)}
            required
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-900 text-xs font-semibold outline-none"
          />
        </div>

        {/* Category Dropdown */}
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Category
          </label>
          <select
            value={formData.category || 'Academic Blocks'}
            onChange={(e) => handleFieldChange('category', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-900 text-xs font-semibold outline-none"
          >
            {CAMPUS_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Subcategory / Designation
          </label>
          <input
            type="text"
            value={formData.subcategory || ''}
            onChange={(e) => handleFieldChange('subcategory', e.target.value)}
            placeholder="e.g. School of Computer Science & Engineering"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 rounded-xl text-slate-900 text-xs outline-none"
          />
        </div>

        {/* Coordinates with Live Drag Guidance */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wider flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" /> Geographical Coordinates
            </span>
            <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
              Draggable
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Latitude</label>
              <input
                type="number"
                step="0.000001"
                value={formData.latitude ?? ''}
                onChange={(e) => handleFieldChange('latitude', parseFloat(e.target.value))}
                required
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>
            <div>
              <label className="block text-[10px] text-slate-500 mb-0.5">Longitude</label>
              <input
                type="number"
                step="0.000001"
                value={formData.longitude ?? ''}
                onChange={(e) => handleFieldChange('longitude', parseFloat(e.target.value))}
                required
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono font-bold text-slate-900 outline-none"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-500 italic">
            Tip: You can also drag the marker directly on the map to update coordinates visually.
          </p>
        </div>

        {/* Geographical Area */}
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Campus Sector / Area
          </label>
          <input
            type="text"
            value={formData.geographicalArea || ''}
            onChange={(e) => handleFieldChange('geographicalArea', e.target.value)}
            placeholder="e.g. Central Academic Spine, South-West Sector, Law Gate"
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-slate-900 text-xs outline-none"
          />
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Description &amp; Facility Notes
          </label>
          <textarea
            rows={2}
            value={formData.description || ''}
            onChange={(e) => handleFieldChange('description', e.target.value)}
            placeholder="Add building notes, facilities, departments..."
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 focus:border-emerald-500 rounded-xl text-slate-900 text-xs outline-none"
          />
        </div>

        {/* Verification Status */}
        <div>
          <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
            Verification Status
          </label>
          <select
            value={formData.verificationStatus || 'GOOGLE_MAPS_VERIFIED'}
            onChange={(e) => handleFieldChange('verificationStatus', e.target.value)}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs outline-none font-medium"
          >
            <option value="GOOGLE_MAPS_VERIFIED">✓ Google Maps Verified</option>
            <option value="ADMIN_VERIFIED">✓ Admin Verified</option>
            <option value="MULTI_SOURCE_VERIFIED">✓ Multi-Source Verified</option>
            <option value="APPROXIMATE_LOCATION">⚠ Approximate Location</option>
          </select>
        </div>

        {/* Building Entrances Management Section */}
        <div className="pt-2 border-t border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <span className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4 text-emerald-600" /> Building Entrances ({buildingEntrances.length})
            </span>
            <button
              type="button"
              onClick={() => onAddEntranceClick(location.id)}
              className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 text-[11px] font-bold flex items-center space-x-1 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add Entrance</span>
            </button>
          </div>

          {buildingEntrances.length === 0 ? (
            <p className="text-[11px] text-slate-500 italic bg-slate-50 p-2.5 rounded-xl border border-dashed border-slate-300">
              No specific entrances added yet. Click &quot;Add Entrance&quot; to click-place an entrance doorway on the map.
            </p>
          ) : (
            <div className="space-y-1.5">
              {buildingEntrances.map((ent) => (
                <div
                  key={ent.id}
                  className={`p-2.5 rounded-xl border flex items-center justify-between transition-all ${
                    ent.isPreferred
                      ? 'bg-emerald-50/80 border-emerald-300'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={() => handleSetPreferredEntrance(ent)}
                      title={ent.isPreferred ? 'Preferred Entrance' : 'Set as Preferred Entrance'}
                      className={`p-1 rounded-md transition-colors ${
                        ent.isPreferred ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                      }`}
                    >
                      <Star className="w-3.5 h-3.5 fill-current" />
                    </button>
                    <div>
                      <div className="font-bold text-slate-800 text-xs flex items-center gap-1">
                        <span>{ent.name}</span>
                        {ent.isPreferred && (
                          <span className="text-[9px] uppercase font-bold bg-emerald-200 text-emerald-800 px-1 rounded">
                            Preferred
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-mono">
                        {ent.entranceType} &bull; {ent.latitude.toFixed(5)}, {ent.longitude.toFixed(5)}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteEntrance(ent.id)}
                    className="p-1 rounded-md text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                    title="Delete entrance"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Preferred Approach Gate Connection */}
        <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl space-y-1.5">
          <label className="block font-bold text-blue-900 uppercase tracking-wider text-[11px] flex items-center gap-1">
            <Compass className="w-3.5 h-3.5 text-blue-600" /> Preferred Visitor Approach Gate
          </label>
          <select
            value={preferredGateId}
            onChange={(e) => setPreferredGateId(e.target.value)}
            className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-xl text-blue-950 text-xs font-semibold outline-none"
          >
            <option value="">-- No specific gate preference --</option>
            {gates.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
          <p className="text-[10px] text-blue-700">
            Guides visitors entering through this gate along verified pathways directly to the building&apos;s preferred entrance.
          </p>
        </div>

        {/* Actions Footer */}
        <div className="pt-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleDelete}
            className="px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center space-x-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveStatus === 'saving'}
              className="px-4 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/30 transition-all flex items-center space-x-1.5 disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saveStatus === 'saving' ? 'Saving...' : 'Save Permanently'}</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
