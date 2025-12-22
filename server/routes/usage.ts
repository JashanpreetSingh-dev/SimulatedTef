/**
 * Usage API routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { subscriptionService } from '../services/subscriptionService';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';

const router = Router();

// POST /api/usage/check - Pre-flight check before exam start
router.post('/check', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { examType } = req.body; // 'full' | 'partA' | 'partB'
  if (!examType || !['full', 'partA', 'partB'].includes(examType)) {
    return res.status(400).json({ error: 'Invalid exam type' });
  }

  const result = await subscriptionService.checkCanStartExam(userId, examType);
  res.json(result);
}));

export default router;

