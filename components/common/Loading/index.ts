/**
 * Loading Components - Barrel Export
 * 
 * Centralized export point for all loading-related components and types.
 * This provides a clean import interface for consumers.
 * 
 * @example
 * ```tsx
 * import { LoadingSpinner, LoadingSkeleton, useLoading } from '@/components/common/Loading';
 * ```
 */

// Components
export { LoadingSpinner } from './LoadingSpinner';
export { LoadingSkeleton } from './LoadingSkeleton';
export { LoadingProgress } from './LoadingProgress';
export { LoadingOverlay } from './LoadingOverlay';
export { LoadingButton } from './LoadingButton';

// Types
export type {
  LoadingSize,
  LoadingColor,
  BaseLoadingProps,
  LoadingStatus,
  LoadingState,
} from './types';
