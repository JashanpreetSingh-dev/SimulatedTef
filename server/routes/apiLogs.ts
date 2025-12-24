/**
 * API Logs routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { apiLogsController } from '../controllers/apiLogsController';

const router = Router();

// POST /api/logs - Create a new log entry (can be called without auth for client-side logging)
router.post('/', apiLogsController.createLog);

// GET /api/logs - Get logs with filtering (requires auth)
router.get('/', requireAuth, apiLogsController.getLogs);

// GET /api/logs/stats - Get aggregated statistics (requires auth)
router.get('/stats', requireAuth, apiLogsController.getStats);

// GET /api/logs/user/:userId - Get logs for a specific user (requires auth)
router.get('/user/:userId', requireAuth, apiLogsController.getUserLogs);

export default router;

