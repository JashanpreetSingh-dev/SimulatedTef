import React from 'react';
import { ArgumentBreakdownItem } from '../../../types';

interface ArgumentBreakdownProps {
  items: ArgumentBreakdownItem[];
}

const QUALITY_CONFIG = {
  strong:   { label: 'Strong',   border: 'border-emerald-200 dark:border-emerald-800', chip: 'bg-emerald-100 dark:bg-emerald-800 text-emerald-700 dark:text-emerald-300', icon: '✓' },
  adequate: { label: 'Adequate', border: 'border-amber-200 dark:border-amber-800',     chip: 'bg-amber-100 dark:bg-amber-800 text-amber-700 dark:text-amber-300',         icon: '~' },
  weak:     { label: 'Weak',     border: 'border-red-200 dark:border-red-800',         chip: 'bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300',                 icon: '!' },
  missing:  { label: 'Missing',  border: 'border-red-200 dark:border-red-800',         chip: 'bg-red-100 dark:bg-red-800 text-red-600 dark:text-red-300',                 icon: '✗' },
} as const;

export const ArgumentBreakdown: React.FC<ArgumentBreakdownProps> = ({ items }) => {
  if (!items || items.length === 0) return null;

  const strong = items.filter(i => i.quality === 'strong').length;

  return (
    <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-violet-50 dark:bg-violet-900/20 rounded-xl sm:rounded-2xl border border-violet-200 dark:border-violet-800 transition-colors">
      <div className="flex items-center justify-between mb-4 sm:mb-5">
        <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 tracking-widest flex items-center gap-2">
          <span>🗣️</span> Argument Breakdown
        </h4>
        <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-semibold">
          {strong}/{items.length} strong
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item, i) => {
          const cfg = QUALITY_CONFIG[item.quality] ?? QUALITY_CONFIG.missing;
          const showIdeal = item.quality !== 'strong' && item.ideal_response;

          return (
            <div key={i} className={`rounded-xl border ${cfg.border} overflow-hidden`}>
              {/* Header row: quality chip */}
              <div className="flex items-center gap-2 px-3 sm:px-4 pt-3 pb-2">
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${cfg.chip}`}>
                  <span>{cfg.icon}</span> {cfg.label}
                </span>
                <span className="text-[9px] sm:text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Point {i + 1}
                </span>
              </div>

              <div className="px-3 sm:px-4 pb-3 space-y-3">
                {/* Examiner */}
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    Examiner said
                  </p>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 italic leading-relaxed">
                    "{item.examiner_said}"
                  </p>
                </div>

                {/* Divider */}
                <div className="border-t border-slate-100 dark:border-slate-700" />

                {/* Candidate response */}
                <div>
                  <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                    Your response
                  </p>
                  {item.candidate_said ? (
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      "{item.candidate_said}"
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-400 dark:text-slate-500 italic">
                      Not addressed
                    </p>
                  )}
                </div>

                {/* Ideal response — only when not strong */}
                {showIdeal && (
                  <>
                    <div className="border-t border-slate-100 dark:border-slate-700" />
                    <div>
                      <p className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-violet-500 dark:text-violet-400 mb-1">
                        Ideal response
                      </p>
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                        "{item.ideal_response}"
                      </p>
                    </div>
                  </>
                )}

                {/* Feedback tip */}
                <div className="border-t border-slate-100 dark:border-slate-700 pt-2">
                  <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
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
