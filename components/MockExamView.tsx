import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { MockExamSelectionView } from './MockExamSelectionView';
import { MockExamModuleSelector } from './MockExamModuleSelector';
import { ReadingComprehensionExam } from './ReadingComprehensionExam';
import { ListeningComprehensionExam } from './ListeningComprehensionExam';
import { ModuleLoadingScreen } from './ModuleLoadingScreen';
import { MCQResult } from '../types';
import { useMockExamState } from '../hooks/useMockExamState';
import { useMockExamLoading } from '../hooks/useMockExamLoading';
import { useMockExamErrors } from '../hooks/useMockExamErrors';
import { useMockExamNavigation } from '../hooks/useMockExamNavigation';
import { useMockExamModules } from '../hooks/useMockExamModules';

export const MockExamView: React.FC = () => {
  const navigate = useNavigate();
  const { mockExamId: mockExamIdParam } = useParams<{ mockExamId?: string }>();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { theme } = useTheme();
  
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
    viewModuleResults,
  } = useMockExamModules({
    mockExamId: state.mockExamId,
    sessionId: state.sessionId,
    onPhaseSet: stateActions.setPhase,
    onCompletedModulesSet: stateActions.setCompletedModules,
    onJustCompletedModuleSet: stateActions.setJustCompletedModule,
    onReadingTaskSet: stateActions.setReadingTask,
    onReadingQuestionsSet: stateActions.setReadingQuestions,
    onListeningTaskSet: stateActions.setListeningTask,
    onListeningQuestionsSet: stateActions.setListeningQuestions,
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
  const handleModuleSelect = async (module: 'reading' | 'listening') => {
    console.log('Module selected:', module, { mockExamId: state.mockExamId, sessionId: state.sessionId });
    await startModule(module);
  };
  
  // Handle Reading module completion
  const handleReadingComplete = async (result: MCQResult) => {
    await completeReadingModule(result);
  };
  
  // Handle Listening module completion
  const handleListeningComplete = async (result: MCQResult) => {
    await completeListeningModule(result);
  };
  
  // Handle viewing results for completed modules
  const handleViewResults = async (module: 'reading' | 'listening') => {
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
  console.log('MockExamView render - phase:', state.phase);
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
            mockExamId={state.mockExamId!}
            completedModules={state.completedModules}
            onModuleSelect={handleModuleSelect}
            onViewResults={handleViewResults}
            onCancel={() => navigate('/mock-exam')}
            justCompletedModule={state.justCompletedModule}
          />
        </>
      );
    
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
              
              // Create MCQ result with current answers
              const result: MCQResult = {
                taskId: state.readingTask.taskId,
                answers: currentAnswers,
                score: 0, // Will be calculated by backend
                totalQuestions: state.readingQuestions.length,
                questionResults: state.readingQuestions.map((q, index) => ({
                  questionId: q.questionId,
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  userAnswer: currentAnswers[index] ?? -1, // -1 for unanswered
                  isCorrect: false, // Will be calculated by backend
                  explanation: q.explanation || ''
                }))
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
              
              // Create MCQ result with current answers
              const result: MCQResult = {
                taskId: state.listeningTask.taskId,
                answers: currentAnswers,
                score: 0, // Will be calculated by backend
                totalQuestions: state.listeningQuestions.length,
                questionResults: state.listeningQuestions.map((q, index) => ({
                  questionId: q.questionId,
                  question: q.question,
                  options: q.options,
                  correctAnswer: q.correctAnswer,
                  userAnswer: currentAnswers[index] ?? -1, // -1 for unanswered
                  isCorrect: false, // Will be calculated by backend
                  explanation: q.explanation || ''
                }))
              };
              
              await handleListeningComplete(result);
            } else {
              stateActions.setPhase('module-selector');
            }
          }}
        />
      ) : null;
    
    default:
      return null;
  }
};
