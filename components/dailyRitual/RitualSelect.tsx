import React, { useEffect, useRef, useState } from 'react';

export interface RitualSelectOption {
  value: string;
  label: string;
}

export interface RitualSelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  options: RitualSelectOption[];
  disabled?: boolean;
}

/**
 * Custom select for ritual setup: matches app card styling, large tap targets,
 * teal focus/open ring. Native select menus are hard to style consistently (esp. dark mode).
 */
export function RitualSelect({ id, value, onChange, options, disabled = false }: RitualSelectProps) {
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const wasOpenRef = useRef(false);
  const listboxId = `${id}-listbox`;

  const selected = options.find((o) => o.value === value) ?? options[0];
  const selectedLabel = selected?.label ?? '';

  useEffect(() => {
    if (!open) return;
    const i = options.findIndex((o) => o.value === value);
    setHighlighted(i >= 0 ? i : 0);
  }, [open, value, options]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => listRef.current?.focus());
    } else if (wasOpenRef.current) {
      triggerRef.current?.focus();
    }
    wasOpenRef.current = open;
  }, [open]);

  const pick = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setOpen((o) => !o);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
    }
  };

  const onListKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, options.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const opt = options[highlighted];
      if (opt) pick(opt.value);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => !disabled && setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
        className={`
          touch-manipulation flex w-full min-h-[48px] items-center justify-between gap-2 rounded-xl border-2 px-4 py-3 text-left text-base font-medium shadow-sm transition-colors
          ${disabled
            ? 'cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-500'
            : open
              ? 'border-teal-500 bg-white text-slate-900 ring-2 ring-teal-500/25 dark:border-teal-400 dark:bg-slate-950 dark:text-slate-100 dark:ring-teal-400/20'
              : 'border-slate-300 bg-white text-slate-900 hover:border-teal-400/70 dark:border-slate-500 dark:bg-slate-950 dark:text-slate-100 dark:hover:border-teal-600/60'
          }
          focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900
        `}
      >
        <span className="min-w-0 truncate">{selectedLabel}</span>
        <svg
          className={`h-5 w-5 shrink-0 text-slate-500 transition-transform dark:text-slate-400 ${open ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && !disabled ? (
        <div
          ref={listRef}
          id={listboxId}
          role="listbox"
          tabIndex={0}
          aria-activedescendant={options[highlighted] ? `${id}-opt-${options[highlighted].value}` : undefined}
          onKeyDown={onListKeyDown}
          className="absolute z-50 mt-2 max-h-60 w-full overflow-auto rounded-xl border-2 border-slate-200 bg-white py-1 shadow-lg dark:border-slate-600 dark:bg-slate-900"
        >
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isHi = i === highlighted;
            return (
              <button
                id={`${id}-opt-${opt.value}`}
                key={opt.value}
                type="button"
                role="option"
                aria-selected={isSelected}
                tabIndex={-1}
                className={`
                  flex w-full items-center justify-between px-4 py-3 text-left text-base transition-colors
                  ${isHi ? 'bg-teal-50 dark:bg-teal-950/50' : ''}
                  ${isSelected ? 'font-semibold text-teal-900 dark:text-teal-100' : 'font-medium text-slate-800 dark:text-slate-100'}
                  hover:bg-teal-50/80 dark:hover:bg-teal-950/40
                `}
                onMouseEnter={() => setHighlighted(i)}
                onClick={() => pick(opt.value)}
              >
                <span className="min-w-0 truncate">{opt.label}</span>
                {isSelected ? (
                  <svg className="h-5 w-5 shrink-0 text-teal-600 dark:text-teal-400" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
