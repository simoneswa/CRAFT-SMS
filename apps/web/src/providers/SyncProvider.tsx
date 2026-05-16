'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { db, PendingMutation } from '@/lib/offline/db'
import { fetchAPI } from '@/lib/api'
import { useLiveQuery } from 'dexie-react-hooks'

interface SyncContextType {
  isOnline: boolean
  pendingCount: number
  lastSyncAt: Date | null
  flushQueue: () => Promise<void>
}

const SyncContext = createContext<SyncContextType | undefined>(undefined)

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(null)
  
  const pendingMutations = useLiveQuery(() => db.pendingMutations.toArray())
  const pendingCount = pendingMutations?.length || 0

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      flushQueue()
    }
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const flushQueue = async () => {
    if (!navigator.onLine || pendingCount === 0) return

    console.log(`[SYNC] Flushing ${pendingCount} mutations...`)
    
    // Batch mutations by type/school for efficiency
    const mutations = await db.pendingMutations.where('status').equals('PENDING').toArray()
    
    try {
      // Send to backend versioned sync endpoint
      const result = await fetchAPI('/sync/flush', {
        method: 'POST',
        body: JSON.stringify({
          deviceId: localStorage.getItem('craft_device_id'),
          mutations
        })
      })

      if (result.success) {
        // Clear acknowledged mutations
        const mutationIds = mutations.map(m => m.id)
        await db.pendingMutations.bulkDelete(mutationIds)
        setLastSyncAt(new Date())
        console.log(`[SYNC] Successfully flushed ${mutationIds.length} mutations`)
      }
    } catch (error) {
      console.error('[SYNC] Flush failed:', error)
      // Update retry counts
      await db.pendingMutations.bulkUpdate(
        mutations.map(m => ({
          key: m.id,
          changes: { retryCount: (m.retryCount || 0) + 1, status: 'FAILED' }
        }))
      )
    }
  }

  return (
    <SyncContext.Provider value={{ isOnline, pendingCount, lastSyncAt, flushQueue }}>
      {children}
      
      {/* Visual Sync Indicator (Analytics UI) */}
      {pendingCount > 0 && (
        <div className="fixed bottom-4 right-4 bg-teal-600 text-white px-4 py-2 rounded-full shadow-lg flex items-center gap-2 animate-pulse z-50">
          <div className="w-2 h-2 bg-white rounded-full"></div>
          <span className="text-sm font-medium">Syncing {pendingCount} updates...</span>
        </div>
      )}
    </SyncContext.Provider>
  )
}

export const useSync = () => {
  const context = useContext(SyncContext)
  if (!context) throw new Error('useSync must be used within a SyncProvider')
  return context
}
