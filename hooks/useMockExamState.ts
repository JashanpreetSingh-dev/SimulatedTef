import { useState, useCallback } from 'react';
import { ReadingTask, ListeningTask, ReadingListeningQuestion, TEFTask } from '../types';

export type MockExamPhase = 'selection' | 'module-selector' | 'oralExpression' | 'reading' | 'listening' | 'loading';

export interface MockExamState {
  phase: MockExamPhase;
  mockExamId: string | null;
  sessionId: string | null;
  completedModules: string[];
  error: string | null;
  justCompletedModule: string | null;
  
  // Module data
  oralExpressionScenario: { officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string } | null;
  readingTask: ReadingTask | null;
  readingQuestions: ReadingListeningQuestion[];
  listeningTask: ListeningTask | null;
  listeningQuestions: ReadingListeningQuestion[];
}

export interface MockExamStateActions {
  setPhase: (phase: MockExamPhase) => void;
  setMockExamId: (id: string | null) => void;
  setSessionId: (id: string | null) => void;
  setCompletedModules: (modules: string[]) => void;
  setError: (error: string | null) => void;
  setJustCompletedModule: (module: string | null) => void;
  
  // Module data setters
  setOralExpressionScenario: (scenario: { officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string } | null) => void;
  setReadingTask: (task: ReadingTask | null) => void;
  setReadingQuestions: (questions: ReadingListeningQuestion[]) => void;
  setListeningTask: (task: ListeningTask | null) => void;
  setListeningQuestions: (questions: ReadingListeningQuestion[]) => void;
  
  // Utility actions
  clearModuleData: () => void;
  resetState: () => void;
}

export function useMockExamState() {
  const [phase, setPhase] = useState<MockExamPhase>('selection');
  const [mockExamId, setMockExamId] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [completedModules, setCompletedModules] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [justCompletedModule, setJustCompletedModule] = useState<string | null>(null);
  
  // Module data
  const [oralExpressionScenario, setOralExpressionScenario] = useState<{ officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string } | null>(null);
  const [readingTask, setReadingTask] = useState<ReadingTask | null>(null);
  const [readingQuestions, setReadingQuestions] = useState<ReadingListeningQuestion[]>([]);
  const [listeningTask, setListeningTask] = useState<ListeningTask | null>(null);
  const [listeningQuestions, setListeningQuestions] = useState<ReadingListeningQuestion[]>([]);
  
  // Utility actions
  const clearModuleData = useCallback(() => {
    setOralExpressionScenario(null);
    setReadingTask(null);
    setReadingQuestions([]);
    setListeningTask(null);
    setListeningQuestions([]);
  }, []);
  
  const resetState = useCallback(() => {
    setPhase('selection');
    setMockExamId(null);
    setSessionId(null);
    setCompletedModules([]);
    setError(null);
    setJustCompletedModule(null);
    clearModuleData();
  }, [clearModuleData]);
  
  const state: MockExamState = {
    phase,
    mockExamId,
    sessionId,
    completedModules,
    error,
    justCompletedModule,
    oralExpressionScenario,
    readingTask,
    readingQuestions,
    listeningTask,
    listeningQuestions,
  };
  
  const actions: MockExamStateActions = {
    setPhase,
    setMockExamId,
    setSessionId,
    setCompletedModules,
    setError,
    setJustCompletedModule,
    setOralExpressionScenario,
    setReadingTask,
    setReadingQuestions,
    setListeningTask,
    setListeningQuestions,
    clearModuleData,
    resetState,
  };
  
  return { state, actions };
}
