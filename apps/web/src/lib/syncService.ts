import { db } from './dexie';
import { fetchAPI } from './api';

export class SyncService {
  /**
   * Push all unsynced events from Dexie to the backend EventAppendService
   */
  static async pushUnsyncedEvents() {
    console.log('[SyncService] Checking for unsynced events...');
    const unsynced = await db.getUnsyncedEvents();

    if (unsynced.length === 0) {
      console.log('[SyncService] No events to sync.');
      return;
    }

    console.log(`[SyncService] Found ${unsynced.length} events to sync. Pushing...`);
    
    const syncedIds: number[] = [];

    for (const event of unsynced) {
      try {
        // Here we simulate pushing to the event append API
        // In a real app, this would be an endpoint like POST /api/events/append
        const response = await fetchAPI('/events/append', {
          method: 'POST',
          body: JSON.stringify({
            streamId: event.streamId,
            streamType: event.streamType,
            eventType: event.eventType,
            tenantId: event.tenantId,
            data: event.data,
            metadata: event.metadata,
          })
        });

        console.log(`[SyncService] Successfully synced event ${event.id}`);
        syncedIds.push(event.id!);
      } catch (error) {
        console.error(`[SyncService] Failed to sync event ${event.id}:`, error);
        // Break early if network is down to maintain ordering
        break;
      }
    }

    if (syncedIds.length > 0) {
      await db.markAsSynced(syncedIds);
      console.log(`[SyncService] Marked ${syncedIds.length} events as synced locally.`);
    }
  }

  /**
   * Listen for online events and trigger sync
   */
  static initAutoSync() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[SyncService] Device is online. Triggering sync...');
        this.pushUnsyncedEvents();
      });
      
      // Periodic sync fallback
      setInterval(() => {
        if (navigator.onLine) {
          this.pushUnsyncedEvents();
        }
      }, 60000); // Every 1 minute
    }
  }
}
