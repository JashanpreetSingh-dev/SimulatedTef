import { Queue } from 'bullmq';
import { connection } from '../config/redis';
import { WarmupMemoryJobData } from './jobTypes';

export const warmupProfileQueue = new Queue<WarmupMemoryJobData>('warmup-profile', {
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

warmupProfileQueue.on('error', (error) => {
  console.error('Warmup profile queue error:', error);
});

warmupProfileQueue.on('waiting', (job) => {
  console.log(`Warmup profile job ${job.id} waiting in queue`);
});

export async function enqueueWarmupProfileJob(data: WarmupMemoryJobData): Promise<void> {
  await warmupProfileQueue.add('update-warmup-profile', data);
}

