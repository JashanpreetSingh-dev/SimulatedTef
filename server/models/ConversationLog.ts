/**
 * Conversation Log data model - tracks live API conversations for oral expression practice sessions
 */

import { z } from 'zod';

// Zod schema for conversation log validation
export const ConversationLogSchema = z.object({
  userId: z.string().min(1),
  orgId: z.string().optional(), // Organization ID (optional for backward compatibility)
  sessionId: z.string().min(1), // Links to examSession
  examType: z.enum(['partA', 'partB']), // Only partA or partB (no 'full')
  module: z.literal('oralExpression'), // Always oralExpression
  part: z.enum(['A', 'B']), // Explicit part indicator
  taskId: z.string().min(1),
  taskTitle: z.string(),
  startedAt: z.string(), // ISO string
  endedAt: z.string().optional(), // ISO string
  duration: z.number().optional(), // seconds
  status: z.enum(['active', 'completed', 'failed', 'abandoned']),
  events: z.array(z.object({
    type: z.enum(['start', 'message', 'error', 'end']),
    timestamp: z.string(), // ISO string
    data: z.any(), // type-specific data
    usageMetadata: z.object({
      promptTokenCount: z.number().optional(),
      candidatesTokenCount: z.number().optional(),
      totalTokenCount: z.number().optional(),
      blockTokenCount: z.number().optional(),
      cost: z.number().optional(), // Calculated cost: (promptTokenCount * 0.000003) + (candidatesTokenCount * 0.000012)
    }).optional(),
  })),
  metrics: z.object({
    messageCount: z.number().default(0),
    userMessageCount: z.number().default(0),
    aiMessageCount: z.number().default(0),
    errorCount: z.number().default(0),
    connectionStatus: z.enum(['connected', 'disconnected', 'error']),
    // Token usage totals
    totalPromptTokens: z.number().default(0), // Final conversation context size (last promptTokenCount)
    totalBilledPromptTokens: z.number().default(0), // Sum of all promptTokenCounts (actual billing)
    totalCompletionTokens: z.number().default(0), // Sum of all completion tokens
    totalTokens: z.number().default(0), // Final total (last totalTokenCount)
    totalBilledTokens: z.number().default(0), // Sum of all totalTokenCounts (actual billing)
    totalCost: z.number().default(0), // Total cost: sum of all costs (input: $3/1M, output: $12/1M)
  }),
  resultId: z.string().optional(), // Link to result if completed
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ConversationLog = z.infer<typeof ConversationLogSchema> & {
  _id?: string;
};

/**
 * Validate conversation log data
 */
export function validateConversationLog(data: unknown): ConversationLog {
  return ConversationLogSchema.parse(data);
}

/**
 * Create a new conversation log document
 */
export function createConversationLog(
  userId: string,
  sessionId: string,
  examType: 'partA' | 'partB',
  part: 'A' | 'B',
  taskId: string,
  taskTitle: string
): ConversationLog {
  const now = new Date().toISOString();
  return {
    userId,
    sessionId,
    examType,
    module: 'oralExpression',
    part,
    taskId,
    taskTitle,
    startedAt: now,
    status: 'active',
    events: [{
      type: 'start',
      timestamp: now,
      data: {},
    }],
    metrics: {
      messageCount: 0,
      userMessageCount: 0,
      aiMessageCount: 0,
      errorCount: 0,
      connectionStatus: 'connected',
      totalPromptTokens: 0,
      totalBilledPromptTokens: 0,
      totalCompletionTokens: 0,
      totalTokens: 0,
      totalBilledTokens: 0,
      totalCost: 0,
    },
    createdAt: now,
    updatedAt: now,
  };
}
