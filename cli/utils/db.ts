/**
 * Database utilities for CLI
 * Reuses existing database connection
 */

import { connectDB, closeDB } from '../../server/db/connection';

/**
 * Get database connection (reuses existing connection)
 */
export async function getDB() {
  return await connectDB();
}

/**
 * Close database connection
 */
export async function closeDatabase() {
  await closeDB();
}
