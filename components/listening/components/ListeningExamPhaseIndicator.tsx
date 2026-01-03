/**
 * Phase indicator component for listening exam
 * Shows current phase (reading/playing/answering) with countdown timer
 */

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { Phase } from '../hooks/useListeningExamState';

interface ListeningExamPhaseIndicatorProps {
  phase: Phase;
  timeRemaining: number;
  currentQuestionIndex: number;
  totalQuestions: number;
  isPracticeAssignment: boolean;
  formatTime: (seconds: number) => string;
}

export const ListeningExamPhaseIndicator: React.FC<ListeningExamPhaseIndicatorProps> = ({
  phase,
  timeRemaining,
  currentQuestionIndex,
  totalQuestions,
  isPracticeAssignment,
  formatTime,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Phase Indicator - only for mock exams
  if (isPracticeAssignment) {
    return null;
  }

  if (phase === 'reading') {
    return (
      <div className={`
        mb-6 p-4 rounded-lg text-center
        ${theme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}
      `}>
        <p className={`
          text-lg font-semibold mb-2
          ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}
        `}>
          {t('listeningExam.readQuestionCarefully')}
        </p>
        <p className={`
          text-2xl font-mono font-bold mb-1
          ${theme === 'dark' ? 'text-blue-100' : 'text-blue-700'}
        `}>
          {formatTime(timeRemaining)}
        </p>
        <p className={`
          text-sm
          ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}
        `}>
          {t('listeningExam.audioWillPlayAuto')}
        </p>
      </div>
    );
  }

  if (phase === 'answering') {
    return (
      <div className={`
        mb-6 p-4 rounded-lg text-center
        ${theme === 'dark' ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}
      `}>
        <p className={`
          text-lg font-semibold mb-2
          ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}
        `}>
          {t('listeningExam.chooseAnswer')}
        </p>
        <p className={`
          text-2xl font-mono font-bold mb-2
          ${theme === 'dark' ? 'text-yellow-100' : 'text-yellow-700'}
        `}>
          {formatTime(timeRemaining)}
        </p>
        <div className={`
          text-sm
          ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}
        `}>
          {currentQuestionIndex < totalQuestions - 1 ? (
            <p>{t('listeningExam.nextQuestionAuto')}</p>
          ) : (
            <p>{t('listeningExam.lastQuestion')}</p>
          )}
        </div>
      </div>
    );
  }

  return null;
};
