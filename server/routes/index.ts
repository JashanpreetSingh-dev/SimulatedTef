/**
 * Route aggregator - combines all routes
 */

import { Router } from 'express';
import resultsRouter from './results';
import recordingsRouter from './recordings';
import evaluationsRouter from './evaluations';
import usageRouter from './usage';
import examRouter from './exam';
import tasksRouter from './tasks';
import audioRouter from './audio';
import assignmentsRouter from './assignments';
import batchesRouter from './batches';
import batchAssignmentsRouter from './batchAssignments';
import conversationLogsRouter from './conversationLogs';
import adminRouter from './admin';
import subscriptionsRouter from './subscriptions';
// Note: stripeWebhooksRouter is mounted directly in server.ts with raw body parser

const router = Router();

// Mount all route modules
router.use('/results', resultsRouter);
router.use('/recordings', recordingsRouter);
router.use('/evaluations', evaluationsRouter);
router.use('/usage', usageRouter);
router.use('/exam', examRouter);
router.use('/tasks', tasksRouter);
router.use('/audio', audioRouter);
router.use('/assignments', assignmentsRouter);
router.use('/batches', batchesRouter);
router.use('/batch-assignments', batchAssignmentsRouter);
router.use('/conversation-logs', conversationLogsRouter);
router.use('/admin', adminRouter);
router.use('/subscriptions', subscriptionsRouter);
// Note: stripe-webhooks is mounted directly in server.ts with raw body parser

export default router;

