import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { DailyRitualCard } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';

const SWIPE_THRESHOLD = 56;
const FLY_OUT_X = 460;
const FLY_OUT_MS = 230;
/** Require clearer horizontal intent so vertical scroll inside the card still works. */
const TOUCH_DIRECTION_SLACK = 14;
const TOUCH_HORIZONTAL_RATIO = 1.35;

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
  const cardSurfaceRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const startX = useRef(0);
  const pointerIdRef = useRef<number | null>(null);
  const swipeHandledRef = useRef(false);
  const movedRef = useRef(false);
  const exitTimerRef = useRef<number | null>(null);
  const isAnimatingOutRef = useRef(false);
  const touchTrackingRef = useRef(false);
  const touchCommittedRef = useRef(false);
  const touchStartYRef = useRef(0);

  useEffect(() => {
    if (exitTimerRef.current) {
      window.clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
    setFlipped(false);
    setOffsetX(0);
    draggingRef.current = false;
    setDragging(false);
    setIsAnimatingOut(false);
  }, [card.id]);

  useEffect(() => {
    isAnimatingOutRef.current = isAnimatingOut;
  }, [isAnimatingOut]);

  useEffect(() => {
    return () => {
      if (exitTimerRef.current) {
        window.clearTimeout(exitTimerRef.current);
      }
    };
  }, []);

  const triggerAction = useCallback(
    (direction: -1 | 1) => {
      if (isAnimatingOutRef.current) return;

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
    [onMastered, onReview, prefersReducedMotion]
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isAnimatingOutRef.current) return;
    if (prefersReducedMotion) return;
    if (e.pointerType === 'touch') return;
    if (e.button !== undefined && e.button !== 0) return;
    swipeHandledRef.current = false;
    movedRef.current = false;
    const surface = cardSurfaceRef.current;
    if (surface?.setPointerCapture) {
      try {
        surface.setPointerCapture(e.pointerId);
      } catch {
        /* duplicate capture */
      }
    }
    pointerIdRef.current = e.pointerId;
    startX.current = e.clientX;
    draggingRef.current = true;
    setDragging(true);
  };

  const endDrag = useCallback(
    (clientX: number) => {
      const dx = clientX - startX.current;
      draggingRef.current = false;
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
    if (!draggingRef.current || prefersReducedMotion) return;
    const dx = e.clientX - startX.current;
    if (Math.abs(dx) > 12) movedRef.current = true;
    setOffsetX(dx);
  };

  const releaseCaptureSafe = (pointerId: number) => {
    const surface = cardSurfaceRef.current;
    if (surface?.releasePointerCapture) {
      try {
        surface.releasePointerCapture(pointerId);
      } catch {
        /* ignore */
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!draggingRef.current || prefersReducedMotion) return;
    releaseCaptureSafe(e.pointerId);
    endDrag(e.clientX);
  };

  const handlePointerCancel = (e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    setDragging(false);
    setOffsetX(0);
    pointerIdRef.current = null;
    releaseCaptureSafe(e.pointerId);
  };

  const handleLostPointerCapture = () => {
    draggingRef.current = false;
    setDragging(false);
    setOffsetX(0);
    pointerIdRef.current = null;
  };

  // Touch: separate path with non-passive touchmove after horizontal intent (no library).
  // Pointer + capture on iOS often fights overflow scroll; touch-action:none blocked vertical scroll.
  useEffect(() => {
    if (prefersReducedMotion) return;
    const el = cardSurfaceRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (isAnimatingOutRef.current) return;
      if (e.touches.length !== 1) return;
      touchTrackingRef.current = true;
      touchCommittedRef.current = false;
      swipeHandledRef.current = false;
      movedRef.current = false;
      startX.current = e.touches[0].clientX;
      touchStartYRef.current = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!touchTrackingRef.current || e.touches.length !== 1) return;
      const t = e.touches[0];
      const dx = t.clientX - startX.current;
      const dy = t.clientY - touchStartYRef.current;

      if (!touchCommittedRef.current) {
        if (Math.abs(dx) < TOUCH_DIRECTION_SLACK && Math.abs(dy) < TOUCH_DIRECTION_SLACK) return;
        const horizontal = Math.abs(dx) >= Math.abs(dy) * TOUCH_HORIZONTAL_RATIO;
        if (!horizontal) {
          touchTrackingRef.current = false;
          return;
        }
        touchCommittedRef.current = true;
        draggingRef.current = true;
        setDragging(true);
      }

      e.preventDefault();
      if (Math.abs(dx) > 12) movedRef.current = true;
      setOffsetX(dx);
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (!touchTrackingRef.current) {
        return;
      }
      touchTrackingRef.current = false;
      if (!touchCommittedRef.current) return;
      touchCommittedRef.current = false;
      draggingRef.current = false;
      setDragging(false);
      const t = e.changedTouches[0];
      if (!t) return;
      const dx = t.clientX - startX.current;
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
    };

    const onTouchCancel = () => {
      if (touchCommittedRef.current) {
        draggingRef.current = false;
        setDragging(false);
        setOffsetX(0);
      }
      touchTrackingRef.current = false;
      touchCommittedRef.current = false;
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchCancel, { passive: true });

    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchCancel);
    };
  }, [prefersReducedMotion, card.id, triggerAction]);

  const rotation = prefersReducedMotion ? 0 : Math.max(-14, Math.min(14, offsetX / 11));
  const dragScale = prefersReducedMotion ? 1 : dragging ? 1.01 : 1;

  // Swipe uses 2D transforms only. 3D flip (preserve-3d + backface-visibility) has proven
  // unreliable across Chromium/GPU paths and can render both faces invisible.
  const surfaceStyle: React.CSSProperties = prefersReducedMotion
    ? {}
    : {
        touchAction: 'pan-y',
        opacity: isAnimatingOut ? 0 : 1,
        transition: isAnimatingOut ? `opacity ${FLY_OUT_MS}ms ease-out` : undefined,
      };

  const swipeLayerStyle: React.CSSProperties | undefined = prefersReducedMotion
    ? undefined
    : {
        transform: `translateX(${offsetX}px) rotate(${rotation}deg) scale(${dragScale})`,
        transition: dragging
          ? 'none'
          : isAnimatingOut
            ? `transform ${FLY_OUT_MS}ms cubic-bezier(.2,.8,.2,1)`
            : 'transform 420ms cubic-bezier(.2,.85,.25,1)',
      };

  const faceTransition = prefersReducedMotion ? 'none' : 'opacity 320ms cubic-bezier(.2,.85,.25,1)';

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
        <p className="text-xs sm:text-sm leading-snug text-slate-700 dark:text-slate-200 border-l-2 border-teal-400/55 dark:border-teal-500/45 pl-2 sm:pl-3 mt-2">
          <span className="font-medium text-teal-800 dark:text-teal-300">{t('ritual.english')} </span>
          {card.ruleSummaryEnglish}
        </p>
        <ul className="list-none space-y-2.5 sm:space-y-3 pt-1 text-xs sm:text-sm text-slate-800 dark:text-slate-100">
          {card.examples.map((ex, i) => (
            <li key={i} className="leading-snug border-t border-teal-200/60 dark:border-teal-800/50 pt-2 first:border-t-0 first:pt-0">
              <span className="block">{ex.french}</span>
              <span className="mt-1 block text-slate-600 dark:text-slate-300">
                <span className="font-medium text-teal-800 dark:text-teal-300">{t('ritual.english')} </span>
                {ex.english}
              </span>
            </li>
          ))}
        </ul>
        {card.commonPitfall ? (
          <div className="text-[10px] sm:text-xs text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/40 rounded-lg p-2 sm:p-2.5 leading-snug space-y-1.5">
            <p>
              <span className="font-medium">{t('ritual.pitfall')} </span>
              {card.commonPitfall}
            </p>
            {card.commonPitfallEnglish ? (
              <p className="border-t border-amber-200/70 dark:border-amber-800/50 pt-1.5">
                <span className="font-medium text-amber-900 dark:text-amber-100">{t('ritual.english')} </span>
                {card.commonPitfallEnglish}
              </p>
            ) : null}
          </div>
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

      <div className="shrink-0">
        <div
          ref={cardSurfaceRef}
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
          onLostPointerCapture={handleLostPointerCapture}
          style={surfaceStyle}
          className={`
            relative rounded-xl md:rounded-2xl border-2 border-teal-300/90 dark:border-teal-500/45
            bg-teal-50/40 dark:bg-teal-950/35
            shadow-xl shadow-teal-900/8 dark:shadow-black/50 dark:ring-1 dark:ring-teal-400/15
            h-[clamp(220px,48dvh,340px)] sm:h-[min(54dvh,380px)] md:min-h-[360px] md:h-[min(54dvh,400px)]
            p-4 sm:p-5 md:p-8 cursor-pointer
            focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500
          `}
        >
          <div className="h-full min-h-0" style={swipeLayerStyle}>
            <div className="relative h-full min-h-0">
              <div
                className="absolute inset-0 flex flex-col justify-start overflow-y-auto overscroll-y-contain py-1 [-webkit-overflow-scrolling:touch]"
                style={{
                  opacity: flipped ? 0 : 1,
                  pointerEvents: flipped ? 'none' : 'auto',
                  transition: faceTransition,
                  zIndex: flipped ? 0 : 1,
                }}
                aria-hidden={flipped}
              >
                {frontContent}
              </div>
              <div
                className="absolute inset-0 flex flex-col justify-start overflow-y-auto overscroll-y-contain py-1 [-webkit-overflow-scrolling:touch]"
                style={{
                  opacity: flipped ? 1 : 0,
                  pointerEvents: flipped ? 'auto' : 'none',
                  transition: faceTransition,
                  zIndex: flipped ? 1 : 0,
                }}
                aria-hidden={!flipped}
              >
                {backContent}
              </div>
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
