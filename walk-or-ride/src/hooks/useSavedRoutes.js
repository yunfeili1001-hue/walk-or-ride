import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, isFirebaseConfigured } from '../firebase';

function createRouteId() {
  return crypto.randomUUID();
}

function shortenPlace(name) {
  const part = name.split(',')[0].trim();
  return part.length > 28 ? `${part.slice(0, 28)}…` : part;
}

function buildRouteLabel(from, to) {
  return `${shortenPlace(from)} → ${shortenPlace(to)}`;
}

function normalizeRoute(from, to) {
  return `${from.trim().toLowerCase()}|${to.trim().toLowerCase()}`;
}

export function useSavedRoutes() {
  const { user } = useAuth();
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) {
      setRoutes([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        setRoutes(snapshot.data()?.savedRoutes ?? []);
        setError(null);
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLoading(false);
      },
    );

    return unsubscribe;
  }, [user]);

  const saveRoutes = useCallback(
    async (nextRoutes) => {
      if (!user || !db) {
        throw new Error('You must be logged in to save routes');
      }

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { savedRoutes: nextRoutes }, { merge: true });
    },
    [user],
  );

  const addRoute = useCallback(
    async ({ from, to, label }) => {
      const trimmedFrom = from.trim();
      const trimmedTo = to.trim();

      if (!trimmedFrom || !trimmedTo) {
        throw new Error('Enter From and To before saving');
      }

      const routeKey = normalizeRoute(trimmedFrom, trimmedTo);
      const alreadySaved = routes.some(
        (route) => normalizeRoute(route.from, route.to) === routeKey,
      );

      if (alreadySaved) {
        throw new Error('This route is already saved');
      }

      const nextRoute = {
        id: createRouteId(),
        from: trimmedFrom,
        to: trimmedTo,
        label: label?.trim() || buildRouteLabel(trimmedFrom, trimmedTo),
      };

      await saveRoutes([...routes, nextRoute]);
      return nextRoute;
    },
    [routes, saveRoutes],
  );

  const isRouteSaved = useCallback(
    (from, to) => {
      if (!from.trim() || !to.trim()) {
        return false;
      }
      const routeKey = normalizeRoute(from, to);
      return routes.some((route) => normalizeRoute(route.from, route.to) === routeKey);
    },
    [routes],
  );

  const deleteRoute = useCallback(
    async (routeId) => {
      await saveRoutes(routes.filter((route) => route.id !== routeId));
    },
    [routes, saveRoutes],
  );

  return {
    routes,
    loading,
    error,
    addRoute,
    deleteRoute,
    isRouteSaved,
  };
}
