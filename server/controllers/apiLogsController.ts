/**
 * API Logs controller
 */

import { Request, Response } from 'express';
import { apiLogService } from '../services/apiLogService';

export const apiLogsController = {
  /**
   * POST /api/logs - Create a new log entry
   */
  async createLog(req: Request, res: Response) {
    try {
      const {
        functionName,
        model,
        inputTokens,
        outputTokens,
        duration,
        status,
        userId,
        sessionId,
        errorMessage,
        metadata,
      } = req.body;

      // Validate required fields
      if (!functionName || !model || duration === undefined || !status) {
        return res.status(400).json({
          error: 'Missing required fields: functionName, model, duration, status',
        });
      }

      // Use userId from auth middleware if not provided
      const logUserId = userId || (req as any).userId;

      await apiLogService.logApiCall({
        functionName,
        model,
        inputTokens: inputTokens || 0,
        outputTokens: outputTokens || 0,
        duration,
        status,
        userId: logUserId,
        sessionId,
        errorMessage,
        metadata,
      });

      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error('Error creating log:', error);
      res.status(500).json({ error: error.message || 'Failed to create log' });
    }
  },

  /**
   * GET /api/logs - Get logs with filtering
   */
  async getLogs(req: Request, res: Response) {
    try {
      const {
        userId,
        sessionId,
        functionName,
        model,
        startDate,
        endDate,
        limit,
        skip,
      } = req.query;

      // Use userId from auth middleware if not provided
      const logUserId = userId || (req as any).userId;

      const options: any = {
        userId: logUserId as string | undefined,
        sessionId: sessionId as string | undefined,
        functionName: functionName as string | undefined,
        model: model as string | undefined,
        limit: limit ? parseInt(limit as string) : undefined,
        skip: skip ? parseInt(skip as string) : undefined,
      };

      if (startDate) {
        options.startDate = new Date(startDate as string);
      }
      if (endDate) {
        options.endDate = new Date(endDate as string);
      }

      const logs = await apiLogService.getLogs(options);

      res.json(logs);
    } catch (error: any) {
      console.error('Error getting logs:', error);
      res.status(500).json({ error: error.message || 'Failed to get logs' });
    }
  },

  /**
   * GET /api/logs/stats - Get aggregated statistics
   */
  async getStats(req: Request, res: Response) {
    try {
      const {
        userId,
        functionName,
        startDate,
        endDate,
      } = req.query;

      // Use userId from auth middleware if not provided
      const logUserId = userId || (req as any).userId;

      const stats = await apiLogService.getAggregatedStats(
        logUserId as string | undefined,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined,
        functionName as string | undefined
      );

      res.json(stats);
    } catch (error: any) {
      console.error('Error getting stats:', error);
      res.status(500).json({ error: error.message || 'Failed to get stats' });
    }
  },

  /**
   * GET /api/logs/user/:userId - Get logs for a specific user
   */
  async getUserLogs(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const {
        startDate,
        endDate,
        limit,
        skip,
      } = req.query;

      // Verify user can only access their own logs (unless admin)
      const requestingUserId = (req as any).userId;
      if (requestingUserId && requestingUserId !== userId) {
        return res.status(403).json({ error: 'Forbidden: Cannot access other user logs' });
      }

      const logs = await apiLogService.getUserLogs(
        userId,
        limit ? parseInt(limit as string) : undefined,
        skip ? parseInt(skip as string) : undefined,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      res.json(logs);
    } catch (error: any) {
      console.error('Error getting user logs:', error);
      res.status(500).json({ error: error.message || 'Failed to get user logs' });
    }
  },
};

