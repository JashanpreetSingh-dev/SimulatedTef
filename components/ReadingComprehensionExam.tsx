import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { ReadingTask, ReadingListeningQuestion, MCQResult } from '../types';
import { MCQQuestion, MCQQuestionData } from './MCQQuestion';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ReadingComprehensionExamProps {
  task: ReadingTask;
  questions: ReadingListeningQuestion[];
  sessionId: string;
  mockExamId: string;
  onComplete: (result: MCQResult) => void;
  onClose?: () => void;
}

const TIME_LIMIT_SECONDS = 3600; // 60 minutes
const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const STORAGE_KEY_PREFIX = 'reading_exam_';

export const ReadingComprehensionExam: React.FC<ReadingComprehensionExamProps> = React.memo(({
  task,
  questions,
  sessionId,
  mockExamId,
  onComplete,
  onClose,
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(40).fill(null));
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(TIME_LIMIT_SECONDS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}${task.taskId}_${sessionId}`, [task.taskId, sessionId]);
  const startTimeRef = useRef<number | null>(null);

  // Load saved answers from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const savedData = JSON.parse(saved);
        if (savedData.answers && Array.isArray(savedData.answers)) {
          setAnswers(savedData.answers);
          if (savedData.currentQuestionIndex !== undefined) {
            setCurrentQuestionIndex(savedData.currentQuestionIndex);
          }
          if (savedData.startTime) {
            const elapsed = Math.floor((Date.now() - savedData.startTime) / 1000);
            const remaining = Math.max(0, TIME_LIMIT_SECONDS - elapsed);
            setTimeRemaining(remaining);
            startTimeRef.current = savedData.startTime;
            setHasStarted(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load saved answers:', error);
    }
  }, [storageKey]);

  // Start timer when component mounts or resumes
  useEffect(() => {
    if (!hasStarted) {
      startTimeRef.current = Date.now();
      setHasStarted(true);
      // Save start time
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          answers,
          currentQuestionIndex,
          startTime: startTimeRef.current,
        }));
      } catch (error) {
        console.error('Failed to save start time:', error);
      }
    }

    // Timer countdown
    timerRef.current = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Time's up - auto-submit
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [hasStarted, storageKey]);

  // Auto-save answers to localStorage (debounced)
  useEffect(() => {
    if (!hasStarted) return;

    autoSaveRef.current = setTimeout(() => {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          answers,
          currentQuestionIndex,
          startTime: startTimeRef.current,
        }));
      } catch (error) {
        console.error('Failed to auto-save answers:', error);
      }
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [answers, currentQuestionIndex, storageKey, hasStarted]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, []);

  // Handle answer selection
  const handleAnswerSelect = useCallback((questionIndex: number, answerIndex: number) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[questionIndex] = answerIndex;
      return newAnswers;
    });
  }, []);

  // Navigation functions
  const goToNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  }, [currentQuestionIndex, questions.length]);

  const goToPreviousQuestion = useCallback(() => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  }, [currentQuestionIndex]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Calculate progress
  const progress = useMemo(() => {
    const answered = answers.filter(a => a !== null).length;
    return (answered / 40) * 100;
  }, [answers]);

  // Submit answers
  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Clear saved data
      localStorage.removeItem(storageKey);

      // Prepare answers array (fill nulls with -1 for incomplete answers)
      const submittedAnswers = answers.map(a => a !== null ? a : -1);

      // Submit to backend
      const response = await fetch(`${BACKEND_URL}/api/exam/submit-mcq`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
        },
        body: JSON.stringify({
          taskId: task.taskId,
          answers: submittedAnswers,
          module: 'reading',
          mockExamId,
          sessionId,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit: ${response.status} ${errorText}`);
      }

      const result = await response.json() as MCQResult;

      onComplete(result);
    } catch (error) {
      console.error('Failed to submit answers:', error);
      alert('Failed to submit answers. Please try again.');
      setIsSubmitting(false);
    }
  }, [answers, task.taskId, mockExamId, sessionId, getToken, onComplete, storageKey, isSubmitting]);

  // Handle page unload - auto-submit for mock exams
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Auto-submit if this is a mock exam and user has started
      if (mockExamId && hasStarted && !isSubmitting) {
        try {
          // Prepare answers array (fill nulls with -1 for incomplete answers)
          const submittedAnswers = answers.map(a => a !== null ? a : -1);

          // Submit in background - don't wait for response since page is unloading
          fetch(`${BACKEND_URL}/api/exam/submit-mcq`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getToken()}`,
            },
            body: JSON.stringify({
              taskId: task.taskId,
              answers: submittedAnswers,
              module: 'reading',
              mockExamId,
              sessionId,
            }),
            // Don't wait for response since page is unloading
            keepalive: true,
          }).catch(error => {
            console.error('Failed to auto-submit on unload:', error);
          });
        } catch (error) {
          console.error('Failed to prepare auto-submit:', error);
        }
      } else {
        // Regular save to localStorage for non-mock exams
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          answers,
          currentQuestionIndex,
          startTime: startTimeRef.current,
        }));
      } catch (error) {
        console.error('Failed to save on unload:', error);
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [answers, storageKey, mockExamId, hasStarted, isSubmitting, task.taskId, sessionId, getToken]);

  // Convert questions to MCQQuestionData format
  const questionData: MCQQuestionData[] = useMemo(() => {
    return questions.map((q) => ({
      questionId: q.questionId,
      question: q.question,
      questionText: q.questionText, // Include question-specific text if available
      options: q.options,
    }));
  }, [questions]);

  const answeredCount = answers.filter(a => a !== null).length;
  const currentQuestion = questions[currentQuestionIndex];
  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questions.length - 1;

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className={`
      min-h-screen p-4 md:p-8
      ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}
    `}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4">
          {/* Header with Timer/Progress on left, Close on right */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`
                px-3 py-1 rounded font-mono text-sm font-semibold
                ${timeRemaining < 300
                  ? 'bg-red-500 text-white'
                  : timeRemaining < 600
                  ? 'bg-yellow-500 text-white'
                  : theme === 'dark'
                  ? 'bg-slate-700 text-slate-100'
                  : 'bg-indigo-100 text-indigo-700'
                }
            `}>
                {formatTime(timeRemaining)}
              </div>
              <div className={`
                px-3 py-1 rounded text-sm
                ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-300'}
              `}>
                {answeredCount}/40
              </div>
            </div>
            <button
              onClick={async () => {
                if (window.confirm('Are you sure you want to leave? Your progress will be saved.')) {
                  // Auto-submit for mock exams
                  if (mockExamId && hasStarted && !isSubmitting) {
                    try {
                      setIsSubmitting(true);
                      const submittedAnswers = answers.map(a => a !== null ? a : -1);

                      await fetch(`${BACKEND_URL}/api/exam/submit-mcq`, {
                        method: 'POST',
                        headers: {
                          'Content-Type': 'application/json',
                          'Authorization': `Bearer ${await getToken()}`,
                        },
                        body: JSON.stringify({
                          taskId: task.taskId,
                          answers: submittedAnswers,
                          module: 'reading',
                          mockExamId,
                          sessionId,
                        }),
                      });
                    } catch (error) {
                      console.error('Failed to auto-submit on close:', error);
                    } finally {
                      setIsSubmitting(false);
                    }
                  }
                  onClose?.();
                }
              }}
              className={`
                px-4 py-2 rounded-lg transition-colors
                ${theme === 'dark'
                  ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }
              `}
            >
              Close
            </button>
          </div>



        </div>


        {/* Current Question */}
        <div className="mb-4">
          <MCQQuestion
            question={{
              questionId: currentQuestion.questionId,
              question: currentQuestion.question,
              questionText: currentQuestion.questionText,
              options: currentQuestion.options,
            }}
            questionNumber={currentQuestionIndex + 1}
            selectedAnswer={answers[currentQuestionIndex]}
            onAnswerSelect={(answerIndex) => handleAnswerSelect(currentQuestionIndex, answerIndex)}
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button */}
        <div className="mb-4">
          <div className={`
            p-2 rounded-lg shadow-lg
            ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
          `}>
            <div className="flex flex-row gap-2">
              <button
                onClick={goToPreviousQuestion}
                disabled={isFirstQuestion}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1
                  ${isFirstQuestion
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }
                `}
              >
                <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="hidden sm:inline">← Previous</span>
              </button>

              <button
                onClick={() => handleSubmit(false)}
                disabled={isSubmitting || answeredCount === 0}
                className={`
                  flex-2 py-2 px-4 rounded-lg font-semibold transition-colors
                  ${isSubmitting || answeredCount === 0
                    ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
                    : theme === 'dark'
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                  }
                `}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </button>

              <button
                onClick={goToNextQuestion}
                disabled={isLastQuestion}
                className={`
                  flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-1
                  ${isLastQuestion
                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                    : theme === 'dark'
                    ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
                    : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
                  }
                `}
              >
                <span className="hidden sm:inline">Next →</span>
                <svg className="w-4 h-4 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {answeredCount < 40 && (
              <p className={`
                mt-3 text-sm text-center hidden sm:block
                ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
              `}>
                You can submit with incomplete answers. Unanswered questions will be marked as incorrect.
              </p>
            )}

          </div>
        </div>
      </div>
    </div>
  );
});

ReadingComprehensionExam.displayName = 'ReadingComprehensionExam';
