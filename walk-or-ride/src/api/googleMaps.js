const GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const DISTANCE_MATRIX_URL = '/api/google/distancematrix/json';

function getApiKey() {
  const key = import.meta.env.VITE_GOOGLE_MAPS_KEY;
  if (!key) {
    throw new Error('Missing VITE_GOOGLE_MAPS_KEY in .env');
  }
  return key;
}

export async function geocodeAddress(address) {
  const url = new URL(GEOCODE_URL);
  url.searchParams.set('address', address);
  url.searchParams.set('key', getApiKey());

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK' || !data.results?.[0]) {
    if (data.status === 'REQUEST_DENIED') {
      throw new Error(
        'Google Geocoding denied. Enable Geocoding API in Google Cloud Console.',
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
}

export async function getWalkTime(from, to) {
  const url = new URL(DISTANCE_MATRIX_URL, window.location.origin);
  url.searchParams.set('origins', from);
  url.searchParams.set('destinations', to);
  url.searchParams.set('mode', 'walking');
  url.searchParams.set('key', getApiKey());

  const response = await fetch(url);
  const data = await response.json();

  if (data.status !== 'OK') {
    throw new Error(`Distance Matrix error: ${data.status}`);
  }

  const element = data.rows[0]?.elements[0];
  if (!element || element.status !== 'OK') {
    throw new Error('Could not calculate walking route between these locations');
  }

  return {
    minutes: Math.ceil(element.duration.value / 60),
    distance: element.distance.text,
  };
}
