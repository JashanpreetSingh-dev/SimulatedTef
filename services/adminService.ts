/**
 * Admin Service - Frontend service for admin API calls
 */

import { authenticatedFetchJSON } from './authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface OrgConversationLog {
  _id?: string;
  userId: string;
  sessionId: string;
  examType: 'partA' | 'partB';
  module: 'oralExpression';
  part: 'A' | 'B';
  taskId: string;
  taskTitle: string;
  startedAt: string;
  endedAt?: string;
  duration?: number;
  status: 'active' | 'completed' | 'failed' | 'abandoned';
  metrics: {
    messageCount: number;
    userMessageCount: number;
    aiMessageCount: number;
    errorCount: number;
    connectionStatus: 'connected' | 'disconnected' | 'error';
    totalPromptTokens: number;
    totalCompletionTokens: number;
    totalTokens: number;
    totalBilledTokens: number;
    totalCost: number;
  };
  resultId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrgLogsResponse {
  logs: OrgConversationLog[];
  pagination: {
    total: number;
    limit: number;
    skip: number;
    hasMore: boolean;
  };
  summary: {
    totalSessions: number;
    totalTokens: number;
    totalBilledTokens: number;
    totalCost: number;
    uniqueUsers: number;
  };
}

export const adminService = {
  /**
   * Get all conversation logs for the organization
   */
  async getOrgLogs(
    getToken: () => Promise<string | null>,
    options?: {
      examType?: 'partA' | 'partB';
      startDate?: string;
      endDate?: string;
      limit?: number;
      skip?: number;
    }
  ): Promise<OrgLogsResponse> {
    const params = new URLSearchParams();
    if (options?.examType) params.append('examType', options.examType);
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);
    if (options?.limit) params.append('limit', String(options.limit));
    if (options?.skip) params.append('skip', String(options.skip));

    const url = `${BACKEND_URL}/api/admin/conversation-logs${params.toString() ? `?${params.toString()}` : ''}`;
    return authenticatedFetchJSON<OrgLogsResponse>(url, {
      method: 'GET',
      getToken: getToken,
    });
  },

  /**
   * Get vote analytics for oral expression results
   */
  async getVoteAnalytics(
    getToken: () => Promise<string | null>,
    options?: {
      startDate?: string;
      endDate?: string;
    }
  ): Promise<VoteAnalytics> {
    const params = new URLSearchParams();
    if (options?.startDate) params.append('startDate', options.startDate);
    if (options?.endDate) params.append('endDate', options.endDate);

    const url = `${BACKEND_URL}/api/admin/results/vote-analytics${params.toString() ? `?${params.toString()}` : ''}`;
    return authenticatedFetchJSON<VoteAnalytics>(url, {
      method: 'GET',
      getToken: getToken,
    });
  },
};

export interface VoteAnalytics {
  summary: {
    totalResults: number;
    totalUpvotes: number;
    totalDownvotes: number;
    totalVotes: number;
    upvotePercentage: number;
    downvotePercentage: number;
  };
  byMode: {
    full: {
      totalResults: number;
      upvotes: number;
      downvotes: number;
      votes: number;
    };
    partA: {
      totalResults: number;
      upvotes: number;
      downvotes: number;
      votes: number;
    };
    partB: {
      totalResults: number;
      upvotes: number;
      downvotes: number;
      votes: number;
    };
  };
  byReason: {
    inaccurate_score: number;
    poor_feedback: number;
    technical_issue: number;
  };
  topDownvotedResults: Array<{
    resultId: string;
    title: string;
    mode: string;
    downvotes: number;
    upvotes: number;
    downvoteReasons: {
      inaccurate_score: number;
      poor_feedback: number;
      technical_issue: number;
    };
  }>;
  recentVotes: Array<{
    resultId: string;
    userId: string;
    vote: 'upvote' | 'downvote';
    reason?: string;
    timestamp: string;
  }>;
}
