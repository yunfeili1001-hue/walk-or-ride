import { fetchJson } from '../utils/fetchJson';

const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DISTANCE_MATRIX_REST_URL = '/api/google/distancematrix/json';

const MAPS_LOAD_TIMEOUT_MS = 15000;
const DISTANCE_MATRIX_TIMEOUT_MS = 25000;

let mapsLoadPromise = null;

function getApiKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!key) {
    throw new Error('Missing VITE_GOOGLE_MAPS_KEY in .env');
  }
  return key;
}

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]);
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function hasCoordinates(location) {
  return (
    location &&
    typeof location === 'object' &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng)
  );
}

/** Prefer lat/lng strings — most reliable for Distance Matrix. */
function formatLocation(location) {
  if (typeof location === 'string') {
    return location.trim();
  }

  if (hasCoordinates(location)) {
    return `${location.lat},${location.lng}`;
  }

  if (location?.formattedAddress) {
    return location.formattedAddress;
  }

  throw new Error('Invalid location for walking route');
}

function estimateWalkTime(origin, destination) {
  const miles =
    3958.8 *
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin(toRad(destination.lat - origin.lat) / 2) ** 2 +
          Math.cos(toRad(origin.lat)) *
            Math.cos(toRad(destination.lat)) *
            Math.sin(toRad(destination.lng - origin.lng) / 2) ** 2,
      ),
    );

  const minutes = Math.max(1, Math.ceil((miles / 3) * 60));

  return {
    minutes,
    distance: `${miles.toFixed(1)} mi (estimated)`,
    estimated: true,
  };
}

function loadGoogleMaps() {
  if (window.google?.maps?.DistanceMatrixService) {
    return Promise.resolve(window.google.maps);
  }

  if (!mapsLoadPromise) {
    mapsLoadPromise = new Promise((resolve, reject) => {
      const callbackName = '__walkOrRideMapsInit';
      window[callbackName] = () => {
        delete window[callbackName];
        if (window.google?.maps?.DistanceMatrixService) {
          resolve(window.google.maps);
        } else {
          mapsLoadPromise = null;
          reject(new Error('Google Maps JavaScript API failed to initialize'));
        }
      };

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${getApiKey()}&callback=${callbackName}`;
      script.async = true;
      script.onerror = () => {
        delete window[callbackName];
        mapsLoadPromise = null;
        reject(new Error('Failed to load Google Maps JavaScript API'));
      };
      document.head.appendChild(script);
    });
  }

  return mapsLoadPromise;
}

async function getWalkTimeViaRest(originStr, destStr) {
  const url = new URL(DISTANCE_MATRIX_REST_URL, window.location.origin);
  url.searchParams.set('origins', originStr);
  url.searchParams.set('destinations', destStr);
  url.searchParams.set('mode', 'walking');
  url.searchParams.set('key', getApiKey());

  const data = await fetchJson(url.toString(), { errorLabel: 'Walking route' });

  if (data.status !== 'OK') {
    const detail = data.error_message ? `: ${data.error_message}` : '';
    throw new Error(`Walking route error (${data.status})${detail}`);
  }

  const element = data.rows[0]?.elements[0];
  if (!element || element.status !== 'OK') {
    throw new Error(
      element?.status
        ? `Walking route unavailable (${element.status})`
        : 'Could not calculate walking route between these locations',
    );
  }

  return {
    minutes: Math.ceil(element.duration.value / 60),
    distance: element.distance.text,
    estimated: false,
  };
}

async function getWalkTimeViaJsApi(origin, destination, originStr, destStr) {
  const maps = await withTimeout(loadGoogleMaps(), MAPS_LOAD_TIMEOUT_MS, 'Google Maps load');

  const origins = hasCoordinates(origin)
    ? [new maps.LatLng(origin.lat, origin.lng)]
    : [originStr];
  const destinations = hasCoordinates(destination)
    ? [new maps.LatLng(destination.lat, destination.lng)]
    : [destStr];

  return withTimeout(
    new Promise((resolve, reject) => {
      const service = new maps.DistanceMatrixService();
      service.getDistanceMatrix(
        {
          origins,
          destinations,
          travelMode: maps.TravelMode.WALKING,
          unitSystem: maps.UnitSystem.IMPERIAL,
        },
        (response, status) => {
          if (status !== maps.DistanceMatrixStatus.OK) {
            reject(new Error(`Walking route error (${status})`));
            return;
          }

          const element = response.rows[0]?.elements[0];
          if (!element || element.status !== maps.DistanceMatrixElementStatus.OK) {
            reject(
              new Error(
                element?.status
                  ? `Walking route unavailable (${element.status})`
                  : 'Could not calculate walking route between these locations',
              ),
            );
            return;
          }

          resolve({
            minutes: Math.ceil(element.duration.value / 60),
            distance: element.distance.text,
            estimated: false,
          });
        },
      );
    }),
    DISTANCE_MATRIX_TIMEOUT_MS,
    'Walking route',
  );
}

export async function geocodeAddress(address) {
  try {
    const url = new URL(GEOCODE_URL);
    url.searchParams.set('address', address);
    url.searchParams.set('key', getApiKey());

    const data = await fetchJson(url.toString(), { errorLabel: 'Geocoding' });

    if (data.status !== 'OK' || !data.results?.[0]) {
      if (data.status === 'REQUEST_DENIED') {
        throw new Error(
          'Geocoding denied. Enable Geocoding API in Google Cloud Console.',
        );
      }
      throw new Error(`Could not find address: ${address}`);
    }

    const result = data.results[0];
    const { lat, lng } = result.geometry.location;

    return {
      lat,
      lng,
      formattedAddress: result.formatted_address,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error(`Could not find address: ${address}`);
  }
}

/**
 * @param {string | { lat: number, lng: number, formattedAddress?: string }} origin
 * @param {string | { lat: number, lng: number, formattedAddress?: string }} destination
 */
export async function getWalkTime(origin, destination) {
  const originStr = formatLocation(origin);
  const destStr = formatLocation(destination);
  const errors = [];

  if (import.meta.env.DEV) {
    try {
      return await getWalkTimeViaRest(originStr, destStr);
    } catch (err) {
      errors.push(err instanceof Error ? err : new Error('Walking route REST request failed'));
    }
  }

  try {
    return await getWalkTimeViaJsApi(origin, destination, originStr, destStr);
  } catch (err) {
    errors.push(err instanceof Error ? err : new Error('Walking route JS API request failed'));
  }

  if (hasCoordinates(origin) && hasCoordinates(destination)) {
    return estimateWalkTime(origin, destination);
  }

  throw errors[0] ?? new Error('Could not calculate walking time. Please try again.');
}
