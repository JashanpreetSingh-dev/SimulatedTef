/**
 * Task API routes - for Reading/Listening tasks and normalized task storage
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { taskSelectionLimiter } from '../middleware/rateLimiter';
import { Request, Response } from 'express';
import { connectDB } from '../db/connection';
import { readingTaskService } from '../services/readingTaskService';
import { listeningTaskService } from '../services/listeningTaskService';
import { questionService } from '../services/questionService';
import * as taskService from '../services/taskService';
import { TaskType } from '../../types/task';

const router = Router();

// GET /api/tasks/random/:type - Get one random task by type
// Rate limit: 10 requests per minute
router.get('/random/:type', requireAuth, taskSelectionLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { type } = req.params;
  
  if (type !== 'reading' && type !== 'listening') {
    return res.status(400).json({ error: 'Invalid task type. Must be reading or listening' });
  }
  
  let task;
  if (type === 'reading') {
    task = await readingTaskService.getRandomTask();
  } else {
    task = await listeningTaskService.getRandomTask();
  }
  
  if (!task) {
    return res.status(404).json({ error: 'No active tasks available' });
  }
  
  res.json(task);
}));

// GET /api/questions/:taskId - Get all questions for a Reading/Listening task
// Rate limit: 10 requests per minute (task selection)
router.get('/questions/:taskId', requireAuth, taskSelectionLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  
  const questions = await questionService.getQuestionsByTaskId(taskId);
  
  if (questions.length === 0) {
    return res.status(404).json({ error: 'No questions found for this task' });
  }
  
  // Validate question count
  if (questions.length !== 40) {
    console.warn(`Warning: Task ${taskId} has ${questions.length} questions, expected 40`);
  }
  
  res.json({ questions, count: questions.length });
}));

// GET /api/tasks/:taskId/with-questions - Get Reading/Listening task with questions populated
// Rate limit: 10 requests per minute (task selection)
router.get('/:taskId/with-questions', requireAuth, taskSelectionLimiter, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const db = await connectDB();
  
  // Try Reading tasks first
  let task = await readingTaskService.getTaskById(taskId);
  let taskType = 'reading';
  
  // If not found, try Listening tasks
  if (!task) {
    task = await listeningTaskService.getTaskById(taskId);
    taskType = 'listening';
  }
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  // Fetch questions
  const questions = await questionService.getQuestionsByTaskId(taskId);
  
  if (questions.length === 0) {
    return res.status(404).json({ error: 'No questions found for this task' });
  }
  
  // For listening tasks, also fetch AudioItems
  let audioItems = null;
  if (taskType === 'listening') {
    const audioItemsCollection = db.collection('audioItems');
    const items = await audioItemsCollection
      .find({ taskId })
      .sort({ sectionId: 1, audioId: 1 })
      .toArray();
    
    // Return only metadata (not binary data) - client will fetch audio via /api/audio/:audioId
    audioItems = items.map((item: any) => ({
      audioId: item.audioId,
      sectionId: item.sectionId,
      repeatable: item.repeatable,
      audioScript: item.audioScript,
      mimeType: item.mimeType,
      hasAudio: !!(item.s3Key || item.audioData), // Check both S3 and legacy storage
    }));
  }
  
  res.json({
    task,
    questions,
    count: questions.length,
    audioItems, // Only for listening tasks
  });
}));

// POST /api/exam/setup-mock - Batch endpoint: Get all 4 tasks + questions for mock exam setup
router.post('/setup-mock', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Import services
  const { getRandomSectionATask, getRandomSectionBTask } = await import('../../services/tasks');
  
  // Get tasks
  const oralATask = getRandomSectionATask();
  const oralBTask = getRandomSectionBTask();
  const readingTask = await readingTaskService.getRandomTask();
  const listeningTask = await listeningTaskService.getRandomTask();
  
  if (!readingTask || !listeningTask) {
    return res.status(404).json({ error: 'No active Reading/Listening tasks available' });
  }
  
  // Fetch questions for Reading and Listening tasks
  const readingQuestions = await questionService.getQuestionsByTaskId(readingTask.taskId);
  const listeningQuestions = await questionService.getQuestionsByTaskId(listeningTask.taskId);
  
  if (readingQuestions.length !== 40 || listeningQuestions.length !== 40) {
    return res.status(500).json({ error: 'Invalid question count for Reading/Listening tasks' });
  }
  
  res.json({
    oralA: oralATask,
    oralB: oralBTask,
    reading: {
      task: readingTask,
      questions: readingQuestions,
    },
    listening: {
      task: listeningTask,
      questions: listeningQuestions,
    },
  });
}));

// ============================================
// Normalized Task Storage Endpoints
// ============================================

// POST /api/tasks/normalized - Create or update a normalized task
router.post('/normalized', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { type, taskData } = req.body;
  
  if (!type || !taskData) {
    return res.status(400).json({ error: 'type and taskData are required' });
  }
  
  const validTypes: TaskType[] = ['oralA', 'oralB', 'writtenA', 'writtenB', 'reading', 'listening'];
  if (!validTypes.includes(type)) {
    return res.status(400).json({ error: `Invalid type. Must be one of: ${validTypes.join(', ')}` });
  }
  
  const task = await taskService.saveTask(type, taskData);
  res.status(201).json(task);
}));

// GET /api/tasks/normalized/:taskId - Get normalized task by ID
router.get('/normalized/:taskId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;
  const task = await taskService.getTask(taskId);
  
  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  
  res.json(task);
}));

// POST /api/tasks/normalized/batch - Get multiple tasks by IDs
router.post('/normalized/batch', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { taskIds } = req.body;
  
  if (!Array.isArray(taskIds)) {
    return res.status(400).json({ error: 'taskIds must be an array' });
  }
  
  const tasks = await taskService.getTasks(taskIds);
  res.json({ tasks });
}));

// GET /api/tasks/normalized - List normalized tasks with optional filtering
router.get('/normalized', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { type, isActive } = req.query;
  
  const filters: any = {};
  if (type) {
    filters.type = type;
  }
  if (isActive !== undefined) {
    filters.isActive = isActive === 'true';
  }
  
  const tasks = await taskService.listTasks(filters);
  res.json({ tasks });
}));

export default router;
