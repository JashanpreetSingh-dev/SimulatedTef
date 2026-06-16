import React, { useState } from 'react';
import strategyData from '../../data/section_b_universal_strategy.json';

interface StrategyCategory {
  id: string;
  category: string;
  icon: string;
  exampleObjection: string;
  acknowledge: string;
  defend: string;
  solve: string;
  fullResponse: string;
}

const categories = strategyData as StrategyCategory[];

function Modal({ onClose }: { onClose: () => void }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full sm:max-w-2xl bg-white dark:bg-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">
              Réponses universelles — Section B
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {categories.length} catégories d'objections · structure A–D–S
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors text-sm font-bold"
          >
            ✕
          </button>
        </div>

        {/* ADS legend */}
        <div className="px-6 py-3 bg-violet-50 dark:bg-violet-900/20 border-b border-slate-100 dark:border-slate-700 shrink-0">
          <div className="flex gap-4 text-xs font-semibold">
            <span className="text-emerald-600 dark:text-emerald-400">A — Acknowledge</span>
            <span className="text-blue-600 dark:text-blue-400">D — Defend</span>
            <span className="text-violet-600 dark:text-violet-400">S — Solve</span>
          </div>
        </div>

        {/* Category list */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-2">
          {categories.map((cat) => {
            const isOpen = expanded === cat.id;
            return (
              <div
                key={cat.id}
                className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden"
              >
                {/* Row */}
                <button
                  className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : cat.id)}
                >
                  <span className="text-xl shrink-0">{cat.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{cat.category}</p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate italic">« {cat.exampleObjection} »</p>
                  </div>
                  <span className="text-slate-400 dark:text-slate-500 text-xs shrink-0">
                    {isOpen ? '▲' : '▼'}
                  </span>
                </button>

                {/* Expanded ADS breakdown */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-100 dark:border-slate-700 pt-3">
                    <div className="flex gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center justify-center">A</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{cat.acknowledge}</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center">D</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{cat.defend}</p>
                    </div>
                    <div className="flex gap-3">
                      <span className="shrink-0 w-5 h-5 rounded-full bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400 text-[10px] font-bold flex items-center justify-center">S</span>
                      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">{cat.solve}</p>
                    </div>
                    {/* Full response */}
                    <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">Réponse complète</p>
                      <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed italic">« {cat.fullResponse} »</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
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
            {categories.length} objections
          </span>
        </div>
        <h3 className="text-base md:text-xl font-bold text-white mb-1.5 md:mb-2">
          Stratégie Section B
        </h3>
        <p className="text-violet-100 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">
          Maîtrisez une réponse universelle A–D–S pour chaque type d'objection. Applicable à toutes les tâches.
        </p>
        <div className="flex items-center text-white font-bold text-xs md:text-sm">
          Voir le guide <span className="ml-1.5">→</span>
        </div>
      </div>

      {open && <Modal onClose={() => setOpen(false)} />}
    </>
  );
}
