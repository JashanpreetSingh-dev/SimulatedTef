import { useState, useRef, useCallback, useEffect } from 'react';
import type { LoadingState, LoadingStatus } from '../components/common/Loading/types';

export interface UseLoadingOptions {
  minDuration?: number; // Minimum duration to show loading (prevents flash)
  timeout?: number; // Timeout in milliseconds
  timeoutWarningThreshold?: number; // Percentage (0-1) of timeout to show warning (default: 0.8)
  onError?: (error: Error) => void;
  onSuccess?: () => void;
  onTimeoutWarning?: () => void; // Called when approaching timeout
  onRetry?: () => void | Promise<void>; // Retry function
}

export function useLoading(options: UseLoadingOptions = {}) {
  const {
    minDuration = 300,
    timeout,
    timeoutWarningThreshold = 0.8,
    onError,
    onSuccess,
    onTimeoutWarning,
    onRetry,
  } = options;

  const [state, setState] = useState<LoadingState>({
    status: 'idle',
    progress: 0,
    message: undefined,
    error: undefined,
  });

  const [isTimeoutWarning, setIsTimeoutWarning] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const startTimeRef = useRef<number | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutWarningRef = useRef<NodeJS.Timeout | null>(null);
  const minDurationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timeRemainingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Store callbacks in refs to avoid dependency issues
  const onErrorRef = useRef(onError);
  const onSuccessRef = useRef(onSuccess);
  const onTimeoutWarningRef = useRef(onTimeoutWarning);
  const onRetryRef = useRef(onRetry);
  
  // Update refs when callbacks change
  useEffect(() => {
    onErrorRef.current = onError;
    onSuccessRef.current = onSuccess;
    onTimeoutWarningRef.current = onTimeoutWarning;
    onRetryRef.current = onRetry;
  }, [onError, onSuccess, onTimeoutWarning, onRetry]);

  // Clear timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (timeoutWarningRef.current) {
        clearTimeout(timeoutWarningRef.current);
      }
      if (minDurationTimeoutRef.current) {
        clearTimeout(minDurationTimeoutRef.current);
      }
      if (timeRemainingIntervalRef.current) {
        clearInterval(timeRemainingIntervalRef.current);
      }
    };
  }, []);

  const startLoading = useCallback((message?: string) => {
    startTimeRef.current = Date.now();
    setIsTimeoutWarning(false);
    setTimeRemaining(timeout || null);
    
    setState({
      status: 'loading',
      progress: 0,
      message,
      error: undefined,
    });

    // Set timeout if provided
    if (timeout) {
      // Set timeout warning
      const warningTime = timeout * timeoutWarningThreshold;
      timeoutWarningRef.current = setTimeout(() => {
        setIsTimeoutWarning(true);
        if (onTimeoutWarningRef.current) {
          onTimeoutWarningRef.current();
        }
      }, warningTime);

      // Set actual timeout
      timeoutRef.current = setTimeout(() => {
        const timeoutError = new Error('Operation timed out');
        setState(prev => ({
          ...prev,
          status: 'error',
          error: timeoutError,
        }));
        setIsTimeoutWarning(false);
        setTimeRemaining(null);
        if (onErrorRef.current) {
          onErrorRef.current(timeoutError);
        }
      }, timeout);

      // Update time remaining every second
      timeRemainingIntervalRef.current = setInterval(() => {
        if (startTimeRef.current) {
          const elapsed = Date.now() - startTimeRef.current;
          const remaining = Math.max(0, timeout - elapsed);
          setTimeRemaining(remaining);
          if (remaining === 0) {
            if (timeRemainingIntervalRef.current) {
              clearInterval(timeRemainingIntervalRef.current);
            }
          }
        }
      }, 1000);
    }
  }, [timeout, timeoutWarningThreshold]);

  const stopLoading = useCallback((success: boolean = true, error?: Error) => {
    const elapsed = startTimeRef.current
      ? Date.now() - startTimeRef.current
      : 0;
    const remaining = Math.max(0, minDuration - elapsed);

    // Clear all timeouts and intervals
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (timeoutWarningRef.current) {
      clearTimeout(timeoutWarningRef.current);
      timeoutWarningRef.current = null;
    }
    if (timeRemainingIntervalRef.current) {
      clearInterval(timeRemainingIntervalRef.current);
      timeRemainingIntervalRef.current = null;
    }
    setIsTimeoutWarning(false);
    setTimeRemaining(null);

    // Wait for minimum duration if needed
    if (remaining > 0) {
      minDurationTimeoutRef.current = setTimeout(() => {
        setState({
          status: success ? 'success' : 'error',
          progress: success ? 100 : 0,
          error: error,
          message: undefined,
        });

        if (success && onSuccessRef.current) {
          onSuccessRef.current();
        } else if (error && onErrorRef.current) {
          onErrorRef.current(error);
        }

        // Reset to idle after a brief moment
        setTimeout(() => {
          setState({
            status: 'idle',
            progress: 0,
            message: undefined,
            error: undefined,
          });
        }, 1000);
      }, remaining);
    } else {
      setState({
        status: success ? 'success' : 'error',
        progress: success ? 100 : 0,
        error: error,
        message: undefined,
      });

      if (success && onSuccess) {
        onSuccess();
      } else if (error && onError) {
        onError(error);
      }

      // Reset to idle after a brief moment
      setTimeout(() => {
        setState({
          status: 'idle',
          progress: 0,
          message: undefined,
          error: undefined,
        });
      }, 1000);
    }
  }, [minDuration]);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState(prev => {
      // Only update if currently loading
      if (prev.status === 'loading') {
        return {
          ...prev,
          progress: Math.min(100, Math.max(0, progress)),
          message: message !== undefined ? message : prev.message,
        };
      }
      return prev;
    });
  }, []);

  const retry = useCallback(async () => {
    if (onRetryRef.current) {
      await onRetryRef.current();
    } else {
      // Default retry: restart loading with same message
      const message = state.message;
      startLoading(message);
    }
  }, [state.message, startLoading]);

  return {
    ...state,
    isLoading: state.status === 'loading',
    isError: state.status === 'error',
    isSuccess: state.status === 'success',
    isTimeoutWarning,
    timeRemaining,
    startLoading,
    stopLoading,
    updateProgress,
    retry,
  };
}
