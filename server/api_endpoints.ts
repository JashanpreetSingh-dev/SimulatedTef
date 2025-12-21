
/**
 * BACKEND BLUEPRINT (Node.js + Express + MongoDB Driver)
 * Use this code in your server.ts or Next.js API routes.
 */

import { MongoClient, ObjectId } from 'mongodb';
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());

const uri = process.env.MONGODB_URI || "";
const client = new MongoClient(uri);
const dbName = process.env.MONGODB_DB_NAME || 'tef';

async function connectDB() {
  await client.connect();
  return client.db(dbName);
}

// POST: Save a new result
app.post('/api/results', async (req, res) => {
  try {
    const db = await connectDB();
    const result = req.body;
    result.createdAt = new Date();
    
    const doc = await db.collection('results').insertOne(result);
    res.status(201).json(doc);
  } catch (err) {
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
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET: Fetch specific result with audio metadata
app.get('/api/results/detail/:id', async (req, res) => {
  try {
    const db = await connectDB();
    const result = await db.collection('results').findOne({ _id: new ObjectId(req.params.id) });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// User Profile Update (Streak, Stats)
app.patch('/api/user/profile/:userId', async (req, res) => {
  try {
    const db = await connectDB();
    const update = await db.collection('users').updateOne(
      { userId: req.params.userId },
      { $set: req.body, $inc: { totalSessions: 1 } },
      { upsert: true }
    );
    res.json(update);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log('Backend ready on port 3001'));
