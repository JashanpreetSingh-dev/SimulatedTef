import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SavedResult, TEFTask, EvaluationResult } from '../../types';
import { SimpleResultView } from './components/SimpleResultView';
import { ResultHeader } from './components/ResultHeader';
import { AudioPlayer } from './components/AudioPlayer';
import { TaskAndTranscriptContainer } from './components/TaskAndTranscriptContainer';
import { OverallComment } from './components/OverallComment';
import { ModelAnswer } from './components/ModelAnswer';
import { CriteriaBreakdown } from './components/CriteriaBreakdown';
import { TopImprovements } from './components/TopImprovements';
import { UpgradedSentences } from './components/UpgradedSentences';
import { WrittenExpressionTabs } from './components/WrittenExpressionTabs';
import { StrengthsWeaknesses } from './components/StrengthsWeaknesses';
import { QuestionCount } from './components/QuestionCount';

interface DetailedResultViewProps {
  result: SavedResult;
  onBack: () => void;
}

export const DetailedResultView: React.FC<DetailedResultViewProps> = ({ result, onBack }) => {
  const { t } = useLanguage();

  // Get evaluation result - for partA/partB, check moduleData first, then fallback to main evaluation
  const evaluationResult = useMemo((): EvaluationResult => {
    if (result.moduleData) {
      if (result.moduleData.type === 'oralExpression' || result.moduleData.type === 'writtenExpression') {
        if (result.mode === 'partA' && result.moduleData.sectionA?.result) {
          return result.moduleData.sectionA.result;
        } else if (result.mode === 'partB' && result.moduleData.sectionB?.result) {
          return result.moduleData.sectionB.result;
        }
      }
    }
    // Fallback to main evaluation or legacy structure (cast legacy result as EvaluationResult)
    return (result.evaluation || result) as EvaluationResult;
  }, [result]);

  // Memoize expensive calculations - read from evaluationResult
  const criteria = useMemo(() => evaluationResult.criteria || {}, [evaluationResult.criteria]);
  const upgradedSentences = useMemo(() => evaluationResult.upgraded_sentences || [], [evaluationResult.upgraded_sentences]);
  const topImprovements = useMemo(() => evaluationResult.top_improvements || [], [evaluationResult.top_improvements]);
  const overallComment = useMemo(() => evaluationResult.overall_comment, [evaluationResult.overall_comment]);
  const modelAnswer = useMemo(() => evaluationResult.model_answer, [evaluationResult.model_answer]);
  const strengths = useMemo(() => evaluationResult.strengths || [], [evaluationResult.strengths]);
  const weaknesses = useMemo(() => evaluationResult.weaknesses || [], [evaluationResult.weaknesses]);
  const actualQuestionsCount = useMemo(() => evaluationResult.actual_questions_count, [evaluationResult.actual_questions_count]);
  
  // Memoize tasks to display - use task references or fallback to legacy fields
  const tasksToDisplay = useMemo(() => {
    const tasks: Array<{ task: TEFTask; label: string }> = [];
    
    // Try to get tasks from populated result (taskA/taskB) or legacy fields
    const taskA = (result as any).taskA?.taskData || result.taskPartA;
    const taskB = (result as any).taskB?.taskData || result.taskPartB;
    
    if (result.mode === 'partA' && taskA) {
      tasks.push({ task: taskA, label: `Section ${t('results.sectionA')}` });
    } else if (result.mode === 'partB' && taskB) {
      tasks.push({ task: taskB, label: `Section ${t('results.sectionB')}` });
    } else if (result.mode === 'full') {
      if (taskA) tasks.push({ task: taskA, label: `${t('results.section')} ${t('results.sectionA')}` });
      if (taskB) tasks.push({ task: taskB, label: `${t('results.section')} ${t('results.sectionB')}` });
    }
    return tasks;
  }, [result.mode, result.taskPartA, result.taskPartB, (result as any).taskA, (result as any).taskB, t]);

  // For reading/listening results, show simple view
  if (result.module === 'reading' || result.module === 'listening') {
    return <SimpleResultView result={result} onBack={onBack} />;
  }

  // For written expression and oral expression results, show full detailed view
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header with Back Button */}
      <button 
        onClick={onBack}
        className="text-indigo-400 dark:text-indigo-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
      >
        <span>←</span> {t('back.toList')}
      </button>

      {/* Compact Top Section: Section Badge, CLB, CECR, Recording */}
      <ResultHeader
        result={result}
        audioPlayer={
          result.module !== 'writtenExpression' && result.recordingId ? (
            <AudioPlayer recordingId={result.recordingId} />
          ) : undefined
        }
      />

      {/* Written Expression - Tabbed Display */}
      {result.module === 'writtenExpression' && (
        <WrittenExpressionTabs result={result} />
      )}

      {/* Written Expression Overall Comment (shown only if moduleData is missing) */}
      {result.module === 'writtenExpression' && !result.moduleData && overallComment && (
        <OverallComment comment={overallComment} variant="blue" />
      )}

      {/* Task Images and Transcript Container (for oral expression) */}
      {result.module !== 'writtenExpression' && (tasksToDisplay.length > 0 || result.transcript) && (
        <TaskAndTranscriptContainer
          tasks={tasksToDisplay}
          transcript={result.transcript}
        />
      )}

      {/* Overall Comment (for non-written expression) */}
      {result.module !== 'writtenExpression' && overallComment && (
        <OverallComment comment={overallComment} variant="indigo" />
      )}

      {/* Question Count (for oral expression Section A only) */}
      {result.module === 'oralExpression' && (result.mode === 'partA' || result.mode === 'full') && typeof actualQuestionsCount === 'number' && (
        <QuestionCount actualCount={actualQuestionsCount} />
      )}

      {/* Strengths & Weaknesses (for non-written expression) */}
      {result.module !== 'writtenExpression' && (strengths.length > 0 || weaknesses.length > 0) && (
        <StrengthsWeaknesses strengths={strengths} weaknesses={weaknesses} />
      )}

      {/* Criteria Breakdown (for non-written expression) */}
      {result.module !== 'writtenExpression' && Object.keys(criteria).length > 0 && (
        <CriteriaBreakdown criteria={criteria} />
      )}

      {/* Top Improvements (for non-written expression) */}
      {result.module !== 'writtenExpression' && topImprovements.length > 0 && (
        <TopImprovements improvements={topImprovements} />
      )}

      {/* Upgraded Sentences (for non-written expression) */}
      {result.module !== 'writtenExpression' && upgradedSentences.length > 0 && (
        <UpgradedSentences sentences={upgradedSentences} />
      )}

      {/* Model Answer (for non-written expression) */}
      {result.module !== 'writtenExpression' && modelAnswer && (
        <ModelAnswer modelAnswer={modelAnswer} />
      )}
    </div>
  );
};
