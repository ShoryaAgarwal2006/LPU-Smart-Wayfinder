import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  GoogleCampusPlace,
  GoogleRouteResult,
  GoogleMapsStatus,
  GoogleMapsErrorDetails,
} from '../types/googleMaps';
import {
  loadGoogleMaps,
  isGoogleMapsLoaded,
  subscribeGoogleMapsStatus,
  getGoogleMapsApiKey,
} from '../services/googleMapsLoader';
import {
  LPU_CAMPUS_CENTER,
  searchGoogleCampusPlaces,
  formatGooglePlace,
} from '../services/googlePlacesService';
import { GooglePlaceSearch } from './GooglePlaceSearch';
import { GooglePlaceDetails } from './GooglePlaceDetails';
import { ApiKeyModal } from './ApiKeyModal';
import masterInventoryData from '../data/lpuCampusMasterInventory.json';
import {
  Key,
  Layers,
  MapPin,
  Compass,
  AlertTriangle,
  RotateCcw,
  CheckCircle,
  ExternalLink,
  ShieldAlert,
  Navigation,
} from 'lucide-react';

interface GoogleCampusMapProps {
  selectedPlace: GoogleCampusPlace | null;
  onSelectPlace: (place: GoogleCampusPlace | null) => void;
  startPoint: { name: string; lat: number; lng: number } | null;
  destinationPoint: { name: string; lat: number; lng: number } | null;
  onSetStart: (name: string, lat: number, lng: number) => void;
  onSetDestination: (name: string, lat: number, lng: number) => void;
  activeRoute: GoogleRouteResult | null;
  onViewIndoorStatus?: (blockName: string) => void;
  onRegisterDirectionsRenderer?: (renderer: any) => void;
  onSwitchToFreeMap?: () => void;
}

// Convert Master Inventory into GoogleCampusPlace objects
const verifiedCampusPlaces: GoogleCampusPlace[] = (masterInventoryData as any[]).map((p) => ({
  placeId: p.googlePlaceId || p.id,
  name: p.name,
  formattedAddress: p.formattedAddress || `${p.name}, Lovely Professional University, NH-44, Phagwara, Punjab 144411, India`,
  location: { lat: p.latitude, lng: p.longitude },
  types: [p.category, p.subcategory],
  googleMapsUrl: p.googleMapsUrl || `https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`,
  isGoogleVerified: p.verificationStatus === 'GOOGLE_MAPS_VERIFIED',
}));

export const GoogleCampusMap: React.FC<GoogleCampusMapProps> = ({
  selectedPlace,
  onSelectPlace,
  startPoint,
  destinationPoint,
  onSetStart,
  onSetDestination,
  activeRoute,
  onViewIndoorStatus,
  onRegisterDirectionsRenderer,
  onSwitchToFreeMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const directionsRendererRef = useRef<any>(null);
  const activeMarkersRef = useRef<any[]>([]);
  const startMarkerRef = useRef<any>(null);
  const destMarkerRef = useRef<any>(null);

  const [mapStatus, setMapStatus] = useState<GoogleMapsStatus>('unconfigured');
  const [mapError, setMapError] = useState<GoogleMapsErrorDetails | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [discoveredPlaces, setDiscoveredPlaces] = useState<GoogleCampusPlace[]>(verifiedCampusPlaces);
  const [isDiscovering, setIsDiscovering] = useState<boolean>(false);

  // Subscribe to API loader status
  useEffect(() => {
    const unsubscribe = subscribeGoogleMapsStatus((status, err) => {
      setMapStatus(status);
      setMapError(err || null);
    });

    // Auto-attempt load if key exists
    if (getGoogleMapsApiKey() && !isGoogleMapsLoaded()) {
      loadGoogleMaps().catch((e) => {
        console.warn('[GoogleCampusMap] Automatic load error', e);
      });
    }

    return () => unsubscribe();
  }, []);

  // Marker Color Coding by Category
  const getMarkerColor = (category: string) => {
    const lower = (category || '').toLowerCase();
    if (lower.includes('academic') || lower.includes('block')) return '#1d4ed8'; // Blue
    if (lower.includes('boys hostel') || lower.includes('bh-') || lower.includes('boys studio')) return '#2563eb'; // Royal Blue
    if (lower.includes('girls hostel') || lower.includes('gh-') || lower.includes('girls studio')) return '#9333ea'; // Purple
    if (lower.includes('medical') || lower.includes('hospital')) return '#e11d48'; // Rose
    if (lower.includes('sports') || lower.includes('stadium') || lower.includes('pool')) return '#059669'; // Emerald
    if (lower.includes('food') || lower.includes('mall') || lower.includes('dining')) return '#d97706'; // Amber
    if (lower.includes('gate')) return '#047857'; // Teal
    return '#475569'; // Slate
  };

  // Render markers on Google Map
  const renderCampusMarkers = useCallback((places: GoogleCampusPlace[], map: any) => {
    const googleMaps = (window as any).google?.maps;
    if (!googleMaps || !map) return;

    // Clear old markers
    activeMarkersRef.current.forEach((m) => m.setMap(null));
    activeMarkersRef.current = [];

    places.forEach((place) => {
      const category = (place.types && place.types[0]) || '';
      const color = getMarkerColor(category);

      const marker = new googleMaps.Marker({
        position: place.location,
        map,
        title: place.name, // EXACT Google Maps Name
        icon: {
          path: googleMaps.SymbolPath.CIRCLE,
          scale: 7,
          fillColor: color,
          fillOpacity: 0.9,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });

      marker.addListener('click', () => {
        onSelectPlace(place);
      });

      activeMarkersRef.current.push(marker);
    });
  }, [onSelectPlace]);

  // Initialize genuine Google Map
  useEffect(() => {
    if (mapStatus !== 'ready' || !mapContainerRef.current) return;
    if (mapRef.current) return; // Prevent duplicate maps

    try {
      console.log('[GoogleCampusMap] Initializing genuine Google Maps instance...');
      const googleMaps = (window as any).google.maps;

      const map = new googleMaps.Map(mapContainerRef.current, {
        center: LPU_CAMPUS_CENTER,
        zoom: 16,
        minZoom: 14,
        maxZoom: 20,
        mapTypeId: googleMaps.MapTypeId.ROADMAP,
        mapTypeControl: true,
        mapTypeControlOptions: {
          style: googleMaps.MapTypeControlStyle.HORIZONTAL_BAR,
          position: googleMaps.ControlPosition.TOP_RIGHT,
        },
        zoomControl: true,
        zoomControlOptions: {
          position: googleMaps.ControlPosition.RIGHT_BOTTOM,
        },
        streetViewControl: true,
        streetViewControlOptions: {
          position: googleMaps.ControlPosition.RIGHT_BOTTOM,
        },
        fullscreenControl: true,
        fullscreenControlOptions: {
          position: googleMaps.ControlPosition.RIGHT_TOP,
        },
        styles: [
          {
            featureType: 'poi.school',
            elementType: 'labels',
            stylers: [{ visibility: 'on' }],
          },
        ],
      });

      // Directions Renderer
      const renderer = new googleMaps.DirectionsRenderer({
        map,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#059669', // Emerald walking line
          strokeOpacity: 0.9,
          strokeWeight: 5,
        },
      });
      directionsRendererRef.current = renderer;
      if (onRegisterDirectionsRenderer) {
        onRegisterDirectionsRenderer(renderer);
      }

      // Map click listener for POIs
      map.addListener('click', (e: any) => {
        if (e.placeId) {
          e.stop();
          const service = new googleMaps.places.PlacesService(map);
          service.getDetails({ placeId: e.placeId }, (result: any, status: any) => {
            if (status === googleMaps.places.PlacesServiceStatus.OK && result) {
              const place = formatGooglePlace(result);
              onSelectPlace(place);
            }
          });
        }
      });

      mapRef.current = map;

      // Render all 71 verified campus markers
      renderCampusMarkers(verifiedCampusPlaces, map);

      // Handle Container Resize
      if ('ResizeObserver' in window && mapContainerRef.current) {
        const ro = new ResizeObserver(() => {
          if (mapRef.current) {
            googleMaps.event.trigger(mapRef.current, 'resize');
          }
        });
        ro.observe(mapContainerRef.current);
      }

      // Also trigger Places API discovery
      discoverKeyCampusLandmarks(map);
    } catch (err: any) {
      console.error('[GoogleCampusMap] Initialization error', err);
      setMapError({
        code: 'INIT_ERROR',
        message: err.message || 'Failed to construct Google Map.',
      });
    }
  }, [mapStatus, onRegisterDirectionsRenderer, onSelectPlace, renderCampusMarkers]);

  // Discover key campus places dynamically through Google Places API
  const discoverKeyCampusLandmarks = useCallback(async (map: any) => {
    setIsDiscovering(true);
    try {
      const queries = [
        'Lovely Professional University Block 34',
        'LPU Block 32',
        'LPU Block 1',
        'Uni-Mall LPU',
        'LPU Hospital',
        'LPU BH-1',
        'LPU GH-1',
      ];
      const aggregated: GoogleCampusPlace[] = [...verifiedCampusPlaces];
      const seenIds = new Set<string>(aggregated.map((p) => p.placeId));

      for (const q of queries) {
        try {
          const results = await searchGoogleCampusPlaces(q, map);
          results.forEach((p) => {
            if (!seenIds.has(p.placeId)) {
              seenIds.add(p.placeId);
              aggregated.push(p);
            }
          });
        } catch (e) {
          // Individual query fallback
        }
      }

      setDiscoveredPlaces(aggregated);
      renderCampusMarkers(aggregated, map);
    } catch (err) {
      console.warn('[GoogleCampusMap] Dynamic campus landmarks discovery error', err);
    } finally {
      setIsDiscovering(false);
    }
  }, [renderCampusMarkers]);

  // Center camera on selected place
  useEffect(() => {
    if (!mapRef.current || !selectedPlace) return;
    mapRef.current.panTo(selectedPlace.location);
    mapRef.current.setZoom(17);
  }, [selectedPlace]);

  // Update Origin and Destination markers
  useEffect(() => {
    const googleMaps = (window as any).google?.maps;
    if (!googleMaps || !mapRef.current) return;

    if (startMarkerRef.current) {
      startMarkerRef.current.setMap(null);
      startMarkerRef.current = null;
    }
    if (startPoint) {
      startMarkerRef.current = new googleMaps.Marker({
        position: { lat: startPoint.lat, lng: startPoint.lng },
        map: mapRef.current,
        title: `Start: ${startPoint.name}`,
        icon: {
          path: googleMaps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#2563eb',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    }

    if (destMarkerRef.current) {
      destMarkerRef.current.setMap(null);
      destMarkerRef.current = null;
    }
    if (destinationPoint) {
      destMarkerRef.current = new googleMaps.Marker({
        position: { lat: destinationPoint.lat, lng: destinationPoint.lng },
        map: mapRef.current,
        title: `Destination: ${destinationPoint.name}`,
        icon: {
          path: googleMaps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: '#059669',
          fillOpacity: 1,
          strokeColor: '#ffffff',
          strokeWeight: 2,
        },
      });
    }
  }, [startPoint, destinationPoint]);

  return (
    <div className="relative w-full h-full flex flex-col overflow-hidden bg-slate-100">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pointer-events-none">
        {/* Real-time Google Place Search Bar */}
        <div className="pointer-events-auto w-full max-w-md">
          <GooglePlaceSearch
            onSelectPlace={(place) => onSelectPlace(place)}
            onNavigateToPlace={(place) => {
              onSetDestination(place.name, place.location.lat, place.location.lng);
              onSelectPlace(place);
            }}
            mapInstance={mapRef.current}
          />
        </div>

        {/* API Key Status & Switcher Controls */}
        <div className="pointer-events-auto flex items-center space-x-2">
          {onSwitchToFreeMap && (
            <button
              onClick={onSwitchToFreeMap}
              className="px-3 py-1.5 rounded-full text-xs font-bold border shadow-md bg-white/95 text-slate-700 border-slate-200 hover:bg-slate-50 transition-all flex items-center space-x-1"
              title="Switch to Leaflet OpenStreetMap Engine"
            >
              <span>🌐 Switch to Leaflet (OSM)</span>
            </button>
          )}

          <button
            onClick={() => setShowApiKeyModal(true)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border shadow-md flex items-center space-x-1.5 transition-all ${
              mapStatus === 'ready'
                ? 'bg-white/95 text-emerald-800 border-emerald-300 hover:bg-emerald-50'
                : 'bg-amber-500 text-white border-amber-600 hover:bg-amber-600'
            }`}
          >
            <Key className="w-3.5 h-3.5" />
            <span>
              {mapStatus === 'ready'
                ? 'Google Maps Connected'
                : 'Configure API Key'}
            </span>
          </button>
        </div>
      </div>

      {/* Main Genuine Google Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-[400px] flex-1"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Non-blocking API Status & Guidance Banner */}
      {mapStatus !== 'ready' && (
        <div className="absolute top-20 left-4 right-4 z-30 max-w-2xl mx-auto bg-amber-50/95 backdrop-blur-md border-2 border-amber-300 rounded-2xl p-4 shadow-xl text-slate-800 pointer-events-auto">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1 text-xs">
              <h4 className="font-bold text-amber-900 text-sm">Official Google Maps Platform Status</h4>
              <p className="mt-1 text-amber-800 leading-relaxed">
                Google Maps API key is configured from environment (<code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">VITE_GOOGLE_MAPS_API_KEY</code>).
                {mapError ? ` Google returned: ${mapError.code} (${mapError.message})` : ' Initializing Google Maps JavaScript API...'}
              </p>
              <div className="mt-2 text-slate-700 bg-white/90 p-2.5 rounded-xl border border-amber-200">
                <p className="font-bold text-slate-900 mb-1">To enable Google Maps Platform services in Google Cloud Console:</p>
                <ol className="list-decimal list-inside space-y-0.5 text-[11px] text-slate-600">
                  <li>In <b>APIs &amp; Services &gt; Library</b>, enable <b>Maps JavaScript API</b>, <b>Places API (New)</b>, and <b>Routes API</b>.</li>
                  <li>In <b>Credentials &gt; API Key</b>, check <b>API restrictions</b> to allow these APIs (or select <i>Don't restrict key</i>).</li>
                  <li>Ensure an active billing account is linked to your Google Cloud project.</li>
                </ol>
              </div>
              <div className="mt-3 flex items-center gap-2">
                {onSwitchToFreeMap && (
                  <button
                    onClick={onSwitchToFreeMap}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1.5 shadow-sm"
                  >
                    <span>🗺️ Use Interactive Campus Map (Leaflet / OSM)</span>
                  </button>
                )}
                <button
                  onClick={() => setShowApiKeyModal(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs transition-colors"
                >
                  Configure Key
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Place Details Card (Bottom Right / Center Mobile) */}
      {selectedPlace && (
        <div className="absolute bottom-6 right-6 z-30 max-w-md w-full pointer-events-auto">
          <GooglePlaceDetails
            place={selectedPlace}
            onClose={() => onSelectPlace(null)}
            onSetStart={onSetStart}
            onSetDestination={onSetDestination}
            onViewIndoorStatus={onViewIndoorStatus}
          />
        </div>
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeyConfigured={() => {
          if (mapContainerRef.current) {
            loadGoogleMaps().catch(console.error);
          }
        }}
      />
    </div>
  );
};
