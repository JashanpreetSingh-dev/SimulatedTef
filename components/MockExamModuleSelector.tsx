import React from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';


interface ModuleResult {
  resultId?: string;
  isLoading?: boolean;
  score?: number;
  clbLevel?: string;
  scoreOutOf?: number;
}

interface MockExamModuleSelectorProps {
  mockExamId: string;
  completedModules: string[];
  loadingModules?: string[]; // Modules that are completed but still loading (evaluating)
  moduleResults?: Record<string, ModuleResult>; // Result data for each module
  onModuleSelect: (module: 'oralExpression' | 'reading' | 'listening') => void;
  onViewResults?: (module: 'oralExpression' | 'reading' | 'listening') => void;
  onFinish?: () => void;
  onCancel?: () => void;
  justCompletedModule?: string | null;
}

interface ModuleInfo {
  id: 'oralExpression' | 'reading' | 'listening';
  name: string;
  description: string;
  duration: string;
}

const MODULES: ModuleInfo[] = [
  {
    id: 'oralExpression',
    name: 'Oral Expression',
    description: 'Full exam with Section A (EO1) and Section B (EO2), real-time AI conversation',
    duration: '~30 minutes',
  },
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
  completedModules = [],
  loadingModules = [],
  moduleResults = {},
  onModuleSelect,
  onViewResults,
  onCancel,
  justCompletedModule,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const allModulesCompleted = completedModules.length === 3;
  
  const getModuleInfo = (moduleId: string) => {
    switch (moduleId) {
      case 'oralExpression':
        return {
          name: t('modules.oralExpression'),
          description: t('modules.oralExpressionDescription'),
          duration: t('modules.oralExpressionDuration'),
        };
      case 'reading':
        return {
          name: t('modules.reading'),
          description: t('modules.readingDescription'),
          duration: t('modules.readingDuration'),
        };
      case 'listening':
        return {
          name: t('modules.listening'),
          description: t('modules.listeningDescription'),
          duration: t('modules.listeningDuration'),
        };
      default:
        return { name: '', description: '', duration: '' };
    }
  };

  const getModuleStatus = (moduleId: string) => {
    if (completedModules.includes(moduleId)) {
      if (loadingModules && loadingModules.includes(moduleId)) {
        return 'loading';
      }
      return 'completed';
    }
    return 'available';
  };
  
  const getModuleResult = (moduleId: string): ModuleResult | undefined => {
    return moduleResults[moduleId];
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
              ← {t('back.toList')}
            </button>
          )}
          <div className="mb-4">
            <h1 className={`
              text-3xl font-bold
              ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
            `}>
              {t('mockExam.modules')}
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
                ✓ {justCompletedModule === 'oralExpression' ? t('modules.oralExpression') : justCompletedModule === 'reading' ? t('modules.reading') : t('modules.listening')} {t('mockExam.moduleCompleted')}
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
                🎉 {t('mockExam.allModulesCompleted')}
              </p>
            </div>
          )}
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {MODULES.map((module) => {
            const moduleInfo = getModuleInfo(module.id);
            const status = getModuleStatus(module.id);
            const isCompleted = status === 'completed';
            const isLoading = status === 'loading';

            return (
              <div
                key={module.id}
                className={`
                  p-6 rounded-lg border-2 transition-all flex flex-col
                  ${isLoading
                    ? theme === 'dark'
                      ? 'bg-yellow-900/20 border-yellow-600 cursor-default opacity-90'
                      : 'bg-yellow-50 border-yellow-500 cursor-default opacity-90'
                    : isCompleted
                    ? theme === 'dark'
                      ? 'bg-green-900/20 border-green-600 cursor-default opacity-75'
                      : 'bg-green-50 border-green-500 cursor-default opacity-75'
                    : theme === 'dark'
                    ? 'bg-slate-800 border-slate-600 hover:border-indigo-500 hover:shadow-xl hover:scale-105 cursor-pointer active:scale-100'
                    : 'bg-white border-slate-300 hover:border-indigo-500 hover:shadow-xl hover:scale-105 cursor-pointer active:scale-100'
                  }
                `}
                onClick={() => {
                  if (!isCompleted && !isLoading) {
                    onModuleSelect(module.id);
                  }
                }}
                role={isCompleted || isLoading ? undefined : 'button'}
                tabIndex={isCompleted || isLoading ? undefined : 0}
                onKeyDown={(e) => {
                  if (!isCompleted && !isLoading && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    onModuleSelect(module.id);
                  }
                }}
              >
                {/* Top content section */}
                <div className="flex-grow">
                  <div className="flex items-start justify-between mb-4">
                    <h3 className={`
                      text-xl font-semibold
                      ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
                    `}>
                      {moduleInfo.name}
                    </h3>
                    {isLoading ? (
                      <svg className="w-6 h-6 text-yellow-500 flex-shrink-0 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : isCompleted ? (
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
                    {moduleInfo.description}
                  </p>

                  <div className={`
                    text-xs font-semibold
                    ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}
                  `}>
                    {t('common.duration')}: {moduleInfo.duration}
                  </div>
                </div>

                {/* Bottom status/button section - aligned across all cards */}
                {(isCompleted || isLoading) && (
                  <div className="mt-6 space-y-2">
                    {isLoading ? (
                      <div className={`
                        text-center py-2 rounded font-semibold text-sm
                        ${theme === 'dark' ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'}
                      `}>
                        ⏳ {t('status.evaluating')}
                      </div>
                    ) : (
                      <>
                        <div className={`
                          text-center py-2 rounded font-semibold text-sm
                          ${theme === 'dark' ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800'}
                        `}>
                          ✓ {t('status.completed')}
                        </div>
                        {(() => {
                          const result = getModuleResult(module.id);
                          // Show score if available and not currently loading
                          if (result && typeof result.score === 'number' && result.score !== undefined && result.isLoading !== true) {
                            const score = result.score;
                            const scoreOutOf = result.scoreOutOf;
                            const clbLevel = result.clbLevel;
                            return (
                              <div className={`
                                text-center py-2 rounded
                                ${theme === 'dark' ? 'bg-slate-700/50 text-slate-200' : 'bg-slate-100 text-slate-700'}
                              `}>
                                <div className="text-lg font-bold">
                                  {score}
                                  {scoreOutOf && ` / ${scoreOutOf}`}
                                </div>
                                {clbLevel && (
                                  <div className="text-xs mt-1 font-semibold">
                                    {clbLevel}
                                  </div>
                                )}
                                {!clbLevel && scoreOutOf === 40 && (
                                  <div className="text-xs mt-1">
                                    {((score / scoreOutOf) * 100).toFixed(0)}% correct
                                  </div>
                                )}
                              </div>
                            );
                          }
                          return null;
                        })()}
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
                            📊 {t('actions.seeResults')}
                          </button>
                        )}
                      </>
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
            Progress: {completedModules.length} of 3 modules completed
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
              style={{ width: `${(completedModules.length / 3) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
