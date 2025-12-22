/**
 * Exam Session data model - tracks active exam sessions to prevent refresh abuse
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';

export type ExamType = 'full' | 'partA' | 'partB';

// Zod schema for exam session validation
export const ExamSessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().min(1),
  examType: z.enum(['full', 'partA', 'partB']),
  createdAt: z.string(),
  completed: z.boolean().default(false),
  resultId: z.string().optional(),
});

export type ExamSession = z.infer<typeof ExamSessionSchema> & {
  _id?: string;
};

/**
 * Validate exam session data
 */
export function validateExamSession(data: unknown): ExamSession {
  return ExamSessionSchema.parse(data);
}

/**
 * Create a new exam session
 */
export function createExamSession(
  userId: string,
  examType: ExamType
): ExamSession {
  const now = new Date().toISOString();
  return {
    sessionId: randomUUID(),
    userId,
    examType,
    createdAt: now,
    completed: false,
  };
}

