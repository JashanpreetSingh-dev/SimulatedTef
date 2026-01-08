/**
 * Unit tests for MCQ scoring service
 */

import { describe, it, expect } from 'vitest';
import { calculateMCQScore, validateAnswers } from '../../../services/mcqScoring';
import { ReadingListeningQuestion } from '../../../../types';

describe('mcqScoring', () => {
  const createQuestion = (
    questionId: string,
    questionNumber: number,
    correctAnswer: number
  ): ReadingListeningQuestion => ({
    questionId,
    taskId: 'task_1',
    type: 'reading',
    questionNumber,
    question: `Question ${questionNumber}?`,
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer,
    explanation: 'Explanation',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  describe('calculateMCQScore', () => {
    it('should calculate correct score for all correct answers', () => {
      const questions = [
        createQuestion('q1', 1, 0),
        createQuestion('q2', 2, 1),
        createQuestion('q3', 3, 2),
      ];
      const answers = [0, 1, 2];

      const result = calculateMCQScore({
        taskId: 'task_1',
        questions,
        answers,
      });

      expect(result.score).toBe(3);
      expect(result.totalQuestions).toBe(3);
      expect(result.questionResults).toHaveLength(3);
      expect(result.questionResults.every(q => q.isCorrect)).toBe(true);
    });

    it('should calculate correct score for mixed answers', () => {
      const questions = [
        createQuestion('q1', 1, 0),
        createQuestion('q2', 2, 1),
        createQuestion('q3', 3, 2),
      ];
      const answers = [0, 2, 2]; // First correct, second wrong, third correct

      const result = calculateMCQScore({
        taskId: 'task_1',
        questions,
        answers,
      });

      expect(result.score).toBe(2);
      expect(result.questionResults[0].isCorrect).toBe(true);
      expect(result.questionResults[1].isCorrect).toBe(false);
      expect(result.questionResults[2].isCorrect).toBe(true);
    });

    it('should handle unanswered questions', () => {
      const questions = [
        createQuestion('q1', 1, 0),
        createQuestion('q2', 2, 1),
        createQuestion('q3', 3, 2),
      ];
      const answers = [0]; // Only first question answered

      const result = calculateMCQScore({
        taskId: 'task_1',
        questions,
        answers,
      });

      expect(result.score).toBe(1);
      expect(result.questionResults[0].userAnswer).toBe(0);
      expect(result.questionResults[1].userAnswer).toBe(-1);
      expect(result.questionResults[2].userAnswer).toBe(-1);
    });

    it('should sort questions by questionNumber', () => {
      const questions = [
        createQuestion('q3', 3, 2),
        createQuestion('q1', 1, 0),
        createQuestion('q2', 2, 1),
      ];
      const answers = [0, 1, 2];

      const result = calculateMCQScore({
        taskId: 'task_1',
        questions,
        answers,
      });

      expect(result.questionResults[0].questionId).toBe('q1');
      expect(result.questionResults[1].questionId).toBe('q2');
      expect(result.questionResults[2].questionId).toBe('q3');
    });

    it('should throw error for empty questions', () => {
      expect(() => {
        calculateMCQScore({
          taskId: 'task_1',
          questions: [],
          answers: [],
        });
      }).toThrow('Expected at least 1 question');
    });

    it('should throw error for too many answers', () => {
      const questions = [createQuestion('q1', 1, 0)];
      const answers = [0, 1, 2];

      expect(() => {
        calculateMCQScore({
          taskId: 'task_1',
          questions,
          answers,
        });
      }).toThrow('Expected at most 1 answers');
    });
  });

  describe('validateAnswers', () => {
    it('should validate correct answers', () => {
      expect(validateAnswers([0, 1, 2, 3], 4)).toBe(true);
      expect(validateAnswers([0, 1, 2], 3)).toBe(true);
      expect(validateAnswers([-1, -1, 0], 3)).toBe(true); // Unanswered questions
    });

    it('should reject answers with invalid indices', () => {
      expect(validateAnswers([4], 1)).toBe(false); // Index out of range
      expect(validateAnswers([-2], 1)).toBe(false); // Invalid negative
      expect(validateAnswers([0, 1, 5], 3)).toBe(false);
    });

    it('should reject too many answers', () => {
      expect(validateAnswers([0, 1, 2, 3, 4], 4)).toBe(false);
    });
  });
});
