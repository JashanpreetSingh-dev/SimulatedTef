import React from 'react';

/** Uppercase “← label” row used at the top of practice-related flows */
export const backNavButtonBaseClass =
  'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors cursor-pointer';

/** Outline secondary action (e.g. “New session” + “Back to practice” on ritual complete) */
export const secondaryOutlineButtonClass =
  'px-6 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 font-semibold text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors';

export type BackNavButtonProps = {
  onClick: () => void;
  label: string;
  marginClassName?: string;
  className?: string;
};

export function BackNavButton({
  onClick,
  label,
  marginClassName = 'mb-3 md:mb-6',
  className = '',
}: BackNavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[marginClassName, backNavButtonBaseClass, className].filter(Boolean).join(' ')}
    >
      <span aria-hidden className="select-none shrink-0">
        ←
      </span>
      <span>{label}</span>
    </button>
  );
}
