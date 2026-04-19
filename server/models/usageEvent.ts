/**
 * Usage Event - one record per use, for time-boundary queries (e.g. resubscribe same day)
 */

import { z } from 'zod';

export const USAGE_EVENT_TYPES = [
  'sectionA',
  'sectionB',
  'fullExam',
  'writtenExpressionSectionA',
  'writtenExpressionSectionB',
  'mockExam',
] as const;

export type UsageEventType = (typeof USAGE_EVENT_TYPES)[number];

export const UsageEventSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum(USAGE_EVENT_TYPES),
  createdAt: z.string(), // ISO
  /** BSON Date for Mongo TTL; optional on legacy documents. */
  mongoTtlAnchor: z.date().optional(),
});

export type UsageEvent = z.infer<typeof UsageEventSchema> & {
  _id?: string;
};

export function createUsageEvent(
  userId: string,
  date: string,
  type: UsageEventType
): UsageEvent {
  return {
    userId,
    date,
    type,
    createdAt: new Date().toISOString(),
    mongoTtlAnchor: new Date(),
  };
}
