/**
 * Frontend service for batch API calls
 */

import { authenticatedFetchJSON } from './authenticatedFetch';
import { Batch } from '../types';

const API_BASE = (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001') + '/api';

type TokenGetter = () => Promise<string | null>;

export const batchService = {
  /**
   * Create a new batch
   */
  async createBatch(name: string, getToken: TokenGetter): Promise<Batch> {
    return authenticatedFetchJSON<Batch>(`${API_BASE}/batches`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
      getToken,
    });
  },

  /**
   * Get all batches for professor
   */
  async getBatches(getToken: TokenGetter): Promise<Batch[]> {
    return authenticatedFetchJSON<Batch[]>(`${API_BASE}/batches`, {
      getToken,
    });
  },

  /**
   * Get student's batch
   */
  async getMyBatch(getToken: TokenGetter): Promise<Batch | null> {
    try {
      return await authenticatedFetchJSON<Batch>(`${API_BASE}/batches/my`, {
        getToken,
      });
    } catch (err: any) {
      if (err.status === 404) {
        return null;
      }
      throw err;
    }
  },

  /**
   * Get batch by ID
   */
  async getBatch(batchId: string, getToken: TokenGetter): Promise<Batch> {
    return authenticatedFetchJSON<Batch>(`${API_BASE}/batches/${batchId}`, {
      getToken,
    });
  },

  /**
   * Update batch name
   */
  async updateBatch(batchId: string, name: string, getToken: TokenGetter): Promise<Batch> {
    return authenticatedFetchJSON<Batch>(`${API_BASE}/batches/${batchId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name }),
      getToken,
    });
  },

  /**
   * Delete batch
   */
  async deleteBatch(batchId: string, getToken: TokenGetter): Promise<void> {
    await authenticatedFetchJSON(`${API_BASE}/batches/${batchId}`, {
      method: 'DELETE',
      getToken,
    });
  },

  /**
   * Add student to batch
   */
  async addStudent(batchId: string, studentUserId: string, getToken: TokenGetter): Promise<Batch> {
    return authenticatedFetchJSON<Batch>(`${API_BASE}/batches/${batchId}/students`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ studentUserId }),
      getToken,
    });
  },

  /**
   * Get all students in organization
   */
  async getStudents(getToken: TokenGetter): Promise<Array<{ userId: string; email: string; firstName?: string; lastName?: string }>> {
    return authenticatedFetchJSON<Array<{ userId: string; email: string; firstName?: string; lastName?: string }>>(
      `${API_BASE}/batches/students`,
      {
        getToken,
      }
    );
  },

  /**
   * Remove student from batch
   */
  async removeStudent(batchId: string, studentId: string, getToken: TokenGetter): Promise<void> {
    await authenticatedFetchJSON(`${API_BASE}/batches/${batchId}/students/${studentId}`, {
      method: 'DELETE',
      getToken,
    });
  },

  /**
   * Get batch assignments
   */
  async getBatchAssignments(batchId: string, getToken: TokenGetter): Promise<any[]> {
    return authenticatedFetchJSON<any[]>(`${API_BASE}/batches/${batchId}/assignments`, {
      getToken,
    });
  },
};