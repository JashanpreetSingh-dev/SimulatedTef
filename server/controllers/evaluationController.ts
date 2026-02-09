/**
 * Evaluation controller - handles evaluation job logic
 */

import { Request, Response } from 'express';
import { evaluationQueue } from '../jobs/evaluationQueue';
import { EvaluationJobData } from '../jobs/jobTypes';
import { resultsService } from '../services/resultsService';
import { userUsageService } from '../services/userUsageService';
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
      audioBlob, // New: base64 encoded audio blob for OralExpression
      scenarioId,
      timeLimitSec,
      questionCount,
      recordingId,
      mode,
      title,
      taskPartA,
      taskPartB,
      eo2RemainingSeconds,
      fluencyAnalysis,
      writtenSectionAText,
      writtenSectionBText,
      mockExamId,
      module,
    } = req.body;

    // Validate required fields
    // For OralExpression: either transcript OR audioBlob must be provided
    // For WrittenExpression: transcript is required
    if (!section || !prompt || scenarioId === undefined || scenarioId === null || timeLimitSec === undefined || timeLimitSec === null) {
      return res.status(400).json({
        error: 'Missing required fields: section, prompt, scenarioId, timeLimitSec',
      });
    }

    if (section === 'WrittenExpression' && !transcript) {
      return res.status(400).json({
        error: 'Missing required field: transcript (required for WrittenExpression)',
      });
    }

    if (section === 'OralExpression' && !transcript && !audioBlob) {
      return res.status(400).json({
        error: 'Missing required field: either transcript or audioBlob must be provided for OralExpression',
      });
    }

    // D2C/B2B: enforce written expression limit before accepting job (non-mock only)
    if (module === 'writtenExpression' && !mockExamId && req.userId) {
      const writtenSection: 'A' | 'B' =
        writtenSectionAText != null && String(writtenSectionAText).trim() ? 'A' : 'B';
      const orgId = req.orgId ?? null;
      const limitCheck = await userUsageService.checkCanStartWrittenExpression(
        req.userId,
        orgId,
        writtenSection
      );
      if (!limitCheck.canStart) {
        return res.status(403).json({
          error: limitCheck.reason || 'Monthly written expression limit reached',
          canStart: false,
          currentUsage: limitCheck.currentUsage,
          limit: limitCheck.limit,
        });
      }
    }

    // Add job to queue (FIFO - first in, first out for fairness)
    const job = await evaluationQueue.add(
      'evaluate',
      {
        section,
        prompt,
        transcript, // Optional for OralExpression if audioBlob is provided
        audioBlob, // New: base64 encoded audio for worker to transcribe
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
        fluencyAnalysis,
        writtenSectionAText,
        writtenSectionBText,
        mockExamId,
        module,
      } as EvaluationJobData
      // No priority option - processes in FIFO order (fair, first-come-first-served)
    );

    console.log(`Evaluation job ${job.id} submitted by user ${req.userId}`);

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

  /**
   * GET /api/evaluations/:jobId/stream
   * Stream job progress using Server-Sent Events (SSE)
   */
  streamJobProgress: asyncHandler(async (req: Request, res: Response) => {
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

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    // Create Redis subscriber for pub/sub (ioredis connects automatically)
    // Use a new Redis instance instead of duplicate to avoid connection sharing issues
    const { Redis: RedisClient } = await import('ioredis');
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const subscriber = new RedisClient(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });
    
    // Subscribe to job progress updates
    const channel = `evaluation:${jobId}:progress`;
    
    // Cleanup function (declared early for use in handlers)
    const cleanup = async () => {
      try {
        if (subscriber.status === 'ready' || subscriber.status === 'connect') {
          await subscriber.unsubscribe(channel).catch(() => {});
          await subscriber.quit().catch(() => {});
        }
      } catch (error) {
        // Ignore cleanup errors - connection might already be closed
        console.debug('Cleanup error (non-critical):', error);
      }
    };
    
    // Handle Redis connection errors
    subscriber.on('error', (err) => {
      console.error('Redis subscriber error:', err);
      if (!res.headersSent) {
        try {
          res.write(`data: ${JSON.stringify({ status: 'error', error: 'Connection error' })}\n\n`);
          res.end();
        } catch (writeError) {
          // Response might already be closed
        }
      }
    });
    
    subscriber.on('close', () => {
      console.log('Redis subscriber connection closed');
    });
    try {
      // Wait for connection to be ready
      if (subscriber.status !== 'ready') {
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => reject(new Error('Redis connection timeout')), 5000);
          subscriber.once('ready', () => {
            clearTimeout(timeout);
            resolve(undefined);
          });
          subscriber.once('error', (err) => {
            clearTimeout(timeout);
            reject(err);
          });
        });
      }
      await subscriber.subscribe(channel);
    } catch (error) {
      console.error('Error subscribing to Redis channel:', error);
      try {
        await subscriber.quit();
      } catch (quitError) {
        // Ignore quit errors
      }
      if (!res.headersSent) {
        res.write(`data: ${JSON.stringify({ status: 'error', error: 'Failed to subscribe' })}\n\n`);
        res.end();
      }
      return;
    }

    // Listen for messages
    subscriber.on('message', async (ch, message) => {
      if (ch === channel) {
        try {
          const data = JSON.parse(message);
          res.write(`data: ${JSON.stringify(data)}\n\n`);
          
          // Close connection when job completes or fails
          if (data.status === 'completed' || data.status === 'failed') {
            try {
              // If completed, fetch and include the result
              if (data.status === 'completed' && data.resultId) {
                const result = await resultsService.findById(data.resultId, req.userId || '');
                if (result) {
                  res.write(`data: ${JSON.stringify({ status: 'completed', result })}\n\n`);
                }
              }
            } catch (fetchError) {
              console.error('Error fetching result for SSE:', fetchError);
            }
            
            // Cleanup and close
            await cleanup();
            try {
              if (!res.headersSent || res.writable) {
                res.end();
              }
            } catch (endError: any) {
              // Ignore errors if connection already closed (client disconnected)
              if (endError.code !== 'ECONNRESET' && endError.code !== 'EPIPE') {
                console.error('Error ending SSE response:', endError);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      }
    });

    // Send initial status
    const initialState = await job.getState();
    const initialProgress = (job.progress as number) || 0;
    res.write(`data: ${JSON.stringify({ status: initialState, progress: initialProgress })}\n\n`);

    // If already completed, send result and close
    if (initialState === 'completed') {
      const returnValue = job.returnvalue;
      if (returnValue?.resultId) {
        const result = await resultsService.findById(returnValue.resultId, req.userId || '');
        if (result) {
          res.write(`data: ${JSON.stringify({ status: 'completed', result })}\n\n`);
        }
      }
      await cleanup();
      res.end();
      return;
    }

    // Handle client disconnect
    req.on('close', cleanup);
    
    // Handle errors
    req.on('error', async (error: any) => {
      // Ignore expected disconnection errors (client closed connection)
      if (error.code !== 'ECONNRESET' && error.code !== 'EPIPE' && error.message !== 'aborted') {
        console.error('SSE request error:', error);
      }
      await cleanup();
    });
    
    // Handle response close
    res.on('close', cleanup);
  }),
};

