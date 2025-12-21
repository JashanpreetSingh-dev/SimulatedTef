/**
 * Results controller - handles result-related business logic
 */

import { Request, Response } from 'express';
import { resultsService } from '../services/resultsService';
import { asyncHandler } from '../middleware/errorHandler';

export const resultsController = {
  /**
   * GET /api/results/:userId
   * Get all results for a user
   */
  getUserResults: asyncHandler(async (req: Request, res: Response) => {
    const requestedUserId = req.params.userId;
    const authenticatedUserId = req.userId;

    // Security: Users can only fetch their own results
    if (requestedUserId !== authenticatedUserId) {
      return res.status(403).json({ error: 'Forbidden: You can only access your own results' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const skip = parseInt(req.query.skip as string) || 0;

    const results = await resultsService.findByUserId(authenticatedUserId || '', limit, skip);

    res.json(results);
  }),

  /**
   * POST /api/results
   * Create a new result
   */
  createResult: asyncHandler(async (req: Request, res: Response) => {
    const result = req.body;

    // Override userId with authenticated userId (security)
    result.userId = req.userId;

    const savedResult = await resultsService.create(result);
    res.status(201).json({ insertedId: savedResult._id, ...savedResult });
  }),

  /**
   * GET /api/results/detail/:id
   * Get specific result by ID
   */
  getResultById: asyncHandler(async (req: Request, res: Response) => {
    const resultId = req.params.id;
    const userId = req.userId;

    const result = await resultsService.findById(resultId, userId || '');

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  }),
};

