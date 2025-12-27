import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { SavedResult } from '../types';
import { useUsage } from './useUsage';

interface UseExamResultOptions {
  onSuccess?: (result: SavedResult) => void;
  onError?: (error: Error | string) => void;
  autoNavigate?: boolean; // Whether to automatically navigate to result page
  sessionId?: string; // Exam session ID to mark as completed
  mockExamId?: string; // Mock exam ID if this is part of a mock exam
  module?: 'oralExpression' | 'reading' | 'listening'; // Module type for mock exams
}

export const useExamResult = (options: UseExamResultOptions = {}) => {
  const { onSuccess, onError, autoNavigate = true, sessionId } = options;
  const navigate = useNavigate();
  const { completeSession } = useUsage();
  const [result, setResult] = useState<SavedResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResult = useCallback((savedResult: SavedResult) => {
    setResult(savedResult);

    if (savedResult.isLoading) {
      // Result is still loading - show loading state
      setIsLoading(true);
      return;
    }

    // Result is complete
    setIsLoading(false);

    // Check if result indicates an error (has error message in feedback)
    if (savedResult.feedback?.startsWith('Erreur:')) {
      const error = new Error(savedResult.feedback);
      if (onError) {
        onError(error);
      }
      // Mark session as failed if there was an error
      if (sessionId) {
        completeSession(sessionId, savedResult._id, 'failed').catch(err => {
          console.error('Failed to mark exam session as failed:', err);
        });
      }
      return;
    }

    // Mark session as completed if sessionId is provided
    if (sessionId && savedResult._id && !savedResult._id.startsWith('temp-')) {
      completeSession(sessionId, savedResult._id, 'completed').catch(err => {
        console.error('Failed to complete session:', err);
      });
    }

    // Call success callback if provided
    if (onSuccess) {
      onSuccess(savedResult);
    }

    // Auto-navigate to result page if enabled and result has valid ID
    if (autoNavigate && savedResult._id && !savedResult._id.startsWith('temp-')) {
      navigate(`/results/${savedResult._id}`);
    }
  }, [navigate, onSuccess, onError, autoNavigate, sessionId, completeSession]);

  const handleError = useCallback((error: Error | string) => {
    setIsLoading(false);
    const errorObj = error instanceof Error ? error : new Error(error);
    if (onError) {
      onError(errorObj);
    }
  }, [onError]);

  const clearResult = useCallback(() => {
    setResult(null);
    setIsLoading(false);
  }, []);

  return {
    result,
    isLoading,
    handleResult,
    handleError,
    clearResult,
  };
};

