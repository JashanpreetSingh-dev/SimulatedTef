/**
 * Backend Server for TEF Master
 * Uses MongoDB URI to connect to database
 * 
 * Required Env Variables:
 * - MONGODB_URI (e.g., mongodb+srv://user:pass@cluster.mongodb.net/)
 * - MONGODB_DB_NAME (optional, defaults to 'tef_master')
 * - CLERK_SECRET_KEY (required for authentication)
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
import { startSubscriptionExpiryJob } from './jobs/subscriptionExpiry';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

// Stripe webhook needs raw body for signature verification
// This MUST be before express.json() middleware
// Use express.raw() middleware specifically for the webhook endpoint
app.post(
  '/api/subscription/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    try {
      // Log body type for debugging
      console.log('📦 Webhook received - Body type:', typeof req.body, 'IsBuffer:', Buffer.isBuffer(req.body));
      
      // Verify body is a Buffer
      if (!Buffer.isBuffer(req.body)) {
        console.error('❌ Webhook: Body is not a Buffer. Type:', typeof req.body, 'Value:', req.body);
        return res.status(400).json({ error: 'Invalid request body format' });
      }
      
      // Import and call webhook handler
      const { subscriptionController } = await import('./controllers/subscriptionController');
      
      // Call handler - it's wrapped in asyncHandler so we need to handle it properly
      const handler = subscriptionController.handleWebhook;
      await handler(req, res, (err?: any) => {
        if (err) {
          console.error('❌ Webhook handler error:', err);
          if (!res.headersSent) {
            res.status(500).json({ error: 'Internal server error' });
          }
        }
      });
    } catch (error: any) {
      console.error('❌ Webhook route error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Internal server error' });
      }
    }
  }
);

// JSON parsing for all other routes (after webhook route)
app.use(express.json());

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}


const dbName = process.env.MONGODB_DB_NAME || 'tef_master';
const clerkSecretKey = process.env.CLERK_SECRET_KEY || "";

// Import auth middleware
import { requireAuth } from './middleware/auth';

// Health check - must be defined early, before any middleware that might fail
app.get('/api/health', async (req, res) => {
  const dbHealthy = await checkConnectionHealth();
  
  // Check queue health if available
  let queueHealth = null;
  try {
    const { getQueueHealth } = await import('./jobs/evaluationQueue');
    queueHealth = await getQueueHealth();
  } catch (error) {
    // Queue not available, skip
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
  console.error('❌ MONGODB_URI is required!');
  console.error('   Add MONGODB_URI to your .env file');
  // Don't exit immediately - allow health check to respond
  // process.exit(1);
}

if (!clerkSecretKey) {
  console.warn('⚠️  CLERK_SECRET_KEY is not set!');
  console.warn('   Authentication will be disabled. Set CLERK_SECRET_KEY for production security.');
}

// Initialize database connection and indexes on startup
(async () => {
  try {
    await connectDB();
    await createIndexes();
    
    // Start subscription expiry job (runs daily to expire cancelled subscriptions)
    startSubscriptionExpiryJob();
    
    // Start worker if RUN_WORKER is set or in development
    if (process.env.RUN_WORKER === 'true' || (process.env.NODE_ENV !== 'production' && process.env.RUN_WORKER !== 'false')) {
      const { startWorker } = await import('./workers/evaluationWorker');
      startWorker();
    }
  } catch (error: any) {
    console.error('❌ Failed to initialize:', error.message);
    // Don't exit - allow health check to respond
  }
})();

// Import and use route modules
import apiRouter from './routes';
app.use('/api', apiRouter);

// User Profile Update (Streak, Stats) - Keep as inline for now
app.patch('/api/user/profile/:userId', requireAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.userId;
    
    // Security: Users can only update their own profile
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

// Serve static files from Vite build in production
if (process.env.NODE_ENV === 'production') {
  const distPath = path.join(__dirname, '..', 'dist');
  app.use(express.static(distPath));
  
  // Serve index.html for all non-API routes (SPA routing)
  app.get('*', (req, res) => {
    // Skip API routes
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Not found' });
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Global error handler (must be last, after all routes)
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for Railway

const server = app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📦 Serving frontend from dist/`);
  }
  console.log(`📦 Database: ${dbName}`);
  console.log(`✅ Health check available at http://${HOST}:${PORT}/api/health`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully...');
  
  // Stop accepting new requests
  server.close(async () => {
    // Close worker if running
    try {
      const { stopWorker } = await import('./workers/evaluationWorker');
      await stopWorker();
    } catch (error) {
      // Worker not running, continue
    }
    
    // Close database connection
    await closeDB();
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully...');
  
  // Stop accepting new requests
  server.close(async () => {
    // Close worker if running
    try {
      const { stopWorker } = await import('./workers/evaluationWorker');
      await stopWorker();
    } catch (error) {
      // Worker not running, continue
    }
    
    // Close database connection
    await closeDB();
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
});

