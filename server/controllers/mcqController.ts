/**
 * MCQ Controller - handles MCQ submission and scoring
 */

import { Request, Response } from 'express';
import { connectDB } from '../db/connection';
import { calculateMCQScore, validateAnswers } from '../services/mcqScoring';
import { questionService } from '../services/questionService';
import { resultsService } from '../services/resultsService';
import * as taskService from '../services/taskService';
import { generateTaskId, TaskType } from '../../types/task';
import { SavedResult, MCQData } from '../../types';
import { ObjectId } from 'mongodb';
import { readingTaskService } from '../services/readingTaskService';
import { listeningTaskService } from '../services/listeningTaskService';

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
    
    // Get task to save to normalized storage
    let task;
    let taskType: TaskType;
    if (module === 'reading') {
      task = await readingTaskService.getTaskById(taskId);
      taskType = 'reading';
    } else {
      task = await listeningTaskService.getTaskById(taskId);
      taskType = 'listening';
    }
    
    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }
    
    // Save task to normalized storage
    const taskId_normalized = generateTaskId(taskType, task);
    await taskService.saveTask(taskType, task);
    
    // Build MCQ moduleData
    const moduleData: MCQData = {
      type: 'mcq',
      answers: answers,
      questionResults: scoringResult.questionResults,
      score: scoringResult.score,
      totalQuestions: scoringResult.totalQuestions,
    };
    
    // Build evaluation result (minimal for MCQ)
    const evaluation = {
      score: scoringResult.score,
      clbLevel: '', // Not applicable for MCQ
      cecrLevel: '', // Not applicable for MCQ
      feedback: `Score: ${scoringResult.score}/${scoringResult.totalQuestions}`,
      strengths: [],
      weaknesses: [],
      grammarNotes: '',
      vocabularyNotes: '',
    };
    
    // Create result document (don't include _id - let MongoDB generate it)
    const result = {
      sessionId,
      userId,
      resultType: 'mockExam',
      mode: 'full', // MCQ modules are always full
      module: module as 'reading' | 'listening',
      mockExamId,
      title: `Mock Exam - ${module === 'reading' ? 'Reading' : 'Listening'}`,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      taskReferences: {
        taskA: { taskId: taskId_normalized, type: taskType },
      },
      evaluation,
      moduleData,
    };
    
    // Save result with upsert (prevent duplicates)
    const db = await connectDB();
    
    // Ensure sessionId and module are valid
    if (!sessionId || !module) {
      throw new Error(`Invalid parameters: sessionId=${sessionId}, module=${module}`);
    }
    
    const savedResult = await db.collection('results').findOneAndUpdate(
      { sessionId, module },
      { $set: result },
      { upsert: true, returnDocument: 'after' }
    );
    
    if (!savedResult || !savedResult._id) {
      throw new Error('Failed to save result to database');
    }
    
    return {
      success: true,
      resultId: savedResult._id.toString(),
      score: scoringResult.score,
      totalQuestions: scoringResult.totalQuestions,
    };
  },
};
