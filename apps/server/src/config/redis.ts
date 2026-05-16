import IORedis from 'ioredis';

const redisConfig = {
  host: process.env.REDIS_HOST || '127.0.0.1',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null, // Required by BullMQ
};

export const redisConnection = new IORedis(redisConfig);

redisConnection.on('error', (err) => {
  if (err.code === 'ECONNREFUSED') {
    // Suppress unhandled connection refused to allow server to boot without Redis
    // console.warn('Redis connection refused - running in degraded mode');
  } else {
    console.error('Redis error:', err);
  }
});
