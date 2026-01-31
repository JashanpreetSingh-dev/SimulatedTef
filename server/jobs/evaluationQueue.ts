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
      age: 1800, // Keep completed jobs for 30 minutes (reduced from 1 hour)
      count: 50, // Keep last 50 jobs (reduced from 100)
    },
    removeOnFail: {
      age: 3600, // Keep failed jobs for 1 hour (reduced from 24 hours)
      count: 20, // Keep last 20 failed jobs
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
export async function getQueueHealth(): Promise<{ healthy: boolean; waiting: number; active: number; completed: number; failed: number }> {
  try {
    const waiting = await evaluationQueue.getWaitingCount();
    const active = await evaluationQueue.getActiveCount();
    const completed = await evaluationQueue.getCompletedCount();
    const failed = await evaluationQueue.getFailedCount();
    return {
      healthy: true,
      waiting,
      active,
      completed,
      failed,
    };
  } catch (error) {
    return {
      healthy: false,
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
    };
  }
}

/**
 * Clean up old jobs from the queue
 * This helps prevent Redis memory issues
 */
export async function cleanupOldJobs(): Promise<{ removed: number; error?: string }> {
  try {
    // Clean completed jobs older than 30 minutes
    const completedCleaned = await evaluationQueue.clean(1800000, 100, 'completed'); // 30 minutes in ms
    
    // Clean failed jobs older than 1 hour
    const failedCleaned = await evaluationQueue.clean(3600000, 50, 'failed'); // 1 hour in ms
    
    // Clean active jobs that are stuck (older than 1 hour)
    const activeCleaned = await evaluationQueue.clean(3600000, 10, 'active');
    
    const totalRemoved = completedCleaned.length + failedCleaned.length + activeCleaned.length;
    
    if (totalRemoved > 0) {
      console.log(`🧹 Cleaned up ${totalRemoved} old jobs: ${completedCleaned.length} completed, ${failedCleaned.length} failed, ${activeCleaned.length} stuck`);
    }
    
    return { removed: totalRemoved };
  } catch (error: any) {
    console.error('Error cleaning up jobs:', error);
    return { removed: 0, error: error.message };
  }
}
