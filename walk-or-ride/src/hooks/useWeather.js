import { useCallback, useState } from 'react';
import { getWeather } from '../api/openWeather';

export async function fetchWeather(lat, lng) {
  return getWeather(lat, lng);
}

export function useWeather() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWeather(lat, lng);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get weather';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchWeather: search };
}
