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

export default router;

