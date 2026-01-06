/**
 * Usage API routes - B2B mode (tracking only, no limits)
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';

const router = Router();

// POST /api/usage/check - Pre-flight check before exam start
// B2B mode: Always allow, usage tracked for analytics
router.post('/check', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { examType } = req.body;
  if (!examType || !['full', 'partA', 'partB'].includes(examType)) {
    return res.status(400).json({ error: 'Invalid exam type' });
  }

  // B2B mode: Always allow
  res.json({ canStart: true });
}));

export default router;
