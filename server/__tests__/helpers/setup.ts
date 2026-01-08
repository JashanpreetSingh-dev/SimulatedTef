/**
 * Global test setup and teardown
 * 
 * IMPORTANT: Set a placeholder MONGODB_URI before any imports
 * to prevent connection module from throwing errors during import
 */
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017';
process.env.MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || 'tef_master_test';
process.env.NODE_ENV = 'test';

import { beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { connectDB, closeDB } from '../../db/connection';
import { cleanupTestDb } from './testDb';

let mongoServer: MongoMemoryServer | null = null;

beforeAll(async () => {
  // Start in-memory MongoDB server
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  
  // Override MONGODB_URI for tests
  process.env.MONGODB_URI = mongoUri;
  process.env.MONGODB_DB_NAME = 'tef_master_test';
  
  // Connect to test database
  await connectDB();
});

afterAll(async () => {
  // Cleanup
  await cleanupTestDb();
  await closeDB();
  if (mongoServer) {
    await mongoServer.stop();
    mongoServer = null;
  }
});

beforeEach(async () => {
  // Ensure DB is connected before each test
  await connectDB();
  // Clean database before each test
  await cleanupTestDb();
});
