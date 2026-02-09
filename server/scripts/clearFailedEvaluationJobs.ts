/**
 * Clear failed (and optionally old completed) evaluation jobs from the current Redis.
 * Uses REDIS_URL from env. Run after switching Redis or to free memory.
 *
 * Usage: npm run clear-failed-jobs
 */

import 'dotenv/config';
import { evaluationQueue } from '../jobs/evaluationQueue';

async function main() {
  try {
    const failedBefore = await evaluationQueue.getFailedCount();
    const completedBefore = await evaluationQueue.getCompletedCount();

    // Remove all failed jobs (any age)
    const failedCleaned = await evaluationQueue.clean(0, 1000, 'failed');
    // Remove completed jobs older than 0 ms = all completed
    const completedCleaned = await evaluationQueue.clean(0, 1000, 'completed');

    console.log('Cleared evaluation queue (current REDIS_URL):');
    console.log(`  Failed:   ${failedBefore} → removed ${failedCleaned.length}`);
    console.log(`  Completed: ${completedBefore} → removed ${completedCleaned.length}`);
    console.log('Done.');
  } catch (error: any) {
    console.error('Error:', error.message);
    if (process.env.REDIS_URL?.includes('localhost')) {
      console.error('Make sure Redis is running (e.g. docker compose up -d).');
    }
    process.exit(1);
  } finally {
    await evaluationQueue.close();
  }
}

main();
