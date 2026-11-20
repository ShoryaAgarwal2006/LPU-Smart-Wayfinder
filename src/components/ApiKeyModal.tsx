import React, { useState } from 'react';
import { Key, ShieldAlert, CheckCircle, ExternalLink, X, Info } from 'lucide-react';
import { getGoogleMapsApiKey, setGoogleMapsApiKey, loadGoogleMaps } from '../services/googleMapsLoader';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onKeyConfigured?: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isOpen,
  onClose,
  onKeyConfigured,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState<string>(getGoogleMapsApiKey() || '');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  if (!isOpen) return null;

  const handleSaveAndTest = async () => {
    const trimmed = apiKeyInput.trim();
    if (!trimmed) {
      setTestResult({
        success: false,
        message: 'Please enter a valid Google Maps API Key.',
      });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      setGoogleMapsApiKey(trimmed);
      await loadGoogleMaps(trimmed);
      setIsTesting(false);
      setTestResult({
        success: true,
        message: 'Google Maps JavaScript API initialized successfully! The map is now active.',
      });
      if (onKeyConfigured) {
        onKeyConfigured();
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setIsTesting(false);
      setTestResult({
        success: false,
        message: err.message || 'Failed to authenticate with Google Maps Platform.',
      });
    }
  };

  const handleClearKey = () => {
    setGoogleMapsApiKey('');
    setApiKeyInput('');
    setTestResult({
      success: false,
      message: 'API Key removed from local configuration.',
    });
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-start justify-between">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
              <Key className="w-3.5 h-3.5" />
              <span>Official Google Maps Platform</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight">
              Google Maps API Configuration
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Connect your Google Cloud API key to load genuine Google Maps tiles, Places, and Directions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs text-slate-700 leading-relaxed">
          {/* Required APIs Warning */}
          <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
            <div className="flex items-center space-x-2 font-bold text-blue-900">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Required Google Cloud APIs to Enable:</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-blue-800 text-[11px]">
              <li><strong>Maps JavaScript API</strong> — Genuine visual roadmap, satellite tiles, native labels</li>
              <li><strong>Places API (New)</strong> — Autocomplete & exact place names</li>
              <li><strong>Directions API</strong> — Real outdoor pedestrian walking routes</li>
            </ul>
          </div>

          {/* Key Input */}
          <div>
            <label className="block text-slate-900 font-bold mb-1.5">
              Google Maps API Key:
            </label>
            <div className="relative">
              <input
                type="text"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full font-mono text-xs p-3 bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-400 mt-1.5">
              You can also configure this permanently in your project root in a <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">.env</code> file: <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700 font-mono">VITE_GOOGLE_MAPS_API_KEY=AIzaSy...</code>
            </p>
          </div>

          {/* Result Alert */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start space-x-2 ${
                testResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}
            >
              {testResult.success ? (
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <span className="leading-normal">{testResult.message}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={handleClearKey}
            className="text-xs text-slate-500 hover:text-red-600 font-semibold transition-colors"
          >
            Clear Key
          </button>
          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveAndTest}
              disabled={isTesting || !apiKeyInput.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all flex items-center space-x-1.5"
            >
              <span>{isTesting ? 'Validating...' : 'Save & Activate'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
