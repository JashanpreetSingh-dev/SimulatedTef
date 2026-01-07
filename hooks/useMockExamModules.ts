import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';
import { getReadingTaskWithQuestions, getListeningTaskWithQuestions, AudioItemMetadata } from '../services/tasks';
import { MCQResult, ReadingTask, ListeningTask, ReadingListeningQuestion, SavedResult, TEFTask, WrittenTask } from '../types';
import { MockExamPhase } from './useMockExamState';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface ModuleStartData {
  oralExpression?: { scenario: { officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string; mockExamId?: string } };
  reading?: { task: ReadingTask; questions: ReadingListeningQuestion[] };
  listening?: { task: ListeningTask; questions: ReadingListeningQuestion[]; audioItems?: AudioItemMetadata[] | null };
  writtenExpression?: { tasks: { taskA: WrittenTask; taskB: WrittenTask }; title: string };
}

export interface UseMockExamModulesOptions {
  mockExamId: string | null;
  sessionId: string | null;
  onPhaseSet: (phase: MockExamPhase) => void;
  onCompletedModulesSet: (modules: string[]) => void;
  onJustCompletedModuleSet: (module: string | null) => void;
  onOralExpressionScenarioSet: (scenario: { officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string; mockExamId?: string } | null) => void;
  onReadingTaskSet: (task: ReadingTask | null) => void;
  onReadingQuestionsSet: (questions: ReadingListeningQuestion[]) => void;
  onListeningTaskSet: (task: ListeningTask | null) => void;
  onListeningQuestionsSet: (questions: ReadingListeningQuestion[]) => void;
  onListeningAudioItemsSet: (audioItems: AudioItemMetadata[] | null) => void;
  onWrittenExpressionTasksSet: (taskA: WrittenTask | null, taskB: WrittenTask | null) => void;
  onClearModuleData: () => void;
  onErrorSet: (error: string | null) => void;
  onLoadingStart: (module: string) => void;
  onLoadingStop: () => void;
  isLoading?: boolean;
}

export function useMockExamModules({
  mockExamId,
  sessionId,
  onPhaseSet,
  onCompletedModulesSet,
  onJustCompletedModuleSet,
  onOralExpressionScenarioSet,
  onReadingTaskSet,
  onReadingQuestionsSet,
  onListeningTaskSet,
  onListeningQuestionsSet,
  onListeningAudioItemsSet,
  onWrittenExpressionTasksSet,
  onClearModuleData,
  onErrorSet,
  onLoadingStart,
  onLoadingStop,
  isLoading = false,
}: UseMockExamModulesOptions) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const refreshModuleStatus = useCallback(async (): Promise<string[]> => {
    if (!mockExamId) return [];
    
    try {
      const status = await authenticatedFetchJSON<{
        mockExamId: string;
        completedModules: string[];
        availableModules: string[];
      }>(
        `${BACKEND_URL}/api/exam/mock/${mockExamId}/status`,
        {
          method: 'GET',
          getToken,
        }
      );
      
      const completedModules = status.completedModules || [];
      onCompletedModulesSet(completedModules);
      return completedModules;
    } catch (error) {
      console.error('Failed to refresh mock exam status:', error);
      return [];
    }
  }, [mockExamId, getToken, onCompletedModulesSet]);
  
  const handleModuleComplete = useCallback(async (completedModuleName?: string) => {
    // Refresh completed modules after completion
    const completedModules = await refreshModuleStatus();
    
    // Show success message if a module name is provided (assume it was just completed)
    if (completedModuleName) {
      onJustCompletedModuleSet(completedModuleName);
      // Clear the message after 5 seconds
      setTimeout(() => onJustCompletedModuleSet(null), 5000);
    }
    
    // Return to module selector (don't change URL, we're already on the correct route)
    onPhaseSet('module-selector');
    onClearModuleData();
  }, [refreshModuleStatus, onJustCompletedModuleSet, onPhaseSet, onClearModuleData]);
  
  const startModule = useCallback(async (module: 'oralExpression' | 'reading' | 'listening' | 'writtenExpression'): Promise<ModuleStartData | null> => {
    if (!mockExamId || !sessionId) {
      const errorMsg = `Cannot start module: ${!mockExamId ? 'Mock exam not selected' : 'Session not initialized'}`;
      console.error(errorMsg);
      onErrorSet(errorMsg);
      return null;
    }
    
    onLoadingStart(module);
    onErrorSet(null);
    
    try {
      // Start the module
      const moduleData = await authenticatedFetchJSON<{
        sessionId: string;
        task?: ReadingTask | ListeningTask;
        questions?: ReadingListeningQuestion[];
        scenario?: { officialTasks: { partA: TEFTask; partB: TEFTask }; mode: 'full'; title: string; mockExamId?: string };
        tasks?: { taskA: WrittenTask; taskB: WrittenTask };
        title?: string;
      }>(
        `${BACKEND_URL}/api/exam/start-module`,
        {
          method: 'POST',
          getToken,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mockExamId,
            module,
          }),
        }
      );
      
      if (module === 'oralExpression') {
        if (moduleData.scenario) {
          onOralExpressionScenarioSet(moduleData.scenario);
          onPhaseSet('oralExpression');
          return { oralExpression: { scenario: moduleData.scenario } };
        } else {
          throw new Error('Failed to fetch oral expression scenario');
        }
      } else if (module === 'reading') {
        let task: ReadingTask;
        let questions: ReadingListeningQuestion[];
        
        if (moduleData.task && moduleData.questions) {
          task = moduleData.task as ReadingTask;
          questions = moduleData.questions;
        } else {
          // Fetch task and questions separately
          const taskData = await getReadingTaskWithQuestions(
            (moduleData.task as ReadingTask).taskId,
            getToken
          );
          if (!taskData) {
            throw new Error('Failed to fetch reading task');
          }
          task = taskData.task;
          questions = taskData.questions;
        }
        
        onReadingTaskSet(task);
        onReadingQuestionsSet(questions);
        onPhaseSet('reading');
        return { reading: { task, questions } };
      } else if (module === 'listening') {
        let task: ListeningTask;
        let questions: ReadingListeningQuestion[];
        let audioItems: AudioItemMetadata[] | null = null;
        
        if (moduleData.task && moduleData.questions) {
          task = moduleData.task as ListeningTask;
          questions = moduleData.questions;
          // audioItems may be in moduleData (from API response)
          audioItems = (moduleData as any).audioItems || null;
        } else {
          // Fetch task and questions separately
          const taskData = await getListeningTaskWithQuestions(
            (moduleData.task as ListeningTask).taskId,
            getToken
          );
          if (!taskData) {
            throw new Error('Failed to fetch listening task');
          }
          task = taskData.task;
          questions = taskData.questions;
          audioItems = taskData.audioItems || null;
        }
        
        // Store audioItems in state
        onListeningAudioItemsSet(audioItems);
        
        onListeningTaskSet(task);
        onListeningQuestionsSet(questions);
        onPhaseSet('listening');
        return { listening: { task, questions, audioItems } };
      } else if (module === 'writtenExpression') {
        if (moduleData.tasks && moduleData.title) {
          onWrittenExpressionTasksSet(moduleData.tasks.taskA, moduleData.tasks.taskB);
          onPhaseSet('writtenExpression');
          return { writtenExpression: { tasks: moduleData.tasks, title: moduleData.title } };
        } else {
          throw new Error('Failed to fetch written expression tasks');
        }
      }
      
      return null;
    } catch (error: any) {
      console.error('Failed to start module:', error);
      onErrorSet(error?.message || 'Failed to start module. Please try again.');
      return null;
    } finally {
      onLoadingStop();
    }
  }, [
    mockExamId,
    sessionId,
    getToken,
    onErrorSet,
    onLoadingStart,
    onLoadingStop,
    onOralExpressionScenarioSet,
    onReadingTaskSet,
    onReadingQuestionsSet,
    onListeningTaskSet,
    onListeningQuestionsSet,
    onWrittenExpressionTasksSet,
    onPhaseSet,
  ]);
  
  const completeModule = useCallback(async (
    module: 'oralExpression' | 'reading' | 'listening' | 'writtenExpression',
    result: SavedResult | MCQResult | { clbLevel: string; feedback: string; strengths: string[]; weaknesses: string[] }
  ): Promise<string | null> => {
    if (!mockExamId || !sessionId) {
      console.error('Cannot complete module: missing mockExamId or sessionId');
      return null;
    }
    
    try {
      const response = await authenticatedFetchJSON<{ resultId: string }>(
        `${BACKEND_URL}/api/exam/complete-module`,
        {
          method: 'POST',
          getToken,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mockExamId,
            module,
            result,
          }),
        }
      );
      
      await handleModuleComplete(module);
      return response.resultId || null;
    } catch (error) {
      console.error(`Failed to complete ${module} module:`, error);
      onErrorSet(`Failed to save ${module} results. Please try again.`);
      return null;
    }
  }, [mockExamId, sessionId, getToken, handleModuleComplete, onErrorSet]);
  
  const completeReadingModule = useCallback(async (result: MCQResult): Promise<string | null> => {
    const resultId = await completeModule('reading', result);
    // Navigate to results page immediately for reading
    if (resultId) {
      navigate(`/results/${resultId}`);
    }
    return resultId;
  }, [completeModule, navigate]);
  
  const completeListeningModule = useCallback(async (result: MCQResult): Promise<string | null> => {
    const resultId = await completeModule('listening', result);
    // Navigate to results page immediately for listening
    if (resultId) {
      navigate(`/results/${resultId}`);
    }
    return resultId;
  }, [completeModule, navigate]);
  
  const completeOralExpressionModule = useCallback(async (result: SavedResult): Promise<string | null> => {
    const resultId = await completeModule('oralExpression', result);
    // For mock exams, don't navigate to results page - return to module selector
    // The module selector will show loading state if result.isLoading is true
    // If result.isLoading is false, the module is already completed and can view results
    return resultId;
  }, [completeModule]);
  
  const completeWrittenExpressionModule = useCallback(async (result: SavedResult): Promise<string | null> => {
    const resultId = await completeModule('writtenExpression', result);
    // For mock exams, don't navigate to results page - return to module selector
    return resultId;
  }, [completeModule]);

  const viewModuleResults = useCallback(async (
    module: 'oralExpression' | 'reading' | 'listening' | 'writtenExpression',
    userId: string
  ): Promise<void> => {
    if (!mockExamId || !userId) {
      console.error('Missing mockExamId or user.id:', { mockExamId, userId });
      return;
    }
    
    try {
      // First try to fetch results for this specific mock exam and module
      console.log(`🔍 Fetching results for mockExamId=${mockExamId}, module=${module}`);
      const response = await authenticatedFetchJSON<{ results: SavedResult[]; pagination?: any }>(
        `${BACKEND_URL}/api/results/${userId}?mockExamId=${mockExamId}&module=${module}&resultType=mockExam&populateTasks=true`,
        {
          method: 'GET',
          getToken,
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        }
      );
      
      // Handle paginated response format
      const filteredResults = Array.isArray(response) ? response : (response.results || []);
      
      console.log('📦 Filtered results:', filteredResults);
      
      if (filteredResults && Array.isArray(filteredResults) && filteredResults.length > 0) {
        // Navigate to the first (most recent) result for this module
        console.log('✅ Found result, navigating to:', filteredResults[0]._id);
        navigate(`/results/${filteredResults[0]._id}`);
      } else {
        console.log('❌ No filtered results found, trying all results...');
        
        // If no filtered results, try fetching all results to debug
        const allResponse = await authenticatedFetchJSON<{ results: SavedResult[]; pagination?: any }>(
          `${BACKEND_URL}/api/results/${userId}?resultType=mockExam&populateTasks=true`,
          {
            method: 'GET',
            getToken,
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          }
        );
        
        // Handle paginated response format
        const allResults = Array.isArray(allResponse) ? allResponse : (allResponse.results || []);
        
        console.log('📋 All user results:', allResults);
        
        // Look for results with both mockExamId and module
        const bothResults = allResults.filter(r => r.mockExamId === mockExamId && r.module === module);
        console.log('🎪 Results with both mockExamId and module:', bothResults);
        
        if (bothResults.length > 0) {
          console.log('✅ Found result with both filters, navigating to:', bothResults[0]._id);
          navigate(`/results/${bothResults[0]._id}`);
        } else {
          console.error('❌ No results found with both mockExamId and module');
        }
      }
    } catch (error) {
      console.error('💥 Error fetching results:', error);
    }
  }, [mockExamId, getToken, navigate]);
  
  return {
    startModule,
    completeReadingModule,
    completeListeningModule,
    completeOralExpressionModule,
    completeWrittenExpressionModule,
    viewModuleResults,
    refreshModuleStatus,
    handleModuleComplete,
  };
}
