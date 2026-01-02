/**
 * BullMQ queue configuration for evaluation jobs
 */

import { Queue } from 'bullmq';
import { connection } from '../config/redis';
import { EvaluationJobData, EvaluationJobResult } from './jobTypes';

export const evaluationQueue = new Queue<EvaluationJobData, EvaluationJobResult>('evaluation', {
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
evaluationQueue.on('error', (error) => {
  console.error('Queue error:', error);
});

evaluationQueue.on('waiting', (job) => {
  console.log(`Job ${job.id} waiting in queue`);
});

/**
 * Get queue health status
 */
export async function getQueueHealth(): Promise<{ healthy: boolean; waiting: number; active: number }> {
  try {
    const waiting = await evaluationQueue.getWaitingCount();
    const active = await evaluationQueue.getActiveCount();
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

