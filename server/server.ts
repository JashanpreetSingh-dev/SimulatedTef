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

import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import { verifyToken } from '@clerk/backend';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Extend Express Request type to include userId
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Multer for handling multipart/form-data (file uploads)
const upload = multer({ storage: multer.memoryStorage() });

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || 'tef_master';
const clerkSecretKey = process.env.CLERK_SECRET_KEY || "";

// Clerk authentication middleware
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  // Skip auth if CLERK_SECRET_KEY is not set (for development)
  if (!clerkSecretKey) {
    // In development, allow requests but warn
    req.userId = req.body.userId || req.params.userId || 'guest';
    return next();
  }

  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify token with Clerk
    const sessionClaims = await verifyToken(token, { secretKey: clerkSecretKey });
    
    // Extract userId from session claims
    req.userId = sessionClaims.sub; // 'sub' is the user ID in Clerk tokens
    next();
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

// Health check - must be defined early, before any middleware that might fail
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

if (!uri) {
  console.error('❌ MONGODB_URI is required!');
  console.error('   Add MONGODB_URI to your .env file');
  // Don't exit immediately - allow health check to respond
  // process.exit(1);
}

if (!clerkSecretKey) {
  console.warn('⚠️  CLERK_SECRET_KEY is not set!');
  console.warn('   Authentication will be disabled. Set CLERK_SECRET_KEY for production security.');
}

let client: MongoClient;
let gridFSBucket: GridFSBucket;

async function connectDB() {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }
  if (!client) {
    client = new MongoClient(uri);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    // Initialize GridFS bucket for audio recordings
    const db = client.db(dbName);
    gridFSBucket = new GridFSBucket(db, { bucketName: 'recordings' });
    console.log('✅ GridFS bucket initialized');
  }
  return client.db(dbName);
}

// POST: Upload audio recording to GridFS
app.post('/api/recordings/upload', requireAuth, upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Validate file size
    if (req.file.size === 0) {
      return res.status(400).json({ error: 'Empty audio file provided' });
    }

    if (req.file.size < 100) {
      return res.status(400).json({ error: 'Audio file too small, likely invalid' });
    }
    
    await connectDB(); // Ensure GridFS is initialized
    
    // Use authenticated userId from middleware (not from request body)
    const userId = req.userId || 'guest';
    
    // Use the original filename from the request, or generate one
    const originalFilename = req.file.originalname || `${userId}_${Date.now()}.wav`;
    
    // Determine content type from file extension or mimetype
    let contentType = req.file.mimetype || 'audio/wav';
    if (!contentType.startsWith('audio/')) {
      // Fallback: determine from extension
      if (originalFilename.endsWith('.webm')) {
        contentType = 'audio/webm';
      } else if (originalFilename.endsWith('.ogg')) {
        contentType = 'audio/ogg';
      } else if (originalFilename.endsWith('.m4a')) {
        contentType = 'audio/mp4';
      } else {
        contentType = 'audio/wav';
      }
    }
    
    // Upload to GridFS
    const uploadStream = gridFSBucket.openUploadStream(originalFilename, {
      contentType: contentType,
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        originalMimeType: req.file.mimetype,
      },
    });
    
    uploadStream.end(req.file.buffer);
    
    uploadStream.on('finish', () => {
      console.log(`✅ Audio uploaded to GridFS: ${originalFilename} (${(req.file!.size / 1024).toFixed(2)} KB)`);
      res.status(201).json({ 
        recordingId: uploadStream.id.toString(),
        filename: originalFilename,
        size: req.file!.size,
        contentType: contentType,
      });
    });
    
    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      res.status(500).json({ error: 'Failed to upload recording' });
    });
  } catch (err: any) {
    console.error('Error uploading recording:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Download audio recording from GridFS
app.get('/api/recordings/:id', requireAuth, async (req, res) => {
  try {
    await connectDB(); // Ensure GridFS is initialized
    
    const recordingId = req.params.id;
    const userId = req.userId;
    
    // Validate ObjectId format
    if (!ObjectId.isValid(recordingId)) {
      return res.status(400).json({ error: 'Invalid recording ID format' });
    }
    
    // Check if file exists
    const files = await gridFSBucket.find({ _id: new ObjectId(recordingId) }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    const file = files[0];
    
    // Verify the recording belongs to the authenticated user
    if (file.metadata?.userId && file.metadata.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this recording' });
    }
    
    // Determine content type from file metadata or filename
    let contentType = file.contentType || 'audio/wav';
    if (!contentType.startsWith('audio/')) {
      // Fallback: determine from filename
      if (file.filename.endsWith('.webm')) {
        contentType = 'audio/webm';
      } else if (file.filename.endsWith('.ogg')) {
        contentType = 'audio/ogg';
      } else if (file.filename.endsWith('.m4a')) {
        contentType = 'audio/mp4';
      } else {
        contentType = 'audio/wav';
      }
    }
    
    // Set headers for audio streaming with CORS support
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.length.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Stream file from GridFS
    const downloadStream = gridFSBucket.openDownloadStream(new ObjectId(recordingId));
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download recording' });
      } else {
        res.end();
      }
    });
    
    downloadStream.on('end', () => {
      console.log(`✅ Audio downloaded: ${file.filename} (${(file.length / 1024).toFixed(2)} KB)`);
    });
  } catch (err: any) {
    console.error('Error downloading recording:', err);
    if (!res.headersSent) {
      // Check if it's an ObjectId error
      if (err.message && err.message.includes('ObjectId')) {
        res.status(400).json({ error: 'Invalid recording ID format' });
      } else {
        res.status(500).json({ error: err.message || 'Failed to download recording' });
      }
    }
  }
});

// POST: Save a new result
app.post('/api/results', requireAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const result = req.body;
    
    // Override userId with authenticated userId (security)
    result.userId = req.userId;
    result.createdAt = new Date().toISOString();
    result.updatedAt = new Date().toISOString();
    
    const doc = await db.collection('results').insertOne(result);
    res.status(201).json({ insertedId: doc.insertedId, ...result });
  } catch (err: any) {
    console.error('Error saving result:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch all results for a user
app.get('/api/results/:userId', requireAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.userId;
    
    // Security: Users can only fetch their own results
    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own results' });
    }
    
    const results = await db.collection('results')
      .find({ userId: authenticatedUserId })
      .sort({ timestamp: -1 })
      .toArray();
      
    res.json(results);
  } catch (err: any) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch specific result with audio metadata
app.get('/api/results/detail/:id', requireAuth, async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('results').findOne({ _id: new ObjectId(req.params.id) });
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    
    // Security: Users can only access their own results
    if (result.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this result' });
    }
    
    res.json(result);
  } catch (err: any) {
    console.error('Error fetching result:', err);
    res.status(500).json({ error: err.message });
  }
});

// User Profile Update (Streak, Stats)
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

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Listen on all interfaces for Railway
app.listen(PORT, HOST, () => {
  console.log(`🚀 Server running on ${HOST}:${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📦 Serving frontend from dist/`);
  }
  console.log(`📦 Database: ${dbName}`);
  console.log(`✅ Health check available at http://${HOST}:${PORT}/api/health`);
});

