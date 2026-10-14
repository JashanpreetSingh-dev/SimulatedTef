/**
 * Question Service - fetches questions from MongoDB
 */

import { connectDB } from '../db/connection';
import { ReadingListeningQuestion } from '../../types';
import { s3Service } from './s3Service';

/** Resolve S3 keys to presigned URLs and return question without raw S3 key fields. */
async function resolveQuestionForResponse(q: any): Promise<ReadingListeningQuestion> {
  let result = { ...q };

  // Resolve optionImageS3Keys → optionImageUrls
  const optionKeys = q.optionImageS3Keys as string[] | undefined;
  if (optionKeys?.length === 4 && s3Service.isS3Configured()) {
    try {
      const urls = await Promise.all(optionKeys.map((key) => s3Service.getPresignedUrl(key)));
      result = { ...result, optionImageUrls: urls };
    } catch (err) {
      console.warn('Failed to resolve optionImageS3Keys to presigned URLs:', err);
    }
  }
  delete result.optionImageS3Keys;

  // Resolve questionImageS3Key → questionImage
  const qImgKey = q.questionImageS3Key as string | undefined;
  if (qImgKey && s3Service.isS3Configured()) {
    try {
      result.questionImage = await s3Service.getPresignedUrl(qImgKey);
    } catch (err) {
      console.warn('Failed to resolve questionImageS3Key to presigned URL:', err);
    }
  }
  delete result.questionImageS3Key;

  return result as ReadingListeningQuestion;
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
