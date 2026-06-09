import React, { useState, useMemo } from 'react';
import { TEFTask } from '../../types';

interface TaskPickerModalProps {
  isOpen: boolean;
  tasks: TEFTask[];
  selectedTaskId: number;
  completedTaskIds?: number[];
  sectionLabel: string;
  onSelect: (task: TEFTask) => void;
  onClose: () => void;
}

export function TaskPickerModal({
  isOpen,
  tasks,
  selectedTaskId,
  completedTaskIds = [],
  sectionLabel,
  onSelect,
  onClose,
}: TaskPickerModalProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter(
      (t) =>
        (t as any).theme?.toLowerCase().includes(q) ||
        t.prompt.toLowerCase().includes(q) ||
        String(t.id).includes(q)
    );
  }, [tasks, search]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-lg max-h-[82vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-700"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between flex-shrink-0">
          <div>
            <h3 className="font-black text-slate-800 dark:text-slate-100 text-sm tracking-tight">
              {sectionLabel}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {tasks.length} topics available
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600 dark:hover:text-slate-200 transition-colors text-sm"
          >
            ✕
          </button>
        </div>

        {/* Search */}
        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0">
          <input
            type="text"
            placeholder="Search by keyword or topic number…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg border-0 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            autoFocus
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10 italic">
              No topics match your search.
            </p>
          ) : (
            filtered.map((task) => {
              const isSelected = task.id === selectedTaskId;
              const isDone = completedTaskIds.includes(task.id);
              return (
                <button
                  key={task.id}
                  onClick={() => {
                    onSelect(task);
                    onClose();
                  }}
                  className={`w-full text-left px-4 py-3.5 transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0 flex items-start gap-3 ${
                    isSelected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <span
                    className={`shrink-0 mt-0.5 text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums ${
                      isSelected
                        ? 'bg-indigo-400 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    #{task.id}
                  </span>
                  <div className="flex-1 min-w-0">
                    {(task as any).theme ? (
                      <>
                        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-snug">
                          {(task as any).theme}
                        </p>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-relaxed mt-0.5 line-clamp-2">
                          {task.prompt}
                        </p>
                      </>
                    ) : (
                      <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {task.prompt}
                      </p>
                    )}
                  </div>
                  {isDone && (
                    <span
                      className="shrink-0 text-emerald-500 text-xs mt-0.5"
                      title="Already practiced"
                    >
                      ✓
                    </span>
                  )}
                  {isSelected && (
                    <span className="shrink-0 text-indigo-400 text-xs mt-0.5 font-bold">
                      ←
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
