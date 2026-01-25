/**
 * Results API routes
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { resultRetrievalLimiter } from '../middleware/rateLimiter';
import { asyncHandler } from '../middleware/errorHandler';
import { resultsController } from '../controllers/resultsController';
import { resultsService } from '../services/resultsService';

const router = Router();

// GET /api/results/:userId - Get all results for a user
// Rate limit: 60 requests per minute
router.get('/:userId', requireAuth, resultRetrievalLimiter, resultsController.getUserResults);

// POST /api/results - Create a new result
router.post('/', requireAuth, resultsController.createResult);

// GET /api/results/detail/:id - Get specific result by ID
// Rate limit: 60 requests per minute
router.get('/detail/:id', requireAuth, resultRetrievalLimiter, resultsController.getResultById);

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

// PUT /api/results/:id/evaluation - Update evaluation data for an existing result (for re-evaluation)
router.put('/:id/evaluation', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const resultId = req.params.id;
  const { evaluation, moduleData } = req.body;

  if (!evaluation) {
    return res.status(400).json({ error: 'evaluation is required' });
  }

  try {
    const updatedResult = await resultsService.updateEvaluation(resultId, userId, evaluation, moduleData);
    res.json({ success: true, result: updatedResult });
  } catch (error: any) {
    if (error.message === 'Result not found or access denied') {
      return res.status(404).json({ error: error.message });
    }
    throw error;
  }
}));

// POST /api/results/:id/vote - Add or update a vote for a result
router.post('/:id/vote', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const resultId = req.params.id;
  const { vote, reason } = req.body;

  if (!vote || (vote !== 'upvote' && vote !== 'downvote')) {
    return res.status(400).json({ error: 'vote is required and must be "upvote" or "downvote"' });
  }

  // Validate reason if downvote
  if (vote === 'downvote' && reason) {
    const validReasons = ['inaccurate_score', 'poor_feedback', 'technical_issue'];
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid downvote reason' });
    }
  }

  try {
    const updatedResult = await resultsService.addVote(resultId, userId, vote, reason);
    res.json({ success: true, result: updatedResult });
  } catch (error: any) {
    if (error.message === 'Result not found') {
      return res.status(404).json({ error: error.message });
    }
    if (error.message === 'Voting is only available for oral expression results') {
      return res.status(400).json({ error: error.message });
    }
    throw error;
  }
}));

export default router;

