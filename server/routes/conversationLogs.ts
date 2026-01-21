/**
 * Conversation Logs API routes - track live API conversations for oral expression practice
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { conversationLogService } from '../services/conversationLogService';

const router = Router();

// POST /api/conversation-logs/start - Log session start
router.post('/start', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, examType, part, taskId, taskTitle } = req.body;

  if (!sessionId || !examType || !part || !taskId || !taskTitle) {
    return res.status(400).json({ 
      error: 'sessionId, examType, part, taskId, and taskTitle are required' 
    });
  }

  if (!['partA', 'partB'].includes(examType)) {
    return res.status(400).json({ error: 'examType must be partA or partB' });
  }

  if (!['A', 'B'].includes(part)) {
    return res.status(400).json({ error: 'part must be A or B' });
  }

    try {
      const logId = await conversationLogService.logSessionStart(
        userId,
        sessionId,
        examType,
        part,
        taskId,
        taskTitle
      );

      res.json({ success: true, logId });
  } catch (error: any) {
    console.error('❌ API: Error logging session start:', error);
    res.status(500).json({ error: error.message || 'Failed to log session start' });
  }
}));

// POST /api/conversation-logs/message - Log a message event
router.post('/message', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, messageType, usageMetadata, data } = req.body;

  if (!sessionId || !messageType) {
    return res.status(400).json({ error: 'sessionId and messageType are required' });
  }

  if (!['user', 'ai'].includes(messageType)) {
    return res.status(400).json({ error: 'messageType must be user or ai' });
  }

  try {
    await conversationLogService.logMessage(
      userId,
      sessionId,
      messageType,
      usageMetadata,
      data
    );

    res.json({ success: true });
  } catch (error: any) {
    console.error('Error logging message:', error);
    res.status(500).json({ error: error.message || 'Failed to log message' });
  }
}));

// POST /api/conversation-logs/error - Log an error
router.post('/error', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, error, data } = req.body;

  if (!sessionId || !error) {
    return res.status(400).json({ error: 'sessionId and error are required' });
  }

  try {
    await conversationLogService.logError(userId, sessionId, error, data);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error logging error:', error);
    res.status(500).json({ error: error.message || 'Failed to log error' });
  }
}));

// POST /api/conversation-logs/end - Log session end
router.post('/end', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { sessionId, status, resultId } = req.body;

  if (!sessionId || !status) {
    return res.status(400).json({ error: 'sessionId and status are required' });
  }

  if (!['completed', 'failed', 'abandoned'].includes(status)) {
    return res.status(400).json({ 
      error: 'status must be completed, failed, or abandoned' 
    });
  }

  try {
    await conversationLogService.logSessionEnd(userId, sessionId, status, resultId);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Error logging session end:', error);
    res.status(500).json({ error: error.message || 'Failed to log session end' });
  }
}));

export default router;
