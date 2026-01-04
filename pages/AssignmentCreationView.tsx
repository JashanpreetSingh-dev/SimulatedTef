import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAssignments } from '../hooks/useAssignments';
import { AssignmentForm } from '../components/assignments/AssignmentForm';
import { QuestionReviewEditor } from '../components/assignments/QuestionReviewEditor';
import { Assignment, AssignmentType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useRole } from '../hooks/useRole';

type Step = 'create' | 'generate' | 'review' | 'publish';

export function AssignmentCreationView() {
  const navigate = useNavigate();
  const { assignmentId } = useParams<{ assignmentId: string }>();
  const { t } = useLanguage();
  const { canCreateAssignments, isSuperUser, isProfessor, organizationName } = useRole();
  const {
    createAssignment,
    generateQuestions,
    getQuestionGenerationJobStatus,
    getAssignment,
    updateAssignment,
    publishAssignment,
    loading,
    error,
  } = useAssignments();

  const [step, setStep] = useState<Step>('create');
  const [currentAssignment, setCurrentAssignment] = useState<Assignment & { questions?: any[]; task?: any } | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generationJobId, setGenerationJobId] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load assignment if editing
  useEffect(() => {
    if (assignmentId) {
      loadAssignment();
    }
  }, [assignmentId]);

  const loadAssignment = async () => {
    try {
      const assignment = await getAssignment(assignmentId!);
      setCurrentAssignment(assignment);
      
      if (assignment.taskId && assignment.questionIds && assignment.questionIds.length > 0) {
        setStep('review');
      } else {
        setStep('generate');
      }
    } catch (err) {
      console.error('Failed to load assignment:', err);
    }
  };

  const handleCreate = async (data: {
    type: AssignmentType;
    title?: string;
    prompt: string;
    settings: any;
  }) => {
    try {
      const assignment = await createAssignment(
        data.type,
        data.title,
        data.prompt,
        data.settings
      );
      setCurrentAssignment(assignment);
      setStep('generate');
      navigate(`/dashboard/assignments/create/${assignment.assignmentId}`, { replace: true });
    } catch (err) {
      console.error('Failed to create assignment:', err);
    }
  };

  const handleGenerate = async () => {
    if (!currentAssignment) return;

    setGenerating(true);
    try {
      const jobResult = await generateQuestions(currentAssignment.assignmentId);
      setGenerationJobId(jobResult.jobId);
      setGenerationProgress(0);
      
      // Poll for job status
      pollJobStatus(currentAssignment.assignmentId, jobResult.jobId);
    } catch (err) {
      console.error('Failed to start question generation:', err);
      setGenerating(false);
    }
  };

  const pollJobStatus = (assignmentId: string, jobId: string) => {
    // Clear any existing polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    pollIntervalRef.current = setInterval(async () => {
      try {
        const status = await getQuestionGenerationJobStatus(assignmentId, jobId);
        setGenerationProgress(status.progress);

        if (status.status === 'completed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setGenerating(false);
          setGenerationJobId(null);
          // Reload assignment to get questions
          const updated = await getAssignment(assignmentId);
          setCurrentAssignment(updated);
          setStep('review');
        } else if (status.status === 'failed') {
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
          setGenerating(false);
          setGenerationJobId(null);
          alert(t('assignments.generationFailed').replace('{error}', status.error || 'Unknown error'));
        }
      } catch (err) {
        console.error('Failed to poll job status:', err);
        if (pollIntervalRef.current) {
          clearInterval(pollIntervalRef.current);
          pollIntervalRef.current = null;
        }
        setGenerating(false);
        setGenerationJobId(null);
      }
    }, 2000); // Poll every 2 seconds
  };

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handlePublish = async () => {
    if (!currentAssignment) return;

    try {
      const published = await publishAssignment(currentAssignment.assignmentId);
      setCurrentAssignment(published);
      navigate('/dashboard/assignments', { replace: true });
    } catch (err) {
      console.error('Failed to publish assignment:', err);
    }
  };

  const handleSave = async (updates: Partial<Assignment>) => {
    if (!currentAssignment) return;

    try {
      const updated = await updateAssignment(currentAssignment.assignmentId, updates);
      setCurrentAssignment(updated);
    } catch (err) {
      console.error('Failed to save assignment:', err);
    }
  };

  // Check permissions
  if (!canCreateAssignments) {
    return (
      <DashboardLayout>
        <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">
              Access Denied
            </h2>
            <p className="text-red-600 dark:text-red-300">
              Only professors and administrators can create assignments. Please contact your organization administrator if you need this permission.
            </p>
            <button
              onClick={() => navigate('/dashboard/assignments')}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
            >
              Back to Assignments
            </button>
          </div>
        </main>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-10 space-y-6 md:space-y-8 lg:space-y-12">
        <div className="space-y-2 md:space-y-3">
          <button
            onClick={() => navigate('/dashboard/assignments')}
            className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
          >
            ← {t('assignments.backToAssignments')}
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                {assignmentId ? t('assignments.editAssignment') : t('assignments.createAssignment')}
              </h1>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                {t('assignments.createSubtitle')}
              </p>
            </div>
            {organizationName && (
              <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                Organization: <span className="font-semibold">{organizationName}</span>
              </div>
            )}
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-6 md:mb-8 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
              step === 'create' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              1
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">{t('assignments.stepCreate')}</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2 sm:mx-4 min-w-[20px]" />
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
              step === 'generate' ? 'bg-indigo-500 text-white' : step === 'review' || step === 'publish' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              2
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">{t('assignments.stepGenerate')}</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2 sm:mx-4 min-w-[20px]" />
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
              step === 'review' ? 'bg-indigo-500 text-white' : step === 'publish' ? 'bg-indigo-100 dark:bg-indigo-900 text-indigo-500' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              3
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">{t('assignments.stepReview')}</span>
          </div>
          <div className="flex-1 h-0.5 bg-slate-200 dark:bg-slate-700 mx-2 sm:mx-4 min-w-[20px]" />
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm ${
              step === 'publish' ? 'bg-indigo-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
            }`}>
              4
            </div>
            <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 hidden sm:inline">{t('assignments.stepPublish')}</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4">
            <p className="text-red-700 dark:text-red-400 text-sm font-semibold">{error}</p>
          </div>
        )}

        {/* Step Content */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-4 sm:p-6 md:p-8 shadow-sm">
          {step === 'create' && (
            <AssignmentForm
              onSubmit={handleCreate}
              loading={loading}
              initialData={currentAssignment ? {
                type: currentAssignment.type,
                title: currentAssignment.title,
                prompt: currentAssignment.prompt,
                settings: currentAssignment.settings,
              } : undefined}
            />
          )}

          {step === 'generate' && currentAssignment && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {t('assignments.generateQuestions')}
                </h2>
                <p className="text-slate-600 dark:text-slate-400">
                  {t('assignments.generateDescription')}
                </p>
              </div>
              
              {!generating && !generationJobId && (
                <button
                  onClick={handleGenerate}
                  disabled={loading}
                  className="px-6 py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('assignments.generateQuestions')}
                </button>
              )}

              {generating && generationJobId && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                        {t('assignments.generating')}
                      </span>
                      <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
                        {generationProgress}%
                      </span>
                    </div>
                    <div className="w-full bg-indigo-200 dark:bg-indigo-800 rounded-full h-2">
                      <div
                        className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${generationProgress}%` }}
                      />
                    </div>
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
                      {t('assignments.generatingWait')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'review' && currentAssignment && (
            <QuestionReviewEditor
              assignment={currentAssignment}
              onSave={handleSave}
              onPublish={handlePublish}
              loading={loading}
            />
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
