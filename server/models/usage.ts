/**
 * Usage data model - tracks daily usage per user
 */

import { z } from 'zod';

// Zod schema for usage validation
export const UsageSchema = z.object({
  userId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), // YYYY-MM-DD format
  fullTestsUsed: z.number().min(0).default(0),
  sectionAUsed: z.number().min(0).default(0),
  sectionBUsed: z.number().min(0).default(0),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Usage = z.infer<typeof UsageSchema> & {
  _id?: string;
};

/**
 * Validate usage data
 */
export function validateUsage(data: unknown): Usage {
  return UsageSchema.parse(data);
}

/**
 * Create a new usage document
 */
export function createUsage(
  userId: string,
  date: string, // YYYY-MM-DD format
  initialUsage?: { fullTestsUsed?: number; sectionAUsed?: number; sectionBUsed?: number }
): Usage {
  const now = new Date().toISOString();
  return {
    userId,
    date,
    fullTestsUsed: initialUsage?.fullTestsUsed ?? 0,
    sectionAUsed: initialUsage?.sectionAUsed ?? 0,
    sectionBUsed: initialUsage?.sectionBUsed ?? 0,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * Get today's date in UTC as YYYY-MM-DD
 */
export function getTodayUTC(): string {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

