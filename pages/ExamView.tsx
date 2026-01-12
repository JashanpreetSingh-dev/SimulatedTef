import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { OralExpressionLive } from '../components/OralExpressionLive';
import { LoadingResult } from '../components/LoadingResult';
import { DetailedResultView } from '../components/results';
import { ExamWarningModal } from '../components/ExamWarningModal';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getRandomTasks } from '../services/tasks';
import { persistenceService } from '../services/persistence';
import { useExamResult } from '../hooks/useExamResult';
import { useUsage } from '../hooks/useUsage';

export function ExamView() {
  const { mode } = useParams<{ mode: 'partA' | 'partB' | 'full' }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [scenario, setScenario] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showWarning, setShowWarning] = useState(false);
  const [hasSeenWarning, setHasSeenWarning] = useState(false);
  const { startExam, validateSession } = useUsage();
  
  // Use the custom hook for result management
  const { result, isLoading, handleResult } = useExamResult({
    onSuccess: (savedResult) => {
      console.log('Exam completed successfully:', savedResult._id);
      sessionStorage.removeItem(`exam_session_${mode}`);
      sessionStorage.removeItem(`exam_scenario_${mode}`);
    },
    onError: (error) => {
      console.error('Exam error:', error);
      sessionStorage.removeItem(`exam_session_${mode}`);
      sessionStorage.removeItem(`exam_scenario_${mode}`);
    },
    autoNavigate: true,
    sessionId: sessionId || undefined,
  });

  // Track if we've initialized to prevent re-running
  const [hasInitialized, setHasInitialized] = useState(false);
  const initializedModeRef = useRef<string | null>(null);

  useEffect(() => {
    if (!mode || !['partA', 'partB', 'full'].includes(mode)) {
      navigate('/dashboard');
      return;
    }

    // Only run initialization once per mode
    if (hasInitialized && initializedModeRef.current === mode) return;

    // Validate session on page load/refresh
    const validateExistingSession = async () => {
      const storedSessionId = sessionStorage.getItem(`exam_session_${mode}`);
      const storedScenario = sessionStorage.getItem(`exam_scenario_${mode}`);
      
      if (storedSessionId) {
        const isValid = await validateSession(storedSessionId);
        if (isValid) {
          setSessionId(storedSessionId);
          
          // Restore scenario if it exists (for refresh recovery)
          if (storedScenario && !scenario) {
            try {
              const parsedScenario = JSON.parse(storedScenario);
              setScenario(parsedScenario);
              setHasInitialized(true);
              initializedModeRef.current = mode;
              return; // Don't generate new scenario if we restored one
            } catch (error) {
              console.error('Error parsing stored scenario:', error);
              // Fall through to generate new scenario
            }
          }
        } else {
          // Session invalid - usage already consumed
          sessionStorage.removeItem(`exam_session_${mode}`);
          sessionStorage.removeItem(`exam_scenario_${mode}`);
          alert(t('errors.examSessionExpired'));
          navigate('/dashboard');
          return;
        }
      }
    };

    validateExistingSession();

    // Check if scenario was passed via location state (for retakes)
    if (location.state?.scenario && !scenario) {
      setScenario(location.state.scenario);
      // Store scenario for refresh recovery
      sessionStorage.setItem(`exam_scenario_${mode}`, JSON.stringify(location.state.scenario));
      setHasInitialized(true);
      initializedModeRef.current = mode;
    } else if (!scenario) {
      // Check if we have a stored scenario first
      const storedScenario = sessionStorage.getItem(`exam_scenario_${mode}`);
      if (storedScenario) {
        try {
          const parsedScenario = JSON.parse(storedScenario);
          setScenario(parsedScenario);
          setHasInitialized(true);
          initializedModeRef.current = mode;
        } catch (error) {
          console.error('Error parsing stored scenario:', error);
          // Fall through to generate new scenario
        }
      }
      
      // Only generate new scenario if we don't have one stored (for refresh recovery)
      if (!storedScenario && !scenario) {
        // Generate new scenario, excluding completed tasks
        const loadCompletedTaskIds = async () => {
        try {
          const response = await persistenceService.getAllResults(user?.id || 'guest', getToken);
          const results = response.results;
          const completedIds: number[] = [];
          results.forEach(result => {
            if (result.taskPartA?.id) completedIds.push(result.taskPartA.id);
            if (result.taskPartB?.id) completedIds.push(result.taskPartB.id);
          });
          
          const { partA, partB } = getRandomTasks(completedIds);
          const newScenario = {
            title: mode === 'full' ? t('practice.completeExam') : (mode === 'partA' ? t('practice.sectionA') : t('practice.sectionB')),
            mode: mode,
            officialTasks: {
              partA,
              partB
            }
          };
          setScenario(newScenario);
          sessionStorage.setItem(`exam_scenario_${mode}`, JSON.stringify(newScenario));
          setHasInitialized(true);
          initializedModeRef.current = mode;
        } catch (error) {
          console.error('Error loading completed tasks:', error);
          const { partA, partB } = getRandomTasks();
          const newScenario = {
            title: mode === 'full' ? t('practice.completeExam') : (mode === 'partA' ? t('practice.sectionA') : t('practice.sectionB')),
            mode: mode,
            officialTasks: {
              partA,
              partB
            }
          };
          setScenario(newScenario);
          sessionStorage.setItem(`exam_scenario_${mode}`, JSON.stringify(newScenario));
          setHasInitialized(true);
          initializedModeRef.current = mode;
        }
        };
        
        loadCompletedTaskIds();
      }
    }
  }, [mode, navigate, user, validateSession, hasInitialized]);

  // Reset initialization when mode changes
  useEffect(() => {
    if (initializedModeRef.current !== mode) {
      setHasInitialized(false);
      initializedModeRef.current = null;
    }
  }, [mode]);

  // Reset warning when mode changes
  useEffect(() => {
    setHasSeenWarning(false);
  }, [mode]);

  // Show warning modal first when scenario is ready (only once, and only if user hasn't seen it)
  useEffect(() => {
    if (scenario && !showWarning && hasInitialized && !hasSeenWarning) {
      setShowWarning(true);
    }
  }, [scenario, showWarning, hasInitialized, hasSeenWarning]);

  // Show loading state if result is loading
  if (isLoading) {
    return (
      <DashboardLayout>
        <LoadingResult />
      </DashboardLayout>
    );
  }

  // Show result view if we have a complete result but haven't navigated yet
  if (result && !result.isLoading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
          <div className="max-w-7xl mx-auto">
            <DetailedResultView 
              result={result} 
              onBack={() => navigate(result.mockExamId ? `/mock-exam/${result.mockExamId}` : '/history')} 
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!scenario) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
          <div className="max-w-7xl mx-auto py-20 text-center animate-pulse text-slate-500">
            {t('status.loadingExam')}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Determine back navigation - go back one step in history
  const handleBack = () => {
    // Check if we have a referrer in location state
    if (location.state?.from === '/practice') {
      // Preserve module selection when going back to practice
      if (location.state?.selectedModule) {
        sessionStorage.setItem('practice_selected_module', location.state.selectedModule);
      }
      navigate('/practice');
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else {
      // Otherwise, go back one step in browser history
      navigate(-1);
    }
  };

  const handleConfirmWarning = () => {
    setShowWarning(false);
    setHasSeenWarning(true);
  };

  const handleCancelWarning = () => {
    setShowWarning(false);
    setHasSeenWarning(true);
    setScenario(null);
    handleBack();
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-3 md:p-6 transition-colors">
        <div className="max-w-6xl mx-auto">
          <button 
            onClick={handleBack}
            className="mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider cursor-pointer"
          >
            ← {location.state?.from === '/practice' ? t('back.practice') : t('back.back')}
          </button>
          {scenario && !showWarning && <OralExpressionLive scenario={scenario} onFinish={handleResult} onSessionStart={startExam} />}
          <ExamWarningModal
            isOpen={showWarning}
            onConfirm={handleConfirmWarning}
            onCancel={handleCancelWarning}
            examType={mode}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
