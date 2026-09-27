import React, { useState, useMemo } from 'react';
import { WrittenTask } from '../../types';
import { WRITTEN_SECTION_A_TASKS, WRITTEN_SECTION_B_TASKS } from '../../services/writtenTasks';
import { THEMES } from '../../constants/themes';

interface PreWrittenTaskSelectorProps {
  mode: 'partA' | 'partB';
  task: WrittenTask;
  completedTaskIds?: string[];
  onConfirm: () => void;
  onChangeTask: (task: WrittenTask) => void;
}

function WrittenTaskPickerModal({
  isOpen,
  tasks,
  selectedTaskId,
  completedTaskIds,
  sectionLabel,
  onSelect,
  onClose,
}: {
  isOpen: boolean;
  tasks: WrittenTask[];
  selectedTaskId: string;
  completedTaskIds: string[];
  sectionLabel: string;
  onSelect: (task: WrittenTask) => void;
  onClose: () => void;
}) {
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'theme'>('list');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tasks;
    return tasks.filter((t) => t.subject.toLowerCase().includes(q) || t.id.includes(q));
  }, [tasks, search]);

  const groupedByTheme = useMemo(() => {
    const groups: { theme: typeof THEMES[number]; tasks: WrittenTask[] }[] = [];
    for (const theme of THEMES) {
      const themeTasks = filtered.filter((t) => (t as any).themeCategory === theme.id);
      if (themeTasks.length > 0) groups.push({ theme, tasks: themeTasks });
    }
    const ungrouped = filtered.filter((t) => !(t as any).themeCategory);
    if (ungrouped.length > 0) {
      groups.push({ theme: { id: 'other' as any, label: 'Other', icon: '📌', color: '', darkColor: '', borderColor: '', textColor: 'text-slate-600 dark:text-slate-400', coreVocab: [] }, tasks: ungrouped });
    }
    return groups;
  }, [filtered]);

  const renderTaskRow = (task: WrittenTask, displayIndex?: number) => {
    const isSelected = task.id === selectedTaskId;
    const isDone = completedTaskIds.includes(task.id);
    const num = displayIndex !== undefined ? displayIndex + 1 : tasks.indexOf(task) + 1;
    return (
      <button
        key={task.id}
        onClick={() => {
          onSelect(task);
          onClose();
        }}
        className={`w-full text-left px-4 py-3.5 transition-colors border-b border-slate-100 dark:border-slate-800/60 last:border-0 flex items-start gap-3 ${
          isSelected
            ? 'bg-purple-50 dark:bg-purple-900/30'
            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
        }`}
      >
        <span
          className={`shrink-0 mt-0.5 text-[10px] font-black px-1.5 py-0.5 rounded tabular-nums ${
            isSelected
              ? 'bg-purple-400 text-white'
              : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
          }`}
        >
          #{num}
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
            {task.subject}
          </p>
        </div>
        {isDone && (
          <span className="shrink-0 text-emerald-500 text-xs mt-0.5" title="Already practiced">
            ✓
          </span>
        )}
        {isSelected && (
          <span className="shrink-0 text-purple-400 text-xs mt-0.5 font-bold">←</span>
        )}
      </button>
    );
  };

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

        <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 flex-shrink-0 flex gap-2">
          <input
            type="text"
            placeholder="Search by keyword…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg border-0 outline-none text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500"
            autoFocus
          />
          <div className="flex rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                viewMode === 'list'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode('theme')}
              className={`px-2.5 py-1.5 text-[11px] font-semibold transition-colors border-l border-slate-200 dark:border-slate-700 ${
                viewMode === 'theme'
                  ? 'bg-purple-500 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-50'
              }`}
            >
              By theme
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-10 italic">
              No topics match your search.
            </p>
          ) : viewMode === 'list' ? (
            filtered.map((task, index) => renderTaskRow(task, index))
          ) : (
            groupedByTheme.map(({ theme, tasks: groupTasks }) => (
              <div key={theme.id}>
                <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 sticky top-0">
                  <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                    {theme.icon} {theme.label}
                  </span>
                  <span className="ml-2 text-[10px] text-slate-400">{groupTasks.length} topics</span>
                </div>
                {groupTasks.map((task) => renderTaskRow(task))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function PreWrittenTaskSelector({
  mode,
  task,
  completedTaskIds = [],
  onConfirm,
  onChangeTask,
}: PreWrittenTaskSelectorProps) {
  const [pickerOpen, setPickerOpen] = useState(false);

  const tasks = mode === 'partA' ? WRITTEN_SECTION_A_TASKS : WRITTEN_SECTION_B_TASKS;
  const sectionLabel = mode === 'partA' ? 'Section A — Choose a topic' : 'Section B — Choose a topic';
  const sectionHeader = mode === 'partA' ? 'Section A · Expression Écrite' : 'Section B · Expression Écrite';
  const taskIndex = tasks.findIndex((t) => t.id === task.id);
  const displayNumber = taskIndex >= 0 ? taskIndex + 1 : '?';

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {mode === 'partA' ? 'Section A' : 'Section B'}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          A topic has been selected for you. You can switch it before starting.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
            {sectionHeader} · Topic #{displayNumber}
          </span>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="text-[11px] font-bold text-purple-500 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors flex items-center gap-1"
          >
            <span>⇄</span> Choose topic
          </button>
        </div>
        <div className="p-4 flex flex-col gap-2">
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wide">
            {mode === 'partA' ? 'Fait divers · 80–120 mots' : 'Argumentation · 200–250 mots'}
          </p>
          <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
            {task.subject}
          </p>
          <p className="text-xs text-slate-400 dark:text-slate-500 italic mt-1">
            {task.instruction}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onConfirm}
        className="w-full sm:w-auto px-8 py-3 bg-purple-500 hover:bg-purple-600 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-purple-400/30 hover:shadow-purple-500/40 hover:scale-[1.02] active:scale-95 tracking-wide uppercase"
      >
        Start →
      </button>

      <WrittenTaskPickerModal
        isOpen={pickerOpen}
        tasks={tasks}
        selectedTaskId={task.id}
        completedTaskIds={completedTaskIds}
        sectionLabel={sectionLabel}
        onSelect={onChangeTask}
        onClose={() => setPickerOpen(false)}
      />
    </div>
  );
}
