import React from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  loadingText?: string;
  spinnerSize?: 'sm';
  children: React.ReactNode;
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  loading = false,
  loadingText,
  spinnerSize = 'sm',
  children,
  disabled,
  className = '',
  ...buttonProps
}) => {
  const isDisabled = disabled || loading;

  return (
    <button
      {...buttonProps}
      disabled={isDisabled}
      className={className}
      aria-busy={loading}
      aria-disabled={isDisabled}
      aria-live={loading ? 'polite' : undefined}
      aria-label={loading && loadingText ? loadingText : buttonProps['aria-label']}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <LoadingSpinner size={spinnerSize} color="white" />
          {loadingText && <span aria-live="polite">{loadingText}</span>}
          {!loadingText && children}
        </span>
      ) : (
        children
      )}
    </button>
  );
};
