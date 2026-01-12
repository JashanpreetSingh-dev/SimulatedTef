import { useState, useCallback } from 'react';

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
  
  const startLoading = useCallback((type: LoadingType, module?: string) => {
    setLoadingState({
      state: 'loading',
      type,
      module: module || null,
    });
  }, []);
  
  const stopLoading = useCallback(() => {
    setLoadingState({
      state: 'idle',
      type: null,
      module: null,
    });
  }, []);
  
  const setInitializing = useCallback((initializing: boolean) => {
    setLoadingState(prev => ({
      ...prev,
      state: initializing ? 'initializing' : 'idle',
      type: initializing ? 'initialization' : null,
    }));
  }, []);
  
  const isLoading = loadingState.state === 'loading';
  const isInitializing = loadingState.state === 'initializing';
  const isLoadingModule = loadingState.type === 'module';
  const isLoadingEvaluation = loadingState.type === 'evaluation';
  
  const actions: LoadingStateActions = {
    startLoading,
    stopLoading,
    setInitializing,
  };
  
  return {
    loading: isLoading,
    initializing: isInitializing,
    loadingModule: loadingState.module,
    isLoadingEvaluation,
    isLoadingModule,
    ...actions,
  };
}
