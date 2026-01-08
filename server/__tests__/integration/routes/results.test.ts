/**
 * Integration tests for results routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import resultsRouter from '../../../routes/results';
import { MOCK_USER_ID } from '../../helpers/testAuth';
import { cleanupTestDb, insertTestData } from '../../helpers/testDb';
import { testResults } from '../../fixtures/results';
import { resultsService } from '../../../services/resultsService';

const { mockRequireAuth } = vi.hoisted(() => {
  return {
    mockRequireAuth: (req: any, res: any, next: any) => {
      req.userId = MOCK_USER_ID;
      req.userRole = 'org:professor';
      req.orgId = 'test_org_123';
      req.userRoles = ['org:professor'];
      next();
    },
  };
});

// Mock auth middleware
vi.mock('../../../middleware/auth', () => ({
  requireAuth: mockRequireAuth,
}));

// Mock rate limiter (bypass for tests)
vi.mock('../../../middleware/rateLimiter', () => ({
  resultRetrievalLimiter: (req: any, res: any, next: any) => next(),
}));

const app = express();
app.use(express.json());
app.use('/api/results', resultsRouter);

describe('GET /api/results/:userId', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  it('should get user results', async () => {
    await insertTestData('results', testResults);

    const response = await request(app)
      .get(`/api/results/${MOCK_USER_ID}`)
      .expect(200);

    expect(response.body.results).toBeDefined();
    expect(Array.isArray(response.body.results)).toBe(true);
    expect(response.body.pagination).toBeDefined();
  });

  it('should filter by resultType', async () => {
    await insertTestData('results', testResults);

    const response = await request(app)
      .get(`/api/results/${MOCK_USER_ID}?resultType=practice`)
      .expect(200);

    expect(response.body.results.every((r: any) => r.resultType === 'practice')).toBe(true);
  });

  it('should handle pagination', async () => {
    await insertTestData('results', testResults);

    const response = await request(app)
      .get(`/api/results/${MOCK_USER_ID}?limit=1&skip=0`)
      .expect(200);

    expect(response.body.results.length).toBeLessThanOrEqual(1);
    expect(response.body.pagination.limit).toBe(1);
  });
});

describe('POST /api/results', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  it('should create a new result', async () => {
    const result = {
      resultId: 'result_new',
      section: 'OralExpression',
      score: 75,
      clbLevel: 'CLB 7',
      cecrLevel: 'B2',
      feedback: 'Test feedback',
      strengths: [],
      weaknesses: [],
      timestamp: new Date().toISOString(),
      resultType: 'practice' as const,
    };

    const response = await request(app)
      .post('/api/results')
      .send(result)
      .expect(201);

    expect(response.body.insertedId).toBeDefined();
    expect(response.body.userId).toBe(MOCK_USER_ID);
  });
});

describe('GET /api/results/detail/:id', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  it('should get result by ID', async () => {
    const result = {
      ...testResults[0],
      userId: MOCK_USER_ID, // Ensure userId matches authenticated user
    };
    const created = await resultsService.create(result);

    const response = await request(app)
      .get(`/api/results/detail/${created._id}`)
      .expect(200);

    expect(response.body.resultId).toBe(result.resultId);
  });

  it('should return 404 for non-existent result', async () => {
    const response = await request(app)
      .get('/api/results/detail/507f1f77bcf86cd799439011')
      .expect(404);

    expect(response.body.error).toBe('Result not found');
  });
});
