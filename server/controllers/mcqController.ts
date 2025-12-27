/**
 * MCQ Controller - handles MCQ submission and scoring
 */

import { Request, Response } from 'express';
import { connectDB } from '../db/connection';
import { calculateMCQScore, validateAnswers } from '../services/mcqScoring';
import { questionService } from '../services/questionService';
import { resultsService } from '../services/resultsService';
import { SavedResult } from '../../types';
import { ObjectId } from 'mongodb';

export const mcqController = {
  /**
   * Submit MCQ answers for Reading/Listening
   */
  async submitMCQ(
    userId: string,
    taskId: string,
    answers: number[],
    module: 'reading' | 'listening',
    mockExamId: string,
    sessionId: string
  ): Promise<{
    success: boolean;
    resultId: string;
    score: number;
    totalQuestions: number;
  }> {
    // Validate answers
    if (!validateAnswers(answers, 40)) {
      throw new Error('Invalid answers format. Answers must be numbers between 0-3 or -1 (not answered)');
    }
    
    // Get questions
    const questions = await questionService.getQuestionsByTaskId(taskId);
    
    if (questions.length === 0) {
      throw new Error(`No questions found for task ${taskId}`);
    }
    
    if (questions.length !== 40) {
      throw new Error(`Expected 40 questions, got ${questions.length}`);
    }
    
    // Calculate score
    const scoringResult = calculateMCQScore({
      taskId,
      questions,
      answers,
    });
    
    // Create result document
    const result: Partial<SavedResult> = {
      userId,
      sessionId,
      mockExamId,
      module,
      mode: 'mock',
      title: `Mock Exam - ${module === 'reading' ? 'Reading' : 'Listening'}`,
      timestamp: Date.now(),
      score: scoringResult.score,
      clbLevel: '', // Not applicable for MCQ
      cecrLevel: '', // Not applicable for MCQ
      feedback: `Score: ${scoringResult.score}/${scoringResult.totalQuestions}`,
      strengths: [],
      weaknesses: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Add module-specific result
    if (module === 'reading') {
      result.readingResult = scoringResult;
    } else {
      result.listeningResult = scoringResult;
    }
    
    // Save result with upsert (prevent duplicates)
    const db = await connectDB();
    const savedResult = await db.collection('results').findOneAndUpdate(
      { sessionId, module },
      {
        $set: result,
      },
      {
        upsert: true,
        returnDocument: 'after',
      }
    );
    
    return {
      success: true,
      resultId: savedResult._id.toString(),
      score: scoringResult.score,
      totalQuestions: scoringResult.totalQuestions,
    };
  },
};
