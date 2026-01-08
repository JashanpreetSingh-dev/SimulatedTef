/**
 * Integration tests for assignments routes
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import assignmentsRouter from '../../../routes/assignments';
import { MOCK_USER_ID } from '../../helpers/testAuth';
import { cleanupTestDb } from '../../helpers/testDb';
import { assignmentService } from '../../../services/assignmentService';
import { createTestAssignment } from '../../helpers/testFixtures';

const { mockRequireAuth, mockQuestionGenerationQueue } = vi.hoisted(() => {
  return {
    mockRequireAuth: (req: any, res: any, next: any) => {
      req.userId = MOCK_USER_ID;
      req.userRole = 'org:professor';
      req.orgId = 'test_org_123';
      req.userRoles = ['org:professor'];
      next();
    },
    mockQuestionGenerationQueue: {
      add: vi.fn().mockResolvedValue({
        id: 'test_job_123',
      }),
      getJob: vi.fn().mockResolvedValue({
        id: 'test_job_123',
        data: { userId: 'test_user_123', assignmentId: 'assignment_1' },
        getState: vi.fn().mockResolvedValue('completed'),
        progress: 100,
        returnvalue: { taskId: 'task_1', questionIds: ['q1', 'q2'] },
        failedReason: null,
      }),
    },
  };
});

// Mock auth middleware
vi.mock('../../../middleware/auth', () => ({
  requireAuth: mockRequireAuth,
  requireRole: () => (req: any, res: any, next: any) => next(), // Bypass role check for tests
}));

vi.mock('../../../jobs/questionGenerationQueue', () => ({
  questionGenerationQueue: mockQuestionGenerationQueue,
}));

const app = express();
app.use(express.json());
app.use('/api/assignments', assignmentsRouter);

describe('POST /api/assignments', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  it('should create a new assignment', async () => {
    const response = await request(app)
      .post('/api/assignments')
      .send({
        type: 'reading',
        title: 'Test Assignment',
        prompt: 'Test prompt',
        settings: {
          numberOfQuestions: 10,
        },
      })
      .expect(201);

    expect(response.body.assignmentId).toBeDefined();
    expect(response.body.type).toBe('reading');
    expect(response.body.status).toBe('draft');
  });

  it('should return 400 for invalid type', async () => {
    const response = await request(app)
      .post('/api/assignments')
      .send({
        type: 'invalid',
        prompt: 'Test prompt',
        settings: {
          numberOfQuestions: 10,
        },
      })
      .expect(400);

    expect(response.body.error).toContain('Invalid type');
  });

  it('should return 400 for missing prompt', async () => {
    const response = await request(app)
      .post('/api/assignments')
      .send({
        type: 'reading',
        settings: {
          numberOfQuestions: 10,
        },
      })
      .expect(400);

    expect(response.body.error).toBe('Prompt is required');
  });
});

describe('GET /api/assignments/:assignmentId', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  it('should get assignment by ID', async () => {
    const assignment = createTestAssignment();
    await assignmentService.createAssignment(
      assignment.type,
      assignment.title,
      assignment.prompt,
      assignment.settings,
      MOCK_USER_ID,
      assignment.creatorName,
      assignment.orgId
    );

    const response = await request(app)
      .get(`/api/assignments/${assignment.assignmentId}`)
      .expect(200);

    expect(response.body.assignmentId).toBe(assignment.assignmentId);
  });

  it('should return 404 for non-existent assignment', async () => {
    const response = await request(app)
      .get('/api/assignments/non_existent')
      .expect(404);

    expect(response.body.error).toBe('Assignment not found');
  });
});

describe('POST /api/assignments/:assignmentId/generate', () => {
  beforeEach(async () => {
    await cleanupTestDb();
  });

  it('should submit question generation job', async () => {
    const assignment = createTestAssignment();
    await assignmentService.createAssignment(
      assignment.type,
      assignment.title,
      assignment.prompt,
      assignment.settings,
      MOCK_USER_ID
    );

    const response = await request(app)
      .post(`/api/assignments/${assignment.assignmentId}/generate`)
      .expect(202);

    expect(response.body.jobId).toBeDefined();
    expect(response.body.status).toBe('waiting');
  });
});
