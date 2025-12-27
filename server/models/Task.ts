/**
 * Base Task model - unified interface for all task types
 * Note: This is a TypeScript interface, not a MongoDB model
 * Actual models are ReadingTask, ListeningTask, and TEFTask (for Oral)
 */

import { Task } from '../../types';

export type { Task };

/**
 * Helper to check if task is a Reading task
 */
export function isReadingTask(task: Task): task is Task & { type: 'reading'; content: string } {
  return task.type === 'reading';
}

/**
 * Helper to check if task is a Listening task
 */
export function isListeningTask(task: Task): task is Task & { type: 'listening'; audioUrl: string } {
  return task.type === 'listening';
}

/**
 * Helper to check if task is an Oral A task
 */
export function isOralATask(task: Task): task is Task & { type: 'oralA'; image: string; suggested_questions?: string[] } {
  return task.type === 'oralA';
}

/**
 * Helper to check if task is an Oral B task
 */
export function isOralBTask(task: Task): task is Task & { type: 'oralB'; image: string; counter_arguments?: string[] } {
  return task.type === 'oralB';
}
