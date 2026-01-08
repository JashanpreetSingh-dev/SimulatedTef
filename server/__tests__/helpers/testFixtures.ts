/**
 * Test data factories and fixtures
 */

import { Assignment, AssignmentSettings, AssignmentType } from '../../../types';
import { ReadingListeningQuestion } from '../../../types';
import { SavedResult } from '../../../types';

/**
 * Create a test user
 */
export function createTestUser(overrides: Partial<any> = {}) {
  return {
    userId: 'test_user_123',
    email: 'test@example.com',
    name: 'Test User',
    totalSessions: 0,
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

/**
 * Create test assignment settings
 */
export function createTestAssignmentSettings(overrides: Partial<AssignmentSettings> = {}): AssignmentSettings {
  return {
    numberOfQuestions: 10,
    sections: ['section1'],
    timeLimitSec: 3600,
    theme: 'test theme',
    ...overrides,
  };
}

/**
 * Create a test assignment
 */
export function createTestAssignment(overrides: Partial<Assignment> = {}): Assignment {
  const now = new Date().toISOString();
  return {
    assignmentId: 'assignment_1',
    type: 'reading' as AssignmentType,
    title: 'Test Assignment',
    prompt: 'Test prompt for assignment',
    settings: createTestAssignmentSettings(),
    status: 'draft',
    createdBy: 'test_user_123',
    creatorName: 'Test User',
    orgId: 'test_org_123',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test reading task
 */
export function createTestReadingTask(overrides: Partial<any> = {}) {
  const now = new Date().toISOString();
  return {
    taskId: 'reading_1',
    type: 'reading',
    prompt: 'Test reading prompt',
    content: 'Test reading content',
    timeLimitSec: 3600,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test listening task
 */
export function createTestListeningTask(overrides: Partial<any> = {}) {
  const now = new Date().toISOString();
  return {
    taskId: 'listening_1',
    type: 'listening',
    prompt: 'Test listening prompt',
    audioUrl: '/test/audio.wav',
    timeLimitSec: 2400,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test question
 */
export function createTestQuestion(overrides: Partial<ReadingListeningQuestion> = {}): ReadingListeningQuestion {
  const now = new Date().toISOString();
  return {
    questionId: 'question_1',
    taskId: 'reading_1',
    type: 'reading',
    questionNumber: 1,
    question: 'Test question?',
    options: ['Option A', 'Option B', 'Option C', 'Option D'],
    correctAnswer: 0,
    explanation: 'Test explanation',
    isActive: true,
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create a test result
 */
export function createTestResult(overrides: Partial<SavedResult> = {}): SavedResult {
  const now = new Date().toISOString();
  return {
    resultId: 'result_1',
    userId: 'test_user_123',
    section: 'OralExpression',
    score: 75,
    clbLevel: 'CLB 7',
    cecrLevel: 'B2',
    feedback: 'Test feedback',
    strengths: ['Good vocabulary'],
    weaknesses: ['Grammar needs improvement'],
    timestamp: now,
    resultType: 'practice',
    ...overrides,
  };
}

/**
 * Create a test recording
 */
export function createTestRecording(overrides: Partial<any> = {}) {
  const now = new Date().toISOString();
  return {
    recordingId: 'recording_1',
    userId: 'test_user_123',
    section: 'OralExpression',
    audioUrl: '/test/recording.wav',
    duration: 60,
    createdAt: now,
    ...overrides,
  };
}

/**
 * Create a test mock exam
 */
export function createTestMockExam(overrides: Partial<any> = {}) {
  const now = new Date().toISOString();
  return {
    mockExamId: 'mock_exam_1',
    title: 'Test Mock Exam',
    module: 'OralExpression',
    status: 'published',
    createdAt: now,
    updatedAt: now,
    ...overrides,
  };
}

/**
 * Create test evaluation job data
 */
export function createTestEvaluationJobData(overrides: Partial<any> = {}) {
  return {
    section: 'OralExpression',
    prompt: 'Test prompt',
    transcript: 'Test transcript',
    scenarioId: 1,
    timeLimitSec: 300,
    questionCount: 10,
    userId: 'test_user_123',
    mode: 'full',
    title: 'Test Evaluation',
    ...overrides,
  };
}
