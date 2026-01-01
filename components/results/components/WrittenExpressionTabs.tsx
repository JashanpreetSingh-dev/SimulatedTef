import React, { useState } from 'react';
import { SavedResult } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useWrittenExpressionData } from '../hooks/useWrittenExpressionData';
import { WrittenExpressionSection } from './WrittenExpressionSection';
import { OverallComment } from './OverallComment';

interface WrittenExpressionTabsProps {
  result: SavedResult;
}

export const WrittenExpressionTabs: React.FC<WrittenExpressionTabsProps> = ({ result }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const writtenData = useWrittenExpressionData(result);

  if (!writtenData || !writtenData.sectionA || !writtenData.sectionB) {
    return (
      <div className="mb-6 sm:mb-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:rounded-[2rem] border border-amber-200 dark:border-amber-800 p-4 sm:p-8">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('results.detailedDataUnavailable')}
        </p>
      </div>
    );
  }

  const correctionsA = (result as any).corrections_sectionA || [];
  const correctionsB = (result as any).corrections_sectionB || [];
  const modelAnswerA = result.model_answer_sectionA || 
    (result.model_answer && !result.model_answer.toLowerCase().includes('not applicable') && !result.model_answer.toLowerCase().includes('refer to')
      ? (result.model_answer.split('\n\nSection B')[0].replace('Section A:', '').trim() || null)
      : null);
  const modelAnswerB = result.model_answer_sectionB || 
    (result.model_answer && !result.model_answer.toLowerCase().includes('not applicable') && !result.model_answer.toLowerCase().includes('refer to')
      ? (result.model_answer.includes('Section B') 
        ? result.model_answer.split('Section B:')[1]?.trim() || result.model_answer.split('Section B')[1]?.trim() || null
        : null)
      : null);

  const currentSectionData = activeTab === 'A' ? writtenData.sectionA : writtenData.sectionB;
  const currentCorrections = activeTab === 'A' ? correctionsA : correctionsB;
  const currentModelAnswer = activeTab === 'A' ? modelAnswerA : modelAnswerB;

  return (
    <div className="mb-6 sm:mb-12">
      {/* Tabs */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl mb-6">
        <button
          onClick={() => setActiveTab('A')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'A'
              ? 'bg-indigo-100 dark:bg-indigo-900/50 text-blue-500 dark:text-blue-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('results.sectionAFaitDivers')}
        </button>
        <button
          onClick={() => setActiveTab('B')}
          className={`flex-1 py-2.5 px-4 rounded-lg font-bold text-sm transition-all ${
            activeTab === 'B'
              ? 'bg-indigo-100 dark:bg-indigo-900/50 text-emerald-500 dark:text-emerald-400 shadow-sm'
              : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          {t('results.sectionBArgumentation')}
        </button>
      </div>

      {/* Tab Content */}
      <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-700 p-4 sm:p-8 md:p-12 shadow-sm transition-colors">
        <WrittenExpressionSection
          sectionData={currentSectionData}
          corrections={currentCorrections}
          modelAnswer={currentModelAnswer}
        />
      </div>

      {/* Overall Feedback - shown after tabs */}
      {result.overall_comment && (
        <OverallComment comment={result.overall_comment} variant="blue" />
      )}
    </div>
  );
};
