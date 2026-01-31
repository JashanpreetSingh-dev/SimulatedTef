import React, { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { useAuth } from '@clerk/clerk-react';
import { SavedResult, TEFTask, EvaluationResult } from '../../types';
import { persistenceService } from '../../services/persistence';
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
import { ResultVoting } from './components/ResultVoting';

interface DetailedResultViewProps {
  result: SavedResult;
  onBack: () => void;
}

export const DetailedResultView: React.FC<DetailedResultViewProps> = ({ result, onBack }) => {
  const { t } = useLanguage();
  const { getToken } = useAuth();
  const [currentResult, setCurrentResult] = useState<SavedResult>(result);
  const [fetchedTasks, setFetchedTasks] = useState<Map<string, TEFTask>>(new Map());

  // Update current result when prop changes
  useEffect(() => {
    setCurrentResult(result);
  }, [result]);

  // Fetch tasks using taskReferences
  useEffect(() => {
    const fetchTasks = async () => {
      if (!result.taskReferences) return;
      
      const taskIds: string[] = [];
      if (result.taskReferences.taskA?.taskId) {
        taskIds.push(result.taskReferences.taskA.taskId);
      }
      if (result.taskReferences.taskB?.taskId) {
        taskIds.push(result.taskReferences.taskB.taskId);
      }
      
      if (taskIds.length > 0 && getToken) {
        try {
          const normalizedTasks = await persistenceService.getTasks(taskIds, getToken);
          const taskMap = new Map<string, TEFTask>();
          normalizedTasks.forEach(normalizedTask => {
            // Extract taskData from NormalizedTask - it contains the actual TEFTask with image, prompt, etc.
            if (normalizedTask.taskData && (normalizedTask.type === 'oralA' || normalizedTask.type === 'oralB')) {
              taskMap.set(normalizedTask.taskId, normalizedTask.taskData as TEFTask);
            }
          });
          setFetchedTasks(taskMap);
        } catch (error) {
          console.error('Failed to fetch tasks:', error);
        }
      }
    };
    
    fetchTasks();
  }, [result.taskReferences, getToken]);

  // Use currentResult instead of result for rendering
  const displayResult = currentResult;

  // Get evaluation result - for partA/partB, check moduleData first, then fallback to main evaluation
  const evaluationResult = useMemo((): EvaluationResult => {
    // Always use the top-level evaluation as the single source of truth
    // For oral expression: evaluation is at top level (no sectionA/sectionB.result)
    // For written expression: evaluation is at top level (sectionA/sectionB.text contains written text, not evaluation)
    return displayResult.evaluation || displayResult as EvaluationResult;
  }, [displayResult]);

  // Memoize expensive calculations - read from evaluationResult
  const criteria = useMemo(() => evaluationResult.criteria || {}, [evaluationResult.criteria]);
  const upgradedSentences = useMemo(() => evaluationResult.upgraded_sentences || [], [evaluationResult.upgraded_sentences]);
  const topImprovements = useMemo(() => evaluationResult.top_improvements || [], [evaluationResult.top_improvements]);
  const overallComment = useMemo(() => evaluationResult.overall_comment, [evaluationResult.overall_comment]);
  const modelAnswer = useMemo(() => evaluationResult.model_answer, [evaluationResult.model_answer]);
  const strengths = useMemo(() => evaluationResult.strengths || [], [evaluationResult.strengths]);
  const weaknesses = useMemo(() => evaluationResult.weaknesses || [], [evaluationResult.weaknesses]);
  const actualQuestionsCount = useMemo(() => evaluationResult.actual_questions_count, [evaluationResult.actual_questions_count]);
  
  // Memoize tasks to display - fetch from taskReferences or fallback to legacy fields
  const tasksToDisplay = useMemo(() => {
    const tasks: Array<{ task: TEFTask; label: string }> = [];
    
    // Get tasks from fetchedTasks (populated from taskReferences) or legacy fields
    const taskA = (displayResult.taskReferences?.taskA?.taskId && fetchedTasks.get(displayResult.taskReferences.taskA.taskId)) || displayResult.taskPartA;
    const taskB = (displayResult.taskReferences?.taskB?.taskId && fetchedTasks.get(displayResult.taskReferences.taskB.taskId)) || displayResult.taskPartB;
    
    if (displayResult.mode === 'partA' && taskA) {
      tasks.push({ task: taskA, label: `Section ${t('results.sectionA')}` });
    } else if (displayResult.mode === 'partB' && taskB) {
      tasks.push({ task: taskB, label: `Section ${t('results.sectionB')}` });
    } else if (displayResult.mode === 'full') {
      if (taskA) tasks.push({ task: taskA, label: `${t('results.section')} ${t('results.sectionA')}` });
      if (taskB) tasks.push({ task: taskB, label: `${t('results.section')} ${t('results.sectionB')}` });
    }
    return tasks;
  }, [displayResult.mode, displayResult.taskReferences, displayResult.taskPartA, displayResult.taskPartB, fetchedTasks, t]);

  // For reading/listening results, show simple view
  if (displayResult.module === 'reading' || displayResult.module === 'listening') {
    return <SimpleResultView result={displayResult} onBack={onBack} />;
  }

  // For written expression and oral expression results, show full detailed view
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-8 duration-500">
      {/* Header with Back Button and Voting */}
      <div className="flex items-center justify-between gap-4">
        <button 
          onClick={onBack}
          className="text-indigo-400 dark:text-indigo-300 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:opacity-70 transition-opacity"
        >
          <span>←</span> {t('back.toList')}
        </button>

        {/* Voting Component - Mobile only (same level as back button) */}
        {displayResult.module === 'oralExpression' && !displayResult.isLoading && (
          <div className="md:hidden">
            <ResultVoting
              result={displayResult}
              onVoteUpdate={(updatedResult) => {
                // Only update the votes field, preserving all other data
                setCurrentResult((prevResult) => ({
                  ...prevResult,
                  votes: updatedResult.votes,
                }));
              }}
              compact={true}
            />
          </div>
        )}
      </div>

      {/* Compact Top Section: Section Badge, CLB, CECR, Recording */}
      <ResultHeader
        result={displayResult}
        audioPlayer={
          displayResult.module !== 'writtenExpression' && displayResult.recordingId ? (
            <AudioPlayer recordingId={displayResult.recordingId} />
          ) : undefined
        }
        onVoteUpdate={(updatedResult) => {
          // Only update the votes field, preserving all other data
          setCurrentResult((prevResult) => ({
            ...prevResult,
            votes: updatedResult.votes,
          }));
        }}
      />

      {/* Written Expression - Tabbed Display */}
      {displayResult.module === 'writtenExpression' && (
        <WrittenExpressionTabs result={displayResult} />
      )}

      {/* Written Expression Overall Comment (shown only if moduleData is missing) */}
      {displayResult.module === 'writtenExpression' && !displayResult.moduleData && overallComment && (
        <OverallComment comment={overallComment} variant="blue" />
      )}

      {/* Task Images and Transcript Container (for oral expression) */}
      {displayResult.module !== 'writtenExpression' && (tasksToDisplay.length > 0 || displayResult.transcript) && (
        <TaskAndTranscriptContainer
          tasks={tasksToDisplay}
          transcript={displayResult.transcript}
        />
      )}

      {/* Overall Comment (for non-written expression) */}
      {displayResult.module !== 'writtenExpression' && overallComment && (
        <OverallComment comment={overallComment} variant="indigo" />
      )}

      {/* Question Count (for oral expression Section A only) */}
      {displayResult.module === 'oralExpression' && (displayResult.mode === 'partA' || displayResult.mode === 'full') && typeof actualQuestionsCount === 'number' && (
        <QuestionCount actualCount={actualQuestionsCount} />
      )}

      {/* Strengths & Weaknesses (for non-written expression) */}
      {displayResult.module !== 'writtenExpression' && (strengths.length > 0 || weaknesses.length > 0) && (
        <StrengthsWeaknesses strengths={strengths} weaknesses={weaknesses} />
      )}

      {/* Criteria Breakdown (for non-written expression) */}
      {displayResult.module !== 'writtenExpression' && Object.keys(criteria).length > 0 && (
        <CriteriaBreakdown criteria={criteria} />
      )}

      {/* Top Improvements (for non-written expression) */}
      {displayResult.module !== 'writtenExpression' && topImprovements.length > 0 && (
        <TopImprovements improvements={topImprovements} />
      )}

      {/* Upgraded Sentences (for non-written expression) */}
      {displayResult.module !== 'writtenExpression' && upgradedSentences.length > 0 && (
        <UpgradedSentences sentences={upgradedSentences} />
      )}

      {/* Model Answer (for non-written expression) */}
      {displayResult.module !== 'writtenExpression' && modelAnswer && (
        <ModelAnswer modelAnswer={modelAnswer} />
      )}
    </div>
  );
};
