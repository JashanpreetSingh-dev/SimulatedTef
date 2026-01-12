import React, { useState, useMemo } from 'react';
import { SavedResult } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useWrittenExpressionData } from '../hooks/useWrittenExpressionData';
import { WrittenExpressionSection } from './WrittenExpressionSection';
import { OverallComment } from './OverallComment';
import { CriteriaBreakdown } from './CriteriaBreakdown';
import { TopImprovements } from './TopImprovements';
import { StrengthsWeaknesses } from './StrengthsWeaknesses';
import { GrammarVocabularyNotes } from './GrammarVocabularyNotes';
import { WordCount } from './WordCount';

interface WrittenExpressionTabsProps {
  result: SavedResult;
}

export const WrittenExpressionTabs: React.FC<WrittenExpressionTabsProps> = ({ result }) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'A' | 'B'>('A');
  const writtenData = useWrittenExpressionData(result);

  // Get evaluation result - for partA/partB, check moduleData first, then fallback to main evaluation
  const evaluationResult = useMemo(() => {
    if (result.moduleData && result.moduleData.type === 'writtenExpression') {
      if (result.mode === 'partA' && result.moduleData.sectionA?.result) {
        return result.moduleData.sectionA.result;
      } else if (result.mode === 'partB' && result.moduleData.sectionB?.result) {
        return result.moduleData.sectionB.result;
      }
    }
    // Fallback to main evaluation or legacy structure
    return result.evaluation || result;
  }, [result]);

  // Extract evaluation details
  const overallComment = evaluationResult.overall_comment || result.overall_comment;
  const criteria = evaluationResult.criteria || {};
  const topImprovements = evaluationResult.top_improvements || [];
  const strengths = evaluationResult.strengths || [];
  const weaknesses = evaluationResult.weaknesses || [];
  const grammarNotes = evaluationResult.grammarNotes || '';
  const vocabularyNotes = evaluationResult.vocabularyNotes || '';
  const wordCountSectionA = (evaluationResult as any).actual_word_count_sectionA;
  const wordCountSectionB = (evaluationResult as any).actual_word_count_sectionB;

  // Helper to get corrections for a section
  const getCorrections = (section: 'A' | 'B'): any[] => {
    const sectionKey = section === 'A' ? 'sectionA' : 'sectionB';
    const correctionsKey = section === 'A' ? 'corrections_sectionA' : 'corrections_sectionB';
    const isMatchingMode = (section === 'A' && result.mode === 'partA') || (section === 'B' && result.mode === 'partB');
    
    // Check in moduleData first (for partA/partB modes)
    if (result.moduleData?.type === 'writtenExpression') {
      const sectionData = result.moduleData[sectionKey];
      // Check section-specific corrections
      if (sectionData?.result?.[correctionsKey]?.length > 0) {
        return sectionData.result[correctionsKey];
      }
      // For single-section mode, fallback to generic upgraded_sentences
      if (isMatchingMode && sectionData?.result?.upgraded_sentences?.length > 0) {
        return sectionData.result.upgraded_sentences;
      }
    }
    
    // Check in evaluation result (already extracted based on mode)
    if (evaluationResult[correctionsKey]?.length > 0) {
      return evaluationResult[correctionsKey];
    }
    
    // For single-section mode, fallback to generic upgraded_sentences from evaluation
    if (isMatchingMode && evaluationResult.upgraded_sentences?.length > 0) {
      return evaluationResult.upgraded_sentences;
    }
    
    // Check in top-level evaluation object
    if (result.evaluation?.[correctionsKey]?.length > 0) {
      return result.evaluation[correctionsKey];
    }
    
    // For single-section mode, fallback to generic upgraded_sentences from top-level
    if (isMatchingMode && result.evaluation?.upgraded_sentences?.length > 0) {
      return result.evaluation.upgraded_sentences;
    }
    
    // Fallback to top-level result
    return (result as any)[correctionsKey] || [];
  };

  // Helper to get model answer for a section
  const getModelAnswer = (section: 'A' | 'B'): string | null => {
    const sectionKey = section === 'A' ? 'sectionA' : 'sectionB';
    const modelAnswerKey = section === 'A' ? 'model_answer_sectionA' : 'model_answer_sectionB';
    const isMatchingMode = (section === 'A' && result.mode === 'partA') || (section === 'B' && result.mode === 'partB');
    
    const isValidModelAnswer = (answer: string | undefined | null): boolean => {
      return !!answer && 
        !answer.toLowerCase().includes('not applicable') && 
        !answer.toLowerCase().includes('refer to') &&
        answer.trim().length > 0;
    };
    
    // Check in moduleData first (for partA/partB modes)
    if (result.moduleData?.type === 'writtenExpression') {
      const sectionData = result.moduleData[sectionKey];
      // Check section-specific model answer
      if (isValidModelAnswer(sectionData?.result?.[modelAnswerKey])) {
        return sectionData.result[modelAnswerKey];
      }
      // For single-section mode, fallback to generic model_answer
      if (isMatchingMode && isValidModelAnswer(sectionData?.result?.model_answer)) {
        return sectionData.result.model_answer;
      }
    }
    
    // Check in evaluation result (section-specific)
    if (isValidModelAnswer(evaluationResult[modelAnswerKey])) {
      return evaluationResult[modelAnswerKey];
    }
    
    // For single-section mode, fallback to generic model_answer from evaluation
    if (isMatchingMode && isValidModelAnswer(evaluationResult.model_answer)) {
      return evaluationResult.model_answer;
    }
    
    // Fallback to top-level result (section-specific)
    if (isValidModelAnswer(result[modelAnswerKey])) {
      return result[modelAnswerKey];
    }
    
    // Try to extract from combined model_answer (for full mode)
    if (isValidModelAnswer(result.model_answer)) {
      if (section === 'A') {
        return result.model_answer.split('\n\nSection B')[0].replace('Section A:', '').trim() || null;
      } else {
        return result.model_answer.includes('Section B') 
          ? (result.model_answer.split('Section B:')[1]?.trim() || result.model_answer.split('Section B')[1]?.trim() || null)
          : null;
      }
    }
    
    return null;
  };

  // Determine which sections are available based on mode
  const isFullMode = result.mode === 'full';
  const isPartA = result.mode === 'partA';
  const isPartB = result.mode === 'partB';

  // For partA, only show sectionA if available
  if (isPartA) {
    if (!writtenData || !writtenData.sectionA) {
      return (
        <div className="mb-6 sm:mb-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:rounded-[2rem] border border-amber-200 dark:border-amber-800 p-4 sm:p-8">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('results.detailedDataUnavailable')}
          </p>
        </div>
      );
    }

    const correctionsA = getCorrections('A');
    const modelAnswerA = getModelAnswer('A');

    return (
      <div className="mb-6 sm:mb-12 space-y-6">
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-700 p-4 sm:p-8 md:p-12 shadow-sm transition-colors">
          <WrittenExpressionSection
            sectionData={writtenData.sectionA}
            corrections={correctionsA}
            modelAnswer={modelAnswerA}
          />
        </div>
        {typeof wordCountSectionA === 'number' && (
          <WordCount section="A" actualCount={wordCountSectionA} targetMin={80} targetMax={120} />
        )}
        {overallComment && (
          <OverallComment comment={overallComment} variant="blue" />
        )}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <StrengthsWeaknesses strengths={strengths} weaknesses={weaknesses} />
        )}
        {(grammarNotes || vocabularyNotes) && (
          <GrammarVocabularyNotes grammarNotes={grammarNotes} vocabularyNotes={vocabularyNotes} />
        )}
        {Object.keys(criteria).length > 0 && (
          <CriteriaBreakdown criteria={criteria} />
        )}
        {topImprovements.length > 0 && (
          <TopImprovements improvements={topImprovements} />
        )}
      </div>
    );
  }

  // For partB, only show sectionB if available
  if (isPartB) {
    if (!writtenData || !writtenData.sectionB) {
      return (
        <div className="mb-6 sm:mb-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:rounded-[2rem] border border-amber-200 dark:border-amber-800 p-4 sm:p-8">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            {t('results.detailedDataUnavailable')}
          </p>
        </div>
      );
    }

    const correctionsB = getCorrections('B');
    const modelAnswerB = getModelAnswer('B');

    return (
      <div className="mb-6 sm:mb-12 space-y-6">
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-700 p-4 sm:p-8 md:p-12 shadow-sm transition-colors">
          <WrittenExpressionSection
            sectionData={writtenData.sectionB}
            corrections={correctionsB}
            modelAnswer={modelAnswerB}
          />
        </div>
        {typeof wordCountSectionB === 'number' && (
          <WordCount section="B" actualCount={wordCountSectionB} targetMin={200} targetMax={250} />
        )}
        {overallComment && (
          <OverallComment comment={overallComment} variant="blue" />
        )}
        {(strengths.length > 0 || weaknesses.length > 0) && (
          <StrengthsWeaknesses strengths={strengths} weaknesses={weaknesses} />
        )}
        {(grammarNotes || vocabularyNotes) && (
          <GrammarVocabularyNotes grammarNotes={grammarNotes} vocabularyNotes={vocabularyNotes} />
        )}
        {Object.keys(criteria).length > 0 && (
          <CriteriaBreakdown criteria={criteria} />
        )}
        {topImprovements.length > 0 && (
          <TopImprovements improvements={topImprovements} />
        )}
      </div>
    );
  }

  // For full mode, show tabs if both sections are available
  if (!writtenData || !writtenData.sectionA || !writtenData.sectionB) {
    return (
      <div className="mb-6 sm:mb-12 bg-amber-50 dark:bg-amber-900/20 rounded-xl sm:rounded-[2rem] border border-amber-200 dark:border-amber-800 p-4 sm:p-8">
        <p className="text-sm text-slate-600 dark:text-slate-300">
          {t('results.detailedDataUnavailable')}
        </p>
      </div>
    );
  }

  const correctionsA = getCorrections('A');
  const correctionsB = getCorrections('B');
  const modelAnswerA = getModelAnswer('A');
  const modelAnswerB = getModelAnswer('B');

  const currentSectionData = activeTab === 'A' ? writtenData.sectionA : writtenData.sectionB;
  const currentCorrections = activeTab === 'A' ? correctionsA : correctionsB;
  const currentModelAnswer = activeTab === 'A' ? modelAnswerA : modelAnswerB;

  // For full mode, get evaluation from the active section or overall evaluation
  const currentEvaluation = useMemo(() => {
    if (result.moduleData && result.moduleData.type === 'writtenExpression') {
      if (activeTab === 'A' && result.moduleData.sectionA?.result) {
        return result.moduleData.sectionA.result;
      } else if (activeTab === 'B' && result.moduleData.sectionB?.result) {
        return result.moduleData.sectionB.result;
      }
    }
    return result.evaluation || result;
  }, [result, activeTab]);

  const currentOverallComment = currentEvaluation.overall_comment || result.overall_comment;
  const currentCriteria = currentEvaluation.criteria || {};
  const currentTopImprovements = currentEvaluation.top_improvements || [];
  const currentStrengths = currentEvaluation.strengths || [];
  const currentWeaknesses = currentEvaluation.weaknesses || [];
  const currentGrammarNotes = currentEvaluation.grammarNotes || '';
  const currentVocabularyNotes = currentEvaluation.vocabularyNotes || '';
  const currentWordCount = activeTab === 'A' 
    ? (currentEvaluation as any).actual_word_count_sectionA 
    : (currentEvaluation as any).actual_word_count_sectionB;

  return (
    <div className="mb-6 sm:mb-12 space-y-6">
      {/* Tabs - only show for full mode */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
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

      {/* Word Count */}
      {typeof currentWordCount === 'number' && (
        <WordCount 
          section={activeTab} 
          actualCount={currentWordCount} 
          targetMin={activeTab === 'A' ? 80 : 200} 
          targetMax={activeTab === 'A' ? 120 : 250} 
        />
      )}

      {/* Evaluation Details - shown after section content */}
      {currentOverallComment && (
        <OverallComment comment={currentOverallComment} variant="blue" />
      )}
      {(currentStrengths.length > 0 || currentWeaknesses.length > 0) && (
        <StrengthsWeaknesses strengths={currentStrengths} weaknesses={currentWeaknesses} />
      )}
      {(currentGrammarNotes || currentVocabularyNotes) && (
        <GrammarVocabularyNotes grammarNotes={currentGrammarNotes} vocabularyNotes={currentVocabularyNotes} />
      )}
      {Object.keys(currentCriteria).length > 0 && (
        <CriteriaBreakdown criteria={currentCriteria} />
      )}
      {currentTopImprovements.length > 0 && (
        <TopImprovements improvements={currentTopImprovements} />
      )}
    </div>
  );
};
