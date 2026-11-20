import { GoogleMapsStatus, GoogleMapsErrorDetails } from '../types/googleMaps';

const STORAGE_KEY = 'lpu_google_maps_api_key';

let loadPromise: Promise<void> | null = null;
let currentStatus: GoogleMapsStatus = 'unconfigured';
let lastError: GoogleMapsErrorDetails | null = null;
const statusListeners: Set<(status: GoogleMapsStatus, error?: GoogleMapsErrorDetails | null) => void> = new Set();

export function getGoogleMapsApiKey(): string | null {
  // 1. Check Vite environment variable
  const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (envKey && typeof envKey === 'string' && envKey.trim().length > 5) {
    return envKey.trim();
  }

  // 2. Check localStorage
  try {
    const localKey = localStorage.getItem(STORAGE_KEY);
    if (localKey && localKey.trim().length > 5) {
      return localKey.trim();
    }
  } catch (e) {
    console.warn('[GoogleMapsLoader] LocalStorage inaccessible', e);
  }

  return null;
}

export function setGoogleMapsApiKey(key: string): void {
  try {
    if (key.trim()) {
      localStorage.setItem(STORAGE_KEY, key.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (e) {
    console.warn('[GoogleMapsLoader] Failed to write API key to localStorage', e);
  }
  // Reset promise so next loadGoogleMaps call uses the new key
  loadPromise = null;
}

export function subscribeGoogleMapsStatus(
  callback: (status: GoogleMapsStatus, error?: GoogleMapsErrorDetails | null) => void
): () => void {
  statusListeners.add(callback);
  callback(currentStatus, lastError);
  return () => {
    statusListeners.delete(callback);
  };
}

function updateStatus(status: GoogleMapsStatus, error: GoogleMapsErrorDetails | null = null) {
  currentStatus = status;
  lastError = error;
  statusListeners.forEach((listener) => listener(status, error));
}

export function isGoogleMapsLoaded(): boolean {
  return typeof window !== 'undefined' && !!(window as any).google?.maps;
}

export function loadGoogleMaps(explicitKey?: string): Promise<void> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('Window not available'));
  }

  // If already loaded on window, mark ready
  if (isGoogleMapsLoaded()) {
    updateStatus('ready');
    return Promise.resolve();
  }

  const apiKey = explicitKey || getGoogleMapsApiKey();
  if (!apiKey) {
    updateStatus('unconfigured', {
      code: 'MISSING_API_KEY',
      message: 'No Google Maps API Key found in VITE_GOOGLE_MAPS_API_KEY or local configuration.',
      requiredApis: ['Maps JavaScript API', 'Places API (New)', 'Directions API'],
    });
    return Promise.reject(new Error('Missing Google Maps API Key'));
  }

  if (loadPromise) {
    return loadPromise;
  }

  updateStatus('loading');

  loadPromise = new Promise<void>((resolve, reject) => {
    // Check if script tag is already in document
    const existingScript = document.querySelector('script[data-gmaps-loader="true"]');
    if (existingScript) {
      existingScript.remove();
    }

    // Google Maps authentication failure hook
    (window as any).gm_authFailure = () => {
      console.error('[GoogleMapsLoader] Google Maps API Authentication Failure (gm_authFailure).');
      const err: GoogleMapsErrorDetails = {
        code: 'AUTH_FAILURE',
        message: 'Google Maps rejected the provided API Key. Check that billing is enabled and required APIs are activated.',
        requiredApis: ['Maps JavaScript API', 'Places API (New)', 'Directions API'],
      };
      updateStatus('error', err);
      reject(new Error(err.message));
    };

    const callbackName = '__initLpuGoogleMaps';
    (window as any)[callbackName] = () => {
      delete (window as any)[callbackName];
      console.log('[GoogleMapsLoader] Google Maps JavaScript API loaded successfully.');
      updateStatus('ready');
      resolve();
    };

    const script = document.createElement('script');
    script.setAttribute('data-gmaps-loader', 'true');
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    // Loading Maps JavaScript API with Places and Geometry libraries
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(
      apiKey
    )}&libraries=places,geometry,marker&v=weekly&loading=async&callback=${callbackName}`;

    script.onerror = (e) => {
      console.error('[GoogleMapsLoader] Failed to load Google Maps script tag', e);
      const err: GoogleMapsErrorDetails = {
        code: 'SCRIPT_LOAD_ERROR',
        message: 'Network error or blocked request while loading Google Maps JavaScript API.',
      };
      updateStatus('error', err);
      loadPromise = null;
      reject(new Error(err.message));
    };

    document.head.appendChild(script);
  });

  return loadPromise;
}
