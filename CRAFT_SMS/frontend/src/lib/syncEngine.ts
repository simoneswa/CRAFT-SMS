import { db } from './offline/db';
import { fetchAPI } from './api';

export interface SyncTask {
  id: string;
  endpoint: string;
  method: string;
  payload: any;
  timestamp: string;
  status: 'PENDING' | 'SYNCED' | 'CONFLICT' | 'FAILED';
  errorMessage?: string;
}

export class SyncEngine {
  private static isSyncing = false;
  private static backoffTime = 1000;
  private static readonly MAX_BACKOFF = 30000;

  /**
   * Queue a request to be synced. Persists to IndexedDB (Dexie).
   * Attempts immediate sync if online.
   */
  static async queueRequest(endpoint: string, method: string, payload: any): Promise<SyncTask> {
    const task: SyncTask = {
      id: crypto.randomUUID(),
      endpoint,
      method,
      payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING',
    };

    await db.mutations.add({
      table: endpoint,
      action: method === 'DELETE' ? 'DELETE' : method === 'PATCH' ? 'UPDATE' : 'INSERT',
      data: {
        _syncTaskId: task.id,
        _endpoint: endpoint,
        _method: method,
        _timestamp: task.timestamp,
        ...payload,
      },
      timestamp: Date.now(),
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sync-status-changed'));
      if (navigator.onLine) {
        this.autoSync();
      }
    }

    return task;
  }

  /**
   * Attempt to sync all pending mutations with the server.
   * Handles bandwidth awareness and exponential backoff.
   */
  static async autoSync(): Promise<void> {
    if (typeof window === 'undefined' || !navigator.onLine || this.isSyncing) return;
    this.isSyncing = true;

    try {
      const mutations = await db.mutations.orderBy('timestamp').toArray();
      if (mutations.length === 0) return;

      // Bandwidth awareness (low-connectivity environments)
      const conn = (navigator as any).connection;
      const isConstrained = conn && ['slow-2g', '2g', '3g'].includes(conn.effectiveType);
      const criticalPaths = ['/attendance', '/slips', '/academic'];

      const sorted = isConstrained
        ? [...mutations].sort((a, b) => {
            const aCrit = criticalPaths.some(p => a.table.includes(p)) ? 1 : 0;
            const bCrit = criticalPaths.some(p => b.table.includes(p)) ? 1 : 0;
            return bCrit - aCrit;
          })
        : mutations;

      for (const mutation of sorted) {
        if (!mutation.id) continue;
        // Skip conflicts — require manual resolution
        if (mutation.lastError?.startsWith('CONFLICT')) continue;
        // Skip non-critical on saveData mode
        if (isConstrained && conn?.saveData && !criticalPaths.some(p => mutation.table.includes(p))) continue;

        try {
          const { _syncTaskId, _endpoint, _method, _timestamp, ...cleanPayload } = mutation.data || {};
          const endpoint = _endpoint || mutation.table;
          const method = _method || 'POST';

          await fetchAPI(endpoint, {
            method,
            body: JSON.stringify({ ...cleanPayload, client_timestamp: _timestamp }),
            headers: { 'X-Sync-Timestamp': String(mutation.timestamp) },
          });

          await db.mutations.delete(mutation.id);
          this.backoffTime = 1000; // reset on success
          console.log(`[SyncEngine] SUCCESS — Synced ${endpoint}`);
        } catch (err: any) {
          console.error(`[SyncEngine] ERROR — Failed: ${mutation.table}`, err);
          if (err.status === 409 || err.message?.toLowerCase().includes('conflict')) {
            await db.mutations.update(mutation.id, { lastError: `CONFLICT: ${err.message}` });
          } else {
            await db.mutations.update(mutation.id, { lastError: err.message });
            // Exponential backoff for transient errors
            this.backoffTime = Math.min(this.backoffTime * 2, this.MAX_BACKOFF);
            setTimeout(() => this.autoSync(), this.backoffTime);
            break;
          }
        }
      }
    } finally {
      this.isSyncing = false;
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('sync-status-changed'));
      }
    }
  }

  /** Clear all conflict-state mutations (after manual resolution) */
  static async clearConflicts(): Promise<void> {
    const all = await db.mutations.toArray();
    const ids = all
      .filter(m => m.lastError?.startsWith('CONFLICT'))
      .map(m => m.id!)
      .filter(Boolean);
    if (ids.length > 0) await db.mutations.bulkDelete(ids);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sync-status-changed'));
    }
  }

  /** Dev-only: inject a fake conflict entry for UI testing */
  static async debugAddConflict(): Promise<void> {
    await db.mutations.add({
      table: '/api/mock',
      action: 'INSERT',
      data: { _endpoint: '/api/mock', _method: 'POST', test: true },
      timestamp: Date.now(),
      lastError: 'CONFLICT: Mock — Timestamp mismatch detected.',
    });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('sync-status-changed'));
    }
  }
}

// Auto-sync whenever the browser reconnects
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => SyncEngine.autoSync());
}
