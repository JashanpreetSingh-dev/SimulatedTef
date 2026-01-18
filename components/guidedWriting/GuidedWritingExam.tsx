import React from 'react';
import { WrittenTask, SavedResult } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingResult } from '../LoadingResult';
import { GuidedWritingEditor } from './GuidedWritingEditor';
import { useGuidedWritingEvaluation } from './hooks/useGuidedWritingEvaluation';

interface GuidedWritingExamProps {
  taskA: WrittenTask;
  taskB: WrittenTask;
  title: string;
  onFinish: (result: SavedResult) => void;
  mode: 'partA' | 'partB';
}

export const GuidedWritingExam: React.FC<GuidedWritingExamProps> = ({
  taskA,
  taskB,
  title,
  onFinish,
  mode,
}) => {
  const { theme } = useTheme();
  const currentTask = mode === 'partA' ? taskA : taskB;
  const currentSection = mode === 'partA' ? 'A' : 'B';

  const { submitEvaluation, isSubmitting, isEvaluating } = useGuidedWritingEvaluation({
    taskA,
    taskB,
    title,
    onSuccess: onFinish,
    mode,
  });

  const handleComplete = (text: string) => {
    if (mode === 'partA') {
      submitEvaluation(text, '');
    } else {
      submitEvaluation('', text);
    }
  };

  // Show loading/evaluation screen
  if (isSubmitting || isEvaluating) {
    return <LoadingResult type="written" />;
  }

  const isDark = theme === 'dark';

  return (
    <div className={`min-h-[calc(100vh-5rem)] flex flex-col ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="flex-1 p-3 md:p-4 lg:p-8 pb-20 md:pb-24 overflow-auto">
        <div className="max-w-7xl mx-auto h-full flex flex-col">
          <div className="flex-1 min-h-0">
            <GuidedWritingEditor
              key={`guided-section-${currentSection.toLowerCase()}`}
              task={currentTask}
              section={currentSection}
              onFinish={handleComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};