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
 * Shuffle an array using Fisher-Yates algorithm (in-place)
 */
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]; // Create a copy to avoid mutating the original
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Get a random task from Section A, excluding completed task IDs
 * Randomizes the order of suggested_questions array
 */
export function getRandomSectionATask(completedTaskIds: number[] = []): TEFTask {
  const availableTasks = SECTION_A_TASKS.filter(task => !completedTaskIds.includes(task.id));
  
  let selectedTask: TEFTask;
  if (availableTasks.length === 0) {
    // If all tasks are completed, reset and use all tasks
    console.warn('All Section A tasks completed, resetting available tasks');
    selectedTask = SECTION_A_TASKS[Math.floor(Math.random() * SECTION_A_TASKS.length)];
  } else {
    selectedTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
  }
  
  // Randomize the order of suggested_questions if they exist
  if (selectedTask.suggested_questions && selectedTask.suggested_questions.length > 0) {
    return {
      ...selectedTask,
      suggested_questions: shuffleArray(selectedTask.suggested_questions)
    };
  }
  
  return selectedTask;
}

/**
 * Get a random task from Section B, excluding completed task IDs
 * Randomizes the order of counter_arguments array
 */
export function getRandomSectionBTask(completedTaskIds: number[] = []): TEFTask {
  const availableTasks = SECTION_B_TASKS.filter(task => !completedTaskIds.includes(task.id));
  
  let selectedTask: TEFTask;
  if (availableTasks.length === 0) {
    // If all tasks are completed, reset and use all tasks
    console.warn('All Section B tasks completed, resetting available tasks');
    selectedTask = SECTION_B_TASKS[Math.floor(Math.random() * SECTION_B_TASKS.length)];
  } else {
    selectedTask = availableTasks[Math.floor(Math.random() * availableTasks.length)];
  }
  
  // Randomize the order of counter_arguments if they exist
  if (selectedTask.counter_arguments && selectedTask.counter_arguments.length > 0) {
    return {
      ...selectedTask,
      counter_arguments: shuffleArray(selectedTask.counter_arguments)
    };
  }
  
  return selectedTask;
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
 * Randomizes the order of suggested_questions (Section A) or counter_arguments (Section B)
 */
export function getTaskById(section: 'A' | 'B', taskId: number): TEFTask | null {
  const tasks = section === 'A' ? SECTION_A_TASKS : SECTION_B_TASKS;
  const task = tasks.find(task => task.id === taskId);
  
  if (!task) {
    return null;
  }
  
  // Randomize the order of questions/arguments for retakes
  if (section === 'A' && task.suggested_questions && task.suggested_questions.length > 0) {
    return {
      ...task,
      suggested_questions: shuffleArray(task.suggested_questions)
    };
  }
  
  if (section === 'B' && task.counter_arguments && task.counter_arguments.length > 0) {
    return {
      ...task,
      counter_arguments: shuffleArray(task.counter_arguments)
    };
  }
  
  return task;
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

// AudioItem interface (metadata only, no binary data)
export interface AudioItemMetadata {
  audioId: string;
  sectionId: number;
  repeatable: boolean;
  audioScript: string;
  mimeType: string;
  hasAudio: boolean;
}

/**
 * Get a Listening task with all its questions and AudioItems from the API
 */
export async function getListeningTaskWithQuestions(
  taskId: string,
  getToken: () => Promise<string | null>
): Promise<{ task: ListeningTask; questions: ReadingListeningQuestion[]; audioItems: AudioItemMetadata[] | null } | null> {
  try {
    const data = await authenticatedFetchJSON<{
      task: ListeningTask;
      questions: ReadingListeningQuestion[];
      count: number;
      audioItems?: AudioItemMetadata[] | null;
    }>(
      `${BACKEND_URL}/api/tasks/${taskId}/with-questions`,
      {
        method: 'GET',
        getToken,
      }
    );
    return { task: data.task, questions: data.questions, audioItems: data.audioItems || null };
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
