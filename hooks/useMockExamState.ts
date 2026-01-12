import { useState, useCallback } from 'react';
import { ReadingTask, ListeningTask, ReadingListeningQuestion, TEFTask, WrittenTask } from '../types';
import { AudioItemMetadata } from '../services/tasks';

export type MockExamPhase = 'selection' | 'module-selector' | 'oralExpression' | 'reading' | 'listening' | 'writtenExpression' | 'loading' | 'evaluating';

export type EvaluationType = 'oral' | 'written' | null;

export interface MockExamState {
  phase: MockExamPhase;
  mockExamId: string | null;
  sessionId: string | null;
  completedModules: string[];
  error: string | null;
  justCompletedModule: string | null;
  evaluationType: EvaluationType; // Track which type of evaluation is in progress
  
  // Module data
  oralExpressionScenario: { officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string; mockExamId?: string } | null;
  readingTask: ReadingTask | null;
  readingQuestions: ReadingListeningQuestion[];
  listeningTask: ListeningTask | null;
  listeningQuestions: ReadingListeningQuestion[];
  listeningAudioItems: AudioItemMetadata[] | null;
  writtenExpressionTaskA: WrittenTask | null;
  writtenExpressionTaskB: WrittenTask | null;
}

export interface MockExamStateActions {
  setPhase: (phase: MockExamPhase) => void;
  setMockExamId: (id: string | null) => void;
  setSessionId: (id: string | null) => void;
  setCompletedModules: (modules: string[]) => void;
  setError: (error: string | null) => void;
  setJustCompletedModule: (module: string | null) => void;
  setEvaluationType: (type: EvaluationType) => void;
  
  // Module data setters
  setOralExpressionScenario: (scenario: { officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string; mockExamId?: string } | null) => void;
  setReadingTask: (task: ReadingTask | null) => void;
  setReadingQuestions: (questions: ReadingListeningQuestion[]) => void;
  setListeningTask: (task: ListeningTask | null) => void;
  setListeningQuestions: (questions: ReadingListeningQuestion[]) => void;
  setListeningAudioItems: (audioItems: AudioItemMetadata[] | null) => void;
  setWrittenExpressionTasks: (taskA: WrittenTask | null, taskB: WrittenTask | null) => void;
  
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
  const [evaluationType, setEvaluationType] = useState<EvaluationType>(null);
  
  // Module data
  const [oralExpressionScenario, setOralExpressionScenario] = useState<{ officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string; mockExamId?: string } | null>(null);
  const [readingTask, setReadingTask] = useState<ReadingTask | null>(null);
  const [readingQuestions, setReadingQuestions] = useState<ReadingListeningQuestion[]>([]);
  const [listeningTask, setListeningTask] = useState<ListeningTask | null>(null);
  const [listeningQuestions, setListeningQuestions] = useState<ReadingListeningQuestion[]>([]);
  const [listeningAudioItems, setListeningAudioItems] = useState<AudioItemMetadata[] | null>(null);
  const [writtenExpressionTaskA, setWrittenExpressionTaskA] = useState<WrittenTask | null>(null);
  const [writtenExpressionTaskB, setWrittenExpressionTaskB] = useState<WrittenTask | null>(null);
  
  const setWrittenExpressionTasks = useCallback((taskA: WrittenTask | null, taskB: WrittenTask | null) => {
    setWrittenExpressionTaskA(taskA);
    setWrittenExpressionTaskB(taskB);
  }, []);
  
  // Utility actions
  const clearModuleData = useCallback(() => {
    setOralExpressionScenario(null);
    setReadingTask(null);
    setReadingQuestions([]);
    setListeningTask(null);
    setListeningQuestions([]);
    setListeningAudioItems(null);
    setWrittenExpressionTaskA(null);
    setWrittenExpressionTaskB(null);
  }, []);
  
  const resetState = useCallback(() => {
    setPhase('selection');
    setMockExamId(null);
    setSessionId(null);
    setCompletedModules([]);
    setError(null);
    setJustCompletedModule(null);
    setEvaluationType(null);
    clearModuleData();
  }, [clearModuleData]);
  
  const state: MockExamState = {
    phase,
    mockExamId,
    sessionId,
    completedModules,
    error,
    justCompletedModule,
    evaluationType,
    oralExpressionScenario,
    readingTask,
    readingQuestions,
    listeningTask,
    listeningQuestions,
    listeningAudioItems,
    writtenExpressionTaskA,
    writtenExpressionTaskB,
  };
  
  const actions: MockExamStateActions = {
    setPhase,
    setMockExamId,
    setSessionId,
    setCompletedModules,
    setError,
    setJustCompletedModule,
    setEvaluationType,
    setOralExpressionScenario,
    setReadingTask,
    setReadingQuestions,
    setListeningTask,
    setListeningQuestions,
    setListeningAudioItems,
    setWrittenExpressionTasks,
    clearModuleData,
    resetState,
  };
  
  return { state, actions };
}
