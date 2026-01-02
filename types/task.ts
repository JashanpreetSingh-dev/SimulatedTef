import { TEFTask, WrittenTask, ReadingTask, ListeningTask } from '../types';

/**
 * Task type discriminator
 */
export type TaskType = 'oralA' | 'oralB' | 'writtenA' | 'writtenB' | 'reading' | 'listening';

/**
 * Task reference used in results
 */
export interface TaskReference {
  taskId: string;
  type: TaskType;
}

/**
 * Unified task data structure with discriminated union
 */
export type TaskData = 
  | { type: 'oralA' | 'oralB'; data: TEFTask }
  | { type: 'writtenA' | 'writtenB'; data: WrittenTask }
  | { type: 'reading'; data: ReadingTask }
  | { type: 'listening'; data: ListeningTask };

/**
 * Normalized task document stored in MongoDB
 */
export interface NormalizedTask {
  _id?: string;
  taskId: string; // Unique identifier (e.g., "oralA_1", "writtenB_5", "reading_3")
  type: TaskType;
  taskData: TaskData['data']; // Type-specific task content
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

/**
 * Helper to generate taskId from task data
 */
export function generateTaskId(type: TaskType, task: TEFTask | WrittenTask | ReadingTask | ListeningTask): string {
  if (type === 'oralA' || type === 'oralB') {
    const tefTask = task as TEFTask;
    return `${type}_${tefTask.id}`;
  } else if (type === 'writtenA' || type === 'writtenB') {
    const writtenTask = task as WrittenTask;
    return `${type}_${writtenTask.id}`;
  } else if (type === 'reading') {
    const readingTask = task as ReadingTask;
    return readingTask.taskId;
  } else if (type === 'listening') {
    const listeningTask = task as ListeningTask;
    return listeningTask.taskId;
  }
  throw new Error(`Unknown task type: ${type}`);
}
