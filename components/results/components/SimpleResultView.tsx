import React from 'react';
import { SavedResult } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { QuestionResultsView } from '../../QuestionResultsView';

interface SimpleResultViewProps {
  result: SavedResult;
  onBack: () => void;
}

export const SimpleResultView: React.FC<SimpleResultViewProps> = ({ result, onBack }) => {
  const { t } = useLanguage();
  const moduleName = result.module === 'reading' 
    ? t('results.readingResults') 
    : t('results.listeningResults');

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header with Back Button */}
      <button
        onClick={onBack}
        className="text-indigo-400 dark:text-indigo-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
      >
        <span>←</span> {t('back.toList')}
      </button>

      {/* Simple Header */}
      <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm transition-colors">
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100">
          {moduleName}
        </h2>
      </div>

      {/* Question Results */}
      {result.module === 'reading' && result.readingResult && (
        <QuestionResultsView
          result={result.readingResult}
          moduleName="Reading"
        />
      )}

      {result.module === 'listening' && result.listeningResult && (
        <QuestionResultsView
          result={result.listeningResult}
          moduleName="Listening"
        />
      )}
    </div>
  );
};
