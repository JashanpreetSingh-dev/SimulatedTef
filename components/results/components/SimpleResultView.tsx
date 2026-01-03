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
      {/* Check for moduleData (new structure) first, then fallback to legacy readingResult/listeningResult */}
      {result.module === 'reading' && (
        result.moduleData && result.moduleData.type === 'mcq' ? (
          <QuestionResultsView
            result={{
              taskId: result.taskReferences?.taskA?.taskId || '',
              answers: result.moduleData.answers,
              score: result.moduleData.score,
              totalQuestions: result.moduleData.totalQuestions,
              questionResults: result.moduleData.questionResults,
            }}
            moduleName="Reading"
          />
        ) : result.readingResult ? (
          <QuestionResultsView
            result={result.readingResult}
            moduleName="Reading"
          />
        ) : null
      )}

      {result.module === 'listening' && (
        result.moduleData && result.moduleData.type === 'mcq' ? (
          <QuestionResultsView
            result={{
              taskId: result.taskReferences?.taskA?.taskId || '',
              answers: result.moduleData.answers,
              score: result.moduleData.score,
              totalQuestions: result.moduleData.totalQuestions,
              questionResults: result.moduleData.questionResults,
            }}
            moduleName="Listening"
          />
        ) : result.listeningResult ? (
          <QuestionResultsView
            result={result.listeningResult}
            moduleName="Listening"
          />
        ) : null
      )}
      
      {/* Show message if no results data is available */}
      {result.module === 'reading' && !result.moduleData && !result.readingResult && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">No results data available for this assignment.</p>
        </div>
      )}
      
      {result.module === 'listening' && !result.moduleData && !result.listeningResult && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <p className="text-yellow-800 dark:text-yellow-200">No results data available for this assignment.</p>
        </div>
      )}
    </div>
  );
};
