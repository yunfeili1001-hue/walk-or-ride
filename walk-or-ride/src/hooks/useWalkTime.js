import { useCallback, useState } from 'react';
import { getWalkTime } from '../api/googleMaps';

export async function fetchWalkTime(origin, destination) {
  if (!origin || !destination) {
    throw new Error('Please enter both From and To locations');
  }

  return getWalkTime(origin, destination);
}

export function useWalkTime() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (origin, destination) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchWalkTime(origin, destination);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get walk time';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchWalkTime: search };
}
