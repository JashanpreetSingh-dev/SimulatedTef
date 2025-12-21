import React, { useState, useEffect } from 'react';

interface LoadingStep {
  id: string;
  label: string;
  completed: boolean;
}

interface LoadingResultProps {
  steps?: LoadingStep[];
}

export const LoadingResult: React.FC<LoadingResultProps> = ({ steps: externalSteps }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  // Default steps if none provided
  const defaultSteps: LoadingStep[] = [
    { id: 'audio', label: 'Traitement de l\'enregistrement audio', completed: false },
    { id: 'transcription', label: 'Transcription de l\'audio', completed: false },
    { id: 'evaluation', label: 'Évaluation de la performance', completed: false },
    { id: 'saving', label: 'Sauvegarde des résultats', completed: false },
  ];

  const steps = externalSteps || defaultSteps;

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
        <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center flex-shrink-0 transition-all duration-300 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      );
    }

    return (
      <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0"></div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-8">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 p-12 shadow-xl">
        <div className="mb-8 text-center">
          <div className="w-20 h-20 mx-auto mb-6 relative">
            <div className="absolute inset-0 border-4 border-indigo-200 dark:border-indigo-900 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-indigo-600 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">
            Analyse en cours...
          </h2>
          <p className="text-slate-500 dark:text-slate-400 font-medium">
            Évaluation de votre performance
          </p>
        </div>
        
        <div className="space-y-4">
          {steps.map((step, index) => {
            const isActive = index === currentStep && !step.completed;
            const isCompleted = step.completed || index < currentStep;
            const isPending = index > currentStep;

            return (
              <div
                key={step.id}
                className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-500 ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-800 scale-[1.02] shadow-md'
                    : isCompleted
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-200 dark:border-emerald-800'
                    : 'bg-slate-50 dark:bg-slate-800/50 border-2 border-transparent opacity-60'
                }`}
                style={{
                  animation: isActive ? 'slideIn 0.4s ease-out' : isCompleted ? 'checkmark 0.5s ease-out' : undefined,
                }}
              >
                <CheckIcon completed={isCompleted} isActive={isActive} />
                <span
                  className={`text-sm font-medium flex-1 transition-colors duration-300 ${
                    isActive
                      ? 'text-indigo-700 dark:text-indigo-300'
                      : isCompleted
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {step.label}
                </span>
                {isActive && (
                  <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
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

