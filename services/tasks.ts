import { TEFTask } from '../types';
import sectionATasks from '../data/section_a_knowledge_base.json';
import sectionBTasks from '../data/section_b_knowledge_base.json';

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

