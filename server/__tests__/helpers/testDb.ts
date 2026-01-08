/**
 * Test database utilities
 */

import { connectDB } from '../../db/connection';

/**
 * Clean all collections in test database
 */
export async function cleanupTestDb(): Promise<void> {
  const db = await connectDB();
  
  const collections = [
    'users',
    'results',
    'assignments',
    'readingTasks',
    'listeningTasks',
    'questions',
    'recordings',
    'mockExams',
    'examSessions',
    'evaluationJobs',
    'usage',
    'webhookEvents',
  ];
  
  for (const collectionName of collections) {
    try {
      await db.collection(collectionName).deleteMany({});
    } catch (error) {
      // Collection might not exist, ignore
    }
  }
}

/**
 * Get test database instance
 */
export async function getTestDb() {
  return await connectDB();
}

/**
 * Insert test data into a collection
 */
export async function insertTestData(collectionName: string, data: any[]): Promise<void> {
  const db = await connectDB();
  if (data.length > 0) {
    await db.collection(collectionName).insertMany(data);
  }
}

/**
 * Get all documents from a collection
 */
export async function getTestData(collectionName: string): Promise<any[]> {
  const db = await connectDB();
  return await db.collection(collectionName).find({}).toArray();
}

/**
 * Count documents in a collection
 */
export async function countTestData(collectionName: string): Promise<number> {
  const db = await connectDB();
  return await db.collection(collectionName).countDocuments({});
}
