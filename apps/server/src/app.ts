import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import gradesRouter from './modules/grades/grades.routes';
import attendanceRouter from './modules/attendance/attendance.routes';
import deviceRouter from './modules/devices/device.routes';

import { requestLogger } from './middleware/requestLogger';

dotenv.config();

const app = express();

// Global Observability
app.use(requestLogger);

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Observability (Reservation for Sentry/OpenTelemetry)
// Sentry.init({...});
// const tracer = opentelemetry.trace.getTracer('craft-sms-backend');

import prisma from './lib/prisma';
import { redisConnection } from './config/redis';

// Routes
app.get('/api/v1/health', async (req, res) => {
  const checks: any = {
    database: 'down',
    redis: 'down',
  };

  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
    checks.database = 'up';
  } catch (e) {
    checks.database = 'down';
  }

  try {
    await Promise.race([
      redisConnection.ping(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 2000))
    ]);
    checks.redis = 'up';
  } catch (e) {
    checks.redis = 'down';
  }

  const isHealthy = checks.database === 'up' && checks.redis === 'up';

  res.status(isHealthy ? 200 : 503).json({ 
    status: isHealthy ? 'ok' : 'degraded', 
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    checks,
    timestamp: new Date().toISOString() 
  });
});

app.use('/api/v1/grades', gradesRouter);
app.use('/api/v1/attendance', attendanceRouter);
app.use('/api/v1/devices', deviceRouter);

// TODO: Register Other Module Routes

export default app;
