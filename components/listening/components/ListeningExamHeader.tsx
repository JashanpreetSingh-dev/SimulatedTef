/**
 * Header component for listening exam
 * Displays title, close button, progress, and progress bar
 */

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ListeningExamHeaderProps {
  currentQuestionIndex: number;
  totalQuestions: number;
  answeredCount: number;
  onClose?: () => void;
}

export const ListeningExamHeader: React.FC<ListeningExamHeaderProps> = ({
  currentQuestionIndex,
  totalQuestions,
  answeredCount,
  onClose,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className={`
          text-2xl md:text-3xl font-bold
          ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
        `}>
          Listening Comprehension
        </h1>
        {onClose && (
          <button
            onClick={onClose}
            className={`
              px-4 py-2 rounded-lg transition-colors
              ${theme === 'dark' 
                ? 'bg-slate-700 hover:bg-slate-600 text-slate-100' 
                : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }
            `}
          >
            {t('listeningExam.close')}
          </button>
        )}
      </div>

      {/* Progress */}
      <div className={`
        px-4 py-2 rounded-lg mb-4 text-center
        ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-300'}
      `}>
        {t('listeningExam.questionOf').replace('{current}', String(currentQuestionIndex + 1)).replace('{total}', String(totalQuestions))} • {answeredCount} {t('listeningExam.answered')}
      </div>

      {/* Progress Bar */}
      <div className={`
        w-full h-2 rounded-full overflow-hidden mb-4
        ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}
      `}>
        <div
          className={`
            h-full transition-all duration-300
            ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}
          `}
          style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>
    </div>
  );
};
