import { fetchJson } from '../utils/fetchJson';

const TRANSITLAND_BASE = 'https://transit.land/api/v2/rest';

const STOP_SEARCH_RADIUS_M = 1500;
const STOP_SEARCH_LIMIT = 40;
const STOPS_TO_CHECK = 16;
const DEPARTURES_PER_STOP = 30;

// GTFS route types: 0 tram/light rail, 1 subway, 3 bus (exclude 2 intercity rail)
const ALLOWED_ROUTE_TYPES = new Set([0, 1, 3]);

const LOCAL_FEED_HINTS = [
  'metrokingcounty',
  'soundtransit',
  'piercetransit',
  'communitytransit',
  'everetttransit',
  'cityofseattle',
  'intercitytransit',
  'kitsaptransit',
];

const EXCLUDED_FEED_HINTS = ['intercity', 'flixbus', 'greyhound', 'megabus'];

const EXCLUDED_AGENCY_HINTS = ['flixbus', 'greyhound', 'megabus', 'amtrak'];

function getApiKey() {
  const key = import.meta.env.VITE_TRANSITLAND_KEY;
  if (!key) {
    throw new Error('Missing VITE_TRANSITLAND_KEY in .env');
  }
  return key;
}

async function transitlandRequest(path, params = {}) {
  try {
    const url = new URL(`${TRANSITLAND_BASE}/${path}`);
    url.searchParams.set('apikey', getApiKey());

    Object.entries(params).forEach(([name, value]) => {
      if (value === undefined || value === null) {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(name, String(item)));
        return;
      }

      url.searchParams.set(name, String(value));
    });

    return await fetchJson(url.toString(), { errorLabel: 'Bus schedule API' });
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Bus schedule API request failed. Please try again.');
  }
}

function toRad(degrees) {
  return (degrees * Math.PI) / 180;
}

function distanceMeters(lat, lng, stop) {
  if (Number.isFinite(stop?.distance)) {
    return stop.distance;
  }

  const stopLat = stop?.geometry?.coordinates?.[1] ?? stop?.lat;
  const stopLng = stop?.geometry?.coordinates?.[0] ?? stop?.lon;

  if (!Number.isFinite(stopLat) || !Number.isFinite(stopLng)) {
    return Number.POSITIVE_INFINITY;
  }

  const earthRadiusM = 6371000;
  const dLat = toRad(stopLat - lat);
  const dLng = toRad(stopLng - lng);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat)) * Math.cos(toRad(stopLat)) * Math.sin(dLng / 2) ** 2;

  return earthRadiusM * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function isLocalStop(stop) {
  const feedId = stop.feed_version?.feed?.onestop_id?.toLowerCase() ?? '';
  if (EXCLUDED_FEED_HINTS.some((hint) => feedId.includes(hint))) {
    return false;
  }
  return LOCAL_FEED_HINTS.some((hint) => feedId.includes(hint));
}

function getRouteType(departure) {
  const routeType = departure.trip?.route?.route_type;
  return routeType == null ? null : Number(routeType);
}

function getRouteLabel(departure) {
  const route = departure.trip?.route;
  if (!route) {
    return null;
  }

  if (route.route_short_name) {
    return route.route_short_name;
  }

  if (route.route_long_name) {
    return route.route_long_name;
  }

  return route.route_id ?? null;
}

function isAllowedRouteType(routeType) {
  if (routeType == null) {
    return true;
  }

  return ALLOWED_ROUTE_TYPES.has(routeType);
}

function isLocalDeparture(departure) {
  const agencyName = departure.trip?.route?.agency?.agency_name?.toLowerCase() ?? '';
  const routeName = `${getRouteLabel(departure) ?? ''}`.toLowerCase();

  if (EXCLUDED_AGENCY_HINTS.some((hint) => agencyName.includes(hint))) {
    return false;
  }

  if (routeName.includes('flix')) {
    return false;
  }

  if (!getRouteLabel(departure)) {
    return false;
  }

  return isAllowedRouteType(getRouteType(departure));
}

function getDepartureTimestamp(departure) {
  const time =
    departure.departure?.estimated_utc ||
    departure.arrival?.estimated_utc ||
    departure.departure?.scheduled_utc ||
    departure.arrival?.scheduled_utc;

  return time ? new Date(time).getTime() : null;
}

function formatRouteLabel(departure) {
  const route = departure.trip?.route;
  const label = getRouteLabel(departure);
  const routeType = getRouteType(departure);

  if (!label) {
    return 'Transit';
  }

  if (routeType === 3) {
    return `Route ${label}`;
  }

  if (routeType === 0 || routeType === 1) {
    return label;
  }

  return route?.route_short_name ? `Route ${label}` : label;
}

async function getUpcomingLocalDepartures(stop) {
  const stopId = encodeURIComponent(stop.onestop_id);
  const departuresData = await transitlandRequest(`stops/${stopId}/departures`, {
    limit: DEPARTURES_PER_STOP,
  });

  const departures = departuresData.stops?.[0]?.departures ?? [];
  const now = Date.now();

  return departures
    .filter(isLocalDeparture)
    .map((departure) => ({
      departure,
      timestamp: getDepartureTimestamp(departure),
    }))
    .filter((item) => item.timestamp && item.timestamp > now)
    .sort((a, b) => a.timestamp - b.timestamp);
}

async function getNearbyStops(lat, lng) {
  const baseParams = {
    lat,
    lon: lng,
    radius: STOP_SEARCH_RADIUS_M,
    limit: STOP_SEARCH_LIMIT,
  };

  const [busStopsData, railStopsData, allStopsData] = await Promise.all([
    transitlandRequest('stops', { ...baseParams, served_by_route_type: 3 }),
    transitlandRequest('stops', { ...baseParams, served_by_route_type: [0, 1] }),
    transitlandRequest('stops', baseParams),
  ]);

  const seen = new Set();
  const merged = [];

  const addStops = (stops, servesBus) => {
    for (const stop of stops ?? []) {
      if (!isLocalStop(stop) || seen.has(stop.onestop_id)) {
        continue;
      }

      seen.add(stop.onestop_id);
      merged.push({
        ...stop,
        distance: distanceMeters(lat, lng, stop),
        servesBus,
      });
    }
  };

  addStops(busStopsData.stops, true);
  addStops(railStopsData.stops, false);
  addStops(allStopsData.stops, false);

  return merged.sort((a, b) => a.distance - b.distance);
}

function pickStopsToCheck(stops) {
  const busStops = stops.filter((stop) => stop.servesBus);
  const otherStops = stops.filter((stop) => !stop.servesBus);

  const selected = [];
  const seen = new Set();
  const busQuota = Math.ceil(STOPS_TO_CHECK * 0.6);
  const otherQuota = STOPS_TO_CHECK - busQuota;

  const addStop = (stop) => {
    if (!stop || seen.has(stop.onestop_id) || selected.length >= STOPS_TO_CHECK) {
      return;
    }

    seen.add(stop.onestop_id);
    selected.push(stop);
  };

  busStops.slice(0, busQuota).forEach(addStop);
  otherStops.slice(0, otherQuota).forEach(addStop);
  stops.forEach(addStop);

  return selected.slice(0, STOPS_TO_CHECK);
}

export async function getBusArrival(lat, lng) {
  try {
    const localStops = await getNearbyStops(lat, lng);

    if (localStops.length === 0) {
      throw new Error('No local transit stops found near this location');
    }

    const stopsToCheck = pickStopsToCheck(localStops);
    const departureLists = await Promise.all(
      stopsToCheck.map((stop) => getUpcomingLocalDepartures(stop)),
    );

    const allUpcoming = departureLists
      .flatMap((upcoming, index) =>
        upcoming.map((item) => ({
          stop: stopsToCheck[index],
          ...item,
        })),
      )
      .sort((a, b) => a.timestamp - b.timestamp);

    const best = allUpcoming[0];

    if (!best) {
      throw new Error('No upcoming local buses at nearby stops');
    }

    const next = best.departure;
    const hasEstimate = Boolean(
      next.departure?.estimated_utc || next.arrival?.estimated_utc,
    );

    return {
      route: formatRouteLabel(next),
      destination: next.trip?.trip_headsign || 'Unknown destination',
      arrivalMinutes: Math.max(1, Math.ceil((best.timestamp - Date.now()) / 60000)),
      stopName: best.stop.stop_name,
      isScheduled: !hasEstimate,
    };
  } catch (err) {
    if (err instanceof Error) {
      throw err;
    }
    throw new Error('Unable to load bus schedule. Please try again.');
  }
}
