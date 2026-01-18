import React from 'react';
import { WrittenTask } from '../../types';
import { GuidedFeedback } from '../../services/guidedWritingFeedback';
import { getWordCount } from '../writtenExpression/utils/textUtils';
import { formatTime } from '../writtenExpression/utils/formatTime';
import { useLanguage } from '../../contexts/LanguageContext';

interface CompanionPanelProps {
  task: WrittenTask;
  text: string;
  timeLeft: number;
  feedback: GuidedFeedback | null;
  isLoading: boolean;
  error: string | null;
  onRequestFeedback: () => void;
}

export const CompanionPanel: React.FC<CompanionPanelProps> = ({
  task,
  text,
  timeLeft,
  feedback,
  isLoading,
  error,
  onRequestFeedback,
}) => {
  const { t } = useLanguage();
  const wordCount = getWordCount(text);
  const progressPercentage = Math.min((wordCount / task.minWords) * 100, 100);
  const hasMinWords = wordCount >= task.minWords;

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800 md:border-l border-slate-200 dark:border-slate-700 border-t md:border-t-0">
      {/* Header */}
      <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <h3 className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">
          {t('guidedWriting.companionTitle')}
        </h3>
        <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400 mb-2">
          <span className="tabular-nums">{wordCount}/{task.minWords} {t('guidedWriting.words')}</span>
          <span className="tabular-nums">{formatTime(timeLeft)}</span>
        </div>
        <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              hasMinWords ? 'bg-emerald-500' : 'bg-indigo-500'
            }`}
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>

      {/* Get Feedback Button */}
      <div className="p-3 md:p-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
        <button
          onClick={onRequestFeedback}
          disabled={isLoading || !text.trim()}
          className="w-full py-2.5 md:py-3 bg-indigo-500 dark:bg-indigo-600 text-white rounded-lg font-semibold text-xs md:text-sm hover:bg-indigo-600 dark:hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-xs md:text-sm">{t('guidedWriting.analyzing')}</span>
            </>
          ) : (
            <span className="text-xs md:text-sm">{t('guidedWriting.getFeedback')}</span>
          )}
        </button>
      </div>

      {/* Feedback Content */}
      <div className="flex-1 overflow-y-auto p-3 md:p-4 space-y-3 md:space-y-4">
        {error && (
          <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 md:p-3">
            <p className="text-xs md:text-sm text-rose-600 dark:text-rose-400">{error}</p>
          </div>
        )}

        {!feedback && !isLoading && !error && (
          <div className="text-center py-6 md:py-8 text-slate-500 dark:text-slate-400">
            <p className="text-xs md:text-sm mb-2">👋 {t('guidedWriting.greeting')}</p>
            <p className="text-[10px] md:text-xs px-2">
              {t('guidedWriting.welcomeMessage')}
            </p>
          </div>
        )}

        {feedback && (
          <>
            {/* Encouragement */}
            {feedback.encouragement && (
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-2.5 md:p-3">
                <p className="text-xs md:text-sm font-medium text-emerald-800 dark:text-emerald-300">
                  {feedback.encouragement}
                </p>
              </div>
            )}

            {/* Progress */}
            {feedback.progress && (
              <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-2.5 md:p-3">
                <h4 className="text-[10px] md:text-xs font-semibold text-indigo-800 dark:text-indigo-300 mb-1 uppercase tracking-wide">
                  {t('guidedWriting.progress')}
                </h4>
                <p className="text-xs md:text-sm text-indigo-700 dark:text-indigo-400">{feedback.progress}</p>
              </div>
            )}

            {/* Grammar Corrections */}
            {feedback.grammarCorrections && feedback.grammarCorrections.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2.5 md:p-3">
                <h4 className="text-[10px] md:text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2 uppercase tracking-wide">
                  {t('guidedWriting.corrections')}
                </h4>
                <div className="space-y-2">
                  {feedback.grammarCorrections.map((correction, index) => (
                    <div key={index} className="text-xs md:text-sm">
                      <div className="flex items-start gap-2">
                        <span className="text-amber-600 dark:text-amber-400 flex-shrink-0">•</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-700 dark:text-slate-300 line-through break-words">
                            {correction.text}
                          </p>
                          <p className="text-emerald-700 dark:text-emerald-400 font-medium break-words">
                            → {correction.correction}
                          </p>
                          {correction.explanation && (
                            <p className="text-[10px] md:text-xs text-slate-600 dark:text-slate-400 mt-1 break-words">
                              {correction.explanation}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Suggestions */}
            {feedback.suggestions && feedback.suggestions.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 md:p-3">
                <h4 className="text-[10px] md:text-xs font-semibold text-blue-800 dark:text-blue-300 mb-2 uppercase tracking-wide">
                  {t('guidedWriting.suggestions')}
                </h4>
                <ul className="space-y-1">
                  {feedback.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-xs md:text-sm text-blue-700 dark:text-blue-400 flex items-start gap-2">
                      <span className="text-blue-500 dark:text-blue-400 flex-shrink-0">•</span>
                      <span className="break-words">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Ideas */}
            {feedback.ideas && feedback.ideas.length > 0 && (
              <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-2.5 md:p-3">
                <h4 className="text-[10px] md:text-xs font-semibold text-purple-800 dark:text-purple-300 mb-2 uppercase tracking-wide">
                  {t('guidedWriting.ideas')}
                </h4>
                <ul className="space-y-1">
                  {feedback.ideas.map((idea, index) => (
                    <li key={index} className="text-xs md:text-sm text-purple-700 dark:text-purple-400 flex items-start gap-2">
                      <span className="text-purple-500 dark:text-purple-400 flex-shrink-0">•</span>
                      <span className="break-words">{idea}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Structure Feedback */}
            {feedback.structureFeedback && (
              <div className="bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg p-2.5 md:p-3">
                <h4 className="text-[10px] md:text-xs font-semibold text-slate-800 dark:text-slate-300 mb-2 uppercase tracking-wide">
                  {t('guidedWriting.structure')}
                </h4>
                <p className="text-xs md:text-sm text-slate-700 dark:text-slate-400 break-words">{feedback.structureFeedback}</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};