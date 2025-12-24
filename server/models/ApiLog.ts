/**
 * AI API Log data model with validation
 */

import { z } from 'zod';

// Zod schema for API log validation
export const ApiLogSchema = z.object({
  userId: z.string().optional(),
  sessionId: z.string().optional(),
  functionName: z.string().min(1),
  model: z.string().min(1),
  inputTokens: z.number().min(0).default(0),
  outputTokens: z.number().min(0).default(0),
  totalTokens: z.number().min(0).default(0),
  estimatedCost: z.number().min(0).optional(),
  duration: z.number().min(0), // milliseconds
  status: z.enum(['success', 'error']),
  errorMessage: z.string().optional(),
  metadata: z.record(z.any()).optional(),
  timestamp: z.date(),
  createdAt: z.date(),
});

export type ApiLog = z.infer<typeof ApiLogSchema> & {
  _id?: string;
};

/**
 * Validate API log data
 */
export function validateApiLog(data: unknown): ApiLog {
  return ApiLogSchema.parse(data);
}

/**
 * Create a new API log document
 */
export function createApiLog(
  functionName: string,
  model: string,
  inputTokens: number,
  outputTokens: number,
  duration: number,
  status: 'success' | 'error',
  options?: {
    userId?: string;
    sessionId?: string;
    estimatedCost?: number;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }
): ApiLog {
  const now = new Date();
  const totalTokens = inputTokens + outputTokens;
  
  return {
    userId: options?.userId,
    sessionId: options?.sessionId,
    functionName,
    model,
    inputTokens,
    outputTokens,
    totalTokens,
    estimatedCost: options?.estimatedCost,
    duration,
    status,
    errorMessage: options?.errorMessage,
    metadata: options?.metadata,
    timestamp: now,
    createdAt: now,
  };
}

