/**
 * Unit tests for database connection
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { connectDB, closeDB, checkConnectionHealth } from '../../db/connection';
import { cleanupTestDb } from '../helpers/testDb';

describe('database connection', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  describe('connectDB', () => {
    it('should connect to database', async () => {
      const db = await connectDB();
      expect(db).toBeDefined();
      expect(db.databaseName).toBe('tef_master_test');
    });

    it('should reuse existing connection', async () => {
      const db1 = await connectDB();
      const db2 = await connectDB();
      
      // Should return same database instance
      expect(db1.databaseName).toBe(db2.databaseName);
    });
  });

  describe('checkConnectionHealth', () => {
    it('should return true for healthy connection', async () => {
      const isHealthy = await checkConnectionHealth();
      expect(isHealthy).toBe(true);
    });
  });

  describe('closeDB', () => {
    it('should close database connection', async () => {
      await connectDB();
      await closeDB();
      
      // Connection should be closed
      // Reconnecting should work
      const db = await connectDB();
      expect(db).toBeDefined();
    });
  });
});
