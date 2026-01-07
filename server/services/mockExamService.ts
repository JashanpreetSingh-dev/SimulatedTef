/**
 * Mock Exam Service - handles mock exam business logic
 */

import { connectDB } from "../db/connection";
import { createExamSession } from "../models/examSession";
import { readingTaskService } from "./readingTaskService";
import { listeningTaskService } from "./listeningTaskService";
import { writtenTaskService } from "./writtenTaskService";
import { questionService } from "./questionService";
import { createUsage, getTodayUTC } from "../models/usage";
import { ObjectId } from "mongodb";
import {
  getTaskById,
  getRandomSectionATask,
  getRandomSectionBTask,
} from "../../services/tasks";

export const mockExamService = {
  /**
   * List all available mock exams
   */
  async listAvailableMockExams(userId: string): Promise<
    Array<{
      mockExamId: string;
      name: string;
      description?: string;
      isActive: boolean;
    }>
  > {
    const db = await connectDB();

    // Get all active mock exams
    const allMockExams = await db
      .collection("mockExams")
      .find({ isActive: true })
      .sort({ createdAt: 1 })
      .toArray();

    // Get completed mock exam IDs for this user - only those with all 4 modules completed
    const ALL_MODULES = ['oralExpression', 'writtenExpression', 'reading', 'listening'];
    
    const completedMockExamAggregation = await db
      .collection("results")
      .aggregate([
        { $match: { userId, mockExamId: { $exists: true, $ne: null } } },
        { 
          $group: { 
            _id: '$mockExamId', 
            completedModules: { $addToSet: '$module' } 
          } 
        },
        { 
          $match: { 
            // Only include mock exams where all 4 modules are completed
            $expr: { 
              $setEquals: ['$completedModules', ALL_MODULES] 
            } 
          } 
        }
      ])
      .toArray();
    
    const completedMockExamIds = completedMockExamAggregation.map((r: any) => r._id);

    // Filter out completed exams
    const availableMockExams = allMockExams.filter(
      (exam: any) => !completedMockExamIds.includes(exam.mockExamId)
    );

    return availableMockExams.map((exam: any) => ({
      mockExamId: exam.mockExamId,
      name: exam.name,
      description: exam.description,
      isActive: exam.isActive,
    }));
  },

  async listAllMockExams(): Promise<
    Array<{
      mockExamId: string;
      name: string;
      description?: string;
      isActive: boolean;
    }>
  > {
    const db = await connectDB();
    const mockExams = await db
      .collection("mockExams")
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
      case "reading":
        return await readingTaskService.getRandomTask();
      case "listening":
        return await listeningTaskService.getRandomTask();
      case "oralExpression":
        // For oral expression, return a dummy task object with an ID
        // Oral expression is handled as live recording, not multiple choice
        const randomId = Math.floor(Math.random() * 1000) + 1;
        return { id: randomId };
      case "writtenExpression":
        // For written expression, return both Section A and Section B tasks
        return await writtenTaskService.getRandomTasks();
      default:
        return null;
    }
  },

  async canStartMockExam(userId: string, mockExamId: string): Promise<boolean> {
    const db = await connectDB();

    // Check if exam exists and is active
    const exam = await db
      .collection("mockExams")
      .findOne({ mockExamId, isActive: true });
    if (!exam) {
      return false;
    }

    // Check if user has already completed this exam
    const completedResult = await db
      .collection("examResults")
      .findOne({ userId, mockExamId });
    if (completedResult) {
      return false;
    }

    // Check if user already has an active mock exam session
    const activeSession = await db.collection("examSessions").findOne({
      userId,
      mockExamId,
      examType: "mock",
    });

    // If there's an active session, user can resume, but can also start if it's not fully completed
    return !activeSession || activeSession.completedModules?.length !== 3;
  },

  async createMockExamSession(
    userId: string,
    mockExamId: string
  ): Promise<{
    success: boolean;
    sessionId?: string;
    error?: string;
  }> {
    const db = await connectDB();

    try {
      // Check if session already exists
      const existingSession = await db.collection("examSessions").findOne({
        userId,
        mockExamId,
        examType: "mock",
      });

      if (existingSession) {
        // Return existing session
        return { success: true, sessionId: existingSession.sessionId };
      }

      // Get random tasks for the mock exam
      const readingTask = await mockExamService.getRandomTask("reading");
      const listeningTask = await mockExamService.getRandomTask("listening");

      if (!readingTask || !listeningTask) {
        return { success: false, error: "Failed to get exam tasks" };
      }

      // Generate new session ID
      const sessionId = `mock_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      // Create new session with tasks
      await db.collection("examSessions").insertOne({
        sessionId,
        userId,
        mockExamId,
        examType: "mock",
        taskIds: [readingTask.taskId, listeningTask.taskId],
        startedAt: new Date().toISOString(),
        completedModules: [],
        currentModule: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      // Update user's active mock exam
      await db.collection("usage").updateOne(
        { userId },
        {
          $set: {
            activeMockExamId: mockExamId,
            activeMockExamSessionId: sessionId,
            updatedAt: new Date().toISOString(),
          },
        },
        { upsert: true }
      );

      return { success: true, sessionId };
    } catch (error) {
      console.error("Error creating mock exam session:", error);
      return { success: false, error: "Failed to create session" };
    }
  },

  /**
   * Select a predefined mock exam
   * Only predefined mock exams with specific sections are supported
   */
  async selectMockExam(
    userId: string,
    predefinedMockExamId: string
  ): Promise<{
    mockExamId: string;
    sessionId: string;
    taskIds: string[];
    modules: Array<{ name: string; status: string }>;
  }> {
    const db = await connectDB();

    try {
      // Get the predefined mock exam
      const predefinedMock = await db.collection("mockExams").findOne({
        mockExamId: predefinedMockExamId,
        isActive: true,
      });

      if (!predefinedMock) {
        throw new Error(
          `Predefined mock exam ${predefinedMockExamId} not found`
        );
      }

      const mockExamId = predefinedMock.mockExamId;

      // Get tasks from predefined mock exam - all tasks must be defined
      if (
        !predefinedMock.oralATaskId ||
        !predefinedMock.oralBTaskId ||
        !predefinedMock.readingTaskId ||
        !predefinedMock.listeningTaskId ||
        !predefinedMock.writtenATaskId ||
        !predefinedMock.writtenBTaskId
      ) {
        throw new Error(
          `Mock exam ${predefinedMockExamId} is incomplete - all sections must be defined`
        );
      }

      const oralATask = {
        id: parseInt(predefinedMock.oralATaskId.replace("oralA_", "")),
      };
      const oralBTask = {
        id: parseInt(predefinedMock.oralBTaskId.replace("oralB_", "")),
      };
      const readingTask = await readingTaskService.getTaskById(
        predefinedMock.readingTaskId
      );
      const listeningTask = await listeningTaskService.getTaskById(
        predefinedMock.listeningTaskId
      );
      const writtenATask = await writtenTaskService.getTaskById(
        predefinedMock.writtenATaskId
      );
      const writtenBTask = await writtenTaskService.getTaskById(
        predefinedMock.writtenBTaskId
      );

      if (!readingTask || !listeningTask || !writtenATask || !writtenBTask) {
        throw new Error("No active tasks available for all modules");
      }

      // Check if user has already completed this mock exam
      const userUsage = await db.collection("usage").findOne({ userId });
      const completedMockExamIds =
        (userUsage?.completedMockExamIds as string[]) || [];

      if (completedMockExamIds.includes(mockExamId)) {
        // User already completed this mock exam, select different tasks
        // For now, we'll just throw an error - in production, you'd retry with different tasks
        throw new Error(
          "You have already completed this mock exam. Please try again."
        );
      }

      // B2B mode - track usage without limits
      const today = getTodayUTC();

      // Get or create today's usage record for tracking
      let usage = await db.collection("usage").findOne({ userId, date: today });
      if (!usage) {
        const newUsage = createUsage(userId, today);
        const { _id, ...usageToInsert } = newUsage;
        await db.collection("usage").insertOne(usageToInsert as any);
      }

      // Use transaction to create mock exam session and track usage
      const session = db.client.startSession();

      try {
        let sessionId: string;

        await session.withTransaction(async () => {
          // Track usage for B2B analytics (no limits enforced)
          await db.collection("usage").updateOne(
            { userId, date: today },
            {
              $inc: { fullTestsUsed: 1 },
              $set: { updatedAt: new Date().toISOString() },
            },
            { session, upsert: true }
          );

          // Create mock exam session
          const examSession = createExamSession(userId, "mock", {
            mockExamId,
            taskIds: [
              `oralA_${oralATask.id}`,
              `oralB_${oralBTask.id}`,
              readingTask.taskId,
              listeningTask.taskId,
              writtenATask.id,
              writtenBTask.id,
            ],
            currentModule: null,
          });

          sessionId = examSession.sessionId;

          // Insert session
          const { _id, ...sessionToInsert } = examSession;
          const insertResult = await db
            .collection("examSessions")
            .insertOne(sessionToInsert as any, { session });
          console.log(
            `Created exam session: ${sessionId} for mockExamId: ${mockExamId}, userId: ${userId}`
          );

          // Update UserUsage to track active mock exam
          await db.collection("usage").updateOne(
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
        const verifySession = await db
          .collection("examSessions")
          .findOne({ userId, mockExamId, examType: "mock" });
        if (!verifySession) {
          console.error(
            `Warning: Session not found after creation for mockExamId: ${mockExamId}`
          );
        } else {
          console.log(`Verified session exists: ${verifySession.sessionId}`);
        }

        return {
          mockExamId,
          sessionId: sessionId!,
          taskIds: [
            `oralA_${oralATask.id}`,
            `oralB_${oralBTask.id}`,
            readingTask.taskId,
            listeningTask.taskId,
            writtenATask.id,
            writtenBTask.id,
          ],
          modules: [
            { name: "oralExpression", status: "available" },
            { name: "reading", status: "available" },
            { name: "listening", status: "available" },
            { name: "writtenExpression", status: "available" },
          ],
        };
      } catch (transactionError: any) {
        console.error("Transaction error in selectMockExam:", transactionError);
        throw transactionError;
      } finally {
        await session.endSession();
      }
    } catch (error: any) {
      console.error("Error in selectMockExam:", error);
      throw error;
    }
  },

  /**
   * Get mock exam status
   */
  async getMockExamStatus(
    userId: string,
    mockExamId: string
  ): Promise<{
    mockExamId: string;
    completedModules: string[];
    availableModules: string[];
    sessionId?: string;
  } | null> {
    const db = await connectDB();

    const session = await db.collection("examSessions").findOne({
      userId,
      mockExamId,
      examType: "mock",
    });

    if (!session) {
      // If no session exists, check if all modules are completed by looking at results
      const results = await db
        .collection("results")
        .find({
          userId,
          mockExamId,
          module: { $in: ["oralExpression", "reading", "listening", "writtenExpression"] },
          isLoading: { $ne: true }, // Exclude loading results
        })
        .toArray();

      const completedModulesFromResults = [
        ...new Set(results.map((r: any) => r.module)),
      ];

      // If we have results for all 4 modules, consider it completed
      if (completedModulesFromResults.length === 4) {
        return {
          mockExamId,
          completedModules: completedModulesFromResults,
          availableModules: [],
        };
      }

      // Otherwise, no session and not all modules completed - return null
      return null;
    }

    const completedModules = (session.completedModules as string[]) || [];
    const allModules = ["oralExpression", "reading", "listening", "writtenExpression"];
    const availableModules = allModules.filter(
      (m) => !completedModules.includes(m)
    );

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
  async getMockExamModules(
    userId: string,
    mockExamId: string
  ): Promise<{
    modules: Array<{
      name: string;
      status: string;
      resultId?: string;
      isLoading?: boolean;
      score?: number;
      clbLevel?: string;
      scoreOutOf?: number;
    }>;
  } | null> {
    const db = await connectDB();

    const session = await db.collection("examSessions").findOne({
      userId,
      mockExamId,
      examType: "mock",
    });

    let completedModules: string[] = [];

    const allModules = ["oralExpression", "reading", "listening", "writtenExpression"];

    // Get all results for this mock exam in a single query
    const results = await db
      .collection("results")
      .find({
        userId,
        mockExamId,
        module: { $in: allModules },
      })
      .toArray();

    if (session) {
      // If session exists, use completedModules from session (source of truth)
      completedModules = (session.completedModules as string[]) || [];
    } else {
      // If no session, determine completed modules from results (excluding loading)
      const nonLoadingResults = results.filter(
        (r: any) => r.isLoading !== true
      );
      completedModules = [
        ...new Set(nonLoadingResults.map((r: any) => r.module)),
      ];

      // If no results found, return null
      if (completedModules.length === 0) {
        return null;
      }
    }

    const resultMap = new Map<
      string,
      {
        resultId: string;
        isLoading?: boolean;
        score?: number;
        clbLevel?: string;
        scoreOutOf?: number;
      }
    >();

    results.forEach((r: any) => {
      if (r.module && r._id) {
        const moduleType = r.module;
        let score: number | undefined;
        let clbLevel: string | undefined;
        let scoreOutOf: number | undefined;

        if (moduleType === "reading" || moduleType === "listening") {
          // For MCQ results, the score is stored directly in the result document
          // Check multiple possible locations for the score
          if (typeof r.score === "number") {
            score = r.score;
          } else if (
            moduleType === "reading" &&
            r.readingResult &&
            typeof r.readingResult.score === "number"
          ) {
            score = r.readingResult.score;
          } else if (
            moduleType === "listening" &&
            r.listeningResult &&
            typeof r.listeningResult.score === "number"
          ) {
            score = r.listeningResult.score;
          }
          scoreOutOf = 40;
        } else if (moduleType === "oralExpression") {
          // For oral expression, score is 0-699 and has CLB level
          if (typeof r.score === "number") {
            score = r.score;
          }
          if (r.clbLevel) {
            clbLevel = r.clbLevel;
          }
          scoreOutOf = 699;
        }

        resultMap.set(r.module, {
          resultId: r._id.toString(),
          isLoading: r.isLoading === true,
          score,
          clbLevel,
          scoreOutOf,
        });
      }
    });

    const modules = allModules.map((name) => {
      const resultInfo = resultMap.get(name);
      return {
        name,
        status: completedModules.includes(name) ? "completed" : "available",
        resultId: resultInfo?.resultId,
        isLoading: resultInfo?.isLoading,
        score: resultInfo?.score,
        clbLevel: resultInfo?.clbLevel,
        scoreOutOf: resultInfo?.scoreOutOf,
      };
    });

    return { modules };
  },

  /**
   * Start a specific module within mock exam
   */
  async startModule(
    userId: string,
    mockExamId: string,
    module: "oralExpression" | "reading" | "listening" | "writtenExpression"
  ): Promise<{
    sessionId: string;
    task?: any;
    tasks?: { taskA: any; taskB: any };
    questions?: any[];
    audioItems?: any[];
    title?: string;
    scenario?: {
      officialTasks: { partA: any; partB: any };
      mode: "full";
      title: string;
      mockExamId?: string;
    };
  } | null> {
    const db = await connectDB();

    const examSession = await db.collection("examSessions").findOne({
      userId,
      mockExamId,
      examType: "mock",
    });

    if (!examSession) {
      // Debug: Check if session exists with different criteria
      const anySession = await db
        .collection("examSessions")
        .findOne({ userId, examType: "mock" });
      console.error(
        `Mock exam session not found for userId: ${userId}, mockExamId: ${mockExamId}`
      );
      if (anySession) {
        console.error(
          `Found other mock exam session with mockExamId: ${anySession.mockExamId}`
        );
      } else {
        console.error(`No mock exam sessions found for userId: ${userId}`);
      }
      return null;
    }

    // Update current module
    await db.collection("examSessions").updateOne(
      { userId, mockExamId },
      {
        $set: {
          currentModule: module,
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // For Reading/Listening, return task and questions
    if (module === "reading" || module === "listening") {
      const taskIds = examSession.taskIds as string[];
      let taskId: string;

      if (module === "reading") {
        taskId = taskIds.find((id) => id.startsWith("reading_")) || "";
      } else {
        taskId = taskIds.find((id) => id.startsWith("listening_")) || "";
      }

      if (!taskId) {
        throw new Error(`Task ID not found for ${module} module`);
      }

      let task;
      if (module === "reading") {
        task = await readingTaskService.getTaskById(taskId);
      } else {
        task = await listeningTaskService.getTaskById(taskId);
      }

      if (!task) {
        throw new Error(`Task not found: ${taskId}`);
      }

      const questions = await questionService.getQuestionsByTaskId(taskId);

      // For listening tasks, also fetch AudioItems
      let audioItems = null;
      if (module === 'listening') {
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
          hasAudio: !!(item.s3Key || item.audioData), // Check both S3 and legacy MongoDB storage
        }));
      }

      return {
        sessionId: examSession.sessionId,
        task,
        questions,
        audioItems, // Only for listening tasks
      };
    }

    // For Written Expression, return both Section A and Section B tasks
    if (module === "writtenExpression") {
      const taskIds = examSession.taskIds as string[];
      const writtenATaskId = taskIds.find((id) => id.startsWith("written_A")) || "";
      const writtenBTaskId = taskIds.find((id) => id.startsWith("written_B")) || "";

      let taskA: any;
      let taskB: any;

      // If written task IDs are stored in session, use them
      if (writtenATaskId && writtenBTaskId) {
        taskA = await writtenTaskService.getTaskById(writtenATaskId);
        taskB = await writtenTaskService.getTaskById(writtenBTaskId);

        if (!taskA || !taskB) {
          throw new Error(
            `Written tasks not found: taskA=${writtenATaskId}, taskB=${writtenBTaskId}`
          );
        }
      } else {
        // Generate random tasks on the fly
        const randomTasks = await writtenTaskService.getRandomTasks();
        if (!randomTasks) {
          throw new Error("Failed to get random written expression tasks");
        }
        taskA = randomTasks.taskA;
        taskB = randomTasks.taskB;

        // Update the session to store these task IDs for consistency
        const updatedTaskIds = [
          ...taskIds,
          taskA.id,
          taskB.id,
        ];
        await db.collection("examSessions").updateOne(
          { userId, mockExamId },
          {
            $set: {
              taskIds: updatedTaskIds,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }

      // Get mock exam name for title
      const mockExam = await db.collection("mockExams").findOne({ mockExamId });
      const examName = mockExam?.name || "Mock Exam";

      return {
        sessionId: examSession.sessionId,
        tasks: {
          taskA,
          taskB,
        },
        title: `${examName} - Written Expression`,
      };
    }

    // For Oral Expression, return scenario with partA and partB tasks
    if (module === "oralExpression") {
      const taskIds = examSession.taskIds as string[];
      const oralATaskId = taskIds.find((id) => id.startsWith("oralA_")) || "";
      const oralBTaskId = taskIds.find((id) => id.startsWith("oralB_")) || "";

      let partATask: any;
      let partBTask: any;

      // If oral task IDs are stored in session, use them; otherwise generate random tasks (like standalone exam)
      if (oralATaskId && oralBTaskId) {
        // Extract task IDs (format: "oralA_3" -> id: 3)
        const oralAId = parseInt(oralATaskId.replace("oralA_", ""));
        const oralBTaskIdNum = parseInt(oralBTaskId.replace("oralB_", ""));

        if (isNaN(oralAId) || isNaN(oralBTaskIdNum)) {
          throw new Error(`Invalid oral task ID format`);
        }

        partATask = getTaskById("A", oralAId);
        partBTask = getTaskById("B", oralBTaskIdNum);

        if (!partATask || !partBTask) {
          throw new Error(
            `Oral tasks not found: partA=${oralAId}, partB=${oralBTaskIdNum}`
          );
        }
      } else {
        // Generate random tasks on the fly (like standalone oral expression exam)
        partATask = getRandomSectionATask();
        partBTask = getRandomSectionBTask();

        // Optionally update the session to store these task IDs for consistency
        const updatedTaskIds = [
          ...taskIds,
          `oralA_${partATask.id}`,
          `oralB_${partBTask.id}`,
        ];
        await db.collection("examSessions").updateOne(
          { userId, mockExamId },
          {
            $set: {
              taskIds: updatedTaskIds,
              updatedAt: new Date().toISOString(),
            },
          }
        );
      }

      // Get mock exam name for title
      const mockExam = await db.collection("mockExams").findOne({ mockExamId });
      const examName = mockExam?.name || "Mock Exam";

      return {
        sessionId: examSession.sessionId,
        scenario: {
          officialTasks: {
            partA: partATask,
            partB: partBTask,
          },
          mode: "full" as const,
          title: `${examName} - Oral Expression`,
          mockExamId, // Include mockExamId so the evaluation job includes it
        },
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
    module: "oralExpression" | "reading" | "listening" | "writtenExpression",
    result: any
  ): Promise<{
    success: boolean;
    allModulesCompleted: boolean;
    resultId?: string;
  } | null> {
    const db = await connectDB();

    const examSession = await db.collection("examSessions").findOne({
      userId,
      mockExamId,
      examType: "mock",
    });

    if (!examSession) {
      return null;
    }

    const session = db.client.startSession();

    try {
      let allModulesCompleted = false;
      let resultId: string | undefined;

      await session.withTransaction(async () => {
        // For oralExpression and writtenExpression, save the result to database if not already saved
        if ((module === "oralExpression" || module === "writtenExpression") && result) {
            // Ensure result has mockExamId and module fields
            const resultToSave: any = {
              ...result,
              userId,
              mockExamId,
              module: module,
              updatedAt: new Date().toISOString(),
            };

          // Remove temp IDs - MongoDB will generate a real ID
          const { _id: tempId, ...resultWithoutId } = resultToSave;

          let savedResultId: string | undefined;

          // For actual results (isLoading=false), prioritize finding and updating existing placeholder
          // This ensures we update the placeholder instead of the evaluation worker's new document
          if (!resultToSave.isLoading) {
            const existingPlaceholder = await db
              .collection("results")
              .findOne(
                {
                  userId,
                  mockExamId,
                  module: module,
                  isLoading: true,
                },
                { session }
              );

            if (existingPlaceholder) {
              // Update the placeholder with actual result data
              const updateResult = await db
                .collection("results")
                .findOneAndUpdate(
                  { _id: existingPlaceholder._id },
                  { $set: { ...resultWithoutId, isLoading: false } },
                  { returnDocument: "after", session }
                );
              savedResultId = updateResult?._id?.toString();
            }
          }

          // If no placeholder found (or this is a placeholder), check if we should update by ID
          if (!savedResultId) {
            // Check if this is a valid ObjectId (24 char hex string)
            const isValidObjectId =
              tempId &&
              typeof tempId === "string" &&
              /^[0-9a-fA-F]{24}$/.test(tempId);

            if (isValidObjectId) {
              try {
                const updateResult = await db
                  .collection("results")
                  .findOneAndUpdate(
                    { _id: new ObjectId(tempId) },
                    { $set: resultWithoutId },
                    { returnDocument: "after", session }
                  );
                savedResultId = updateResult?._id?.toString();
              } catch (err) {
                console.error("Error updating result with ObjectId:", err);
                // Fall through to upsert logic
              }
            }

            // If update by ID failed or no valid ID, use upsert
            if (!savedResultId) {
              const savedResult = await db
                .collection("results")
                .findOneAndUpdate(
                  { userId, mockExamId, module: module },
                  { $set: resultWithoutId },
                  { upsert: true, returnDocument: "after", session }
                );
              savedResultId = savedResult?._id?.toString();
            }
          }

          // Set resultId for return (need to do this after transaction)
          resultId = savedResultId;

          // Mark module as completed (exam is done, evaluation may still be pending)
          // The module selector will show loading state if result.isLoading is true
          await db.collection("examSessions").updateOne(
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
        } else {
          // For non-oralExpression/writtenExpression modules (reading/listening), mark as completed normally
          await db.collection("examSessions").updateOne(
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
        }

        // Check if all modules are completed
        const updatedSession = await db
          .collection("examSessions")
          .findOne({ userId, mockExamId }, { session });

        const completedModules =
          (updatedSession?.completedModules as string[]) || [];
        allModulesCompleted = completedModules.length === 4;

        if (allModulesCompleted) {
          // Mark mock exam as fully completed
          await db.collection("examSessions").updateOne(
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
          await db.collection("usage").updateOne(
            { userId },
            {
              $addToSet: { completedMockExamIds: mockExamId },
              $unset: {
                activeMockExamId: "",
                activeMockExamSessionId: "",
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
        resultId,
      };
    } finally {
      await session.endSession();
    }
  },

  /**
   * Resume an incomplete mock exam
   */
  async resumeMockExam(
    userId: string,
    mockExamId: string
  ): Promise<{
    mockExamId: string;
    sessionId: string;
    completedModules: string[];
    availableModules: string[];
  } | null> {
    const status = await mockExamService.getMockExamStatus(userId, mockExamId);
    // Resume requires a sessionId, so return null if status doesn't have one
    if (!status || !status.sessionId) {
      return null;
    }
    return {
      mockExamId: status.mockExamId,
      sessionId: status.sessionId,
      completedModules: status.completedModules,
      availableModules: status.availableModules,
    };
  },
};
