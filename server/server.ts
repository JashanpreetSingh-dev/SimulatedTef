/**
 * Backend Server for TEF Master
 * Uses MongoDB URI to connect to database
 *
 * Required env (all environments):
 * - MONGODB_URI (e.g., mongodb+srv://user:pass@cluster.mongodb.net/)
 *
 * Production also requires:
 * - CLERK_SECRET_KEY
 * - FRONTEND_URL (browser app origin for CORS; no trailing slash required)
 *
 * Optional:
 * - MONGODB_DB_NAME (defaults to 'tef_master')
 * - CORS_ORIGINS (comma-separated extra allowed origins)
 * - SUPER_USER_ID (Clerk user ID that bypasses usage limits)
 *
 * Run with: npm run server
 */

import 'dotenv/config';
import { assertServerEnv, getCorsAllowedOrigins } from './env';
assertServerEnv();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB, closeDB, checkConnectionHealth } from './db/connection';
import { createIndexes } from './db/indexes';
import { errorHandler } from './middleware/errorHandler';
import { requestTimeout } from './middleware/requestTimeout';
import { requestIdMiddleware } from './middleware/requestId';
import { logger } from './logger';
import pinoHttp from 'pino-http';
import { subscriptionService } from './services/subscriptionService';
import { d2cConfigService } from './services/d2cConfigService';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(
  helmet({
    // API + optional SPA static host; strict CSP belongs on the document host after inventory.
    contentSecurityPolicy: false,
  })
);
const corsAllowedOrigins = getCorsAllowedOrigins();
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/$/, '');
      if (corsAllowedOrigins.has(normalized)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
  })
);

// Webhooks need raw body for signature verification
// MUST be mounted BEFORE express.json() middleware
import stripeWebhooksRouter from './routes/stripeWebhooks';
import clerkWebhooksRouter from './routes/clerkWebhooks';
app.use('/api/stripe-webhooks', express.raw({ type: 'application/json' }), stripeWebhooksRouter);
app.use('/api/clerk-webhooks', express.raw({ type: 'application/json' }), clerkWebhooksRouter);

// Increase body parser limit to handle large evaluation job payloads (transcripts, prompts, tasks, fluency analysis)
// This must come AFTER the webhook route to avoid parsing webhook bodies as JSON
app.use(express.json({ limit: '20mb' }));
// Stripe/Clerk webhooks are handled above and never reach this line.
app.use(requestIdMiddleware);
app.use(requestTimeout());
app.use(
  pinoHttp({
    logger,
    genReqId: (req, _res) => req.requestId || '',
    customLogLevel: (_req, res) => (res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info'),
    autoLogging: {
      ignore: (req) => req.url === '/api/health',
    },
  })
);

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      requestId?: string;
    }
  }
}


const dbName = process.env.MONGODB_DB_NAME || 'tef_master';

import { requireAuth } from './middleware/auth';

app.get('/api/health', async (req, res) => {
  const dbHealthy = await checkConnectionHealth();
  
  let queueHealth = null;
  try {
    const { getQueueHealth } = await import('./jobs/evaluationQueue');
    queueHealth = await getQueueHealth();
  } catch (error) {
    // Queue not available
  }
  
  res.status(dbHealthy ? 200 : 503).json({ 
    status: dbHealthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbHealthy ? 'connected' : 'disconnected',
    queue: queueHealth
  });
});

// Initialize database connection and indexes on startup
(async () => {
  try {
    await connectDB();
    await createIndexes();
    // Ensure default data exists (subscription tiers + D2C config) so fresh DB works without manual migrations
    await subscriptionService.initializeSubscriptionTiers();
    await d2cConfigService.ensureDefaultConfig();

    if (process.env.RUN_WORKER === 'true') {
      const { startWorker } = await import('./workers/evaluationWorker');
      startWorker();
      const { startQuestionGenerationWorker } = await import('./workers/questionGenerationWorker');
      startQuestionGenerationWorker();
      const { startEmailWorker } = await import('./workers/emailWorker');
      startEmailWorker();
      logger.info('Workers started in same process (RUN_WORKER=true)');
      
      // Set up periodic cleanup of old jobs to prevent Redis memory issues
      const { cleanupOldJobs } = await import('./jobs/evaluationQueue');
      setInterval(async () => {
        await cleanupOldJobs();
      }, 15 * 60 * 1000); // Clean up every 15 minutes
    } else if (process.env.NODE_ENV !== 'production') {
      if (process.env.RUN_WORKER !== 'false') {
        const { startWorker } = await import('./workers/evaluationWorker');
        startWorker();
        const { startQuestionGenerationWorker } = await import('./workers/questionGenerationWorker');
        startQuestionGenerationWorker();
        const { startEmailWorker } = await import('./workers/emailWorker');
        startEmailWorker();
        logger.info('Workers started in same process (development mode)');
        
        // Set up periodic cleanup of old jobs to prevent Redis memory issues
        const { cleanupOldJobs } = await import('./jobs/evaluationQueue');
        setInterval(async () => {
          await cleanupOldJobs();
        }, 15 * 60 * 1000); // Clean up every 15 minutes
      }
    } else {
      logger.info(
        'Workers not started (RUN_WORKER not set to true). Run workers as separate services in production.'
      );
    }
  } catch (error: unknown) {
    logger.error({ err: error }, 'Failed to initialize');
  }
})();

import apiRouter from './routes';
import { generalApiLimiter } from './middleware/rateLimiter';
app.use('/api', generalApiLimiter, apiRouter);

app.patch('/api/user/profile/:userId', requireAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.userId;
    
    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only update your own profile' });
    }
    
    const update = await db.collection('users').updateOne(
      { userId: authenticatedUserId },
      { 
        $set: { ...req.body, updatedAt: new Date().toISOString() }, 
        $inc: { totalSessions: 1 } 
      },
      { upsert: true }
    );
    res.json(update);
  } catch (err: any) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: err.message });
  }
});

if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for Railway

const server = app.listen(PORT, HOST, () => {
  console.log(`Server running on ${HOST}:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`Serving frontend from dist/`);
  }
  console.log(`Database: ${dbName}`);
  console.log(`Health check available at http://${HOST}:${PORT}/api/health`);
});

/** Run graceful shutdown once (SIGINT and SIGTERM can both fire). */
async function gracefulShutdown(signal: string): Promise<void> {
  if ((gracefulShutdown as any).running) return;
  (gracefulShutdown as any).running = true;
  console.log(`${signal} received, shutting down gracefully...`);

  server.close(async () => {
    try {
      const { stopWorker } = await import('./workers/evaluationWorker');
      await stopWorker();
    } catch {
      // Worker not running
    }
    try {
      const { stopQuestionGenerationWorker } = await import('./workers/questionGenerationWorker');
      await stopQuestionGenerationWorker();
    } catch {
      // Worker not running
    }
    try {
      const { stopEmailWorker } = await import('./workers/emailWorker');
      await stopEmailWorker();
    } catch {
      // Worker not running
    }
    await closeDB();
    process.exit(0);
  });

  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

