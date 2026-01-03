import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ReadingComprehensionExam } from '../components/ReadingComprehensionExam';
import { ListeningComprehensionExam } from '../components/ListeningComprehensionExam';
import { LoadingResult } from '../components/LoadingResult';
import { assignmentService } from '../services/assignmentService';
import { Assignment, ReadingTask, ListeningTask, ReadingListeningQuestion, MCQResult } from '../types';
import { AudioItemMetadata } from '../services/tasks';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function AssignmentExamView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { getToken } = useAuth();
  const { user } = useUser();
  const { t } = useLanguage();
  
  const taskId = searchParams.get('taskId');
  const assignmentId = searchParams.get('assignmentId');
  const type = searchParams.get('type') as 'reading' | 'listening' | null;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [task, setTask] = useState<ReadingTask | ListeningTask | null>(null);
  const [questions, setQuestions] = useState<ReadingListeningQuestion[]>([]);
  const [audioItems, setAudioItems] = useState<AudioItemMetadata[] | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!assignmentId || !taskId) {
      setError(t('assignments.missingParams'));
      setLoading(false);
      return;
    }

    loadAssignmentData();
  }, [assignmentId, taskId]);

  const loadAssignmentData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch assignment with questions and task
      const assignmentData = await assignmentService.getAssignment(assignmentId!, getToken);
      
      if (!assignmentData) {
        setError(t('assignments.notFound'));
        setLoading(false);
        return;
      }

      setAssignment(assignmentData);

      // Check if assignment is published
      if (assignmentData.status !== 'published') {
        setError(t('assignments.notPublished'));
        setLoading(false);
        return;
      }

      // Check if assignment has questions
      if (!assignmentData.taskId || !assignmentData.questionIds || assignmentData.questionIds.length === 0) {
        setError(t('assignments.noQuestions'));
        setLoading(false);
        return;
      }

      // Set task and questions from the assignment data
      if (assignmentData.task) {
        setTask(assignmentData.task as ReadingTask | ListeningTask);
      }

      if (assignmentData.questions && Array.isArray(assignmentData.questions)) {
        setQuestions(assignmentData.questions as ReadingListeningQuestion[]);
      }

      // For listening assignments, fetch audio items
      if (assignmentData.type === 'listening' && assignmentData.taskId) {
        try {
          const audioResponse = await authenticatedFetchJSON<AudioItemMetadata[]>(
            `${BACKEND_URL}/api/audio/items/${assignmentData.taskId}`,
            {
              method: 'GET',
              getToken,
            }
          );
          setAudioItems(audioResponse || null);
        } catch (err) {
          console.error('Failed to load audio items:', err);
          // Continue without audio items - component will handle this
        }
      }

      // Generate a session ID for this assignment attempt
      const newSessionId = `assignment_${assignmentId}_${Date.now()}`;
      setSessionId(newSessionId);

      setLoading(false);
    } catch (err) {
      console.error('Failed to load assignment:', err);
      setError(err instanceof Error ? err.message : t('errors.loadFailed'));
      setLoading(false);
    }
  };

  const handleComplete = async (result: MCQResult) => {
    setIsSubmitting(true);
    
    try {
      // The result is already submitted by the exam component
      // Check if resultId is available in the result
      const resultId = (result as any).resultId;
      
      if (resultId) {
        // Navigate directly to results page
        navigate(`/results/${resultId}`, {
          state: { 
            from: '/practice',
            assignmentId: assignmentId 
          }
        });
        return; // Exit early on success
      }
      
      // If resultId is not available, fetch the most recent result for this assignment
      // Wait a brief moment for the database to be updated
      await new Promise(resolve => setTimeout(resolve, 500));
      
      try {
        const userId = user?.id;
        if (!userId) {
          throw new Error('User not authenticated');
        }
        
        const resultsResponse = await authenticatedFetchJSON<{ results: any[] }>(
          `${BACKEND_URL}/api/results/${userId}?assignmentId=${assignmentId}&limit=1&resultType=assignment`,
          {
            method: 'GET',
            getToken,
          }
        );
        
        if (resultsResponse.results && resultsResponse.results.length > 0) {
          const latestResult = resultsResponse.results[0];
          navigate(`/results/${latestResult._id}`, {
            state: { 
              from: '/practice',
              assignmentId: assignmentId 
            }
          });
        } else {
          // Fallback: navigate to practice with message
          navigate('/practice', {
            state: { 
              from: 'assignment-exam', 
              message: t('assignments.completedSuccess')
            }
          });
        }
      } catch (fetchError) {
        console.error('Failed to fetch result:', fetchError);
        // Fallback: navigate to practice
        navigate('/practice', {
          state: { 
            from: 'assignment-exam', 
            message: t('assignments.completedSuccess')
          }
        });
      }
    } catch (err) {
      console.error('Failed to handle completion:', err);
      navigate('/practice', {
        state: { 
          from: 'assignment-exam',
          message: t('assignments.completedCheckHistory')
        }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    navigate('/practice', {
      state: { from: 'assignment-exam' }
    });
  };

  if (loading) {
    // Show a simple loading state for reading/listening assignments
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 flex items-center justify-center p-8 transition-colors">
          <div className="max-w-md w-full bg-indigo-100/70 dark:bg-slate-800/70 rounded-[3rem] border border-slate-200 dark:border-slate-700 p-12 shadow-xl text-center">
            <div className="w-20 h-20 mx-auto mb-6 relative">
              <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-indigo-400 dark:border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
              {type === 'listening' ? '🎧' : '📖'} {t('assignments.loadingAssignment')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">
              {t('assignments.preparingAssessment').replace('{type}', type === 'listening' ? t('assignments.listening').toLowerCase() : t('assignments.reading').toLowerCase())}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
          <div className="max-w-7xl mx-auto py-20">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h2 className="text-xl font-bold text-red-800 dark:text-red-200 mb-2">{t('errors.error')}</h2>
              <p className="text-red-600 dark:text-red-300 mb-4">{error}</p>
              <button
                onClick={() => navigate('/practice')}
                className="px-6 py-4 bg-red-600 text-white rounded-lg hover:bg-red-700 font-bold"
              >
                {t('back.practice')}
              </button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!assignment || !task || questions.length === 0) {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-4 md:p-8 transition-colors">
          <div className="max-w-7xl mx-auto py-20 text-center">
            <p className="text-slate-500 dark:text-slate-400">{t('assignments.loadingAssignmentData')}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  // Render appropriate exam component based on type
  if (assignment.type === 'reading') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-3 md:p-6 transition-colors">
          <div className="max-w-6xl mx-auto">
            <button 
              onClick={handleClose}
              className="mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider cursor-pointer"
            >
              ← {t('back.practice')}
            </button>
            {isSubmitting ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">{t('assignments.submittingResults')}</p>
                </div>
              </div>
            ) : (
              <ReadingComprehensionExam
                task={task as ReadingTask}
                questions={questions}
                sessionId={sessionId}
                mockExamId="" // Not a mock exam, but component requires this
                assignmentId={assignmentId || undefined}
                onComplete={handleComplete}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  } else if (assignment.type === 'listening') {
    return (
      <DashboardLayout>
        <div className="min-h-screen bg-indigo-100 dark:bg-slate-900 p-3 md:p-6 transition-colors">
          <div className="max-w-6xl mx-auto">
            <button 
              onClick={handleClose}
              className="mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider cursor-pointer"
            >
              ← {t('back.practice')}
            </button>
            {isSubmitting ? (
              <div className="min-h-[400px] flex items-center justify-center">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 relative">
                    <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-800 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-indigo-500 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p className="text-slate-600 dark:text-slate-400 font-medium">{t('assignments.submittingResults')}</p>
                </div>
              </div>
            ) : (
              <ListeningComprehensionExam
                task={task as ListeningTask}
                questions={questions}
                audioItems={audioItems}
                sessionId={sessionId}
                mockExamId="" // Not a mock exam, but component requires this
                assignmentId={assignmentId || undefined}
                onComplete={handleComplete}
                onClose={handleClose}
              />
            )}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return null;
}
