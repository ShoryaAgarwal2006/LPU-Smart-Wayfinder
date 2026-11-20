import { GoogleRouteResult, GoogleRouteStep } from '../types/googleMaps';

let sharedDirectionsService: any = null;

function getDirectionsService(): any {
  if (!sharedDirectionsService && typeof window !== 'undefined' && (window as any).google?.maps) {
    sharedDirectionsService = new (window as any).google.maps.DirectionsService();
  }
  return sharedDirectionsService;
}

export interface RoutePoint {
  name: string;
  lat: number;
  lng: number;
}

/**
 * Clean Google HTML step instructions (e.g. "Head <b>north</b> on <b>GT Road</b>") into clean readable text
 */
function cleanInstruction(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Calculates genuine outdoor walking route using Google Maps DirectionsService.
 * Strictly avoids invented pedestrian paths.
 */
export function calculateGoogleWalkingRoute(
  origin: RoutePoint,
  destination: RoutePoint,
  directionsRenderer?: any
): Promise<GoogleRouteResult> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !(window as any).google?.maps) {
      return resolve({
        found: false,
        distanceText: '',
        distanceMeters: 0,
        durationText: '',
        durationMinutes: 0,
        steps: [],
        originName: origin.name,
        destinationName: destination.name,
        googleMapsDirectionsUrl: '',
        error: 'Google Maps Directions service is not initialized or API key is missing.',
      });
    }

    const service = getDirectionsService();
    if (!service) {
      return resolve({
        found: false,
        distanceText: '',
        distanceMeters: 0,
        durationText: '',
        durationMinutes: 0,
        steps: [],
        originName: origin.name,
        destinationName: destination.name,
        googleMapsDirectionsUrl: '',
        error: 'Failed to access Google Maps Directions Service.',
      });
    }

    const request = {
      origin: new (window as any).google.maps.LatLng(origin.lat, origin.lng),
      destination: new (window as any).google.maps.LatLng(destination.lat, destination.lng),
      travelMode: (window as any).google.maps.TravelMode.WALKING,
      provideRouteAlternatives: false,
    };

    service.route(request, (response: any, status: any) => {
      const directionsStatus = (window as any).google.maps.DirectionsStatus;

      if (status === directionsStatus.OK && response && response.routes?.length > 0) {
        // Render route directly onto Google Map if renderer is supplied
        if (directionsRenderer) {
          directionsRenderer.setDirections(response);
        }

        const route = response.routes[0];
        const leg = route.legs?.[0];

        const distanceMeters = leg?.distance?.value || 0;
        const distanceText = leg?.distance?.text || `${distanceMeters} m`;
        const durationText = leg?.duration?.text || '';
        const durationMinutes = Math.max(1, Math.round((leg?.duration?.value || 60) / 60));

        const steps: GoogleRouteStep[] = (leg?.steps || []).map((s: any) => ({
          instruction: cleanInstruction(s.instructions || ''),
          distance: s.distance?.text || '',
          duration: s.duration?.text || '',
        }));

        const googleMapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=walking`;

        resolve({
          found: true,
          distanceText,
          distanceMeters,
          durationText,
          durationMinutes,
          steps,
          originName: origin.name,
          destinationName: destination.name,
          googleMapsDirectionsUrl,
        });
      } else {
        // Clear previous route on failure
        if (directionsRenderer) {
          directionsRenderer.set('directions', null);
        }

        let errorMessage = 'Google Maps was unable to calculate an outdoor walking route between these locations.';
        if (status === directionsStatus.ZERO_RESULTS) {
          errorMessage = 'No pedestrian pathway was found connecting these points on Google Maps.';
        } else if (status === directionsStatus.NOT_FOUND) {
          errorMessage = 'One or both of the selected locations could not be geocoded by Google Maps.';
        } else if (status === directionsStatus.OVER_QUERY_LIMIT) {
          errorMessage = 'Google Maps Directions API quota exceeded. Please check your project billing or quota.';
        } else if (status === directionsStatus.REQUEST_DENIED) {
          errorMessage = 'Directions request was denied by Google Maps. Ensure Directions API is enabled in Google Cloud Console.';
        }

        resolve({
          found: false,
          distanceText: '',
          distanceMeters: 0,
          durationText: '',
          durationMinutes: 0,
          steps: [],
          originName: origin.name,
          destinationName: destination.name,
          googleMapsDirectionsUrl: `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}&travelmode=walking`,
          error: errorMessage,
        });
      }
    });
  });
}
