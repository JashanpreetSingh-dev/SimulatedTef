/**
 * Written Task Service - loads Written Expression tasks from JSON files
 */

import { WrittenTask } from '../../types';
import * as fs from 'fs';
import * as path from 'path';

interface WrittenTaskJSON {
  section: 'A' | 'B';
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

// Cache for loaded tasks
let sectionATasks: WrittenTask[] | null = null;
let sectionBTasks: WrittenTask[] | null = null;

/**
 * Load tasks from JSON file
 */
function loadTasksFromFile(section: 'A' | 'B'): WrittenTask[] {
  const filename = section === 'A' 
    ? 'written_section_a_knowledge_base.json'
    : 'written_section_b_knowledge_base.json';
  
  // Use path relative to project root
  const filePath = path.join(process.cwd(), 'data', filename);
  
  try {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const jsonData: WrittenTaskJSON = JSON.parse(fileContent);
    
    // Map JSON structure to WrittenTask interface
    return jsonData.topics.map(topic => {
      const instruction = section === 'A'
        ? 'Rédigez un fait divers de 80 à 120 mots en vous inspirant de cette situation.'
        : 'Rédigez une argumentation de 200 à 250 mots sur ce sujet.';
      
      const minWords = section === 'A' ? 80 : 200;
      
      return {
        id: `written_${topic.id}`,
        section: section,
        subject: topic.prompt,
        instruction: instruction,
        minWords: minWords,
        modelAnswer: topic.model_answer?.text, // Include model answer if available
      };
    });
  } catch (error) {
    console.error(`Error loading written tasks from ${filename}:`, error);
    return [];
  }
}

/**
 * Get tasks for a section (with caching)
 */
function getTasksForSection(section: 'A' | 'B'): WrittenTask[] {
  if (section === 'A') {
    if (!sectionATasks) {
      sectionATasks = loadTasksFromFile('A');
    }
    return sectionATasks;
  } else {
    if (!sectionBTasks) {
      sectionBTasks = loadTasksFromFile('B');
    }
    return sectionBTasks;
  }
}

export const writtenTaskService = {
  /**
   * Get a random task for a specific section
   */
  async getRandomTask(section: 'A' | 'B'): Promise<WrittenTask | null> {
    const tasks = getTasksForSection(section);
    
    if (tasks.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * tasks.length);
    return tasks[randomIndex];
  },
  
  /**
   * Get a specific task by taskId
   * TaskId format: "written_A001" or "written_B001"
   */
  async getTaskById(taskId: string): Promise<WrittenTask | null> {
    // Extract section and original ID from taskId
    const match = taskId.match(/^written_([AB])(\d+)$/);
    if (!match) {
      return null;
    }
    
    const section = match[1] as 'A' | 'B';
    const originalId = `${section}${match[2].padStart(3, '0')}`;
    
    const tasks = getTasksForSection(section);
    return tasks.find(task => task.id === taskId) || null;
  },
  
  /**
   * Get all tasks for a section (or both if section not specified)
   */
  async getAllTasks(section?: 'A' | 'B'): Promise<WrittenTask[]> {
    if (section) {
      return getTasksForSection(section);
    } else {
      return [...getTasksForSection('A'), ...getTasksForSection('B')];
    }
  },
  
  /**
   * Get both Section A and Section B tasks (for mock exams)
   */
  async getRandomTasks(): Promise<{ taskA: WrittenTask; taskB: WrittenTask } | null> {
    const taskA = await this.getRandomTask('A');
    const taskB = await this.getRandomTask('B');
    
    if (!taskA || !taskB) {
      return null;
    }
    
    return { taskA, taskB };
  },
  
  /**
   * Count tasks for a section
   */
  async countTasks(section?: 'A' | 'B'): Promise<number> {
    if (section) {
      return getTasksForSection(section).length;
    } else {
      return getTasksForSection('A').length + getTasksForSection('B').length;
    }
  },
};
