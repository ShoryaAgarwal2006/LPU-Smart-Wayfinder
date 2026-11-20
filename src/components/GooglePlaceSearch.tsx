import React, { useState, useEffect, useRef } from 'react';
import { Search, X, MapPin, Navigation, ExternalLink, Loader2, Compass } from 'lucide-react';
import { GoogleCampusPlace } from '../types/googleMaps';
import {
  searchGoogleCampusPlaces,
  getGooglePlaceDetails,
  getGooglePlaceAutocomplete,
} from '../services/googlePlacesService';

interface GooglePlaceSearchProps {
  onSelectPlace: (place: GoogleCampusPlace) => void;
  onNavigateToPlace: (place: GoogleCampusPlace) => void;
  mapInstance?: any;
}

export const GooglePlaceSearch: React.FC<GooglePlaceSearchProps> = ({
  onSelectPlace,
  onNavigateToPlace,
  mapInstance,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GoogleCampusPlace[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const searchTimeoutRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Quick campus presets
  const quickSearches = [
    'Block 34',
    'Block 1',
    'Uni Hospital',
    'Uni-Mall',
    'Block 37',
    'BH-1',
    'BH-7',
    'BS-11',
    'Central Library',
    'Unipolis',
    'Sports Complex',
    'Law Gate',
  ];

  // Close suggestions on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Handle autocomplete predictions on input
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setResults([]);
      setHasSearched(false);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const preds = await getGooglePlaceAutocomplete(query);
        setSuggestions(preds);
        if (preds.length > 0) setIsOpen(true);
      } catch (err) {
        console.warn('[GooglePlaceSearch] Autocomplete error', err);
      }
    }, 200);

    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [query]);

  // Execute full text search
  const handleExecuteSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    setHasSearched(true);
    setIsOpen(true);

    try {
      const places = await searchGoogleCampusPlaces(searchTerm, mapInstance);
      setResults(places);
      setSuggestions([]);
    } catch (err) {
      console.error('[GooglePlaceSearch] Search error', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPrediction = async (pred: any) => {
    setLoading(true);
    setIsOpen(false);
    setQuery(pred.structured_formatting?.main_text || pred.description);

    try {
      const place = await getGooglePlaceDetails(pred.place_id, mapInstance);
      if (place) {
        onSelectPlace(place);
      }
    } catch (err) {
      console.error('[GooglePlaceSearch] Failed to fetch place details for prediction', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-lg z-30">
      {/* Search Bar */}
      <div className="relative flex items-center bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500 focus-within:border-emerald-500 transition-all">
        <div className="pl-4 text-emerald-600">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleExecuteSearch(query);
            }
          }}
          onFocus={() => {
            if (results.length > 0 || suggestions.length > 0) setIsOpen(true);
          }}
          placeholder="Search campus in Google Maps (e.g. Block 34, BH-1, Uni Hospital)..."
          className="w-full px-3 py-3 text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none bg-transparent"
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              setResults([]);
              setSuggestions([]);
              setHasSearched(false);
            }}
            className="p-1 mr-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={() => handleExecuteSearch(query)}
          className="mr-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
        >
          Search
        </button>
      </div>

      {/* Quick Search Chips */}
      <div className="flex items-center space-x-1.5 overflow-x-auto py-2 scrollbar-none text-[11px]">
        {quickSearches.map((term) => (
          <button
            key={term}
            onClick={() => {
              setQuery(term);
              handleExecuteSearch(term);
            }}
            className="whitespace-nowrap px-2.5 py-1 rounded-full bg-white/90 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 border border-slate-200/80 font-semibold shadow-2xs transition-all"
          >
            {term}
          </button>
        ))}
      </div>

      {/* Dropdown Results and Predictions */}
      {isOpen && (suggestions.length > 0 || results.length > 0 || hasSearched) && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-80 overflow-y-auto divide-y divide-slate-100 z-50">
          {/* Autocomplete Predictions */}
          {suggestions.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Google Places Suggestions
              </div>
              {suggestions.map((pred) => (
                <div
                  key={pred.place_id}
                  onClick={() => handleSelectPrediction(pred)}
                  className="px-3 py-2 rounded-xl hover:bg-emerald-50 cursor-pointer flex items-center justify-between group transition-colors"
                >
                  <div className="flex items-center space-x-2.5">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800 group-hover:text-emerald-700">
                        {pred.structured_formatting?.main_text || pred.description}
                      </div>
                      <div className="text-[10px] text-slate-400 line-clamp-1">
                        {pred.structured_formatting?.secondary_text || 'LPU Campus, Phagwara'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Full Search Results */}
          {results.length > 0 && (
            <div className="p-2">
              <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Verified Google Maps Places ({results.length})
              </div>
              {results.map((place) => (
                <div
                  key={place.placeId}
                  className="px-3 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group transition-colors cursor-pointer"
                  onClick={() => {
                    onSelectPlace(place);
                    setIsOpen(false);
                  }}
                >
                  <div className="flex items-center space-x-2.5 flex-1 mr-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                      📍
                    </div>
                    <div>
                      {/* EXACT GOOGLE MAPS NAME DISPLAYED */}
                      <div className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {place.name}
                      </div>
                      <div className="text-[10px] text-slate-500 line-clamp-1">
                        {place.formattedAddress || 'Lovely Professional University'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToPlace(place);
                      setIsOpen(false);
                    }}
                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold shadow-xs flex items-center space-x-1 shrink-0"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Route</span>
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Empty Search Result */}
          {hasSearched && results.length === 0 && suggestions.length === 0 && !loading && (
            <div className="p-6 text-center text-slate-500">
              <Compass className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <div className="text-xs font-bold text-slate-700">No verified Google Maps place found.</div>
              <p className="text-[11px] text-slate-400 mt-1">
                Try searching for specific numbered blocks (e.g. "Block 34"), hostels ("BH-1"), or landmarks ("Uni-Mall").
              </p>
            </div>
          )}

          {/* Google Branding Requirement */}
          <div className="p-2 bg-slate-50 text-[10px] text-slate-400 text-center font-medium border-t border-slate-100 flex items-center justify-center space-x-1">
            <span>Powered by</span>
            <span className="font-bold text-slate-600">Google Maps Platform</span>
          </div>
        </div>
      )}
    </div>
  );
};
