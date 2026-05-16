import { Queue, Worker, QueueOptions, WorkerOptions } from 'bullmq';
import { redisConnection } from '../config/redis';

export const createQueue = (name: string, options?: QueueOptions) => {
  return new Queue(name, {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: true,
      removeOnFail: false,
    },
    ...options,
  });
};

export const createWorker = (name: string, processor: any, options?: WorkerOptions) => {
  return new Worker(name, processor, {
    connection: redisConnection,
    ...options,
  });
};
