import React, { useState } from 'react';
import { ThemeStrategyPanel, THEME_STRATEGY_TOTAL } from '../strategy/ThemeStrategyPanel';

function Modal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative w-full sm:max-w-2xl bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Stratégie — Section B
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Choisis un thème · structure A–D–S
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-3 bg-violet-50 dark:bg-violet-900/20 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex gap-4 text-xs font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">A — Acknowledge</span>
            <span className="text-blue-600 dark:text-blue-400">D — Defend</span>
            <span className="text-violet-600 dark:text-violet-400">S — Solve</span>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 pb-2">
          <ThemeStrategyPanel />
        </div>
      </div>
    </div>
  );
}

export function OralBStrategyCard() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div
        className="h-full bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-violet-500/20 transition-all group cursor-pointer"
        onClick={() => setOpen(true)}
      >
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl group-hover:rotate-12 transition-transform">
            🛡️
          </div>
          <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/30">
            {THEME_STRATEGY_TOTAL} objections
          </span>
        </div>
        <h3 className="text-base md:text-xl font-bold text-white mb-1.5 md:mb-2">
          Stratégie Section B
        </h3>
        <p className="text-violet-100 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">
          Les objections fréquentes de chaque thème, avec une réponse A–D–S prête à utiliser.
        </p>
        <div className="flex items-center text-white font-bold text-xs md:text-sm">
          Voir le guide <span className="ml-1.5">→</span>
        </div>
      </div>

      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}
