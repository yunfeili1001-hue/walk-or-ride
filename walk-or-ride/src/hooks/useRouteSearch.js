import { useCallback, useState } from 'react';
import { geocodeAddress } from '../api/googleMaps';
import { useAuth } from '../context/AuthContext';
import { recommend } from '../utils/recommendationEngine';
import { addQueryToHistory } from './useQueryHistory';
import { fetchBusArrival } from './useBusArrival';
import { fetchWalkTime } from './useWalkTime';
import { fetchWeather } from './useWeather';

const GEOCODE_TIMEOUT_MS = 25000;
const WALK_TIMEOUT_MS = 45000;
const BUS_TIMEOUT_MS = 30000;
const WEATHER_TIMEOUT_MS = 20000;

function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`${label} timed out after ${ms / 1000}s`)), ms);
    }),
  ]);
}

function friendlyError(err) {
  if (!(err instanceof Error)) {
    return 'Search failed. Please try again.';
  }

  const message = err.message;
  if (
    message.includes('Unexpected token') ||
    message.includes('is not valid JSON') ||
    message.includes('<!doctype')
  ) {
    return 'A service returned an invalid response. Please try again.';
  }

  return message;
}

function settledError(result, label) {
  if (result.status === 'fulfilled') {
    return null;
  }

  const reason = result.reason;
  if (reason instanceof Error) {
    return reason.message;
  }

  return `${label} failed. Please try again.`;
}

export function useRouteSearch() {
  const { user } = useAuth();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(
    async (from, to) => {
      setLoading(true);
      setError(null);
      setResults(null);

      try {
        const [origin, destination] = await Promise.all([
          withTimeout(geocodeAddress(from), GEOCODE_TIMEOUT_MS, 'Geocoding (from)'),
          withTimeout(geocodeAddress(to), GEOCODE_TIMEOUT_MS, 'Geocoding (to)'),
        ]);

        const [walkResult, busResult, weatherResult] = await Promise.allSettled([
          withTimeout(fetchWalkTime(origin, destination), WALK_TIMEOUT_MS, 'Walking route'),
          withTimeout(fetchBusArrival(origin.lat, origin.lng), BUS_TIMEOUT_MS, 'Bus arrival'),
          withTimeout(fetchWeather(origin.lat, origin.lng), WEATHER_TIMEOUT_MS, 'Weather'),
        ]);

        const busError = settledError(busResult, 'Bus arrival');
        const weatherError = settledError(weatherResult, 'Weather');

        if (busError && weatherError) {
          throw new Error(`${busError} ${weatherError}`.trim());
        }

        if (busError) {
          throw new Error(busError);
        }

        if (weatherError) {
          throw new Error(weatherError);
        }

        const bus = busResult.value;
        const weather = weatherResult.value;

        let walk = null;

        if (walkResult.status === 'fulfilled') {
          walk = walkResult.value;
        }

        const recommendation = recommend(walk?.minutes ?? null, bus.arrivalMinutes, weather.condition, {
          walkUnavailable: !walk,
        });

        const nextResults = { walk, bus, weather, recommendation };
        setResults(nextResults);

        if (user) {
          try {
            await addQueryToHistory(user.uid, {
              from,
              to,
              result: recommendation.mode,
            });
          } catch {
            // History save failure should not block search results.
          }
        }

        return nextResults;
      } catch (err) {
        const message = friendlyError(err);
        setError(message);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [user],
  );

  return { results, loading, error, search };
}
