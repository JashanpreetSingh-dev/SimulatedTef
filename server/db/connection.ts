/**
 * Centralized MongoDB connection management with connection pooling
 */

import { MongoClient, Db, GridFSBucket } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || 'tef_master';

let client: MongoClient | null = null;
let gridFSBucket: GridFSBucket | null = null;
let isConnected = false;

/**
 * Get or create MongoDB client with connection pooling
 */
function getClient(): MongoClient {
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  if (!client) {
    client = new MongoClient(uri, {
      maxPoolSize: 10,        // Maximum connections in pool
      minPoolSize: 2,        // Minimum connections in pool
      maxIdleTimeMS: 30000,  // Close idle connections after 30s
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 10000,
    });
  }

  return client;
}

/**
 * Connect to MongoDB database
 * Reuses existing connection if available
 */
export async function connectDB(): Promise<Db> {
  const mongoClient = getClient();
  
  try {
    // Connect if not already connected
    // MongoDB's connect() is idempotent (safe to call multiple times)
    if (!isConnected) {
      await mongoClient.connect();
      isConnected = true;
      console.log('✅ Connected to MongoDB with connection pooling');
    }
    
    const db = mongoClient.db(dbName);
    
    // Initialize GridFS bucket if not already initialized
    if (!gridFSBucket) {
      gridFSBucket = new GridFSBucket(db, { bucketName: 'recordings' });
      console.log('✅ GridFS bucket initialized');
    }
    
    return db;
  } catch (error: any) {
    isConnected = false;
    console.error('❌ MongoDB connection error:', error.message);
    throw error;
  }
}

/**
 * Get GridFS bucket for audio recordings
 */
export function getGridFSBucket(): GridFSBucket {
  if (!gridFSBucket) {
    throw new Error('GridFS bucket not initialized. Call connectDB() first.');
  }
  return gridFSBucket;
}

/**
 * Close MongoDB connection gracefully
 */
export async function closeDB(): Promise<void> {
  if (client) {
    try {
      await client.close();
      console.log('✅ MongoDB connection closed');
      client = null;
      gridFSBucket = null;
      isConnected = false;
    } catch (error: any) {
      console.error('❌ Error closing MongoDB connection:', error.message);
      throw error;
    }
  }
}

/**
 * Check MongoDB connection health
 */
export async function checkConnectionHealth(): Promise<boolean> {
  try {
    const db = await connectDB();
    await db.admin().ping();
    return true;
  } catch (error) {
    return false;
  }
}

