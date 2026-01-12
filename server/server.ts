/**
 * Backend Server for TEF Master
 * Uses MongoDB URI to connect to database
 * 
 * Required Env Variables:
 * - MONGODB_URI (e.g., mongodb+srv://user:pass@cluster.mongodb.net/)
 * - MONGODB_DB_NAME (optional, defaults to 'tef_master')
 * - CLERK_SECRET_KEY (required for authentication)
 * - SUPER_USER_ID (optional, Clerk user ID that bypasses all usage limits)
 * 
 * Run with: npm run server
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';
import { connectDB, closeDB, checkConnectionHealth } from './db/connection';
import { createIndexes } from './db/indexes';
import { errorHandler } from './middleware/errorHandler';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Increase body parser limit to handle large evaluation job payloads (transcripts, prompts, tasks, fluency analysis)
app.use(express.json({ limit: '10mb' }));

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}


const dbName = process.env.MONGODB_DB_NAME || 'tef_master';
const clerkSecretKey = process.env.CLERK_SECRET_KEY || "";

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

if (!process.env.MONGODB_URI) {
  console.error('MONGODB_URI is required!');
  console.error('Add MONGODB_URI to your .env file');
}

if (!clerkSecretKey) {
  console.warn('CLERK_SECRET_KEY is not set!');
  console.warn('Authentication will be disabled. Set CLERK_SECRET_KEY for production security.');
}

// Initialize database connection and indexes on startup
(async () => {
  try {
    await connectDB();
    await createIndexes();
    
    if (process.env.RUN_WORKER === 'true') {
      const { startWorker } = await import('./workers/evaluationWorker');
      startWorker();
      const { startQuestionGenerationWorker } = await import('./workers/questionGenerationWorker');
      startQuestionGenerationWorker();
      console.log('Workers started in same process (RUN_WORKER=true)');
    } else if (process.env.NODE_ENV !== 'production') {
      if (process.env.RUN_WORKER !== 'false') {
        const { startWorker } = await import('./workers/evaluationWorker');
        startWorker();
        const { startQuestionGenerationWorker } = await import('./workers/questionGenerationWorker');
        startQuestionGenerationWorker();
        console.log('Workers started in same process (development mode)');
      }
    } else {
      console.log('Workers not started (RUN_WORKER not set to true). Run workers as separate services in production.');
    }
  } catch (error: any) {
    console.error('Failed to initialize:', error.message);
  }
})();

import apiRouter from './routes';
app.use('/api', apiRouter);

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

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  server.close(async () => {
    try {
      const { stopWorker } = await import('./workers/evaluationWorker');
      await stopWorker();
    } catch (error) {
      // Worker not running
    }
    try {
      const { stopQuestionGenerationWorker } = await import('./workers/questionGenerationWorker');
      await stopQuestionGenerationWorker();
    } catch (error) {
      // Worker not running
    }
    
    await closeDB();
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  server.close(async () => {
    try {
      const { stopWorker } = await import('./workers/evaluationWorker');
      await stopWorker();
    } catch (error) {
      // Worker not running
    }
    try {
      const { stopQuestionGenerationWorker } = await import('./workers/questionGenerationWorker');
      await stopQuestionGenerationWorker();
    } catch (error) {
      // Worker not running
    }
    
    await closeDB();
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

