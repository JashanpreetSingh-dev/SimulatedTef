/**
 * Assignment API routes - for creating and managing practice assignments
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { assignmentService } from '../services/assignmentService';
import { AssignmentSettings, AssignmentType } from '../../types';
import { questionGenerationQueue } from '../jobs/questionGenerationQueue';
import { QuestionGenerationJobData } from '../jobs/jobTypes';
import { requireAssignmentCreation, belongsToOrganization, isSuperUser } from '../utils/roleCheck';

const router = Router();

// All routes require authentication
router.use(requireAuth);

// POST /api/assignments - Create new assignment (draft)
// Requires professor or superuser role
router.post('/', requireAssignmentCreation, asyncHandler(async (req: Request, res: Response) => {
  const { type, title, prompt, settings } = req.body;
  const userId = req.userId!;
  const orgId = req.orgId;

  // Validate required fields
  if (!type || (type !== 'reading' && type !== 'listening')) {
    return res.status(400).json({ error: 'Invalid type. Must be "reading" or "listening"' });
  }

  if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!settings || typeof settings.numberOfQuestions !== 'number' || settings.numberOfQuestions < 1) {
    return res.status(400).json({ error: 'settings.numberOfQuestions must be a positive number' });
  }

  // Require organization membership (unless superuser)
  if (!isSuperUser(userId, orgId, req.userRole, req.isSuperUser) && !orgId) {
    return res.status(403).json({ error: 'You must be a member of an organization to create assignments' });
  }

  const assignmentSettings: AssignmentSettings = {
    numberOfQuestions: settings.numberOfQuestions,
    sections: settings.sections,
    timeLimitSec: settings.timeLimitSec,
    theme: settings.theme
  };

  const assignment = await assignmentService.createAssignment(
    type as AssignmentType,
    title,
    prompt,
    assignmentSettings,
    userId,
    orgId
  );

  res.status(201).json(assignment);
}));

// GET /api/assignments/my - Get all assignments created by current user
// MUST come before /:assignmentId route to avoid matching "my" as an assignmentId
router.get('/my', asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId!;
  const orgId = req.orgId;

  const assignments = await assignmentService.getAssignmentsByCreator(userId, orgId);
  res.json(assignments);
}));

// GET /api/assignments/published - Get all published assignments (for practice section)
// MUST come before /:assignmentId route
// Students see only their org's assignments, professors see all org assignments
router.get('/published', asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.query;
  const orgId = req.orgId;
  const userRole = req.userRole;

  // Students see only their org's assignments
  // Professors and superusers see all org assignments (orgId filter still applied for org scoping)
  const organizationId = orgId || undefined;

  const assignments = await assignmentService.getPublishedAssignments(
    type === 'reading' || type === 'listening' ? type as AssignmentType : undefined,
    organizationId
  );
  res.json(assignments);
}));

// POST /api/assignments/:assignmentId/generate - Trigger AI question generation (async job)
router.post('/:assignmentId/generate', asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const userId = req.userId!;

  // Verify assignment exists and belongs to user's organization
  const assignment = await assignmentService.getAssignmentById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  // Check organization membership (unless superuser)
  if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser)) {
    if (!belongsToOrganization(req.orgId, assignment.organizationId)) {
      return res.status(403).json({ error: 'You do not have permission to access this assignment' });
    }
  }

  // For non-superusers, verify ownership or professor role in same org
        if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser) && assignment.createdBy !== userId && req.userRole !== 'org:professor') {
    return res.status(403).json({ error: 'You do not have permission to modify this assignment' });
  }

  // Check if questions already exist
  if (assignment.taskId && assignment.questionIds && assignment.questionIds.length > 0) {
    return res.status(400).json({ error: 'Questions already exist for this assignment. Delete them first to regenerate.' });
  }

  // Create async job for question generation
  const job = await questionGenerationQueue.add(
    'generate-questions',
    {
      assignmentId,
      type: assignment.type,
      prompt: assignment.prompt,
      settings: assignment.settings,
      userId,
    } as QuestionGenerationJobData,
    {
      priority: 1,
    }
  );

  console.log(`Question generation job ${job.id} submitted for assignment ${assignmentId} by user ${userId}`);

  // Return immediately with job ID
  res.status(202).json({
    jobId: job.id,
    assignmentId,
    status: 'waiting',
    message: 'Question generation job submitted',
  });
}));

// GET /api/assignments/:assignmentId/generate/:jobId - Get question generation job status
router.get('/:assignmentId/generate/:jobId', asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId, jobId } = req.params;
  const userId = req.userId!;

  // Verify assignment exists and belongs to user
  const assignment = await assignmentService.getAssignmentById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  if (assignment.createdBy !== userId) {
    return res.status(403).json({ error: 'You do not have permission to view this assignment' });
  }

  // Get job from queue
  const job = await questionGenerationQueue.getJob(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  // Verify job belongs to user and assignment
  if (job.data.userId !== userId || job.data.assignmentId !== assignmentId) {
    return res.status(403).json({ error: 'Forbidden: You do not have access to this job' });
  }

  // Get job state
  const state = await job.getState();
  const progress = (job.progress as number) || 0;
  const returnValue = job.returnvalue;

  res.json({
    jobId,
    assignmentId,
    status: state, // 'waiting' | 'active' | 'completed' | 'failed'
    progress, // 0-100
    taskId: returnValue?.taskId,
    questionIds: returnValue?.questionIds,
    error: job.failedReason,
  });
}));

// GET /api/assignments/:assignmentId - Get assignment with questions
router.get('/:assignmentId', asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const userId = req.userId!;

  const assignment = await assignmentService.getAssignmentById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  // Check organization membership (unless superuser)
  if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser)) {
    if (!belongsToOrganization(req.orgId, assignment.organizationId)) {
      return res.status(403).json({ error: 'You do not have permission to access this assignment' });
    }
  }

  res.json(assignment);
}));

// PUT /api/assignments/:assignmentId - Update assignment
router.put('/:assignmentId', asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const userId = req.userId!;
  const { title, prompt, settings, status } = req.body;

  // Verify assignment exists and belongs to user's organization
  const assignment = await assignmentService.getAssignmentById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  // Check organization membership (unless superuser)
  if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser)) {
    if (!belongsToOrganization(req.orgId, assignment.organizationId)) {
      return res.status(403).json({ error: 'You do not have permission to access this assignment' });
    }
  }

  // For non-superusers, verify ownership or professor role in same org
        if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser) && assignment.createdBy !== userId && req.userRole !== 'org:professor') {
    return res.status(403).json({ error: 'You do not have permission to modify this assignment' });
  }

  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (prompt !== undefined) updates.prompt = prompt;
  if (settings !== undefined) updates.settings = settings;
  if (status !== undefined && (status === 'draft' || status === 'published')) {
    updates.status = status;
  }

  const updated = await assignmentService.updateAssignment(assignmentId, updates);
  res.json(updated);
}));

// PUT /api/assignments/:assignmentId/questions/:questionId - Update a question
router.put('/:assignmentId/questions/:questionId', asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId, questionId } = req.params;
  const userId = req.userId!;
  const { question, questionText, options, correctAnswer, explanation } = req.body;

  // Verify assignment exists and belongs to user's organization
  const assignment = await assignmentService.getAssignmentById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  // Check organization membership (unless superuser)
  if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser)) {
    if (!belongsToOrganization(req.orgId, assignment.organizationId)) {
      return res.status(403).json({ error: 'You do not have permission to access this assignment' });
    }
  }

  // For non-superusers, verify ownership or professor role in same org
        if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser) && assignment.createdBy !== userId && req.userRole !== 'org:professor') {
    return res.status(403).json({ error: 'You do not have permission to modify this assignment' });
  }

  const updates: any = {};
  if (question !== undefined) updates.question = question;
  if (questionText !== undefined) updates.questionText = questionText;
  if (options !== undefined) {
    if (!Array.isArray(options) || options.length !== 4) {
      return res.status(400).json({ error: 'Options must be an array of exactly 4 strings' });
    }
    updates.options = options;
  }
  if (correctAnswer !== undefined) {
    if (typeof correctAnswer !== 'number' || correctAnswer < 0 || correctAnswer > 3) {
      return res.status(400).json({ error: 'correctAnswer must be a number between 0 and 3' });
    }
    updates.correctAnswer = correctAnswer;
  }
  if (explanation !== undefined) updates.explanation = explanation;

  await assignmentService.updateQuestion(assignmentId, questionId, updates);
  res.json({ success: true, message: 'Question updated successfully' });
}));

// POST /api/assignments/:assignmentId/publish - Publish assignment
router.post('/:assignmentId/publish', asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const userId = req.userId!;

  // Verify assignment exists and belongs to user's organization
  const assignment = await assignmentService.getAssignmentById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  // Check organization membership (unless superuser)
  if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser)) {
    if (!belongsToOrganization(req.orgId, assignment.organizationId)) {
      return res.status(403).json({ error: 'You do not have permission to access this assignment' });
    }
  }

  // For non-superusers, verify ownership or professor role in same org
        if (!isSuperUser(userId, req.orgId, req.userRole, req.isSuperUser) && assignment.createdBy !== userId && req.userRole !== 'org:professor') {
    return res.status(403).json({ error: 'You do not have permission to modify this assignment' });
  }

  // Verify assignment has questions
  if (!assignment.taskId || !assignment.questionIds || assignment.questionIds.length === 0) {
    return res.status(400).json({ error: 'Assignment must have questions before publishing' });
  }

  const published = await assignmentService.publishAssignment(assignmentId);
  res.json(published);
}));

// DELETE /api/assignments/:assignmentId - Delete assignment
router.delete('/:assignmentId', asyncHandler(async (req: Request, res: Response) => {
  const { assignmentId } = req.params;
  const userId = req.userId!;

  // Verify assignment exists and belongs to user
  const assignment = await assignmentService.getAssignmentById(assignmentId);
  if (!assignment) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  if (assignment.createdBy !== userId) {
    return res.status(403).json({ error: 'You do not have permission to delete this assignment' });
  }

  await assignmentService.deleteAssignment(assignmentId);
  res.json({ success: true, message: 'Assignment deleted successfully' });
}));

export default router;
