import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useTheme } from '../contexts/ThemeContext';
import { ListeningTask, ReadingListeningQuestion, MCQResult } from '../types';
import { AudioItemMetadata } from '../services/tasks';
import { MCQQuestion, MCQQuestionData } from './MCQQuestion';
import { AudioPlayer } from './AudioPlayer';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface ListeningComprehensionExamProps {
  task: ListeningTask;
  questions: ReadingListeningQuestion[];
  audioItems?: AudioItemMetadata[] | null; // Optional: AudioItems metadata (for new structure)
  sessionId: string;
  mockExamId: string;
  onComplete: (result: MCQResult) => void;
  onClose?: () => void;
}

const AUTO_SAVE_INTERVAL = 5000; // 5 seconds
const STORAGE_KEY_PREFIX = 'listening_exam_';

// Timing requirements:
// Questions 23-30 (2 questions per audio): 20 seconds before, 20 seconds after
// All other questions (1 question per audio): 10 seconds before, 10 seconds after
const getTimingForQuestion = (questionNumber: number): { readingTime: number; answerTime: number } => {
  // Question numbers are 1-indexed
  if (questionNumber >= 23 && questionNumber <= 30) {
    return { readingTime: 20, answerTime: 20 };
  }
  return { readingTime: 10, answerTime: 10 };
};

type Phase = 'reading' | 'playing' | 'answering' | 'transitioning';

export const ListeningComprehensionExam: React.FC<ListeningComprehensionExamProps> = React.memo(({
  task,
  questions,
  audioItems,
  sessionId,
  mockExamId,
  onComplete,
  onClose,
}) => {
  const { getToken } = useAuth();
  const { theme } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(40).fill(null));
  const [phase, setPhase] = useState<Phase>('reading');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [audioEnded, setAudioEnded] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const audioEndedRef = useRef<boolean>(false);
  const storageKey = useMemo(() => `${STORAGE_KEY_PREFIX}${task.taskId}_${sessionId}`, [task.taskId, sessionId]);
  const startTimeRef = useRef<number | null>(null);

  // Validate that we have questions and audioItems
  if (!questions || questions.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#000', marginBottom: '1rem' }}>
          ⚠️ Aucune question disponible
        </h2>
        <p style={{ color: theme === 'dark' ? '#ccc' : '#666', marginBottom: '1rem' }}>
          Cette tâche d'écoute n'a pas de questions générées.
        </p>
        <p style={{ color: theme === 'dark' ? '#999' : '#888', fontSize: '0.9rem' }}>
          Task ID: {task.taskId}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0',
              color: theme === 'dark' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        )}
      </div>
    );
  }

  if (!audioItems || audioItems.length === 0) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2 style={{ color: theme === 'dark' ? '#fff' : '#000', marginBottom: '1rem' }}>
          ⚠️ Aucun fichier audio disponible
        </h2>
        <p style={{ color: theme === 'dark' ? '#ccc' : '#666', marginBottom: '1rem' }}>
          Cette tâche d'écoute n'a pas de fichiers audio générés.
        </p>
        <p style={{ color: theme === 'dark' ? '#999' : '#888', fontSize: '0.9rem' }}>
          Task ID: {task.taskId}
        </p>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0',
              color: theme === 'dark' ? '#fff' : '#000',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Fermer
          </button>
        )}
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  
  // Get timing for current question
  const currentQuestionNumber = currentQuestion?.questionNumber || (currentQuestionIndex + 1);
  const { readingTime, answerTime } = getTimingForQuestion(currentQuestionNumber);
  const [timeRemaining, setTimeRemaining] = useState(readingTime);

  // State for audio blob URL (for authenticated audio fetching)
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const audioBlobUrlRef = useRef<string | null>(null);

  // Fetch audio as blob with authentication and create object URL
  useEffect(() => {
    const fetchAudio = async () => {
      // Clean up previous blob URL
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
      setAudioBlobUrl(null);

      // Determine audio source
      let audioUrl: string | null = null;
      
      if (audioItems && currentQuestion?.audioId) {
        // New structure: use audioId from question
        const audioItem = audioItems.find(item => item.audioId === currentQuestion.audioId);
        if (audioItem && audioItem.hasAudio) {
          audioUrl = `${BACKEND_URL}/api/audio/${audioItem.audioId}?taskId=${encodeURIComponent(task.taskId)}`;
        }
      } else if (task.audioUrl) {
        // Old structure: fallback to task.audioUrl
        audioUrl = task.audioUrl;
      }

      if (!audioUrl) {
        return;
      }

      // If it's an external URL (http/https), use it directly
      if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
        // For API endpoints, we need to fetch with auth and create blob URL
        if (audioUrl.includes('/api/audio/')) {
          try {
            const token = await getToken();
            const response = await fetch(audioUrl, {
              headers: {
                'Authorization': `Bearer ${token || ''}`,
              },
            });

            if (!response.ok) {
              console.error('Failed to fetch audio:', response.statusText);
              return;
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            audioBlobUrlRef.current = objectUrl;
            setAudioBlobUrl(objectUrl);
          } catch (error) {
            console.error('Error fetching audio:', error);
          }
        } else {
          // External URL - use directly
          setAudioBlobUrl(audioUrl);
        }
      } else {
        // Relative URL - use directly
        setAudioBlobUrl(audioUrl);
      }
    };

    // Fetch audio when we have a current question and audioItems, or when phase is 'playing'
    // We can fetch early if we have audioItems to avoid delay when phase changes to 'playing'
    if (currentQuestion && (phase === 'playing' || (audioItems && currentQuestion.audioId))) {
      fetchAudio();
    }

    // Cleanup on unmount or when question changes
    return () => {
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
    };
  }, [audioItems, currentQuestion?.audioId, task.taskId, task.audioUrl, phase, getToken]);

  // Only use task.audioUrl as fallback if we don't have audioItems
  // If we have audioItems, we should wait for the blob URL to be ready
  // Use explicit check: only use task.audioUrl if audioItems is null/undefined (not just falsy)
  const currentAudioUrl = audioBlobUrl || (audioItems !== null && audioItems !== undefined ? '' : (task.audioUrl || ''));

  // Load saved state from localStorage on mount
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
            startTimeRef.current = savedData.startTime;
            setHasStarted(true);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load saved state:', error);
    }
  }, [storageKey]);

  // Start the exam
  useEffect(() => {
    if (!hasStarted && questions.length > 0) {
      startTimeRef.current = Date.now();
      setHasStarted(true);
      const initialQuestion = questions[0];
      const initialQuestionNumber = initialQuestion?.questionNumber || 1;
      const { readingTime: initialReadingTime } = getTimingForQuestion(initialQuestionNumber);
      setPhase('reading');
      setTimeRemaining(initialReadingTime);
    }
  }, [hasStarted, questions]);

  // Phase management and auto-advance
  useEffect(() => {
    if (!hasStarted || isSubmitting) return;

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

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
  }, [phase, hasStarted, isSubmitting, currentQuestionIndex]);

  // Auto-save to localStorage
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
        console.error('Failed to auto-save:', error);
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

  // Handle audio ended
  const handleAudioEnded = useCallback(() => {
    audioEndedRef.current = true;
    setAudioEnded(true);
    setPhase('answering');
    const { answerTime: currentAnswerTime } = getTimingForQuestion(currentQuestionNumber);
    setTimeRemaining(currentAnswerTime);
  }, [currentQuestionNumber]);

  // Handle answer selection
  const handleAnswerSelect = useCallback((answerIndex: number) => {
    setAnswers((prev) => {
      const newAnswers = [...prev];
      newAnswers[currentQuestionIndex] = answerIndex;
      return newAnswers;
    });
  }, [currentQuestionIndex]);

  // Move to next question
  const handleNextQuestion = useCallback(() => {
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQuestion = questions[nextIndex];
      const nextQuestionNumber = nextQuestion?.questionNumber || nextIndex + 1;
      const { readingTime: nextReadingTime } = getTimingForQuestion(nextQuestionNumber);
      setCurrentQuestionIndex(nextIndex);
      setPhase('reading');
      setTimeRemaining(nextReadingTime);
      setAudioEnded(false);
    } else {
      // Last question - auto-submit
      handleSubmit(true);
    }
  }, [currentQuestionIndex, questions.length]);

  // Submit manually
  const handleSubmitManual = useCallback(() => {
    handleSubmit(false);
  }, []);

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
          module: 'listening',
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
              module: 'listening',
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
  }, [answers, currentQuestionIndex, storageKey, mockExamId, hasStarted, isSubmitting, task.taskId, sessionId, getToken]);

  // Format time as MM:SS
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Convert current question to MCQQuestionData format
  const questionData: MCQQuestionData = useMemo(() => {
    if (!currentQuestion) {
      return {
        questionId: '',
        question: '',
        options: [],
      };
    }
    return {
      questionId: currentQuestion.questionId,
      question: currentQuestion.question,
      options: currentQuestion.options,
    };
  }, [currentQuestion]);

  const answeredCount = answers.filter(a => a !== null).length;

  if (!currentQuestion) {
    return null;
  }

  return (
    <div className={`
      min-h-screen p-4 md:p-8
      ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900'}
    `}>
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className={`
              text-2xl md:text-3xl font-bold
              ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}
            `}>
              Listening Comprehension
            </h1>
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
                          module: 'listening',
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

          {/* Progress */}
          <div className={`
            px-4 py-2 rounded-lg mb-4 text-center
            ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-300'}
          `}>
            Question {currentQuestionIndex + 1} of {questions.length} • {answeredCount} answered
          </div>

          {/* Progress Bar */}
          <div className={`
            w-full h-2 rounded-full overflow-hidden mb-4
            ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}
          `}>
            <div
              className={`
                h-full transition-all duration-300
                ${theme === 'dark' ? 'bg-indigo-500' : 'bg-indigo-600'}
              `}
              style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Phase Indicator */}
        {phase === 'reading' && (
          <div className={`
            mb-6 p-4 rounded-lg text-center
            ${theme === 'dark' ? 'bg-blue-900/30 border border-blue-700' : 'bg-blue-50 border border-blue-200'}
          `}>
            <p className={`
              text-lg font-semibold mb-2
              ${theme === 'dark' ? 'text-blue-200' : 'text-blue-800'}
            `}>
              Read the question carefully
            </p>
            <p className={`
              text-2xl font-mono font-bold mb-1
              ${theme === 'dark' ? 'text-blue-100' : 'text-blue-700'}
            `}>
              {formatTime(timeRemaining)}
            </p>
            <p className={`
              text-sm
              ${theme === 'dark' ? 'text-blue-300' : 'text-blue-700'}
            `}>
              Audio will play automatically after countdown
            </p>
          </div>
        )}

        {phase === 'playing' && (
          <div className={`
            mb-6 p-4 rounded-lg
            ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
          `}>
            <p className={`
              text-center mb-4 font-semibold
              ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}
            `}>
              Listen to the audio
            </p>
            {currentAudioUrl && currentAudioUrl !== task.audioUrl ? (
              <AudioPlayer
                src={currentAudioUrl}
                onEnded={handleAudioEnded}
                autoPlay={true}
                onError={(error) => {
                  console.error('Audio playback error:', error);
                  // If audio fails and we have audioItems, it might be a loading issue
                  // For now, just log the error
                }}
              />
            ) : currentAudioUrl === task.audioUrl && task.audioUrl ? (
              <div className={`p-4 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
                ⚠️ Audio not available. This task uses the old audio format. Please regenerate with the new CLI.
              </div>
            ) : (
              <div className={`p-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                Loading audio...
              </div>
            )}
          </div>
        )}

        {phase === 'answering' && (
          <div className={`
            mb-6 p-4 rounded-lg text-center
            ${theme === 'dark' ? 'bg-yellow-900/30 border border-yellow-700' : 'bg-yellow-50 border border-yellow-200'}
          `}>
            <p className={`
              text-lg font-semibold mb-2
              ${theme === 'dark' ? 'text-yellow-200' : 'text-yellow-800'}
            `}>
              Choose your answer
            </p>
            <p className={`
              text-2xl font-mono font-bold mb-2
              ${theme === 'dark' ? 'text-yellow-100' : 'text-yellow-700'}
            `}>
              {formatTime(timeRemaining)}
            </p>
            <div className={`
              text-sm
              ${theme === 'dark' ? 'text-yellow-300' : 'text-yellow-700'}
            `}>
              {!isLastQuestion ? (
                <p>Next question will start automatically when timer reaches 0</p>
              ) : (
                <p>This is the last question. Submit when ready.</p>
              )}
            </div>
          </div>
        )}

        {/* Question */}
        <div className="mb-6">
          <MCQQuestion
            question={questionData}
            questionNumber={currentQuestionIndex + 1}
            selectedAnswer={answers[currentQuestionIndex]}
            onAnswerSelect={handleAnswerSelect}
            disabled={isSubmitting}
          />
        </div>

        {/* Submit Button (only on last question) */}
        {isLastQuestion && phase === 'answering' && (
          <div className="sticky bottom-0 pb-4">
            <div className={`
              p-4 rounded-lg shadow-lg
              ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
            `}>
              <button
                onClick={handleSubmitManual}
                disabled={isSubmitting}
                className={`
                  w-full py-3 px-6 rounded-lg font-semibold text-lg transition-colors
                  ${isSubmitting
                    ? 'bg-slate-400 text-slate-600 cursor-not-allowed'
                    : theme === 'dark'
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }
                `}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Exam'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

ListeningComprehensionExam.displayName = 'ListeningComprehensionExam';
