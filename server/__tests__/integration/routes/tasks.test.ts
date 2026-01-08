/**
 * Integration tests for tasks routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import tasksRouter from '../../../routes/tasks';
import { cleanupTestDb, insertTestData } from '../../helpers/testDb';
import { testReadingTasks, testListeningTasks } from '../../fixtures/tasks';
import { createTestQuestion } from '../../helpers/testFixtures';

const { mockQuestionService, mockRequireAuth } = vi.hoisted(() => {
  return {
    mockQuestionService: {
      getQuestionsByTaskId: vi.fn(),
    },
    mockRequireAuth: vi.fn((req: any, res: any, next: any) => {
      req.userId = 'test_user_123';
      req.userRole = 'org:professor';
      req.orgId = 'test_org_123';
      req.userRoles = ['org:professor'];
      next();
    }),
  };
});

vi.mock('../../../services/questionService', () => ({
  questionService: mockQuestionService,
}));

// Mock auth middleware
vi.mock('../../../middleware/auth', () => ({
  requireAuth: mockRequireAuth,
}));

// Mock rate limiter (bypass for tests)
vi.mock('../../../middleware/rateLimiter', () => ({
  taskSelectionLimiter: (req: any, res: any, next: any) => next(),
}));

// Mock services - need to import test data first
vi.mock('../../../services/readingTaskService', async () => {
  const { testReadingTasks } = await import('../../fixtures/tasks');
  return {
    readingTaskService: {
      getRandomTask: vi.fn().mockResolvedValue(testReadingTasks[0]),
      getTaskById: vi.fn().mockImplementation((id) => {
        return Promise.resolve(testReadingTasks.find(t => t.taskId === id) || null);
      }),
    },
  };
});

vi.mock('../../../services/listeningTaskService', async () => {
  const { testListeningTasks } = await import('../../fixtures/tasks');
  return {
    listeningTaskService: {
      getRandomTask: vi.fn().mockResolvedValue(testListeningTasks[0]),
      getTaskById: vi.fn().mockImplementation((id) => {
        return Promise.resolve(testListeningTasks.find(t => t.taskId === id) || null);
      }),
    },
  };
});

vi.mock('../../../../services/tasks', () => ({
  getRandomSectionATask: vi.fn().mockReturnValue({ id: 1, section: 'A' }),
  getRandomSectionBTask: vi.fn().mockReturnValue({ id: 2, section: 'B' }),
}));

const app = express();
app.use(express.json());
app.use('/api/tasks', tasksRouter);

describe('GET /api/tasks/random/:type', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  it('should get random reading task', async () => {
    const response = await request(app)
      .get('/api/tasks/random/reading')
      .expect(200);

    expect(response.body.taskId).toBeDefined();
    expect(response.body.type).toBe('reading');
  });

  it('should get random listening task', async () => {
    const response = await request(app)
      .get('/api/tasks/random/listening')
      .expect(200);

    expect(response.body.taskId).toBeDefined();
    expect(response.body.type).toBe('listening');
  });

  it('should return 400 for invalid type', async () => {
    const response = await request(app)
      .get('/api/tasks/random/invalid')
      .expect(400);

    expect(response.body.error).toContain('Invalid task type');
  });
});

describe('GET /api/tasks/questions/:taskId', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should get questions for task', async () => {
    const questions = Array.from({ length: 40 }, (_, i) =>
      createTestQuestion({
        questionId: `q${i + 1}`,
        questionNumber: i + 1,
        taskId: 'reading_1',
      })
    );
    mockQuestionService.getQuestionsByTaskId.mockResolvedValueOnce(questions);

    const response = await request(app)
      .get('/api/tasks/questions/reading_1')
      .expect(200);

    expect(response.body.questions).toBeDefined();
    expect(Array.isArray(response.body.questions)).toBe(true);
    expect(response.body.count).toBe(40);
  });

  it('should return 404 for task with no questions', async () => {
    mockQuestionService.getQuestionsByTaskId.mockResolvedValueOnce([]);

    const response = await request(app)
      .get('/api/tasks/questions/non_existent')
      .expect(404);

    expect(response.body.error).toBe('No questions found for this task');
  });
});
