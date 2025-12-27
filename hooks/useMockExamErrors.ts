import { useState, useCallback } from 'react';

export interface ErrorState {
  error: string | null;
  errorCode?: string;
  recoverable: boolean;
}

export interface ErrorActions {
  setError: (error: string | null, errorCode?: string, recoverable?: boolean) => void;
  clearError: () => void;
  handleApiError: (error: any, defaultMessage?: string) => void;
}

export function useMockExamErrors() {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    recoverable: true,
  });
  
  const setError = useCallback((error: string | null, errorCode?: string, recoverable: boolean = true) => {
    setErrorState({
      error,
      errorCode,
      recoverable,
    });
  }, []);
  
  const clearError = useCallback(() => {
    setErrorState({
      error: null,
      recoverable: true,
    });
  }, []);
  
  const handleApiError = useCallback((error: any, defaultMessage: string = 'An error occurred. Please try again.') => {
    let errorMessage = defaultMessage;
    let errorCode: string | undefined;
    
    if (error instanceof Error) {
      errorMessage = error.message || defaultMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error?.message) {
      errorMessage = error.message;
      errorCode = error.code || error.statusCode;
    }
    
    setError(errorMessage, errorCode, true);
  }, [setError]);
  
  const actions: ErrorActions = {
    setError,
    clearError,
    handleApiError,
  };
  
  return {
    error: errorState.error,
    errorCode: errorState.errorCode,
    recoverable: errorState.recoverable,
    ...actions,
  };
}
