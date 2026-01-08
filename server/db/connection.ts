/**
 * Centralized MongoDB connection management with connection pooling
 * Audio files are now stored in S3 - GridFS has been removed
 */

import { MongoClient, Db } from 'mongodb';

const uri = process.env.MONGODB_URI || "";
const dbName = process.env.MONGODB_DB_NAME || 'tef_master';

let client: MongoClient | null = null;
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
      serverSelectionTimeoutMS: 30000, // Increased from 5000ms to 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000, // Increased from 10s to 30s
    });
  }

  return client;
}

/**
 * Connect to MongoDB database
 * Reuses existing connection if available
 */
export async function connectDB(): Promise<Db> {
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set. Please add it to your .env file.');
  }

  const mongoClient = getClient();
  
  try {
    // Connect if not already connected
    // MongoDB's connect() is idempotent (safe to call multiple times)
    if (!isConnected) {
      console.log('Attempting to connect to MongoDB...');
      await mongoClient.connect();
      isConnected = true;
      console.log('Connected to MongoDB with connection pooling');
    }
    
    const db = mongoClient.db(dbName);
    
    return db;
  } catch (error: any) {
    isConnected = false;
    console.error('MongoDB connection error:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('timed out')) {
      console.error('\n⚠️  Connection timeout. Possible issues:');
      console.error('   1. MongoDB server is not running (if using local MongoDB)');
      console.error('   2. Network/firewall is blocking the connection');
      console.error('   3. MONGODB_URI is incorrect');
      console.error('   4. MongoDB Atlas IP whitelist restrictions');
      console.error('\n   Check your MONGODB_URI in .env file');
    } else if (error.message.includes('authentication failed')) {
      console.error('\n⚠️  Authentication failed. Check your MongoDB username and password in MONGODB_URI');
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('\n⚠️  Cannot resolve MongoDB hostname. Check your MONGODB_URI connection string');
    }
    
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
      isConnected = false;
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
