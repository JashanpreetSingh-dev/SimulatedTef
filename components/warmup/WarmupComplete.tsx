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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50">
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

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-4">
        <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
          {feedback.wentWell}
          {feedback.levelNote ? ` ${feedback.levelNote}` : ''}
        </p>

        {feedback.practiceTip && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.25em]">
              {t('warmup.tomorrow')}
            </span>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              {feedback.practiceTip}
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onBackToDashboard}
        className="w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/30"
      >
        <span>↩</span>
        <span>{t('warmup.back')}</span>
      </button>
    </div>
  );
};
