/**
 * Subscription Tier Model - configuration for subscription tiers
 */

import { z } from 'zod';

// Zod schema for subscription tier validation
export const SubscriptionTierSchema = z.object({
  id: z.enum(['free', 'basic', 'premium']),
  name: z.string(),
  limits: z.object({
    sectionALimit: z.number().min(0),
    sectionBLimit: z.number().min(0),
    writtenExpressionSectionALimit: z.number().min(0),
    writtenExpressionSectionBLimit: z.number().min(0),
    mockExamLimit: z.number().min(0).optional(),
  }),
  stripePriceId: z.string().optional(), // Stripe Price ID for monthly subscription
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type SubscriptionTier = z.infer<typeof SubscriptionTierSchema> & {
  _id?: string;
};

/**
 * Default subscription tiers
 */
export const DEFAULT_SUBSCRIPTION_TIERS: Omit<SubscriptionTier, '_id' | 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'free',
    name: 'Free',
    limits: {
      sectionALimit: 1,
      sectionBLimit: 1,
      writtenExpressionSectionALimit: 1, // Same as speaking
      writtenExpressionSectionBLimit: 1, // Same as speaking
      mockExamLimit: 1,
    },
  },
  {
    id: 'basic',
    name: 'Basic',
    limits: {
      sectionALimit: 10,
      sectionBLimit: 10,
      writtenExpressionSectionALimit: 10, // Same as speaking
      writtenExpressionSectionBLimit: 10, // Same as speaking
      mockExamLimit: 2,
    },
  },
  {
    id: 'premium',
    name: 'Premium',
    limits: {
      sectionALimit: 30,
      sectionBLimit: 30,
      writtenExpressionSectionALimit: 30, // Same as speaking
      writtenExpressionSectionBLimit: 30, // Same as speaking
      mockExamLimit: 5,
    },
  },
];

/**
 * Validate subscription tier data
 */
export function validateSubscriptionTier(data: unknown): SubscriptionTier {
  return SubscriptionTierSchema.parse(data);
}
