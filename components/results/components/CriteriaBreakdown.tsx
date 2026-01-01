import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface CriteriaBreakdownProps {
  criteria: Record<string, any>;
}

export const CriteriaBreakdown: React.FC<CriteriaBreakdownProps> = ({ criteria }) => {
  const { t } = useLanguage();
  if (Object.keys(criteria).length === 0) return null;

  return (
    <div className="mb-6 sm:mb-12">
      <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 tracking-widest">{t('results.criteriaDetail')}</h4>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
        {Object.entries(criteria).map(([key, value]) => {
          const criterionValue = value as any;
          const score = typeof criterionValue === 'object' && criterionValue !== null && 'score' in criterionValue 
            ? criterionValue.score 
            : (typeof criterionValue === 'number' ? criterionValue : null);
          const comment = typeof criterionValue === 'object' && criterionValue !== null && 'comment' in criterionValue
            ? criterionValue.comment
            : (typeof criterionValue === 'string' ? criterionValue : null);
          
          return (
            <div key={key} className="bg-indigo-100/70 dark:bg-slate-700/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-600 transition-colors">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className="text-[10px] sm:text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </div>
                {score !== null && (
                  <div className="text-xl sm:text-2xl font-black text-indigo-400 dark:text-indigo-300">
                    {score}/10
                  </div>
                )}
              </div>
              {comment && (
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {comment}
                </div>
              )}
              {!comment && score === null && (
                <div className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 italic">
                  {typeof criterionValue === 'string' ? criterionValue : JSON.stringify(criterionValue)}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
