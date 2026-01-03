/**
 * Assignment MCQ Controller - handles MCQ submission and scoring for assignments
 */

import { connectDB } from '../db/connection';
import { calculateMCQScore, validateAnswers } from '../services/mcqScoring';
import { questionService } from '../services/questionService';
import * as taskService from '../services/taskService';
import { generateTaskId, TaskType } from '../../types/task';
import { SavedResult, MCQData } from '../../types';
import { readingTaskService } from '../services/readingTaskService';
import { listeningTaskService } from '../services/listeningTaskService';
import { assignmentService } from '../services/assignmentService';

export const assignmentMCQController = {
  /**
   * Submit MCQ answers for Reading/Listening assignments
   */
  async submitAssignmentMCQ(
    userId: string,
    taskId: string,
    answers: number[],
    module: 'reading' | 'listening',
    assignmentId: string,
    sessionId: string
  ): Promise<{
    success: boolean;
    resultId: string;
    score: number;
    totalQuestions: number;
  }> {
    // Verify assignment exists and is published
    const assignment = await assignmentService.getAssignmentById(assignmentId);
    if (!assignment) {
      throw new Error(`Assignment ${assignmentId} not found`);
    }
    
    if (assignment.status !== 'published') {
      throw new Error('Assignment is not published');
    }
    
    // Get questions
    const questions = await questionService.getQuestionsByTaskId(taskId);
    
    if (questions.length === 0) {
      throw new Error(`No questions found for task ${taskId}`);
    }
    
    // Validate answers - use actual number of questions, not hardcoded 40
    if (!validateAnswers(answers, questions.length)) {
      throw new Error(`Invalid answers format. Expected ${questions.length} answers, got ${answers.length}. Answers must be numbers between 0-3 or -1 (not answered)`);
    }
    
    if (answers.length !== questions.length) {
      throw new Error(`Expected ${questions.length} answers, got ${answers.length}`);
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
    
    // Create result document with assignment context
    const result: SavedResult = {
      _id: undefined, // Will be set by MongoDB
      userId,
      resultType: 'assignment',
      mode: 'full', // MCQ modules are always full
      module: module as 'reading' | 'listening',
      assignmentId, // Store assignment ID instead of mockExamId
      title: `${assignment.title} - ${module === 'reading' ? 'Reading' : 'Listening'}`,
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
    
    // Ensure all query fields are defined
    if (!sessionId || !module || !assignmentId) {
      throw new Error(`Missing required fields: sessionId=${sessionId}, module=${module}, assignmentId=${assignmentId}`);
    }
    
    // Remove _id from result to let MongoDB generate it (or use existing one)
    const { _id, ...resultWithoutId } = result;
    
    // Use updateOne with upsert, then fetch the document
    const query = { sessionId, module, assignmentId };
    await db.collection('results').updateOne(
      query,
      {
        $set: resultWithoutId,
      },
      {
        upsert: true,
      }
    );
    
    // Fetch the saved document
    const resultDocument = await db.collection('results').findOne(query);
    
    if (!resultDocument || !resultDocument._id) {
      throw new Error('Failed to save result to database: document was not created or has no _id');
    }
    
    return {
      success: true,
      resultId: resultDocument._id.toString(),
      score: scoringResult.score,
      totalQuestions: scoringResult.totalQuestions,
    };
  },
};
