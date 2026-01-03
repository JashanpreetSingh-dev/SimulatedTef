/**
 * Background worker for processing question generation jobs
 */

import { Worker } from 'bullmq';
import { connection } from '../config/redis';
import { QuestionGenerationJobData, QuestionGenerationJobResult } from '../jobs/jobTypes';
import { assignmentService } from '../services/assignmentService';
import { closeDB } from '../db/connection';

let worker: Worker<QuestionGenerationJobData, QuestionGenerationJobResult> | null = null;

/**
 * Start the question generation worker
 */
export function startQuestionGenerationWorker(): Worker<QuestionGenerationJobData, QuestionGenerationJobResult> {
  if (worker) {
    console.log('Question generation worker already started');
    return worker;
  }

  worker = new Worker<QuestionGenerationJobData, QuestionGenerationJobResult>(
    'question-generation',
    async (job) => {
      const {
        assignmentId,
        type,
        prompt,
        settings,
        userId,
      } = job.data;

      try {
        // Update job progress
        await job.updateProgress(10); // 10% - Starting

        console.log(`Processing question generation job ${job.id} for assignment ${assignmentId}`);

        // Generate questions (this is the slow part)
        await job.updateProgress(30); // 30% - Processing
        
        const result = await assignmentService.generateQuestions(assignmentId);

        await job.updateProgress(100); // 100% - Complete

        console.log(`Question generation job ${job.id} completed for assignment ${assignmentId}`);

        // Return result
        return {
          assignmentId,
          taskId: result.taskId,
          questionIds: result.questionIds,
          success: true,
        };
      } catch (error: any) {
        console.error(`Question generation job ${job.id} failed:`, error);
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
      concurrency: 3, // Process 3 jobs simultaneously (AI generation is resource-intensive)
      limiter: {
        max: 5, // Max 5 jobs per
        duration: 1000, // 1 second (rate limiting)
      },
    }
  );

  // Worker event handlers
  worker.on('completed', (job) => {
    console.log(`Question generation job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Question generation job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Question generation worker error:', err);
  });

  worker.on('active', (job) => {
    console.log(`Question generation job ${job.id} is now active`);
  });

  console.log('Question generation worker started');

  return worker;
}

/**
 * Stop the question generation worker gracefully
 */
export async function stopQuestionGenerationWorker(): Promise<void> {
  if (worker) {
    console.log('Stopping question generation worker...');
    await worker.close();
    worker = null;
    console.log('Question generation worker stopped');
  }
  // Close database connection
  await closeDB();
}

// If this file is run directly, start the worker
if (import.meta.url === `file://${process.argv[1]}`) {
  startQuestionGenerationWorker();
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await stopQuestionGenerationWorker();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await stopQuestionGenerationWorker();
    process.exit(0);
  });
}
