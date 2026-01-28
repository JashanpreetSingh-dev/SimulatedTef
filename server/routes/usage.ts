/**
 * Usage API routes - checks monthly usage limits before exam start
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { userUsageService } from '../services/userUsageService';

const router = Router();

// POST /api/usage/check - Pre-flight check before exam start
// Checks user's monthly usage against organization limits
router.post('/check', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const orgId = req.orgId || null;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { examType } = req.body;
  if (!examType || !['full', 'partA', 'partB'].includes(examType)) {
    return res.status(400).json({ error: 'Invalid exam type' });
  }

  // Check limits based on exam type
  let result;
  if (examType === 'partA') {
    result = await userUsageService.checkCanStartSection(userId, orgId, 'A');
  } else if (examType === 'partB') {
    result = await userUsageService.checkCanStartSection(userId, orgId, 'B');
  } else if (examType === 'full') {
    result = await userUsageService.checkCanStartFullExam(userId, orgId);
  } else {
    return res.status(400).json({ error: 'Invalid exam type' });
  }

  res.json(result);
}));

export default router;
