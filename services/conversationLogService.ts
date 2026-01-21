/**
 * Frontend service for conversation logging
 */

import { authenticatedFetchJSON } from './authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

// Helper type for token getter function
type TokenGetter = () => Promise<string | null>;

export interface UsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
  blockTokenCount?: number;
  cost?: number; // Calculated cost: totalTokenCount * 0.0000035 (blended rate)
}

export const conversationLogService = {
  /**
   * Log when a conversation session starts
   */
  async logSessionStart(
    sessionId: string,
    examType: 'partA' | 'partB',
    part: 'A' | 'B',
    taskId: string,
    taskTitle: string,
    getToken: TokenGetter
  ): Promise<void> {
    try {
      await authenticatedFetchJSON<{ success: boolean; logId: string }>(
        `${BACKEND_URL}/api/conversation-logs/start`,
        {
          method: 'POST',
          getToken,
          body: JSON.stringify({
            sessionId,
            examType,
            part,
            taskId,
            taskTitle,
          }),
        }
      );
    } catch (error) {
      console.error('Failed to log session start:', error);
      throw error;
    }
  },

  /**
   * Log a message event with usage metadata
   */
  async logMessage(
    sessionId: string,
    messageType: 'user' | 'ai',
    usageMetadata?: UsageMetadata,
    data?: any,
    getToken?: TokenGetter
  ): Promise<void> {
    if (!getToken) {
      console.warn('No token getter provided for logging message');
      return;
    }

    try {
      await authenticatedFetchJSON<{ success: boolean }>(
        `${BACKEND_URL}/api/conversation-logs/message`,
        {
          method: 'POST',
          getToken,
          body: JSON.stringify({
            sessionId,
            messageType,
            usageMetadata,
            data,
          }),
        }
      );
    } catch (error) {
      // Non-blocking: log error but don't break conversation flow
      console.error('Failed to log message:', error);
    }
  },

  /**
   * Log an error during conversation
   */
  async logError(
    sessionId: string,
    error: any,
    data?: any,
    getToken?: TokenGetter
  ): Promise<void> {
    if (!getToken) {
      console.warn('No token getter provided for logging error');
      return;
    }

    try {
      await authenticatedFetchJSON<{ success: boolean }>(
        `${BACKEND_URL}/api/conversation-logs/error`,
        {
          method: 'POST',
          getToken,
          body: JSON.stringify({
            sessionId,
            error: {
              message: error?.message || String(error),
              code: error?.code,
              details: error,
            },
            data,
          }),
        }
      );
    } catch (logError) {
      // Non-blocking: log error but don't break conversation flow
      console.error('Failed to log error:', logError);
    }
  },

  /**
   * Log session end with summary
   */
  async logSessionEnd(
    sessionId: string,
    status: 'completed' | 'failed' | 'abandoned',
    resultId?: string,
    getToken?: TokenGetter
  ): Promise<void> {
    if (!getToken) {
      console.warn('No token getter provided for logging session end');
      return;
    }

    try {
      await authenticatedFetchJSON<{ success: boolean }>(
        `${BACKEND_URL}/api/conversation-logs/end`,
        {
          method: 'POST',
          getToken,
          body: JSON.stringify({
            sessionId,
            status,
            resultId,
          }),
        }
      );
    } catch (error) {
      // Non-blocking: log error but don't break conversation flow
      console.error('Failed to log session end:', error);
    }
  },

};
