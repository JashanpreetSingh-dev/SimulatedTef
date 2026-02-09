/**
 * Usage API routes - checks monthly usage limits before exam start
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, z } from '../middleware/validate';
import { Request, Response } from 'express';
import { userUsageService } from '../services/userUsageService';

const router = Router();

const checkUsageSchema = z.object({
  examType: z.enum(['full', 'partA', 'partB'], { message: 'Invalid exam type' }),
});

const checkWrittenSchema = z.object({
  section: z.enum(['A', 'B'], { message: 'Section must be "A" or "B"' }),
});

// POST /api/usage/check - Pre-flight check before exam start
// Checks user's monthly usage against organization limits
router.post('/check', requireAuth, validateBody(checkUsageSchema), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const orgId = req.orgId || null;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { examType } = req.body;
  let result;
  if (examType === 'partA') {
    result = await userUsageService.checkCanStartSection(userId, orgId, 'A');
  } else if (examType === 'partB') {
    result = await userUsageService.checkCanStartSection(userId, orgId, 'B');
  } else {
    result = await userUsageService.checkCanStartFullExam(userId, orgId);
  }
  res.json(result);
}));

// POST /api/usage/check-written - Check if user can start written expression (Section A or B)
router.post('/check-written', requireAuth, validateBody(checkWrittenSchema), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const orgId = req.orgId || null;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const { section } = req.body;
  const result = await userUsageService.checkCanStartWrittenExpression(userId, orgId, section);
  res.json(result);
}));

// POST /api/usage/check-mock-exam - Check if user can start a mock exam
router.post('/check-mock-exam', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const orgId = req.orgId || null;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const result = await userUsageService.checkCanStartMockExam(userId, orgId);
  res.json(result);
}));

export default router;
