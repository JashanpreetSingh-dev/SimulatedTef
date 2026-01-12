/**
 * Reading Task Service - fetches Reading tasks from MongoDB
 */

import { connectDB } from '../db/connection';
import { ReadingTask } from '../../types';

export const readingTaskService = {
  /**
   * Get a random active Reading task with exactly 40 questions (for mock exams)
   * Uses MongoDB aggregation to join with questions collection
   */
  async getRandomTask(): Promise<ReadingTask | null> {
    const db = await connectDB();
    
    // Find tasks that have exactly 40 questions (required for mock exams)
    const tasksWithQuestionCount = await db.collection('readingTasks')
      .aggregate([
        { $match: { isActive: true } },
        // Join with questions collection to count questions
        {
          $lookup: {
            from: 'questions',
            localField: 'taskId',
            foreignField: 'taskId',
            as: 'questions'
          }
        },
        // Add field for question count
        {
          $addFields: {
            questionCount: { $size: '$questions' }
          }
        },
        // Only keep tasks with exactly 40 questions (full mock exam tasks)
        { $match: { questionCount: 40 } },
        // Remove the joined questions array (we only needed the count)
        { $project: { questions: 0, questionCount: 0 } },
        // Random sample
        { $sample: { size: 1 } }
      ])
      .toArray();
    
    if (tasksWithQuestionCount.length === 0) {
      console.warn('No reading tasks with 40 questions found. Falling back to any active task.');
      // Fallback to any active task (for backwards compatibility)
      const fallbackTasks = await db.collection('readingTasks')
        .aggregate([
          { $match: { isActive: true } },
          { $sample: { size: 1 } }
        ])
        .toArray();
      
      if (fallbackTasks.length === 0) {
        return null;
      }
      return fallbackTasks[0] as unknown as ReadingTask;
    }
    
    return tasksWithQuestionCount[0] as unknown as ReadingTask;
  },
  
  /**
   * Get a specific Reading task by taskId
   */
  async getTaskById(taskId: string): Promise<ReadingTask | null> {
    const db = await connectDB();
    
    const task = await db.collection('readingTasks')
      .findOne({ taskId, isActive: true });
    
    return task as unknown as ReadingTask | null;
  },
  
  /**
   * Get all active Reading tasks
   */
  async getAllActiveTasks(): Promise<ReadingTask[]> {
    const db = await connectDB();
    
    const tasks = await db.collection('readingTasks')
      .find({ isActive: true })
      .toArray();
    
    return tasks as unknown as ReadingTask[];
  },
  
  /**
   * Count active Reading tasks
   */
  async countActiveTasks(): Promise<number> {
    const db = await connectDB();
    
    return db.collection('readingTasks').countDocuments({ isActive: true });
  },
};
