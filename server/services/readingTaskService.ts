/**
 * Reading Task Service - fetches Reading tasks from MongoDB
 */

import { connectDB } from '../db/connection';
import { ReadingTask } from '../../types';

export const readingTaskService = {
  /**
   * Get a random active Reading task using MongoDB $sample aggregation
   */
  async getRandomTask(): Promise<ReadingTask | null> {
    const db = await connectDB();
    
    const tasks = await db.collection('readingTasks')
      .aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 1 } }
      ])
      .toArray();
    
    if (tasks.length === 0) {
      return null;
    }
    
    return tasks[0] as unknown as ReadingTask;
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
