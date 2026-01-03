/**
 * Custom hook for managing exam phases and timers
 * Handles phase transitions, countdown timers, and auto-advance logic
 */

import { useEffect, useRef, useCallback } from 'react';
import { Phase } from './useListeningExamState';
import { getTimingForQuestion } from '../utils/listeningExamTiming';
import { ReadingListeningQuestion } from '../../../types';

interface UsePhaseManagementProps {
  questions: ReadingListeningQuestion[];
  currentQuestionIndex: number;
  phase: Phase;
  setPhase: (phase: Phase) => void;
  setCurrentQuestionIndex: (index: number | ((prev: number) => number)) => void;
  setTimeRemaining: (time: number | ((prev: number) => number)) => void;
  setAudioEnded: (ended: boolean) => void;
  hasStarted: boolean;
  isSubmitting: boolean;
  isPracticeAssignment: boolean;
  onAutoSubmit?: () => void;
}

export function usePhaseManagement({
  questions,
  currentQuestionIndex,
  phase,
  setPhase,
  setCurrentQuestionIndex,
  setTimeRemaining,
  setAudioEnded,
  hasStarted,
  isSubmitting,
  isPracticeAssignment,
  onAutoSubmit,
}: UsePhaseManagementProps) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioEndedRef = useRef<boolean>(false);

  const currentQuestion = questions[currentQuestionIndex];
  const currentQuestionNumber = currentQuestion?.questionNumber || (currentQuestionIndex + 1);

  // Initialize phase and timer on start
  useEffect(() => {
    if (!hasStarted && questions.length > 0) {
      const initialQuestion = questions[0];
      const initialQuestionNumber = initialQuestion?.questionNumber || 1;
      // For practice assignments, skip reading phase and go straight to answering (audio player visible)
      if (isPracticeAssignment) {
        setPhase('answering');
        setTimeRemaining(0);
      } else {
        setPhase('reading');
        const { readingTime: initialReadingTime } = getTimingForQuestion(initialQuestionNumber);
        setTimeRemaining(initialReadingTime);
      }
    }
  }, [hasStarted, questions, isPracticeAssignment, setPhase, setTimeRemaining]);

  // Move to next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextIndex];
      const nextQuestionNumber = nextQuestion?.questionNumber || nextIndex + 1;
      
      // For practice assignments, no time constraints
      if (isPracticeAssignment) {
        setCurrentQuestionIndex(nextIndex);
        setPhase('reading');
        setTimeRemaining(0);
        setAudioEnded(false);
      } else {
        // For mock exams, use timing constraints
        const { readingTime: nextReadingTime } = getTimingForQuestion(nextQuestionNumber);
        setCurrentQuestionIndex(nextIndex);
        setPhase('reading');
        setTimeRemaining(nextReadingTime);
        setAudioEnded(false);
      }
    } else {
      // Last question - only auto-submit for mock exams, not practice assignments
      if (!isPracticeAssignment && onAutoSubmit) {
        onAutoSubmit();
      }
      // For practice assignments, user must manually submit
    }
  }, [currentQuestionIndex, questions, isPracticeAssignment, setCurrentQuestionIndex, setPhase, setTimeRemaining, setAudioEnded, onAutoSubmit]);

  // Phase management and auto-advance
  useEffect(() => {
    if (!hasStarted || isSubmitting) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // For practice assignments, skip all timers - user controls everything manually
    if (isPracticeAssignment) {
      if (phase === 'reading') {
        // No timer - user can click to play audio when ready
        setTimeRemaining(0);
      } else if (phase === 'playing') {
        // Audio playing phase - wait for audio to end
        setTimeRemaining(0);
        audioEndedRef.current = false;
        // Audio will trigger onEnded callback
      } else if (phase === 'answering') {
        // No timer - user can take as long as needed
        setTimeRemaining(0);
      }
      return;
    }

    // For mock exams, use timers as before
    if (phase === 'reading') {
      // Reading phase - countdown to audio play
      const { readingTime: currentReadingTime } = getTimingForQuestion(currentQuestionNumber);
      setTimeRemaining(currentReadingTime);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setPhase('playing');
            setTimeRemaining(0);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (phase === 'playing') {
      // Audio playing phase - wait for audio to end
      setTimeRemaining(0);
      audioEndedRef.current = false;
      // Audio will trigger onEnded callback
    } else if (phase === 'answering') {
      // Answering phase - countdown to next question
      const { answerTime: currentAnswerTime } = getTimingForQuestion(currentQuestionNumber);
      setTimeRemaining(currentAnswerTime);
      timerRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            // Auto-advance to next question
            handleNextQuestion();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [phase, hasStarted, isSubmitting, currentQuestionIndex, isPracticeAssignment, currentQuestionNumber, handleNextQuestion, setPhase, setTimeRemaining]);

  // Handle audio ended
  const handleAudioEnded = useCallback(() => {
    audioEndedRef.current = true;
    setAudioEnded(true);
    setPhase('answering');
    // For practice assignments, no time constraints
    if (isPracticeAssignment) {
      setTimeRemaining(0);
    } else {
      const { answerTime: currentAnswerTime } = getTimingForQuestion(currentQuestionNumber);
      setTimeRemaining(currentAnswerTime);
    }
  }, [currentQuestionNumber, isPracticeAssignment, setPhase, setTimeRemaining, setAudioEnded]);

  // Navigation functions (for practice assignments)
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextIndex];
      const nextQuestionNumber = nextQuestion?.questionNumber || nextIndex + 1;
      
      // For practice assignments, stay in answering phase (audio always visible)
      if (isPracticeAssignment) {
        setCurrentQuestionIndex(nextIndex);
        setPhase('answering');
        setTimeRemaining(0);
        setAudioEnded(false);
      } else {
        // For mock exams, use timing constraints
        const { readingTime: nextReadingTime } = getTimingForQuestion(nextQuestionNumber);
        setCurrentQuestionIndex(nextIndex);
        setPhase('reading');
        setTimeRemaining(nextReadingTime);
        setAudioEnded(false);
      }
    }
  }, [currentQuestionIndex, questions, isPracticeAssignment, setCurrentQuestionIndex, setPhase, setTimeRemaining, setAudioEnded]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevQuestion = questions[prevIndex];
      const prevQuestionNumber = prevQuestion?.questionNumber || prevIndex + 1;
      
      // For practice assignments, stay in answering phase (audio always visible)
      if (isPracticeAssignment) {
        setCurrentQuestionIndex(prevIndex);
        setPhase('answering');
        setTimeRemaining(0);
        setAudioEnded(false);
      } else {
        // For mock exams, use timing constraints
        const { readingTime: prevReadingTime } = getTimingForQuestion(prevQuestionNumber);
        setCurrentQuestionIndex(prevIndex);
        setPhase('reading');
        setTimeRemaining(prevReadingTime);
        setAudioEnded(false);
      }
    }
  }, [currentQuestionIndex, questions, isPracticeAssignment, setCurrentQuestionIndex, setPhase, setTimeRemaining, setAudioEnded]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return {
    handleAudioEnded,
    goToNextQuestion,
    goToPreviousQuestion,
    currentQuestionNumber,
  };
}
