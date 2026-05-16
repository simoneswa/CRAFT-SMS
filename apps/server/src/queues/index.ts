import { createQueue } from '../lib/queueFactory';

export const smsQueue = createQueue('sms-queue');
export const syncQueue = createQueue('sync-queue');
export const reportQueue = createQueue('report-queue');

console.log('[QUEUES] Granular worker queues initialized (sms, sync, report)');
