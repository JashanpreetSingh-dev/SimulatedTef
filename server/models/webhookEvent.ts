/**
 * Webhook event tracking for idempotency
 */

import { z } from 'zod';

export const WebhookEventSchema = z.object({
  eventId: z.string(), // Stripe event ID (e.g., evt_xxx)
  eventType: z.string(), // Stripe event type (e.g., checkout.session.completed)
  processed: z.boolean(),
  processedAt: z.string().optional(),
  error: z.string().optional(),
  createdAt: z.string(),
});

export type WebhookEvent = z.infer<typeof WebhookEventSchema> & {
  _id?: string;
};

/**
 * Create a webhook event record
 */
export function createWebhookEvent(
  eventId: string,
  eventType: string,
  processed: boolean = false
): WebhookEvent {
  return {
    eventId,
    eventType,
    processed,
    createdAt: new Date().toISOString(),
  };
}

