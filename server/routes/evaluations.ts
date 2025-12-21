/**
 * Evaluation job API routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { evaluationController } from '../controllers/evaluationController';

const router = Router();

// POST /api/evaluations - Submit an evaluation job
router.post('/', requireAuth, evaluationController.submitJob);

// GET /api/evaluations/:jobId - Get job status
router.get('/:jobId', requireAuth, evaluationController.getJobStatus);

// GET /api/evaluations/:jobId/result - Get result when job is completed
router.get('/:jobId/result', requireAuth, evaluationController.getJobResult);

export default router;

