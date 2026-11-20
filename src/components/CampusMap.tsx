import React, { useEffect, useRef, useState, useCallback } from 'react';
import L from 'leaflet';
import {
  outdoorGeoJson,
  buildings as staticBuildings,
  campusGates as staticCampusGates,
  locationNameOverrides,
  getLocationOverride,
  DUPLICATE_FEATURE_IDS,
  campusMasterInventory as staticMasterInventory,
} from '../data/campusData';
import { Building, CampusGate, RouteResult, UserLocation, CampusPlace } from '../types';
import { AdminLocation } from '../types/adminEditor';
import {
  Layers,
  MapPin,
  Compass,
  ZoomIn,
  ZoomOut,
  Locate,
  Eye,
  EyeOff,
  Navigation,
  Info,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Edit3,
} from 'lucide-react';
import { useCampusData } from '../context/CampusDataContext';

interface CampusMapProps {
  selectedBuilding: Building | null;
  onSelectBuilding: (building: Building) => void;
  startPoint: { name: string; lat: number; lon: number } | null;
  destinationPoint: { name: string; lat: number; lon: number; blockNumber?: string } | null;
  onSetStart: (name: string, lat: number, lon: number) => void;
  onSetDestination: (name: string, lat: number, lon: number, blockNumber?: string) => void;
  activeRoute: RouteResult | null;
  userLocation: UserLocation | null;
  onViewIndoorStatus: (blockNumber: string) => void;
  onOpenAddLocationAt?: (coords: { lat: number; lon: number }) => void;
  onOpenAddEntranceAt?: (coords: { lat: number; lon: number }) => void;
  onMapCenterChange?: (coords: { lat: number; lon: number }) => void;
  isLiveNavigating?: boolean;
  userHeading?: number | null;
  isAutoCentering?: boolean;
  onDisableAutoCentering?: () => void;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  selectedBuilding,
  onSelectBuilding,
  startPoint,
  destinationPoint,
  onSetStart,
  onSetDestination,
  activeRoute,
  userLocation,
  onViewIndoorStatus,
  onOpenAddLocationAt,
  onOpenAddEntranceAt,
  onMapCenterChange,
  isLiveNavigating = false,
  userHeading = null,
  isAutoCentering = true,
  onDisableAutoCentering,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Connect to live reactive database context
  const campusData = useCampusData();
  const {
    locations,
    entrances,
    isEditMode,
    currentTool,
    selectedLocation,
    setSelectedLocation,
    updateLocationPosition,
    saveLocationRecord,
    saveEntranceRecord,
    getPreferredEntranceForBuilding,
    buildings: dynamicBuildings,
    campusGates: dynamicCampusGates,
    campusMasterInventory: dynamicMasterInventory,
  } = campusData || {};

  // Dynamic reactive data arrays from SQLite database context
  const buildings = (dynamicBuildings && dynamicBuildings.length > 0) ? dynamicBuildings : staticBuildings;
  const campusGates = (dynamicCampusGates && dynamicCampusGates.length > 0) ? dynamicCampusGates : staticCampusGates;
  const campusMasterInventory = (dynamicMasterInventory && dynamicMasterInventory.length > 0) ? dynamicMasterInventory : staticMasterInventory;

  // Keep a ref to edit mode callbacks and current locations to avoid recreating Leaflet listeners
  const editModeStateRef = useRef({
    isEditMode: false,
    currentTool: 'select',
    onOpenAddLocationAt,
    onOpenAddEntranceAt,
    locations: [] as AdminLocation[],
    setSelectedLocation,
  });

  useEffect(() => {
    editModeStateRef.current = {
      isEditMode: Boolean(isEditMode),
      currentTool: currentTool || 'select',
      onOpenAddLocationAt,
      onOpenAddEntranceAt,
      locations: locations || [],
      setSelectedLocation,
    };
  }, [isEditMode, currentTool, onOpenAddLocationAt, onOpenAddEntranceAt, locations, setSelectedLocation]);

  // Layer references
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const boundaryLayerRef = useRef<L.GeoJSON | null>(null);
  const buildingsLayerRef = useRef<L.GeoJSON | null>(null);
  const walkwaysLayerRef = useRef<L.GeoJSON | null>(null);
  const facilitiesLayerRef = useRef<L.GeoJSON | null>(null);
  const gatesLayerRef = useRef<L.LayerGroup | null>(null);
  const labelsLayerRef = useRef<L.LayerGroup | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const editLayerRef = useRef<L.LayerGroup | null>(null);
  const userLocationLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const resizeObserverRef = useRef<ResizeObserver | null>(null);

  // Layer visibility state
  const [showBoundary, setShowBoundary] = useState(true);
  const [showBuildings, setShowBuildings] = useState(true);
  const [showWalkways, setShowWalkways] = useState(true);
  const [showFacilities, setShowFacilities] = useState(true);
  const [showGates, setShowGates] = useState(true);
  const [showSmartLabels, setShowSmartLabels] = useState(true);
  // Tile provider state ('osm' default: zero watermarks, 100% free; satellite: Esri World Imagery; streets: Esri World Street Map)
  const [tileProvider, setTileProvider] = useState<'osm' | 'satellite' | 'streets'>('osm');

  // Diagnostic states
  const [mapInitialized, setMapInitialized] = useState(false);
  const [tileLoading, setTileLoading] = useState(false);
  const [tileError, setTileError] = useState(false);
  const [currentZoom, setCurrentZoom] = useState(16);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const [showLayersMenu, setShowLayersMenu] = useState(false);

  // Helper to construct modern popup card
  const createPopupCard = useCallback(
    (params: {
      categoryBadge: string;
      categoryClass: string;
      title: string;
      officialName?: string | null;
      subTitle?: string;
      metaInfo?: string[];
      footprintType?:
        | 'mapped_footprint'
        | 'representative_grid'
        | 'gate_point'
        | 'sports_facility'
        | 'amenity_area'
        | 'campus_boundary'
        | 'point'
        | 'polygon';
      verificationStatus:
        | 'institution_verified'
        | 'osm_verified'
        | 'descriptive_only'
        | 'awaiting_manual_verification'
        | 'GOOGLE_MAPS_VERIFIED'
        | 'MULTI_SOURCE_VERIFIED'
        | 'APPROXIMATE_LOCATION';
      googleMapsUrl?: string;
      formattedAddress?: string;
      googlePlaceId?: string;
      source?: string;
      indoorStatus?: string;
      onStart: () => void;
      onDest: () => void;
      onDetails?: () => void;
    }) => {
      const div = document.createElement('div');
      div.style.minWidth = '250px';
      div.style.maxWidth = '310px';
      div.style.fontFamily = "'Inter', system-ui, -apple-system, sans-serif";

      const isGoogle = params.verificationStatus === 'GOOGLE_MAPS_VERIFIED';
      const isMulti = params.verificationStatus === 'MULTI_SOURCE_VERIFIED';
      const isApprox = params.verificationStatus === 'APPROXIMATE_LOCATION';
      const isInst = params.verificationStatus === 'institution_verified';
      const isOsm = params.verificationStatus === 'osm_verified';
      const isDesc = params.verificationStatus === 'descriptive_only';

      const statusText = isGoogle
        ? '✓ Verified Landmark'
        : isMulti
        ? '✓ Multi-Source Verified'
        : isApprox
        ? '⚠ Approximate Location'
        : isInst
        ? '✓ Institutional Record'
        : isOsm
        ? '✓ OSM Surveyed'
        : isDesc
        ? 'ℹ Descriptive Label'
        : '⚠ Verification Awaited';

      const statusColor = isGoogle || isMulti || isInst
        ? '#047857'
        : isOsm
        ? '#0369a1'
        : isDesc
        ? '#475569'
        : '#b45309';

      let footprintBadgeHtml = '';
      if (params.footprintType === 'representative_grid' || (params.footprintType === 'point' && isApprox)) {
        footprintBadgeHtml = `
          <div style="margin: 4px 0 8px 0; padding: 4px 7px; background-color: #fefce8; border: 1px solid #fef08a; border-radius: 6px; font-size: 10px; font-weight: 700; color: #854d0e; display: flex; align-items: center; gap: 4px;">
            <span>📍</span>
            <span>Approximate Coordinates &bull; Nearest Walkway Snap</span>
          </div>
        `;
      } else if (params.footprintType === 'gate_point') {
        footprintBadgeHtml = `
          <div style="margin: 4px 0 8px 0; padding: 4px 7px; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 6px; font-size: 10px; font-weight: 700; color: #047857; display: flex; align-items: center; gap: 4px;">
            <span>🚪</span>
            <span>Verified Campus Gate Entrance</span>
          </div>
        `;
      } else if (params.footprintType === 'mapped_footprint' || params.footprintType === 'polygon') {
        footprintBadgeHtml = `
          <div style="margin: 4px 0 8px 0; padding: 4px 7px; background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 6px; font-size: 10px; font-weight: 700; color: #0369a1; display: flex; align-items: center; gap: 4px;">
            <span>📐</span>
            <span>Verified Building Footprint &bull; Perimeter Access</span>
          </div>
        `;
      } else {
        footprintBadgeHtml = `
          <div style="margin: 4px 0 8px 0; padding: 4px 7px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 10px; font-weight: 700; color: #475569; display: flex; align-items: center; gap: 4px;">
            <span>📍</span>
            <span>Campus Point Location &bull; Walkway Accessible</span>
          </div>
        `;
      }

      div.innerHTML = `
        <div style="background-color: #f8fafc; padding: 10px 14px; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; gap: 8px;">
          <span style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 9999px; ${params.categoryClass}">
            ${params.categoryBadge}
          </span>
          <span style="font-size: 10px; font-weight: 700; color: ${statusColor}; display: inline-flex; align-items: center; gap: 3px; white-space: nowrap;">
            ${statusText}
          </span>
        </div>
        <div style="padding: 12px 14px;">
          <h4 style="margin: 0 0 4px 0; font-size: 13px; font-weight: 800; color: #0f172a; line-height: 1.3;">
            ${params.title}
          </h4>
          ${params.officialName && params.officialName !== params.title ? `<div style="font-size: 10px; color: #047857; font-weight: 600; margin-bottom: 4px;">Official: ${params.officialName}</div>` : ''}
          ${footprintBadgeHtml}
          ${params.formattedAddress ? `<div style="font-size: 10px; color: #64748b; margin-bottom: 6px; line-height: 1.3;">📍 ${params.formattedAddress}</div>` : ''}
          ${params.googlePlaceId ? `<div style="font-size: 9px; color: #94a3b8; font-family: monospace; margin-bottom: 4px;">Place ID: ${params.googlePlaceId}</div>` : ''}
          ${params.subTitle ? `<p style="margin: 0 0 6px 0; font-size: 11px; color: #64748b; font-weight: 500;">${params.subTitle}</p>` : ''}
          ${
            params.metaInfo && params.metaInfo.length > 0
              ? `<div style="margin-bottom: 8px; font-size: 11px; color: #475569; display: flex; flex-direction: column; gap: 2px;">
                  ${params.metaInfo.map((m) => `<div>&bull; ${m}</div>`).join('')}
                </div>`
              : ''
          }
          <div style="margin: 6px 0 10px 0; padding: 6px 8px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 8px; font-size: 10px; font-weight: 600; color: #92400e;">
            🏢 Indoor Floor Mapping Awaited
          </div>
          ${
            params.googleMapsUrl
              ? `<a href="${params.googleMapsUrl}" target="_blank" rel="noopener noreferrer" style="display: flex; align-items: center; justify-content: center; gap: 5px; margin-bottom: 8px; padding: 5px 8px; font-size: 10px; font-weight: 700; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; border-radius: 6px; text-decoration: none; transition: background 0.15s;">
                  <span>📍 View on Google Maps</span> ↗
                </a>`
              : ''
          }
          ${params.source ? `<div style="font-size: 9px; color: #94a3b8; margin-bottom: 8px; line-height: 1.2;">Source: ${params.source}</div>` : ''}
          <div style="display: flex; gap: 6px; margin-top: 8px;">
            <button id="card-btn-start" style="flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 700; background-color: #2563eb; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s;">
              Start Here
            </button>
            <button id="card-btn-dest" style="flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 700; background-color: #059669; color: #ffffff; border: none; border-radius: 8px; cursor: pointer; transition: background 0.15s;">
              Navigate Here
            </button>
            ${
              params.onDetails
                ? `<button id="card-btn-details" style="padding: 6px 8px; font-size: 11px; font-weight: 700; background-color: #f1f5f9; color: #334155; border: 1px solid #cbd5e1; border-radius: 8px; cursor: pointer;">
                    Info
                  </button>`
                : ''
            }
          </div>
        </div>
      `;

      setTimeout(() => {
        div.querySelector('#card-btn-start')?.addEventListener('click', () => {
          params.onStart();
          mapRef.current?.closePopup();
        });
        div.querySelector('#card-btn-dest')?.addEventListener('click', () => {
          params.onDest();
          mapRef.current?.closePopup();
        });
        if (params.onDetails) {
          div.querySelector('#card-btn-details')?.addEventListener('click', () => {
            params.onDetails!();
            mapRef.current?.closePopup();
          });
        }
      }, 0);

      return div;
    },
    []
  );

  // Update dynamic labels depending on zoom level (Phase 5 + Google Maps Master Inventory)
  const updateSmartLabels = useCallback(
    (zoom: number) => {
      if (!labelsLayerRef.current) return;
      labelsLayerRef.current.clearLayers();

      // In Edit Mode, mute smart labels completely so only interactive edit markers are shown (prevents duplicate pins!)
      if (isEditMode) return;

      if (!showSmartLabels) return;

      const addedPositions = new Set<string>();

      const getPlaceStyle = (place: CampusPlace) => {
        const cat = (place.category || '').toLowerCase();
        if (cat.includes('event') || place.id.startsWith('EVENT_')) return { badgeClass: 'badge-event', icon: '🎉' };
        if (cat.includes('academic')) return { badgeClass: 'badge-academic', icon: '🏢' };
        if (cat.includes('boys') && cat.includes('hostel')) return { badgeClass: 'badge-boys-hostel', icon: '🏠' };
        if (cat.includes('girls') && cat.includes('hostel')) return { badgeClass: 'badge-girls-hostel', icon: '🌸' };
        if (cat.includes('studio')) return { badgeClass: 'badge-studio', icon: '🏢' };
        if (cat.includes('boys')) return { badgeClass: 'badge-boys-hostel', icon: '🏠' };
        if (cat.includes('girls')) return { badgeClass: 'badge-girls-hostel', icon: '🌸' };
        if (cat.includes('apartment') || cat.includes('residence') || cat.includes('staff')) return { badgeClass: 'badge-apartment', icon: '🏘️' };
        if (cat.includes('food') || cat.includes('dining') || cat.includes('cafeteria') || cat.includes('restaurant') || cat.includes('bake')) return { badgeClass: 'badge-food', icon: '🍴' };
        if (cat.includes('medical') || cat.includes('hospital') || cat.includes('pharmacy')) return { badgeClass: 'badge-medical', icon: '🏥' };
        if (cat.includes('sport') || cat.includes('arena') || cat.includes('ground') || cat.includes('stadium')) return { badgeClass: 'badge-sports', icon: '⚽' };
        if (cat.includes('park') || cat.includes('garden') || cat.includes('lawn')) return { badgeClass: 'badge-garden', icon: '🌿' };
        if (cat.includes('auditorium') || cat.includes('venue') || cat.includes('unipolis')) return { badgeClass: 'badge-landmark', icon: '🎪' };
        if (cat.includes('gate')) return { badgeClass: 'badge-gate', icon: '🚪' };
        return { badgeClass: 'badge-facility', icon: '📍' };
      };

      const createPlaceCard = (place: CampusPlace) => {
        const matchedBuilding = place.buildingId
          ? buildings.find((b) => b.id === place.buildingId)
          : undefined;

        const badgeColor =
          place.category === 'Campus Event' || place.category === 'event' || place.id.startsWith('EVENT_')
            ? 'background-color: #faf5ff; color: #6b21a8; border: 1px solid #d8b4fe;'
            : place.category === 'boys_hostel'
            ? 'background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;'
            : place.category === 'girls_hostel'
            ? 'background-color: #fdf4ff; color: #86198f; border: 1px solid #f5d0fe;'
            : place.category === 'boys_studio' || place.category === 'girls_studio'
            ? 'background-color: #f5f3ff; color: #6d28d9; border: 1px solid #ddd6fe;'
            : place.category === 'apartments_staff'
            ? 'background-color: #f0fdfa; color: #0f766e; border: 1px solid #99f6e4;'
            : place.category === 'food_dining'
            ? 'background-color: #fffbeb; color: #b45309; border: 1px solid #fde68a;'
            : place.category === 'medical'
            ? 'background-color: #fff1f2; color: #be123c; border: 1px solid #fecdd3;'
            : place.category === 'sports'
            ? 'background-color: #ecfdf5; color: #047857; border: 1px solid #a7f3d0;'
            : place.category === 'parks_gardens'
            ? 'background-color: #f0fdf4; color: #15803d; border: 1px solid #bbf7d0;'
            : place.category === 'gate'
            ? 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;'
            : 'background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1;';

        return createPopupCard({
          categoryBadge: place.subcategory || (place.category ? place.category.replace(/_/g, ' ') : 'Amenity'),
          categoryClass: badgeColor,
          title: place.name,
          officialName: place.name,
          subTitle: place.notes,
          formattedAddress: place.formattedAddress,
          googleMapsUrl: place.googleMapsUrl,
          googlePlaceId: place.googlePlaceId,
          footprintType:
            place.category === 'gate'
              ? 'gate_point'
              : place.geometryType === 'polygon'
              ? 'mapped_footprint'
              : 'point',
          verificationStatus: place.verificationStatus,
          source: (place.sourceReferences || []).join(', ') || 'Institution Ground Survey',
          metaInfo: [
            `Category: ${place.subcategory || place.category}`,
            `Coords: ${place.latitude.toFixed(5)}, ${place.longitude.toFixed(5)}`,
            ...(matchedBuilding
              ? [`Floors: ${matchedBuilding.floors}`, `Zone: ${matchedBuilding.campus_zone}`]
              : []),
          ],
          onStart: () => onSetStart(place.name, place.latitude, place.longitude),
          onDest: () => {
            const bId = matchedBuilding?.id || place.id;
            const prefEnt = (bId && getPreferredEntranceForBuilding) ? getPreferredEntranceForBuilding(bId) : null;
            if (prefEnt) {
              onSetDestination(
                `${place.name} (${prefEnt.name})`,
                prefEnt.latitude,
                prefEnt.longitude,
                matchedBuilding?.block_number || place.name
              );
            } else {
              onSetDestination(
                place.name,
                place.latitude,
                place.longitude,
                matchedBuilding?.block_number || place.name
              );
            }
          },
          onDetails: matchedBuilding ? () => onSelectBuilding(matchedBuilding) : undefined,
        });
      };

      const addLabelMarker = (
        lat: number,
        lon: number,
        labelHtml: string,
        onClick?: () => void,
        place?: CampusPlace
      ) => {
        const key = `${lat.toFixed(4)},${lon.toFixed(4)}`;
        if (addedPositions.has(key)) return;
        addedPositions.add(key);

        const icon = L.divIcon({
          className: 'custom-map-label-icon',
          html: labelHtml,
          iconSize: [120, 24],
          iconAnchor: [60, 12],
        });

        const marker = L.marker([lat, lon], {
          icon,
          interactive: true,
          zIndexOffset: 100,
        });

        if (place) {
          marker.bindPopup(createPlaceCard(place));
          marker.on('click', (e) => {
            const { isEditMode: editMode } = editModeStateRef.current;
            if (editMode) {
              L.DomEvent.stopPropagation(e);
              marker.closePopup();
              const matchingLoc = locations?.find(
                (l) =>
                  l.id === place.id ||
                  l.id === place.buildingId ||
                  (l.name && l.name.toLowerCase() === place.name.toLowerCase())
              );
              if (matchingLoc) {
                setSelectedLocation?.(matchingLoc);
              }
            }
          });
        } else if (onClick) {
          marker.on('click', onClick);
        }

        labelsLayerRef.current?.addLayer(marker);
      };

      // Render active temporary campus events prominently across all zoom levels
      const eventPlaces = campusMasterInventory.filter(
        (p) => (p.category || '').toLowerCase().includes('event') || p.id.startsWith('EVENT_')
      );
      eventPlaces.forEach((evt) => {
        addLabelMarker(
          evt.latitude,
          evt.longitude,
          `<div class="campus-label-badge badge-event" style="background-color: #6b21a8; color: #ffffff; border: 2px solid #f3e8ff; font-weight: 800; box-shadow: 0 4px 14px rgba(107, 33, 168, 0.45);">🎉 ${evt.name.trim()}</div>`,
          undefined,
          evt
        );
      });

      // ZOOM LEVEL 1 (Entire campus overview: zoom <= 15)
      // Only major entrance gates and prominent campus hubs
      if (zoom <= 15) {
        if (showGates) {
          const keyGates = ['GATE_01_MAIN', 'GATE_LAW', 'GATE_02', 'GATE_04'];
          keyGates.forEach((gid) => {
            const p = campusMasterInventory.find((item) => item.id === gid);
            if (p && p.name && typeof p.latitude === 'number' && typeof p.longitude === 'number' && !isNaN(p.latitude) && !isNaN(p.longitude)) {
              addLabelMarker(
                p.latitude,
                p.longitude,
                `<div class="campus-label-badge badge-gate">🚪 ${p.name.trim()}</div>`,
                undefined,
                p
              );
            }
          });
        }

        if (showBuildings) {
          const hubIds = [
            'BLOCK_01',
            'BLOCK_34',
            'BLOCK_15',
            'BLOCK_37',
            'BLOCK_25',
            'UNIPOLIS',
            'MED_UNI_HOSPITAL',
            'BH_01',
            'GH_01',
            'BS_11',
            'SPORTS_COMPLEX',
            'SPORT_CRICKET_GROUND',
            'BLOCK_57',
            'BH_05',
          ];
          hubIds.forEach((id) => {
            const p = campusMasterInventory.find((item) => item.id === id);
            if (p) {
              const { badgeClass, icon } = getPlaceStyle(p);
              addLabelMarker(
                p.latitude,
                p.longitude,
                `<div class="campus-label-badge ${badgeClass}">${icon} ${p.name.trim()}</div>`,
                undefined,
                p
              );
            }
          });
        }
        return;
      }

      // ZOOM LEVEL 2 (Campus sections: zoom 16 to 17)
      // All gates, academic blocks, hostels, studios, major venues
      if (zoom >= 16 && zoom <= 17) {
        if (showGates) {
          campusMasterInventory
            .filter((p) => (p.category || '').toLowerCase().includes('gate') || p.id.startsWith('GATE_'))
            .forEach((gate) => {
              addLabelMarker(
                gate.latitude,
                gate.longitude,
                `<div class="campus-label-badge badge-gate">🚪 ${gate.name.trim()}</div>`,
                undefined,
                gate
              );
            });
        }

        if (showBuildings) {
          // Major blocks, hostels, studios, apartments, medical, auditoriums
          const sectionFilter = (p: CampusPlace) => {
            const cat = (p.category || '').toLowerCase();
            return (
              cat.includes('academic') ||
              cat.includes('hostel') ||
              cat.includes('studio') ||
              cat.includes('apartment') ||
              cat.includes('residence') ||
              cat.includes('auditorium') ||
              cat.includes('arena') ||
              cat.includes('medical') ||
              cat.includes('hospital') ||
              cat.includes('sport') ||
              cat.includes('food') ||
              cat.includes('dining') ||
              cat.includes('park') ||
              cat.includes('garden') ||
              p.id.startsWith('BLOCK_') ||
              p.id.startsWith('BH_') ||
              p.id.startsWith('GH_') ||
              p.id.startsWith('BS_') ||
              p.id.startsWith('GS_') ||
              p.id.startsWith('LOC_') ||
              p.id.startsWith('PARK_') ||
              p.id.startsWith('FOOD_') ||
              p.id.startsWith('MED_') ||
              p.id.startsWith('SPORTS_')
            );
          };

          campusMasterInventory.filter(sectionFilter).forEach((p) => {
            const { badgeClass, icon } = getPlaceStyle(p);
            addLabelMarker(
              p.latitude,
              p.longitude,
              `<div class="campus-label-badge ${badgeClass}">${icon} ${p.name.trim()}</div>`,
              undefined,
              p
            );
          });
        }
        return;
      }

      // ZOOM LEVEL 3 (Close-up: zoom >= 18)
      // Every single place from the Master Campus Inventory + sports courts & utility features
      if (zoom >= 18) {
        campusMasterInventory.forEach((p) => {
          const isG = (p.category || '').toLowerCase().includes('gate') || p.id.startsWith('GATE_');
          if (isG && !showGates) return;
          if (!isG && !showBuildings && !showFacilities) return;

          const { badgeClass, icon } = getPlaceStyle(p);
          addLabelMarker(
            p.latitude,
            p.longitude,
            `<div class="campus-label-badge ${badgeClass}">${icon} ${p.name.trim()}</div>`,
            undefined,
            p
          );
        });
      }
    },
    [
      isEditMode,
      showSmartLabels,
      showGates,
      showBuildings,
      showFacilities,
      campusMasterInventory,
      buildings,
      onSelectBuilding,
      onSetDestination,
      onSetStart,
      createPopupCard,
    ]
  );

  // Initialize Map
  useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    if (mapRef.current) {
      console.log('[LPU Wayfinder] Map instance already exists; skipping duplicate initialization.');
      return;
    }

    try {
      console.log('[LPU Wayfinder] Initializing Leaflet map with Carto/OSM basemap...');
      const map = L.map(container, {
        center: [31.254, 75.704],
        zoom: 16,
        minZoom: 14,
        maxZoom: 19,
        zoomControl: false,
      });

      // Zoom Control in bottom-right
      L.control.zoom({ position: 'bottomright' }).addTo(map);

      // Track zoom changes for smart labels
      map.on('zoomend', () => {
        const z = map.getZoom();
        setCurrentZoom(z);
      });

      // Default Basemap: OpenStreetMap Standard (100% free, zero watermarks, no API key required)
      const getTileDetails = (provider: 'osm' | 'satellite' | 'streets') => {
        if (provider === 'satellite') {
          return {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; Esri World Imagery &mdash; DigitalGlobe, Earthstar Geographics',
            subdomains: 'abc',
          };
        }
        if (provider === 'streets') {
          return {
            url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
            attribution: '&copy; Esri World Street Map',
            subdomains: 'abc',
          };
        }
        return {
          url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: 'abc',
        };
      };

      const tileConfig = getTileDetails(tileProvider);
      const tileLayer = L.tileLayer(tileConfig.url, {
        attribution: tileConfig.attribution,
        subdomains: tileConfig.subdomains,
        maxZoom: 19,
      }).addTo(map);

      tileLayer.on('loading', () => setTileLoading(true));
      tileLayer.on('load', () => {
        setTileLoading(false);
        setTileError(false);
      });
      tileLayer.on('tileerror', () => {
        setTileLoading(false);
        setTileError(true);
      });
      tileLayerRef.current = tileLayer;

      // 1. Campus Outer Boundary Layer (Relation 21599790)
      const boundaryFeature = (outdoorGeoJson.features as any[]).find(
        (f) => f.properties?.feature_type === 'campus_boundary'
      );
      if (boundaryFeature) {
        const boundaryLayer = L.geoJSON(boundaryFeature, {
          style: {
            color: '#b91c1c', // Crimson
            weight: 2,
            opacity: 0.9,
            fillColor: '#fef2f2',
            fillOpacity: 0.02,
            dashArray: '5, 5',
          },
        }).addTo(map);

        boundaryLayerRef.current = boundaryLayer;

        // Auto-fit bounds
        try {
          const bounds = boundaryLayer.getBounds();
          if (bounds.isValid()) {
            const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
            map.fitBounds(bounds, {
              paddingTopLeft: [isDesktop ? 410 : 25, 25],
              paddingBottomRight: [25, 25],
              maxZoom: 16,
            });
          }
        } catch (e) {
          console.warn('[LPU Wayfinder] Could not auto-fit bounds on boundary:', e);
        }
      }

      // 2. Facilities, Sports, Green Spaces & Utility Layer
      const seenFacilityIds = new Set<string>();
      const facilityFeatures = (outdoorGeoJson.features as any[]).filter((f) => {
        // Exclude School of Design (way/425717552) as it is rendered with buildings
        if (f.id === 'way/425717552') return false;

        // Deduplicate duplicate features identified in audit
        if (DUPLICATE_FEATURE_IDS.has(f.id)) {
          if (seenFacilityIds.has(f.id)) return false;
          seenFacilityIds.add(f.id);
        }

        const ft = f.properties?.feature_type;
        return (
          ft?.startsWith('leisure_') ||
          ft?.startsWith('natural_') ||
          ft?.startsWith('aeroway_') ||
          ft?.startsWith('amenity_') ||
          ft === 'facility'
        );
      });

      console.log(`[LPU Wayfinder] Rendering ${facilityFeatures.length} sports & facility polygons`);

      const facilitiesLayer = L.geoJSON(
        { type: 'FeatureCollection', features: facilityFeatures } as any,
        {
          style: (feature) => {
            const id = feature?.id || '';
            const ft = feature?.properties?.feature_type || '';

            if (ft.includes('water')) {
              return { color: '#0284c7', fillColor: '#e0f2fe', fillOpacity: 0.5, weight: 1 };
            }
            if (id === 'way/422577269') {
              // Cricket ground
              return { color: '#16a34a', fillColor: '#bbf7d0', fillOpacity: 0.5, weight: 1.5 };
            }
            if (ft.includes('pitch')) {
              const sport = feature?.properties?.raw_tags?.sport;
              if (sport === 'basketball') {
                return { color: '#ea580c', fillColor: '#fef3c7', fillOpacity: 0.5, weight: 1.2 };
              }
              return { color: '#f97316', fillColor: '#fed7aa', fillOpacity: 0.5, weight: 1.2 };
            }
            if (ft.includes('park') || ft.includes('grass')) {
              return { color: '#86efac', fillColor: '#dcfce7', fillOpacity: 0.45, weight: 0.8 };
            }
            if (ft.includes('helipad')) {
              return { color: '#8b5cf6', fillColor: '#ede9fe', fillOpacity: 0.55, weight: 2 };
            }
            if (ft.includes('parking')) {
              return { color: '#94a3b8', fillColor: '#f1f5f9', fillOpacity: 0.45, weight: 0.8 };
            }
            if (id === 'way/422820536') {
              // Retail / food plaza
              return { color: '#f59e0b', fillColor: '#fef3c7', fillOpacity: 0.5, weight: 1.2 };
            }
            return { color: '#0d9488', fillColor: '#ccfbf1', fillOpacity: 0.35, weight: 1 };
          },
          onEachFeature: (feature, layer) => {
            const id = feature.id;
            const props = feature.properties || {};
            const override = getLocationOverride(id);

            let label = override?.display_name || props.name;
            if (!label) {
              const ft = props.feature_type || '';
              if (ft.includes('park') || ft.includes('grass')) {
                label = 'Campus Green & Landscaped Garden (Awaiting Name)';
              } else if (ft.includes('water')) {
                label = 'Campus Water Body / Pond';
              } else if (ft.includes('parking')) {
                label = 'Campus Vehicle Parking';
              } else if (ft.includes('pitch')) {
                label = `Outdoor Sports Pitch (${props.raw_tags?.sport || 'General'})`;
              } else {
                label = 'Campus Utility Facility';
              }
            }

            const categoryName =
              override?.category ||
              (props.feature_type ? props.feature_type.replace(/_/g, ' ') : 'Amenity');

            // Popups for interactive facility inspection on click (no hover tooltip)
            if (override && feature.properties?.center) {
              const center = feature.properties.center;
              const masterPlace = campusMasterInventory.find(
                (p) => p.osmFeatureId === id || (override && p.id === override.building_id)
              );
              const card = createPopupCard({
                categoryBadge: override.category ? override.category.replace(/_/g, ' ') : 'Amenity',
                categoryClass: 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;',
                title: masterPlace?.name || override.display_name,
                officialName: override.official_name,
                subTitle: override.notes,
                formattedAddress: masterPlace?.formattedAddress,
                googleMapsUrl: masterPlace?.googleMapsUrl,
                googlePlaceId: masterPlace?.googlePlaceId,
                footprintType: override.footprint_type,
                verificationStatus: (masterPlace?.verificationStatus as any) || override.verification_status || 'osm_verified',
                source: (masterPlace?.sourceReferences || []).join(', ') || override.source || 'OpenStreetMap Ground Survey',
                onStart: () => onSetStart(masterPlace?.name || override.display_name, center[0], center[1]),
                onDest: () => onSetDestination(masterPlace?.name || override.display_name, center[0], center[1]),
              });
              layer.bindPopup(card);
            }
          },
        }
      ).addTo(map);
      facilitiesLayerRef.current = facilitiesLayer;

      // 3. Walkways & Roads Layer
      const walkwayFeatures = (outdoorGeoJson.features as any[]).filter(
        (f) => f.properties?.feature_type === 'walkway_road'
      );
      console.log(`[LPU Wayfinder] Rendering ${walkwayFeatures.length} pedestrian walkways and roads`);

      const walkwaysLayer = L.geoJSON(
        { type: 'FeatureCollection', features: walkwayFeatures } as any,
        {
          style: (feature) => {
            const hw = feature?.properties?.raw_tags?.highway || '';
            const isDedicatedWalkway = ['footway', 'path', 'pedestrian', 'living_street'].includes(hw);
            return {
              color: isDedicatedWalkway ? '#475569' : '#64748b',
              weight: isDedicatedWalkway ? 1.8 : 2.2,
              opacity: 0.8,
              dashArray: isDedicatedWalkway ? '3, 4' : undefined,
            };
          },
        }
      ).addTo(map);
      walkwaysLayerRef.current = walkwaysLayer;

      // 4. Buildings Footprint Layer (including School of Design)
      const buildingFeatures = (outdoorGeoJson.features as any[]).filter(
        (f) => f.properties?.feature_type === 'building' || f.id === 'way/425717552'
      );
      console.log(`[LPU Wayfinder] Rendering ${buildingFeatures.length} building footprints`);

      const buildingsLayer = L.geoJSON(
        { type: 'FeatureCollection', features: buildingFeatures } as any,
        {
          style: (feature) => {
            const osmId = feature?.properties?.osm_id;
            const override = getLocationOverride(feature?.id || osmId);

            // Muted, restrained professional neutral fill
            return {
              color: override ? '#64748b' : '#94a3b8',
              weight: override ? 1.4 : 1.1,
              opacity: 0.9,
              fillColor: override ? '#cbd5e1' : '#e2e8f0',
              fillOpacity: override ? 0.65 : 0.45,
            };
          },
          onEachFeature: (feature, layer) => {
            const osmId = feature.properties?.osm_id;
            const levels = feature.properties?.levels || '?';
            const override = getLocationOverride(feature.id || osmId);
            const matchedBuilding = buildings.find(
              (b) => b.osm_way_id === osmId || (override && b.id === override.building_id)
            );

            // Canonical manually assigned name takes absolute precedence
            const title = matchedBuilding
              ? matchedBuilding.name
              : override
              ? override.display_name
              : `Campus Building (OSM Way ${osmId})`;

            // Note: Hover tooltip removed per user request (media_1795186805979_fe81db44.jpg)
            // Information remains accessible via interactive click popup card below

            // Bind clean information popup card
            const center = feature.properties?.center || [31.254, 75.704];
            const badgeClass =
              override?.category === 'boys_hostel'
                ? 'background-color: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;'
                : override?.category === 'girls_hostel'
                ? 'background-color: #fdf4ff; color: #86198f; border: 1px solid #f5d0fe;'
                : 'background-color: #f1f5f9; color: #0f172a; border: 1px solid #cbd5e1;';

            const masterPlace = matchedBuilding
              ? campusMasterInventory.find((p) => p.buildingId === matchedBuilding.id)
              : undefined;

            const card = createPopupCard({
              categoryBadge: (override?.category ? override.category.replace(/_/g, ' ') : undefined) || matchedBuilding?.category || 'Building',
              categoryClass: badgeClass,
              title: title,
              officialName: override?.official_name || masterPlace?.name,
              subTitle: matchedBuilding?.description || override?.notes,
              formattedAddress: masterPlace?.formattedAddress,
              googleMapsUrl: masterPlace?.googleMapsUrl,
              googlePlaceId: masterPlace?.googlePlaceId,
              footprintType: override?.footprint_type || (matchedBuilding?.osm_way_id ? 'mapped_footprint' : 'representative_grid'),
              metaInfo: matchedBuilding
                ? [
                    `Floors: ${matchedBuilding.floors || 4}`,
                    `Zone: ${matchedBuilding.campus_zone || 'LPU Campus'}`,
                    `Occupants: ${(matchedBuilding.primary_occupants || []).slice(0, 2).join(', ') || matchedBuilding.category}`,
                  ]
                : [`Floors: ${levels}`, `Footprint ID: Way ${osmId}`],
              verificationStatus: (masterPlace?.verificationStatus as any) || override?.verification_status || (matchedBuilding ? 'institution_verified' : 'awaiting_manual_verification'),
              source: override?.source || (masterPlace?.sourceReferences || []).join(', ') || matchedBuilding?.source || 'OpenStreetMap Satellite Survey',
              onStart: () => onSetStart(title, center[0], center[1]),
              onDest: () => {
                const prefEnt = (matchedBuilding && getPreferredEntranceForBuilding) ? getPreferredEntranceForBuilding(matchedBuilding.id) : null;
                if (prefEnt) {
                  onSetDestination(`${title} (${prefEnt.name})`, prefEnt.latitude, prefEnt.longitude, matchedBuilding?.block_number);
                } else {
                  onSetDestination(title, center[0], center[1], matchedBuilding?.block_number);
                }
              },
              onDetails: matchedBuilding ? () => onSelectBuilding(matchedBuilding) : undefined,
            });

            layer.bindPopup(card);

            // Hover interactions & Edit Mode click integration
            (layer as any).on({
              mouseover: (e: any) => {
                const target = e.target;
                target.setStyle({
                  weight: 2.2,
                  color: '#059669',
                  fillColor: '#a7f3d0',
                  fillOpacity: 0.75,
                });
              },
              mouseout: (e: any) => {
                buildingsLayer.resetStyle(e.target);
              },
              click: (e: any) => {
                const { isEditMode: editMode, locations: currentLocs, setSelectedLocation: setSel } = editModeStateRef.current;
                if (editMode) {
                  L.DomEvent.stopPropagation(e);
                  layer.closePopup();

                  // Find matching location in live locations context
                  let targetLoc = currentLocs?.find(
                    (l) =>
                      l.id === matchedBuilding?.id ||
                      (override && l.id === override.building_id) ||
                      (l.name && title && l.name.toLowerCase() === title.toLowerCase()) ||
                      (matchedBuilding && l.name.toLowerCase().includes(matchedBuilding.name.toLowerCase()))
                  );

                  if (targetLoc) {
                    setSel?.(targetLoc);
                  } else {
                    // Any unmapped building footprint is also editable!
                    const newLoc: AdminLocation = {
                      id: matchedBuilding?.id || (override ? override.building_id : `BUILDING_${osmId}`),
                      name: title,
                      exactName: title,
                      category: override?.category
                        ? override.category.replace(/_/g, ' ')
                        : matchedBuilding?.category || 'Academic Blocks',
                      subcategory: matchedBuilding?.subcategory || feature.properties?.raw_tags?.amenity || '',
                      latitude: Number(center[0].toFixed(6)),
                      longitude: Number(center[1].toFixed(6)),
                      description: matchedBuilding?.description || `Campus building located at OSM Way ${osmId}`,
                      verificationStatus: 'awaiting_manual_verification',
                      isInsideCampus: true,
                    };
                    setSel?.(newLoc);
                  }
                } else {
                  if (matchedBuilding) {
                    onSelectBuilding(matchedBuilding);
                  }
                }
              },
            });
          },
        }
      ).addTo(map);
      buildingsLayerRef.current = buildingsLayer;

      // 5. Entrance Gates Layer
      gatesLayerRef.current = L.layerGroup().addTo(map);

      // 6. Smart Cartographic Labels Layer (Phase 5)
      labelsLayerRef.current = L.layerGroup().addTo(map);

      // 7. Dynamic Markers, GPS, Edit and Route Layers
      markersLayerRef.current = L.layerGroup().addTo(map);
      editLayerRef.current = L.layerGroup().addTo(map);
      userLocationLayerRef.current = L.layerGroup().addTo(map);
      routeLayerRef.current = L.layerGroup().addTo(map);

      // Map Click Handler for Map Editor Add tools
      map.on('click', (e: L.LeafletMouseEvent) => {
        const {
          isEditMode: editMode,
          currentTool: tool,
          onOpenAddLocationAt: addLoc,
          onOpenAddEntranceAt: addEnt,
        } = editModeStateRef.current;

        if (editMode) {
          if (tool === 'add_location') {
            addLoc?.({
              lat: Number(e.latlng.lat.toFixed(6)),
              lon: Number(e.latlng.lng.toFixed(6)),
            });
          } else if (tool === 'add_entrance') {
            addEnt?.({
              lat: Number(e.latlng.lat.toFixed(6)),
              lon: Number(e.latlng.lng.toFixed(6)),
            });
          }
        }
      });

      mapRef.current = map;
      setMapInitialized(true);
      console.log('[LPU Wayfinder] Leaflet map instance initialized successfully.');

      // Invalidate sizes
      requestAnimationFrame(() => map.invalidateSize());
      const t1 = setTimeout(() => map.invalidateSize(), 100);
      const t2 = setTimeout(() => map.invalidateSize(), 300);
      const t3 = setTimeout(() => map.invalidateSize(), 600);

      // ResizeObserver
      if ('ResizeObserver' in window) {
        const ro = new ResizeObserver((entries) => {
          for (const entry of entries) {
            const { width, height } = entry.contentRect;
            setContainerSize({ width: Math.round(width), height: Math.round(height) });
            if (width > 0 && height > 0) {
              map.invalidateSize();
            }
          }
        });
        ro.observe(container);
        resizeObserverRef.current = ro;
      }

      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        clearTimeout(t3);
      };
    } catch (err) {
      console.error('[LPU Wayfinder] Error initializing Leaflet map:', err);
    }

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect();
        resizeObserverRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      if (mapContainerRef.current) {
        delete (mapContainerRef.current as any)._leaflet_id;
        mapContainerRef.current.innerHTML = '';
      }
      setMapInitialized(false);
    };
  }, [createPopupCard, onSetDestination, onSetStart, onSelectBuilding, tileProvider]);

  // Track visible center of map so newly added landmarks always originate directly within the user's visible screen
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapInitialized) return;

    const handleCenterChange = () => {
      const center = map.getCenter();
      onMapCenterChange?.({
        lat: Number(center.lat.toFixed(6)),
        lon: Number(center.lng.toFixed(6)),
      });
    };

    map.on('moveend', handleCenterChange);
    map.on('zoomend', handleCenterChange);
    handleCenterChange();

    return () => {
      map.off('moveend', handleCenterChange);
      map.off('zoomend', handleCenterChange);
    };
  }, [mapInitialized, onMapCenterChange]);

  // Auto-focus on selected location in Edit Mode (so newly added or clicked landmarks are immediately brought to screen center)
  const prevSelectedLocationIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mapRef.current || !isEditMode || !selectedLocation) return;
    if (selectedLocation.id !== prevSelectedLocationIdRef.current) {
      prevSelectedLocationIdRef.current = selectedLocation.id;
      if (
        typeof selectedLocation.latitude === 'number' &&
        typeof selectedLocation.longitude === 'number' &&
        !isNaN(selectedLocation.latitude) &&
        !isNaN(selectedLocation.longitude)
      ) {
        mapRef.current.flyTo(
          [selectedLocation.latitude, selectedLocation.longitude],
          Math.max(mapRef.current.getZoom(), 17),
          { duration: 0.6 }
        );
      }
    }
  }, [selectedLocation, isEditMode]);

  // Synchronize Smart Labels on Zoom, Edit Mode, Data Changes & Layer Toggles
  useEffect(() => {
    if (!mapRef.current) return;
    updateSmartLabels(currentZoom);
  }, [currentZoom, updateSmartLabels, isEditMode, showSmartLabels, showBuildings, showGates, showFacilities, campusMasterInventory]);

  // Synchronize Entrance Gates Layer
  useEffect(() => {
    if (!mapRef.current || !gatesLayerRef.current) return;
    gatesLayerRef.current.clearLayers();

    // In Edit Mode, entrance gates are edited and displayed cleanly via editLayerRef; clear here to prevent duplicate gate pins!
    if (isEditMode || !showGates) return;

    (campusGates || []).forEach((gate) => {
      const lat = gate.coordinates ? gate.coordinates[1] : (gate as any).latitude;
      const lon = gate.coordinates ? gate.coordinates[0] : (gate as any).longitude;
      if (typeof lat !== 'number' || typeof lon !== 'number' || isNaN(lat) || isNaN(lon)) return;

      const gateIcon = L.divIcon({
        className: 'custom-gate-pin',
        html: `
          <div style="position: relative; cursor: pointer; text-align: center;">
            <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #065f46; color: white; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 2px solid white; font-size: 14px; font-weight: bold;">
              🚪
            </div>
            <div style="position: absolute; bottom: -3px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background-color: #065f46;"></div>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([lat, lon], { icon: gateIcon });

      const gateCleanName = ((gate.name || '').split('(')[0] || '').toLowerCase().trim();
      const masterGate = campusMasterInventory.find(
        (p) =>
          (p.category === 'gate' || p.category === 'Campus Gates') &&
          (p.name || '').toLowerCase().includes(gateCleanName)
      );

      const card = createPopupCard({
        categoryBadge: 'Campus Entrance Gate',
        categoryClass: 'background-color: #ecfdf5; color: #065f46; border: 1px solid #a7f3d0;',
        title: gate.name || 'Campus Gate',
        officialName: gate.name || 'Campus Gate',
        subTitle: gate.description,
        formattedAddress: masterGate?.formattedAddress,
        googleMapsUrl: masterGate?.googleMapsUrl,
        googlePlaceId: masterGate?.googlePlaceId,
        footprintType: 'gate_point',
        verificationStatus: (masterGate?.verificationStatus as any) || 'GOOGLE_MAPS_VERIFIED',
        source: (masterGate?.sourceReferences || []).join(', ') || gate.source || 'Campus Perimeter Gate',
        onStart: () => onSetStart(gate.name, lat, lon),
        onDest: () => onSetDestination(gate.name, lat, lon, 'Gate'),
      });

      marker.bindPopup(card);
      gatesLayerRef.current?.addLayer(marker);
    });
  }, [campusGates, isEditMode, showGates, createPopupCard, onSetStart, onSetDestination, campusMasterInventory]);

  // Tile Provider Switcher
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current) return;
    mapRef.current.removeLayer(tileLayerRef.current);

    let url = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    let attribution = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    if (tileProvider === 'satellite') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri World Imagery &mdash; DigitalGlobe, Earthstar Geographics';
    } else if (tileProvider === 'streets') {
      url = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}';
      attribution = '&copy; Esri World Street Map';
    }

    const newLayer = L.tileLayer(url, {
      attribution,
      subdomains: 'abc',
      maxZoom: 19,
    }).addTo(mapRef.current);

    newLayer.on('loading', () => setTileLoading(true));
    newLayer.on('load', () => {
      setTileLoading(false);
      setTileError(false);
    });
    newLayer.on('tileerror', () => {
      setTileLoading(false);
      setTileError(true);
    });

    tileLayerRef.current = newLayer;
  }, [tileProvider]);

  // Layer Toggles
  useEffect(() => {
    if (!boundaryLayerRef.current || !mapRef.current) return;
    if (showBoundary) mapRef.current.addLayer(boundaryLayerRef.current);
    else mapRef.current.removeLayer(boundaryLayerRef.current);
  }, [showBoundary]);

  useEffect(() => {
    if (!walkwaysLayerRef.current || !mapRef.current) return;
    if (showWalkways) mapRef.current.addLayer(walkwaysLayerRef.current);
    else mapRef.current.removeLayer(walkwaysLayerRef.current);
  }, [showWalkways]);

  useEffect(() => {
    if (!buildingsLayerRef.current || !mapRef.current) return;
    if (showBuildings) mapRef.current.addLayer(buildingsLayerRef.current);
    else mapRef.current.removeLayer(buildingsLayerRef.current);
  }, [showBuildings]);

  useEffect(() => {
    if (!facilitiesLayerRef.current || !mapRef.current) return;
    if (showFacilities) mapRef.current.addLayer(facilitiesLayerRef.current);
    else mapRef.current.removeLayer(facilitiesLayerRef.current);
  }, [showFacilities]);

  useEffect(() => {
    if (!gatesLayerRef.current || !mapRef.current) return;
    if (showGates) mapRef.current.addLayer(gatesLayerRef.current);
    else mapRef.current.removeLayer(gatesLayerRef.current);
  }, [showGates]);

  useEffect(() => {
    if (!labelsLayerRef.current || !mapRef.current) return;
    if (showSmartLabels) mapRef.current.addLayer(labelsLayerRef.current);
    else mapRef.current.removeLayer(labelsLayerRef.current);
  }, [showSmartLabels]);

  // User drag listener to disable auto-centering during live navigation
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const handleDragStart = () => {
      if (isLiveNavigating) {
        onDisableAutoCentering?.();
      }
    };
    map.on('dragstart', handleDragStart);
    return () => {
      map.off('dragstart', handleDragStart);
    };
  }, [isLiveNavigating, onDisableAutoCentering]);

  // GPS User Location Marker & Navigation Tracking
  useEffect(() => {
    if (!mapRef.current || !userLocationLayerRef.current) return;
    userLocationLayerRef.current.clearLayers();

    if (userLocation) {
      const { lat, lon, accuracy } = userLocation;

      const accuracyCircle = L.circle([lat, lon], {
        radius: Math.min(accuracy, isLiveNavigating ? 60 : 150),
        color: '#2563eb',
        fillColor: '#3b82f6',
        fillOpacity: isLiveNavigating ? 0.12 : 0.15,
        weight: isLiveNavigating ? 1.2 : 1.5,
      });

      const headingHtml =
        isLiveNavigating && userHeading !== null && !isNaN(userHeading)
          ? `<div class="live-nav-heading-arrow" style="transform: rotate(${userHeading}deg);"></div>`
          : '';

      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div class="live-nav-marker-wrapper">
            ${isLiveNavigating ? '<div class="live-nav-pulse-ring"></div>' : ''}
            ${headingHtml}
            <div class="gps-marker-dot" style="width: ${isLiveNavigating ? '22px' : '18px'}; height: ${isLiveNavigating ? '22px' : '18px'}; border-radius: 50%; background-color: #2563eb; border: 3px solid white; box-shadow: 0 0 12px rgba(37,99,235,0.8); z-index: 2;"></div>
            <div style="position: absolute; width: 6px; height: 6px; border-radius: 50%; background-color: white; z-index: 3;"></div>
          </div>
        `,
        iconSize: [40, 40],
        iconAnchor: [20, 20],
      });

      const userMarker = L.marker([lat, lon], { icon: userIcon, zIndexOffset: 800 });
      userLocationLayerRef.current.addLayer(accuracyCircle);
      userLocationLayerRef.current.addLayer(userMarker);

      // Auto-centering in Live Navigation Mode
      if (isLiveNavigating && isAutoCentering) {
        const currentZoom = mapRef.current.getZoom();
        if (currentZoom < 17) {
          mapRef.current.setView([lat, lon], 18, { animate: true });
        } else {
          mapRef.current.panTo([lat, lon], { animate: true, duration: 0.6 });
        }
      }
    }
  }, [userLocation, isLiveNavigating, userHeading, isAutoCentering]);

  // Selected Building / Start / Destination Markers
  useEffect(() => {
    if (!mapRef.current || !markersLayerRef.current) return;
    markersLayerRef.current.clearLayers();

    if (startPoint) {
      const startIcon = L.divIcon({
        className: 'custom-start-pin',
        html: `
          <div style="width: 28px; height: 28px; border-radius: 50%; background-color: #2563eb; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 12px; border: 2px solid white; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3);">
            A
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const startMarker = L.marker([startPoint.lat, startPoint.lon], { icon: startIcon });
      startMarker.bindTooltip(`<b>Start:</b> ${startPoint.name}`, { direction: 'top' });
      markersLayerRef.current.addLayer(startMarker);
    }

    if (destinationPoint) {
      const destIcon = L.divIcon({
        className: 'custom-dest-pin',
        html: `
          <div style="width: 32px; height: 32px; border-radius: 50%; background-color: #059669; color: white; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 14px; border: 2px solid white; box-shadow: 0 6px 10px -1px rgba(0,0,0,0.35);">
            B
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });
      const destMarker = L.marker([destinationPoint.lat, destinationPoint.lon], { icon: destIcon });
      destMarker.bindTooltip(`<b>Destination:</b> ${destinationPoint.name}`, { permanent: true, direction: 'top' });
      markersLayerRef.current.addLayer(destMarker);
    }

    // Only render visitor building badge when not in Edit Mode (in Edit Mode, editLayerRef renders clean draggable marker)
    if (!isEditMode && selectedBuilding && (!destinationPoint || destinationPoint.name !== selectedBuilding.name)) {
      const bIcon = L.divIcon({
        className: 'custom-building-pin',
        html: `
          <div style="padding: 4px 8px; background-color: #0f172a; color: white; font-size: 11px; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.3); border: 1px solid #334155; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap;">
            <span>🏢</span>
            <span>Block ${selectedBuilding.block_number}</span>
          </div>
        `,
        iconSize: [80, 26],
        iconAnchor: [40, 26],
      });
      const bMarker = L.marker(
        [selectedBuilding.coordinates.latitude, selectedBuilding.coordinates.longitude],
        { icon: bIcon }
      );
      markersLayerRef.current.addLayer(bMarker);

      mapRef.current.flyTo(
        [selectedBuilding.coordinates.latitude, selectedBuilding.coordinates.longitude],
        17,
        { duration: 0.8 }
      );
    }
  }, [selectedBuilding, startPoint, destinationPoint, isEditMode]);

  // Route Polyline
  useEffect(() => {
    if (!mapRef.current || !routeLayerRef.current) return;
    routeLayerRef.current.clearLayers();

    if (activeRoute && activeRoute.found && activeRoute.pathCoordinates.length > 0) {
      console.log(`[LPU Wayfinder] Rendering active route with ${activeRoute.pathCoordinates.length} vertices (mode: ${activeRoute.mode || 'walk'})`);

      const isVehicle = activeRoute.mode === 'vehicle';
      const routeColor = isVehicle ? '#2563eb' : '#059669';
      const haloColor = isVehicle ? '#dbeafe' : '#ffffff';

      // Halo border for maximum contrast
      const haloPolyline = L.polyline(activeRoute.pathCoordinates, {
        color: haloColor,
        weight: isVehicle ? 9 : 8,
        opacity: 0.9,
      });

      // Route polyline (Royal blue for vehicle, Emerald for walk)
      const routePolyline = L.polyline(activeRoute.pathCoordinates, {
        color: routeColor,
        weight: isVehicle ? 5.5 : 5,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round',
      });

      routeLayerRef.current.addLayer(haloPolyline);
      routeLayerRef.current.addLayer(routePolyline);

      try {
        const bounds = routePolyline.getBounds();
        if (bounds.isValid() && !isLiveNavigating) {
          mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 18 });
        }
      } catch (e) {
        console.warn('[LPU Wayfinder] Could not fit bounds to route:', e);
      }
    }
  }, [activeRoute, isLiveNavigating]);

  // Admin Map Editor Overlay Layer (Phase 7.0)
  useEffect(() => {
    if (!mapRef.current || !editLayerRef.current) return;
    editLayerRef.current.clearLayers();

    if (!isEditMode) {
      if (mapContainerRef.current) {
        mapContainerRef.current.style.cursor = '';
      }
      return;
    }

    // Set cursor based on active editor tool
    if (mapContainerRef.current) {
      if (currentTool === 'add_location' || currentTool === 'add_entrance') {
        mapContainerRef.current.style.cursor = 'crosshair';
      } else if (currentTool === 'move') {
        mapContainerRef.current.style.cursor = 'move';
      } else {
        mapContainerRef.current.style.cursor = 'default';
      }
    }

    // 1. Render entrances and dashed leader lines to building centroids
    if (entrances && locations) {
      entrances.forEach((ent) => {
        const parentBuilding = locations.find((l) => l.id === ent.buildingId);

        // Draw leader line if parent building exists
        if (parentBuilding) {
          const leaderLine = L.polyline(
            [
              [parentBuilding.latitude, parentBuilding.longitude],
              [ent.latitude, ent.longitude],
            ],
            {
              color: ent.isPreferred ? '#059669' : '#d97706',
              weight: 2,
              dashArray: '4, 6',
              opacity: 0.8,
            }
          );
          editLayerRef.current?.addLayer(leaderLine);
        }

        // Entrance Door Marker
        const isPref = ent.isPreferred;
        const doorColor = isPref ? '#059669' : ent.isRestricted ? '#dc2626' : '#d97706';
        const doorHtml = `
          <div style="cursor: ${currentTool === 'move' ? 'grab' : 'pointer'}; position: relative; display: inline-flex; align-items: center;">
            <div style="background-color: ${doorColor}; color: white; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 800; border: 1.5px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3); display: flex; align-items: center; gap: 3px; white-space: nowrap;">
              <span>🚪</span>
              <span>${ent.name}</span>
              ${isPref ? '<span style="color: #fef08a;">★</span>' : ''}
            </div>
            <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 6px; height: 6px; background-color: ${doorColor}; border-bottom: 1.5px solid white; border-right: 1.5px solid white;"></div>
          </div>
        `;

        const entMarker = L.marker([ent.latitude, ent.longitude], {
          icon: L.divIcon({
            className: 'admin-entrance-pin',
            html: doorHtml,
            iconSize: [90, 22],
            iconAnchor: [45, 22],
          }),
          draggable: currentTool === 'move',
          autoPan: true,
          zIndexOffset: 700,
        });

        if (currentTool === 'move') {
          entMarker.bindTooltip(
            `<b>🚪 ${ent.name}</b><br/><span style="font-family: monospace; font-size: 10px;">${ent.latitude.toFixed(6)}, ${ent.longitude.toFixed(6)}</span>`,
            { direction: 'top', offset: [0, -12] }
          );

          entMarker.on('drag', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            entMarker.setTooltipContent(
              `<b>🚪 ${ent.name}</b><br/><span style="font-family: monospace; font-size: 10px; color: #059669; font-weight: bold;">${lat.toFixed(6)}, ${lng.toFixed(6)}</span>`
            );
            entMarker.openTooltip();
          });

          entMarker.on('dragend', async (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            try {
              await saveEntranceRecord?.({
                id: ent.id,
                latitude: Number(lat.toFixed(6)),
                longitude: Number(lng.toFixed(6)),
              });
            } catch (err) {
              console.error('Failed to save entrance drag:', err);
            }
          });
        }

        entMarker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          if (parentBuilding) {
            setSelectedLocation?.(parentBuilding);
          }
        });

        editLayerRef.current?.addLayer(entMarker);
      });
    }

    // 2. Render all location markers
    if (locations) {
      locations.forEach((loc) => {
        if (!loc || typeof loc.latitude !== 'number' || typeof loc.longitude !== 'number' || isNaN(loc.latitude) || isNaN(loc.longitude)) {
          return;
        }

        const isSelected = selectedLocation?.id === loc.id;
        const isMovable = currentTool !== 'add_location' && currentTool !== 'add_entrance';

        // Choose category badge colors safely
        const cat = (loc.category || '').toLowerCase();
        let catColor = '#1e293b';
        let badgeIcon = '📍';
        if (cat.includes('academic')) {
          catColor = '#059669';
          badgeIcon = '🏫';
        } else if (cat.includes('boys')) {
          catColor = '#1d4ed8';
          badgeIcon = '🏢';
        } else if (cat.includes('girls')) {
          catColor = '#a21caf';
          badgeIcon = '🌸';
        } else if (cat.includes('food') || cat.includes('dining') || cat.includes('restaurant')) {
          catColor = '#d97706';
          badgeIcon = '🍔';
        } else if (cat.includes('medical') || cat.includes('hospital')) {
          catColor = '#dc2626';
          badgeIcon = '🏥';
        } else if (cat.includes('park') || cat.includes('garden')) {
          catColor = '#15803d';
          badgeIcon = '🌳';
        } else if (cat.includes('gate')) {
          catColor = '#065f46';
          badgeIcon = '🚪';
        } else if (cat.includes('sports')) {
          catColor = '#0d9488';
          badgeIcon = '⚽';
        }

        const borderColor = isSelected ? '#f59e0b' : 'white';
        const shadow = isSelected
          ? '0 0 0 3px rgba(245, 158, 11, 0.4), 0 8px 16px rgba(0,0,0,0.3)'
          : '0 3px 8px rgba(0,0,0,0.25)';

        const markerHtml = `
          <div style="position: relative; cursor: ${isMovable ? 'grab' : 'pointer'}; transform: ${
          isSelected ? 'scale(1.1)' : 'scale(1)'
        }; transition: transform 0.15s ease-out; text-align: center;">
            <div style="background-color: ${catColor}; color: white; padding: 3px 8px; border-radius: 8px; font-size: 11px; font-weight: 700; border: 2px solid ${borderColor}; box-shadow: ${shadow}; display: inline-flex; align-items: center; gap: 4px; white-space: nowrap; max-width: 170px; overflow: hidden; text-overflow: ellipsis;">
              <span>${isMovable ? '✥' : badgeIcon}</span>
              <span style="overflow: hidden; text-overflow: ellipsis;">${loc.name}</span>
            </div>
            <div style="position: absolute; bottom: -5px; left: 50%; transform: translateX(-50%) rotate(45deg); width: 8px; height: 8px; background-color: ${catColor}; border-bottom: 2px solid ${borderColor}; border-right: 2px solid ${borderColor};"></div>
          </div>
        `;

        const marker = L.marker([loc.latitude, loc.longitude], {
          icon: L.divIcon({
            className: 'admin-location-marker',
            html: markerHtml,
            iconSize: [140, 28],
            iconAnchor: [70, 28],
          }),
          draggable: isMovable,
          autoPan: true,
          autoPanPadding: [50, 50],
          zIndexOffset: isSelected ? 1000 : 350,
        });

        // Smooth Leaflet drag WITHOUT destroying markers on every pixel!
        if (isMovable) {
          marker.bindTooltip(
            `<b>${loc.name}</b><br/><span style="font-family: monospace; font-size: 10px;">${loc.latitude.toFixed(6)}, ${loc.longitude.toFixed(6)}</span>`,
            { direction: 'top', offset: [0, -15], opacity: 0.95 }
          );

          marker.on('dragstart', () => {
            marker.closeTooltip();
          });

          marker.on('drag', (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            marker.setTooltipContent(
              `<b>${loc.name}</b><br/><span style="font-family: monospace; font-size: 10px; color: #059669; font-weight: bold;">${lat.toFixed(6)}° N, ${lng.toFixed(6)}° E</span>`
            );
            marker.openTooltip();
          });

          // Save on dragend permanently - ONLY triggered on mouse release!
          marker.on('dragend', async (e: any) => {
            const { lat, lng } = e.target.getLatLng();
            const newLat = Number(lat.toFixed(6));
            const newLon = Number(lng.toFixed(6));
            updateLocationPosition?.(loc.id, newLat, newLon);
            try {
              await saveLocationRecord?.({
                id: loc.id,
                latitude: newLat,
                longitude: newLon,
              });
            } catch (err) {
              console.error('Failed to save dragged location:', err);
            }
          });
        }

        // Click selects location for editing in Drawer
        marker.on('click', (e) => {
          L.DomEvent.stopPropagation(e);
          setSelectedLocation?.(loc);
        });

        editLayerRef.current?.addLayer(marker);
      });
    }
  }, [
    mapInitialized,
    isEditMode,
    currentTool,
    locations,
    entrances,
    selectedLocation,
    updateLocationPosition,
    saveLocationRecord,
    saveEntranceRecord,
    setSelectedLocation,
  ]);

  const handleResetView = () => {
    if (!mapRef.current) return;
    if (boundaryLayerRef.current) {
      const bounds = boundaryLayerRef.current.getBounds();
      if (bounds.isValid()) {
        const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
        mapRef.current.fitBounds(bounds, {
          paddingTopLeft: [isDesktop ? 410 : 25, 25],
          paddingBottomRight: [25, 25],
          maxZoom: 16,
        });
        return;
      }
    }
    mapRef.current.setView([31.253, 75.704], 16);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-slate-100">
      {/* Tile Loading Indicator */}
      {tileLoading && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-slate-900/80 backdrop-blur-xs text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-lg flex items-center space-x-2">
          <div className="w-3 h-3 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading tiles...</span>
        </div>
      )}

      {/* Tile Error Fallback Notice */}
      {tileError && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 bg-amber-500/90 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-lg flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Tile server connection sluggish; switching to CARTO fallback...</span>
        </div>
      )}

      {/* Leaflet DOM Node */}
      <div
        id="lpu-leaflet-map"
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{ width: '100%', height: '100%', minHeight: '100%' }}
      />

      {/* Floating Layer Controls (Top Right) */}
      <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 flex flex-col items-end space-y-2">
        <button
          onClick={() => setShowLayersMenu(!showLayersMenu)}
          className="px-2.5 sm:px-3.5 py-1.5 sm:py-2 bg-white/95 backdrop-blur-md border border-slate-200 text-slate-800 rounded-xl shadow-md font-bold text-xs flex items-center space-x-1.5 sm:space-x-2 hover:bg-slate-50 transition-colors"
          title="Toggle Campus Spatial Layers"
        >
          <Layers className="w-4 h-4 text-emerald-600" />
          <span className="hidden sm:inline">Map Layers &amp; Labels</span>
          <span className="sm:hidden">Layers</span>
        </button>

        {showLayersMenu && (
          <div className="w-[calc(100vw-1.5rem)] sm:w-64 max-h-[70vh] overflow-y-auto bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl shadow-xl p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                Cartographic Controls
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                Zoom: {currentZoom}
              </span>
            </div>

            {/* Smart Labels Toggle */}
            <div className="space-y-1.5">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 cursor-pointer p-1 rounded-lg hover:bg-slate-50">
                <span className="flex items-center space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>Smart Zoom Labels</span>
                </span>
                <input
                  type="checkbox"
                  checked={showSmartLabels}
                  onChange={(e) => setShowSmartLabels(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>
            </div>

            {/* Layer Toggles */}
            <div className="space-y-1.5 pt-1 border-t border-slate-100 text-xs font-semibold text-slate-700">
              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>136 Buildings</span>
                </span>
                <input
                  type="checkbox"
                  checked={showBuildings}
                  onChange={(e) => setShowBuildings(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
                  <span>Walkways & Roads</span>
                </span>
                <input
                  type="checkbox"
                  checked={showWalkways}
                  onChange={(e) => setShowWalkways(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                  <span>Sports & Facilities</span>
                </span>
                <input
                  type="checkbox"
                  checked={showFacilities}
                  onChange={(e) => setShowFacilities(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-800"></span>
                  <span>5 Entrance Gates</span>
                </span>
                <input
                  type="checkbox"
                  checked={showGates}
                  onChange={(e) => setShowGates(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-1 rounded-lg hover:bg-slate-50 cursor-pointer">
                <span className="flex items-center space-x-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span>
                  <span>Campus Boundary</span>
                </span>
                <input
                  type="checkbox"
                  checked={showBoundary}
                  onChange={(e) => setShowBoundary(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
              </label>
            </div>

            {/* Base Tile Provider Switcher */}
            <div className="pt-2 border-t border-slate-100">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Base Tile Style (100% Free / No API Key)
              </div>
              <div className="grid grid-cols-3 gap-1">
                <button
                  onClick={() => setTileProvider('osm')}
                  className={`px-1.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all text-center ${
                    tileProvider === 'osm'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  OSM Standard
                </button>
                <button
                  onClick={() => setTileProvider('satellite')}
                  className={`px-1.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all text-center ${
                    tileProvider === 'satellite'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Satellite
                </button>
                <button
                  onClick={() => setTileProvider('streets')}
                  className={`px-1.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all text-center ${
                    tileProvider === 'streets'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                      : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  Streets
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reset View & Legend Controls (Bottom Right) */}
      <div className="absolute bottom-16 md:bottom-5 right-3 sm:right-4 z-20 flex flex-col space-y-2">
        <button
          onClick={handleResetView}
          className="w-9 h-9 sm:w-10 sm:h-10 bg-white/95 backdrop-blur-md border border-slate-200 rounded-xl shadow-md text-slate-700 flex items-center justify-center hover:bg-slate-50 transition-colors"
          title="Reset map view to whole campus"
        >
          <RotateCcw className="w-4 h-4 text-slate-700" />
        </button>
      </div>

      {/* Floating Category Legend (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-20 hidden md:flex items-center space-x-2 px-3 py-1.5 bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-xl shadow-xs text-[11px] font-bold text-slate-600">
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-slate-800"></span>
          <span>Academic</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-700"></span>
          <span>Boys Hostel</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-purple-700"></span>
          <span>Girls Hostel</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-amber-700"></span>
          <span>Mall / Food</span>
        </span>
        <span className="flex items-center space-x-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-orange-600"></span>
          <span>Sports</span>
        </span>
      </div>
    </div>
  );
};
