import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { DAILY_RITUAL_FEATURE_CALLOUT_STORAGE_KEY } from '../../config/featureDiscovery';

/**
 * One-time dashboard spotlight for the Daily Ritual. Dismiss persists in localStorage.
 * If storage is unreadable, the callout stays visible; if dismiss write fails, UI still hides.
 */
export function DailyRitualFeatureCallout() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      if (localStorage.getItem(DAILY_RITUAL_FEATURE_CALLOUT_STORAGE_KEY)) {
        setOpen(false);
      }
    } catch {
      /* keep open — safer to show than hide */
    }
    setReady(true);
  }, []);

  const dismiss = () => {
    try {
      localStorage.setItem(DAILY_RITUAL_FEATURE_CALLOUT_STORAGE_KEY, '1');
    } catch {
      /* still hide for this session */
    }
    setOpen(false);
  };

  const go = () => {
    navigate('/practice/daily-ritual');
  };

  if (!ready || !open) return null;

  return (
    <div
      className="rounded-2xl border border-teal-200/80 dark:border-teal-700/60 bg-teal-50/90 dark:bg-teal-950/40 px-4 py-3 md:px-5 md:py-4 shadow-sm"
      role="region"
      aria-label={t('feature.dailyRitualCalloutTitle')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <p className="text-sm md:text-base font-bold text-teal-900 dark:text-teal-100">
            {t('feature.dailyRitualCalloutTitle')}
          </p>
          <p className="text-xs md:text-sm text-teal-800/90 dark:text-teal-200/90 leading-snug">
            {t('feature.dailyRitualCalloutBody')}
          </p>
        </div>
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 sm:flex-col sm:items-stretch md:flex-row md:items-center">
          <button
            type="button"
            onClick={go}
            className="rounded-lg bg-teal-600 px-3 py-2 text-xs md:text-sm font-semibold text-white shadow-sm hover:bg-teal-700 transition-colors"
          >
            {t('feature.dailyRitualCalloutCta')}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-lg px-3 py-2 text-xs md:text-sm font-semibold text-teal-800 dark:text-teal-200 hover:bg-teal-100/80 dark:hover:bg-teal-900/50 transition-colors"
          >
            {t('feature.dailyRitualCalloutDismiss')}
          </button>
        </div>
      </div>
    </div>
  );
}
