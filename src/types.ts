export interface Coordinates {
  latitude: number;
  longitude: number;
}

export type PlaceVerificationStatus =
  | 'GOOGLE_MAPS_VERIFIED'
  | 'MULTI_SOURCE_VERIFIED'
  | 'APPROXIMATE_LOCATION'
  | 'UNVERIFIED'
  | 'NOT_FOUND';

export type MasterPlaceCategory =
  | 'Academic Blocks'
  | 'Boys Hostels'
  | 'Girls Hostels'
  | 'Boys Studios'
  | 'Girls Studios'
  | 'Apartments & Staff Residences'
  | 'Parks & Gardens'
  | 'Food Courts & Restaurants'
  | 'Medical Facilities'
  | 'Sports Facilities'
  | 'Auditoriums & Arenas'
  | 'Administrative & Utility'
  | 'Campus Gates';

export interface CampusPlace {
  id: string;
  name: string;
  category: MasterPlaceCategory | string;
  subcategory: string;
  googlePlaceId: string | null;
  latitude: number;
  longitude: number;
  formattedAddress: string;
  googleMapsUrl: string;
  geometryType: 'polygon_footprint' | 'point_marker';
  geometrySource: string;
  verificationStatus: PlaceVerificationStatus;
  sourceReferences: string[];
  notes: string;
  blockNumber?: string;
}

export interface Building {
  id: string;
  block_number: string;
  name: string;
  category: string;
  description: string;
  floors: number;
  osm_way_id: number | null;
  coordinates: Coordinates;
  campus_zone: string;
  primary_occupants: string[];
  indoor_mapping_status: 'requires_manual_mapping' | 'verified_available' | 'in_progress';
  source: string;
  footprint_type?: 'mapped_footprint' | 'representative_grid';
  entrance_status?: 'verified_gate' | 'perimeter_walkway_snap' | 'approximate';
  googlePlaceId?: string | null;
  googleMapsUrl?: string;
  verificationStatus?: PlaceVerificationStatus;
}

export interface IndoorBuilding {
  building_id: string;
  block_number: string;
  building_name: string;
  category: string;
  total_floors: number;
  verified_indoor_layout_available: boolean;
  mapping_status: string;
  indoor_mapping_priority: 'Critical' | 'High' | 'Standard';
  floors_missing_accurate_layouts: string[];
  public_data_availability: {
    architectural_cad_drawings: string;
    official_floor_plans_pdf: string;
    emergency_evacuation_maps: string;
    room_level_coordinates: string;
  };
  known_architectural_pattern: {
    room_numbering_syntax: string;
    typical_layout_composition: string;
    estimated_rooms_per_floor: string;
    vertical_circulation: string;
    utilities: string;
  };
  missing_elements: string[];
  recommended_mapping_approach: string;
  source_reference: string;
}

export interface CampusGate {
  id: string;
  name: string;
  coordinates: [number, number]; // [lon, lat]
  type: string;
  description: string;
  source: string;
}

export type TravelMode = 'walk' | 'vehicle';

export interface RouteStep {
  instruction: string;
  distanceMeters: number;
  type: 'start' | 'straight' | 'turn_left' | 'turn_right' | 'slight_left' | 'slight_right' | 'arrive';
  coordinate: [number, number]; // [lat, lon]
}

export interface RouteResult {
  found: boolean;
  distanceMeters: number;
  durationMinutes: number;
  mode?: TravelMode; // 'walk' | 'vehicle'
  calories?: number;
  speedLimitKmh?: number;
  pathCoordinates: [number, number][]; // [lat, lon] for Leaflet polyline
  coordinates?: [number, number][]; // alias for pathCoordinates
  steps: RouteStep[];
  startPoint: {
    name: string;
    lat: number;
    lon: number;
    isApproximateEntrance?: boolean;
    snapDistanceMeters?: number;
    entranceType?: 'verified_gate' | 'mapped_footprint_perimeter' | 'representative_grid';
  };
  endPoint: {
    name: string;
    lat: number;
    lon: number;
    blockNumber?: string;
    isApproximateEntrance?: boolean;
    snapDistanceMeters?: number;
    entranceType?: 'verified_gate' | 'mapped_footprint_perimeter' | 'representative_grid';
  };
  destinationIndoorStatus?: string;
  warningMessage?: string;
}

export interface UserLocation {
  lat: number;
  lon: number;
  accuracy: number;
  heading?: number | null;
  speed?: number | null;
  isSimulated?: boolean;
  isInsideCampus: boolean;
}

export type NavigationStatus = 'idle' | 'navigating' | 'rerouting' | 'arrived';

export type GpsQuality = 'good' | 'poor' | 'searching' | 'lost' | 'denied';

export type ArrivalDirection = 'left' | 'right' | 'straight' | 'arrived';

export interface LiveNavigationUpdate {
  currentPosition: [number, number]; // [lat, lon]
  heading: number | null;
  accuracy: number;
  remainingDistanceMeters: number;
  remainingDurationMinutes: number;
  nextStep: RouteStep | null;
  distanceToNextStepMeters: number;
  instruction: string;
  isImmediateTurn: boolean;
  distanceFromRoute: number;
  isOffRoute: boolean;
  hasArrived: boolean;
  arrivalDirection?: ArrivalDirection;
  arrivalMessage?: string;
}

export type ActivePage = 'home' | 'map' | 'directory' | 'indoor' | 'about';
