import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { GuidedWritingExam } from '../components/guidedWriting/GuidedWritingExam';
import { LoadingResult } from '../components/LoadingResult';
import { DetailedResultView } from '../components/results';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { getRandomWrittenSectionATask, getRandomWrittenSectionBTask } from '../services/writtenTasks';
import { persistenceService } from '../services/persistence';
import { useExamResult } from '../hooks/useExamResult';
import { WrittenTask } from '../types';

export function GuidedWrittenExamView() {
  const { mode } = useParams<{ mode: 'partA' | 'partB' }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<{ taskA: WrittenTask; taskB: WrittenTask } | null>(null);
  const [hasInitialized, setHasInitialized] = useState(false);
  const initializedModeRef = useRef<string | null>(null);

  // Use the custom hook for result management
  const { result, isLoading, handleResult } = useExamResult({
    onSuccess: (savedResult) => {
      console.log('Guided written exam completed successfully:', savedResult._id);
      sessionStorage.removeItem(`guided_exam_scenario_written_${mode}`);
    },
    onError: (error) => {
      console.error('Guided written exam error:', error);
      sessionStorage.removeItem(`guided_exam_scenario_written_${mode}`);
    },
    autoNavigate: true,
  });

  useEffect(() => {
    if (!mode || !['partA', 'partB'].includes(mode)) {
      navigate('/practice');
      return;
    }

    // Only run initialization once per mode
    if (hasInitialized && initializedModeRef.current === mode) return;

    // Check if scenario was passed via location state (for retakes)
    if (location.state?.tasks && !tasks) {
      // Use tasks from location state (retake scenario)
      setTasks(location.state.tasks);
      sessionStorage.setItem(`guided_exam_scenario_written_${mode}`, JSON.stringify(location.state.tasks));
      setHasInitialized(true);
      initializedModeRef.current = mode;
    } else if (!tasks) {
      // Check if we're explicitly starting a new session from practice page
      // If so, clear sessionStorage and generate fresh random tasks
      const isNewSessionFromPractice = location.state?.from === '/practice';
      
      if (isNewSessionFromPractice) {
        // Clear sessionStorage for new sessions to ensure fresh random tasks
        // Every time user clicks to start a guided session from practice page, they get a new random question
        sessionStorage.removeItem(`guided_exam_scenario_written_${mode}`);
      } else {
        // If not coming from practice page, check if we have a stored scenario
        // This handles page refresh during an exam (location.state might be lost on refresh)
        const storedScenario = sessionStorage.getItem(`guided_exam_scenario_written_${mode}`);
        if (storedScenario) {
          try {
            const parsedTasks = JSON.parse(storedScenario);
            setTasks(parsedTasks);
            setHasInitialized(true);
            initializedModeRef.current = mode;
            return; // Don't generate new tasks, use stored ones for continuity
          } catch (error) {
            console.error('Error parsing stored scenario:', error);
            // Fall through to generate new tasks if stored scenario is invalid
          }
        }
      }
      
      // Generate new tasks, excluding completed tasks
      const loadCompletedTaskIds = async () => {
        try {
          const response = await persistenceService.getAllResults(user?.id || 'guest', getToken);
          const results = response.results;
          const completedIds: string[] = [];
          results.forEach(result => {
            if (result.writtenExpressionResult?.sectionA?.task?.id) {
              completedIds.push(result.writtenExpressionResult.sectionA.task.id);
            }
            if (result.writtenExpressionResult?.sectionB?.task?.id) {
              completedIds.push(result.writtenExpressionResult.sectionB.task.id);
            }
          });
          
          let newTasks: { taskA: WrittenTask; taskB: WrittenTask };
          
          if (mode === 'partA') {
            const taskA = getRandomWrittenSectionATask(completedIds);
            const taskB = getRandomWrittenSectionBTask(completedIds);
            newTasks = { taskA, taskB };
          } else {
            const taskB = getRandomWrittenSectionBTask(completedIds);
            const taskA = getRandomWrittenSectionATask(completedIds);
            newTasks = { taskA, taskB };
          }
          
          setTasks(newTasks);
          // Store in sessionStorage only for continuity during the same session (e.g., page refresh)
          sessionStorage.setItem(`guided_exam_scenario_written_${mode}`, JSON.stringify(newTasks));
          setHasInitialized(true);
          initializedModeRef.current = mode;
        } catch (error) {
          console.error('Error loading completed tasks:', error);
          // Fallback to random tasks without exclusion
          let newTasks: { taskA: WrittenTask; taskB: WrittenTask };
          if (mode === 'partA') {
            const taskA = getRandomWrittenSectionATask();
            const taskB = getRandomWrittenSectionBTask();
            newTasks = { taskA, taskB };
          } else {
            const taskB = getRandomWrittenSectionBTask();
            const taskA = getRandomWrittenSectionATask();
            newTasks = { taskA, taskB };
          }
          setTasks(newTasks);
          sessionStorage.setItem(`guided_exam_scenario_written_${mode}`, JSON.stringify(newTasks));
          setHasInitialized(true);
          initializedModeRef.current = mode;
        }
      };
      
      loadCompletedTaskIds();
    }
  }, [mode, navigate, user, getToken, hasInitialized, location.state, tasks]);

  // Reset initialization when mode changes
  useEffect(() => {
    if (initializedModeRef.current !== mode) {
      setHasInitialized(false);
      initializedModeRef.current = null;
    }
  }, [mode]);

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
              onBack={() => navigate('/history')} 
            />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!tasks) {
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

  // Determine back navigation
  const handleBack = () => {
    if (location.state?.from === '/practice') {
      if (location.state?.selectedModule) {
        sessionStorage.setItem('practice_selected_module', location.state.selectedModule);
      }
      navigate('/practice');
    } else if (location.state?.from) {
      navigate(location.state.from);
    } else {
      navigate('/practice');
    }
  };

  // Determine title based on mode
  const getTitle = () => {
    if (mode === 'partA') return t('guidedWriting.guidedSectionA');
    return t('guidedWriting.guidedSectionB');
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-2 md:p-3 lg:p-6 transition-colors">
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={handleBack}
            className="mb-2 md:mb-3 lg:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider cursor-pointer"
          >
            ← {location.state?.from === '/practice' ? t('back.practice') : t('back.back')}
          </button>
          {tasks && (
            <GuidedWritingExam
              taskA={tasks.taskA}
              taskB={tasks.taskB}
              title={getTitle()}
              onFinish={handleResult}
              mode={mode}
            />
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}