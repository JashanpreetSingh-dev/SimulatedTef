import React, { useState } from 'react';
import { TEFTask } from '../../types';
import { SECTION_A_TASKS, SECTION_B_TASKS } from '../../services/tasks';
import { TaskPickerModal } from './TaskPickerModal';
import { useLanguage } from '../../contexts/LanguageContext';

interface PreExamTaskSelectorProps {
  mode: 'partA' | 'partB' | 'full';
  taskA: TEFTask;
  taskB: TEFTask;
  completedTaskIds?: number[];
  onConfirm: () => void;
  onChangeTask: (section: 'A' | 'B', task: TEFTask) => void;
}

function TaskCard({
  task,
  sectionLabel,
  onChangeTopic,
}: {
  task: TEFTask;
  sectionLabel: string;
  onChangeTopic: () => void;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm flex flex-col">
      <div className="bg-slate-50 dark:bg-slate-800 px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">
          {sectionLabel} · Topic #{task.id}
        </span>
        <button
          type="button"
          onClick={onChangeTopic}
          className="text-[11px] font-bold text-indigo-500 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors flex items-center gap-1"
        >
          <span>⇄</span> Choose topic
        </button>
      </div>
      <div className="p-4 flex flex-col gap-3 flex-1">
        {task.image && (
          <img
            src={task.image}
            alt="Task document"
            className="w-full max-h-48 object-contain rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"
          />
        )}
        {(task as any).theme && (
          <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {(task as any).theme}
          </p>
        )}
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed italic">
          {task.prompt}
        </p>
      </div>
    </div>
  );
}

export function PreExamTaskSelector({
  mode,
  taskA,
  taskB,
  completedTaskIds = [],
  onConfirm,
  onChangeTask,
}: PreExamTaskSelectorProps) {
  const { t } = useLanguage();
  const [pickerOpen, setPickerOpen] = useState<'A' | 'B' | null>(null);

  const sectionALabel = t('practice.sectionA');
  const sectionBLabel = t('practice.sectionB');

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h2 className="text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
          {mode === 'partA'
            ? sectionALabel
            : mode === 'partB'
            ? sectionBLabel
            : t('practice.completeExam')}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          A topic has been selected for you. You can switch it before starting.
        </p>
      </div>

      {/* Task card(s) */}
      {mode === 'full' ? (
        <div className="grid sm:grid-cols-2 gap-4">
          <TaskCard
            task={taskA}
            sectionLabel={sectionALabel}
            onChangeTopic={() => setPickerOpen('A')}
          />
          <TaskCard
            task={taskB}
            sectionLabel={sectionBLabel}
            onChangeTopic={() => setPickerOpen('B')}
          />
        </div>
      ) : (
        <TaskCard
          task={mode === 'partA' ? taskA : taskB}
          sectionLabel={mode === 'partA' ? sectionALabel : sectionBLabel}
          onChangeTopic={() => setPickerOpen(mode === 'partA' ? 'A' : 'B')}
        />
      )}

      {/* Start button */}
      <button
        type="button"
        onClick={onConfirm}
        className="w-full sm:w-auto px-8 py-3 bg-indigo-400 hover:bg-indigo-500 text-white font-black text-sm rounded-xl transition-all shadow-lg shadow-indigo-400/30 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-95 tracking-wide uppercase"
      >
        Start →
      </button>

      {/* Task picker modals */}
      <TaskPickerModal
        isOpen={pickerOpen === 'A'}
        tasks={SECTION_A_TASKS}
        selectedTaskId={taskA.id}
        completedTaskIds={completedTaskIds}
        sectionLabel={`${sectionALabel} — Choose a topic`}
        onSelect={(task) => onChangeTask('A', task)}
        onClose={() => setPickerOpen(null)}
      />
      <TaskPickerModal
        isOpen={pickerOpen === 'B'}
        tasks={SECTION_B_TASKS}
        selectedTaskId={taskB.id}
        completedTaskIds={completedTaskIds}
        sectionLabel={`${sectionBLabel} — Choose a topic`}
        onSelect={(task) => onChangeTask('B', task)}
        onClose={() => setPickerOpen(null)}
      />
    </div>
  );
}
