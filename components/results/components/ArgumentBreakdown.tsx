import React from 'react';
import { ArgumentBreakdownItem } from '../../../types';

interface ArgumentBreakdownProps {
  items: ArgumentBreakdownItem[];
}

const QUALITY_CONFIG = {
  strong:   { label: 'Strong',    bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-800', chip: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300', icon: '✓' },
  adequate: { label: 'Adequate',  bg: 'bg-blue-50 dark:bg-blue-900/20',       border: 'border-blue-200 dark:border-blue-800',       chip: 'bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-300',       icon: '✓' },
  weak:     { label: 'Weak',      bg: 'bg-amber-50 dark:bg-amber-900/20',     border: 'border-amber-200 dark:border-amber-800',     chip: 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300',     icon: '~' },
  missing:  { label: 'Missing',   bg: 'bg-red-50 dark:bg-red-900/20',         border: 'border-red-200 dark:border-red-800',         chip: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300',           icon: '✗' },
} as const;

export const ArgumentBreakdown: React.FC<ArgumentBreakdownProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const addressed = items.filter(i => i.candidate_addressed).length;

  return (
    <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-violet-50 dark:bg-violet-900/20 rounded-xl sm:rounded-2xl border border-violet-200 dark:border-violet-800 transition-colors">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-widest flex items-center gap-2">
          <span>🗣️</span> Argument Breakdown
        </h4>
        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {addressed}/{items.length} addressed
        </span>
      </div>

      <div className="space-y-3">
        {items.map((item, i) => {
          const cfg = QUALITY_CONFIG[item.quality] ?? QUALITY_CONFIG.missing;
          return (
            <div
              key={i}
              className={`p-3 sm:p-4 rounded-lg sm:rounded-xl border ${cfg.bg} ${cfg.border} transition-colors`}
            >
              <div className="flex items-start gap-3">
                {/* Quality chip */}
                <span className={`flex-shrink-0 mt-0.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${cfg.chip}`}>
                  <span>{cfg.icon}</span>
                  <span className="hidden sm:inline">{cfg.label}</span>
                </span>

                <div className="flex-1 min-w-0 space-y-1.5">
                  {/* Expected argument */}
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 leading-snug">
                    {item.expected_argument}
                  </p>

                  {/* What the candidate actually said */}
                  {item.candidate_said ? (
                    <blockquote className="text-[11px] sm:text-xs italic text-slate-500 dark:text-slate-400 border-l-2 border-slate-300 dark:border-slate-600 pl-2.5 leading-relaxed">
                      "{item.candidate_said}"
                    </blockquote>
                  ) : (
                    <p className="text-[11px] sm:text-xs text-slate-400 dark:text-slate-500 italic">
                      Not addressed
                    </p>
                  )}

                  {/* Feedback tip */}
                  <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-300">
                    {item.feedback}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
