import React from 'react';
import { UpgradedSentence } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';

interface UpgradedSentencesProps {
  sentences: UpgradedSentence[];
}

export const UpgradedSentences: React.FC<UpgradedSentencesProps> = ({ sentences }) => {
  const { t } = useLanguage();
  if (sentences.length === 0) return null;

  return (
    <div className="mb-6 sm:mb-12">
      <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
        <span>✨</span> {t('results.improvementExamples')}
      </h4>
      <div className="space-y-4 sm:space-y-6">
        {sentences.map((sentence: UpgradedSentence, i: number) => (
          <div key={i} className="bg-indigo-100/70 dark:bg-slate-700/50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-600 transition-colors">
            <div className="grid md:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4 md:gap-6">
              <div className="md:pr-3 md:border-r md:border-slate-200 md:dark:border-slate-600">
                <div className="text-[9px] sm:text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 mb-1.5 sm:mb-2 tracking-wider">{t('results.originalVersion')}</div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">"{sentence.weak}"</p>
              </div>
              <div className="md:pl-3">
                <div className="text-[9px] sm:text-[10px] font-black uppercase text-emerald-400 dark:text-emerald-300 mb-1.5 sm:mb-2 tracking-wider">{t('results.improvedVersion')}</div>
                <p className="text-xs sm:text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">"{sentence.better}"</p>
              </div>
            </div>
            <div className="pt-3 sm:pt-4 border-t border-slate-200 dark:border-slate-600">
              <div className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-1 tracking-wider">{t('results.explanation')}</div>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{sentence.why}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
