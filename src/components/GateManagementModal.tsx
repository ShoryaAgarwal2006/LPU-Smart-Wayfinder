import React, { useState } from 'react';
import { Sliders, X, Plus, Trash2, Edit2, MapPin, Save, ShieldCheck, Compass } from 'lucide-react';
import { useCampusData } from '../context/CampusDataContext';
import { CampusGateItem, GateAccessType, GateDirectionType } from '../types/adminEditor';

interface GateManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddGateOnMap: () => void;
}

export const GateManagementModal: React.FC<GateManagementModalProps> = ({
  isOpen,
  onClose,
  onAddGateOnMap,
}) => {
  const { gates, saveGateRecord, deleteGateRecord } = useCampusData();

  const [editingGate, setEditingGate] = useState<Partial<CampusGateItem> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleStartAdd = () => {
    setEditingGate({
      id: `GATE_${Date.now()}`,
      name: 'New Campus Gate',
      category: 'Primary Highway Entrance',
      latitude: 31.2598,
      longitude: 75.7060,
      gateType: 'entry_exit',
      accessType: 'both',
      description: 'Campus perimeter entrance gate.',
    });
  };

  const handleStartEdit = (gate: CampusGateItem) => {
    setEditingGate({ ...gate });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGate) return;
    setIsSaving(true);
    try {
      await saveGateRecord(editingGate);
      setIsSaving(false);
      setEditingGate(null);
    } catch (err) {
      setIsSaving(false);
      alert('Failed to save gate.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete gate "${name}"?`)) {
      await deleteGateRecord(id);
      if (editingGate?.id === id) {
        setEditingGate(null);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-emerald-950 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Campus Gates &amp; Perimeter Entrances</h3>
              <p className="text-xs text-slate-300">
                Manage all highway portals, turnstiles, and pedestrian perimeter checkpoints ({gates.length} active)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {editingGate ? (
            /* Edit Form */
            <form onSubmit={handleSave} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3.5 text-xs text-slate-700">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-emerald-600" />
                  <span>{editingGate.id ? 'Edit Gate' : 'Add New Gate'}</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setEditingGate(null)}
                  className="text-xs text-slate-500 hover:text-slate-800"
                >
                  Back to List
                </button>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Gate Name
                </label>
                <input
                  type="text"
                  value={editingGate.name || ''}
                  onChange={(e) => setEditingGate({ ...editingGate, name: e.target.value })}
                  placeholder="e.g. Gate 1 (Main Entrance), Law Gate"
                  required
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                    Gate Category
                  </label>
                  <input
                    type="text"
                    value={editingGate.category || ''}
                    onChange={(e) => setEditingGate({ ...editingGate, category: e.target.value })}
                    placeholder="e.g. Primary Highway Entrance, Auxiliary Gate"
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                    Access Permissions
                  </label>
                  <select
                    value={editingGate.accessType || 'both'}
                    onChange={(e) => setEditingGate({ ...editingGate, accessType: e.target.value as GateAccessType })}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none font-medium"
                  >
                    <option value="both">Both (Vehicles &amp; Pedestrians)</option>
                    <option value="pedestrian">Pedestrians Only (Turnstile)</option>
                    <option value="vehicle">Vehicles Only (Transit / Buses)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 p-3 bg-white border border-slate-200 rounded-xl">
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold">Latitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingGate.latitude ?? ''}
                    onChange={(e) => setEditingGate({ ...editingGate, latitude: parseFloat(e.target.value) })}
                    required
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-slate-500 font-bold">Longitude</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={editingGate.longitude ?? ''}
                    onChange={(e) => setEditingGate({ ...editingGate, longitude: parseFloat(e.target.value) })}
                    required
                    className="w-full px-2 py-1 bg-slate-50 border border-slate-300 rounded-lg font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1">
                  Description / Security Details
                </label>
                <input
                  type="text"
                  value={editingGate.description || ''}
                  onChange={(e) => setEditingGate({ ...editingGate, description: e.target.value })}
                  placeholder="e.g. RFID boom barriers, security guard post"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 outline-none"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingGate(null)}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-all flex items-center space-x-1"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Gate'}</span>
                </button>
              </div>
            </form>
          ) : (
            /* Gates List */
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Configured Campus Gate Portals
                </span>
                <button
                  onClick={handleStartAdd}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center space-x-1.5 shadow-sm transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add New Gate</span>
                </button>
              </div>

              <div className="space-y-2">
                {gates.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 bg-slate-50 hover:bg-white border border-slate-200 hover:border-slate-300 rounded-2xl flex items-center justify-between gap-3 transition-all"
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                        🚪
                      </div>
                      <div>
                        <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                          <span>{g.name}</span>
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                            {g.accessType}
                          </span>
                        </div>
                        <div className="text-xs text-slate-500 mt-0.5">{g.category}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          {g.latitude.toFixed(5)}, {g.longitude.toFixed(5)}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => handleStartEdit(g)}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                        title="Edit gate"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(g.id, g.name)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Delete gate"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
