import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { RitualCardStack } from '../components/dailyRitual/RitualCardStack';
import {
  fetchDailyDeck,
  saveWeakCard,
  type DailyRitualFocus,
  type DailyRitualCefrHint,
} from '../services/dailyRitualApi';
import type { DailyRitualCard } from '../types';
import { BackNavButton, secondaryOutlineButtonClass } from '../components/navigation/BackNavButton';

type Phase = 'setup' | 'loading' | 'session' | 'complete' | 'error';

const SESSION_TARGET_SEC = 15 * 60;

export function DailyRitualView() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const [phase, setPhase] = useState<Phase>('setup');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focus, setFocus] = useState<DailyRitualFocus>('mixed');
  const [cefrHint, setCefrHint] = useState<DailyRitualCefrHint>('B2');
  const [cardCount, setCardCount] = useState(24);
  const [skipCache, setSkipCache] = useState(false);
  const [deck, setDeck] = useState<DailyRitualCard[]>([]);
  const [index, setIndex] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [sessionSeconds, setSessionSeconds] = useState(0);
  const [cachedNotice, setCachedNotice] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (phase !== 'session') return;
    const id = window.setInterval(() => setSessionSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [phase]);

  const formatClock = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const startSession = useCallback(async () => {
    setPhase('loading');
    setErrorMessage(null);
    try {
      const res = await fetchDailyDeck(getToken, { focus, cefrHint, cardCount, skipCache });
      setDeck(res.cards);
      setCachedNotice(res.cached);
      setIndex(0);
      setMasteredCount(0);
      setReviewCount(0);
      setSessionSeconds(0);
      setPhase('session');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : t('ritual.loadError'));
      setPhase('error');
    }
  }, [getToken, focus, cefrHint, cardCount, skipCache, t]);

  const current = deck[index] ?? null;
  const nextCard = deck[index + 1] ?? null;

  const advance = useCallback(() => {
    setIndex((i) => {
      if (i + 1 >= deck.length) {
        setPhase('complete');
        return i;
      }
      return i + 1;
    });
  }, [deck.length]);

  const handleMastered = useCallback(() => {
    setMasteredCount((c) => c + 1);
    advance();
  }, [advance]);

  const handleReview = useCallback(() => {
    const c = deck[index];
    if (c) {
      saveWeakCard(getToken, c).catch(() => {
        /* non-blocking */
      });
    }
    setReviewCount((n) => n + 1);
    advance();
  }, [deck, index, getToken, advance]);

  useEffect(() => {
    if (phase !== 'session') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleMastered();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleReview();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleMastered, handleReview]);

  const remaining = deck.length - index;
  const estMinutesLeft = Math.max(1, Math.ceil((remaining * 35) / 60));

  return (
    <DashboardLayout>
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-3 sm:mb-6">
          <BackNavButton
            onClick={() => navigate('/practice')}
            label={t('back.practice')}
            marginClassName="mb-0"
          />
        </div>

        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1 sm:mb-2">
          {t('ritual.title')}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mb-5 sm:mb-8 leading-snug">
          {t('ritual.subtitle')}
        </p>

        {phase === 'setup' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-6 space-y-6 shadow-sm">
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                {t('ritual.focus')}
              </label>
              <select
                value={focus}
                onChange={(e) => setFocus(e.target.value as DailyRitualFocus)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value="mixed">{t('ritual.focusMixed')}</option>
                <option value="vocab">{t('ritual.focusVocab')}</option>
                <option value="grammar">{t('ritual.focusGrammar')}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                {t('ritual.level')}
              </label>
              <select
                value={cefrHint}
                onChange={(e) => setCefrHint(e.target.value as DailyRitualCefrHint)}
                className="w-full rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-4 py-2.5 text-slate-900 dark:text-slate-100"
              >
                <option value="B2">B2</option>
                <option value="C1">C1</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">
                {t('ritual.cardCount')}
              </label>
              <input
                type="range"
                min={8}
                max={36}
                value={cardCount}
                onChange={(e) => setCardCount(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-sm text-slate-500 mt-1">
                {cardCount} {t('ritual.cards')}
              </p>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipCache}
                onChange={(e) => setSkipCache(e.target.checked)}
                className="rounded border-slate-300"
              />
              <span className="text-sm text-slate-700 dark:text-slate-200">{t('ritual.skipCache')}</span>
            </label>
            <button
              type="button"
              onClick={startSession}
              className="w-full py-3 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold shadow-md shadow-teal-900/15 transition-colors"
            >
              {t('ritual.start')}
            </button>
          </div>
        )}

        {phase === 'loading' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-12 text-center">
            <p className="text-slate-600 dark:text-slate-300 animate-pulse">{t('ritual.generating')}</p>
          </div>
        )}

        {phase === 'error' && (
          <div className="rounded-2xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-6">
            <p className="text-red-800 dark:text-red-200">{errorMessage}</p>
            <button
              type="button"
              onClick={() => setPhase('setup')}
              className="mt-4 text-sm font-semibold text-teal-700 dark:text-teal-400"
            >
              {t('ritual.backSetup')}
            </button>
          </div>
        )}

        {phase === 'session' && current && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2 sm:mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              <span>
                {t('ritual.progress', {
                  current: String(index + 1),
                  total: String(deck.length),
                })}
              </span>
              <span>
                {t('ritual.timer', { time: formatClock(sessionSeconds) })}
                {' · '}
                {t('ritual.estRemaining', { m: String(estMinutesLeft) })}
              </span>
            </div>
            {cachedNotice ? (
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 mb-2 sm:mb-3 leading-snug">
                {t('ritual.cachedDeck')}
              </p>
            ) : null}
            <RitualCardStack
              card={current}
              nextCard={nextCard}
              onMastered={handleMastered}
              onReview={handleReview}
              prefersReducedMotion={prefersReducedMotion}
            />
            <p className="hidden md:block text-center text-xs text-slate-500 dark:text-slate-500 mt-3 sm:mt-4">
              {t('ritual.keyboardHint')}
            </p>
          </div>
        )}

        {phase === 'complete' && (
          <div className="rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900/60 p-8 text-center space-y-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-slate-50">{t('ritual.completeTitle')}</h2>
            <p className="text-slate-600 dark:text-slate-300">
              {t('ritual.completeStats', {
                mastered: String(masteredCount),
                review: String(reviewCount),
                time: formatClock(sessionSeconds),
              })}
            </p>
            {sessionSeconds < SESSION_TARGET_SEC ? (
              <p className="text-sm text-slate-500">{t('ritual.completeShort')}</p>
            ) : (
              <p className="text-sm text-slate-500">{t('ritual.completeNice')}</p>
            )}
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
              <button
                type="button"
                onClick={() => {
                  setPhase('setup');
                  setDeck([]);
                }}
                className={secondaryOutlineButtonClass}
              >
                {t('ritual.newSession')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/practice')}
                className={secondaryOutlineButtonClass}
              >
                {t('back.practice')}
              </button>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
