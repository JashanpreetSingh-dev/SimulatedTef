/**
 * React hook for managing batch assignments
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { batchAssignmentService } from '../services/batchAssignmentService';

export function useBatchAssignments() {
  const { getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTokenWrapper = useCallback(async () => {
    return getToken();
  }, [getToken]);

  /**
   * Assign assessment to batch
   */
  const assignToBatch = useCallback(async (batchId: string, assignmentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await batchAssignmentService.assignToBatch(batchId, assignmentId, getTokenWrapper);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to assign assessment to batch';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Unassign assessment from batch
   */
  const unassignFromBatch = useCallback(async (batchAssignmentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await batchAssignmentService.unassignFromBatch(batchAssignmentId, getTokenWrapper);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to unassign assessment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Get assessment bank
   */
  const getAssessmentBank = useCallback(async (type?: 'reading' | 'listening'): Promise<any[]> => {
    setLoading(true);
    setError(null);
    try {
      return await batchAssignmentService.getAssessmentBank(type, getTokenWrapper);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch assessment bank';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Get assigned assessments for student
   */
  const getAssignedAssignments = useCallback(async (): Promise<any[]> => {
    setLoading(true);
    setError(null);
    try {
      return await batchAssignmentService.getAssignedAssignments(getTokenWrapper);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch assigned assessments';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  return {
    loading,
    error,
    assignToBatch,
    unassignFromBatch,
    getAssessmentBank,
    getAssignedAssignments,
  };
}