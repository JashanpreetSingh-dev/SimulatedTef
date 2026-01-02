import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  theme?: 'light' | 'dark';
}

export const StepIndicator: React.FC<StepIndicatorProps> = ({ 
  currentStep, 
  totalSteps,
  theme = 'light' 
}) => {
  const { t } = useLanguage();
  const progressPercentage = (currentStep / totalSteps) * 100;
  const isDark = theme === 'dark';

  return (
    <div className="mb-3 flex-shrink-0">
      <div className={`text-xs font-medium mb-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        {t('writtenExpression.step')} {currentStep} {t('writtenExpression.stepOf')} {totalSteps}
      </div>
      <div className={`h-1.5 rounded-full ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
        <div 
          className="h-full bg-indigo-500 rounded-full transition-all duration-300" 
          style={{ width: `${progressPercentage}%` }} 
        />
      </div>
    </div>
  );
};
