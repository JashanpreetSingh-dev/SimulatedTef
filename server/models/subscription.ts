/**
 * Subscription data model
 */

import { z } from 'zod';

export type SubscriptionType = 'TRIAL' | 'STARTER_PACK' | 'EXAM_READY_PACK' | 'EXPIRED';

// Zod schema for subscription validation
export const SubscriptionSchema = z.object({
  userId: z.string().min(1),
  subscriptionType: z.enum(['TRIAL', 'STARTER_PACK', 'EXAM_READY_PACK', 'EXPIRED']),
  trialStartDate: z.string().optional(), // For TRIAL
  // Pack fields (optional, only if pack purchased)
  packType: z.enum(['STARTER_PACK', 'EXAM_READY_PACK']).optional(),
  packPurchasedDate: z.string().optional(),
  packExpirationDate: z.string().optional(), // purchase date + 30 days
  packFullTestsTotal: z.number().min(0).optional(), // 5 or 15
  packFullTestsUsed: z.number().min(0).optional(),
  packSectionATotal: z.number().min(0).optional(), // 3 or 10
  packSectionAUsed: z.number().min(0).optional(),
  packSectionBTotal: z.number().min(0).optional(), // 3 or 10
  packSectionBUsed: z.number().min(0).optional(),
  stripeCustomerId: z.string().optional(),
  stripePriceId: z.string().optional(), // For pack purchases
  createdAt: z.string(),
  updatedAt: z.string(),
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
  subscriptionType: SubscriptionType,
  additionalData?: Partial<Subscription>
): Subscription {
  const now = new Date().toISOString();
  return {
    userId,
    subscriptionType,
    createdAt: now,
    updatedAt: now,
    ...additionalData,
  };
}

