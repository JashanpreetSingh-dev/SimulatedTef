/**
 * Centralized MongoDB connection management with connection pooling
 * Audio files are now stored in S3 - GridFS has been removed
 */

import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let currentUri: string | null = null;

/**
 * Get or create MongoDB client with connection pooling
 */
function getClient(): MongoClient {
  // Read URI dynamically to support test environment changes
  const uri = process.env.MONGODB_URI || '';
  if (!uri) {
    throw new Error('MONGODB_URI is not set');
  }

  // If URI changed, close old client and create new one
  if (client && currentUri !== uri) {
    client.close().catch(() => {});
    client = null;
  }

  if (!client) {
    currentUri = uri;
    client = new MongoClient(uri, {
      maxPoolSize: 10,
      minPoolSize: 2,
      maxIdleTimeMS: 30000,
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
  const dbName = process.env.MONGODB_DB_NAME || 'tef_master';
  
  try {
    // Always call connect() - it's idempotent and handles reconnection
    await mongoClient.connect();
    
    if (process.env.NODE_ENV !== 'test') {
      console.log('Connected to MongoDB with connection pooling');
    }
    
    return mongoClient.db(dbName);
  } catch (error: any) {
    console.error('MongoDB connection error:', error.message);
    throw error;
  }
}

/**
 * Close MongoDB connection gracefully
 */
export async function closeDB(): Promise<void> {
  if (client) {
    try {
      await client.close();
      console.log('MongoDB connection closed');
      client = null;
      currentUri = null;
    } catch (error: any) {
      console.error('Error closing MongoDB connection:', error.message);
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
