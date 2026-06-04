/**
 * BullMQ queue configuration for transactional email jobs
 */

import { Queue } from 'bullmq';
import { connection } from '../config/redis';
import { EmailJobData, EmailJobResult } from './jobTypes';

let _emailQueue: Queue<EmailJobData, EmailJobResult> | undefined;

function getEmailQueue(): Queue<EmailJobData, EmailJobResult> {
  if (!_emailQueue) {
    _emailQueue = new Queue<EmailJobData, EmailJobResult>('email', {
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
          age: 3600,
          count: 100,
        },
        removeOnFail: {
          age: 86400,
        },
      },
    });

    _emailQueue.on('error', (error) => {
      console.error('Email queue error:', error);
    });

    _emailQueue.on('waiting', (job) => {
      console.log(`Email job ${job.id} waiting in queue`);
    });
  }
  return _emailQueue;
}

export const emailQueue = {
  on: (...args: Parameters<Queue['on']>) => getEmailQueue().on(...args),
  add: (...args: Parameters<Queue['add']>) => getEmailQueue().add(...args),
  getJobs: (...args: Parameters<Queue['getJobs']>) => getEmailQueue().getJobs(...args),
  close: () => _emailQueue?.close(),
};

export async function enqueueEmailJob(data: EmailJobData): Promise<void> {
  await getEmailQueue().add('send-email', data);
}

