import React from 'react';
import { TEFTask } from '../../../types';
import { TaskImages } from './TaskImages';
import { Transcript } from './Transcript';

interface TaskAndTranscriptContainerProps {
  tasks: Array<{ task: TEFTask; label: string }>;
  transcript?: string;
}

export const TaskAndTranscriptContainer: React.FC<TaskAndTranscriptContainerProps> = ({
  tasks,
  transcript,
}) => {
  if (tasks.length === 0 && !transcript) return null;

  return (
    <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-gradient-to-br from-slate-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800 rounded-xl sm:rounded-[2rem] border border-slate-200 dark:border-slate-700 transition-colors">
      <div className="flex flex-col md:flex-row md:items-start md:gap-6 lg:gap-8">
        {/* Task Images Section */}
        {tasks.length > 0 && (
          <div className="flex-1 md:min-w-0 mb-6 md:mb-0">
            <TaskImages tasks={tasks} />
          </div>
        )}

        {/* Transcript Section */}
        {transcript && (
          <div className="flex-1 md:min-w-0 w-full md:w-auto">
            <Transcript transcript={transcript} />
          </div>
        )}
      </div>
    </div>
  );
};
