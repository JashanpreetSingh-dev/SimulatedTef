import { WrittenTask } from '../types';
import writtenSectionA from '../data/written_section_a_knowledge_base.json';
import writtenSectionB from '../data/written_section_b_knowledge_base.json';

interface WrittenTaskJSON {
  section: 'A' | 'B';
  task: string;
  word_limit: {
    min: number;
    recommended_min: number;
    recommended_max: number;
  };
  total_topics: number;
  topics: Array<{
    id: string;
    prompt: string;
    model_answer?: {
      text: string;
      word_count?: number;
      source?: string;
    };
  }>;
}

// Load tasks from JSON files
const SECTION_A_TASKS: WrittenTask[] = (writtenSectionA as WrittenTaskJSON).topics.map(topic => ({
  id: `written_${topic.id}`,
  section: 'A',
  subject: topic.prompt,
  instruction: 'Rédigez un fait divers de 80 à 120 mots en vous inspirant de cette situation.',
  minWords: 80,
  modelAnswer: topic.model_answer?.text,
}));

const SECTION_B_TASKS: WrittenTask[] = (writtenSectionB as WrittenTaskJSON).topics.map(topic => ({
  id: `written_${topic.id}`,
  section: 'B',
  subject: topic.prompt,
  instruction: 'Rédigez une argumentation de 200 à 250 mots sur ce sujet.',
  minWords: 200,
  modelAnswer: topic.model_answer?.text,
}));

/**
 * Get a random task from Section A, excluding completed task IDs
 */
export function getRandomWrittenSectionATask(completedTaskIds: string[] = []): WrittenTask {
  const availableTasks = SECTION_A_TASKS.filter(task => !completedTaskIds.includes(task.id));
  
  if (availableTasks.length === 0) {
    // If all tasks are completed, reset and use all tasks
    console.warn('All Section A written tasks completed, resetting available tasks');
    return SECTION_A_TASKS[Math.floor(Math.random() * SECTION_A_TASKS.length)];
  }
  
  return availableTasks[Math.floor(Math.random() * availableTasks.length)];
}

/**
 * Get a random task from Section B, excluding completed task IDs
 */
export function getRandomWrittenSectionBTask(completedTaskIds: string[] = []): WrittenTask {
  const availableTasks = SECTION_B_TASKS.filter(task => !completedTaskIds.includes(task.id));
  
  if (availableTasks.length === 0) {
    // If all tasks are completed, reset and use all tasks
    console.warn('All Section B written tasks completed, resetting available tasks');
    return SECTION_B_TASKS[Math.floor(Math.random() * SECTION_B_TASKS.length)];
  }
  
  return availableTasks[Math.floor(Math.random() * availableTasks.length)];
}

/**
 * Get random tasks for both sections, excluding completed task IDs
 */
export function getRandomWrittenTasks(completedTaskIds: string[] = []): { taskA: WrittenTask; taskB: WrittenTask } {
  return {
    taskA: getRandomWrittenSectionATask(completedTaskIds),
    taskB: getRandomWrittenSectionBTask(completedTaskIds)
  };
}

/**
 * Get a specific task by ID
 */
export function getWrittenTaskById(taskId: string): WrittenTask | null {
  const allTasks = [...SECTION_A_TASKS, ...SECTION_B_TASKS];
  return allTasks.find(task => task.id === taskId) || null;
}
