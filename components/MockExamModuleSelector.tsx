import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface MockExamModuleSelectorProps {
  mockExamId: string;
  completedModules: string[];
  onModuleSelect: (module: 'reading' | 'listening') => void;
  onViewResults?: (module: 'reading' | 'listening') => void;
  onFinish?: () => void;
  onCancel?: () => void;
  justCompletedModule?: string | null;
}

interface ModuleInfo {
  id: 'reading' | 'listening';
  name: string;
  description: string;
  duration: string;
}

const MODULES: ModuleInfo[] = [
  {
    id: 'reading',
    name: 'Reading Comprehension',
    description: '60 minutes, 40 multiple-choice questions (question-by-question format)',
    duration: '60 minutes',
  },
  {
    id: 'listening',
    name: 'Listening Comprehension',
    description: 'Auto-advancing questions with audio playback, 40 multiple-choice questions',
    duration: '~40 minutes',
  },
];

export const MockExamModuleSelector: React.FC<MockExamModuleSelectorProps> = ({
  mockExamId,
  completedModules,
  onModuleSelect,
  onViewResults,
  onFinish,
  onCancel,
  justCompletedModule,
}) => {
  const { theme } = useTheme();

  const allModulesCompleted = completedModules.length === 2;

  const getModuleStatus = (moduleId: string) => {
    if (completedModules.includes(moduleId)) {
      return 'completed';
    }
    return 'available';
  };

  return (
    <div className={`
      min-h-screen p-4 md:p-8
      ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}
    `}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {onCancel && (
            <button
              onClick={onCancel}
              className={`
                mb-3 md:mb-6 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 
                flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors
              `}
            >
              ← Retour à la liste
            </button>
          )}
          <div className="mb-4">
            <h1 className={`
              text-3xl font-bold
              ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
            `}>
              Mock Exam Modules
            </h1>
          </div>

          {justCompletedModule && (
            <div className={`
              p-4 rounded-lg mb-4 animate-in slide-in-from-top duration-300
              ${theme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}
            `}>
              <p className={`
                text-center font-semibold
                ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}
              `}>
                ✓ {justCompletedModule === 'reading' ? 'Reading Comprehension' : 'Listening Comprehension'} completed successfully!
              </p>
            </div>
          )}

          {allModulesCompleted && (
            <div className={`
              p-4 rounded-lg mb-4
              ${theme === 'dark' ? 'bg-green-900/30 border border-green-700' : 'bg-green-50 border border-green-200'}
            `}>
              <p className={`
                text-center font-semibold
                ${theme === 'dark' ? 'text-green-200' : 'text-green-800'}
              `}>
                🎉 All modules completed! You can review your results or finish the mock exam.
              </p>
            </div>
          )}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {MODULES.map((module) => {
            const status = getModuleStatus(module.id);
            const isCompleted = status === 'completed';

            return (
              <div
                key={module.id}
                className={`
                  p-6 rounded-lg border-2 transition-all
                  ${isCompleted
                    ? theme === 'dark'
                      ? 'bg-green-900/20 border-green-600 cursor-default opacity-75'
                      : 'bg-green-50 border-green-500 cursor-default opacity-75'
                    : theme === 'dark'
                    ? 'bg-slate-800 border-slate-600 hover:border-indigo-500 hover:shadow-xl hover:scale-105 cursor-pointer active:scale-100'
                    : 'bg-white border-slate-300 hover:border-indigo-500 hover:shadow-xl hover:scale-105 cursor-pointer active:scale-100'
                  }
                `}
                onClick={() => {
                  if (!isCompleted) {
                    onModuleSelect(module.id);
                  }
                }}
                role={isCompleted ? undefined : 'button'}
                tabIndex={isCompleted ? undefined : 0}
                onKeyDown={(e) => {
                  if (!isCompleted && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onModuleSelect(module.id);
                  }
                }}
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className={`
                    text-xl font-semibold
                    ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
                  `}>
                    {module.name}
                  </h3>
                  {isCompleted ? (
                    <svg className="w-6 h-6 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg className="w-6 h-6 text-indigo-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  )}
                </div>

                <p className={`
                  text-sm mb-3
                  ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
                `}>
                  {module.description}
                </p>

                <div className={`
                  text-xs font-semibold
                  ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}
                `}>
                  Duration: {module.duration}
                </div>

                {isCompleted && (
                  <div className="mt-4 space-y-2">
                    <div className={`
                      text-center py-2 rounded font-semibold text-sm
                      ${theme === 'dark' ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800'}
                    `}>
                      ✓ Completed
                    </div>
                    {onViewResults && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewResults(module.id);
                        }}
                        className={`
                          w-full py-2 px-4 rounded font-semibold text-sm transition-colors
                          ${theme === 'dark'
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }
                        `}
                      >
                        📊 See Results
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>


        {/* Progress Indicator */}
        <div className={`
          mt-8 p-4 rounded-lg text-center
          ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
        `}>
          <p className={`
            text-sm
            ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
          `}>
            Progress: {completedModules.length} of 2 modules completed
          </p>
          <div className={`
            mt-2 w-full h-2 rounded-full overflow-hidden
            ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}
          `}>
            <div
              className={`
                h-full transition-all duration-300
                ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}
              `}
              style={{ width: `${(completedModules.length / 2) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
