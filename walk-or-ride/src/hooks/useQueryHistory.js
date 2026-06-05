import { doc, getDoc, onSnapshot, setDoc } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { db, isFirebaseConfigured } from '../firebase';

const MAX_HISTORY_ENTRIES = 100;

function sortHistory(entries) {
  return [...entries].sort((a, b) => b.timestamp - a.timestamp);
}

export async function addQueryToHistory(userId, { from, to, result }) {
  if (!db) {
    return;
  }

  const userRef = doc(db, 'users', userId);
  const snapshot = await getDoc(userRef);
  const existing = snapshot.data()?.queryHistory ?? [];

  const entry = {
    id: crypto.randomUUID(),
    from: from.trim(),
    to: to.trim(),
    result,
    timestamp: Date.now(),
  };

  const queryHistory = [entry, ...existing].slice(0, MAX_HISTORY_ENTRIES);
  await setDoc(userRef, { queryHistory }, { merge: true });

  return entry;
}

export function useQueryHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !isFirebaseConfigured || !db) {
      setHistory([]);
      setLoading(false);
      return undefined;
    }

    setLoading(true);
    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
      (snapshot) => {
        const entries = sortHistory(snapshot.data()?.queryHistory ?? []);
        setHistory(entries);
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

  const walkThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return history.filter(
      (entry) => entry.result === 'walk' && entry.timestamp >= weekAgo,
    ).length;
  }, [history]);

  return {
    history,
    loading,
    error,
    walkThisWeek,
  };
}
