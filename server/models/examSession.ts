/**
 * Exam Session data model - tracks active exam sessions to prevent refresh abuse
 */

import { z } from 'zod';
import { randomUUID } from 'crypto';

export type ExamType = 'full' | 'partA' | 'partB' | 'mock';

// Zod schema for exam session validation
export const ExamSessionSchema = z.object({
  sessionId: z.string().uuid(),
  userId: z.string().min(1),
  examType: z.enum(['full', 'partA', 'partB', 'mock']),
  createdAt: z.string(),
  completed: z.boolean().default(false),
  resultId: z.string().optional(),
  // Mock exam specific fields
  mockExamId: z.string().optional(),
  taskIds: z.array(z.string()).optional(),
  currentModule: z.enum(['oralExpression', 'reading', 'listening', 'writtenExpression']).nullable().optional(),
  completedModules: z.array(z.string()).optional(),
  moduleSessions: z.record(z.string()).optional(), // { [module: string]: string }
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
  examType: ExamType,
  options?: {
    mockExamId?: string;
    taskIds?: string[];
    currentModule?: 'oralExpression' | 'reading' | 'listening' | 'writtenExpression' | null;
    completedModules?: string[];
    moduleSessions?: Record<string, string>;
  }
): ExamSession {
  const now = new Date().toISOString();
  const session: ExamSession = {
    sessionId: randomUUID(),
    userId,
    examType,
    createdAt: now,
    completed: false,
  };
  
  // Add mock exam specific fields if provided
  if (options) {
    if (options.mockExamId !== undefined) {
      session.mockExamId = options.mockExamId;
    }
    if (options.taskIds !== undefined) {
      session.taskIds = options.taskIds;
    }
    if (options.currentModule !== undefined) {
      session.currentModule = options.currentModule;
    }
    if (options.completedModules !== undefined) {
      session.completedModules = options.completedModules;
    }
    if (options.moduleSessions !== undefined) {
      session.moduleSessions = options.moduleSessions;
    }
  }
  
  return session;
}

