import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface StrengthsWeaknessesProps {
  strengths: string[];
  weaknesses: string[];
}

export const StrengthsWeaknesses: React.FC<StrengthsWeaknessesProps> = ({ strengths, weaknesses }) => {
  const { t } = useLanguage();
  
  if (strengths.length === 0 && weaknesses.length === 0) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-12">
      {/* Strengths */}
      {strengths.length > 0 && (
        <div className="p-4 sm:p-6 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl sm:rounded-2xl border border-emerald-200 dark:border-emerald-800 transition-colors">
          <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 mb-3 sm:mb-4 tracking-widest flex items-center gap-2">
            <span>✓</span> {t('results.strengths')}
          </h4>
          <ul className="space-y-2 sm:space-y-3">
            {strengths.map((strength, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                <span className="text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5">•</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Weaknesses */}
      {weaknesses.length > 0 && (
        <div className="p-4 sm:p-6 bg-rose-50 dark:bg-rose-900/20 rounded-xl sm:rounded-2xl border border-rose-200 dark:border-rose-800 transition-colors">
          <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 mb-3 sm:mb-4 tracking-widest flex items-center gap-2">
            <span>!</span> {t('results.weaknesses')}
          </h4>
          <ul className="space-y-2 sm:space-y-3">
            {weaknesses.map((weakness, i) => (
              <li key={i} className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed flex items-start gap-2">
                <span className="text-rose-500 dark:text-rose-400 flex-shrink-0 mt-0.5">•</span>
                <span>{weakness}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
