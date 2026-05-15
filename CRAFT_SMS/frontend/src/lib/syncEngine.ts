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
  private static QUEUE_KEY = 'craft_sms_sync_queue';

  static getQueue(): SyncTask[] {
    if (typeof window === 'undefined') return [];
    const data = localStorage.getItem(this.QUEUE_KEY);
    return data ? JSON.parse(data) : [];
  }

  static saveQueue(queue: SyncTask[]) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(this.QUEUE_KEY, JSON.stringify(queue));
  }

  static async queueRequest(endpoint: string, method: string, payload: any) {
    const queue = this.getQueue();
    const task: SyncTask = {
      id: crypto.randomUUID(),
      endpoint,
      method,
      payload,
      timestamp: new Date().toISOString(),
      status: 'PENDING'
    };
    
    queue.push(task);
    this.saveQueue(queue);

    // Try syncing immediately if online
    if (navigator.onLine) {
      await this.autoSync();
    }
    
    return task;
  }

  static async autoSync() {
    if (!navigator.onLine) return;

    let queue = this.getQueue();
    const pendingTasks = queue.filter(t => t.status === 'PENDING' || t.status === 'FAILED');

    if (pendingTasks.length === 0) return;

    let updatedQueue = [...queue];

    for (const task of pendingTasks) {
      try {
        // Send timestamp along with payload for conflict detection
        const payloadWithTimestamp = {
          ...task.payload,
          client_timestamp: task.timestamp
        };

        const res = await fetchAPI(task.endpoint, {
          method: task.method,
          body: JSON.stringify(payloadWithTimestamp)
        });

        // Update task status
        const index = updatedQueue.findIndex(t => t.id === task.id);
        if (index > -1) {
          updatedQueue[index].status = 'SYNCED';
        }
        console.log(`[SyncEngine] SUCCESS - Task ${task.id} (${task.endpoint}) synced successfully.`);
      } catch (err: any) {
        console.error(`[SyncEngine] ERROR - Task ${task.id} failed:`, err);
        const index = updatedQueue.findIndex(t => t.id === task.id);
        if (index > -1) {
          if (err.message?.includes('Conflict')) {
             console.warn(`[SyncEngine] CONFLICT DETECTED - Task ${task.id}. Manual resolution required.`);
             updatedQueue[index].status = 'CONFLICT';
             updatedQueue[index].errorMessage = err.message;
          } else {
             updatedQueue[index].status = 'FAILED';
             updatedQueue[index].errorMessage = err.message;
          }
        }
      }
    }

    // Retain conflicts so user can resolve them, clear successful syncs
    updatedQueue = updatedQueue.filter(t => t.status !== 'SYNCED');
    this.saveQueue(updatedQueue);
    
    // Dispatch an event to update UI
    if (typeof window !== 'undefined') {
       window.dispatchEvent(new Event('sync-status-changed'));
    }
  }
  
  static clearConflicts() {
     let queue = this.getQueue();
     queue = queue.filter(t => t.status !== 'CONFLICT');
     this.saveQueue(queue);
     if (typeof window !== 'undefined') {
       window.dispatchEvent(new Event('sync-status-changed'));
     }
  }
}
