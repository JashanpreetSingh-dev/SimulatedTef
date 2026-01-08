/**
 * Unit tests for evaluation controller
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { evaluationController } from '../../../controllers/evaluationController';
import { createMockRequest, createMockResponse, createMockNext, MOCK_USER_ID } from '../../helpers/testAuth';

const { mockQueue, mockResultsService } = vi.hoisted(() => {
  const getStateFn = vi.fn().mockResolvedValue('waiting');
  const getStateCompletedFn = vi.fn().mockResolvedValue('completed');
  
  return {
    mockQueue: {
      add: vi.fn().mockResolvedValue({
        id: 'test_job_123',
        data: {},
        getState: getStateFn,
        progress: 0,
        returnvalue: null,
        failedReason: null,
      }),
      getJob: vi.fn().mockResolvedValue({
        id: 'test_job_123',
        data: { userId: 'test_user_123' },
        getState: getStateCompletedFn,
        progress: 100,
        returnvalue: { resultId: 'test_result_123' },
        failedReason: null,
      }),
    },
    mockResultsService: {
      findById: vi.fn(),
    },
  };
});

// Mock the evaluation queue
vi.mock('../../../jobs/evaluationQueue', () => ({
  evaluationQueue: mockQueue,
}));

// Mock results service
vi.mock('../../../services/resultsService', () => ({
  resultsService: mockResultsService,
}));

describe('evaluationController', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mocks to their default implementations
    mockQueue.getJob.mockResolvedValue({
      id: 'test_job_123',
      data: { userId: MOCK_USER_ID },
      getState: vi.fn().mockResolvedValue('completed'),
      progress: 100,
      returnvalue: { resultId: 'test_result_123' },
      failedReason: null,
    });
  });

  describe('submitJob', () => {
    it('should submit evaluation job successfully', async () => {
      const req = createMockRequest({
        body: {
          section: 'OralExpression',
          prompt: 'Test prompt',
          transcript: 'Test transcript',
          scenarioId: 1,
          timeLimitSec: 300,
        },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await evaluationController.submitJob(req as any, res as any, next);

      expect(mockQueue.add).toHaveBeenCalledWith(
        'evaluate',
        expect.objectContaining({
          section: 'OralExpression',
          prompt: 'Test prompt',
          transcript: 'Test transcript',
          scenarioId: 1,
          timeLimitSec: 300,
          userId: MOCK_USER_ID,
        }),
        expect.objectContaining({
          priority: 1,
        })
      );
      expect(res.status).toHaveBeenCalledWith(202);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'test_job_123',
          status: 'waiting',
          message: 'Evaluation job submitted',
        })
      );
    });

    it('should return 400 for missing required fields', async () => {
      const req = createMockRequest({
        body: {
          section: 'OralExpression',
          // Missing required fields
        },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await evaluationController.submitJob(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.stringContaining('Missing required fields'),
        })
      );
    });
  });

  describe('getJobStatus', () => {
    it('should get job status successfully', async () => {
      // Set up mock for this specific test
      const mockGetState = vi.fn().mockResolvedValue('completed');
      const mockJob = {
        id: 'test_job_123',
        data: { userId: MOCK_USER_ID },
        getState: mockGetState,
        progress: 100,
        returnvalue: { resultId: 'test_result_123' },
        failedReason: null,
      };
      // Override the default mock for this test
      mockQueue.getJob.mockImplementationOnce(() => Promise.resolve(mockJob));

      const req = createMockRequest({
        params: { jobId: 'test_job_123' },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Call the controller method (which is wrapped in asyncHandler)
      await evaluationController.getJobStatus(req as any, res as any, next);

      // Verify the job was retrieved
      expect(mockQueue.getJob).toHaveBeenCalledWith('test_job_123');
      expect(mockGetState).toHaveBeenCalled();
      
      // The issue is that res.json is not being called
      // This suggests the function might be returning early or the mock isn't working
      // Let's check if the job object structure is correct
      const jobCall = mockQueue.getJob.mock.results[0];
      if (jobCall && jobCall.value) {
        const job = await jobCall.value;
        expect(job).toBeDefined();
        expect(job.data.userId).toBe(MOCK_USER_ID);
      }
      
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          jobId: 'test_job_123',
          status: 'completed',
          progress: 100,
          resultId: 'test_result_123',
        })
      );
    });

    it('should return 404 for non-existent job', async () => {
      mockQueue.getJob.mockImplementationOnce(() => Promise.resolve(null));

      const req = createMockRequest({
        params: { jobId: 'non_existent' },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await evaluationController.getJobStatus(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Job not found',
        })
      );
    });

    it('should return 403 for job belonging to different user', async () => {
      mockQueue.getJob.mockImplementationOnce(() => Promise.resolve({
        id: 'test_job_123',
        data: { userId: 'different_user' },
        getState: vi.fn().mockResolvedValue('completed'),
        progress: 100,
        returnvalue: { resultId: 'test_result_123' },
        failedReason: null,
      }));

      const req = createMockRequest({
        params: { jobId: 'test_job_123' },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      await evaluationController.getJobStatus(req as any, res as any, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Forbidden: You do not have access to this job',
        })
      );
    });
  });

  describe('getJobResult', () => {
    it('should get job result when completed', async () => {
      const mockResult = {
        resultId: 'test_result_123',
        userId: MOCK_USER_ID,
        score: 75,
      };
      mockResultsService.findById.mockResolvedValueOnce(mockResult);
      
      // Set up mock job for this test
      const mockGetState = vi.fn().mockResolvedValue('completed');
      const mockJob = {
        id: 'test_job_123',
        data: { userId: MOCK_USER_ID },
        getState: mockGetState,
        progress: 100,
        returnvalue: { resultId: 'test_result_123' },
        failedReason: null,
      };
      mockQueue.getJob.mockImplementationOnce(() => Promise.resolve(mockJob));

      const req = createMockRequest({
        params: { jobId: 'test_job_123' },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Call the middleware - asyncHandler returns a sync wrapper so we need to wait
      evaluationController.getJobResult(req as any, res as any, next);
      
      // Wait for the async handler to complete
      await new Promise(resolve => setImmediate(resolve));

      // Check if next was called with an error
      if (next.mock.calls.length > 0) {
        const error = next.mock.calls[0][0];
        throw new Error(`Controller error: ${error?.message || JSON.stringify(error)}`);
      }

      expect(mockQueue.getJob).toHaveBeenCalledWith('test_job_123');
      expect(mockGetState).toHaveBeenCalled();
      expect(mockResultsService.findById).toHaveBeenCalledWith('test_result_123', MOCK_USER_ID);
      expect(res.json).toHaveBeenCalledWith(mockResult);
    });

    it('should return 400 if job not completed', async () => {
      // Set up mock job with 'active' state
      const mockGetState = vi.fn().mockResolvedValue('active');
      const mockJob = {
        id: 'test_job_123',
        data: { userId: MOCK_USER_ID },
        getState: mockGetState,
        progress: 50,
        returnvalue: null,
        failedReason: null,
      };
      mockQueue.getJob.mockImplementationOnce(() => Promise.resolve(mockJob));

      const req = createMockRequest({
        params: { jobId: 'test_job_123' },
        userId: MOCK_USER_ID,
      });
      const res = createMockResponse();
      const next = createMockNext();

      // Call the middleware - asyncHandler returns a sync wrapper so we need to wait
      evaluationController.getJobResult(req as any, res as any, next);
      
      // Wait for the async handler to complete
      await new Promise(resolve => setImmediate(resolve));

      // Check if next was called with an error
      if (next.mock.calls.length > 0) {
        const error = next.mock.calls[0][0];
        throw new Error(`Controller error: ${error?.message || JSON.stringify(error)}`);
      }

      expect(mockQueue.getJob).toHaveBeenCalledWith('test_job_123');
      expect(mockGetState).toHaveBeenCalled();
      // After getState returns 'active', the function should return 400
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: 'Job not completed yet',
          status: 'active',
        })
      );
    });
  });
});
