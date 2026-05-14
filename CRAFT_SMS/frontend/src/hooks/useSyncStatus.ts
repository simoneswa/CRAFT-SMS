import { useState, useEffect, useCallback } from 'react';
import { SyncEngine, SyncTask } from '@/lib/syncEngine';

export function useSyncStatus() {
  const [isOnline, setIsOnline] = useState(true)
  const [syncQueue, setSyncQueue] = useState<SyncTask[]>([])
  const [hasConflicts, setHasConflicts] = useState(false)

  const updateQueueStatus = useCallback(() => {
    const queue = SyncEngine.getQueue()
    setSyncQueue(queue)
    setHasConflicts(queue.some(t => t.status === 'CONFLICT'))
  }, [])

  useEffect(() => {
    // Initial status + queue snapshot
    const online = navigator.onLine
    setIsOnline(online)
    updateQueueStatus()

    const handleOnline = () => {
      setIsOnline(true)
      SyncEngine.autoSync()
    }

    const handleOffline = () => {
      setIsOnline(false)
    }

    const handleSyncStatusChanged = () => {
      updateQueueStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('sync-status-changed', handleSyncStatusChanged)

    if (online) {
      SyncEngine.autoSync()
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('sync-status-changed', handleSyncStatusChanged)
    }
  }, [updateQueueStatus])

  return {
    isOnline,
    syncQueue,
    hasConflicts,
    pendingCount: syncQueue.filter(t => t.status === 'PENDING').length,
  }
}

