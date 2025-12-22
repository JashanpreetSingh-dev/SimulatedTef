/**
 * Exam session API routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { subscriptionService } from '../services/subscriptionService';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';

const router = Router();

// POST /api/exam/start - Create exam session and record usage
router.post('/start', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { examType } = req.body;
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

export default router;

