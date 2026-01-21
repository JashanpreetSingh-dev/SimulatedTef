import React from 'react';
import type { BaseLoadingProps } from './types';

export interface LoadingProgressProps extends BaseLoadingProps {
  progress?: number; // 0-100, undefined for indeterminate
  message?: string;
  showPercentage?: boolean;
}

export const LoadingProgress: React.FC<LoadingProgressProps> = ({
  progress,
  message,
  showPercentage = false,
  className = '',
}) => {
  const isIndeterminate = progress === undefined;
  const progressValue = Math.min(100, Math.max(0, progress ?? 0));

  return (
    <div className={`w-full ${className}`} role="status" aria-live="polite" aria-busy={!isIndeterminate && progressValue < 100}>
      {message && (
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2" id="progress-message">
          {message}
        </p>
      )}
      <div className="relative w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden" role="progressbar" aria-valuenow={isIndeterminate ? undefined : progressValue} aria-valuemin={0} aria-valuemax={100} aria-labelledby={message ? "progress-message" : undefined} aria-label={message || (isIndeterminate ? 'Loading in progress' : `Progress: ${progressValue}%`)}>
        {isIndeterminate ? (
          <div
            className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full animate-pulse"
            style={{ width: '30%' }}
            aria-hidden="true"
          />
        ) : (
          <div
            className="h-full bg-indigo-500 dark:bg-indigo-400 rounded-full transition-all duration-500 ease-out"
            style={{ 
              width: `${progressValue}%`,
              transition: 'width 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            aria-hidden="true"
          />
        )}
      </div>
      {showPercentage && !isIndeterminate && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-right" aria-live="polite" aria-atomic="true">
          {progressValue}%
        </p>
      )}
    </div>
  );
};
