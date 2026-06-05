const TRANSITLAND_BASE = 'https://transit.land/api/v2/rest';

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
  const url = new URL(`${TRANSITLAND_BASE}/${path}`);
  url.searchParams.set('apikey', getApiKey());
  Object.entries(params).forEach(([name, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(name, String(value));
    }
  });

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('Transitland request failed');
  }

  return response.json();
}

function isLocalStop(stop) {
  const feedId = stop.feed_version?.feed?.onestop_id?.toLowerCase() ?? '';
  if (EXCLUDED_FEED_HINTS.some((hint) => feedId.includes(hint))) {
    return false;
  }
  return LOCAL_FEED_HINTS.some((hint) => feedId.includes(hint));
}

function isLocalDeparture(departure) {
  const agencyName = departure.trip?.route?.agency?.agency_name?.toLowerCase() ?? '';
  const routeName = `${departure.trip?.route?.route_short_name ?? ''}`.toLowerCase();

  if (EXCLUDED_AGENCY_HINTS.some((hint) => agencyName.includes(hint))) {
    return false;
  }
  if (routeName.includes('flix')) {
    return false;
  }

  return Boolean(departure.trip?.route?.route_short_name);
}

function getDepartureTimestamp(departure) {
  const time =
    departure.departure?.estimated_utc ||
    departure.arrival?.estimated_utc ||
    departure.departure?.scheduled_utc ||
    departure.arrival?.scheduled_utc;

  return time ? new Date(time).getTime() : null;
}

async function getUpcomingLocalDepartures(stop) {
  const departuresData = await transitlandRequest(
    `stops/${stop.onestop_id}/departures`,
    { limit: 20 },
  );

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

export async function getBusArrival(lat, lng) {
  const stopsData = await transitlandRequest('stops', {
    lat,
    lon: lng,
    radius: 600,
    limit: 20,
  });

  const localStops = (stopsData.stops ?? []).filter(isLocalStop);
  if (localStops.length === 0) {
    throw new Error('No local transit stops found near this location');
  }

  const stopsToCheck = localStops.slice(0, 8);
  const departureLists = await Promise.all(
    stopsToCheck.map((stop) => getUpcomingLocalDepartures(stop)),
  );

  let best = null;

  departureLists.forEach((upcoming, index) => {
    if (upcoming.length === 0) {
      return;
    }

    const candidate = {
      stop: stopsToCheck[index],
      ...upcoming[0],
    };

    if (!best || candidate.timestamp < best.timestamp) {
      best = candidate;
    }
  });

  if (!best) {
    throw new Error('No upcoming local buses at nearby stops');
  }

  const next = best.departure;
  const routeShortName = next.trip?.route?.route_short_name;
  const hasEstimate = Boolean(
    next.departure?.estimated_utc || next.arrival?.estimated_utc,
  );

  return {
    route: routeShortName ? `Route ${routeShortName}` : 'Bus',
    destination: next.trip?.trip_headsign || 'Unknown destination',
    arrivalMinutes: Math.max(1, Math.ceil((best.timestamp - Date.now()) / 60000)),
    stopName: best.stop.stop_name,
    isScheduled: !hasEstimate,
  };
}
