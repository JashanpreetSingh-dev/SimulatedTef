import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface WordCountProps {
  section: 'A' | 'B';
  actualCount: number;
  targetMin: number;
  targetMax: number;
}

export const WordCount: React.FC<WordCountProps> = ({ 
  section,
  actualCount, 
  targetMin,
  targetMax
}) => {
  const { t } = useLanguage();
  
  const isOnTarget = actualCount >= targetMin && actualCount <= targetMax;
  const isBelowTarget = actualCount < targetMin;
  const isAboveTarget = actualCount > targetMax;

  // Calculate percentage deviation
  const percentBelow = isBelowTarget ? Math.round((1 - actualCount / targetMin) * 100) : 0;
  const percentAbove = isAboveTarget ? Math.round((actualCount / targetMax - 1) * 100) : 0;

  // Determine status color and message
  let statusColor = 'text-emerald-600 dark:text-emerald-400';
  let bgColor = 'bg-emerald-50 dark:bg-emerald-900/20';
  let borderColor = 'border-emerald-200 dark:border-emerald-800';
  let statusIcon = '✓';
  let statusMessage = t('results.wordCountGood');

  if (isBelowTarget) {
    if (percentBelow > 30) {
      statusColor = 'text-rose-600 dark:text-rose-400';
      bgColor = 'bg-rose-50 dark:bg-rose-900/20';
      borderColor = 'border-rose-200 dark:border-rose-800';
      statusIcon = '⚠';
      statusMessage = t('results.wordCountVeryLow');
    } else {
      statusColor = 'text-amber-600 dark:text-amber-400';
      bgColor = 'bg-amber-50 dark:bg-amber-900/20';
      borderColor = 'border-amber-200 dark:border-amber-800';
      statusIcon = '⚠';
      statusMessage = t('results.wordCountLow');
    }
  } else if (isAboveTarget) {
    statusColor = 'text-blue-600 dark:text-blue-400';
    bgColor = 'bg-blue-50 dark:bg-blue-900/20';
    borderColor = 'border-blue-200 dark:border-blue-800';
    statusIcon = 'ℹ';
    statusMessage = t('results.wordCountHigh');
  }

  const sectionLabel = section === 'A' ? t('results.sectionAFaitDivers') : t('results.sectionBArgumentation');

  return (
    <div className={`p-4 sm:p-5 ${bgColor} rounded-xl sm:rounded-2xl border ${borderColor} transition-colors`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className={`text-lg ${statusColor}`}>{statusIcon}</span>
          <div>
            <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-widest">
              {t('results.wordCount')} - {sectionLabel}
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
