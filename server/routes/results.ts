/**
 * Results API routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { resultsController } from '../controllers/resultsController';

const router = Router();

// GET /api/results/:userId - Get all results for a user
router.get('/:userId', requireAuth, resultsController.getUserResults);

// POST /api/results - Create a new result
router.post('/', requireAuth, resultsController.createResult);

// GET /api/results/detail/:id - Get specific result by ID
router.get('/detail/:id', requireAuth, resultsController.getResultById);

export default router;

