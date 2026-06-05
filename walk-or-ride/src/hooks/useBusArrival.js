import { useCallback, useState } from 'react';
import { getBusArrival } from '../api/transitland';

export async function fetchBusArrival(lat, lng) {
  return getBusArrival(lat, lng);
}

export function useBusArrival() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (lat, lng) => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchBusArrival(lat, lng);
      setData(result);
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to get bus arrival';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { data, loading, error, fetchBusArrival: search };
}
