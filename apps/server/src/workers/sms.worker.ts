import { Job } from 'bullmq';
import { createWorker } from '../lib/queueFactory';
import { AfricasTalkingProvider } from '../lib/sms/AfricasTalkingProvider';
import { SmsPayload } from '../lib/sms/SmsProvider';

const provider = new AfricasTalkingProvider();

export const smsWorker = createWorker('sms-queue', async (job: Job) => {
  const payload = job.data as SmsPayload;
  
  console.log(`[WORKER:SMS] Processing job ${job.id} for ${payload.to}`);
  
  const result = await provider.send(payload);
  
  if (!result.success) {
    throw new Error(`SMS failed: ${result.error}`);
  }
  
  return result;
});

smsWorker.on('completed', (job) => {
  console.log(`[WORKER:SMS] Job ${job.id} completed successfully`);
});

smsWorker.on('failed', (job, err) => {
  console.error(`[WORKER:SMS] Job ${job?.id} failed: ${err.message}`);
});
