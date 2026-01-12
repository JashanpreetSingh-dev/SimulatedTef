/**
 * Task data model with validation
 */

import { z } from 'zod';
import { NormalizedTask, TaskType } from '../../types/task';

// Base task schema
const BaseTaskSchema = z.object({
  taskId: z.string().min(1),
  type: z.enum(['oralA', 'oralB', 'writtenA', 'writtenB', 'reading', 'listening']),
  createdAt: z.string(),
  updatedAt: z.string(),
  isActive: z.boolean().default(true),
});

// Task data schemas for each type
const TEFTaskDataSchema = z.object({
  id: z.number(),
  section: z.string(),
  prompt: z.string(),
  title: z.string().nullable().optional(),
  image: z.string(),
  time_limit_sec: z.number(),
  difficulty: z.string(),
  suggested_questions: z.array(z.string()).optional(),
  counter_arguments: z.array(z.string()).optional(),
});

const WrittenTaskDataSchema = z.object({
  id: z.string(),
  section: z.enum(['A', 'B']),
  subject: z.string(),
  instruction: z.string(),
  minWords: z.number(),
  modelAnswer: z.string().optional(),
});

const ReadingTaskDataSchema = z.object({
  taskId: z.string(),
  type: z.literal('reading'),
  prompt: z.string(),
  content: z.string(),
  timeLimitSec: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const ListeningTaskDataSchema = z.object({
  taskId: z.string(),
  type: z.literal('listening'),
  prompt: z.string(),
  audioUrl: z.string(),
  timeLimitSec: z.number(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Discriminated union for task data
const TaskDataSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('oralA'), data: TEFTaskDataSchema }),
  z.object({ type: z.literal('oralB'), data: TEFTaskDataSchema }),
  z.object({ type: z.literal('writtenA'), data: WrittenTaskDataSchema }),
  z.object({ type: z.literal('writtenB'), data: WrittenTaskDataSchema }),
  z.object({ type: z.literal('reading'), data: ReadingTaskDataSchema }),
  z.object({ type: z.literal('listening'), data: ListeningTaskDataSchema }),
]);

// Full task schema
export const TaskSchema = BaseTaskSchema.extend({
  taskData: z.any(), // TaskDataSchema validation happens at runtime based on type
});

export type Task = z.infer<typeof TaskSchema>;

/**
 * Validate task data
 */
export function validateTask(data: unknown): NormalizedTask {
  const parsed = TaskSchema.parse(data);
  return parsed as NormalizedTask;
}

/**
 * Create task from task data
 */
export function createTask(
  taskId: string,
  type: TaskType,
  taskData: any,
  isActive: boolean = true
): NormalizedTask {
  return {
    taskId,
    type,
    taskData,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isActive,
  };
}
