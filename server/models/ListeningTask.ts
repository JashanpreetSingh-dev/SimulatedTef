/**
 * Listening Task model - stores Listening Comprehension tasks
 */

import { z } from 'zod';
import { ListeningTask } from '../../types';

// Zod schema for Listening Task validation
export const ListeningTaskSchema = z.object({
  taskId: z.string().min(1),
  type: z.literal('listening'),
  prompt: z.string().min(1),
  audioUrl: z.string().min(1),
  timeLimitSec: z.number().positive(),
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ListeningTaskDocument = z.infer<typeof ListeningTaskSchema> & {
  _id?: string;
};

/**
 * Validate Listening Task data
 */
export function validateListeningTask(data: unknown): ListeningTaskDocument {
  return ListeningTaskSchema.parse(data);
}

/**
 * Create a new Listening Task
 */
export function createListeningTask(
  taskId: string,
  prompt: string,
  audioUrl: string,
  timeLimitSec: number = 2400,
  isActive: boolean = true
): ListeningTask {
  const now = new Date().toISOString();
  return {
    taskId,
    type: 'listening',
    prompt,
    audioUrl,
    timeLimitSec,
    isActive,
    createdAt: now,
    updatedAt: now,
  };
}
