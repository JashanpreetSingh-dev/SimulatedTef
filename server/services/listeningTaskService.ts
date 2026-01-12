/**
 * Listening Task Service - fetches Listening tasks from MongoDB
 */

import { connectDB } from '../db/connection';
import { ListeningTask } from '../../types';

export const listeningTaskService = {
  /**
   * Get a random active Listening task with exactly 40 questions (for mock exams)
   * Uses MongoDB aggregation to join with questions collection
   */
  async getRandomTask(): Promise<ListeningTask | null> {
    const db = await connectDB();
    
    // Find tasks that have exactly 40 questions (required for mock exams)
    const tasksWithQuestionCount = await db.collection('listeningTasks')
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
      console.warn('No listening tasks with 40 questions found. Falling back to any active task.');
      // Fallback to any active task (for backwards compatibility)
      const fallbackTasks = await db.collection('listeningTasks')
        .aggregate([
          { $match: { isActive: true } },
          { $sample: { size: 1 } }
        ])
        .toArray();
      
      if (fallbackTasks.length === 0) {
        return null;
      }
      return fallbackTasks[0] as unknown as ListeningTask;
    }
    
    return tasksWithQuestionCount[0] as unknown as ListeningTask;
  },
  
  /**
   * Get a specific Listening task by taskId
   */
  async getTaskById(taskId: string): Promise<ListeningTask | null> {
    const db = await connectDB();
    
    const task = await db.collection('listeningTasks')
      .findOne({ taskId, isActive: true });
    
    return task as unknown as ListeningTask | null;
  },
  
  /**
   * Get all active Listening tasks
   */
  async getAllActiveTasks(): Promise<ListeningTask[]> {
    const db = await connectDB();
    
    const tasks = await db.collection('listeningTasks')
      .find({ isActive: true })
      .toArray();
    
    return tasks as unknown as ListeningTask[];
  },
  
  /**
   * Count active Listening tasks
   */
  async countActiveTasks(): Promise<number> {
    const db = await connectDB();
    
    return db.collection('listeningTasks').countDocuments({ isActive: true });
  },
};
