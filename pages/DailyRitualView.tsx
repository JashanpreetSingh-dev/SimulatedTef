import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, useUser } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useIsD2C } from '../utils/userType';
import { usePageTour } from '../hooks/usePageTour';

const DAILY_RITUAL_STEPS = [
  {
    element: '#ritual-focus',
    popover: {
      title: '🎯 Choose your focus',
      description: "Vocabulary, grammar, or a mix tailored to TEF weak spots. Start with Mixed — it auto-targets the areas you need most.",
      side: 'top' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#ritual-level',
    popover: {
      title: '📊 Set your target level',
      description: "B2 is the TEF Canada minimum for permanent residency. Choose C1 if you want a comfortable score buffer.",
      side: 'top' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#tour-ritual-start-btn',
    popover: {
      title: '🚀 Start your session',
      description: "Hit this daily. Swipe right to mark a card mastered, left to review it again. 15 focused minutes beats 3 hours of cramming once a week.",
      side: 'top' as const,
      align: 'start' as const,
      nextBtnText: "Let's do it! →",
    },
  },
];
import { DashboardLayout } from '../layouts/DashboardLayout';
import { RitualCardStack } from '../components/dailyRitual/RitualCardStack';
import { RitualSelect } from '../components/dailyRitual/RitualSelect';
import {
  fetchDailyDeck,
  saveWeakCard,
  type DailyRitualFocus,
  type DailyRitualCefrHint,
} from '../services/dailyRitualApi';
import type { DailyRitualCard } from '../types';
import { BackNavButton, secondaryOutlineButtonClass } from '../components/navigation/BackNavButton';

type Phase = 'setup' | 'loading' | 'session' | 'complete' | 'error';

export function DailyRitualView() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { user } = useUser();
  const isD2C = useIsD2C();
  usePageTour(isD2C ? user?.id : undefined, 'daily_ritual', DAILY_RITUAL_STEPS);
  const [phase, setPhase] = useState<Phase>('setup');

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [focus, setFocus] = useState<DailyRitualFocus>('mixed');
  const [cefrHint, setCefrHint] = useState<DailyRitualCefrHint>('B2');
  const [cardCount, setCardCount] = useState(24);
  const [skipCache, setSkipCache] = useState(false);
  const [newDeckHelpOpen, setNewDeckHelpOpen] = useState(false);
  const [deck, setDeck] = useState<DailyRitualCard[]>([]);
  const [index, setIndex] = useState(0);
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [cachedNotice, setCachedNotice] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

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

  return (
    <DashboardLayout>
      <main className="flex-1 max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6 md:py-10">
        <div className="flex items-center justify-between gap-4 mb-3 sm:mb-6">
          <BackNavButton
            onClick={() => navigate('/dashboard')}
            label={t('back.dashboard')}
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
          <div className="rounded-2xl border-2 border-teal-200/80 dark:border-teal-800/50 bg-white dark:bg-slate-900/70 p-5 sm:p-7 shadow-sm space-y-6 sm:space-y-7">
            <div className="grid gap-5 sm:gap-6 sm:grid-cols-2">
              <div className="min-w-0">
                <label
                  htmlFor="ritual-focus"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2"
                >
                  {t('ritual.focus')}
                </label>
                <RitualSelect
                  id="ritual-focus"
                  value={focus}
                  onChange={(v) => setFocus(v as DailyRitualFocus)}
                  options={[
                    { value: 'mixed', label: t('ritual.focusMixed') },
                    { value: 'vocab', label: t('ritual.focusVocab') },
                    { value: 'grammar', label: t('ritual.focusGrammar') },
                  ]}
                />
              </div>
              <div className="min-w-0">
                <label
                  htmlFor="ritual-level"
                  className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2"
                >
                  {t('ritual.level')}
                </label>
                <RitualSelect
                  id="ritual-level"
                  value={cefrHint}
                  onChange={(v) => setCefrHint(v as DailyRitualCefrHint)}
                  options={[
                    { value: 'B2', label: 'B2' },
                    { value: 'C1', label: 'C1' },
                  ]}
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-700/80 p-4 sm:p-5">
              <label
                htmlFor="ritual-card-count"
                className="block text-sm font-semibold text-slate-800 dark:text-slate-100 mb-3"
              >
                {t('ritual.cardCount')}
              </label>
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <input
                  id="ritual-card-count"
                  type="range"
                  min={8}
                  max={36}
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="touch-manipulation flex-1 min-w-[140px] h-11 cursor-pointer accent-teal-600 dark:accent-teal-500 [color-scheme:light] dark:[color-scheme:dark]"
                />
                <output
                  htmlFor="ritual-card-count"
                  className="tabular-nums min-w-[5.5rem] rounded-lg bg-teal-100 dark:bg-teal-950/80 px-3 py-2 text-center text-base font-bold text-teal-900 dark:text-teal-100 ring-1 ring-teal-300/60 dark:ring-teal-700/60"
                >
                  {cardCount} {t('ritual.cards')}
                </output>
              </div>
            </div>

            <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-600 bg-slate-50/50 dark:bg-slate-800/30 p-3 sm:p-4">
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label
                      htmlFor="ritual-skip-cache-switch"
                      id="ritual-new-deck-label"
                      className="cursor-pointer text-sm sm:text-base font-medium leading-snug text-slate-800 dark:text-slate-100 touch-manipulation"
                    >
                      {t('ritual.newDeckOption')}
                    </label>
                    <button
                      type="button"
                      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-xs font-bold text-slate-600 shadow-sm hover:border-teal-400 hover:bg-teal-50 hover:text-teal-800 dark:border-slate-500 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-teal-500 dark:hover:bg-teal-950/50 dark:hover:text-teal-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 touch-manipulation"
                      aria-label={t('ritual.newDeckOptionHelpAria')}
                      aria-expanded={newDeckHelpOpen}
                      aria-controls="ritual-new-deck-help"
                      title={t('ritual.newDeckOptionDetail')}
                      onClick={() => setNewDeckHelpOpen((o) => !o)}
                    >
                      ?
                    </button>
                  </div>
                  {newDeckHelpOpen ? (
                    <p
                      id="ritual-new-deck-help"
                      className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300"
                      role="region"
                    >
                      {t('ritual.newDeckOptionDetail')}
                    </p>
                  ) : null}
                </div>
                <button
                  id="ritual-skip-cache-switch"
                  type="button"
                  role="switch"
                  aria-checked={skipCache}
                  aria-labelledby="ritual-new-deck-label"
                  onClick={() => setSkipCache((s) => !s)}
                  className={`
                    relative mt-0.5 flex h-8 w-14 shrink-0 cursor-pointer items-center rounded-full p-0.5 transition-colors touch-manipulation
                    focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
                    ${skipCache ? 'justify-end bg-teal-600' : 'justify-start bg-slate-300 dark:bg-slate-600'}
                  `}
                >
                  <span className="pointer-events-none block h-7 w-7 rounded-full bg-white shadow-sm ring-1 ring-black/5 dark:ring-white/10" aria-hidden />
                </button>
              </div>
            </div>

            <button
              id="tour-ritual-start-btn"
              type="button"
              onClick={startSession}
              className="touch-manipulation w-full min-h-[52px] rounded-xl bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-base font-bold shadow-md shadow-teal-900/20 transition-colors"
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
            <div className="mb-2 sm:mb-4 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {t('ritual.progress', {
                current: String(index + 1),
                total: String(deck.length),
              })}
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
              })}
            </p>
            <p className="text-sm text-slate-500 dark:text-slate-400">{t('ritual.completeShort')}</p>
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
                onClick={() => navigate('/dashboard')}
                className={secondaryOutlineButtonClass}
              >
                {t('back.dashboard')}
              </button>
            </div>
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
