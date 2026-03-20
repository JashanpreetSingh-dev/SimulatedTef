import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  streak: number;
  feedback: {
    wentWell: string;
    practiceTip: string;
    levelNote: string;
  };
  topicsCovered: string[];
  durationSeconds: number;
  onBackToDashboard: () => void;
}

export const WarmupComplete: React.FC<Props> = ({
  streak,
  feedback,
  durationSeconds,
  onBackToDashboard,
}) => {
  const { t } = useLanguage();
  const minutes = Math.max(1, Math.round(durationSeconds / 60));

  return (
    <div className="space-y-6">
      <button
        onClick={onBackToDashboard}
        className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
      >
        ← {t('back.dashboard')}
      </button>

      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {t('warmup.greatSession')}
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            {t('warmup.todayFeedback')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
            <span>🔥</span>
            <span>{t('warmup.streakLabel', { count: String(streak) })}</span>
          </span>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <span>⏱</span>
            <span>{minutes} min</span>
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {feedback.wentWell && (
          <div className="flex items-start gap-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl px-4 py-3 border border-emerald-100 dark:border-emerald-800">
            <span className="text-lg shrink-0 mt-0.5">✅</span>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {feedback.wentWell.split(/[.!?]/)[0].trim()}{feedback.wentWell.match(/[.!?]/) ? feedback.wentWell.match(/[.!?]/)![0] : ''}
            </p>
          </div>
        )}
        {feedback.practiceTip && (
          <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl px-4 py-3 border border-amber-100 dark:border-amber-800">
            <span className="text-lg shrink-0 mt-0.5">💡</span>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {feedback.practiceTip.split(/[.!?]/)[0].trim()}{feedback.practiceTip.match(/[.!?]/) ? feedback.practiceTip.match(/[.!?]/)![0] : ''}
            </p>
          </div>
        )}
        {feedback.levelNote && (
          <div className="flex items-start gap-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl px-4 py-3 border border-indigo-100 dark:border-indigo-800">
            <span className="text-lg shrink-0 mt-0.5">📊</span>
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {feedback.levelNote.split(/[.!?]/)[0].trim()}{feedback.levelNote.match(/[.!?]/) ? feedback.levelNote.match(/[.!?]/)![0] : ''}
            </p>
          </div>
        )}
      </div>

    </div>
  );
};
