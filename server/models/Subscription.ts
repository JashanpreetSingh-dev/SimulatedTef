/**
 * Subscription Model - stores user subscription information
 */

import { z } from 'zod';

// Zod schema for subscription validation
export const SubscriptionSchema = z.object({
  userId: z.string().min(1),
  tier: z.enum(['free', 'basic', 'premium']),
  stripeCustomerId: z.string().optional(),
  stripeSubscriptionId: z.string().optional(),
  status: z.enum(['active', 'canceled', 'past_due', 'trialing', 'incomplete']),
  currentPeriodStart: z.string(), // ISO date
  currentPeriodEnd: z.string(), // ISO date
  cancelAtPeriodEnd: z.boolean().default(false),
  createdAt: z.string(), // ISO date
  updatedAt: z.string(), // ISO date
  /** D2C free tier: anchor for monthly reset (signup date). */
  freeTierPeriodStart: z.string().optional(), // ISO date
  /** D2C paid: first calendar day to count usage (YYYY-MM-DD). Set on new subscription so upgrade day is excluded. */
  usageCountingFromDate: z.string().optional(), // YYYY-MM-DD
  /** When subscription was downgraded to free (ISO date). Used so free-tier usage only counts from this date. */
  downgradedToFreeAt: z.string().optional(), // ISO date
  /** When set (resubscribe), usage on start day is only counted if createdAt >= this time (ISO). */
  usageCountingFromTime: z.string().optional(), // ISO
});

export type Subscription = z.infer<typeof SubscriptionSchema> & {
  _id?: string;
};

/**
 * Validate subscription data
 */
export function validateSubscription(data: unknown): Subscription {
  return SubscriptionSchema.parse(data);
}

/**
 * Create a new subscription document.
 * When stripeData.period is provided (e.g. from Stripe webhook), use it so we never persist the 30-day default for paid subs.
 */
export function createSubscription(
  userId: string,
  tier: 'free' | 'basic' | 'premium',
  stripeData?: {
    customerId?: string;
    subscriptionId?: string;
    /** If set, use these instead of default 30-day period (avoids "30 days left" for new paid subs). */
    period?: { start: string; end: string };
  }
): Subscription {
  const now = new Date().toISOString();
  const periodStart = stripeData?.period?.start ?? now;
  const periodEnd = stripeData?.period?.end ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  return {
    userId,
    tier,
    stripeCustomerId: stripeData?.customerId,
    stripeSubscriptionId: stripeData?.subscriptionId,
    status: 'active',
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: false,
    createdAt: now,
    updatedAt: now,
  };
}
