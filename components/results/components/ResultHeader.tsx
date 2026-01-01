import React from 'react';
import { SavedResult } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getSectionBadgeColor, getSectionLabel, getCECRColor } from '../utils/resultHelpers';

interface ResultHeaderProps {
  result: SavedResult;
  audioPlayer?: React.ReactNode;
}

export const ResultHeader: React.FC<ResultHeaderProps> = ({ result, audioPlayer }) => {
  const { t } = useLanguage();

  return (
    <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-3 sm:p-4 md:p-6 shadow-sm transition-colors">
      <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        {/* Pills Section */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 md:gap-4">
          {/* Section Badge */}
          <div className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg border font-black text-xs sm:text-sm uppercase tracking-wider ${getSectionBadgeColor(result.mode)}`}>
            {t('results.section')} {getSectionLabel(result.mode, t)}
          </div>

          {/* CLB Pill */}
          <div className="bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80">CLB</span>
            <span className="text-base sm:text-lg font-black">{result.clbLevel}</span>
            <span className="text-[8px] sm:text-[9px] font-bold opacity-70 hidden sm:inline">({result.score}/699)</span>
          </div>

          {/* CECR Pill */}
          {result.cecrLevel && (
            <div className={`${getCECRColor(result.cecrLevel)} text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg flex items-center gap-1.5 sm:gap-2`}>
              <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider opacity-80">CECR</span>
              <span className="text-base sm:text-lg font-black">{result.cecrLevel}</span>
            </div>
          )}
        </div>

        {/* Audio Player - Full width on mobile, flex-1 on desktop */}
        {audioPlayer && (
          <div className="flex items-center gap-2 sm:gap-3 w-full md:flex-1 md:min-w-[200px]">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-shrink-0">🎙️</span>
            {audioPlayer}
          </div>
        )}
      </div>
    </div>
  );
};
