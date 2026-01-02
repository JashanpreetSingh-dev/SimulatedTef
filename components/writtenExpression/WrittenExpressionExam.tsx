import React, { useState } from 'react';
import { WrittenTask, SavedResult } from '../../types';
import { useTheme } from '../../contexts/ThemeContext';
import { LoadingResult } from '../LoadingResult';
import { WrittenExpressionEditor } from './WrittenExpressionEditor';
import { StepIndicator } from './StepIndicator';
import { useWrittenExpressionEvaluation } from './hooks/useWrittenExpressionEvaluation';

interface WrittenExpressionExamProps {
  taskA: WrittenTask;
  taskB: WrittenTask;
  title: string;
  mockExamId?: string;
  onFinish: (result: SavedResult) => void;
  mode?: 'partA' | 'partB' | 'full';
}

export const WrittenExpressionExam: React.FC<WrittenExpressionExamProps> = ({
  taskA,
  taskB,
  title,
  mockExamId = '',
  onFinish,
  mode = 'full',
}) => {
  const { theme } = useTheme();
  // Start with appropriate section based on mode
  const [currentSection, setCurrentSection] = useState<'A' | 'B'>(mode === 'partB' ? 'B' : 'A');
  const [sectionAText, setSectionAText] = useState<string>('');

  const { submitEvaluation, isSubmitting, isEvaluating } = useWrittenExpressionEvaluation({
    taskA,
    taskB,
    title,
    mockExamId,
    onSuccess: onFinish,
    mode,
  });

  const handleSectionAComplete = (text: string) => {
    setSectionAText(text);
    // Only move to section B if it's a full exam
    if (mode === 'full') {
      setCurrentSection('B');
    } else {
      // For partA only, submit immediately
      submitEvaluation(text, '');
    }
  };

  const handleSectionBComplete = async (text: string) => {
    if (mode === 'partB') {
      // For partB only, submit immediately
      await submitEvaluation('', text);
    } else {
      // For full exam, submit both sections
      await submitEvaluation(sectionAText, text);
    }
  };

  // Show loading/evaluation screen
  if (isSubmitting || isEvaluating) {
    return <LoadingResult type="written" />;
  }

  const isDark = theme === 'dark';
  const currentTask = currentSection === 'A' ? taskA : taskB;
  // For single section modes, only show 1 step
  const totalSteps = mode === 'full' ? 2 : 1;
  const currentStep = mode === 'partB' ? 1 : (currentSection === 'A' ? 1 : 2);

  return (
    <div className={`min-h-[calc(100vh-5rem)] flex flex-col ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="flex-1 p-4 md:p-8 pb-24 overflow-auto">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          <StepIndicator currentStep={currentStep} totalSteps={totalSteps} theme={theme} />
          <div className="flex-1 min-h-0">
            <WrittenExpressionEditor
              key={`section-${currentSection.toLowerCase()}`}
              task={currentTask}
              onFinish={currentSection === 'A' ? handleSectionAComplete : handleSectionBComplete}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
