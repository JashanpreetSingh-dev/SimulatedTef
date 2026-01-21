import React from 'react';
import type { LoadingSize, LoadingColor, BaseLoadingProps } from './types';

export interface LoadingSpinnerProps extends BaseLoadingProps {
  size?: LoadingSize;
  color?: LoadingColor;
  text?: string;
  fullScreen?: boolean;
}

const sizeClasses: Record<LoadingSize, string> = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
};

const colorClasses: Record<LoadingColor, string> = {
  primary: 'border-indigo-500 dark:border-indigo-400',
  secondary: 'border-slate-500 dark:border-slate-400',
  white: 'border-white',
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  color = 'primary',
  text,
  fullScreen = false,
  className = '',
}) => {
  const containerClasses = fullScreen
    ? 'fixed inset-0 flex items-center justify-center z-50'
    : 'flex items-center justify-center';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={true}
      aria-label={text || 'Loading'}
      className={`${containerClasses} ${className}`}
    >
      <div
        className={`animate-spin rounded-full border-b-2 transition-opacity duration-300 ${sizeClasses[size]} ${colorClasses[color]}`}
        aria-hidden="true"
        style={{
          animation: 'spin 1s linear infinite',
        }}
      />
      {text && (
        <p className="ml-3 text-slate-500 dark:text-slate-400 font-medium" aria-live="polite">
          {text}
        </p>
      )}
    </div>
  );
};
