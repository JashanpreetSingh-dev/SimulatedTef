import { TEFTask, ReadingTask, ListeningTask, ReadingListeningQuestion } from '../types';
import sectionATasks from '../data/section_a_knowledge_base.json';
import sectionBTasks from '../data/section_b_knowledge_base.json';
import { authenticatedFetchJSON } from './authenticatedFetch';

// Handle both Vite (client) and Node.js (server) environments
const BACKEND_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_BACKEND_URL) 
  ? import.meta.env.VITE_BACKEND_URL 
  : (process.env.VITE_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:3001');

// Load tasks from knowledge base JSON files
export const SECTION_A_TASKS: TEFTask[] = sectionATasks as TEFTask[];
export const SECTION_B_TASKS: TEFTask[] = sectionBTasks as TEFTask[];

/**
 * Get a random task from Section A, excluding completed task IDs
 */
export function getRandomSectionATask(completedTaskIds: number[] = []): TEFTask {
  const availableTasks = SECTION_A_TASKS.filter(task => !completedTaskIds.includes(task.id));
  
  if (availableTasks.length === 0) {
    // If all tasks are completed, reset and use all tasks
    console.warn('All Section A tasks completed, resetting available tasks');
    return SECTION_A_TASKS[Math.floor(Math.random() * SECTION_A_TASKS.length)];
  }
  
  return availableTasks[Math.floor(Math.random() * availableTasks.length)];
}

/**
 * Get a random task from Section B, excluding completed task IDs
 */
export function getRandomSectionBTask(completedTaskIds: number[] = []): TEFTask {
  const availableTasks = SECTION_B_TASKS.filter(task => !completedTaskIds.includes(task.id));
  
  if (availableTasks.length === 0) {
    // If all tasks are completed, reset and use all tasks
    console.warn('All Section B tasks completed, resetting available tasks');
    return SECTION_B_TASKS[Math.floor(Math.random() * SECTION_B_TASKS.length)];
  }
  
  return availableTasks[Math.floor(Math.random() * availableTasks.length)];
}

/**
 * Get random tasks for both sections, excluding completed task IDs
 */
export function getRandomTasks(completedTaskIds: number[] = []): { partA: TEFTask; partB: TEFTask } {
  return {
    partA: getRandomSectionATask(completedTaskIds),
    partB: getRandomSectionBTask(completedTaskIds)
  };
}

/**
 * Get a specific task by ID for retake
 */
export function getTaskById(section: 'A' | 'B', taskId: number): TEFTask | null {
  const tasks = section === 'A' ? SECTION_A_TASKS : SECTION_B_TASKS;
  return tasks.find(task => task.id === taskId) || null;
}

// ===== Reading/Listening Task Functions (API-based) =====

/**
 * Get a random Reading task from the API
 */
export async function getRandomReadingTask(
  getToken: () => Promise<string | null>
): Promise<ReadingTask | null> {
  try {
    const task = await authenticatedFetchJSON<ReadingTask>(
      `${BACKEND_URL}/api/tasks/random/reading`,
      {
        method: 'GET',
        getToken,
      }
    );
    return task;
  } catch (error) {
    console.error('Failed to fetch random Reading task:', error);
    return null;
  }
}

/**
 * Get a random Listening task from the API
 */
export async function getRandomListeningTask(
  getToken: () => Promise<string | null>
): Promise<ListeningTask | null> {
  try {
    const task = await authenticatedFetchJSON<ListeningTask>(
      `${BACKEND_URL}/api/tasks/random/listening`,
      {
        method: 'GET',
        getToken,
      }
    );
    return task;
  } catch (error) {
    console.error('Failed to fetch random Listening task:', error);
    return null;
  }
}

/**
 * Get a Reading task with all its questions from the API
 */
export async function getReadingTaskWithQuestions(
  taskId: string,
  getToken: () => Promise<string | null>
): Promise<{ task: ReadingTask; questions: ReadingListeningQuestion[] } | null> {
  try {
    const data = await authenticatedFetchJSON<{
      task: ReadingTask;
      questions: ReadingListeningQuestion[];
      count: number;
    }>(
      `${BACKEND_URL}/api/tasks/${taskId}/with-questions`,
      {
        method: 'GET',
        getToken,
      }
    );
    return { task: data.task, questions: data.questions };
  } catch (error) {
    console.error('Failed to fetch Reading task with questions:', error);
    return null;
  }
}

/**
 * Get a Listening task with all its questions from the API
 */
export async function getListeningTaskWithQuestions(
  taskId: string,
  getToken: () => Promise<string | null>
): Promise<{ task: ListeningTask; questions: ReadingListeningQuestion[] } | null> {
  try {
    const data = await authenticatedFetchJSON<{
      task: ListeningTask;
      questions: ReadingListeningQuestion[];
      count: number;
    }>(
      `${BACKEND_URL}/api/tasks/${taskId}/with-questions`,
      {
        method: 'GET',
        getToken,
      }
    );
    return { task: data.task, questions: data.questions };
  } catch (error) {
    console.error('Failed to fetch Listening task with questions:', error);
    return null;
  }
}

/**
 * Get questions for a Reading/Listening task by taskId
 */
export async function getQuestionsByTaskId(
  taskId: string,
  getToken: () => Promise<string | null>
): Promise<ReadingListeningQuestion[]> {
  try {
    const data = await authenticatedFetchJSON<{
      questions: ReadingListeningQuestion[];
      count: number;
    }>(
      `${BACKEND_URL}/api/tasks/questions/${taskId}`,
      {
        method: 'GET',
        getToken,
      }
    );
    return data.questions;
  } catch (error) {
    console.error('Failed to fetch questions:', error);
    return [];
  }
}
