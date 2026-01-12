import React from 'react';
import { WrittenTask } from '../../types';
import { formatTime } from './utils/formatTime';
import { getWordCount } from './utils/textUtils';

interface WrittenExpressionHeaderProps {
  task: WrittenTask;
  timeLeft: number;
  text: string;
}

export const WrittenExpressionHeader: React.FC<WrittenExpressionHeaderProps> = ({
  task,
  timeLeft,
  text,
}) => {
  const wordCount = getWordCount(text);
  const progressPercentage = Math.min((wordCount / task.minWords) * 100, 100);
  const hasMinWords = wordCount >= task.minWords;

  return (
    <div className="bg-indigo-50/30 dark:bg-slate-800/20 rounded-md p-3 mb-3 border border-slate-200/50 dark:border-slate-700/50 transition-colors">
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <span className="px-1.5 py-0.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-500 dark:text-indigo-400 rounded text-[9px] font-semibold uppercase tracking-wide whitespace-nowrap">
            S{task.section}
          </span>
          <div className="text-sm font-semibold text-slate-700 dark:text-slate-300 tabular-nums whitespace-nowrap">
            {formatTime(timeLeft)}
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-600 dark:text-slate-400 min-w-0 flex-1">
            <span className="tabular-nums font-medium whitespace-nowrap">
              {wordCount}/{task.minWords}
            </span>
            <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex-shrink-0">
              <div
                className={`h-full transition-all duration-300 ${
                  hasMinWords ? 'bg-emerald-500' : 'bg-indigo-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1 leading-tight">
        {task.subject}
      </h3>
      <div className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        {task.instruction}
      </div>
    </div>
  );
};
