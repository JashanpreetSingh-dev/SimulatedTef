/**
 * Question Service - fetches questions from MongoDB
 */

import { connectDB } from '../db/connection';
import { ReadingListeningQuestion } from '../../types';
import { s3Service } from './s3Service';

/** Resolve optionImageS3Keys to presigned URLs and return question without S3 keys. */
async function resolveQuestionForResponse(q: any): Promise<ReadingListeningQuestion> {
  const keys = q.optionImageS3Keys as string[] | undefined;
  if (keys?.length === 4 && s3Service.isS3Configured()) {
    try {
      const urls = await Promise.all(keys.map((key) => s3Service.getPresignedUrl(key)));
      const { optionImageS3Keys: _, ...rest } = q;
      return { ...rest, optionImageUrls: urls };
    } catch (err) {
      console.warn('Failed to resolve optionImageS3Keys to presigned URLs:', err);
    }
  }
  const { optionImageS3Keys: _, ...rest } = q;
  return rest;
}

export const questionService = {
  /**
   * Get all questions for a specific task
   * Questions are sorted by questionNumber (1-40).
   * If questions have optionImageS3Keys, they are resolved to presigned optionImageUrls.
   */
  async getQuestionsByTaskId(taskId: string): Promise<ReadingListeningQuestion[]> {
    const db = await connectDB();
    
    const raw = await db.collection('questions')
      .find({ 
        taskId,
        isActive: true 
      })
      .sort({ questionNumber: 1 }) // Sort by questionNumber ascending (1-40)
      .toArray();
    
    const questions = await Promise.all((raw as any[]).map(resolveQuestionForResponse));
    return questions;
  },
  
  /**
   * Get a specific question by questionId
   */
  async getQuestionById(questionId: string): Promise<ReadingListeningQuestion | null> {
    const db = await connectDB();
    
    const raw = await db.collection('questions')
      .findOne({ 
        questionId,
        isActive: true 
      });
    
    if (!raw) return null;
    return resolveQuestionForResponse(raw as any);
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
    
    const raw = await db.collection('questions')
      .find({ 
        taskId,
        questionNumber: { $in: questionNumbers },
        isActive: true 
      })
      .sort({ questionNumber: 1 })
      .toArray();
    
    return Promise.all((raw as any[]).map(resolveQuestionForResponse));
  },
};
