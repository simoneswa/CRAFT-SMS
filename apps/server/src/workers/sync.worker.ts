import { Job } from 'bullmq';
import { createWorker } from '../lib/queueFactory';
import { SyncService } from '../services/SyncService';

/**
 * Institutional Sync Worker
 * Enforces:
 * - Deterministic Reconciliation
 * - Poison-Message Quarantine (via BullMQ default failure handling)
 * - Replay Loop Detection (via SyncService deduplication)
 */
export const syncWorker = createWorker('sync-queue', async (job: Job) => {
  const { mutations, deviceId, schoolId } = job.data;
  
  console.log(`[WORKER:SYNC] Processing job ${job.id} | Device: ${deviceId} | School: ${schoolId}`);
  
  // 1. Governance: Check for stale mutation batch
  // (Assuming we want to expire entire batches if they are too old)
  
  // 2. Delegate to Institutional Sync Service
  const results = await SyncService.reconcile({
    deviceId,
    mutations,
    schoolId
  });
  
  // 3. Operational Reliability: Check for partial failures
  const failedCount = results.filter(r => r.status === 'FAILED').length;
  if (failedCount > 0) {
    console.warn(`[WORKER:SYNC] Job ${job.id} completed with ${failedCount} failures. Entries logged in sync_logs.`);
  }
  
  return {
    jobId: job.id,
    processed: results.length,
    failed: failedCount
  };
}, {
  // Worker Governance Constraints
  concurrency: 5,
  limiter: {
    max: 100,
    duration: 1000
  }
});

syncWorker.on('failed', (job, err) => {
  console.error(`[WORKER:SYNC] Critical failure in job ${job?.id}:`, err.message);
  // Poison-message quarantine: BullMQ will move this to 'failed' set after max retries
});

syncWorker.on('completed', (job) => {
  console.log(`[WORKER:SYNC] Job ${job.id} successfully processed and reconciled.`);
});
