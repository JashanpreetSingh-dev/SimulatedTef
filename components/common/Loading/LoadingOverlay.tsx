import React, { useEffect, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';
import type { LoadingSize, LoadingColor, BaseLoadingProps } from './types';

export interface LoadingOverlayProps extends BaseLoadingProps {
  message?: string;
  spinnerSize?: LoadingSize;
  spinnerColor?: LoadingColor;
  trapFocus?: boolean; // Whether to trap focus within overlay
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  message,
  spinnerSize = 'lg',
  spinnerColor = 'primary',
  className = '',
  trapFocus = true,
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  // Focus management
  useEffect(() => {
    if (trapFocus && overlayRef.current) {
      // Save current active element
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      
      // Focus the overlay
      overlayRef.current.focus();
      
      // Trap focus within overlay
      const handleTabKey = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && overlayRef.current) {
          const focusableElements = overlayRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey) {
            if (document.activeElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (document.activeElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        }
      };

      document.addEventListener('keydown', handleTabKey);
      
      return () => {
        document.removeEventListener('keydown', handleTabKey);
        // Restore focus when overlay is removed
        if (previousActiveElementRef.current) {
          previousActiveElementRef.current.focus();
        }
      };
    }
  }, [trapFocus]);

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center ${className}`}
      role="status"
      aria-live="polite"
      aria-busy={true}
      aria-label={message || 'Loading overlay'}
      aria-modal="true"
      tabIndex={-1}
    >
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner
          size={spinnerSize}
          color={spinnerColor}
        />
        {message && (
          <p className="text-base font-medium text-white" aria-live="polite" aria-atomic="true">
            {message}
          </p>
        )}
      </div>
    </div>
  );
};
