import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface TranscriptProps {
  transcript: string;
}

export const Transcript: React.FC<TranscriptProps> = ({ transcript }) => {
  const { t } = useLanguage();
  return (
    <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-700 transition-colors">
      <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-indigo-400 dark:text-indigo-300 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
        <span>📝</span> {t('results.transcriptTitle')}
      </h4>
      <div className="bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-inner max-h-[300px] sm:max-h-[400px] overflow-y-auto">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {transcript}
        </p>
      </div>
      <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mt-3 sm:mt-4 text-center italic">
        {t('results.transcriptSubtitle')}
      </p>
    </div>
  );
};
