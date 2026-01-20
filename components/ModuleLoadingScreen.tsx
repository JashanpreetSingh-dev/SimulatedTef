import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { LoadingSpinner, LoadingProgress } from './common/Loading';

interface ModuleLoadingScreenProps {
  moduleName?: string;
  progress?: number;
  error?: Error;
  onRetry?: () => void;
}

export const ModuleLoadingScreen: React.FC<ModuleLoadingScreenProps> = ({ 
  moduleName,
  progress,
  error,
  onRetry,
}) => {
  const { t } = useLanguage();

  const getModuleDisplayName = (module?: string) => {
    if (!module) return t('modules.oralExpression'); // Default fallback
    
    switch (module) {
      case 'reading':
        return t('modules.reading');
      case 'listening':
        return t('modules.listening');
      case 'oralExpression':
        return t('modules.oralExpression');
      case 'writtenExpression':
        return t('modules.writtenExpression');
      default:
        return t('modules.oralExpression');
    }
  };

  const moduleDisplayName = getModuleDisplayName(moduleName);

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
              {error.message || 'An error occurred while loading the module'}
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors"
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
      aria-busy={true}
      aria-label={t('loading.moduleLoading')}
    >
      <div className="max-w-md w-full bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 p-12 shadow-xl">
        <div className="mb-8 text-center">
          {progress !== undefined ? (
            <LoadingProgress 
              progress={progress} 
              message={t('loading.preparingModule', { module: moduleDisplayName })}
              showPercentage={true}
              className="mb-6"
            />
          ) : (
            <>
              <LoadingSpinner size="lg" color="primary" className="mb-6" />
              <h2 className="text-3xl font-black text-slate-800 dark:text-slate-100 mb-3 tracking-tight">
                {t('loading.moduleLoading')}
              </h2>
              <p className="text-slate-500 dark:text-slate-400 font-medium">
                {t('loading.preparingModule', { module: moduleDisplayName })}
              </p>
            </>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-indigo-50 dark:bg-slate-700/50 border-2 border-indigo-100 dark:border-slate-600">
            <div className="w-6 h-6 rounded-full bg-indigo-400 dark:bg-indigo-500 flex items-center justify-center flex-shrink-0 animate-pulse">
              <div className="w-2 h-2 bg-indigo-100/70 rounded-full"></div>
            </div>
            <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300 flex-1">
              {t('loading.preparingTasks')}
            </span>
          </div>
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-700/30 border-2 border-transparent opacity-60">
            <div className="w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-600 flex-shrink-0"></div>
            <span className="text-sm font-medium text-slate-500 dark:text-slate-400 flex-1">
              {t('loading.initializingExam')}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
