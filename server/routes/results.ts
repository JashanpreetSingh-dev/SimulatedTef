/**
 * Results API routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { resultRetrievalLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { resultsController } from '../controllers/resultsController';
import { resultsService } from '../services/resultsService';

const router = Router();

// POST /api/results - Create a new result
router.post('/', requireAuth, resultsController.createResult);

// GET /api/results/detail/:id - Get specific result by ID (must come before /:userId)
// Rate limit: 20 requests per minute
router.get('/detail/:id', requireAuth, resultRetrievalLimiter, resultsController.getResultById);

// GET /api/results/:userId - Get all results for a user
// Rate limit: 20 requests per minute
router.get('/:userId', requireAuth, resultRetrievalLimiter, resultsController.getUserResults);

// POST /api/results/update-metadata - Update result metadata (for mock exams)
router.post('/update-metadata', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { resultId, mockExamId, module } = req.body;

  if (!resultId || !mockExamId || !module) {
    return res.status(400).json({ error: 'resultId, mockExamId, and module are required' });
  }

  // Verify the result belongs to the user
  const result = await resultsService.findById(resultId, userId);
  if (!result) {
    return res.status(404).json({ error: 'Result not found' });
  }

  // Update the result with mock exam metadata
  await resultsService.updateResultMetadata(resultId, { mockExamId, module });

  res.json({ success: true });
}));

export default router;

