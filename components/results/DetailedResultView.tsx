import React, { useMemo } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SavedResult, TEFTask } from '../../types';
import { SimpleResultView } from './components/SimpleResultView';
import { ResultHeader } from './components/ResultHeader';
import { AudioPlayer } from './components/AudioPlayer';
import { TaskImages } from './components/TaskImages';
import { Transcript } from './components/Transcript';
import { OverallComment } from './components/OverallComment';
import { ModelAnswer } from './components/ModelAnswer';
import { CriteriaBreakdown } from './components/CriteriaBreakdown';
import { TopImprovements } from './components/TopImprovements';
import { UpgradedSentences } from './components/UpgradedSentences';
import { WrittenExpressionTabs } from './components/WrittenExpressionTabs';

interface DetailedResultViewProps {
  result: SavedResult;
  onBack: () => void;
}

export const DetailedResultView: React.FC<DetailedResultViewProps> = ({ result, onBack }) => {
  const { t } = useLanguage();

  // Memoize expensive calculations
  const criteria = useMemo(() => result.criteria || {}, [result.criteria]);
  const upgradedSentences = useMemo(() => result.upgraded_sentences || [], [result.upgraded_sentences]);
  const topImprovements = useMemo(() => result.top_improvements || [], [result.top_improvements]);
  
  // Memoize tasks to display
  const tasksToDisplay = useMemo(() => {
    const tasks: Array<{ task: TEFTask; label: string }> = [];
    if (result.mode === 'partA' && result.taskPartA) {
      tasks.push({ task: result.taskPartA, label: `Section ${t('results.sectionA')}` });
    } else if (result.mode === 'partB' && result.taskPartB) {
      tasks.push({ task: result.taskPartB, label: `Section ${t('results.sectionB')}` });
    } else if (result.mode === 'full') {
      if (result.taskPartA) tasks.push({ task: result.taskPartA, label: `${t('results.section')} ${t('results.sectionA')}` });
      if (result.taskPartB) tasks.push({ task: result.taskPartB, label: `${t('results.section')} ${t('results.sectionB')}` });
    }
    return tasks;
  }, [result.mode, result.taskPartA, result.taskPartB, t]);

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

      {/* Written Expression Overall Comment (shown only if writtenExpressionResult is missing) */}
      {result.module === 'writtenExpression' && !result.writtenExpressionResult && result.overall_comment && (
        <OverallComment comment={result.overall_comment} variant="blue" />
      )}

      {/* Task Images Section (for oral expression) */}
      {result.module !== 'writtenExpression' && tasksToDisplay.length > 0 && (
        <TaskImages tasks={tasksToDisplay} />
      )}

      {/* Transcript (for oral expression only) */}
      {result.module !== 'writtenExpression' && result.transcript && (
        <Transcript transcript={result.transcript} />
      )}

      {/* Overall Comment (for non-written expression) */}
      {result.module !== 'writtenExpression' && result.overall_comment && (
        <OverallComment comment={result.overall_comment} variant="indigo" />
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
      {result.module !== 'writtenExpression' && result.model_answer && (
        <ModelAnswer modelAnswer={result.model_answer} />
      )}
    </div>
  );
};
