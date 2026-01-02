import React from 'react';

interface CheckoutMessageProps {
  message: { type: 'success' | 'error'; text: string };
  onDismiss: () => void;
}

export function CheckoutMessage({ message, onDismiss }: CheckoutMessageProps) {
  return (
    <div className={`rounded-2xl p-4 md:p-6 border ${
      message.type === 'success' 
        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
        : 'bg-red-500/10 border-red-500/20 text-red-400'
    }`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {message.type === 'success' ? (
            <span className="text-2xl">✅</span>
          ) : (
            <span className="text-2xl">❌</span>
          )}
          <p className="font-semibold">{message.text}</p>
        </div>
        <button
          onClick={onDismiss}
          className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
