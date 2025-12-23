/**
 * Background worker for processing AI evaluation jobs
 */

import { Worker } from 'bullmq';
import { connection } from '../config/redis';
import { EvaluationJobData, EvaluationJobResult } from '../jobs/jobTypes';
import { geminiService } from '../../services/gemini';
import { resultsService } from '../services/resultsService';
import { closeDB } from '../db/connection';

let worker: Worker<EvaluationJobData, EvaluationJobResult> | null = null;

/**
 * Start the evaluation worker
 */
export function startWorker(): Worker<EvaluationJobData, EvaluationJobResult> {
  if (worker) {
    console.log('⚠️ Worker already started');
    return worker;
  }

  worker = new Worker<EvaluationJobData, EvaluationJobResult>(
    'evaluation',
    async (job) => {
      const { section, prompt, transcript, scenarioId, timeLimitSec, questionCount, userId, recordingId, mode, title, taskPartA, taskPartB } = job.data;

      try {
        // Update job progress
        await job.updateProgress(10); // 10% - Starting

        console.log(`🔄 Processing evaluation job ${job.id} for user ${userId}`);

        // Call Gemini API for evaluation (this is the slow part)
        await job.updateProgress(30); // 30% - Processing
        
        const result = await geminiService.evaluateResponse(
          section,
          prompt,
          transcript,
          scenarioId,
          timeLimitSec,
          questionCount,
          mode,
          taskPartA,
          taskPartB
        );

        await job.updateProgress(80); // 80% - Evaluation complete

        // Save result to database
        const savedResult = await resultsService.create({
          ...result,
          userId,
          recordingId,
          mode,
          title,
          taskPartA,
          taskPartB,
          transcript,
          timestamp: Date.now(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any);

        await job.updateProgress(100); // 100% - Complete

        console.log(`✅ Evaluation job ${job.id} completed, result ID: ${savedResult._id}`);

        // Return result ID
        return {
          resultId: savedResult._id as string,
          success: true,
        };
      } catch (error: any) {
        console.error(`❌ Evaluation job ${job.id} failed:`, error);
        // Job failed - will be retried automatically by BullMQ
        throw error;
      }
    },
    {
      connection: {
        host: connection.host,
        port: connection.port,
        ...(connection.password && { password: connection.password }),
      },
      concurrency: 5, // Process 5 jobs simultaneously
      limiter: {
        max: 10, // Max 10 jobs per
        duration: 1000, // 1 second (rate limiting)
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    console.log(`✅ Job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('❌ Worker error:', err);
  });

  worker.on('active', (job) => {
    console.log(`🔄 Job ${job.id} is now active`);
  });

  console.log('✅ Evaluation worker started');

  return worker;
}

/**
 * Stop the evaluation worker gracefully
 */
export async function stopWorker(): Promise<void> {
  if (worker) {
    console.log('Stopping evaluation worker...');
    await worker.close();
    worker = null;
    console.log('✅ Evaluation worker stopped');
  }
  // Close database connection
  await closeDB();
}

// If this file is run directly, start the worker
if (import.meta.url === `file://${process.argv[1]}`) {
  startWorker();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await stopWorker();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await stopWorker();
    process.exit(0);
  });
}

