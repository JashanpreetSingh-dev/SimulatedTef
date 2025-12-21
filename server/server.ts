/**
 * Backend Server for TEF Master
 * Uses MongoDB URI to connect to database
 * 
 * Required Env Variables:
 * - MONGODB_URI (e.g., mongodb+srv://user:pass@cluster.mongodb.net/)
 * - MONGODB_DB_NAME (optional, defaults to 'tef')
 * 
 * Run with: npm run server
 */

import { MongoClient, ObjectId, GridFSBucket } from 'mongodb';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import 'dotenv/config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Multer for handling multipart/form-data (file uploads)
const upload = multer({ storage: multer.memoryStorage() });

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || 'tef_master';

if (!uri) {
  console.error('❌ MONGODB_URI is required!');
  console.error('   Add MONGODB_URI to your .env file');
  process.exit(1);
}

let client: MongoClient;
let gridFSBucket: GridFSBucket;

async function connectDB() {
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

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// POST: Upload audio recording to GridFS
app.post('/api/recordings/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }
    
    await connectDB(); // Ensure GridFS is initialized
    
    const userId = req.body.userId || 'guest';
    const filename = `${userId}_${Date.now()}.wav`;
    
    // Upload to GridFS
    const uploadStream = gridFSBucket.openUploadStream(filename, {
      contentType: 'audio/wav',
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });
    
    uploadStream.end(req.file.buffer);
    
    uploadStream.on('finish', () => {
      res.status(201).json({ 
        recordingId: uploadStream.id.toString(),
        filename,
        size: req.file!.size,
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
app.get('/api/recordings/:id', async (req, res) => {
  try {
    await connectDB(); // Ensure GridFS is initialized
    
    const recordingId = req.params.id;
    
    // Check if file exists
    const files = await gridFSBucket.find({ _id: new ObjectId(recordingId) }).toArray();
    if (files.length === 0) {
      return res.status(404).json({ error: 'Recording not found' });
    }
    
    // Set headers for audio streaming
    res.setHeader('Content-Type', 'audio/wav');
    res.setHeader('Content-Disposition', `inline; filename="${files[0].filename}"`);
    
    // Stream file from GridFS
    const downloadStream = gridFSBucket.openDownloadStream(new ObjectId(recordingId));
    downloadStream.pipe(res);
    
    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download recording' });
      }
    });
  } catch (err: any) {
    console.error('Error downloading recording:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST: Save a new result
app.post('/api/results', async (req, res) => {
  try {
    const db = await connectDB();
    const result = req.body;
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
app.get('/api/results/:userId', async (req, res) => {
  try {
    const db = await connectDB();
    const userId = req.params.userId;
    
    const results = await db.collection('results')
      .find({ userId })
      .sort({ timestamp: -1 })
      .toArray();
      
    res.json(results);
  } catch (err: any) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch specific result with audio metadata
app.get('/api/results/detail/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('results').findOne({ _id: new ObjectId(req.params.id) });
    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }
    res.json(result);
  } catch (err: any) {
    console.error('Error fetching result:', err);
    res.status(500).json({ error: err.message });
  }
});

// User Profile Update (Streak, Stats)
app.patch('/api/user/profile/:userId', async (req, res) => {
  try {
    const db = await connectDB();
    const update = await db.collection('users').updateOne(
      { userId: req.params.userId },
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`📦 Serving frontend from dist/`);
  }
  console.log(`📦 Database: ${dbName}`);
});

