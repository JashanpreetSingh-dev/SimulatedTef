/**
 * Practice MCQ Controller - handles MCQ submission and scoring for standalone practice
 * (no assignment, no mock exam — unlimited attempts, each attempt is a separate document)
 */

import { connectDB } from '../db/connection';
import { calculateMCQScore, validateAnswers } from '../services/mcqScoring';
import { questionService } from '../services/questionService';
import * as taskService from '../services/taskService';
import { generateTaskId, TaskType } from '../../types/task';
import { SavedResult, MCQData } from '../../types';
import { readingTaskService } from '../services/readingTaskService';
import { listeningTaskService } from '../services/listeningTaskService';

export const practiceMCQController = {
  async submitPracticeMCQ(
    userId: string,
    taskId: string,
    type: 'reading' | 'listening',
    answers: number[]
  ): Promise<{
    success: boolean;
    resultId: string;
    score: number;
    totalQuestions: number;
    questionResults: Array<{ questionId: string; userAnswer: number; isCorrect: boolean }>;
  }> {
    const questions = await questionService.getQuestionsByTaskId(taskId);

    if (questions.length === 0) {
      throw new Error(`No questions found for task ${taskId}`);
    }

    if (!validateAnswers(answers, questions.length)) {
      throw new Error(
        `Invalid answers format. Expected at most ${questions.length} answers (values 0-3 or -1), got ${answers.length}`
      );
    }

    const scoringResult = calculateMCQScore({ taskId, questions, answers });

    const taskType: TaskType = type;
    let task;

    if (type === 'reading') {
      task = await readingTaskService.getTaskById(taskId);
    } else {
      task = await listeningTaskService.getTaskById(taskId);
    }

    if (!task) {
      throw new Error(`Task ${taskId} not found`);
    }

    const taskId_normalized = generateTaskId(taskType, task);
    await taskService.saveTask(taskType, task);

    const moduleData: MCQData = {
      type: 'mcq',
      answers: scoringResult.answers,
      questionResults: scoringResult.questionResults,
      score: scoringResult.score,
      totalQuestions: scoringResult.totalQuestions,
    };

    const evaluation = {
      score: scoringResult.score,
      clbLevel: '',
      cecrLevel: '',
      feedback: `Score: ${scoringResult.score}/${scoringResult.totalQuestions}`,
      strengths: [] as string[],
      weaknesses: [] as string[],
      grammarNotes: '',
      vocabularyNotes: '',
    };

    const now = new Date().toISOString();

    const result: SavedResult = {
      _id: undefined,
      userId,
      resultType: 'practice',
      mode: 'full',
      module: type,
      title: `${type === 'reading' ? 'Reading' : 'Listening'} Practice`,
      timestamp: Date.now(),
      createdAt: now,
      updatedAt: now,
      taskReferences: {
        taskA: { taskId: taskId_normalized, type: taskType },
      },
      evaluation,
      moduleData,
    };

    const { _id, ...resultWithoutId } = result;
    const db = await connectDB();
    const insertResult = await db.collection('results').insertOne(resultWithoutId);

    if (!insertResult.insertedId) {
      throw new Error('Failed to save practice result to database');
    }

    return {
      success: true,
      resultId: insertResult.insertedId.toString(),
      score: scoringResult.score,
      totalQuestions: scoringResult.totalQuestions,
      questionResults: scoringResult.questionResults,
    };
  },
};
