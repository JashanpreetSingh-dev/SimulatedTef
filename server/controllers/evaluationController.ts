/**
 * Evaluation controller - handles evaluation job logic
 */

import { Request, Response } from 'express';
import { evaluationQueue } from '../jobs/evaluationQueue';
import { EvaluationJobData } from '../jobs/jobTypes';
import { resultsService } from '../services/resultsService';
import { asyncHandler } from '../middleware/errorHandler';

export const evaluationController = {
  /**
   * POST /api/evaluations
   * Submit an evaluation job
   */
  submitJob: asyncHandler(async (req: Request, res: Response) => {
    const {
      section,
      prompt,
      transcript,
      scenarioId,
      timeLimitSec,
      questionCount,
      recordingId,
      mode,
      title,
      taskPartA,
      taskPartB,
      eo2RemainingSeconds,
    } = req.body;

    // Validate required fields
    if (!section || !prompt || !transcript || !scenarioId || !timeLimitSec) {
      return res.status(400).json({
        error: 'Missing required fields: section, prompt, transcript, scenarioId, timeLimitSec',
      });
    }

    // Add job to queue
    const job = await evaluationQueue.add(
      'evaluate',
      {
        section,
        prompt,
        transcript,
        scenarioId,
        timeLimitSec,
        questionCount,
        userId: req.userId || 'guest',
        recordingId,
        mode: mode || 'full',
        title: title || 'Evaluation',
        taskPartA,
        taskPartB,
        eo2RemainingSeconds,
      } as EvaluationJobData,
      {
        priority: 1, // Higher priority = processed first
      }
    );

    console.log(`📋 Evaluation job ${job.id} submitted by user ${req.userId}`);

    // Return immediately with job ID
    res.status(202).json({
      jobId: job.id,
      status: 'waiting',
      message: 'Evaluation job submitted',
    });
  }),

  /**
   * GET /api/evaluations/:jobId
   * Get job status
   */
  getJobStatus: asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    // Get job from queue
    const job = await evaluationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify job belongs to user
    if (job.data.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this job' });
    }

    // Get job state
    const state = await job.getState();
    const progress = (job.progress as number) || 0;
    const returnValue = job.returnvalue;

    res.json({
      jobId,
      status: state, // 'waiting' | 'active' | 'completed' | 'failed'
      progress, // 0-100
      resultId: returnValue?.resultId,
      error: job.failedReason,
    });
  }),

  /**
   * GET /api/evaluations/:jobId/result
   * Get result when job is completed
   */
  getJobResult: asyncHandler(async (req: Request, res: Response) => {
    const { jobId } = req.params;

    // Get job from queue
    const job = await evaluationQueue.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Verify job belongs to user
    if (job.data.userId !== req.userId) {
      return res.status(403).json({ error: 'Forbidden: You do not have access to this job' });
    }

    const state = await job.getState();

    if (state !== 'completed') {
      return res.status(400).json({
        error: 'Job not completed yet',
        status: state,
      });
    }

    const returnValue = job.returnvalue;

    if (!returnValue || !returnValue.resultId) {
      return res.status(404).json({ error: 'Result not found' });
    }

    // Fetch result from database
    const result = await resultsService.findById(returnValue.resultId, req.userId || '');

    if (!result) {
      return res.status(404).json({ error: 'Result not found' });
    }

    res.json(result);
  }),
};

