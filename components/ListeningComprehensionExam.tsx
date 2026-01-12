/**
 * Listening Comprehension Exam Component
 * 
 * Main orchestrator component that coordinates hooks and UI components
 * for the listening comprehension exam interface.
 * 
 * Uses standardized spacing from utils/designTokens.ts:
 * - Main padding: p-4 md:p-8
 * - Component spacing: space-y-6
 * - Border radius: rounded-lg, rounded-xl
 */

import React, { useMemo, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { ListeningTask, ReadingListeningQuestion, MCQResult } from '../types';
import { AudioItemMetadata } from '../services/tasks';
import { MCQQuestion, MCQQuestionData } from './MCQQuestion';

// Hooks
import { useListeningExamState } from './listening/hooks/useListeningExamState';
import { useAudioManagement } from './listening/hooks/useAudioManagement';
import { usePhaseManagement } from './listening/hooks/usePhaseManagement';
import { usePersistence } from './listening/hooks/usePersistence';
import { useSubmission } from './listening/hooks/useSubmission';

// Components
import { NoQuestionsError } from './listening/components/NoQuestionsError';
import { NoAudioError } from './listening/components/NoAudioError';
import { ListeningExamHeader } from './listening/components/ListeningExamHeader';
import { ListeningExamPhaseIndicator } from './listening/components/ListeningExamPhaseIndicator';
import { ListeningExamAudioSection } from './listening/components/ListeningExamAudioSection';
import { ListeningExamNavigation } from './listening/components/ListeningExamNavigation';

// Utils
import { SavedExamState, saveState } from './listening/utils/listeningExamPersistence';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ListeningComprehensionExamProps {
  task: ListeningTask;
  questions: ReadingListeningQuestion[];
  audioItems?: AudioItemMetadata[] | null;
  sessionId: string;
  mockExamId: string;
  assignmentId?: string;
  onComplete: (result: MCQResult) => void;
  onClose?: () => void;
}

export const ListeningComprehensionExam: React.FC<ListeningComprehensionExamProps> = React.memo(({
  task,
  questions,
  audioItems,
  sessionId,
  mockExamId,
  assignmentId,
  onComplete,
  onClose,
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();

  // Validate that we have questions and audioItems - check before hooks
  const hasQuestions = questions && questions.length > 0;
  const hasAudioItems = audioItems && audioItems.length > 0;

  // Main state management - hooks must be called unconditionally
  const examState = useListeningExamState({ questions: questions || [], assignmentId });

  // Destructure setters to ensure stable references for callbacks
  const { setAnswers, setCurrentQuestionIndex, setHasStarted, startTimeRef } = examState;

  // Track if we've initialized to prevent infinite loops
  const hasInitializedRef = useRef(false);

  // Handle state loading from persistence
  const handleStateLoaded = useCallback((savedState: SavedExamState) => {
    setAnswers(savedState.answers);
    setCurrentQuestionIndex(savedState.currentQuestionIndex);
    if (savedState.startTime) {
      startTimeRef.current = savedState.startTime;
      setHasStarted(true);
    }
    hasInitializedRef.current = true; // Mark as initialized whether or not there was a saved startTime
  }, [setAnswers, setCurrentQuestionIndex, setHasStarted]);

  // Persistence
  const persistence = usePersistence({
    task,
    sessionId,
    questions: questions || [],
    answers: examState.answers,
    currentQuestionIndex: examState.currentQuestionIndex,
    hasStarted: examState.hasStarted,
    startTime: examState.startTimeRef.current,
    onStateLoaded: handleStateLoaded,
  });

  // Submission
  const submission = useSubmission({
    task,
    questions: questions || [],
    answers: examState.answers,
    mockExamId,
    assignmentId,
    sessionId,
    storageKey: persistence.storageKey,
    hasStarted: examState.hasStarted,
    onComplete,
  });

  // Update submit ref for phase management
  useEffect(() => {
    examState.handleSubmitRef.current = submission.handleSubmit;
  }, [examState.handleSubmitRef, submission.handleSubmit]);

  // Start exam when component mounts (only for mock exams, not practice assignments)
  useEffect(() => {
    // Only start for mock exams (not practice assignments)
    // Run immediately - don't wait for persistence to load
    if (!assignmentId && !examState.hasStarted && questions.length > 0) {
      // Set startTime if not already set (from persistence)
      if (!startTimeRef.current) {
        startTimeRef.current = Date.now();
      }
      setHasStarted(true);
      hasInitializedRef.current = true;
      // Save start time
      saveState(
        persistence.storageKey,
        examState.answers,
        examState.currentQuestionIndex,
        startTimeRef.current
      );
    }
  }, [assignmentId, examState.hasStarted, questions.length, persistence.storageKey, setHasStarted, examState.answers, examState.currentQuestionIndex]);

  // Memoize onAutoSubmit to prevent timer effect from re-running
  const onAutoSubmit = useCallback(() => {
    submission.handleSubmit(true);
  }, [submission.handleSubmit]);

  // Phase management
  const phaseManagement = usePhaseManagement({
    questions: questions || [],
    currentQuestionIndex: examState.currentQuestionIndex,
    phase: examState.phase,
    setPhase: examState.setPhase,
    setCurrentQuestionIndex: examState.setCurrentQuestionIndex,
    setTimeRemaining: examState.setTimeRemaining,
    setAudioEnded: examState.setAudioEnded,
    hasStarted: examState.hasStarted,
    isSubmitting: examState.isSubmitting,
    isPracticeAssignment: examState.isPracticeAssignment,
    onAutoSubmit,
  });

  // Audio management
  const audioManagement = useAudioManagement({
    currentQuestion: examState.currentQuestion,
    audioItems: audioItems || null,
    task,
    phase: examState.phase,
    isPracticeAssignment: examState.isPracticeAssignment,
  });

  // Early returns after all hooks
  if (!hasQuestions) {
    return <NoQuestionsError task={task} onClose={onClose} />;
  }

  if (!hasAudioItems) {
    return <NoAudioError task={task} onClose={onClose} />;
  }

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Convert current question to MCQQuestionData format
  const questionData: MCQQuestionData = useMemo(() => {
    if (!examState.currentQuestion) {
      return {
        questionId: '',
        question: '',
        options: [],
      };
    }
    return {
      questionId: examState.currentQuestion.questionId,
      question: examState.currentQuestion.question,
      options: examState.currentQuestion.options,
    };
  }, [examState.currentQuestion]);

  if (!examState.currentQuestion) {
    return null;
  }

  // Handle close with auto-submit
  const handleClose = useCallback(async () => {
    if (window.confirm('Are you sure you want to leave? Your progress will be saved.')) {
      // Auto-submit for mock exams or assignments
      if ((mockExamId || assignmentId) && examState.hasStarted && !examState.isSubmitting) {
        try {
          examState.setIsSubmitting(true);
          const submittedAnswers = examState.answers.map(a => a !== null ? a : -1);

          const endpoint = assignmentId 
            ? `${BACKEND_URL}/api/exam/submit-assignment-mcq`
            : `${BACKEND_URL}/api/exam/submit-mcq`;
          
          const requestBody = assignmentId
            ? {
                taskId: task.taskId,
                answers: submittedAnswers,
                module: 'listening',
                assignmentId,
                sessionId,
              }
            : {
                taskId: task.taskId,
                answers: submittedAnswers,
                module: 'listening',
                mockExamId,
                sessionId,
              };

          await fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getToken()}`,
            },
            body: JSON.stringify(requestBody),
          });
        } catch (error) {
          console.error('Failed to auto-submit on close:', error);
        } finally {
          examState.setIsSubmitting(false);
        }
      }
      onClose?.();
    }
  }, [mockExamId, assignmentId, examState.hasStarted, examState.isSubmitting, examState.answers, examState.setIsSubmitting, task.taskId, sessionId, getToken, onClose]);

  return (
    <div className={`
      min-h-screen p-4 md:p-8
      ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}
    `}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <ListeningExamHeader
          currentQuestionIndex={examState.currentQuestionIndex}
          totalQuestions={questions?.length || 0}
          answeredCount={examState.answeredCount}
          onClose={handleClose}
        />

        {/* Phase Indicator */}
        <ListeningExamPhaseIndicator
          phase={examState.phase}
          timeRemaining={examState.timeRemaining}
          currentQuestionIndex={examState.currentQuestionIndex}
          totalQuestions={questions?.length || 0}
          isPracticeAssignment={examState.isPracticeAssignment}
          formatTime={formatTime}
        />

        {/* Audio Section */}
        <ListeningExamAudioSection
          phase={examState.phase}
          audioUrl={audioManagement.audioBlobUrl}
          isLoadingAudio={audioManagement.isLoadingAudio}
          task={task}
          isPracticeAssignment={examState.isPracticeAssignment}
          onAudioEnded={phaseManagement.handleAudioEnded}
        />

        {/* Question */}
        <div className="mb-6">
          <MCQQuestion
            question={questionData}
            questionNumber={examState.currentQuestionIndex + 1}
            selectedAnswer={examState.answers[examState.currentQuestionIndex]}
            onAnswerSelect={examState.handleAnswerSelect}
            disabled={examState.isSubmitting}
          />
        </div>

        {/* Navigation */}
        <ListeningExamNavigation
          isFirstQuestion={examState.isFirstQuestion}
          isLastQuestion={examState.isLastQuestion}
          isPracticeAssignment={examState.isPracticeAssignment}
          phase={examState.phase}
          answeredCount={examState.answeredCount}
          totalQuestions={questions?.length || 0}
          isSubmitting={examState.isSubmitting}
          onPrevious={phaseManagement.goToPreviousQuestion}
          onNext={phaseManagement.goToNextQuestion}
          onSubmit={() => submission.handleSubmit(false)}
        />
      </div>
    </div>
  );
});

ListeningComprehensionExam.displayName = 'ListeningComprehensionExam';
