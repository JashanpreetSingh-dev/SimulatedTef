/**
 * Navigation component for listening exam
 * 
 * Mock exams: Only show submit button (auto-play, auto-next handles navigation)
 * Practice assignments: Show previous/next/submit buttons (user controls navigation)
 */

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Phase } from '../hooks/useListeningExamState';

interface ListeningExamNavigationProps {
  isFirstQuestion: boolean;
  isLastQuestion: boolean;
  isPracticeAssignment: boolean;
  phase: Phase;
  answeredCount: number;
  totalQuestions: number;
  isSubmitting: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export const ListeningExamNavigation: React.FC<ListeningExamNavigationProps> = ({
  isFirstQuestion,
  isLastQuestion,
  isPracticeAssignment,
  phase,
  answeredCount,
  totalQuestions,
  isSubmitting,
  onPrevious,
  onNext,
  onSubmit,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // For mock exams: only show submit button (navigation is automatic)
  // For practice assignments: show full navigation controls
  return (
    <div className="mb-4">
      <div className={`
        p-2 rounded-lg shadow-lg
        ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
      `}>
        <div className="flex flex-row gap-2">
          {/* Previous button - only show for practice assignments */}
          {isPracticeAssignment && (
            <button
              onClick={onPrevious}
              disabled={isFirstQuestion}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1
                ${isFirstQuestion
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }
              `}
            >
              <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="hidden sm:inline">{t('listeningExam.previous')}</span>
            </button>
          )}

          {/* Submit button - always show */}
          <button
            onClick={onSubmit}
            disabled={isSubmitting || answeredCount === 0}
            className={`
              ${isPracticeAssignment ? 'flex-2' : 'flex-1'} py-2 px-4 rounded-lg font-semibold transition-colors
              ${isSubmitting || answeredCount === 0
                ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
                : theme === 'dark'
                ? 'bg-red-600 hover:bg-red-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
              }
            `}
          >
            {isSubmitting ? t('listeningExam.submitting') : t('listeningExam.submitExam')}
          </button>

          {/* Next button - only show for practice assignments */}
          {isPracticeAssignment && (
            <button
              onClick={onNext}
              disabled={isLastQuestion}
              className={`
                flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1
                ${isLastQuestion
                  ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                  : theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                  : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                }
              `}
            >
              <span className="hidden sm:inline">{t('listeningExam.next')}</span>
              <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>

        {answeredCount < totalQuestions && (
          <p className={`
            mt-3 text-sm text-center hidden sm:block
            ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
          `}>
            {t('listeningExam.incompleteAnswers')}
          </p>
        )}
      </div>
    </div>
  );
};
