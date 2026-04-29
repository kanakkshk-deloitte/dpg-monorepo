export interface GeoCoordinate {
  lat: number;
  lng: number;
}

declare global {
  interface Window {
    __dpgGoogleMapsInit?: () => void;
    google?: GoogleMapsGlobal;
  }
}

interface GoogleMapsGeocoderResult {
  geometry: {
    location: {
      lat: () => number;
      lng: () => number;
    };
  };
}

interface GoogleMapsGeocoder {
  geocode: (request: { address: string }) => Promise<{ results: GoogleMapsGeocoderResult[] }>;
}

interface GoogleMapsGlobal {
  maps?: {
    Geocoder?: new () => GoogleMapsGeocoder;
  };
}

const pincodeCache = new Map<string, GeoCoordinate | null>();
const addressCache = new Map<string, GeoCoordinate | null>();
const googleAddressCache = new Map<string, GeoCoordinate | null>();
let googleMapsScriptPromise: Promise<void> | null = null;

// Rate limiting for Nominatim (1 request per second max)
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1000; // 1 second

async function rateLimit<T>(fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const timeSinceLastRequest = now - lastRequestTime;
  
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest));
  }
  
  lastRequestTime = Date.now();
  return fn();
}

/**
 * Geocodes a pincode string to latitude/longitude coordinates.
 * Results are cached in memory to avoid repeated API calls.
 *
 * Resolution order:
 *   1. In-memory cache
 *   2. Custom geocoding API (VITE_GEOCODING_API_URL)
 *   3. Default: India postal pincode API (api.postalpincode.in)
 *
 * Returns null if geocoding fails or no API is available.
 */
export async function geocodePincode(pincode: string): Promise<GeoCoordinate | null> {
  if (!pincode || typeof pincode !== 'string') return null;

  const key = pincode.trim();
  if (pincodeCache.has(key)) return pincodeCache.get(key)!;

  const customUrl = import.meta.env.VITE_GEOCODING_API_URL;

  try {
    let result: GeoCoordinate | null = null;

    if (customUrl) {
      result = await geocodeFromCustomApi(customUrl, key);
    } else {
      result = await geocodeFromPostalApi(key);
    }

    pincodeCache.set(key, result);
    return result;
  } catch {
    pincodeCache.set(key, null);
    return null;
  }
}

async function geocodeFromPostalApi(pincode: string): Promise<GeoCoordinate | null> {
  const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
  if (!response.ok) return null;

  const data = await response.json();
  const postOffice = data?.[0]?.PostOffice?.[0];

  if (postOffice?.Latitude && postOffice?.Longitude) {
    return {
      lat: Number(postOffice.Latitude),
      lng: Number(postOffice.Longitude),
    };
  }

  return null;
}

async function geocodeFromCustomApi(
  baseUrl: string,
  pincode: string
): Promise<GeoCoordinate | null> {
  const url = `${baseUrl.replace(/\/$/, '')}/${encodeURIComponent(pincode)}`;
  const response = await fetch(url);
  if (!response.ok) return null;

  const data = await response.json();

  // Flexible response parsing — support common geocoding API formats
  if (typeof data.lat === 'number' && typeof data.lng === 'number') {
    return { lat: data.lat, lng: data.lng };
  }
  if (typeof data.latitude === 'number' && typeof data.longitude === 'number') {
    return { lat: data.latitude, lng: data.longitude };
  }
  if (Array.isArray(data) && data[0]?.lat && data[0]?.lng) {
    return { lat: Number(data[0].lat), lng: Number(data[0].lng) };
  }

  return null;
}

/**
 * Geocodes an address string to latitude/longitude coordinates using OpenStreetMap Nominatim.
 * Results are cached in memory to avoid repeated API calls.
 * Supports both full address format ("City, State, Country") and city-only format.
 *
 * Rate limited to 1 request per second to comply with Nominatim usage policy.
 *
 * @param address - The address string to geocode
 * @param format - Whether to use full address or city-only format for better matching
 * @returns GeoCoordinate or null if geocoding fails
 */
export async function geocodeAddress(
  address: string,
  format: 'full' | 'city-only' = 'full'
): Promise<GeoCoordinate | null> {
  if (!address || typeof address !== 'string') return null;

  const key = `${format}:${address.trim()}`;
  if (addressCache.has(key)) return addressCache.get(key)!;

  try {
    const result = await rateLimit(() => geocodeFromNominatim(address, format));
    addressCache.set(key, result);
    return result;
  } catch {
    addressCache.set(key, null);
    return null;
  }
}

/**
 * Geocodes a free-form address with Google Geocoding API when a browser API key is configured.
 */
export async function geocodeAddressWithGoogle(address: string): Promise<GeoCoordinate | null> {
  if (!address || typeof address !== 'string') return null;

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey || typeof window === 'undefined') return null;

  const key = address.trim();
  if (googleAddressCache.has(key)) return googleAddressCache.get(key)!;

  try {
    await loadGoogleMapsScript(apiKey);
    const result = await geocodeWithGoogleMaps(key);

    googleAddressCache.set(key, result);
    return result;
  } catch {
    googleAddressCache.set(key, null);
    return null;
  }
}

function hasGoogleGeocoder(): boolean {
  return typeof window.google?.maps?.Geocoder === 'function';
}

function loadGoogleMapsScript(apiKey: string): Promise<void> {
  if (hasGoogleGeocoder()) return Promise.resolve();
  if (googleMapsScriptPromise) return googleMapsScriptPromise;

  googleMapsScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector<HTMLScriptElement>('script[data-dpg-google-maps="true"]');

    window.__dpgGoogleMapsInit = () => {
      resolve();
      window.__dpgGoogleMapsInit = undefined;
    };

    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(), { once: true });
      existingScript.addEventListener('error', () => reject(new Error('Failed to load Google Maps')), { once: true });
      return;
    }

    const script = document.createElement('script');
    const url = new URL('https://maps.googleapis.com/maps/api/js');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('callback', '__dpgGoogleMapsInit');
    url.searchParams.set('loading', 'async');

    script.src = url.toString();
    script.async = true;
    script.defer = true;
    script.dataset.dpgGoogleMaps = 'true';
    script.onerror = () => reject(new Error('Failed to load Google Maps'));
    document.head.appendChild(script);
  });

  return googleMapsScriptPromise;
}

function geocodeWithGoogleMaps(address: string): Promise<GeoCoordinate | null> {
  if (!hasGoogleGeocoder()) return Promise.resolve(null);

  const Geocoder = window.google?.maps?.Geocoder;
  if (!Geocoder) return Promise.resolve(null);

  const geocoder = new Geocoder();
  return geocoder
    .geocode({ address })
    .then(({ results }) => {
      const location = results[0]?.geometry.location;
      return location ? { lat: location.lat(), lng: location.lng() } : null;
    })
    .catch(() => null);
}

async function geocodeFromNominatim(
  address: string,
  format: 'full' | 'city-only'
): Promise<GeoCoordinate | null> {
  // Build query based on format preference
  let query = address;
  
  if (format === 'city-only') {
    // Extract just the city/primary location component
    const parts = address.split(',');
    query = parts[0].trim();
  }

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
  
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'DPG-Map-Viewer/1.0'
    }
  });
  
  if (!response.ok) return null;

  const data = await response.json();

  if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
    return {
      lat: Number(data[0].lat),
      lng: Number(data[0].lon),
    };
  }

  return null;
}

/**
 * Clears both the pincode and address geocoding caches. Useful for testing.
 */
export function clearGeocodingCache(): void {
  pincodeCache.clear();
  addressCache.clear();
  googleAddressCache.clear();
}
