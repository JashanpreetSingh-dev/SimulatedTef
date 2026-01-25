import React from 'react';
import { SavedResult, EvaluationResult } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getSectionBadgeColor, getSectionLabel, getCECRColor } from '../utils/resultHelpers';
import { ResultVoting } from './ResultVoting';

interface ResultHeaderProps {
  result: SavedResult;
  audioPlayer?: React.ReactNode;
  onVoteUpdate?: (updatedResult: SavedResult) => void;
}

export const ResultHeader: React.FC<ResultHeaderProps> = ({ result, audioPlayer, onVoteUpdate }) => {
  const { t } = useLanguage();

  // Get evaluation result - for partA/partB, check moduleData first, then fallback to main evaluation
  const evaluationResult = React.useMemo(() => {
    if (result.moduleData) {
      if (result.moduleData.type === 'oralExpression' || result.moduleData.type === 'writtenExpression') {
        if (result.mode === 'partA' && result.moduleData.sectionA?.result) {
          return result.moduleData.sectionA.result;
        } else if (result.mode === 'partB' && result.moduleData.sectionB?.result) {
          return result.moduleData.sectionB.result;
        }
      }
    }
    // Fallback to main evaluation or legacy structure
    return result.evaluation || result;
  }, [result]);

  // Type-safe access: evaluationResult could be EvaluationResult or SavedResult
  const clbLevel = ('clbLevel' in evaluationResult ? evaluationResult.clbLevel : undefined) || (result as any).clbLevel;
  const score = ('score' in evaluationResult ? evaluationResult.score : undefined) || (result as any).score;
  const cecrLevel = ('cecrLevel' in evaluationResult ? evaluationResult.cecrLevel : undefined) || (result as any).cecrLevel;

  return (
    <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-700 p-4 sm:p-6 shadow-sm transition-colors">
      <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-6">
        {/* Pills Section */}
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1 min-w-0">
          {/* Section Badge */}
          <div className={`px-4 py-2 rounded-lg border font-black text-sm uppercase tracking-wider ${getSectionBadgeColor(result.mode)}`}>
            {t('results.section')} {getSectionLabel(result.mode, t)}
          </div>

          {/* CLB Pill */}
          {clbLevel && (
            <div className="bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white px-4 py-2 rounded-lg flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider opacity-80">CLB</span>
              <span className="text-base sm:text-lg font-black">{clbLevel}</span>
              {score !== undefined && (
                <span className="text-xs font-bold opacity-70 hidden sm:inline">({score}/699)</span>
              )}
            </div>
          )}

          {/* CECR Pill */}
          {cecrLevel && (
            <div className={`${getCECRColor(cecrLevel)} text-white px-4 py-2 rounded-lg flex items-center gap-2`}>
              <span className="text-xs font-black uppercase tracking-wider opacity-80">CECR</span>
              <span className="text-base sm:text-lg font-black">{cecrLevel}</span>
            </div>
          )}
        </div>

        {/* Right side: Audio Player and Voting */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0 flex-wrap justify-end md:justify-start">
          {/* Audio Player */}
          {audioPlayer && (
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 sm:flex-initial order-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 flex-shrink-0">🎙️</span>
              <div className="min-w-0 flex-1">{audioPlayer}</div>
            </div>
          )}

          {/* Voting Component (compact, top right) - Desktop only */}
          {result.module === 'oralExpression' && !result.isLoading && (
            <div className="order-2 relative z-10 hidden md:block">
              <ResultVoting
                result={result}
                onVoteUpdate={onVoteUpdate}
                compact={true}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
