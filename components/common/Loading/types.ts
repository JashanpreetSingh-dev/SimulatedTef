/**
 * Shared TypeScript types and interfaces for loading components
 */

export type LoadingSize = 'sm' | 'md' | 'lg';
export type LoadingColor = 'primary' | 'secondary' | 'white';

/**
 * Base props interface for loading components
 */
export interface BaseLoadingProps {
  className?: string;
}

/**
 * Loading state type for useLoading hook
 */
export type LoadingStatus = 'idle' | 'loading' | 'success' | 'error';

/**
 * Loading state interface
 */
export interface LoadingState {
  status: LoadingStatus;
  progress: number;
  message?: string;
  error?: Error;
}
