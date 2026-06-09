import React, { useState, useRef, useCallback } from 'react';
import { TEFTask } from '../../types';

interface HintsCarouselProps {
  task: TEFTask;
  section: 'A' | 'B';
}

interface Card {
  examinerLine?: string;
  userLine: string;
}

function buildCards(task: TEFTask, section: 'A' | 'B'): Card[] {
  if (section === 'A') {
    const questions = task.expanded_questions?.length
      ? task.expanded_questions
      : task.suggested_questions ?? [];
    return questions.map((q) => ({ userLine: q }));
  }

  // Section B: pair counter_arguments[1..] with suggested_counters
  const args = (task.counter_arguments ?? []).slice(1); // skip header
  const counters = task.suggested_counters ?? [];
  return args.map((arg, i) => ({
    examinerLine: arg,
    userLine: counters[i] ?? '',
  })).filter((c) => c.userLine); // hide cards with no counter yet
}

export function HintsCarousel({ task, section }: HintsCarouselProps) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const cards = buildCards(task, section);

  const prev = useCallback(() => setIndex((i) => (i === 0 ? cards.length - 1 : i - 1)), [cards.length]);
  const next = useCallback(() => setIndex((i) => (i === cards.length - 1 ? 0 : i + 1)), [cards.length]);

  // Reset to first card when task or section changes
  React.useEffect(() => { setIndex(0); }, [task.id, section]);

  if (cards.length === 0) return null;

  const card = cards[index];
  const label = section === 'A' ? 'Questions à poser' : 'Réponses suggérées';
  const icon = section === 'A' ? '💬' : '💡';

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <div className="mt-3 md:mt-4 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 overflow-hidden shadow-sm transition-colors">
      {/* Header / toggle */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/40 transition-colors"
      >
        <span className="flex items-center gap-2 text-[11px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">
          <span>{icon}</span>
          {label}
          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 normal-case tracking-normal">
            ({cards.length})
          </span>
        </span>
        <span className={`text-slate-400 dark:text-slate-500 text-xs transition-transform duration-200 ${open ? 'rotate-180' : ''}`}>
          ▾
        </span>
      </button>

      {/* Carousel body */}
      {open && (
        <div className="border-t border-slate-100 dark:border-slate-700/60">
          {/* Card */}
          <div
            className="px-4 pt-4 pb-3 select-none"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {section === 'B' && card.examinerLine && (
              <div className="mb-3 px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                  Examinateur
                </p>
                <p className="text-sm italic text-slate-500 dark:text-slate-400 leading-relaxed">
                  « {card.examinerLine} »
                </p>
              </div>
            )}

            <div className={`px-3 py-2.5 rounded-xl ${section === 'A' ? 'bg-indigo-50 dark:bg-indigo-900/25 border border-indigo-100 dark:border-indigo-800/40' : 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40'}`}>
              {section === 'B' && (
                <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 dark:text-emerald-400 mb-1">
                  Vous pourriez dire
                </p>
              )}
              <p className={`text-sm leading-relaxed font-medium ${section === 'A' ? 'text-indigo-800 dark:text-indigo-200' : 'text-emerald-800 dark:text-emerald-200'}`}>
                {section === 'A' ? `« ${card.userLine} »` : card.userLine}
              </p>
            </div>
          </div>

          {/* Nav controls */}
          <div className="flex items-center justify-between px-4 pb-3">
            <button
              type="button"
              onClick={prev}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
              aria-label="Previous"
            >
              ❮
            </button>

            {/* Dot indicators */}
            <div className="flex items-center gap-1.5">
              {cards.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`rounded-full transition-all ${i === index ? 'w-4 h-1.5 bg-indigo-400 dark:bg-indigo-400' : 'w-1.5 h-1.5 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'}`}
                  aria-label={`Card ${i + 1}`}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={next}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-sm"
              aria-label="Next"
            >
              ❯
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
