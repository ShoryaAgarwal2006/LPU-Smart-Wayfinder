// Types for Google Maps Platform Integration (Phase 5.0)

export interface GoogleCampusPlace {
  placeId: string;
  name: string; // EXACT name returned by Google Maps (no alteration, no abbreviations expanded)
  formattedAddress?: string;
  location: {
    lat: number;
    lng: number;
  };
  types?: string[];
  rating?: number;
  userRatingsTotal?: number;
  photos?: Array<{
    url: string;
    htmlAttributions: string[];
  }>;
  openingHours?: {
    isOpen?: boolean;
    weekdayText?: string[];
  };
  googleMapsUrl: string;
  isGoogleVerified: true;
}

export interface GoogleRouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface GoogleRouteResult {
  found: boolean;
  distanceText: string;
  distanceMeters: number;
  durationText: string;
  durationMinutes: number;
  steps: GoogleRouteStep[];
  originName: string;
  destinationName: string;
  googleMapsDirectionsUrl: string;
  error?: string;
}

export type GoogleMapsStatus = 'unconfigured' | 'loading' | 'ready' | 'error';

export interface GoogleMapsErrorDetails {
  code: string;
  message: string;
  requiredApis?: string[];
}
