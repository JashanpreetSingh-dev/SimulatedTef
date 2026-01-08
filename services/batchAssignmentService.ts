/**
 * Frontend service for batch assignment API calls
 */

import { authenticatedFetchJSON } from './authenticatedFetch';
import { BatchAssignment } from '../types';

const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001') + '/api';

type TokenGetter = () => Promise<string | null>;

export const batchAssignmentService = {
  /**
   * Assign assessment to batch
   */
  async assignToBatch(
    batchId: string,
    assignmentId: string,
    getToken: TokenGetter
  ): Promise<BatchAssignment> {
    return authenticatedFetchJSON<BatchAssignment>(`${API_BASE}/batch-assignments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ batchId, assignmentId }),
      getToken,
    });
  },

  /**
   * Unassign assessment from batch
   */
  async unassignFromBatch(batchAssignmentId: string, getToken: TokenGetter): Promise<void> {
    await authenticatedFetchJSON(`${API_BASE}/batch-assignments/${batchAssignmentId}`, {
      method: 'DELETE',
      getToken,
    });
  },

  /**
   * Get assessment bank (all published assignments)
   */
  async getAssessmentBank(type: 'reading' | 'listening' | undefined, getToken: TokenGetter): Promise<any[]> {
    const url = type
      ? `${API_BASE}/assignments/bank?type=${type}`
      : `${API_BASE}/assignments/bank`;
    
    return authenticatedFetchJSON<any[]>(url, {
      getToken,
    });
  },

  /**
   * Get student's assigned assessments
   */
  async getAssignedAssignments(getToken: TokenGetter): Promise<any[]> {
    return authenticatedFetchJSON<any[]>(`${API_BASE}/assignments/assigned`, {
      getToken,
    });
  },
};