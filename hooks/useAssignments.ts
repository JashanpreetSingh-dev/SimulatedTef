/**
 * React hook for managing assignments
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { assignmentService } from '../services/assignmentService';
import { Assignment, AssignmentSettings, AssignmentType } from '../types';

export function useAssignments() {
  const { getToken } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getTokenWrapper = useCallback(async () => {
    return getToken();
  }, [getToken]);

  /**
   * Create a new assignment
   */
  const createAssignment = useCallback(async (
    type: AssignmentType,
    title: string | undefined,
    prompt: string,
    settings: AssignmentSettings,
    creatorName?: string
  ): Promise<Assignment> => {
    setLoading(true);
    setError(null);
    try {
      const assignment = await assignmentService.createAssignment(
        type,
        title,
        prompt,
        settings,
        getTokenWrapper,
        creatorName
      );
      setAssignments(prev => [assignment, ...prev]);
      return assignment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Generate questions for an assignment (creates async job)
   */
  const generateQuestions = useCallback(async (
    assignmentId: string
  ): Promise<{ jobId: string; assignmentId: string; status: string; message: string }> => {
    setLoading(true);
    setError(null);
    try {
      const result = await assignmentService.generateQuestions(assignmentId, getTokenWrapper);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to start question generation';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Get question generation job status
   */
  const getQuestionGenerationJobStatus = useCallback(async (
    assignmentId: string,
    jobId: string
  ): Promise<{
    jobId: string;
    assignmentId: string;
    status: 'waiting' | 'active' | 'completed' | 'failed';
    progress: number;
    taskId?: string;
    questionIds?: string[];
    error?: string;
  }> => {
    try {
      return await assignmentService.getQuestionGenerationJobStatus(assignmentId, jobId, getTokenWrapper);
    } catch (err: any) {
      throw err;
    }
  }, [getTokenWrapper]);

  /**
   * Get assignment by ID
   */
  const getAssignment = useCallback(async (
    assignmentId: string
  ): Promise<Assignment & { questions?: any[]; task?: any }> => {
    setLoading(true);
    setError(null);
    try {
      const assignment = await assignmentService.getAssignment(assignmentId, getTokenWrapper);
      setAssignments(prev => {
        const existing = prev.find(a => a.assignmentId === assignmentId);
        if (existing) {
          return prev.map(a => a.assignmentId === assignmentId ? assignment : a);
        }
        return [...prev, assignment];
      });
      return assignment;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Update assignment
   */
  const updateAssignment = useCallback(async (
    assignmentId: string,
    updates: Partial<Pick<Assignment, 'title' | 'prompt' | 'settings' | 'status'>>
  ): Promise<Assignment> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await assignmentService.updateAssignment(assignmentId, updates, getTokenWrapper);
      setAssignments(prev => prev.map(a => a.assignmentId === assignmentId ? updated : a));
      return updated;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Update a question
   */
  const updateQuestion = useCallback(async (
    assignmentId: string,
    questionId: string,
    updates: Partial<{
      question: string;
      questionText?: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
    }>
  ): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await assignmentService.updateQuestion(assignmentId, questionId, updates, getTokenWrapper);
      
      // Refresh assignment to get updated questions
      const updated = await assignmentService.getAssignment(assignmentId, getTokenWrapper);
      setAssignments(prev => prev.map(a => a.assignmentId === assignmentId ? updated : a));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update question';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Publish assignment
   */
  const publishAssignment = useCallback(async (assignmentId: string): Promise<Assignment> => {
    setLoading(true);
    setError(null);
    try {
      const published = await assignmentService.publishAssignment(assignmentId, getTokenWrapper);
      setAssignments(prev => prev.map(a => a.assignmentId === assignmentId ? published : a));
      return published;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to publish assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Fetch all assignments created by current user
   */
  const fetchMyAssignments = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const myAssignments = await assignmentService.getMyAssignments(getTokenWrapper);
      setAssignments(myAssignments);
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch assignments';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Fetch published assignments
   */
  const fetchPublishedAssignments = useCallback(async (type?: AssignmentType): Promise<Assignment[]> => {
    setLoading(true);
    setError(null);
    try {
      const published = await assignmentService.getPublishedAssignments(type, getTokenWrapper);
      setAssignments(published);
      return published;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch published assignments';
      setError(errorMessage);
      return [];
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  /**
   * Delete assignment
   */
  const deleteAssignment = useCallback(async (assignmentId: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await assignmentService.deleteAssignment(assignmentId, getTokenWrapper);
      setAssignments(prev => prev.filter(a => a.assignmentId !== assignmentId));
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete assignment';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getTokenWrapper]);

  return {
    assignments,
    loading,
    error,
    createAssignment,
    generateQuestions,
    getQuestionGenerationJobStatus,
    getAssignment,
    updateAssignment,
    updateQuestion,
    publishAssignment,
    fetchMyAssignments,
    fetchPublishedAssignments,
    deleteAssignment,
  };
}
