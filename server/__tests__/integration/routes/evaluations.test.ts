/**
 * Integration tests for evaluations routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import evaluationsRouter from '../../../routes/evaluations';

const { mockQueue, mockResultsService, mockRequireAuth } = vi.hoisted(() => {
  return {
    mockQueue: {
      add: vi.fn().mockResolvedValue({
        id: 'test_job_123',
        data: {},
        getState: vi.fn().mockResolvedValue('waiting'),
        progress: 0,
        returnvalue: null,
        failedReason: null,
      }),
      getJob: vi.fn().mockResolvedValue({
        id: 'test_job_123',
        data: { userId: 'test_user_123' },
        getState: vi.fn().mockResolvedValue('completed'),
        progress: 100,
        returnvalue: { resultId: 'test_result_123' },
        failedReason: null,
      }),
    },
    mockResultsService: {
      findById: vi.fn(),
    },
    mockRequireAuth: (req: any, res: any, next: any) => {
      req.userId = 'test_user_123';
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

// Mock evaluation queue
vi.mock('../../../jobs/evaluationQueue', () => ({
  evaluationQueue: mockQueue,
}));

// Mock results service
vi.mock('../../../services/resultsService', () => ({
  resultsService: mockResultsService,
}));

const app = express();
app.use(express.json());
app.use('/api/evaluations', evaluationsRouter);

describe('POST /api/evaluations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should submit evaluation job', async () => {
    const response = await request(app)
      .post('/api/evaluations')
      .send({
        section: 'OralExpression',
        prompt: 'Test prompt',
        transcript: 'Test transcript',
        scenarioId: 1,
        timeLimitSec: 300,
      })
      .expect(202);

    expect(response.body).toMatchObject({
      jobId: expect.any(String),
      status: 'waiting',
      message: 'Evaluation job submitted',
    });
    expect(mockQueue.add).toHaveBeenCalled();
  });

  it('should return 400 for missing required fields', async () => {
    const response = await request(app)
      .post('/api/evaluations')
      .send({
        section: 'OralExpression',
        // Missing required fields
      })
      .expect(400);

    expect(response.body.error).toContain('Missing required fields');
  });
});

describe('GET /api/evaluations/:jobId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get job status', async () => {
    const response = await request(app)
      .get('/api/evaluations/test_job_123')
      .expect(200);

    expect(response.body).toMatchObject({
      jobId: 'test_job_123',
      status: expect.any(String),
    });
  });

  it('should return 404 for non-existent job', async () => {
    mockQueue.getJob.mockResolvedValueOnce(null);

    const response = await request(app)
      .get('/api/evaluations/non_existent')
      .expect(404);

    expect(response.body.error).toBe('Job not found');
  });
});

describe('GET /api/evaluations/:jobId/result', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get job result when completed', async () => {
    const mockResult = {
      resultId: 'test_result_123',
      userId: 'test_user_123',
      score: 75,
    };
    mockResultsService.findById.mockResolvedValueOnce(mockResult);

    const response = await request(app)
      .get('/api/evaluations/test_job_123/result')
      .expect(200);

    expect(response.body).toMatchObject(mockResult);
  });

  it('should return 400 if job not completed', async () => {
    mockQueue.getJob.mockResolvedValueOnce({
      id: 'test_job_123',
      data: { userId: 'test_user_123' },
      getState: vi.fn().mockResolvedValue('active'),
      progress: 50,
      returnvalue: null,
      failedReason: null,
    });

    const response = await request(app)
      .get('/api/evaluations/test_job_123/result')
      .expect(400);

    expect(response.body.error).toBe('Job not completed yet');
  });
});
