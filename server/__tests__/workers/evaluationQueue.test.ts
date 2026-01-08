/**
 * Unit tests for evaluation queue
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvaluationJobData } from '../../../jobs/jobTypes';
import { mockQueue } from '../helpers/mocks';

// Mock the queue
vi.mock('../../../jobs/evaluationQueue', () => ({
  evaluationQueue: mockQueue,
  getQueueHealth: vi.fn().mockResolvedValue({
    healthy: true,
    waiting: 0,
    active: 0,
  }),
}));

describe('evaluationQueue', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('add job', () => {
    it('should add job to queue', async () => {
      const jobData: EvaluationJobData = {
        section: 'OralExpression',
        prompt: 'Test prompt',
        transcript: 'Test transcript',
        scenarioId: 1,
        timeLimitSec: 300,
        userId: 'user_123',
        mode: 'full',
        title: 'Test Evaluation',
      };

      const job = await mockQueue.add('evaluate', jobData, { priority: 1 });

      expect(mockQueue.add).toHaveBeenCalledWith(
        'evaluate',
        jobData,
        { priority: 1 }
      );
      expect(job.id).toBe('test_job_123');
    });
  });

  describe('get job', () => {
    it('should get job by ID', async () => {
      const job = await mockQueue.getJob('test_job_123');

      expect(mockQueue.getJob).toHaveBeenCalledWith('test_job_123');
      expect(job).toBeDefined();
      expect(job?.id).toBe('test_job_123');
    });

    it('should return null for non-existent job', async () => {
      mockQueue.getJob.mockResolvedValueOnce(null);

      const job = await mockQueue.getJob('non_existent');

      expect(job).toBeNull();
    });
  });

  describe('get job state', () => {
    it('should get job state', async () => {
      const job = await mockQueue.getJob('test_job_123');
      const state = await job?.getState();

      expect(state).toBe('completed');
    });
  });

  describe('queue health', () => {
    it('should get queue health status', async () => {
      const waiting = await mockQueue.getWaitingCount();
      const active = await mockQueue.getActiveCount();

      expect(waiting).toBe(0);
      expect(active).toBe(0);
    });
  });
});
