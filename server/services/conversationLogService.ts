/**
 * Conversation Log Service - handles conversation logging for oral expression practice sessions
 */

import { connectDB } from "../db/connection";
import { createConversationLog, ConversationLog } from "../models/ConversationLog";

export const conversationLogService = {
  /**
   * Log when a conversation session starts
   */
  async logSessionStart(
    userId: string,
    sessionId: string,
    examType: 'partA' | 'partB',
    part: 'A' | 'B',
    taskId: string,
    taskTitle: string
  ): Promise<string> {
    try {
      const db = await connectDB();
      const log = createConversationLog(
        userId,
        sessionId,
        examType,
        part,
        taskId,
        taskTitle
      );

      // Remove _id if present - MongoDB will generate it
      const { _id, ...logWithoutId } = log;
      const result = await db.collection('conversationLogs').insertOne(logWithoutId as any);
      return result.insertedId.toString();
    } catch (error: any) {
      console.error('❌ Error creating conversation log:', error);
      throw error;
    }
  },

  /**
   * Log a message event with usage metadata
   */
  async logMessage(
    userId: string,
    sessionId: string,
    messageType: 'user' | 'ai',
    usageMetadata?: {
      promptTokenCount?: number;
      candidatesTokenCount?: number;
      totalTokenCount?: number;
    },
    data?: any
  ): Promise<void> {
    const db = await connectDB();
    const now = new Date().toISOString();

    // Find the log document
    const log = await db.collection('conversationLogs').findOne({
      userId,
      sessionId,
      status: { $in: ['active', 'completed'] }
    });

    if (!log) {
      console.warn(`Conversation log not found for session ${sessionId}`);
      return;
    }

    // Prepare event data
    const event = {
      type: 'message' as const,
      timestamp: now,
      data: data || {},
      usageMetadata: usageMetadata ? {
        promptTokenCount: usageMetadata.promptTokenCount,
        candidatesTokenCount: usageMetadata.candidatesTokenCount,
        totalTokenCount: usageMetadata.totalTokenCount,
      } : undefined,
    };

    // Update metrics
    const update: any = {
      $push: { events: event },
      $inc: {
        'metrics.messageCount': 1,
        [`metrics.${messageType === 'user' ? 'userMessageCount' : 'aiMessageCount'}`]: 1,
      },
      $set: { updatedAt: now },
    };

    // Update token counts from Gemini API
    // NOTE: Gemini Live API processes FULL context each turn and bills for it
    // - promptTokenCount = full conversation context size for THIS turn
    // - Each turn processes all previous turns, so billing accumulates
    // We track BOTH:
    // 1. Final conversation size (SET - last value)
    // 2. Total billed tokens (INCREMENT - sum of all turns)
    if (usageMetadata) {
      // SET final conversation size (last promptTokenCount = final context)
      if (usageMetadata.promptTokenCount !== undefined) {
        update.$set = update.$set || {};
        update.$set['metrics.totalPromptTokens'] = usageMetadata.promptTokenCount;
        // INCREMENT total billed (each turn bills for full context)
        update.$inc['metrics.totalBilledPromptTokens'] = usageMetadata.promptTokenCount;
      }
      // INCREMENT completion tokens (each turn adds new output tokens)
      if (usageMetadata.candidatesTokenCount) {
        update.$inc['metrics.totalCompletionTokens'] = usageMetadata.candidatesTokenCount;
      }
      // SET final total (last totalTokenCount = final conversation total)
      if (usageMetadata.totalTokenCount !== undefined) {
        update.$set = update.$set || {};
        update.$set['metrics.totalTokens'] = usageMetadata.totalTokenCount;
        // INCREMENT total billed (each turn bills for full context + completion)
        update.$inc['metrics.totalBilledTokens'] = usageMetadata.totalTokenCount;
      }
      // INCREMENT cost — Gemini API never returns a .cost field, compute from tokens.
      // gemini-3.1-flash-live-preview with responseModalities: AUDIO
      // Input: $3.00/1M audio tokens, Output: $12.00/1M audio tokens
      // promptTokenCount is billed per-turn (full context), candidatesTokenCount is new output only
      const inputCost = (usageMetadata.promptTokenCount || 0) * 0.000003;   // $3.00 / 1M audio in
      const outputCost = (usageMetadata.candidatesTokenCount || 0) * 0.000012; // $12.00 / 1M audio out
      if (inputCost + outputCost > 0) {
        update.$inc['metrics.totalCost'] = inputCost + outputCost;
      }
    }

    await db.collection('conversationLogs').updateOne(
      { userId, sessionId },
      update
    );
  },

  /**
   * Log an error during conversation
   */
  async logError(
    userId: string,
    sessionId: string,
    error: any,
    data?: any
  ): Promise<void> {
    const db = await connectDB();
    const now = new Date().toISOString();

    const event: any = {
      type: 'error' as const,
      timestamp: now,
      data: {
        error: error?.message || String(error),
        errorCode: error?.code,
        errorDetails: error,
        ...data,
      },
    };

    await db.collection('conversationLogs').updateOne(
      { userId, sessionId },
      {
        $push: { events: event },
        $inc: { 'metrics.errorCount': 1 },
        $set: {
          'metrics.connectionStatus': 'error',
          updatedAt: now,
        },
      } as any
    );
  },

  /**
   * Log session end with summary
   */
  async logSessionEnd(
    userId: string,
    sessionId: string,
    status: 'completed' | 'failed' | 'abandoned',
    resultId?: string
  ): Promise<void> {
    const db = await connectDB();
    const now = new Date().toISOString();

    // Get the log to calculate duration
    const log = await db.collection('conversationLogs').findOne({
      userId,
      sessionId,
    });

    if (!log) {
      console.warn(`Conversation log not found for session ${sessionId}`);
      return;
    }

    const startedAt = new Date(log.startedAt);
    const endedAt = new Date(now);
    const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000);

    const event = {
      type: 'end' as const,
      timestamp: now,
      data: {
        status,
        duration,
        resultId,
      },
    };

    const update: any = {
      $push: { events: event },
      $set: {
        status,
        endedAt: now,
        duration,
        updatedAt: now,
        'metrics.connectionStatus': status === 'completed' ? 'disconnected' : 'error',
      },
    };

    if (resultId) {
      update.$set.resultId = resultId;
    }

    await db.collection('conversationLogs').updateOne(
      { userId, sessionId },
      update
    );
  },

  /**
   * Get all conversation logs for users in an organization (admin only)
   */
  async getOrgLogs(
    userIds: string[],
    options?: {
      examType?: 'partA' | 'partB';
      startDate?: string;
      endDate?: string;
      limit?: number;
      skip?: number;
      orgId?: string; // Optional orgId for more accurate filtering
    }
  ): Promise<{
    logs: ConversationLog[];
    total: number;
    hasMore: boolean;
    summary: {
      totalSessions: number;
      totalTokens: number;
      totalBilledTokens: number;
      totalCost: number;
      uniqueUsers: number;
    };
  }> {
    try {
      const db = await connectDB();

      const limit = options?.limit || 50;
      const skip = options?.skip || 0;
      const orgId = options?.orgId;

      // Build query - filter by userIds in the organization
      // If orgId is provided, also filter by orgId for better performance and accuracy
      const query: any = {
        module: 'oralExpression', // Only oral expression logs
      };

      // Prefer orgId filter if available (more accurate for multi-org admins)
      // Fallback to userId filter for records without orgId (backward compatibility)
      if (orgId && userIds.length > 0) {
        query.$or = [
          { orgId: orgId }, // Records with orgId (after migration)
          { userId: { $in: userIds }, orgId: { $exists: false } } // Records without orgId (legacy, before migration)
        ];
      } else if (userIds.length > 0) {
        query.userId = { $in: userIds };
      } else {
        // No users in org, return empty results
        query.userId = { $in: [] };
      }

      if (options?.examType) {
        query.examType = options.examType;
      }

      if (options?.startDate || options?.endDate) {
        query.startedAt = {};
        if (options.startDate) {
          query.startedAt.$gte = options.startDate;
        }
        if (options.endDate) {
          query.startedAt.$lte = options.endDate;
        }
      }

      // Get total count
      const total = await db.collection('conversationLogs').countDocuments(query);

      // Get paginated results
      const logs = await db.collection('conversationLogs')
        .find(query)
        .sort({ startedAt: -1 }) // Most recent first
        .skip(skip)
        .limit(limit)
        .toArray();

      // Calculate summary statistics
      const summaryQuery = { ...query };
      const allLogsForSummary = await db.collection('conversationLogs')
        .find(summaryQuery)
        .toArray();

      const summary = {
        totalSessions: allLogsForSummary.length,
        totalTokens: allLogsForSummary.reduce((sum, log) => sum + (log.metrics?.totalTokens || 0), 0),
        totalBilledTokens: allLogsForSummary.reduce((sum, log) => sum + (log.metrics?.totalBilledTokens || 0), 0),
        totalCost: allLogsForSummary.reduce((sum, log) => sum + (log.metrics?.totalCost || 0), 0),
        uniqueUsers: new Set(allLogsForSummary.map((log: any) => log.userId)).size,
      };

      return {
        logs: logs.map((log: any) => ({
          ...log,
          _id: log._id?.toString(),
        })) as ConversationLog[],
        total,
        hasMore: skip + logs.length < total,
        summary,
      };
    } catch (error: any) {
      console.error('❌ Error fetching org logs:', error);
      throw error;
    }
  },
};
