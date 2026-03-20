import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { warmupService } from '../../services/warmupService';

interface Props {
  onStart: (config: {
    systemPrompt: string;
    topic: string;
    keywords: string[];
    sessionId?: string;
    userLevel: string;
    streak: number;
  }) => void;
}

export const WarmupDashboard: React.FC<Props> = ({ onStart }) => {
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [config, setConfig] = useState<{
    systemPrompt: string;
    topic: string;
    keywords: string[];
    userLevel: string;
    streak: number;
  } | null>(null);
  const [sessionCompletedToday, setSessionCompletedToday] = useState(false);

  const localDate = useMemo(
    () => new Date().toLocaleDateString('en-CA'),
    [],
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const cfg = await warmupService.getConfig(localDate, getToken);

        if (cancelled) return;

        setConfig(cfg);
        // If streak is returned and session was completed, check via a separate state
        // We detect "completed today" by checking if the config returns a sessionId that was already used
        // For simplicity, we treat it as not completed unless we get a specific signal
      } catch (err: any) {
        if (!cancelled) {
          setError(
            err?.message ||
              t('warmup.configLoadError'),
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [localDate]);

  const handleStartClick = async () => {
    if (!config) return;
    try {
      const { sessionId } = await warmupService.startSession(localDate, getToken);
      onStart({
        systemPrompt: config.systemPrompt,
        topic: config.topic,
        keywords: config.keywords,
        sessionId,
        userLevel: config.userLevel,
        streak: config.streak,
      });
    } catch (err: any) {
      setError(
        err?.message ||
          t('warmup.startError'),
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors flex-shrink-0"
          >
            ← {t('back.dashboard')}
          </button>
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {t('warmup.title')}
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            {t('warmup.subtitle')}
          </p>
        </div>
        {config && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200 shrink-0">
            <span>🔥</span>
            <span>{t('warmup.streak', { count: String(config.streak || 0) })}</span>
          </span>
        )}
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-4">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-[0.25em]">
          {t('warmup.topicLabel')}
        </div>

        {loading && (
          <div className="space-y-3">
            <div className="h-7 w-2/3 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-6 w-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
              ))}
            </div>
          </div>
        )}

        {!loading && config && (
          <>
            <h3 className="text-xl md:text-2xl font-semibold text-slate-800 dark:text-slate-100">
              {config.topic}
            </h3>
            <div className="flex flex-wrap gap-2">
              {config.keywords.map((k) => (
                <span
                  key={k}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100"
                >
                  {k}
                </span>
              ))}
            </div>
          </>
        )}

        {!loading && !config && !error && (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {t('warmup.topicLoadError')}
          </p>
        )}

        {error && (
          <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p>
        )}
      </div>

      <button
        onClick={handleStartClick}
        disabled={loading || !config || sessionCompletedToday}
        className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 ${
          loading || !config || sessionCompletedToday
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
            : 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-lg shadow-amber-400/30'
        }`}
      >
        {sessionCompletedToday ? (
          <>
            <span>✅</span>
            <span>{t('warmup.alreadyDone')}</span>
          </>
        ) : (
          <>
            <span>🎙</span>
            <span>{t('warmup.start')}</span>
          </>
        )}
      </button>
    </div>
  );
};
