/**
 * BullMQ queue configuration for question generation jobs
 */

import { Queue } from 'bullmq';
import { connection } from '../config/redis';
import { QuestionGenerationJobData, QuestionGenerationJobResult } from './jobTypes';

export const questionGenerationQueue = new Queue<QuestionGenerationJobData, QuestionGenerationJobResult>('question-generation', {
  connection: {
    host: connection.host,
    port: connection.port,
    ...(connection.password && { password: connection.password }),
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 3600, // Keep completed jobs for 1 hour
      count: 100, // Keep last 100 jobs
    },
    removeOnFail: {
      age: 86400, // Keep failed jobs for 24 hours
    },
  },
});

// Queue event handlers for monitoring
questionGenerationQueue.on('error', (error) => {
  console.error('Question generation queue error:', error);
});

questionGenerationQueue.on('waiting', (job) => {
  console.log(`Question generation job ${job.id} waiting in queue`);
});

/**
 * Get queue health status
 */
export async function getQuestionGenerationQueueHealth(): Promise<{ healthy: boolean; waiting: number; active: number }> {
  try {
    const waiting = await questionGenerationQueue.getWaitingCount();
    const active = await questionGenerationQueue.getActiveCount();
    return {
      healthy: true,
      waiting,
      active,
    };
  } catch (error) {
    return {
      healthy: false,
      waiting: 0,
      active: 0,
    };
  }
}
