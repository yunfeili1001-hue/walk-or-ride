const { onRequest } = require('firebase-functions/v2/https');

/**
 * Proxies Google Distance Matrix API so the browser never receives HTML
 * from Firebase Hosting rewrites. Works on localhost (Vite proxy) and production.
 */
exports.distanceMatrix = onRequest({ cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'GET') {
    res.status(405).json({ status: 'INVALID_REQUEST', error_message: 'Method not allowed' });
    return;
  }

  const { origins, destinations, mode, key } = req.query;

  if (!origins || !destinations) {
    res.status(400).json({
      status: 'INVALID_REQUEST',
      error_message: 'Missing origins or destinations',
    });
    return;
  }

  // Prefer server-side key (no HTTP referrer restriction). Falls back to client key.
  const apiKey = process.env.GOOGLE_MAPS_KEY || key;

  if (!apiKey) {
    res.status(400).json({
      status: 'INVALID_REQUEST',
      error_message: 'Missing Google Maps API key',
    });
    return;
  }

  try {
    const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json');
    url.searchParams.set('origins', String(origins));
    url.searchParams.set('destinations', String(destinations));
    url.searchParams.set('mode', String(mode || 'walking'));
    url.searchParams.set('key', String(apiKey));

    const response = await fetch(url);
    const data = await response.json();

    res.status(response.ok ? 200 : response.status).json(data);
  } catch {
    res.status(500).json({
      status: 'UNKNOWN_ERROR',
      error_message: 'Distance Matrix proxy request failed',
    });
  }
});
