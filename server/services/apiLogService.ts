/**
 * Service layer for AI API log database operations
 */

import { ObjectId } from 'mongodb';
import { connectDB } from '../db/connection';
import { ApiLog, createApiLog, validateApiLog } from '../models/ApiLog';

const DEFAULT_LIMIT = 100;
const MAX_LIMIT = 1000;

// Gemini pricing per 1M tokens (as of 2025)
// Prices vary by model, using approximate averages
const GEMINI_PRICING: Record<string, { input: number; output: number }> = {
  'gemini-2.5-flash-preview-09-2025': {
    input: 0.075, // $0.075 per 1M input tokens
    output: 0.30, // $0.30 per 1M output tokens
  },
  'gemini-2.5-flash-native-audio-preview-12-2025': {
    input: 0.075,
    output: 0.30,
  },
  'gemini-2.5-flash-preview-tts': {
    input: 0.075,
    output: 0.30,
  },
  // Default pricing for unknown models
  default: {
    input: 0.075,
    output: 0.30,
  },
};

/**
 * Calculate estimated cost based on model and token usage
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const pricing = GEMINI_PRICING[model] || GEMINI_PRICING.default;
  
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  
  return inputCost + outputCost;
}

export const apiLogService = {
  /**
   * Log an API call
   */
  async logApiCall(logData: {
    functionName: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    duration: number;
    status: 'success' | 'error';
    userId?: string;
    sessionId?: string;
    errorMessage?: string;
    metadata?: Record<string, any>;
  }): Promise<void> {
    try {
      const db = await connectDB();
      
      // Calculate estimated cost
      const estimatedCost = calculateCost(
        logData.model,
        logData.inputTokens,
        logData.outputTokens
      );
      
      // Create log document
      const apiLog = createApiLog(
        logData.functionName,
        logData.model,
        logData.inputTokens,
        logData.outputTokens,
        logData.duration,
        logData.status,
        {
          userId: logData.userId,
          sessionId: logData.sessionId,
          estimatedCost,
          errorMessage: logData.errorMessage,
          metadata: logData.metadata,
        }
      );
      
      // Exclude _id (MongoDB will auto-generate) and convert dates to ISO strings
      const { _id, ...apiLogWithoutId } = apiLog;
      const logToInsert = {
        ...apiLogWithoutId,
        timestamp: apiLog.timestamp.toISOString(),
        createdAt: apiLog.createdAt.toISOString(),
      };
      
      await db.collection('api_logs').insertOne(logToInsert);
    } catch (error: any) {
      // Don't throw - logging failures should not break API calls
      console.error('❌ Failed to log API call:', error.message);
    }
  },

  /**
   * Get logs for a specific user
   */
  async getUserLogs(
    userId: string,
    limit: number = DEFAULT_LIMIT,
    skip: number = 0,
    startDate?: Date,
    endDate?: Date
  ): Promise<ApiLog[]> {
    const db = await connectDB();
    
    const query: any = { userId };
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = startDate.toISOString();
      }
      if (endDate) {
        query.timestamp.$lte = endDate.toISOString();
      }
    }
    
    const logs = await db.collection('api_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(Math.min(limit, MAX_LIMIT))
      .skip(skip)
      .toArray();
    
    return logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp),
      createdAt: new Date(log.createdAt),
    })) as unknown as ApiLog[];
  },

  /**
   * Get aggregated statistics
   */
  async getAggregatedStats(
    userId?: string,
    startDate?: Date,
    endDate?: Date,
    functionName?: string
  ): Promise<{
    totalCalls: number;
    totalTokens: number;
    totalInputTokens: number;
    totalOutputTokens: number;
    totalCost: number;
    averageDuration: number;
    successCount: number;
    errorCount: number;
    callsByFunction: Record<string, number>;
    callsByModel: Record<string, number>;
  }> {
    const db = await connectDB();
    
    const query: any = {};
    
    if (userId) {
      query.userId = userId;
    }
    
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) {
        query.timestamp.$gte = startDate.toISOString();
      }
      if (endDate) {
        query.timestamp.$lte = endDate.toISOString();
      }
    }
    
    if (functionName) {
      query.functionName = functionName;
    }
    
    const logs = await db.collection('api_logs')
      .find(query)
      .toArray();
    
    const stats = {
      totalCalls: logs.length,
      totalTokens: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
      totalDuration: 0,
      successCount: 0,
      errorCount: 0,
      callsByFunction: {} as Record<string, number>,
      callsByModel: {} as Record<string, number>,
    };
    
    for (const log of logs) {
      stats.totalTokens += log.totalTokens || 0;
      stats.totalInputTokens += log.inputTokens || 0;
      stats.totalOutputTokens += log.outputTokens || 0;
      stats.totalCost += log.estimatedCost || 0;
      stats.totalDuration += log.duration || 0;
      
      if (log.status === 'success') {
        stats.successCount++;
      } else {
        stats.errorCount++;
      }
      
      stats.callsByFunction[log.functionName] = (stats.callsByFunction[log.functionName] || 0) + 1;
      stats.callsByModel[log.model] = (stats.callsByModel[log.model] || 0) + 1;
    }
    
    return {
      totalCalls: stats.totalCalls,
      totalTokens: stats.totalTokens,
      totalInputTokens: stats.totalInputTokens,
      totalOutputTokens: stats.totalOutputTokens,
      totalCost: stats.totalCost,
      averageDuration: stats.totalCalls > 0 ? stats.totalDuration / stats.totalCalls : 0,
      successCount: stats.successCount,
      errorCount: stats.errorCount,
      callsByFunction: stats.callsByFunction,
      callsByModel: stats.callsByModel,
    };
  },

  /**
   * Get all logs with filtering
   */
  async getLogs(
    options?: {
      userId?: string;
      sessionId?: string;
      functionName?: string;
      model?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
      skip?: number;
    }
  ): Promise<ApiLog[]> {
    const db = await connectDB();
    
    const query: any = {};
    
    if (options?.userId) {
      query.userId = options.userId;
    }
    
    if (options?.sessionId) {
      query.sessionId = options.sessionId;
    }
    
    if (options?.functionName) {
      query.functionName = options.functionName;
    }
    
    if (options?.model) {
      query.model = options.model;
    }
    
    if (options?.startDate || options?.endDate) {
      query.timestamp = {};
      if (options?.startDate) {
        query.timestamp.$gte = options.startDate.toISOString();
      }
      if (options?.endDate) {
        query.timestamp.$lte = options.endDate.toISOString();
      }
    }
    
    const limit = Math.min(options?.limit || DEFAULT_LIMIT, MAX_LIMIT);
    const skip = options?.skip || 0;
    
    const logs = await db.collection('api_logs')
      .find(query)
      .sort({ timestamp: -1 })
      .limit(limit)
      .skip(skip)
      .toArray();
    
    return logs.map(log => ({
      ...log,
      timestamp: new Date(log.timestamp),
      createdAt: new Date(log.createdAt),
    })) as unknown as ApiLog[];
  },
};

