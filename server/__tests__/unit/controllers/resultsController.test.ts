/**
 * Unit tests for results controller
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { resultsController } from '../../../controllers/resultsController';
import { createMockRequest, createMockResponse, createMockNext, MOCK_USER_ID } from '../../helpers/testAuth';
import { createTestResult } from '../../helpers/testFixtures';

const { mockResultsService } = vi.hoisted(() => {
  return {
    mockResultsService: {
      findByUserId: vi.fn(),
      create: vi.fn(),
      findById: vi.fn(),
    },
  };
});

vi.mock('../../../services/resultsService', () => ({
  resultsService: mockResultsService,
}));

describe('resultsController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getUserResults', () => {
    it('should get user results successfully', async () => {
      const mockResults = {
        results: [createTestResult()],
        pagination: { total: 1, limit: 50, skip: 0, hasMore: false },
      };
      mockResultsService.findByUserId.mockResolvedValueOnce(mockResults);

      const req = createMockRequest({
        params: { userId: MOCK_USER_ID },
        query: {},
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await resultsController.getUserResults(req as any, res as any, next);

      expect(mockResultsService.findByUserId).toHaveBeenCalledWith(
        MOCK_USER_ID,
        50,
        0,
        undefined,
        undefined,
        undefined,
        undefined,
        false
      );
      expect(res.json).toHaveBeenCalledWith(mockResults);
    });

    it('should return 403 for different user', async () => {
      const req = createMockRequest({
        params: { userId: 'different_user' },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await resultsController.getUserResults(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden: You can only access your own results',
        })
      );
    });

    it('should handle query parameters', async () => {
      const mockResults = {
        results: [],
        pagination: { total: 0, limit: 10, skip: 5, hasMore: false },
      };
      mockResultsService.findByUserId.mockResolvedValueOnce(mockResults);

      const req = createMockRequest({
        params: { userId: MOCK_USER_ID },
        query: {
          limit: '10',
          skip: '5',
          mockExamId: 'mock_1',
          resultType: 'practice',
          populateTasks: 'true',
        },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await resultsController.getUserResults(req as any, res as any, next);

      expect(mockResultsService.findByUserId).toHaveBeenCalledWith(
        MOCK_USER_ID,
        10,
        5,
        'mock_1',
        undefined,
        undefined,
        'practice',
        true
      );
    });
  });

  describe('createResult', () => {
    it('should create result successfully', async () => {
      const result = createTestResult();
      const savedResult = { ...result, _id: '507f1f77bcf86cd799439011' };
      mockResultsService.create.mockResolvedValueOnce(savedResult);

      const req = createMockRequest({
        body: result,
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await resultsController.createResult(req as any, res as any, next);

      expect(mockResultsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          ...result,
          userId: MOCK_USER_ID,
        })
      );
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          insertedId: savedResult._id,
        })
      );
    });
  });

  describe('getResultById', () => {
    it('should get result by ID successfully', async () => {
      const result = createTestResult();
      mockResultsService.findById.mockResolvedValueOnce(result);

      const req = createMockRequest({
        params: { id: '507f1f77bcf86cd799439011' },
        query: {},
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await resultsController.getResultById(req as any, res as any, next);

      expect(mockResultsService.findById).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        MOCK_USER_ID,
        true
      );
      expect(res.json).toHaveBeenCalledWith(result);
    });

    it('should return 404 for non-existent result', async () => {
      mockResultsService.findById.mockResolvedValueOnce(null);

      const req = createMockRequest({
        params: { id: '507f1f77bcf86cd799439011' },
        query: {},
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await resultsController.getResultById(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Result not found',
        })
      );
    });
  });
});
