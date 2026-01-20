import { useState, useCallback, useEffect } from 'react';
import { useLoading } from './useLoading';

export type LoadingState = 'idle' | 'loading' | 'initializing';
export type LoadingType = 'module' | 'evaluation' | 'initialization';

export interface LoadingStateData {
  state: LoadingState;
  type: LoadingType | null;
  module: string | null;
}

export interface LoadingStateActions {
  startLoading: (type: LoadingType, module?: string) => void;
  stopLoading: () => void;
  setInitializing: (initializing: boolean) => void;
}

export function useMockExamLoading() {
  const [loadingState, setLoadingState] = useState<LoadingStateData>({
    state: 'idle',
    type: null,
    module: null,
  });

  // Use useLoading hook internally for error handling and timeout support
  const {
    isLoading: hookLoading,
    error,
    isError,
    startLoading: hookStartLoading,
    stopLoading: hookStopLoading,
  } = useLoading({
    timeout: 120000, // 2 minutes timeout
  });
  
  const startLoading = useCallback((type: LoadingType, module?: string) => {
    setLoadingState({
      state: 'loading',
      type,
      module: module || null,
    });
    hookStartLoading(`Loading ${type}${module ? `: ${module}` : ''}`);
  }, [hookStartLoading]);
  
  const stopLoading = useCallback(() => {
    setLoadingState({
      state: 'idle',
      type: null,
      module: null,
    });
    hookStopLoading(true);
  }, [hookStopLoading]);
  
  const setInitializing = useCallback((initializing: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      state: initializing ? 'initializing' : 'idle',
      type: initializing ? 'initialization' : null,
    }));
    if (initializing) {
      hookStartLoading('Initializing...');
    } else {
      hookStopLoading(true);
    }
  }, [hookStartLoading, hookStopLoading]);
  
  const isLoading = loadingState.state === 'loading' || hookLoading;
  const isInitializing = loadingState.state === 'initializing';
  const isLoadingModule = loadingState.type === 'module';
  const isLoadingEvaluation = loadingState.type === 'evaluation';
  
  const actions: LoadingStateActions = {
    startLoading,
    stopLoading,
    setInitializing,
  };
  
  return {
    // Existing API (maintain for backward compatibility)
    loading: isLoading,
    initializing: isInitializing,
    loadingModule: loadingState.module,
    isLoadingEvaluation,
    isLoadingModule,
    ...actions,
    // New additions
    error,
    isError,
  };
}
