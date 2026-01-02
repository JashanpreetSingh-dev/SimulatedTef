import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface OverallCommentProps {
  comment: string;
  variant?: 'indigo' | 'blue';
}

export const OverallComment: React.FC<OverallCommentProps> = ({ comment, variant = 'indigo' }) => {
  const { t } = useLanguage();
  const bgClass = variant === 'blue' 
    ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800'
    : 'bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-200 dark:border-indigo-800';
  const textClass = variant === 'blue'
    ? 'text-blue-400 dark:text-blue-300'
    : 'text-indigo-400 dark:text-indigo-300';

  return (
    <div className={`mb-6 sm:mb-12 p-4 sm:p-8 rounded-xl sm:rounded-[2rem] border transition-colors ${bgClass}`}>
      <h4 className={`text-[9px] sm:text-[10px] font-black uppercase ${textClass} mb-3 sm:mb-4 tracking-widest`}>
        {variant === 'blue' ? t('results.overallComment') : t('results.globalEvaluation')}
      </h4>
      <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-medium">
        {comment}
      </p>
    </div>
  );
};
