/**
 * Exam session API routes - B2B mode (tracking only, no limits)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { mcqSubmissionLimiter } from '../middleware/rateLimiter';
import { Request, Response } from 'express';
import { connectDB } from '../db/connection';
import { getTodayUTC } from '../models/usage';
import { ObjectId } from 'mongodb';

const router = Router();

// Helper to create exam session
async function createExamSession(userId: string, examType: string) {
  const db = await connectDB();
  const sessionId = new ObjectId().toString();
  const today = getTodayUTC();

  await db.collection('examSessions').insertOne({
    sessionId,
    userId,
    examType,
    createdAt: new Date().toISOString(),
    status: 'active'
  });

  // Track usage for B2B analytics
  await db.collection('usage').updateOne(
    { userId, date: today },
    {
      $inc: {
        fullTestsUsed: examType === 'full' ? 1 : 0,
        sectionAUsed: examType === 'partA' ? 1 : 0,
        sectionBUsed: examType === 'partB' ? 1 : 0,
      },
      $set: { updatedAt: new Date().toISOString() },
      $setOnInsert: { createdAt: new Date().toISOString() }
    },
    { upsert: true }
  );

  return sessionId;
}

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

  // B2B mode: Always allow, just track usage
  const sessionId = await createExamSession(userId, examType);
  res.json({ sessionId, canStart: true });
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

  const db = await connectDB();
  const session = await db.collection('examSessions').findOne({
    sessionId,
    userId,
    status: 'active'
  });

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

  const { sessionId, resultId, status } = req.body;
  if (!sessionId) {
    return res.status(400).json({ error: 'Session ID required' });
  }

  const db = await connectDB();
  await db.collection('examSessions').updateOne(
    { sessionId, userId },
    {
      $set: {
        status: status || 'completed',
        resultId,
        completedAt: new Date().toISOString()
      }
    }
  );

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
    const db = await connectDB();
    
    // Check for active mock exam
    const activeMockExam = await db.collection('examSessions').findOne({
      userId,
      examType: 'mock',
      status: 'active'
    });

    if (activeMockExam) {
      return res.status(400).json({ 
        error: 'You have an incomplete mock exam. Complete it first or abandon it.',
        activeMockExamId: activeMockExam.mockExamId 
      });
    }

    const { predefinedMockExamId } = req.body;
    
    const { mockExamService } = await import('../services/mockExamService');
    const result = await mockExamService.selectMockExam(userId, predefinedMockExamId);
    
    res.json(result);
  } catch (error: any) {
    console.error('Error in /select-mock endpoint:', error);
    throw error;
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

  const db = await connectDB();

  // Get active mock exam session
  const activeSession = await db.collection('examSessions').findOne({
    userId,
    examType: 'mock',
    status: 'active'
  });

  // Get completed mock exam IDs from results
  const completedResults = await db
    .collection('examResults')
    .find({ userId, mockExamId: { $exists: true, $ne: null } })
    .project({ mockExamId: 1 })
    .toArray();
  const completedMockExamIds = [...new Set(completedResults.map((r: any) => r.mockExamId))];

  if (activeSession) {
    const { mockExamService } = await import('../services/mockExamService');
    const status = await mockExamService.getMockExamStatus(userId, activeSession.mockExamId);

    // Check if this active exam is actually fully completed
    const isFullyCompleted = status && status.completedModules.length === 4;

    if (isFullyCompleted) {
      const updatedCompletedIds = [...completedMockExamIds];
      if (!updatedCompletedIds.includes(activeSession.mockExamId)) {
        updatedCompletedIds.push(activeSession.mockExamId);
      }

      res.json({
        hasActiveMockExam: false,
        completedMockExamIds: updatedCompletedIds
      });
    } else {
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
