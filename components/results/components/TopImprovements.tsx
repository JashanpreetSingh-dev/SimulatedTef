import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TopImprovementsProps {
  improvements: string[];
}

export const TopImprovements: React.FC<TopImprovementsProps> = ({ improvements }) => {
  const { t } = useLanguage();
  if (improvements.length === 0) return null;

  return (
    <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:rounded-[2rem] border border-amber-100 dark:border-amber-800 transition-colors">
      <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-amber-600 dark:text-amber-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
        <span>🎯</span> {t('results.improvementPriorities')}
      </h4>
      <ol className="space-y-3 sm:space-y-4">
        {improvements.map((improvement, i) => (
          <li key={i} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2 sm:gap-3">
            <span className="flex-shrink-0 w-5 h-5 sm:w-6 sm:h-6 bg-amber-300 dark:bg-amber-600 text-white dark:text-white rounded-full flex items-center justify-center text-[10px] sm:text-xs font-black">
              {i + 1}
            </span>
            <span>{improvement}</span>
          </li>
        ))}
      </ol>
    </div>
  );
};
