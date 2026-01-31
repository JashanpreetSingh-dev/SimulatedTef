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
 * Create a new subscription document
 */
export function createSubscription(
  userId: string,
  tier: 'free' | 'basic' | 'premium',
  stripeData?: {
    customerId?: string;
    subscriptionId?: string;
  }
): Subscription {
  const now = new Date().toISOString();
  const periodStart = now;
  // Default to 30 days from now for period end
  const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

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
