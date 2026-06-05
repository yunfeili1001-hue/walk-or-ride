import { useCallback, useState } from 'react';
import { geocodeAddress } from '../api/googleMaps';
import { recommend } from '../utils/recommendationEngine';
import { fetchBusArrival } from './useBusArrival';
import { fetchWalkTime } from './useWalkTime';
import { fetchWeather } from './useWeather';

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]);
}

export function useRouteSearch() {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (from, to) => {
    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const origin = await withTimeout(geocodeAddress(from), 20000, 'Geocoding');

      const [walk, bus, weather] = await withTimeout(
        Promise.all([
          fetchWalkTime(from, to),
          fetchBusArrival(origin.lat, origin.lng),
          fetchWeather(origin.lat, origin.lng),
        ]),
        30000,
        'Route search',
      );

      const recommendation = recommend(walk.minutes, bus.arrivalMinutes, weather.condition);

      const nextResults = { walk, bus, weather, recommendation };
      setResults(nextResults);
      return nextResults;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Search failed';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
