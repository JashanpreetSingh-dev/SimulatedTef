import React, { useMemo, useState } from 'react';
import themeStrategyData from '../../data/section_b_theme_strategy.json';
import universalData from '../../data/section_b_universal_strategy.json';
import { THEMES } from '../../constants/themes';

interface ThemeConcern {
  id: string;
  label: string;
  examiner: string;
  alsoAskedAs: string[];
  acknowledge: string;
  defend: string;
  solve: string;
}

interface UniversalCategory {
  id: string;
  category: string;
  icon: string;
  exampleObjection: string;
  acknowledge: string;
  defend: string;
  solve: string;
  fullResponse: string;
}

interface Row {
  id: string;
  title: string;
  icon?: string;
  examiner: string;
  alsoAskedAs: string[];
  acknowledge: string;
  defend: string;
  solve: string;
  fullResponse: string;
}

const GENERAL = 'general';
const themeStrategy = themeStrategyData as Record<string, ThemeConcern[]>;
const universal = universalData as UniversalCategory[];

const generalRows: Row[] = universal.map((c) => ({
  id: c.id,
  title: c.category,
  icon: c.icon,
  examiner: c.exampleObjection,
  alsoAskedAs: [],
  acknowledge: c.acknowledge,
  defend: c.defend,
  solve: c.solve,
  fullResponse: c.fullResponse,
}));

const rowsForTheme = (themeId: string): Row[] =>
  (themeStrategy[themeId] ?? []).map((c) => ({
    id: c.id,
    title: c.label,
    examiner: c.examiner,
    alsoAskedAs: c.alsoAskedAs,
    acknowledge: c.acknowledge,
    defend: c.defend,
    solve: c.solve,
    fullResponse: `${c.acknowledge} ${c.defend} ${c.solve}`,
  }));

export const THEME_STRATEGY_TOTAL = Object.values(themeStrategy).reduce((n, list) => n + list.length, 0);
export const THEME_STRATEGY_THEME_COUNT = Object.keys(themeStrategy).length;
export const hasThemeStrategy = (themeId?: string | null): themeId is string =>
  !!themeId && !!themeStrategy[themeId];

const ADS = [
  { key: 'acknowledge', letter: 'A', bg: 'bg-emerald-100 dark:bg-emerald-900/40', fg: 'text-emerald-600 dark:text-emerald-400' },
  { key: 'defend', letter: 'D', bg: 'bg-blue-100 dark:bg-blue-900/40', fg: 'text-blue-600 dark:text-blue-400' },
  { key: 'solve', letter: 'S', bg: 'bg-violet-100 dark:bg-violet-900/40', fg: 'text-violet-600 dark:text-violet-400' },
] as const;

interface Props {
  initialTheme?: string | null;
  compact?: boolean;
  listClassName?: string;
}

export function ThemeStrategyPanel({ initialTheme, compact = false, listClassName = '' }: Props) {
  const [themeId, setThemeId] = useState<string>(hasThemeStrategy(initialTheme) ? initialTheme : GENERAL);
  const [expanded, setExpanded] = useState<string | null>(null);

  const rows = useMemo(() => (themeId === GENERAL ? generalRows : rowsForTheme(themeId)), [themeId]);
  const options = useMemo(
    () => [
      ...THEMES.filter((t) => themeStrategy[t.id]).map((t) => ({ id: t.id as string, label: t.label, icon: t.icon })),
      { id: GENERAL, label: 'General', icon: '🛡️' },
    ],
    []
  );

  const txt = compact ? 'text-xs' : 'text-sm';
  const badge = compact ? 'w-4 h-4 text-[9px]' : 'w-5 h-5 text-[10px]';

  return (
    <div>
      <div className={`flex flex-wrap gap-1.5 ${compact ? 'px-3 pt-3' : 'px-4 pt-4'}`}>
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => {
              setThemeId(o.id);
              setExpanded(null);
            }}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-semibold transition-colors ${compact ? 'text-[11px]' : 'text-xs'} ${
              themeId === o.id
                ? 'bg-violet-600 border-violet-600 text-white'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
          >
            <span>{o.icon}</span>
            {o.label}
          </button>
        ))}
      </div>

      <p className={`px-4 pt-2 text-slate-400 dark:text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
        {rows.length} {themeId === GENERAL ? "catégories d'objections" : 'objections fréquentes pour ce thème'}
      </p>

      <div className={`space-y-1.5 ${compact ? 'px-3 py-2' : 'px-4 py-3'} ${listClassName}`}>
        {rows.map((row) => {
          const isOpen = expanded === row.id;
          return (
            <div key={row.id} className="rounded-xl border border-slate-100 dark:border-slate-700 overflow-hidden">
              <button
                type="button"
                className={`w-full flex items-center gap-2.5 text-left hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${compact ? 'px-3 py-2' : 'px-4 py-3'}`}
                onClick={() => setExpanded(isOpen ? null : row.id)}
              >
                {row.icon && <span className={`shrink-0 ${compact ? 'text-base' : 'text-xl'}`}>{row.icon}</span>}
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-slate-700 dark:text-slate-100 ${txt}`}>{row.title}</p>
                  {!isOpen && (
                    <p className={`truncate italic text-slate-400 dark:text-slate-500 ${compact ? 'text-[10px]' : 'text-xs'}`}>
                      « {row.examiner} »
                    </p>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 shrink-0">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className={`space-y-2.5 border-t border-slate-100 dark:border-slate-700 ${compact ? 'px-3 pb-3 pt-2' : 'px-4 pb-4 pt-3'}`}>
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-700/50 rounded-xl">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1">
                      Examinateur
                    </p>
                    <p className={`italic text-slate-500 dark:text-slate-400 leading-relaxed ${txt}`}>« {row.examiner} »</p>
                    {row.alsoAskedAs.length > 0 && (
                      <details className="mt-1.5">
                        <summary className="cursor-pointer text-[10px] font-semibold text-slate-400 dark:text-slate-500">
                          Aussi formulé comme… ({row.alsoAskedAs.length})
                        </summary>
                        <ul className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                          {row.alsoAskedAs.map((q, i) => (
                            <li key={i} className="text-[11px] italic text-slate-500 dark:text-slate-400 leading-snug">
                              « {q} »
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>

                  {ADS.map(({ key, letter, bg, fg }) => (
                    <div key={key} className="flex gap-2.5">
                      <span className={`shrink-0 rounded-full font-bold flex items-center justify-center mt-0.5 ${badge} ${bg} ${fg}`}>
                        {letter}
                      </span>
                      <p className={`text-slate-600 dark:text-slate-300 leading-relaxed ${txt}`}>{row[key]}</p>
                    </div>
                  ))}

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500 mb-1.5">
                      Réponse complète
                    </p>
                    <p className={`text-slate-700 dark:text-slate-200 leading-relaxed italic ${txt}`}>« {row.fullResponse} »</p>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
