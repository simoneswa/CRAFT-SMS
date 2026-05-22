import { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '@/lib/offline/db';
import { SyncEngine } from '@/lib/syncEngine';

export interface SyncTask {
  id: string;
  endpoint: string;
  method: string;
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'CONFLICT' | 'FAILED';
  errorMessage?: string;
}

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof window !== 'undefined' ? navigator.onLine : true
  );

  // Reactively watch the Dexie mutations table — updates automatically on any change
  const mutations = useLiveQuery(() => db.mutations.toArray(), []) ?? [];

  const pendingCount = mutations.filter(m => !m.lastError?.startsWith('CONFLICT')).length;
  const hasConflicts = mutations.some(m => m.lastError?.startsWith('CONFLICT'));

  const syncQueue: SyncTask[] = mutations.map(m => ({
    id: String(m.id ?? ''),
    endpoint: m.data?._endpoint ?? m.table,
    method: m.data?._method ?? 'POST',
    payload: m.data,
    timestamp: m.data?._timestamp ?? new Date(m.timestamp).toISOString(),
    status: m.lastError?.startsWith('CONFLICT') ? 'CONFLICT' : 'PENDING',
    errorMessage: m.lastError,
  }));

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      SyncEngine.autoSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Attempt sync on mount if already online
    if (navigator.onLine) {
      SyncEngine.autoSync();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    syncQueue,
    hasConflicts,
    pendingCount,
  };
}
