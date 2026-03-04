/**
 * Background worker for processing transactional email jobs
 */

import { Worker } from 'bullmq';
import { connection } from '../config/redis';
import { EmailJobData, EmailJobResult } from '../jobs/jobTypes';
import { notificationService } from '../services/notificationService';

let worker: Worker<EmailJobData, EmailJobResult> | null = null;

/**
 * Start the email worker
 */
export function startEmailWorker(): Worker<EmailJobData, EmailJobResult> {
  if (worker) {
    console.log('Email worker already started');
    return worker;
  }

  worker = new Worker<EmailJobData, EmailJobResult>(
    'email',
    async (job) => {
      const { templateKind, userId, email, firstName, tierId, tierName, periodStart, periodEnd } = job.data;

      try {
        if (templateKind === 'welcome') {
          await notificationService.sendWelcomeEmail({
            userId,
            email,
            firstName,
          });
        } else if (templateKind === 'subscription_congrats') {
          if (!tierId) {
            console.warn('Email job missing tierId for subscription_congrats; skipping.');
            return { success: false, error: 'Missing tierId' };
          }
          await notificationService.sendSubscriptionCongratsEmail({
            userId,
            email,
            firstName,
            tierId,
            tierName,
            periodStart,
            periodEnd,
          });
        } else {
          console.warn(`Unknown email templateKind: ${templateKind}`);
          return { success: false, error: `Unknown templateKind: ${templateKind}` };
        }

        return { success: true };
      } catch (error: any) {
        console.error(`Email job ${job.id} failed:`, error);
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
      concurrency: 5,
    }
  );

  worker.on('completed', (job) => {
    console.log(`Email job ${job.id} completed successfully`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Email job ${job?.id} failed:`, err.message);
  });

  worker.on('error', (err) => {
    console.error('Email worker error:', err);
  });

  worker.on('active', (job) => {
    console.log(`Email job ${job.id} is now active`);
  });

  console.log('Email worker started');

  return worker;
}

/**
 * Stop the email worker gracefully.
 */
export async function stopEmailWorker(): Promise<void> {
  if (!worker) return;
  console.log('Stopping email worker...');
  await worker.close();
  worker = null;
  console.log('Email worker stopped');
}

// If this file is run directly, start the worker
if (import.meta.url === `file://${process.argv[1]}`) {
  startEmailWorker();

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    await stopEmailWorker();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    await stopEmailWorker();
    process.exit(0);
  });
}

