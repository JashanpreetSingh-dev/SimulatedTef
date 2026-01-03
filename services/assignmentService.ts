/**
 * Frontend service for assignment API calls
 */

import { authenticatedFetchJSON } from './authenticatedFetch';
import { Assignment, AssignmentSettings, AssignmentType } from '../types';

const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001') + '/api';

type TokenGetter = () => Promise<string | null>;

export const assignmentService = {
  /**
   * Create a new assignment
   */
  async createAssignment(
    type: AssignmentType,
    title: string | undefined,
    prompt: string,
    settings: AssignmentSettings,
    getToken: TokenGetter
  ): Promise<Assignment> {
    return authenticatedFetchJSON<Assignment>(`${API_BASE}/assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        title,
        prompt,
        settings,
      }),
      getToken,
    });
  },

  /**
   * Generate questions for an assignment (creates async job)
   */
  async generateQuestions(
    assignmentId: string,
    getToken: TokenGetter
  ): Promise<{ jobId: string; assignmentId: string; status: string; message: string }> {
    return authenticatedFetchJSON<{ jobId: string; assignmentId: string; status: string; message: string }>(
      `${API_BASE}/assignments/${assignmentId}/generate`,
      {
        method: 'POST',
        getToken,
      }
    );
  },

  /**
   * Get question generation job status
   */
  async getQuestionGenerationJobStatus(
    assignmentId: string,
    jobId: string,
    getToken: TokenGetter
  ): Promise<{
    jobId: string;
    assignmentId: string;
    status: 'waiting' | 'active' | 'completed' | 'failed';
    progress: number;
    taskId?: string;
    questionIds?: string[];
    error?: string;
  }> {
    return authenticatedFetchJSON(
      `${API_BASE}/assignments/${assignmentId}/generate/${jobId}`,
      {
        getToken,
      }
    );
  },

  /**
   * Get assignment by ID
   */
  async getAssignment(
    assignmentId: string,
    getToken: TokenGetter
  ): Promise<Assignment & { questions?: any[]; task?: any }> {
    return authenticatedFetchJSON<Assignment & { questions?: any[]; task?: any }>(
      `${API_BASE}/assignments/${assignmentId}`,
      {
        getToken,
      }
    );
  },

  /**
   * Update assignment
   */
  async updateAssignment(
    assignmentId: string,
    updates: Partial<Pick<Assignment, 'title' | 'prompt' | 'settings' | 'status'>>,
    getToken: TokenGetter
  ): Promise<Assignment> {
    return authenticatedFetchJSON<Assignment>(`${API_BASE}/assignments/${assignmentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
      getToken,
    });
  },

  /**
   * Update a question in an assignment
   */
  async updateQuestion(
    assignmentId: string,
    questionId: string,
    updates: Partial<{
      question: string;
      questionText?: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>,
    getToken: TokenGetter
  ): Promise<void> {
    await authenticatedFetchJSON(
      `${API_BASE}/assignments/${assignmentId}/questions/${questionId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
        getToken,
      }
    );
  },

  /**
   * Publish assignment
   */
  async publishAssignment(assignmentId: string, getToken: TokenGetter): Promise<Assignment> {
    return authenticatedFetchJSON<Assignment>(`${API_BASE}/assignments/${assignmentId}/publish`, {
      method: 'POST',
      getToken,
    });
  },

  /**
   * Get all assignments created by current user
   */
  async getMyAssignments(getToken: TokenGetter): Promise<Assignment[]> {
    return authenticatedFetchJSON<Assignment[]>(`${API_BASE}/assignments/my`, {
      getToken,
    });
  },

  /**
   * Get all published assignments
   */
  async getPublishedAssignments(
    type: AssignmentType | undefined,
    getToken: TokenGetter
  ): Promise<Assignment[]> {
    const url = type
      ? `${API_BASE}/assignments/published?type=${type}`
      : `${API_BASE}/assignments/published`;
    
    return authenticatedFetchJSON<Assignment[]>(url, {
      getToken,
    });
  },

  /**
   * Delete assignment
   */
  async deleteAssignment(assignmentId: string, getToken: TokenGetter): Promise<void> {
    await authenticatedFetchJSON(`${API_BASE}/assignments/${assignmentId}`, {
      method: 'DELETE',
      getToken,
    });
  },
};
