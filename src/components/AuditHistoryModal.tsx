import React, { useState, useEffect } from 'react';
import { History, X, RotateCcw, Clock, ShieldCheck, UserCheck, CheckCircle2 } from 'lucide-react';
import { useCampusData } from '../context/CampusDataContext';
import { AuditLogEntry } from '../types/adminEditor';
import * as api from '../services/adminApiService';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({ isOpen, onClose }) => {
  const { history, refreshAllData, undoAction } = useCampusData();
  const [entries, setEntries] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      api
        .fetchHistory()
        .then((data) => {
          setEntries(data);
          setIsLoading(false);
        })
        .catch(() => setIsLoading(false));
    }
  }, [isOpen, history]);

  if (!isOpen) return null;

  const handleRevert = async () => {
    const success = await undoAction();
    if (success) {
      const updated = await api.fetchHistory();
      setEntries(updated);
    }
  };

  const formatPayload = (jsonStr: string | null) => {
    if (!jsonStr) return 'None';
    try {
      const obj = JSON.parse(jsonStr);
      return (
        <div className="space-y-0.5 text-[11px] font-mono">
          <div><b className="text-slate-700">Name:</b> {obj.name || obj.exactName}</div>
          <div><b className="text-slate-700">Coords:</b> {obj.latitude?.toFixed?.(5)}, {obj.longitude?.toFixed?.(5)}</div>
          {obj.category && <div><b className="text-slate-700">Category:</b> {obj.category}</div>}
        </div>
      );
    } catch (e) {
      return jsonStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2.5 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90dvh] sm:max-h-[85vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">Location Audit &amp; Change History</h3>
              <p className="text-xs text-slate-300">
                Permanent chronological record of all administrative edits and coordinate corrections
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

        {/* Action Bar */}
        <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="text-xs text-slate-600 font-medium">
            Showing <b className="text-slate-900">{entries.length}</b> audit events logged to SQLite.
          </div>
          <button
            onClick={handleRevert}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-xs font-bold text-slate-700 flex items-center space-x-1.5 transition-colors shadow-xs"
            title="Undo the most recent saved change"
          >
            <RotateCcw className="w-3.5 h-3.5 text-emerald-600" />
            <span>Undo Last Action</span>
          </button>
        </div>

        {/* History List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-slate-500">Loading audit history...</div>
          ) : entries.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">No changes recorded yet.</div>
          ) : (
            entries.map((entry) => (
              <div
                key={entry.id}
                className={`p-3.5 rounded-2xl border transition-all ${
                  entry.undone
                    ? 'bg-slate-50/70 border-slate-200 opacity-60'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider ${
                        entry.action_type.includes('ADD')
                          ? 'bg-emerald-100 text-emerald-800'
                          : entry.action_type.includes('DELETE')
                          ? 'bg-red-100 text-red-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {entry.action_type.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-slate-800 text-xs font-mono">
                      {entry.entity_id}
                    </span>
                    {Boolean(entry.undone) && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-bold">
                        Undone
                      </span>
                    )}
                  </div>
                  <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
                    <Clock className="w-3 h-3" />
                    <span>{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Previous State
                    </span>
                    {formatPayload(entry.previous_data)}
                  </div>
                  <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      New State
                    </span>
                    {formatPayload(entry.new_data)}
                  </div>
                </div>

                <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-between">
                  <span className="flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                    <span>Editor: <b className="text-slate-700">{entry.editor_name}</b></span>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
