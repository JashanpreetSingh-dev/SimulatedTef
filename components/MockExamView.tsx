import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';
import { MockExamSelectionView } from './MockExamSelectionView';
import { MockExamModuleSelector } from './MockExamModuleSelector';
import { ReadingComprehensionExam } from './ReadingComprehensionExam';
import { ListeningComprehensionExam } from './ListeningComprehensionExam';
import { OralExpressionLive } from './OralExpressionLive';
import { WrittenExpressionExam } from './writtenExpression';
import { ModuleLoadingScreen } from './ModuleLoadingScreen';
import { LoadingResult } from './LoadingResult';
import { MCQResult, SavedResult } from '../types';
import { useMockExamState } from '../hooks/useMockExamState';
import { useMockExamLoading } from '../hooks/useMockExamLoading';
import { useMockExamErrors } from '../hooks/useMockExamErrors';
import { useMockExamNavigation } from '../hooks/useMockExamNavigation';
import { useMockExamModules } from '../hooks/useMockExamModules';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const MockExamView: React.FC = () => {
  const navigate = useNavigate();
  const { mockExamId: mockExamIdParam } = useParams<{ mockExamId?: string }>();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { theme } = useTheme();
  const [loadingModules, setLoadingModules] = useState<string[]>([]);
  const [moduleResults, setModuleResults] = useState<Record<string, { resultId?: string; isLoading?: boolean; score?: number; clbLevel?: string; scoreOutOf?: number }>>({});
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // State management
  const { state, actions: stateActions } = useMockExamState();
  
  // Loading state management
  const {
    loading,
    initializing,
    loadingModule,
    isLoadingEvaluation,
    startLoading,
    stopLoading,
    setInitializing,
  } = useMockExamLoading();
  
  // Error handling
  const {
    error,
    clearError,
    handleApiError,
    setError: setErrorState,
  } = useMockExamErrors();
  
  // Navigation
  useMockExamNavigation({
    mockExamIdParam,
    onMockExamIdSet: stateActions.setMockExamId,
    onSessionIdSet: stateActions.setSessionId,
    onCompletedModulesSet: stateActions.setCompletedModules,
    onPhaseSet: stateActions.setPhase,
    onInitializingSet: setInitializing,
  });
  
  // Module operations
  const {
    startModule,
    completeReadingModule,
    completeListeningModule,
    completeOralExpressionModule,
    completeWrittenExpressionModule,
    viewModuleResults,
  } = useMockExamModules({
    mockExamId: state.mockExamId,
    sessionId: state.sessionId,
    onPhaseSet: stateActions.setPhase,
    onCompletedModulesSet: stateActions.setCompletedModules,
    onJustCompletedModuleSet: stateActions.setJustCompletedModule,
    onOralExpressionScenarioSet: stateActions.setOralExpressionScenario,
    onReadingTaskSet: stateActions.setReadingTask,
    onReadingQuestionsSet: stateActions.setReadingQuestions,
    onListeningTaskSet: stateActions.setListeningTask,
    onListeningQuestionsSet: stateActions.setListeningQuestions,
    onListeningAudioItemsSet: stateActions.setListeningAudioItems,
    onWrittenExpressionTasksSet: stateActions.setWrittenExpressionTasks,
    onClearModuleData: stateActions.clearModuleData,
    onErrorSet: setErrorState,
    onLoadingStart: (module) => startLoading('module', module),
    onLoadingStop: stopLoading,
    isLoading: isLoadingEvaluation,
  });
  
  // Handle mock exam selection
  const handleMockExamSelected = async (selectedMockExamId: string, selectedSessionId: string) => {
    console.log('handleMockExamSelected called:', { selectedMockExamId, selectedSessionId });
    navigate(`/mock-exam/${selectedMockExamId}`);
  };
  
  // Handle module selection
  const handleModuleSelect = async (module: 'oralExpression' | 'reading' | 'listening' | 'writtenExpression') => {
    console.log('Module selected:', module, { mockExamId: state.mockExamId, sessionId: state.sessionId });
    await startModule(module);
  };
  
  // Handle Oral Expression module completion
  const handleOralExpressionComplete = async (result: SavedResult) => {
    // Ensure result has mockExamId and module fields for mock exam context
    const resultWithMockExamFields: SavedResult = {
      ...result,
      mockExamId: state.mockExamId!,
      module: 'oralExpression',
    };
    
    // If evaluation is still loading, show the loading screen with steps
    if (result.isLoading) {
      // Save the placeholder result
      await completeOralExpressionModule(resultWithMockExamFields);
      // Show the evaluating screen
      stateActions.setEvaluationType('oral');
      stateActions.setPhase('evaluating');
      return;
    }
    
    // Evaluation complete - save and navigate to results
    const resultId = await completeOralExpressionModule(resultWithMockExamFields);
    stateActions.setEvaluationType(null);
    if (resultId) {
      navigate(`/results/${resultId}`);
    }
  };
  
  // Handle Reading module completion
  const handleReadingComplete = async (result: MCQResult) => {
    await completeReadingModule(result);
  };
  
  // Handle Listening module completion
  const handleListeningComplete = async (result: MCQResult) => {
    await completeListeningModule(result);
  };

  // Handle Written Expression module completion
  const handleWrittenExpressionComplete = async (result: SavedResult) => {
    // Ensure result has mockExamId and module fields for mock exam context
    const resultWithMockExamFields: SavedResult = {
      ...result,
      mockExamId: state.mockExamId!,
      module: 'writtenExpression',
    };
    
    // If evaluation is still loading, show the loading screen with steps
    if (result.isLoading) {
      await completeWrittenExpressionModule(resultWithMockExamFields);
      // Show the evaluating screen
      stateActions.setEvaluationType('written');
      stateActions.setPhase('evaluating');
      return;
    }
    
    // Evaluation complete - save and navigate to results
    const resultId = await completeWrittenExpressionModule(resultWithMockExamFields);
    stateActions.setEvaluationType(null);
    if (resultId) {
      navigate(`/results/${resultId}`);
    }
  };
  
  // Fetch module status and results
  useEffect(() => {
    // Clear any existing polling interval
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    const fetchModuleData = async (): Promise<boolean> => {
      if (!state.mockExamId || !getToken) return false;
      
      try {
        const modules = await authenticatedFetchJSON<{
          modules: Array<{ 
            name: string; 
            status: string; 
            resultId?: string; 
            isLoading?: boolean;
            score?: number;
            clbLevel?: string;
            scoreOutOf?: number;
          }>;
        }>(
          `${BACKEND_URL}/api/exam/mock/${state.mockExamId}/modules`,
          {
            method: 'GET',
            getToken,
          }
        );
        
        if (modules?.modules) {
          const loading = modules.modules
            .filter(m => m.isLoading === true)
            .map(m => m.name);
          setLoadingModules(loading);
          
          // Build results map
          const resultsMap: Record<string, any> = {};
          modules.modules.forEach(m => {
            if (m.name) {
              resultsMap[m.name] = {
                resultId: m.resultId,
                isLoading: m.isLoading,
                score: m.score,
                clbLevel: m.clbLevel,
                scoreOutOf: m.scoreOutOf,
              };
            }
          });
          setModuleResults(resultsMap);
          
          // Return whether there are any loading modules
          return loading.length > 0;
        }
      } catch (error) {
        console.error('Failed to fetch module data:', error);
        // Don't crash the component if this fails
      }
      return false;
    };
    
    if (state.phase === 'module-selector' && state.mockExamId && getToken) {
      // Initial fetch
      fetchModuleData().then((hasLoadingModules) => {
        // Only set up polling if there are loading modules
        if (hasLoadingModules) {
          pollingIntervalRef.current = setInterval(async () => {
            const stillLoading = await fetchModuleData();
            // Stop polling if no modules are loading anymore
            if (!stillLoading && pollingIntervalRef.current) {
              clearInterval(pollingIntervalRef.current);
              pollingIntervalRef.current = null;
            }
          }, 5000);
        }
      });
    }
    
    // Cleanup function
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [state.mockExamId, state.phase, getToken]);
  
  // Handle viewing results for completed modules
  const handleViewResults = async (module: 'oralExpression' | 'reading' | 'listening' | 'writtenExpression') => {
    if (!user?.id) {
      console.error('Missing user.id');
      return;
    }
    await viewModuleResults(module, user.id);
  };
  
  // Show loading state for module preparation
  if (loading && loadingModule) {
    return <ModuleLoadingScreen moduleName={loadingModule} />;
  }
  
  // Show initializing state
  if (initializing && state.phase === 'module-selector') {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-indigo-100 dark:bg-slate-900">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-300">Loading mock exam...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error && state.phase !== 'selection') {
    return (
      <div className="min-h-screen p-8 flex items-center justify-center bg-indigo-100 dark:bg-slate-900">
        <div className="max-w-md w-full p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">Error</h2>
          <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
          <button
            onClick={() => {
              clearError();
              if (state.phase !== 'selection') {
                stateActions.setPhase('module-selector');
              }
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }
  
  // Render based on phase
  console.log('MockExamView render - phase:', state.phase, 'mockExamId:', state.mockExamId);
  switch (state.phase) {
    case 'selection':
      console.log('Rendering MockExamSelectionView');
      return (
        <MockExamSelectionView
          onMockExamSelected={handleMockExamSelected}
          onCancel={() => navigate('/dashboard')}
        />
      );
    
    case 'module-selector':
      if (!state.mockExamId) {
        return (
          <div className="min-h-screen p-8 flex items-center justify-center bg-indigo-100 dark:bg-slate-900">
            <div className="text-center">
              <p className="text-slate-600 dark:text-slate-300">Loading mock exam...</p>
            </div>
          </div>
        );
      }
      return (
        <>
          {error && (
            <div className={`
              fixed top-4 left-1/2 transform -translate-x-1/2 z-50
              p-4 rounded-lg shadow-lg max-w-md
              ${theme === 'dark' ? 'bg-red-900/90 border border-red-700' : 'bg-red-50 border border-red-200'}
            `}>
              <p className={`text-center font-semibold ${theme === 'dark' ? 'text-red-200' : 'text-red-800'}`}>
                {error}
              </p>
              <button
                onClick={clearError}
                className={`
                  mt-2 w-full px-3 py-1 rounded text-sm
                  ${theme === 'dark' ? 'bg-red-800 hover:bg-red-700 text-red-100' : 'bg-red-100 hover:bg-red-200 text-red-800'}
                `}
              >
                Dismiss
              </button>
            </div>
          )}
          <MockExamModuleSelector
            mockExamId={state.mockExamId}
            completedModules={state.completedModules || []}
            loadingModules={loadingModules}
            moduleResults={moduleResults}
            onModuleSelect={handleModuleSelect}
            onViewResults={handleViewResults}
            onCancel={() => navigate('/mock-exam')}
            justCompletedModule={state.justCompletedModule}
          />
        </>
      );
    
    case 'oralExpression':
      return state.oralExpressionScenario ? (
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-3 md:p-6 transition-colors">
          <div className="max-w-6xl mx-auto">
            <button 
              onClick={() => stateActions.setPhase('module-selector')}
              className="mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider cursor-pointer"
            >
              ← Retour aux modules
            </button>
            <OralExpressionLive
              scenario={state.oralExpressionScenario}
              mode="full"
              onFinish={handleOralExpressionComplete}
            />
          </div>
        </div>
      ) : null;
    
    case 'reading':
      return state.readingTask && state.readingQuestions.length > 0 ? (
        <ReadingComprehensionExam
          task={state.readingTask}
          questions={state.readingQuestions}
          sessionId={state.sessionId!}
          mockExamId={state.mockExamId!}
          onComplete={handleReadingComplete}
          onClose={async () => {
            // For mock exams, closing should complete the module with current answers
            if (state.mockExamId && state.sessionId) {
              // Get current answers from localStorage or state
              const storageKey = `reading-${state.readingTask?.taskId}-${state.sessionId}`;
              let currentAnswers: number[] = [];
              try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                  const parsed = JSON.parse(saved);
                  currentAnswers = parsed.answers || [];
                }
              } catch (error) {
                console.error('Failed to get current answers:', error);
              }
              
              // Create MCQ result with current answers (normalized format)
              const result: MCQResult = {
                taskId: state.readingTask.taskId,
                answers: currentAnswers,
                score: 0, // Will be calculated by backend
                totalQuestions: state.readingQuestions.length,
                questionResults: state.readingQuestions.map((q, index) => {
                  const userAnswer = currentAnswers[index] ?? -1; // -1 for unanswered
                  const isCorrect = userAnswer === q.correctAnswer;
                  return {
                    questionId: q.questionId,
                    userAnswer,
                    isCorrect,
                  };
                })
              };
              
              await handleReadingComplete(result);
            } else {
              stateActions.setPhase('module-selector');
            }
          }}
        />
      ) : null;
    
    case 'listening':
      return state.listeningTask && state.listeningQuestions.length > 0 ? (
        <ListeningComprehensionExam
          task={state.listeningTask}
          questions={state.listeningQuestions}
          audioItems={state.listeningAudioItems}
          sessionId={state.sessionId!}
          mockExamId={state.mockExamId!}
          onComplete={handleListeningComplete}
          onClose={async () => {
            // For mock exams, closing should complete the module with current answers
            if (state.mockExamId && state.sessionId) {
              // Get current answers from localStorage or state
              const storageKey = `listening-${state.listeningTask?.taskId}-${state.sessionId}`;
              let currentAnswers: number[] = [];
              try {
                const saved = localStorage.getItem(storageKey);
                if (saved) {
                  const parsed = JSON.parse(saved);
                  currentAnswers = parsed.answers || [];
                }
              } catch (error) {
                console.error('Failed to get current answers:', error);
              }
              
              // Create MCQ result with current answers (normalized format)
              const result: MCQResult = {
                taskId: state.listeningTask.taskId,
                answers: currentAnswers,
                score: 0, // Will be calculated by backend
                totalQuestions: state.listeningQuestions.length,
                questionResults: state.listeningQuestions.map((q, index) => {
                  const userAnswer = currentAnswers[index] ?? -1; // -1 for unanswered
                  const isCorrect = userAnswer === q.correctAnswer;
                  return {
                    questionId: q.questionId,
                    userAnswer,
                    isCorrect,
                  };
                })
              };
              
              await handleListeningComplete(result);
            } else {
              stateActions.setPhase('module-selector');
            }
          }}
        />
      ) : null;
    
    case 'writtenExpression':
      return state.writtenExpressionTaskA && state.writtenExpressionTaskB ? (
        <WrittenExpressionExam
          taskA={state.writtenExpressionTaskA}
          taskB={state.writtenExpressionTaskB}
          title={`Mock Exam - Written Expression`}
          mockExamId={state.mockExamId!}
          onFinish={handleWrittenExpressionComplete}
        />
      ) : null;
    
    case 'evaluating':
      return <LoadingResult type={state.evaluationType || 'oral'} />;
    
    default:
      return null;
  }
};
