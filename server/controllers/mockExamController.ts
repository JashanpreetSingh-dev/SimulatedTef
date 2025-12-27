/**
 * Mock Exam Controller - handles mock exam business logic
 */

import { Request, Response } from 'express';
import { connectDB } from '../db/connection';
import { createExamSession, ExamSession } from '../models/examSession';
import { readingTaskService } from '../services/readingTaskService';
import { listeningTaskService } from '../services/listeningTaskService';
import { questionService } from '../services/questionService';
import { subscriptionService } from '../services/subscriptionService';
import { createUsage, getTodayUTC } from '../models/usage';
import { createMockExam } from '../models/MockExam';
import { ObjectId } from 'mongodb';

export const mockExamController = {
  /**
   * List all available mock exams
   */
  async listAvailableMockExams(userId: string): Promise<Array<{
    mockExamId: string;
    name: string;
    description?: string;
    isActive: boolean;
  }>> {
    const db = await connectDB();

    // Get all active mock exams
    const allMockExams = await db.collection('mockExams')
      .find({ isActive: true })
      .sort({ createdAt: 1 })
      .toArray();

    // Get completed mock exam IDs for this user
    const { subscriptionService } = await import('../services/subscriptionService');
    const completedMockExamIds = await subscriptionService.getCompletedMockExamIds(userId);

    // Filter out completed exams
    const availableMockExams = allMockExams.filter((exam: any) =>
      !completedMockExamIds.includes(exam.mockExamId)
    );

    return availableMockExams.map((exam: any) => ({
      mockExamId: exam.mockExamId,
      name: exam.name,
      description: exam.description,
      isActive: exam.isActive,
    }));
  },

  async listAllMockExams(): Promise<Array<{
    mockExamId: string;
    name: string;
    description?: string;
    isActive: boolean;
  }>> {
    const db = await connectDB();
    const mockExams = await db.collection('mockExams')
      .find({})
      .sort({ createdAt: 1 })
      .toArray();
    
    return mockExams.map((exam: any) => ({
      mockExamId: exam.mockExamId,
      name: exam.name,
      description: exam.description,
      isActive: exam.isActive,
    }));
  },

  async getRandomTask(type: string, subtype?: string): Promise<any> {
    switch (type) {
      case 'reading':
        return await readingTaskService.getRandomTask();
      case 'listening':
        return await listeningTaskService.getRandomTask();
      case 'oralExpression':
        // For oral expression, return a dummy task object with an ID
        // Oral expression is handled as live recording, not multiple choice
        const randomId = Math.floor(Math.random() * 1000) + 1;
        return { id: randomId };
      default:
        return null;
    }
  },

  async canStartMockExam(userId: string, mockExamId: string): Promise<boolean> {
    const db = await connectDB();

    // Check if exam exists and is active
    const exam = await db.collection('mockExams').findOne({ mockExamId, isActive: true });
    if (!exam) {
      return false;
    }

    // Check if user has already completed this exam
    const { subscriptionService } = await import('../services/subscriptionService');
    const completedIds = await subscriptionService.getCompletedMockExamIds(userId);
    if (completedIds.includes(mockExamId)) {
      return false;
    }

    // Check if user already has an active mock exam session
    const activeSession = await db.collection('examSessions').findOne({
      userId,
      mockExamId,
      examType: 'mock'
    });

    // If there's an active session, user can resume, but can also start if it's not fully completed
    return !activeSession || activeSession.completedModules?.length !== 2;
  },

  async createMockExamSession(userId: string, mockExamId: string): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }> {
    const db = await connectDB();

    try {
      // Check if session already exists
      const existingSession = await db.collection('examSessions').findOne({
        userId,
        mockExamId,
        examType: 'mock'
      });

      if (existingSession) {
        // Return existing session
        return { success: true, sessionId: existingSession.sessionId };
      }

      // Get random tasks for the mock exam
      const readingTask = await this.getRandomTask('reading');
      const listeningTask = await this.getRandomTask('listening');

      if (!readingTask || !listeningTask) {
        return { success: false, error: 'Failed to get exam tasks' };
      }

      // Generate new session ID
      const sessionId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create new session with tasks
      await db.collection('examSessions').insertOne({
        sessionId,
        userId,
        mockExamId,
        examType: 'mock',
        taskIds: [readingTask.taskId, listeningTask.taskId],
        startedAt: new Date().toISOString(),
        completedModules: [],
        currentModule: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      // Update user's active mock exam
      await db.collection('usage').updateOne(
        { userId },
        {
          $set: {
            activeMockExamId: mockExamId,
            activeMockExamSessionId: sessionId,
            updatedAt: new Date().toISOString()
          }
        },
        { upsert: true }
      );

      return { success: true, sessionId };
    } catch (error) {
      console.error('Error creating mock exam session:', error);
      return { success: false, error: 'Failed to create session' };
    }
  },
  
  /**
   * Select a predefined mock exam
   * Only predefined mock exams with specific sections are supported
   */
  async selectMockExam(userId: string, predefinedMockExamId: string): Promise<{
    mockExamId: string;
    sessionId: string;
    taskIds: string[];
    modules: Array<{ name: string; status: string }>;
  }> {
    const db = await connectDB();
    
    try {
      // Get the predefined mock exam
      const predefinedMock = await db.collection('mockExams').findOne({
        mockExamId: predefinedMockExamId,
        isActive: true
      });

      if (!predefinedMock) {
        throw new Error(`Predefined mock exam ${predefinedMockExamId} not found`);
      }

      const mockExamId = predefinedMock.mockExamId;

      // Get tasks from predefined mock exam - all tasks must be defined
      if (!predefinedMock.oralATaskId || !predefinedMock.oralBTaskId || !predefinedMock.readingTaskId || !predefinedMock.listeningTaskId) {
        throw new Error(`Mock exam ${predefinedMockExamId} is incomplete - all sections must be defined`);
      }

      const oralATask = { id: parseInt(predefinedMock.oralATaskId.replace('oralA_', '')) };
      const oralBTask = { id: parseInt(predefinedMock.oralBTaskId.replace('oralB_', '')) };
      const readingTask = await readingTaskService.getTaskById(predefinedMock.readingTaskId);
      const listeningTask = await listeningTaskService.getTaskById(predefinedMock.listeningTaskId);
      
      if (!readingTask || !listeningTask) {
        throw new Error('No active Reading/Listening tasks available');
      }
      
      // Check if user has already completed this mock exam
      const userUsage = await db.collection('usage').findOne({ userId });
      const completedMockExamIds = (userUsage?.completedMockExamIds as string[]) || [];
      
      if (completedMockExamIds.includes(mockExamId)) {
        // User already completed this mock exam, select different tasks
        // For now, we'll just throw an error - in production, you'd retry with different tasks
        throw new Error('You have already completed this mock exam. Please try again.');
      }
      
      // Check if user is superuser (bypasses credit checks)
      const superUserId = process.env.SUPER_USER_ID;
      const isSuperUser = superUserId ? userId === superUserId : false;

      if (!isSuperUser) {
        // Check credits for non-superusers
        const canStartCheck = await subscriptionService.checkCanStartExam(userId, 'full');
        if (!canStartCheck.canStart) {
          throw new Error(canStartCheck.reason || 'No credits available for mock exam');
        }
      } else {
        console.log(`Superuser ${userId} starting mock exam - bypassing credit checks`);
      }

      // For non-superusers, check credits before starting transaction (but don't consume yet)
      const status = await subscriptionService.getSubscriptionStatus(userId);
      const today = getTodayUTC();

      // Get or create today's usage record (same logic as canStartExam)
      let usage = await db.collection('usage').findOne({ userId, date: today });
      if (!usage) {
        usage = createUsage(userId, today);
        const { _id, ...usageToInsert } = usage;
        await db.collection('usage').insertOne(usageToInsert as any);
      }

      // Check if user can start (similar logic to canStartExam but without consuming)
      if (status.subscriptionType === 'EXPIRED') {
        throw new Error('Subscription has expired');
      }

      const canStart = (status.isActive && status.subscriptionType === 'TRIAL' && usage.fullTestsUsed < status.limits.fullTests) ||
                       (status.packCredits && status.packCredits.fullTests.remaining > 0);

      if (!canStart) {
        throw new Error('No credits available for mock exam');
      }
      
      // Use transaction to create mock exam session and consume credit
      const session = db.client.startSession();
      
      try {
        let sessionId: string;
        
        await session.withTransaction(async () => {
          // Re-check credits within transaction to prevent race conditions
          let currentUsage = await db.collection('usage').findOne(
            { userId, date: today },
            { session }
          );
          
          // Create usage record if it doesn't exist (within transaction)
          if (!currentUsage) {
            const newUsage = createUsage(userId, today);
            const { _id, ...usageToInsert } = newUsage;
            await db.collection('usage').insertOne(usageToInsert as any, { session });
            currentUsage = newUsage;
          }
          
          // Skip credit consumption for superusers
          if (!isSuperUser) {
            const currentSub = await db.collection('subscriptions').findOne(
              { userId },
              { session }
            );

            // Consume credit based on what's available (daily limit first, then pack)
          if (status.isActive && status.subscriptionType === 'TRIAL' && currentUsage.fullTestsUsed < status.limits.fullTests) {
            // Use daily limit
            await db.collection('usage').updateOne(
              { userId, date: today },
              {
                $inc: { fullTestsUsed: 1 },
                $set: { updatedAt: new Date().toISOString() },
              },
              { session }
            );
          } else if (currentSub && currentSub.packFullTestsTotal && (currentSub.packFullTestsUsed || 0) < currentSub.packFullTestsTotal) {
            // Use pack credits
            await db.collection('subscriptions').updateOne(
              { userId },
              {
                $inc: { packFullTestsUsed: 1 },
                $set: { updatedAt: new Date().toISOString() },
              },
              { session }
            );
          } else {
            throw new Error('No credits available');
          }
          } // End of non-superuser credit consumption

          // Create mock exam session
          const examSession = createExamSession(userId, 'mock', {
            mockExamId,
            taskIds: [`oralA_${oralATask.id}`, `oralB_${oralBTask.id}`, readingTask.taskId, listeningTask.taskId],
            currentModule: null,
          });
          
          sessionId = examSession.sessionId;
          
          // Insert session
          const { _id, ...sessionToInsert } = examSession;
          const insertResult = await db.collection('examSessions').insertOne(sessionToInsert as any, { session });
          console.log(`✅ Created exam session: ${sessionId} for mockExamId: ${mockExamId}, userId: ${userId}`);
          
          // Update UserUsage to track active mock exam
          await db.collection('usage').updateOne(
            { userId },
            {
              $set: {
                activeMockExamId: mockExamId,
                activeMockExamSessionId: sessionId,
                updatedAt: new Date().toISOString(),
              },
            },
            { upsert: true, session }
          );
        });
        
        // Verify session was created (outside transaction)
        const verifySession = await db.collection('examSessions').findOne({ userId, mockExamId, examType: 'mock' });
        if (!verifySession) {
          console.error(`❌ Warning: Session not found after creation for mockExamId: ${mockExamId}`);
        } else {
          console.log(`✅ Verified session exists: ${verifySession.sessionId}`);
        }
        
        return {
          mockExamId,
          sessionId: sessionId!,
          taskIds: [`oralA_${oralATask.id}`, `oralB_${oralBTask.id}`, readingTask.taskId, listeningTask.taskId],
          modules: [
            { name: 'oralExpression', status: 'available' },
            { name: 'reading', status: 'available' },
            { name: 'listening', status: 'available' },
          ],
        };
      } catch (transactionError: any) {
        console.error('Transaction error in selectMockExam:', transactionError);
        throw transactionError;
      } finally {
        await session.endSession();
      }
    } catch (error: any) {
      console.error('Error in selectMockExam:', error);
      throw error;
    }
  },
  
  /**
   * Get mock exam status
   */
  async getMockExamStatus(userId: string, mockExamId: string): Promise<{
    mockExamId: string;
    completedModules: string[];
    availableModules: string[];
    sessionId: string;
  } | null> {
    const db = await connectDB();
    
    const session = await db.collection('examSessions').findOne({
      userId,
      mockExamId,
      examType: 'mock',
    });
    
    if (!session) {
      return null;
    }
    
    const completedModules = (session.completedModules as string[]) || [];
    const allModules = ['reading', 'listening'];
    const availableModules = allModules.filter(m => !completedModules.includes(m));
    
    return {
      mockExamId,
      completedModules,
      availableModules,
      sessionId: session.sessionId,
    };
  },
  
  /**
   * Get modules for mock exam with completion status
   */
  async getMockExamModules(userId: string, mockExamId: string): Promise<{
    modules: Array<{ name: string; status: string; resultId?: string }>;
  } | null> {
    const db = await connectDB();
    
    const session = await db.collection('examSessions').findOne({
      userId,
      mockExamId,
      examType: 'mock',
    });
    
    if (!session) {
      return null;
    }
    
    const completedModules = (session.completedModules as string[]) || [];
    const allModules = ['reading', 'listening'];
    
    // Get result IDs for completed modules
    const results = await db.collection('results').find({
      userId,
      mockExamId,
      module: { $in: completedModules },
    }).toArray();
    
    const resultMap = new Map<string, string>();
    results.forEach((r: any) => {
      if (r.module && r._id) {
        resultMap.set(r.module, r._id.toString());
      }
    });
    
    const modules = allModules.map(name => ({
      name,
      status: completedModules.includes(name) ? 'completed' : 'available',
      resultId: resultMap.get(name),
    }));
    
    return { modules };
  },
  
  /**
   * Start a specific module within mock exam
   */
  async startModule(
    userId: string,
    mockExamId: string,
    module: 'reading' | 'listening'
  ): Promise<{
    sessionId: string;
    task?: any;
    questions?: any[];
  } | null> {
    const db = await connectDB();
    
    const examSession = await db.collection('examSessions').findOne({
      userId,
      mockExamId,
      examType: 'mock',
    });
    
    if (!examSession) {
      // Debug: Check if session exists with different criteria
      const anySession = await db.collection('examSessions').findOne({ userId, examType: 'mock' });
      console.error(`Mock exam session not found for userId: ${userId}, mockExamId: ${mockExamId}`);
      if (anySession) {
        console.error(`Found other mock exam session with mockExamId: ${anySession.mockExamId}`);
      } else {
        console.error(`No mock exam sessions found for userId: ${userId}`);
      }
      return null;
    }
    
    // Update current module
    await db.collection('examSessions').updateOne(
      { userId, mockExamId },
      {
        $set: {
          currentModule: module,
          updatedAt: new Date().toISOString(),
        },
      }
    );
    
    // For Reading/Listening, return task and questions
    if (module === 'reading' || module === 'listening') {
      const taskIds = examSession.taskIds as string[];
      let taskId: string;
      
      if (module === 'reading') {
        taskId = taskIds.find(id => id.startsWith('reading_')) || '';
      } else {
        taskId = taskIds.find(id => id.startsWith('listening_')) || '';
      }
      
      if (!taskId) {
        throw new Error(`Task ID not found for ${module} module`);
      }
      
      let task;
      if (module === 'reading') {
        task = await readingTaskService.getTaskById(taskId);
      } else {
        task = await listeningTaskService.getTaskById(taskId);
      }
      
      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }
      
      const questions = await questionService.getQuestionsByTaskId(taskId);
      
      return {
        sessionId: examSession.sessionId,
        task,
        questions,
      };
    }
    
    return null;
  },
  
  /**
   * Complete a module and save result
   */
  async completeModule(
    userId: string,
    mockExamId: string,
    module: 'reading' | 'listening',
    result: any
  ): Promise<{
    success: boolean;
    allModulesCompleted: boolean;
  } | null> {
    const db = await connectDB();
    
    const examSession = await db.collection('examSessions').findOne({
      userId,
      mockExamId,
      examType: 'mock',
    });
    
    if (!examSession) {
      return null;
    }
    
    const session = db.client.startSession();
    
    try {
      let allModulesCompleted = false;
      
      await session.withTransaction(async () => {
        // Mark module as completed
        await db.collection('examSessions').updateOne(
          { userId, mockExamId },
          {
            $addToSet: { completedModules: module },
            $set: {
              currentModule: null,
              updatedAt: new Date().toISOString(),
            },
          },
          { session }
        );
        
        // Check if all modules are completed
        const updatedSession = await db.collection('examSessions').findOne(
          { userId, mockExamId },
          { session }
        );
        
        const completedModules = (updatedSession?.completedModules as string[]) || [];
        allModulesCompleted = completedModules.length === 2;
        
        if (allModulesCompleted) {
          // Mark mock exam as fully completed
          await db.collection('examSessions').updateOne(
            { userId, mockExamId },
            {
              $set: {
                completed: true,
                updatedAt: new Date().toISOString(),
              },
            },
            { session }
          );
          
          // Add to completedMockExamIds in UserUsage
          await db.collection('usage').updateOne(
            { userId },
            {
              $addToSet: { completedMockExamIds: mockExamId },
              $unset: {
                activeMockExamId: '',
                activeMockExamSessionId: '',
              },
              $set: {
                updatedAt: new Date().toISOString(),
              },
            },
            { upsert: true, session }
          );
        }
      });
      
      return {
        success: true,
        allModulesCompleted,
      };
    } finally {
      await session.endSession();
    }
  },
  
  /**
   * Resume an incomplete mock exam
   */
  async resumeMockExam(userId: string, mockExamId: string): Promise<{
    mockExamId: string;
    sessionId: string;
    completedModules: string[];
    availableModules: string[];
  } | null> {
    return this.getMockExamStatus(userId, mockExamId);
  },
};
