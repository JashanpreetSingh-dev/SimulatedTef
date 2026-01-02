/**
 * Scheduled job to expire packs
 * Runs daily to check for packs that have passed their expiration date
 */

import { connectDB } from '../db/connection';
import { Subscription } from '../models/subscription';

let isRunning = false;

/**
 * Expire packs that have passed their packExpirationDate
 */
export async function expireCancelledSubscriptions(): Promise<number> {
  // Prevent concurrent executions
  if (isRunning) {
    console.log('Pack expiry job already running, skipping...');
    return 0;
  }

  isRunning = true;
  let expiredCount = 0;

  try {
    const db = await connectDB();
    const now = new Date().toISOString();

    // Find all packs that have passed their expiration date
    const expiredPacks = await db.collection('subscriptions')
      .find({
        packExpirationDate: { $lt: now },
        packType: { $exists: true },
      })
      .toArray() as unknown as Subscription[];

    if (expiredPacks.length === 0) {
      console.log('Pack expiry job: No expired packs found');
      return 0;
    }

    // Update all expired packs - set subscriptionType to EXPIRED but keep pack data for history
    const result = await db.collection('subscriptions').updateMany(
      {
        packExpirationDate: { $lt: now },
        packType: { $exists: true },
      },
      {
        $set: {
          subscriptionType: 'EXPIRED',
          updatedAt: new Date().toISOString(),
        },
      }
    );

    expiredCount = result.modifiedCount;
    console.log(`Pack expiry job: Expired ${expiredCount} pack(s)`);

    return expiredCount;
  } catch (error: any) {
    console.error('Pack expiry job error:', error);
    console.error('   Error details:', {
      message: error.message,
      stack: error.stack,
    });
    throw error;
  } finally {
    isRunning = false;
  }
}

/**
 * Start the scheduled job
 * Runs daily at midnight UTC
 */
export function startSubscriptionExpiryJob(): void {
  // Use setInterval for simplicity (runs every 24 hours)
  // For production, consider using node-cron for more precise scheduling
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Run immediately on startup (for testing/debugging)
  expireCancelledSubscriptions().catch(err => {
    console.error('Failed to run initial subscription expiry check:', err);
  });

  // Then run every 24 hours
  setInterval(() => {
    expireCancelledSubscriptions().catch(err => {
      console.error('Failed to run scheduled subscription expiry:', err);
    });
  }, TWENTY_FOUR_HOURS);

  console.log('Pack expiry job started (runs every 24 hours)');
}

