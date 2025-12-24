/**
 * Route aggregator - combines all routes
 */

import { Router } from 'express';
import resultsRouter from './results';
import recordingsRouter from './recordings';
import evaluationsRouter from './evaluations';
import subscriptionRouter from './subscription';
import usageRouter from './usage';
import examRouter from './exam';
import apiLogsRouter from './apiLogs';

const router = Router();

// Mount all route modules
router.use('/results', resultsRouter);
router.use('/recordings', recordingsRouter);
router.use('/evaluations', evaluationsRouter);
router.use('/subscription', subscriptionRouter);
router.use('/usage', usageRouter);
router.use('/exam', examRouter);
router.use('/logs', apiLogsRouter);

export default router;

