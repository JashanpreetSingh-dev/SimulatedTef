/**
 * Custom hook for managing listening exam state
 * Handles answers, current question, phase, and submission state
 */

import { useState, useRef } from 'react';
import { ReadingListeningQuestion } from '../../../types';

export type Phase = 'reading' | 'playing' | 'answering' | 'transitioning';

interface UseListeningExamStateProps {
  questions: ReadingListeningQuestion[];
  assignmentId?: string;
}

export function useListeningExamState({ questions, assignmentId }: UseListeningExamStateProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(() => 
    new Array(questions.length).fill(null)
  );
  const [phase, setPhase] = useState<Phase>('reading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const handleSubmitRef = useRef<((isAutoSubmit?: boolean) => Promise<void>) | null>(null);

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const isFirstQuestion = currentQuestionIndex === 0;
  const isPracticeAssignment = !!assignmentId;
  const answeredCount = answers.filter(a => a !== null).length;

  const handleAnswerSelect = (answerIndex: number) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answerIndex;
      return newAnswers;
    });
  };

  return {
    // State
    currentQuestionIndex,
    setCurrentQuestionIndex,
    answers,
    setAnswers,
    phase,
    setPhase,
    isSubmitting,
    setIsSubmitting,
    hasStarted,
    setHasStarted,
    audioEnded,
    setAudioEnded,
    timeRemaining,
    setTimeRemaining,
    
    // Refs
    startTimeRef,
    handleSubmitRef,
    
    // Computed
    currentQuestion,
    isLastQuestion,
    isFirstQuestion,
    isPracticeAssignment,
    answeredCount,
    
    // Actions
    handleAnswerSelect,
  };
}
