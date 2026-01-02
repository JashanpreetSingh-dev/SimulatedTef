/**
 * Reading Task model - stores Reading Comprehension tasks
 */

import { z } from 'zod';
import { ReadingTask } from '../../types';

// Zod schema for Reading Task validation
export const ReadingTaskSchema = z.object({
  taskId: z.string().min(1),
  type: z.literal('reading'),
  prompt: z.string().min(1),
  content: z.string().min(1),
  timeLimitSec: z.number().positive(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ReadingTaskDocument = z.infer<typeof ReadingTaskSchema> & {
  _id?: string;
};

/**
 * Validate Reading Task data
 */
export function validateReadingTask(data: unknown): ReadingTaskDocument {
  return ReadingTaskSchema.parse(data);
}

/**
 * Create a new Reading Task
 */
export function createReadingTask(
  taskId: string,
  prompt: string,
  content: string,
  timeLimitSec: number = 3600,
  isActive: boolean = true
): ReadingTask {
  const now = new Date().toISOString();
  return {
    taskId,
    type: 'reading',
    prompt,
    content,
    timeLimitSec,
    isActive,
    createdAt: now,
    updatedAt: now,
  };
}
