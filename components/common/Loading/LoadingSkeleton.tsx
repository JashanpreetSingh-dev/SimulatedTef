import React from 'react';
import type { BaseLoadingProps } from './types';

export interface LoadingSkeletonProps extends BaseLoadingProps {
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  width?: string | number;
  height?: string | number;
  count?: number;
}

const variantClasses: Record<NonNullable<LoadingSkeletonProps['variant']>, string> = {
  text: 'h-4',
  circular: 'rounded-full',
  rectangular: '',
  card: 'h-48',
};

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  variant = 'text',
  width,
  height,
  count = 1,
  className = '',
}) => {
  const baseClasses = 'animate-pulse bg-slate-200 dark:bg-slate-700 rounded transition-opacity duration-300';
  const variantClass = variantClasses[variant];

  const getStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {};
    
    if (width !== undefined) {
      style.width = typeof width === 'number' ? `${width}px` : width;
    }
    
    if (height !== undefined) {
      style.height = typeof height === 'number' ? `${height}px` : height;
    } else if (variant === 'circular' && width !== undefined) {
      // For circular, use width as height if height not provided
      style.height = typeof width === 'number' ? `${width}px` : width;
    }
    
    return style;
  };

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${baseClasses} ${variantClass} ${className}`}
          style={getStyle()}
          aria-hidden="true"
        />
      ))}
    </>
  );
};
