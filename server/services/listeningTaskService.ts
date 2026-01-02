/**
 * Listening Task Service - fetches Listening tasks from MongoDB
 */

import { connectDB } from '../db/connection';
import { ListeningTask } from '../../types';

export const listeningTaskService = {
  /**
   * Get a random active Listening task using MongoDB $sample aggregation
   */
  async getRandomTask(): Promise<ListeningTask | null> {
    const db = await connectDB();
    
    const tasks = await db.collection('listeningTasks')
      .aggregate([
        { $match: { isActive: true } },
        { $sample: { size: 1 } }
      ])
      .toArray();
    
    if (tasks.length === 0) {
      return null;
    }
    
    return tasks[0] as unknown as ListeningTask;
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
