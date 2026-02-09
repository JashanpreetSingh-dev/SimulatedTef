/**
 * Result data model with validation
 */

import { z } from 'zod';
import { SavedResult } from '../../types';

// Zod schema for result validation
export const ResultSchema = z.object({
  userId: z.string().min(1),
  orgId: z.string().optional(), // Organization ID (optional for backward compatibility)
  score: z.number().min(0).max(699),
  clbLevel: z.string(),
  cecrLevel: z.string().regex(/^(A1|A2|B1|B2|C1|C2)$/),
  feedback: z.string(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  grammarNotes: z.string().optional(),
  vocabularyNotes: z.string().optional(),
  mode: z.string(),
  title: z.string(),
  timestamp: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  recordingId: z.string().optional(),
  transcript: z.string().optional(),
  taskPartA: z.any().optional(),
  taskPartB: z.any().optional(),
  isLoading: z.boolean().optional(),
  votes: z.object({
    upvotes: z.number().default(0),
    downvotes: z.number().default(0),
    downvoteReasons: z.object({
      inaccurate_score: z.number().default(0),
      poor_feedback: z.number().default(0),
      technical_issue: z.number().default(0),
    }).optional(),
    userVotes: z.array(z.object({
      userId: z.string(),
      vote: z.enum(['upvote', 'downvote']),
      reason: z.enum(['inaccurate_score', 'poor_feedback', 'technical_issue']).optional(),
      timestamp: z.string(),
    })).default([]),
  }).optional(),
});

export type Result = z.infer<typeof ResultSchema>;

/**
 * Validate result data
 */
export function validateResult(data: unknown): Result {
  return ResultSchema.parse(data);
}

/**
 * Create result from evaluation result
 */
export function createResultFromEvaluation(
  evaluation: any,
  userId: string,
  mode: string,
  title: string,
  recordingId?: string,
  transcript?: string,
  taskPartA?: any,
  taskPartB?: any
): SavedResult {
  return {
    ...evaluation,
    userId,
    mode,
    title,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    recordingId,
    transcript,
    taskPartA,
    taskPartB,
  } as SavedResult;
}

