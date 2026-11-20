import outdoorGeoJsonRaw from '../../lpu_outdoor.geojson?raw';
import buildingsDataRaw from '../../buildings.json';
import indoorDataRaw from '../../indoor_buildings.json';
import locationOverridesData from './locationNameOverrides.json';
import masterInventoryData from './lpuVerifiedGoogleMapsLocations.json';
import { Building, IndoorBuilding, CampusGate, CampusPlace } from '../types';

export const outdoorGeoJson = JSON.parse(outdoorGeoJsonRaw);
export const campusMasterInventory: CampusPlace[] = masterInventoryData as CampusPlace[];

export interface LocationOverride {
  official_name?: string | null;
  osm_name?: string | null;
  display_name: string;
  short_label?: string;
  category: string;
  block_number?: string | null;
  building_id?: string | null;
  footprint_type?:
    | 'mapped_footprint'
    | 'representative_grid'
    | 'gate_point'
    | 'sports_facility'
    | 'amenity_area'
    | 'campus_boundary';
  entrance_status?:
    | 'verified_gate'
    | 'perimeter_walkway_snap'
    | 'approximate'
    | 'boundary_perimeter'
    | 'osm_verified_access';
  source: string;
  verification_status:
    | 'institution_verified'
    | 'osm_verified'
    | 'descriptive_only'
    | 'awaiting_manual_verification';
  confidence: 'high' | 'medium' | 'low';
  notes?: string;
}

export const locationNameOverrides: Record<string, LocationOverride> = locationOverridesData as Record<string, LocationOverride>;

// Duplicated OSM features identified during data audit for display-layer suppression
export const DUPLICATE_FEATURE_IDS = new Set<string>([
  'way/422437886',
  'way/482133790',
]);

// Helper to look up an override by full ID ("way/354743583") or numeric OSM ID or building ID
export function getLocationOverride(idOrOsmId: string | number): LocationOverride | null {
  if (typeof idOrOsmId === 'number') {
    return locationNameOverrides[`way/${idOrOsmId}`] || null;
  }
  if (locationNameOverrides[idOrOsmId]) {
    return locationNameOverrides[idOrOsmId];
  }
  if (!idOrOsmId.startsWith('way/') && !isNaN(Number(idOrOsmId))) {
    return locationNameOverrides[`way/${idOrOsmId}`] || null;
  }
  return null;
}

// Enriched buildings dataset: harmonized with verified locationNameOverrides and distinct categories
export const buildings: Building[] = (buildingsDataRaw.buildings as Building[]).map((b) => {
  const override =
    locationNameOverrides[b.id] ||
    (b.osm_way_id ? locationNameOverrides[`way/${b.osm_way_id}`] : null);

  const masterItem = campusMasterInventory.find(
    (item) => item.id === b.id || item.id === `BLOCK_${b.block_number}` || (item as any).exactName === b.name
  );

  return {
    ...b,
    name: override ? override.display_name : b.name,
    category: override ? override.category : b.category,
    footprint_type: b.osm_way_id !== null ? 'mapped_footprint' : 'representative_grid',
    entrance_status: b.osm_way_id !== null ? 'perimeter_walkway_snap' : 'approximate',
    googlePlaceId: (masterItem as any)?.googlePlaceId || null,
    googleMapsUrl: (masterItem as any)?.googleMapsReference || (masterItem as any)?.googleMapsUrl,
    verificationStatus: 'GOOGLE_MAPS_VERIFIED',
  };
});

export const indoorBuildings: IndoorBuilding[] = indoorDataRaw.indoor_buildings;

export const campusGates: CampusGate[] = [
  {
    id: "gate_1_main",
    name: "Gate 1 (Main Entrance)",
    coordinates: [75.7064763, 31.2595196],
    type: "entrance_gate",
    description: "Primary campus entrance facing Grand Trunk Road (NH-44) with multi-lane security and RFID boom barriers.",
    source: "OpenStreetMap Way 1551038389 & LPU Security Manual"
  },
  {
    id: "gate_2",
    name: "Gate 2",
    coordinates: [75.7061, 31.2580],
    type: "entrance_gate",
    description: "Auxiliary entry gate for campus transit alleviation and passenger drop-off.",
    source: "LPU Campus Security Guidelines"
  },
  {
    id: "gate_3",
    name: "Gate 3",
    coordinates: [75.7058, 31.2560],
    type: "entrance_gate",
    description: "Commercial and logistics entrance for Uni-Mall supplies, vendor deliveries, and utility machinery.",
    source: "LPU Campus Transport Guidelines"
  },
  {
    id: "law_gate",
    name: "Law Gate / Maheru Gate",
    coordinates: [75.7001554, 31.2549332],
    type: "campus_gate",
    description: "Western high-traffic access portal connecting campus to student market, private residences, and Maheru road.",
    source: "OpenStreetMap Node 13894888268 & Way 1192260423"
  },
  {
    id: "gate_4",
    name: "Gate 4",
    coordinates: [75.7042, 31.2475],
    type: "campus_gate",
    description: "Southern perimeter gate leading toward sports complexes and agricultural research farm fields.",
    source: "OpenStreetMap Way 422552789 & Google Maps Gate 4 South"
  },
  {
    id: "green_valley_gate",
    name: "Green Valley Gate",
    coordinates: [75.697562, 31.251734],
    type: "campus_gate",
    description: "Ceremonial gateway on the southwestern university boundary.",
    source: "OpenStreetMap Node 12031088561"
  }
];

export const CAMPUS_CENTER: [number, number] = [31.2540, 75.7040];
export const CAMPUS_BOUNDS: [[number, number], [number, number]] = [
  [31.244, 75.694],
  [31.262, 75.712]
];

// Helper to check if a lat/lon is inside campus rough bounding box
export function isPointInsideLpuCampus(lat: number, lon: number): boolean {
  return lat >= 31.245 && lat <= 31.262 && lon >= 75.696 && lon <= 75.710;
}
