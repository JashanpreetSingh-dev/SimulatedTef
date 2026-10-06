import React from 'react';

interface LimitReachedModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  upgradeLabel: string;
  closeLabel: string;
  onUpgrade: () => void;
  onClose: () => void;
}

export function LimitReachedModal({
  isOpen,
  title,
  message,
  upgradeLabel,
  closeLabel,
  onUpgrade,
  onClose,
}: LimitReachedModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="limit-reached-title"
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 max-w-md w-full shadow-xl">
        <h3
          id="limit-reached-title"
          className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2"
        >
          {title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-6 whitespace-pre-line">
          {message}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
          >
            {closeLabel}
          </button>
          <button
            type="button"
            onClick={onUpgrade}
            className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg font-semibold transition-colors"
          >
            {upgradeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
