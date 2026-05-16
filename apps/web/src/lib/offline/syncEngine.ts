import { db } from './db';
import { fetchAPI } from '../api';

export class SyncEngine {
  private static isSyncing = false;
  private static retryCounts: Record<number, number> = {};
  private static MAX_RETRIES = 5;
  private static backoffTime = 1000;

  static async queueMutation(table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any) {
    const id = await db.mutations.add({
      table,
      action,
      data,
      timestamp: Date.now()
    });
    
    if (navigator.onLine) {
      this.processQueue();
    }
  }

  static async processQueue() {
    if (this.isSyncing || !navigator.onLine) return;
    
    // Bandwidth Awareness (Liberia Context)
    const conn = (navigator as any).connection;
    const isBandwidthConstrained = conn && (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g' || conn.effectiveType === '3g');

    this.isSyncing = true;

    try {
      const mutations = await db.mutations.orderBy('timestamp').toArray();
      if (mutations.length === 0) return;

      // Prioritize Critical Records
      const criticalTables = ['attendance', 'slips', 'academic_records'];
      const sortedMutations = [...mutations].sort((a, b) => {
        if (isBandwidthConstrained) {
          const aCrit = criticalTables.includes(a.table) ? 1 : 0;
          const bCrit = criticalTables.includes(b.table) ? 1 : 0;
          return bCrit - aCrit;
        }
        return 0;
      });

      for (const mutation of sortedMutations) {
        if (!mutation.id) continue;
        
        // Skip non-critical items if extremely constrained
        if (isBandwidthConstrained && !criticalTables.includes(mutation.table) && conn?.saveData) {
          continue;
        }

        try {
          await this.syncMutation(mutation);
          await db.mutations.delete(mutation.id);
          this.backoffTime = 1000; // Reset backoff
        } catch (err: any) {
          console.error(`Sync error (${mutation.table}):`, err);
          
          if (err.status === 409) {
            await db.mutations.update(mutation.id, { 
                lastError: 'CONFLICT: Manual resolution required' 
            });
            continue;
          }

          // Exponential Backoff
          this.backoffTime = Math.min(this.backoffTime * 2, 30000);
          setTimeout(() => this.processQueue(), this.backoffTime);
          break;
        }
      }
    } finally {
      this.isSyncing = false;
    }
  }

  private static async syncMutation(mutation: any) {
    const endpoint = this.getEndpoint(mutation.table);
    await fetchAPI(endpoint, {
        method: mutation.action === 'INSERT' ? 'POST' : 'PATCH',
        body: JSON.stringify(mutation.data),
        headers: { 'X-Sync-Timestamp': mutation.timestamp.toString() }
    });
    await this.markAsSynced(mutation.table, mutation.data);
  }

  private static getEndpoint(table: string) {
    switch (table) {
      case 'attendance': return '/academic/attendance/batch';
      case 'grades': return '/academic/grades';
      case 'slips': return '/finance/slips/verify';
      default: return '/academic/records';
    }
  }

  private static async markAsSynced(table: string, data: any) {
    if (table === 'attendance') {
        await db.attendance
            .where({ student_id: data.student_id, date: data.date })
            .modify({ syncStatus: 'SYNCED' });
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => SyncEngine.processQueue());
}
