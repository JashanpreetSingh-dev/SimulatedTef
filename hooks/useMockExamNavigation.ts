import { useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';
import { MockExamPhase } from './useMockExamState';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface MockExamNavigationActions {
  checkExistingMockExam: () => Promise<void>;
  initializeMockExamFromParam: (examId: string) => Promise<{
    sessionId: string | null;
    completedModules: string[];
  }>;
  navigateToMockExam: (mockExamId: string) => void;
  navigateToSelection: () => void;
}

export interface UseMockExamNavigationOptions {
  mockExamIdParam: string | undefined;
  onMockExamIdSet: (id: string | null) => void;
  onSessionIdSet: (id: string | null) => void;
  onCompletedModulesSet: (modules: string[]) => void;
  onPhaseSet: (phase: MockExamPhase) => void;
  onInitializingSet: (initializing: boolean) => void;
}

export function useMockExamNavigation({
  mockExamIdParam,
  onMockExamIdSet,
  onSessionIdSet,
  onCompletedModulesSet,
  onPhaseSet,
  onInitializingSet,
}: UseMockExamNavigationOptions) {
  const navigate = useNavigate();
  const { getToken } = useAuth();
  
  const checkExistingMockExam = useCallback(async () => {
    try {
      const status = await authenticatedFetchJSON<{
        hasActiveMockExam: boolean;
        activeMockExam?: {
          mockExamId: string;
          sessionId: string;
          completedModules: string[];
          availableModules: string[];
        };
      }>(
        `${BACKEND_URL}/api/exam/mock/status`,
        {
          method: 'GET',
          getToken,
        }
      );

      if (status.hasActiveMockExam && status.activeMockExam) {
        // Navigate to the route with mockExamId to maintain URL state
        navigate(`/mock-exam/${status.activeMockExam.mockExamId}`, { replace: true });
      }
    } catch (error) {
      console.error('Failed to check existing mock exam:', error);
      // If check fails, just show selection screen
    }
  }, [getToken, navigate]);
  
  const initializeMockExamFromParam = useCallback(async (examId: string): Promise<{
    sessionId: string | null;
    completedModules: string[];
  }> => {
    onInitializingSet(true);
    
    try {
      // Try to get status for this mock exam (works for both active and completed)
      const status = await authenticatedFetchJSON<{
        mockExamId: string;
        completedModules: string[];
        availableModules: string[];
        sessionId?: string;
      }>(
        `${BACKEND_URL}/api/exam/mock/${examId}/status`,
        {
          method: 'GET',
          getToken,
        }
      );
      
      const completedModules = status.completedModules || [];
      onCompletedModulesSet(completedModules);
      
      let sessionId: string | null = null;
      
      // If we have a sessionId, use it (active exam)
      if (status.sessionId) {
        sessionId = status.sessionId;
        onSessionIdSet(sessionId);
      } else {
        // No sessionId means it might be completed or we need to resume
        // Try to resume to get sessionId (this will fail gracefully if it's completed)
        try {
          const resumeData = await authenticatedFetchJSON<{
            sessionId: string;
            completedModules: string[];
          }>(
            `${BACKEND_URL}/api/exam/resume-mock/${examId}`,
            {
              method: 'GET',
              getToken,
            }
          );
          sessionId = resumeData.sessionId;
          onSessionIdSet(sessionId);
          // Update completed modules from resume data
          const updatedModules = resumeData.completedModules || [];
          onCompletedModulesSet(updatedModules);
        } catch (resumeError) {
          // Resume failed - likely a completed exam, no sessionId needed
          // sessionId remains null, which is fine for viewing completed exams
          onSessionIdSet(null);
        }
      }
      
      return { sessionId, completedModules };
    } catch (error) {
      console.error('Failed to load mock exam from URL:', error);
      // If status fails, assume it's completed and show all modules as completed
      const completedModules = ['reading', 'listening'];
      onCompletedModulesSet(completedModules);
      return { sessionId: null, completedModules };
    } finally {
      onInitializingSet(false);
    }
  }, [getToken, onCompletedModulesSet, onSessionIdSet, onInitializingSet]);
  
  const navigateToMockExam = useCallback((mockExamId: string) => {
    navigate(`/mock-exam/${mockExamId}`);
  }, [navigate]);
  
  const navigateToSelection = useCallback(() => {
    navigate('/mock-exam');
  }, [navigate]);
  
  // Initialize from URL parameter if mockExamId is in the route
  useEffect(() => {
    if (mockExamIdParam) {
      // Set mockExamId and phase immediately to avoid showing selection screen
      onMockExamIdSet(mockExamIdParam);
      onPhaseSet('module-selector');
      // Then load the data in the background
      initializeMockExamFromParam(mockExamIdParam);
    } else {
      // If no param, show selection screen and reset state
      onPhaseSet('selection');
      onMockExamIdSet(null);
      onSessionIdSet(null);
      onCompletedModulesSet([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mockExamIdParam]);
  
  // Only check for existing mock exam on initial mount (when there's no param in URL)
  useEffect(() => {
    if (!mockExamIdParam) {
      checkExistingMockExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - don't check when navigating back to list
  
  const actions: MockExamNavigationActions = {
    checkExistingMockExam,
    initializeMockExamFromParam,
    navigateToMockExam,
    navigateToSelection,
  };
  
  return actions;
}
