/**
 * BullMQ queue configuration for transactional email jobs
 */

import { Queue } from 'bullmq';
import { connection } from '../config/redis';
import { EmailJobData, EmailJobResult } from './jobTypes';

export const emailQueue = new Queue<EmailJobData, EmailJobResult>('email', {
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
emailQueue.on('error', (error) => {
  console.error('Email queue error:', error);
});

emailQueue.on('waiting', (job) => {
  console.log(`Email job ${job.id} waiting in queue`);
});

export async function enqueueEmailJob(data: EmailJobData): Promise<void> {
  await emailQueue.add('send-email', data);
}

