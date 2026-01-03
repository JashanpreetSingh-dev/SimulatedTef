/**
 * Exam session API routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { subscriptionService } from '../services/subscriptionService';
import { asyncHandler } from '../middleware/errorHandler';
import { mcqSubmissionLimiter } from '../middleware/rateLimiter';
import { Request, Response } from 'express';
import { connectDB } from '../db/connection';

const router = Router();

// POST /api/exam/start - Create exam session and record usage
router.post('/start', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { examType, mockExamId } = req.body;

  // Handle mock exam start
  if (mockExamId) {
    const { mockExamService } = await import('../services/mockExamService');

    // Check if user can start this mock exam
    const canStart = await mockExamService.canStartMockExam(userId, mockExamId);
    if (!canStart) {
      return res.status(403).json({ error: 'Cannot start mock exam' });
    }

    // Create mock exam session
    const sessionResult = await mockExamService.createMockExamSession(userId, mockExamId);
    if (!sessionResult.success) {
      return res.status(400).json({ error: sessionResult.error || 'Failed to create mock exam session' });
    }

    return res.json({
      sessionId: sessionResult.sessionId,
      mockExamId: mockExamId
    });
  }

  // Handle regular exam start
  if (!examType || !['full', 'partA', 'partB'].includes(examType)) {
    return res.status(400).json({ error: 'Invalid exam type' });
  }

  const result = await subscriptionService.canStartExam(userId, examType);
  if (!result.canStart) {
    return res.status(403).json({ error: result.reason || 'Cannot start exam' });
  }

  res.json({ sessionId: result.sessionId, canStart: true });
}));

// POST /api/exam/validate-session - Validate exam session (e.g., on refresh)
router.post('/validate-session', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, examType } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  const session = await subscriptionService.validateExamSession(userId, sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found or invalid' });
  }

  // Validate exam type matches
  if (examType && session.examType !== examType) {
    return res.status(400).json({ error: 'Session exam type mismatch' });
  }

  res.json({ valid: true, sessionId: session.sessionId });
}));

// POST /api/exam/complete - Mark exam session as completed
router.post('/complete', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, resultId, status } = req.body; // status can be 'completed' or 'failed'
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  await subscriptionService.completeExamSession(userId, sessionId, resultId, status);
  res.json({ success: true });
}));

// ===== Mock Exam Endpoints =====

// GET /api/exam/mock-exams - List available mock exams for user
router.get('/mock-exams', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { mockExamService } = await import('../services/mockExamService');
  const mockExams = await mockExamService.listAvailableMockExams(userId);
  res.json(mockExams);
}));

// POST /api/exam/select-mock - Select/create mock exam
router.post('/select-mock', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Check for active mock exam
    const activeMockExam = await subscriptionService.getActiveMockExam(userId);
    if (activeMockExam) {
      return res.status(400).json({ 
        error: 'You have an incomplete mock exam. Complete it first or abandon it.',
        activeMockExamId: activeMockExam.mockExamId 
      });
    }

    const { predefinedMockExamId } = req.body; // Optional: predefined mock exam ID
    
    // Note: We don't check credits here because canStartExam consumes credits
    // The mock exam service will check and consume credits in its transaction
    // Import mock exam service
    const { mockExamService } = await import('../services/mockExamService');
    const result = await mockExamService.selectMockExam(userId, predefinedMockExamId);
    
    res.json(result);
  } catch (error: any) {
    console.error('Error in /select-mock endpoint:', error);
    throw error; // Let asyncHandler handle it
  }
}));

// GET /api/exam/mock/:mockExamId/status - Get mock exam status
router.get('/mock/:mockExamId/status', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { mockExamId } = req.params;
  const { mockExamService } = await import('../services/mockExamService');
  const status = await mockExamService.getMockExamStatus(userId, mockExamId);
  
  if (!status) {
    return res.status(404).json({ error: 'Mock exam not found' });
  }
  
  res.json(status);
}));

// GET /api/exam/mock/:mockExamId/modules - Get modules for mock exam
router.get('/mock/:mockExamId/modules', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { mockExamId } = req.params;
  const { mockExamService } = await import('../services/mockExamService');
  const modules = await mockExamService.getMockExamModules(userId, mockExamId);
  
  if (!modules) {
    return res.status(404).json({ error: 'Mock exam not found' });
  }
  
  res.json(modules);
}));

// POST /api/exam/start-module - Start a specific module within mock exam
router.post('/start-module', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { mockExamId, module } = req.body;
  
  if (!mockExamId || !module) {
    return res.status(400).json({ error: 'mockExamId and module are required' });
  }
  
  if (!['oralExpression', 'reading', 'listening', 'writtenExpression'].includes(module)) {
    return res.status(400).json({ error: 'Invalid module. Must be oralExpression, reading, listening, or writtenExpression' });
  }

  const { mockExamService } = await import('../services/mockExamService');
  const result = await mockExamService.startModule(userId, mockExamId, module);
  
  if (!result) {
    return res.status(404).json({ error: 'Mock exam not found' });
  }
  
  res.json(result);
}));

// POST /api/exam/complete-module - Complete a module and save result
router.post('/complete-module', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { mockExamId, module, result } = req.body;
  
  if (!mockExamId || !module || !result) {
    return res.status(400).json({ error: 'mockExamId, module, and result are required' });
  }
  
  if (!['oralExpression', 'reading', 'listening', 'writtenExpression'].includes(module)) {
    return res.status(400).json({ error: 'Invalid module' });
  }

  const { mockExamService } = await import('../services/mockExamService');
  const completionResult = await mockExamService.completeModule(userId, mockExamId, module, result);
  
  if (!completionResult) {
    return res.status(404).json({ error: 'Mock exam not found' });
  }
  
  res.json(completionResult);
}));

// GET /api/exam/mock/status - Check for active and completed mock exams
router.get('/mock/status', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const activeMockExam = await subscriptionService.getActiveMockExam(userId);
  let completedMockExamIds = await subscriptionService.getCompletedMockExamIds(userId);
  const originalCompletedIds = [...completedMockExamIds];

  // Filter out completed exam IDs that don't correspond to real exams or don't have results
  if (completedMockExamIds.length > 0) {
    const { mockExamService } = await import('../services/mockExamService');
    const allExams = await mockExamService.listAllMockExams();
    const validExamIds = new Set(allExams.map(exam => exam.mockExamId));

    // Filter to only valid exam IDs
    const validCompletedIds = completedMockExamIds.filter(id => validExamIds.has(id));

    if (validCompletedIds.length > 0) {
      // Batch query: Check which exams have results (single query instead of N queries)
      const db = await connectDB();
      const resultsWithMockExamIds = await db.collection('results').distinct('mockExamId', {
        userId,
        mockExamId: { $in: validCompletedIds }
      });

      const examsWithResults = validCompletedIds.filter(id => resultsWithMockExamIds.includes(id));
      completedMockExamIds = examsWithResults;

      // Clean up invalid completed exam IDs from user's usage document
      if (examsWithResults.length !== originalCompletedIds.length) {
        await db.collection('usage').updateOne(
          { userId },
          { $set: { completedMockExamIds: examsWithResults } },
          { upsert: true }
        );
      }
    } else {
      // No valid exam IDs, clear the list
      completedMockExamIds = [];
      const db = await connectDB();
      await db.collection('usage').updateOne(
        { userId },
        { $set: { completedMockExamIds: [] } },
        { upsert: true }
      );
    }
  }

  if (activeMockExam) {
    const { mockExamService } = await import('../services/mockExamService');
    const status = await mockExamService.getMockExamStatus(userId, activeMockExam.mockExamId);

    // Check if this active exam is actually fully completed (all 4 modules)
    const isFullyCompleted = status && status.completedModules.length === 4 &&
                           status.completedModules.includes('oralExpression') &&
                           status.completedModules.includes('reading') &&
                           status.completedModules.includes('listening') &&
                           status.completedModules.includes('writtenExpression');

    if (isFullyCompleted) {
      // If fully completed, don't return as active, just add to completed list
      const updatedCompletedIds = [...completedMockExamIds];
      if (!updatedCompletedIds.includes(activeMockExam.mockExamId)) {
        updatedCompletedIds.push(activeMockExam.mockExamId);
      }

      res.json({
        hasActiveMockExam: false,
        completedMockExamIds: updatedCompletedIds
      });
    } else {
      // Return as active only if not fully completed
      res.json({
        hasActiveMockExam: true,
        activeMockExam: status,
        completedMockExamIds
      });
    }
  } else {
    res.json({
      hasActiveMockExam: false,
      completedMockExamIds
    });
  }
}));

// GET /api/exam/resume-mock/:mockExamId - Resume an incomplete mock exam
router.get('/resume-mock/:mockExamId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { mockExamId } = req.params;
  const { mockExamService } = await import('../services/mockExamService');
  const status = await mockExamService.resumeMockExam(userId, mockExamId);
  
  if (!status) {
    return res.status(404).json({ error: 'Mock exam not found' });
  }
  
  res.json(status);
}));

// POST /api/exam/submit-mcq - Submit MCQ answers for Reading/Listening
router.post('/submit-mcq', requireAuth, mcqSubmissionLimiter, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { taskId, answers, module, mockExamId, sessionId } = req.body;
  
  if (!taskId || !answers || !module || !mockExamId || !sessionId) {
    return res.status(400).json({ error: 'taskId, answers, module, mockExamId, and sessionId are required' });
  }
  
  if (!Array.isArray(answers) || answers.length > 40) {
    return res.status(400).json({ error: 'answers must be an array of at most 40 numbers (0-3)' });
  }
  
  if (!['reading', 'listening'].includes(module)) {
    return res.status(400).json({ error: 'module must be reading or listening' });
  }

  const { mcqController } = await import('../controllers/mcqController');
  const result = await mcqController.submitMCQ(userId, taskId, answers, module, mockExamId, sessionId);
  
  res.json(result);
}));

// POST /api/exam/submit-assignment-mcq - Submit MCQ answers for Reading/Listening assignments
router.post('/submit-assignment-mcq', requireAuth, mcqSubmissionLimiter, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { taskId, answers, module, assignmentId, sessionId } = req.body;
  
  if (!taskId || !answers || !module || !assignmentId || !sessionId) {
    return res.status(400).json({ error: 'taskId, answers, module, assignmentId, and sessionId are required' });
  }
  
  if (!Array.isArray(answers) || answers.length > 40) {
    return res.status(400).json({ error: 'answers must be an array of at most 40 numbers (0-3)' });
  }
  
  if (!['reading', 'listening'].includes(module)) {
    return res.status(400).json({ error: 'module must be reading or listening' });
  }

  const { assignmentMCQController } = await import('../controllers/assignmentMCQController');
  const result = await assignmentMCQController.submitAssignmentMCQ(userId, taskId, answers, module, assignmentId, sessionId);
  
  res.json(result);
}));

export default router;

