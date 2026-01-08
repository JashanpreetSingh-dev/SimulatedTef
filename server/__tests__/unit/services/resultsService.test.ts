/**
 * Unit tests for results service
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { resultsService } from '../../../services/resultsService';
import { cleanupTestDb, insertTestData, getTestData } from '../../helpers/testDb';
import { createTestResult } from '../../helpers/testFixtures';
import { testResults } from '../../fixtures/results';

describe('resultsService', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  describe('create', () => {
    it('should create a new result', async () => {
      const result = createTestResult();
      const created = await resultsService.create(result);

      expect(created.resultId).toBe(result.resultId);
      expect(created.userId).toBe(result.userId);
      expect(created.createdAt).toBeDefined();
      expect(created.updatedAt).toBeDefined();
    });

    it('should throw error for invalid task reference', async () => {
      const result = createTestResult({
        taskReferences: {
          taskA: {
            taskId: 'invalid_task',
            type: 'reading',
          },
        },
      });

      await expect(resultsService.create(result)).rejects.toThrow('Invalid task reference');
    }, 10000); // Increase timeout for this test
  });

  describe('findById', () => {
    it('should find result by ID', async () => {
      const result = createTestResult();
      const created = await resultsService.create(result);
      const found = await resultsService.findById(created._id!, result.userId);

      expect(found).toBeDefined();
      expect(found?.resultId).toBe(result.resultId);
      expect(found?.userId).toBe(result.userId);
    });

    it('should return null for non-existent result', async () => {
      const found = await resultsService.findById('507f1f77bcf86cd799439011', 'user_1');
      expect(found).toBeNull();
    });

    it('should return null for invalid ObjectId', async () => {
      const found = await resultsService.findById('invalid_id', 'user_1');
      expect(found).toBeNull();
    });

    it('should only return result for correct user', async () => {
      const result = createTestResult({ userId: 'user_1' });
      const created = await resultsService.create(result);
      const found = await resultsService.findById(created._id!, 'user_2');

      expect(found).toBeNull();
    });
  });

  describe('findByUserId', () => {
    beforeEach(async () => {
      await insertTestData('results', testResults);
    });

    it('should find all results for user', async () => {
      const { results } = await resultsService.findByUserId('user_1');

      expect(results).toHaveLength(2);
      expect(results.every(r => r.userId === 'user_1')).toBe(true);
    });

    it('should filter by resultType', async () => {
      const { results } = await resultsService.findByUserId('user_1', 50, 0, undefined, undefined, undefined, 'practice');

      expect(results).toHaveLength(1);
      expect(results[0].resultType).toBe('practice');
    });

    it('should filter by mockExamId', async () => {
      const { results } = await resultsService.findByUserId('user_1', 50, 0, 'mock_exam_1');

      expect(results).toHaveLength(1);
      expect(results[0].mockExamId).toBe('mock_exam_1');
    });

    it('should filter by assignmentId', async () => {
      const { results } = await resultsService.findByUserId('user_2', 50, 0, undefined, 'assignment_1');

      expect(results).toHaveLength(1);
      expect(results[0].assignmentId).toBe('assignment_1');
    });

    it('should paginate results', async () => {
      const { results, pagination } = await resultsService.findByUserId('user_1', 1, 0);

      expect(results).toHaveLength(1);
      expect(pagination?.total).toBe(2);
      expect(pagination?.hasMore).toBe(true);
    });

    it('should respect max limit', async () => {
      // Create more than MAX_LIMIT results
      const manyResults = Array.from({ length: 150 }, (_, i) =>
        createTestResult({
          resultId: `result_${i}`,
          userId: 'user_1',
        })
      );
      await insertTestData('results', manyResults);

      const { results } = await resultsService.findByUserId('user_1', 200);

      expect(results.length).toBeLessThanOrEqual(100); // MAX_LIMIT
    });

    it('should sort results by timestamp descending', async () => {
      const { results } = await resultsService.findByUserId('user_1');

      expect(results[0].timestamp > results[1].timestamp).toBe(true);
    });
  });

  describe('countByUserId', () => {
    beforeEach(async () => {
      await insertTestData('results', testResults);
    });

    it('should count results for user', async () => {
      const count = await resultsService.countByUserId('user_1');
      expect(count).toBe(2);
    });

    it('should return 0 for user with no results', async () => {
      const count = await resultsService.countByUserId('user_999');
      expect(count).toBe(0);
    });
  });

  describe('upsertMockExamResult', () => {
    it('should create new result if not exists', async () => {
      const result = createTestResult({
        mockExamId: 'mock_exam_1',
        module: 'OralExpression',
      });

      const upserted = await resultsService.upsertMockExamResult(result);

      expect(upserted._id).toBeDefined();
      expect(upserted.isLoading).toBe(false);
    });

    it('should update existing result if exists', async () => {
      const result1 = createTestResult({
        mockExamId: 'mock_exam_1',
        module: 'OralExpression',
        score: 70,
      });
      await resultsService.upsertMockExamResult(result1);

      const result2 = createTestResult({
        mockExamId: 'mock_exam_1',
        module: 'OralExpression',
        score: 80,
      });
      const upserted = await resultsService.upsertMockExamResult(result2);

      const allResults = await getTestData('results');
      expect(allResults).toHaveLength(1);
      expect(upserted.score).toBe(80);
    });

    it('should throw error if mockExamId or module missing', async () => {
      const result = createTestResult();

      await expect(resultsService.upsertMockExamResult(result)).rejects.toThrow(
        'mockExamId and module are required'
      );
    });
  });
});
