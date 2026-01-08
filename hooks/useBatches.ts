/**
 * React hook for managing batches
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { batchService } from '../services/batchService';
import { Batch } from '../types';

export function useBatches() {
  const { getToken } = useAuth();
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTokenWrapper = useCallback(async () => {
    return getToken();
  }, [getToken]);

  /**
   * Create a new batch (with optimistic update)
   */
  const createBatch = useCallback(async (name: string): Promise<Batch> => {
    setError(null);
    
    // Create temporary batch for optimistic update
    const tempBatch: Batch = {
      batchId: `temp-${Date.now()}`,
      name,
      professorId: '',
      orgId: '',
      studentIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // Optimistic update
    setBatches(prev => [tempBatch, ...prev]);

    try {
      const batch = await batchService.createBatch(name, getTokenWrapper);
      // Replace temp batch with real one
      setBatches(prev => prev.map(b => b.batchId === tempBatch.batchId ? batch : b));
      return batch;
    } catch (err: any) {
      // Rollback on error
      setBatches(prev => prev.filter(b => b.batchId !== tempBatch.batchId));
      const errorMessage = err.message || 'Failed to create batch';
      setError(errorMessage);
      throw err;
    }
  }, [getTokenWrapper]);

  /**
   * Fetch all batches for professor
   */
  const fetchBatches = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const myBatches = await batchService.getBatches(getTokenWrapper);
      setBatches(myBatches);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch batches';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Get batch by ID
   */
  const getBatch = useCallback(async (batchId: string): Promise<Batch> => {
    setLoading(true);
    setError(null);
    try {
      const batch = await batchService.getBatch(batchId, getTokenWrapper);
      setBatches(prev => {
        const existing = prev.find(b => b.batchId === batchId);
        if (existing) {
          return prev.map(b => b.batchId === batchId ? batch : b);
        }
        return [...prev, batch];
      });
      return batch;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch batch';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Update batch name (with optimistic update)
   */
  const updateBatch = useCallback(async (batchId: string, name: string): Promise<Batch> => {
    setError(null);
    
    // Optimistic update
    const previousBatches = [...batches];
    setBatches(prev => prev.map(b => {
      if (b.batchId === batchId) {
        return {
          ...b,
          name,
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    }));

    try {
      const updated = await batchService.updateBatch(batchId, name, getTokenWrapper);
      // Update with server response
      setBatches(prev => prev.map(b => b.batchId === batchId ? updated : b));
      return updated;
    } catch (err: any) {
      // Rollback on error
      setBatches(previousBatches);
      const errorMessage = err.message || 'Failed to update batch';
      setError(errorMessage);
      throw err;
    }
  }, [getTokenWrapper, batches]);

  /**
   * Delete batch (with optimistic update)
   */
  const deleteBatch = useCallback(async (batchId: string): Promise<void> => {
    setError(null);
    
    // Optimistic update
    const previousBatches = [...batches];
    setBatches(prev => prev.filter(b => b.batchId !== batchId));

    try {
      await batchService.deleteBatch(batchId, getTokenWrapper);
      // Success - optimistic update already applied
    } catch (err: any) {
      // Rollback on error
      setBatches(previousBatches);
      const errorMessage = err.message || 'Failed to delete batch';
      setError(errorMessage);
      throw err;
    }
  }, [getTokenWrapper, batches]);

  /**
   * Add student to batch (with optimistic update)
   */
  const addStudent = useCallback(async (batchId: string, studentUserId: string): Promise<Batch> => {
    setError(null);
    
    // Optimistic update
    const previousBatches = [...batches];
    setBatches(prev => prev.map(b => {
      if (b.batchId === batchId) {
        return {
          ...b,
          studentIds: [...b.studentIds, studentUserId],
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    }));

    try {
      const updated = await batchService.addStudent(batchId, studentUserId, getTokenWrapper);
      // Update with server response
      setBatches(prev => prev.map(b => b.batchId === batchId ? updated : b));
      return updated;
    } catch (err: any) {
      // Rollback on error
      setBatches(previousBatches);
      const errorMessage = err.message || 'Failed to add student';
      setError(errorMessage);
      throw err;
    }
  }, [getTokenWrapper, batches]);

  /**
   * Get all students in organization
   * Note: Doesn't set loading state to avoid blocking UI
   */
  const getStudents = useCallback(async (): Promise<Array<{ userId: string; email: string; firstName?: string; lastName?: string }>> => {
    setError(null);
    try {
      return await batchService.getStudents(getTokenWrapper);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch students';
      setError(errorMessage);
      return [];
    }
  }, [getTokenWrapper]);

  /**
   * Remove student from batch (with optimistic update)
   */
  const removeStudent = useCallback(async (batchId: string, studentId: string): Promise<void> => {
    setError(null);
    
    // Optimistic update
    const previousBatches = [...batches];
    setBatches(prev => prev.map(b => {
      if (b.batchId === batchId) {
        return {
          ...b,
          studentIds: b.studentIds.filter(id => id !== studentId),
          updatedAt: new Date().toISOString(),
        };
      }
      return b;
    }));

    try {
      await batchService.removeStudent(batchId, studentId, getTokenWrapper);
      // Fetch updated batch to ensure consistency
      const updated = await batchService.getBatch(batchId, getTokenWrapper);
      setBatches(prev => prev.map(b => b.batchId === batchId ? updated : b));
    } catch (err: any) {
      // Rollback on error
      setBatches(previousBatches);
      const errorMessage = err.message || 'Failed to remove student';
      setError(errorMessage);
      throw err;
    }
  }, [getTokenWrapper, batches]);

  return {
    batches,
    loading,
    error,
    createBatch,
    fetchBatches,
    getBatch,
    updateBatch,
    deleteBatch,
    addStudent,
    removeStudent,
    getStudents,
  };
}