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
  mockExamId: string;
  onFinish: (result: SavedResult) => void;
}

export const WrittenExpressionExam: React.FC<WrittenExpressionExamProps> = ({
  taskA,
  taskB,
  title,
  mockExamId,
  onFinish,
}) => {
  const { theme } = useTheme();
  const [currentSection, setCurrentSection] = useState<'A' | 'B'>('A');
  const [sectionAText, setSectionAText] = useState<string>('');

  const { submitEvaluation, isSubmitting, isEvaluating } = useWrittenExpressionEvaluation({
    taskA,
    taskB,
    title,
    mockExamId,
    onSuccess: onFinish,
  });

  const handleSectionAComplete = (text: string) => {
    setSectionAText(text);
    setCurrentSection('B');
  };

  const handleSectionBComplete = async (text: string) => {
    await submitEvaluation(sectionAText, text);
  };

  // Show loading/evaluation screen
  if (isSubmitting || isEvaluating) {
    return <LoadingResult type="written" />;
  }

  const isDark = theme === 'dark';
  const currentTask = currentSection === 'A' ? taskA : taskB;
  const currentStep = currentSection === 'A' ? 1 : 2;

  return (
    <div className={`min-h-[calc(100vh-5rem)] flex flex-col ${isDark ? 'bg-slate-900' : 'bg-slate-50'}`}>
      <div className="flex-1 p-4 md:p-8 pb-24 overflow-auto">
        <div className="max-w-5xl mx-auto h-full flex flex-col">
          <StepIndicator currentStep={currentStep} totalSteps={2} theme={theme} />
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
