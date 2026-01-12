/**
 * Question Service - fetches questions from MongoDB
 */

import { connectDB } from '../db/connection';
import { ReadingListeningQuestion } from '../../types';

export const questionService = {
  /**
   * Get all questions for a specific task
   * Questions are sorted by questionNumber (1-40)
   */
  async getQuestionsByTaskId(taskId: string): Promise<ReadingListeningQuestion[]> {
    const db = await connectDB();
    
    const questions = await db.collection('questions')
      .find({ 
        taskId,
        isActive: true 
      })
      .sort({ questionNumber: 1 }) // Sort by questionNumber ascending (1-40)
      .toArray();
    
    return questions as unknown as ReadingListeningQuestion[];
  },
  
  /**
   * Get a specific question by questionId
   */
  async getQuestionById(questionId: string): Promise<ReadingListeningQuestion | null> {
    const db = await connectDB();
    
    const question = await db.collection('questions')
      .findOne({ 
        questionId,
        isActive: true 
      });
    
    return question as unknown as ReadingListeningQuestion | null;
  },
  
  /**
   * Validate that a task has exactly 40 questions
   */
  async validateQuestionCount(taskId: string): Promise<boolean> {
    const count = await this.countQuestionsByTaskId(taskId);
    return count === 40;
  },
  
  /**
   * Count questions for a task
   */
  async countQuestionsByTaskId(taskId: string): Promise<number> {
    const db = await connectDB();
    
    return db.collection('questions').countDocuments({ 
      taskId,
      isActive: true 
    });
  },
  
  /**
   * Get questions by taskId and questionNumbers (for batch fetching)
   */
  async getQuestionsByTaskIdAndNumbers(
    taskId: string,
    questionNumbers: number[]
  ): Promise<ReadingListeningQuestion[]> {
    const db = await connectDB();
    
    const questions = await db.collection('questions')
      .find({ 
        taskId,
        questionNumber: { $in: questionNumbers },
        isActive: true 
      })
      .sort({ questionNumber: 1 })
      .toArray();
    
    return questions as unknown as ReadingListeningQuestion[];
  },
};
