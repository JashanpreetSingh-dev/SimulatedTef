import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface QuestionCountProps {
  actualCount: number;
  targetMin?: number;
  targetMax?: number;
}

export const QuestionCount: React.FC<QuestionCountProps> = ({ 
  actualCount, 
  targetMin = 9, 
  targetMax = 10 
}) => {
  const { t } = useLanguage();
  
  const isOnTarget = actualCount >= targetMin && actualCount <= targetMax;
  const isBelowTarget = actualCount < targetMin;
  const isAboveTarget = actualCount > targetMax;

  // Determine status color and message
  let statusColor = 'text-emerald-600 dark:text-emerald-400';
  let bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
  let borderColor = 'border-emerald-200 dark:border-emerald-800';
  let statusIcon = '✓';
  let statusMessage = t('results.questionCountGood');

  if (isBelowTarget) {
    statusColor = 'text-amber-600 dark:text-amber-400';
    bgColor = 'bg-amber-50 dark:bg-amber-900/20';
    borderColor = 'border-amber-200 dark:border-amber-800';
    statusIcon = '⚠';
    statusMessage = t('results.questionCountLow');
  } else if (isAboveTarget) {
    statusColor = 'text-blue-600 dark:text-blue-400';
    bgColor = 'bg-blue-50 dark:bg-blue-900/20';
    borderColor = 'border-blue-200 dark:border-blue-800';
    statusIcon = 'ℹ';
    statusMessage = t('results.questionCountHigh');
  }

  return (
    <div className={`p-4 sm:p-5 ${bgColor} rounded-xl sm:rounded-2xl border ${borderColor} transition-colors mb-6 sm:mb-8`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-lg ${statusColor}`}>{statusIcon}</span>
          <div>
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
              {t('results.questionsAsked')}
            </h4>
            <p className={`text-xs sm:text-sm ${statusColor} mt-0.5`}>
              {statusMessage}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl sm:text-3xl font-black ${statusColor}`}>
            {actualCount}
          </div>
          <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">
            {t('results.target')}: {targetMin}-{targetMax}
          </div>
        </div>
      </div>
    </div>
  );
};
