/**
 * Subscription Service - manages subscriptions in database and coordinates with Stripe
 */

import Stripe from 'stripe';
import { connectDB } from '../db/connection';
import { Subscription, createSubscription, validateSubscription } from '../models/Subscription';
import { SubscriptionTier, validateSubscriptionTier, DEFAULT_SUBSCRIPTION_TIERS } from '../models/SubscriptionTier';
import { stripeService } from './stripeService';

/** Stripe subscription with period fields (SDK type may omit these in some API versions) */
type StripeSubscriptionWithPeriod = Stripe.Subscription & { current_period_start?: number; current_period_end?: number };

/**
 * Get user's subscription
 */
export async function getUserSubscription(userId: string): Promise<Subscription | null> {
  const db = await connectDB();
  const subscription = await db.collection('subscriptions').findOne({ userId });
  
  if (!subscription) {
    return null;
  }

  return subscription as unknown as Subscription;
}

/**
 * Create a subscription record
 */
export async function createSubscriptionRecord(
  userId: string,
  tier: 'free' | 'basic' | 'premium',
  stripeData?: {
    customerId?: string;
    subscriptionId?: string;
  }
): Promise<Subscription> {
  const db = await connectDB();
  const now = new Date().toISOString();
  
  const subscription = createSubscription(userId, tier, stripeData);
  const validated = validateSubscription(subscription);
  
  // Remove _id before inserting
  const { _id, ...subscriptionToInsert } = validated;
  await db.collection('subscriptions').insertOne(subscriptionToInsert);
  
  // Fetch the inserted document
  const inserted = await db.collection('subscriptions').findOne({ userId });
  if (!inserted) {
    throw new Error('Failed to create subscription');
  }

  return inserted as unknown as Subscription;
}

/**
 * Update subscription
 */
export async function updateSubscription(
  userId: string,
  updates: Partial<Subscription>
): Promise<Subscription> {
  const db = await connectDB();
  const now = new Date().toISOString();
  
  await db.collection('subscriptions').updateOne(
    { userId },
    {
      $set: {
        ...updates,
        updatedAt: now,
      },
    }
  );
  
  const updated = await db.collection('subscriptions').findOne({ userId });
  if (!updated) {
    throw new Error('Subscription not found');
  }

  return updated as unknown as Subscription;
}

/**
 * Ensure D2C free tier has a persisted signup anchor for monthly reset (used by usage route and userUsageService).
 */
export async function ensureFreeTierPeriodStart(userId: string, signupAnchor: Date): Promise<void> {
  const subscription = await getUserSubscription(userId);
  const anchorIso = signupAnchor.toISOString();
  if (subscription) {
    if (!subscription.freeTierPeriodStart) {
      await updateSubscription(userId, { freeTierPeriodStart: anchorIso } as Partial<Subscription>);
    }
  } else {
    try {
      await createSubscriptionRecord(userId, 'free');
    } catch (err: unknown) {
      const mongoErr = err as { code?: number };
      if (mongoErr.code === 11000) {
        // Duplicate key: subscription was created by another request (e.g. concurrent GET /usage)
        const existing = await getUserSubscription(userId);
        if (existing && !existing.freeTierPeriodStart) {
          await updateSubscription(userId, { freeTierPeriodStart: anchorIso } as Partial<Subscription>);
        }
        return;
      }
      throw err;
    }
    await updateSubscription(userId, { freeTierPeriodStart: anchorIso } as Partial<Subscription>);
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  userId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Subscription> {
  const subscription = await getUserSubscription(userId);
  if (!subscription) {
    throw new Error('Subscription not found');
  }

  // Cancel in Stripe if subscription ID exists
  if (subscription.stripeSubscriptionId) {
    await stripeService.cancelSubscription(subscription.stripeSubscriptionId, cancelAtPeriodEnd);
  }

  // Update status in database
  // If cancelAtPeriodEnd is true, keep status as 'active' - user retains access until period ends
  // If cancelAtPeriodEnd is false, cancel immediately
  const status = cancelAtPeriodEnd ? 'active' : 'canceled';
  return await updateSubscription(userId, {
    status: status as any,
    cancelAtPeriodEnd,
  });
}

/**
 * Get subscription limits for a user
 */
export async function getSubscriptionLimits(userId: string): Promise<{
  sectionALimit: number;
  sectionBLimit: number;
  writtenExpressionSectionALimit: number;
  writtenExpressionSectionBLimit: number;
  mockExamLimit: number;
} | null> {
  const subscription = await getUserSubscription(userId);
  // Accept both 'active' and 'trialing' status (trialing subscriptions should have full limits)
  if (!subscription || (subscription.status !== 'active' && subscription.status !== 'trialing')) {
    return null;
  }

  const db = await connectDB();
  const tier = await db.collection('subscriptionTiers').findOne({
    id: subscription.tier,
  });

  if (!tier || !tier.limits) {
    return null;
  }

  return {
    sectionALimit: tier.limits.sectionALimit,
    sectionBLimit: tier.limits.sectionBLimit,
    writtenExpressionSectionALimit: tier.limits.writtenExpressionSectionALimit,
    writtenExpressionSectionBLimit: tier.limits.writtenExpressionSectionBLimit,
    mockExamLimit: tier.limits.mockExamLimit || 1,
  };
}

/**
 * Sync subscription status from Stripe
 */
export async function syncWithStripe(userId: string): Promise<Subscription | null> {
  const subscription = await getUserSubscription(userId);
  if (!subscription || !subscription.stripeSubscriptionId) {
    return subscription;
  }

  try {
    const stripeSubscription = await stripeService.getSubscription(subscription.stripeSubscriptionId) as StripeSubscriptionWithPeriod | null;
    if (!stripeSubscription) {
      return subscription;
    }

    // Map Stripe status to our status
    // Important: If cancel_at_period_end is true but status is still 'active', 
    // keep status as 'active' - user retains access until period ends
    let status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' = 'active';
    if (stripeSubscription.status === 'active') {
      // Even if cancel_at_period_end is true, status remains 'active' until period ends
      status = 'active';
    } else if (stripeSubscription.status === 'canceled') {
      status = 'canceled';
    } else if (stripeSubscription.status === 'past_due') {
      status = 'past_due';
    } else if (stripeSubscription.status === 'trialing') {
      status = 'trialing';
    } else if (stripeSubscription.status === 'incomplete' || stripeSubscription.status === 'incomplete_expired') {
      status = 'incomplete';
    }

    // Validate and convert period dates (Stripe timestamps are in seconds)
    const periodStart = stripeSubscription.current_period_start != null
      ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
      : subscription.currentPeriodStart || new Date().toISOString();
    const periodEnd = stripeSubscription.current_period_end != null
      ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
      : subscription.currentPeriodEnd || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    // Update subscription in database
    return await updateSubscription(userId, {
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
    });
  } catch (error) {
    console.error('Error syncing subscription with Stripe:', error);
    return subscription;
  }
}

/**
 * Get all subscription tiers
 */
export async function getSubscriptionTiers(): Promise<SubscriptionTier[]> {
  const db = await connectDB();
  const tiers = await db.collection('subscriptionTiers').find({}).sort({ id: 1 }).toArray();
  
  // If no tiers in DB, return defaults
  if (tiers.length === 0) {
    return DEFAULT_SUBSCRIPTION_TIERS as SubscriptionTier[];
  }

  return tiers as unknown as SubscriptionTier[];
}

/**
 * Initialize subscription tiers in database
 */
export async function initializeSubscriptionTiers(): Promise<void> {
  const db = await connectDB();
  const now = new Date().toISOString();

  for (const tier of DEFAULT_SUBSCRIPTION_TIERS) {
    const existing = await db.collection('subscriptionTiers').findOne({ id: tier.id });
    if (!existing) {
      await db.collection('subscriptionTiers').insertOne({
        ...tier,
        createdAt: now,
        updatedAt: now,
      });
    }
  }
}

export const subscriptionService = {
  getUserSubscription,
  createSubscriptionRecord,
  updateSubscription,
  ensureFreeTierPeriodStart,
  cancelSubscription,
  getSubscriptionLimits,
  syncWithStripe,
  getSubscriptionTiers,
  initializeSubscriptionTiers,
};
