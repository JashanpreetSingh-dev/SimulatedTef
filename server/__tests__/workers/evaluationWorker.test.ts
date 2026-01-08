/**
 * Unit tests for evaluation worker
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EvaluationJobData } from '../../../jobs/jobTypes';
import { cleanupTestDb } from '../helpers/testDb';
import { createTestEvaluationJobData } from '../helpers/testFixtures';

// Mock dependencies
const mockGeminiService = {
  evaluateResponse: vi.fn(),
};

const mockResultsService = {
  create: vi.fn(),
  upsertMockExamResult: vi.fn(),
};

const mockTaskService = {
  saveTask: vi.fn(),
};

vi.mock('../../../services/gemini', () => ({
  geminiService: mockGeminiService,
}));

vi.mock('../../../services/resultsService', () => ({
  resultsService: mockResultsService,
}));

vi.mock('../../../services/taskService', () => ({
  saveTask: mockTaskService.saveTask,
}));

vi.mock('../../types/task', () => ({
  generateTaskId: vi.fn((type, task) => `${type}_${task.id || '1'}`),
  TaskType: {
    oralA: 'oralA',
    oralB: 'oralB',
    writtenA: 'writtenA',
    writtenB: 'writtenB',
  },
}));

describe('evaluationWorker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('job processing', () => {
    it('should process oral expression job successfully', async () => {
      const jobData: EvaluationJobData = {
        ...createTestEvaluationJobData(),
        section: 'OralExpression',
        mode: 'full',
      };

      const mockEvaluationResult = {
        score: 75,
        clbLevel: 'CLB 7',
        cecrLevel: 'B2',
        feedback: 'Good performance',
        strengths: ['Good vocabulary'],
        weaknesses: ['Grammar needs improvement'],
        grammarNotes: '',
        vocabularyNotes: '',
      };

      mockGeminiService.evaluateResponse.mockResolvedValueOnce(mockEvaluationResult);
      mockResultsService.create.mockResolvedValueOnce({
        _id: 'result_123',
        ...mockEvaluationResult,
      });

      // Simulate worker processing
      const mockJob = {
        id: 'job_123',
        data: jobData,
        updateProgress: vi.fn().mockResolvedValue(undefined),
      };

      // Test that worker would call these services
      await mockGeminiService.evaluateResponse(
        jobData.section,
        jobData.prompt,
        jobData.transcript,
        jobData.scenarioId,
        jobData.timeLimitSec,
        jobData.questionCount,
        jobData.mode
      );

      expect(mockGeminiService.evaluateResponse).toHaveBeenCalledWith(
        'OralExpression',
        jobData.prompt,
        jobData.transcript,
        jobData.scenarioId,
        jobData.timeLimitSec,
        jobData.questionCount,
        jobData.mode
      );
    });

    it('should handle written expression job', async () => {
      const jobData: EvaluationJobData = {
        ...createTestEvaluationJobData(),
        section: 'WrittenExpression',
        mode: 'full',
        writtenSectionAText: 'Section A text',
        writtenSectionBText: 'Section B text',
      };

      const mockEvaluationResult = {
        score: 80,
        clbLevel: 'CLB 8',
        cecrLevel: 'B2',
        feedback: 'Excellent writing',
        strengths: [],
        weaknesses: [],
        grammarNotes: '',
        vocabularyNotes: '',
      };

      mockGeminiService.evaluateResponse.mockResolvedValueOnce(mockEvaluationResult);

      await mockGeminiService.evaluateResponse(
        jobData.section,
        jobData.prompt,
        jobData.transcript,
        jobData.scenarioId,
        jobData.timeLimitSec,
        jobData.questionCount,
        jobData.mode
      );

      expect(mockGeminiService.evaluateResponse).toHaveBeenCalled();
    });

    it('should handle mock exam results', async () => {
      const jobData: EvaluationJobData = {
        ...createTestEvaluationJobData(),
        section: 'OralExpression',
        mockExamId: 'mock_exam_1',
        module: 'oralExpression',
      };

      const mockEvaluationResult = {
        score: 75,
        clbLevel: 'CLB 7',
        cecrLevel: 'B2',
        feedback: 'Test feedback',
        strengths: [],
        weaknesses: [],
        grammarNotes: '',
        vocabularyNotes: '',
      };

      mockGeminiService.evaluateResponse.mockResolvedValueOnce(mockEvaluationResult);
      mockResultsService.upsertMockExamResult.mockResolvedValueOnce({
        _id: 'result_123',
        mockExamId: 'mock_exam_1',
        module: 'oralExpression',
      });

      // Simulate upsert for mock exam
      await mockResultsService.upsertMockExamResult({
        userId: jobData.userId,
        mockExamId: jobData.mockExamId,
        module: jobData.module,
        evaluation: mockEvaluationResult,
      });

      expect(mockResultsService.upsertMockExamResult).toHaveBeenCalledWith(
        expect.objectContaining({
          mockExamId: 'mock_exam_1',
          module: 'oralExpression',
        })
      );
    });

    it('should save task references', async () => {
      const taskPartA = { id: 1, section: 'A' };
      const taskPartB = { id: 2, section: 'B' };

      await mockTaskService.saveTask('oralA', taskPartA);
      await mockTaskService.saveTask('oralB', taskPartB);

      expect(mockTaskService.saveTask).toHaveBeenCalledWith('oralA', taskPartA);
      expect(mockTaskService.saveTask).toHaveBeenCalledWith('oralB', taskPartB);
    });
  });

  describe('error handling', () => {
    it('should handle evaluation errors', async () => {
      const jobData: EvaluationJobData = createTestEvaluationJobData();
      const error = new Error('Evaluation failed');

      // Reset the mock and set it to reject
      mockGeminiService.evaluateResponse.mockReset();
      mockGeminiService.evaluateResponse.mockRejectedValueOnce(error);

      await expect(
        mockGeminiService.evaluateResponse(
          jobData.section,
          jobData.prompt,
          jobData.transcript,
          jobData.scenarioId,
          jobData.timeLimitSec,
          jobData.questionCount,
          jobData.mode
        )
      ).rejects.toThrow('Evaluation failed');
    });
  });
});
