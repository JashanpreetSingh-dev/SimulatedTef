import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DailyRitualCard } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

const SWIPE_THRESHOLD = 72;
const FLY_OUT_X = 460;
const FLY_OUT_MS = 230;

export interface RitualCardStackProps {
  card: DailyRitualCard;
  nextCard: DailyRitualCard | null;
  onMastered: () => void;
  onReview: () => void;
  prefersReducedMotion: boolean;
}

export function RitualCardStack({
  card,
  nextCard,
  onMastered,
  onReview,
  prefersReducedMotion,
}: RitualCardStackProps) {
  const { t } = useLanguage();
  const [flipped, setFlipped] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);
  const startX = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const swipeHandledRef = useRef(false);
  const movedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setFlipped(false);
    setOffsetX(0);
    setDragging(false);
    setIsAnimatingOut(false);
  }, [card.id]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const triggerAction = useCallback(
    (direction: -1 | 1) => {
      if (isAnimatingOut) return;

      if (prefersReducedMotion) {
        if (direction === 1) onMastered();
        else onReview();
        return;
      }

      setIsAnimatingOut(true);
      setOffsetX(direction * FLY_OUT_X);
      exitTimerRef.current = window.setTimeout(() => {
        if (direction === 1) onMastered();
        else onReview();
      }, FLY_OUT_MS);
    },
    [isAnimatingOut, onMastered, onReview, prefersReducedMotion]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimatingOut) return;
    if (prefersReducedMotion) return;
    if (e.button !== undefined && e.button !== 0) return;
    swipeHandledRef.current = false;
    movedRef.current = false;
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
    pointerIdRef.current = e.pointerId;
    startX.current = e.clientX;
    setDragging(true);
  };

  const endDrag = useCallback(
    (clientX: number) => {
      const dx = clientX - startX.current;
      setDragging(false);
      pointerIdRef.current = null;
      if (dx > SWIPE_THRESHOLD) {
        swipeHandledRef.current = true;
        triggerAction(1);
        return;
      }
      if (dx < -SWIPE_THRESHOLD) {
        swipeHandledRef.current = true;
        triggerAction(-1);
        return;
      }
      setOffsetX(0);
    },
    [triggerAction]
  );

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragging || prefersReducedMotion) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 12) movedRef.current = true;
    setOffsetX(dx);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragging || prefersReducedMotion) return;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
    endDrag(e.clientX);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (!dragging) return;
    setDragging(false);
    setOffsetX(0);
    pointerIdRef.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      /* ignore */
    }
  };

  const rotation = prefersReducedMotion ? 0 : Math.max(-14, Math.min(14, offsetX / 11));
  const dragScale = prefersReducedMotion ? 1 : dragging ? 1.01 : 1;
  const cardStyle: React.CSSProperties = prefersReducedMotion
    ? {}
    : {
        transform: `translateX(${offsetX}px) rotate(${rotation}deg) scale(${dragScale})`,
        transition: dragging
          ? 'none'
          : isAnimatingOut
            ? `transform ${FLY_OUT_MS}ms cubic-bezier(.2,.8,.2,1), opacity ${FLY_OUT_MS}ms ease-out`
            : 'transform 340ms cubic-bezier(.2,.85,.25,1)',
        opacity: isAnimatingOut ? 0 : 1,
        touchAction: 'none',
      };

  const frontContent =
    card.type === 'vocab' ? (
      <div className="space-y-2 sm:space-y-3 text-left">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
          {t('ritual.vocab')}
        </p>
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
          {card.lemma}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-l-2 border-teal-400/60 pl-2 sm:pl-3">
          <span className="font-medium text-teal-800 dark:text-teal-300">{t('ritual.english')} </span>
          {card.englishLine}
        </p>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 pt-1 sm:pt-2">{t('ritual.tapToReveal')}</p>
      </div>
    ) : (
      <div className="space-y-2 sm:space-y-3 text-left">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
          {t('ritual.grammar')}
        </p>
        <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 dark:text-slate-50 leading-tight">
          {card.title}
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 border-l-2 border-teal-400/60 pl-2 sm:pl-3">
          <span className="font-medium text-teal-800 dark:text-teal-300">{t('ritual.english')} </span>
          {card.englishLine}
        </p>
        <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 pt-1 sm:pt-2">{t('ritual.tapToReveal')}</p>
      </div>
    );

  const backContent =
    card.type === 'vocab' ? (
      <div className="space-y-2 sm:space-y-3 text-left">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
          {t('ritual.french')}
        </p>
        <p className="text-xs sm:text-sm leading-snug text-slate-800 dark:text-slate-100">
          <span className="font-medium text-slate-600 dark:text-slate-400">{t('ritual.context')} </span>
          {card.contextSentence}
        </p>
        <p className="text-xs sm:text-sm leading-snug text-slate-800 dark:text-slate-100 border-t border-teal-200/70 dark:border-teal-800/60 pt-2 sm:pt-3">
          {card.explanation}
        </p>
        {card.registerNote ? (
          <p className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400">
            <span className="font-medium">{t('ritual.register')} </span>
            {card.registerNote}
          </p>
        ) : null}
      </div>
    ) : (
      <div className="space-y-2 sm:space-y-3 text-left">
        <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-400">
          {t('ritual.french')}
        </p>
        <p className="text-xs sm:text-sm leading-snug text-slate-800 dark:text-slate-100">{card.ruleSummary}</p>
        <ul className="list-disc pl-4 sm:pl-5 space-y-1 text-xs sm:text-sm text-slate-800 dark:text-slate-100">
          {card.examples.map((ex, i) => (
            <li key={i} className="leading-snug">
              {ex}
            </li>
          ))}
        </ul>
        {card.commonPitfall ? (
          <p className="text-[10px] sm:text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2 sm:p-2.5 leading-snug">
            <span className="font-medium">{t('ritual.pitfall')} </span>
            {card.commonPitfall}
          </p>
        ) : null}
      </div>
    );

  return (
    <div className="relative w-full max-w-xl mx-auto flex flex-col gap-2 sm:gap-3 md:min-h-[420px]">
      {nextCard ? (
        <div
          className="absolute inset-x-0 top-1 sm:top-2 mx-auto w-[94%] max-w-xl rounded-xl md:rounded-2xl border border-teal-200/70 dark:border-teal-800/50 bg-teal-100/60 dark:bg-teal-950/50 h-[clamp(200px,46dvh,300px)] sm:h-[min(52dvh,340px)] md:h-[380px] opacity-75 scale-[0.97] -z-10 shadow-sm"
          aria-hidden
        />
      ) : null}

      <div className="shrink-0" style={{ perspective: 1100 }}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => {
            if (isAnimatingOut) return;
            if (swipeHandledRef.current) {
              swipeHandledRef.current = false;
              return;
            }
            if (movedRef.current) {
              movedRef.current = false;
              return;
            }
            setFlipped((f) => !f);
          }}
          onKeyDown={(e) => {
            if (isAnimatingOut) return;
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault();
              setFlipped((f) => !f);
            }
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerCancel}
          style={cardStyle}
          className={`
            relative rounded-xl md:rounded-2xl border-2 border-teal-300/90 dark:border-teal-500/45
            bg-teal-50/40 dark:bg-teal-950/35
            shadow-xl shadow-teal-900/8 dark:shadow-black/50 dark:ring-1 dark:ring-teal-400/15
            h-[clamp(220px,48dvh,340px)] sm:h-[min(54dvh,380px)] md:h-auto md:min-h-[360px]
            p-4 sm:p-5 md:p-8 cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
          `}
        >
          <div
            className="relative h-full min-h-0"
            style={{
              transformStyle: 'preserve-3d',
              transition: prefersReducedMotion ? 'none' : 'transform 420ms cubic-bezier(.2,.75,.2,1)',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            <div
              className="absolute inset-0 flex flex-col justify-start sm:justify-center overflow-y-auto overscroll-y-contain py-0.5 [-webkit-overflow-scrolling:touch]"
              style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
              aria-hidden={flipped}
            >
              {frontContent}
            </div>
            <div
              className="absolute inset-0 flex flex-col justify-start sm:justify-center overflow-y-auto overscroll-y-contain py-0.5 [-webkit-overflow-scrolling:touch]"
              style={{
                transform: 'rotateY(180deg)',
                backfaceVisibility: 'hidden',
                WebkitBackfaceVisibility: 'hidden',
              }}
              aria-hidden={!flipped}
            >
              {backContent}
            </div>
          </div>
        </div>
      </div>

      {!prefersReducedMotion ? (
        <p className="text-center text-[10px] sm:text-xs text-teal-800/80 dark:text-teal-300/80 mt-1 sm:mt-2 md:mt-3 leading-tight px-1">
          {t('ritual.swipeHint')}
        </p>
      ) : null}

      <div
        className="
          grid grid-cols-2 gap-2 sm:flex sm:flex-row sm:justify-center sm:gap-3
          mt-2 sm:mt-4 md:mt-6
          pb-[max(0.25rem,env(safe-area-inset-bottom))]
          shrink-0
        "
      >
        <button
          type="button"
          onClick={() => triggerAction(-1)}
          disabled={isAnimatingOut}
          className="
            min-h-[44px] touch-manipulation
            py-2.5 px-2 sm:px-5 rounded-lg sm:rounded-xl
            text-xs sm:text-sm
            border-2 border-teal-400/60 dark:border-teal-600/50
            text-teal-900 dark:text-teal-100 font-semibold
            hover:bg-teal-100/80 dark:hover:bg-teal-900/40 transition-colors
            text-center leading-tight
          "
          title={t('ritual.reviewLater')}
        >
          {t('ritual.reviewLater')}
        </button>
        <button
          type="button"
          onClick={() => triggerAction(1)}
          disabled={isAnimatingOut}
          className="
            min-h-[44px] touch-manipulation
            py-2.5 px-2 sm:px-5 rounded-lg sm:rounded-xl
            text-xs sm:text-sm
            bg-teal-600 hover:bg-teal-700 text-white font-semibold
            shadow-md shadow-teal-900/20 transition-colors
            text-center leading-tight
          "
          title={t('ritual.mastered')}
        >
          {t('ritual.mastered')}
        </button>
      </div>
    </div>
  );
}
