import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LoadingSpinner, LoadingProgress } from './common/Loading';
import { useLoading } from '../hooks/useLoading';

interface LoadingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface LoadingResultProps {
  steps?: LoadingStep[];
  type?: 'oral' | 'written'; // Type of evaluation
  onRetry?: () => void;
  error?: Error;
  progress?: number; // Real progress if available (0-100)
  onProgressUpdate?: (progress: number) => void; // Callback to receive progress updates
}

export const LoadingResult: React.FC<LoadingResultProps> = ({ 
  steps: externalSteps, 
  type = 'oral',
  onRetry,
  error: externalError,
  progress: externalProgress,
  onProgressUpdate,
}) => {
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Use useLoading hook for error, timeout, and progress handling
  const {
    isLoading,
    error: hookError,
    isError,
    progress: hookProgress,
    isTimeoutWarning,
    timeRemaining,
    startLoading,
    stopLoading,
    updateProgress,
    retry,
  } = useLoading({
    timeout: 120000, // 2 minutes timeout
    onTimeoutWarning: () => {
      // Could show a toast or update message
      console.warn('Approaching timeout');
    },
    onRetry: onRetry,
  });

  const error = externalError || hookError;
  // Use external progress if provided, otherwise use hook progress
  const progress = externalProgress !== undefined ? externalProgress : hookProgress;
  
  // Default steps based on type
  const defaultSteps: LoadingStep[] = type === 'written'
    ? [
        { id: 'analysis', label: t('writtenExpression.analyzingWriting'), completed: false },
        { id: 'evaluation', label: t('writtenExpression.evaluatingPerformance'), completed: false },
        { id: 'corrections', label: t('writtenExpression.generatingCorrections'), completed: false },
        { id: 'saving', label: t('writtenExpression.savingResults'), completed: false },
      ]
    : [
        { id: 'audio', label: t('writtenExpression.processingAudio'), completed: false },
        { id: 'transcription', label: t('writtenExpression.transcribingAudio'), completed: false },
        { id: 'evaluation', label: t('writtenExpression.evaluatingPerformance'), completed: false },
        { id: 'saving', label: t('writtenExpression.savingResults'), completed: false },
      ];

  const steps = externalSteps || defaultSteps;

  // Start loading when component mounts
  useEffect(() => {
    if (!error) {
      startLoading('Evaluating...');
    }
    return () => {
      stopLoading(true);
    };
  }, [startLoading, stopLoading, error]);

  // Update progress when external progress changes
  useEffect(() => {
    if (externalProgress !== undefined && externalProgress > 0) {
      updateProgress(externalProgress);
      if (onProgressUpdate) {
        onProgressUpdate(externalProgress);
      }
    }
  }, [externalProgress, updateProgress, onProgressUpdate]);

  // Auto-progress through steps (simulated if no external steps provided)
  useEffect(() => {
    if (!externalSteps) {
      // Start at first step
      setCurrentStep(0);
      
      const interval = setInterval(() => {
        setCurrentStep((prev) => {
          const next = prev + 1;
          if (next < steps.length) {
            return next;
          }
          // Loop back to last step if we've reached the end
          return steps.length - 1;
        });
      }, 2000); // Move to next step every 2 seconds

      return () => clearInterval(interval);
    } else {
      // If external steps provided, find the first incomplete step
      const firstIncomplete = steps.findIndex(s => !s.completed);
      setCurrentStep(firstIncomplete >= 0 ? firstIncomplete : steps.length - 1);
    }
  }, [externalSteps]); // Removed 'steps' from dependencies to prevent reset

  const CheckIcon = ({ completed, isActive }: { completed: boolean; isActive: boolean }) => {
    if (completed) {
      return (
        <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0 transition-all duration-300 scale-100">
          <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      );
    }

    if (isActive) {
      return (
        <div className="w-6 h-6 rounded-full bg-indigo-400 flex items-center justify-center flex-shrink-0 transition-all duration-300 animate-pulse">
          <div className="w-2 h-2 bg-indigo-100/70 rounded-full"></div>
        </div>
      );
    }

    return (
      <div className="w-6 h-6 rounded-full border-2 border-slate-300 flex-shrink-0"></div>
    );
  };

  // Show error state if there's an error
  if (error) {
    return (
      <div className="min-h-screen bg-indigo-100/70 dark:bg-slate-900 flex items-center justify-center p-8">
        <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 p-12 shadow-xl">
          <div className="mb-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg className="w-10 h-10 text-red-500 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
              {t('status.error') || 'Error'}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium mb-6">
              {error.message || 'An error occurred during evaluation'}
            </p>
            {(onRetry || retry) && (
              <button
                onClick={() => {
                  if (onRetry) {
                    onRetry();
                  } else if (retry) {
                    retry();
                  }
                }}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors"
                aria-label={t('actions.retry') || 'Retry operation'}
              >
                {t('actions.retry') || 'Retry'}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen bg-indigo-100/70 dark:bg-slate-900 flex items-center justify-center p-8"
      role="status"
      aria-live="polite"
      aria-busy={isLoading}
      aria-label={type === 'written' ? t('writtenExpression.evaluating') : t('writtenExpression.analyzing')}
    >
      <div className="max-w-md w-full bg-indigo-100/70 dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 p-12 shadow-xl">
        <div className="mb-8 text-center">
          {progress !== undefined && progress > 0 ? (
            <>
              <LoadingProgress 
                progress={progress} 
                message={type === 'written' ? t('writtenExpression.evaluating') : t('writtenExpression.analyzing')}
                showPercentage={true}
                className="mb-6"
              />
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                {t('writtenExpression.evaluationDurationNote')}
              </p>
            </>
          ) : (
            <>
              <LoadingSpinner size="lg" color="primary" className="mb-6" />
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
                {type === 'written' ? t('writtenExpression.evaluating') : t('writtenExpression.analyzing')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {type === 'written' ? t('writtenExpression.analyzingWriting') : t('writtenExpression.evaluatingPerformance')}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mt-3 leading-relaxed">
                {t('writtenExpression.evaluationDurationNote')}
              </p>
              {isTimeoutWarning && timeRemaining && (
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium mt-2">
                  {t('status.timeoutWarning') || `This is taking longer than expected. ${Math.ceil(timeRemaining / 1000)}s remaining...`}
                </p>
              )}
            </>
          )}
        </div>
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep && !step.completed;
            const isCompleted = step.completed || index < currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ease-out ${
                  isActive
                    ? 'bg-indigo-100 dark:bg-indigo-900/30 border-2 border-indigo-200 dark:border-indigo-700 scale-[1.02] shadow-md'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800'
                    : 'bg-indigo-100/70 dark:bg-slate-700/50 border-2 border-transparent opacity-60'
                }`}
                style={{
                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <CheckIcon completed={isCompleted} isActive={isActive} />
                <span
                  className={`text-sm font-medium flex-1 transition-colors duration-300 ${
                    isActive
                      ? 'text-indigo-500 dark:text-indigo-300'
                      : isCompleted
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes checkmark {
          0% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
          100% {
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

