import { GoogleCampusPlace } from '../types/googleMaps';

// Campus geographical focus: Lovely Professional University, Phagwara, Punjab
export const LPU_CAMPUS_CENTER = {
  lat: 31.254,
  lng: 75.704,
};

export const LPU_CAMPUS_BOUNDS = {
  south: 31.248,
  west: 75.696,
  north: 31.262,
  east: 75.712,
};

let sharedPlacesService: any = null;
let sharedAutocompleteService: any = null;

function getPlacesService(mapInstanceOrElement?: any): any {
  if (mapInstanceOrElement && mapInstanceOrElement instanceof (window as any).google?.maps?.Map) {
    return new (window as any).google.maps.places.PlacesService(mapInstanceOrElement);
  }

  if (!sharedPlacesService && typeof window !== 'undefined' && (window as any).google?.maps?.places) {
    // Hidden node for PlacesService when map instance is not directly provided
    const dummyDiv = document.createElement('div');
    sharedPlacesService = new (window as any).google.maps.places.PlacesService(dummyDiv);
  }
  return sharedPlacesService;
}

function getAutocompleteService(): any {
  if (!sharedAutocompleteService && typeof window !== 'undefined' && (window as any).google?.maps?.places) {
    sharedAutocompleteService = new (window as any).google.maps.places.AutocompleteService();
  }
  return sharedAutocompleteService;
}

/**
 * Map a raw Google Place Result to our strict GoogleCampusPlace model.
 * RULE: Preserves the EXACT name returned by Google Maps without alteration.
 */
export function formatGooglePlace(rawPlace: any): GoogleCampusPlace {
  const lat = rawPlace.geometry?.location?.lat
    ? typeof rawPlace.geometry.location.lat === 'function'
      ? rawPlace.geometry.location.lat()
      : rawPlace.geometry.location.lat
    : 0;

  const lng = rawPlace.geometry?.location?.lng
    ? typeof rawPlace.geometry.location.lng === 'function'
      ? rawPlace.geometry.location.lng()
      : rawPlace.geometry.location.lng
    : 0;

  // Extract photos if available, preserving official Google attribution
  const photos = rawPlace.photos?.slice(0, 3).map((p: any) => ({
    url: typeof p.getUrl === 'function' ? p.getUrl({ maxWidth: 600, maxHeight: 400 }) : '',
    htmlAttributions: p.html_attributions || [],
  }));

  const placeId = rawPlace.place_id || `gplace_${lat.toFixed(5)}_${lng.toFixed(5)}`;

  return {
    placeId,
    // EXACT Google Maps place name - no modification, no expansion of abbreviations, no synthetic prefixes
    name: rawPlace.name || 'Unnamed Location',
    formattedAddress: rawPlace.formatted_address || rawPlace.vicinity,
    location: { lat, lng },
    types: rawPlace.types || [],
    rating: rawPlace.rating,
    userRatingsTotal: rawPlace.user_ratings_total,
    photos,
    openingHours: rawPlace.opening_hours
      ? {
          isOpen: typeof rawPlace.opening_hours.isOpen === 'function' ? rawPlace.opening_hours.isOpen() : undefined,
          weekdayText: rawPlace.opening_hours.weekday_text,
        }
      : undefined,
    googleMapsUrl: rawPlace.url || `https://www.google.com/maps/place/?q=place_id:${placeId}`,
    isGoogleVerified: true,
  };
}

/**
 * Search for campus places matching a query using Google Places TextSearch.
 * Biased strictly to LPU campus bounds and center.
 */
export function searchGoogleCampusPlaces(
  query: string,
  mapInstance?: any
): Promise<GoogleCampusPlace[]> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.maps?.places) {
      return reject(new Error('Google Maps Places library is not loaded.'));
    }

    const service = getPlacesService(mapInstance);
    if (!service) {
      return reject(new Error('Failed to initialize Google PlacesService.'));
    }

    const campusBounds = new (window as any).google.maps.LatLngBounds(
      new (window as any).google.maps.LatLng(LPU_CAMPUS_BOUNDS.south, LPU_CAMPUS_BOUNDS.west),
      new (window as any).google.maps.LatLng(LPU_CAMPUS_BOUNDS.north, LPU_CAMPUS_BOUNDS.east)
    );

    // If query doesn't explicitly include LPU, qualify it to search within university grounds
    const effectiveQuery = query.toLowerCase().includes('lpu') || query.toLowerCase().includes('lovely')
      ? query
      : `${query} Lovely Professional University Phagwara`;

    const request = {
      query: effectiveQuery,
      bounds: campusBounds,
      location: new (window as any).google.maps.LatLng(LPU_CAMPUS_CENTER.lat, LPU_CAMPUS_CENTER.lng),
      radius: 1500,
    };

    service.textSearch(request, (results: any[], status: any) => {
      const placesStatus = (window as any).google.maps.places.PlacesServiceStatus;

      if (status === placesStatus.OK && results && results.length > 0) {
        const places = results.map(formatGooglePlace);
        resolve(places);
      } else if (status === placesStatus.ZERO_RESULTS) {
        resolve([]);
      } else {
        console.warn(`[GooglePlacesService] textSearch failed with status: ${status}`);
        resolve([]);
      }
    });
  });
}

/**
 * Fetch detailed place record by Google Place ID.
 */
export function getGooglePlaceDetails(
  placeId: string,
  mapInstance?: any
): Promise<GoogleCampusPlace | null> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !(window as any).google?.maps?.places) {
      return reject(new Error('Google Maps Places library is not loaded.'));
    }

    const service = getPlacesService(mapInstance);
    if (!service) {
      return reject(new Error('Failed to initialize Google PlacesService.'));
    }

    const request = {
      placeId,
      fields: [
        'name',
        'geometry',
        'place_id',
        'formatted_address',
        'types',
        'rating',
        'user_ratings_total',
        'photos',
        'opening_hours',
        'url',
        'website',
        'vicinity',
      ],
    };

    service.getDetails(request, (place: any, status: any) => {
      const placesStatus = (window as any).google.maps.places.PlacesServiceStatus;

      if (status === placesStatus.OK && place) {
        resolve(formatGooglePlace(place));
      } else if (status === placesStatus.ZERO_RESULTS || status === placesStatus.NOT_FOUND) {
        resolve(null);
      } else {
        console.warn(`[GooglePlacesService] getDetails failed with status: ${status}`);
        resolve(null);
      }
    });
  });
}

/**
 * Autocomplete suggestions biased to LPU campus
 */
export function getGooglePlaceAutocomplete(
  input: string
): Promise<any[]> {
  return new Promise((resolve) => {
    if (!input.trim() || typeof window === 'undefined' || !(window as any).google?.maps?.places) {
      return resolve([]);
    }

    const service = getAutocompleteService();
    if (!service) return resolve([]);

    const campusBounds = new (window as any).google.maps.LatLngBounds(
      new (window as any).google.maps.LatLng(LPU_CAMPUS_BOUNDS.south, LPU_CAMPUS_BOUNDS.west),
      new (window as any).google.maps.LatLng(LPU_CAMPUS_BOUNDS.north, LPU_CAMPUS_BOUNDS.east)
    );

    service.getPlacePredictions(
      {
        input,
        bounds: campusBounds,
        location: new (window as any).google.maps.LatLng(LPU_CAMPUS_CENTER.lat, LPU_CAMPUS_CENTER.lng),
        radius: 1500,
        componentRestrictions: { country: 'in' },
      },
      (predictions: any[], status: any) => {
        const placesStatus = (window as any).google.maps.places.PlacesServiceStatus;
        if (status === placesStatus.OK && predictions) {
          resolve(predictions);
        } else {
          resolve([]);
        }
      }
    );
  });
}
