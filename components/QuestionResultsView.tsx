import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '@clerk/clerk-react';
import { MCQResult, ReadingListeningQuestion, NormalizedQuestionResult } from '../types';
import { MCQQuestion, MCQQuestionData } from './MCQQuestion';
import { AudioPlayer } from './AudioPlayer';
import { getQuestionsByTaskId, getListeningTaskWithQuestions, AudioItemMetadata } from '../services/tasks';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface QuestionResultsViewProps {
  result: MCQResult;
  moduleName: 'Reading' | 'Listening';
  className?: string;
}

// Type guard to check if question result is in old format (has 'question' property)
function isOldFormatQuestionResult(q: any): q is NormalizedQuestionResult & { question: string; options: string[]; correctAnswer: number; explanation: string } {
  return 'question' in q;
}

// Enriched question result with full question details
interface EnrichedQuestionResult extends NormalizedQuestionResult {
  question: string;
  questionText?: string;
  options: string[];
  optionImageUrls?: string[]; // For listening Section 1 "quel dessin"
  correctAnswer: number;
  explanation: string;
  audioId?: string; // Add audioId for listening questions
}

export const QuestionResultsView: React.FC<QuestionResultsViewProps> = ({
  result,
  moduleName,
  className = '',
}) => {
  const { theme } = useTheme();
  const { getToken } = useAuth();
  const [currentAudioGroupIndex, setCurrentAudioGroupIndex] = useState(0);
  const [questions, setQuestions] = useState<ReadingListeningQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichedResults, setEnrichedResults] = useState<EnrichedQuestionResult[]>([]);
  const [audioItems, setAudioItems] = useState<AudioItemMetadata[] | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const audioBlobUrlRef = useRef<string | null>(null);
  // Cache for audio blob URLs to avoid refetching
  const audioCacheRef = useRef<Map<string, string>>(new Map());
  
  // Group questions by audioId for listening (so questions sharing same audio appear together)
  const audioGroups = useMemo(() => {
    if (moduleName !== 'Listening') {
      // For reading, return as individual groups (one question per group)
      return enrichedResults.map(q => [q]);
    }
    
    // For listening, group by audioId
    const groups: EnrichedQuestionResult[][] = [];
    const audioIdMap = new Map<string, EnrichedQuestionResult[]>();
    
    enrichedResults.forEach(q => {
      const audioId = q.audioId || 'no-audio';
      if (!audioIdMap.has(audioId)) {
        audioIdMap.set(audioId, []);
      }
      audioIdMap.get(audioId)!.push(q);
    });
    
    // Convert map to array, maintaining order
    audioIdMap.forEach((questions) => {
      groups.push(questions);
    });
    
    return groups;
  }, [enrichedResults, moduleName]);
  
  const currentAudioGroup = audioGroups[currentAudioGroupIndex] || [];

  // Check if results are in old format (already have full question data)
  const isOldFormat = result.questionResults.length > 0 && isOldFormatQuestionResult(result.questionResults[0]);

  // Fetch questions if in new normalized format
  useEffect(() => {
    if (isOldFormat) {
      // Old format: convert to enriched format directly
      const enriched = result.questionResults.map(q => {
        const oldFormatQ = q as NormalizedQuestionResult & { question: string; questionText?: string; options: string[]; optionImageUrls?: string[]; correctAnswer: number; explanation: string; audioId?: string };
        return {
          questionId: oldFormatQ.questionId,
          userAnswer: oldFormatQ.userAnswer,
          isCorrect: oldFormatQ.isCorrect,
          question: oldFormatQ.question,
          questionText: oldFormatQ.questionText,
          options: oldFormatQ.options,
          optionImageUrls: oldFormatQ.optionImageUrls,
          correctAnswer: oldFormatQ.correctAnswer,
          explanation: oldFormatQ.explanation,
          audioId: oldFormatQ.audioId,
        };
      });
      setEnrichedResults(enriched);
      
      // For listening in old format, try to fetch audioItems if we have a taskId
      if (moduleName === 'Listening' && result.taskId) {
        getListeningTaskWithQuestions(result.taskId, getToken)
          .then(taskData => {
            if (taskData?.audioItems) {
              setAudioItems(taskData.audioItems);
            }
          })
          .catch(err => {
            console.warn('Failed to fetch audioItems for old format result:', err);
          });
      }
      return;
    }

    // New format: fetch questions from API
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
        // For listening, fetch with audioItems; for reading, just fetch questions
        if (moduleName === 'Listening') {
          const taskData = await getListeningTaskWithQuestions(result.taskId, getToken);
          if (!taskData) {
            setError('No questions found');
            setLoading(false);
            return;
          }
          
          const fetchedQuestions = taskData.questions;
          setQuestions(fetchedQuestions);
          setAudioItems(taskData.audioItems);

          // Create a map of questions by questionId for quick lookup
          const questionMap = new Map<string, ReadingListeningQuestion>();
          fetchedQuestions.forEach(q => questionMap.set(q.questionId, q));

          // Enrich normalized questionResults with full question details
          const enriched = result.questionResults.map(qr => {
            const question = questionMap.get(qr.questionId);
            if (!question) {
              console.warn(`Question not found for questionId: ${qr.questionId}`);
              return null;
            }
            return {
              questionId: qr.questionId,
              userAnswer: qr.userAnswer,
              isCorrect: qr.isCorrect,
              question: question.question,
              questionText: question.questionText,
              options: question.options,
              optionImageUrls: question.optionImageUrls,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              audioId: question.audioId,
            };
          }).filter((q): q is NonNullable<typeof q> => q !== null);

          setEnrichedResults(enriched);
        } else {
          // Reading: just fetch questions
          const fetchedQuestions = await getQuestionsByTaskId(result.taskId, getToken);
          if (fetchedQuestions.length === 0) {
            setError('No questions found');
            setLoading(false);
            return;
          }

          setQuestions(fetchedQuestions);

          // Create a map of questions by questionId for quick lookup
          const questionMap = new Map<string, ReadingListeningQuestion>();
          fetchedQuestions.forEach(q => questionMap.set(q.questionId, q));

          // Enrich normalized questionResults with full question details
          const enriched = result.questionResults.map(qr => {
            const question = questionMap.get(qr.questionId);
            if (!question) {
              console.warn(`Question not found for questionId: ${qr.questionId}`);
              return null;
            }
            return {
              questionId: qr.questionId,
              userAnswer: qr.userAnswer,
              isCorrect: qr.isCorrect,
              question: question.question,
              questionText: question.questionText,
              options: question.options,
              optionImageUrls: question.optionImageUrls,
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
            };
          }).filter((q): q is NonNullable<typeof q> => q !== null);

          setEnrichedResults(enriched);
        }
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setError('Failed to load question details');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [result.taskId, result.questionResults, isOldFormat, getToken]);

  // Navigation functions - navigate between audio groups
  const goToNextGroup = () => {
    if (currentAudioGroupIndex < audioGroups.length - 1) {
      setCurrentAudioGroupIndex(prev => prev + 1);
    }
  };

  const goToPreviousGroup = () => {
    if (currentAudioGroupIndex > 0) {
      setCurrentAudioGroupIndex(prev => prev - 1);
    }
  };

  const isFirstGroup = currentAudioGroupIndex === 0;
  const isLastGroup = currentAudioGroupIndex === audioGroups.length - 1;
  
  // Get the audioId for the current group (for listening)
  const currentAudioId = moduleName === 'Listening' && currentAudioGroup.length > 0 
    ? currentAudioGroup[0].audioId 
    : undefined;

  // Fetch audio for current listening audio group (with caching)
  useEffect(() => {
    const fetchAudio = async () => {
      // Only for listening questions with audioId
      if (moduleName !== 'Listening' || !currentAudioId || !audioItems) {
        setAudioBlobUrl(null);
        setAudioLoading(false);
        return;
      }

      const audioItem = audioItems.find(item => item.audioId === currentAudioId);
      if (!audioItem || !audioItem.hasAudio) {
        setAudioBlobUrl(null);
        setAudioLoading(false);
        return;
      }

      // Check cache first
      const cachedUrl = audioCacheRef.current.get(currentAudioId);
      if (cachedUrl) {
        // Just use cached URL - don't revoke anything since all cached URLs are still valid
        audioBlobUrlRef.current = cachedUrl;
        setAudioBlobUrl(cachedUrl);
        setAudioLoading(false);
        return;
      }

      // Not in cache, fetch it
      setAudioLoading(true);
      setAudioBlobUrl(null);
      
      // Don't revoke previous URLs here - they're cached and may be needed when navigating back

      // Add cache-busting to ensure fresh audio is fetched
      const audioUrl = `${BACKEND_URL}/api/audio/${audioItem.audioId}?taskId=${encodeURIComponent(result.taskId)}&t=${Date.now()}`;

      try {
        const token = await getToken();
        const response = await fetch(audioUrl, {
          headers: {
            'Authorization': `Bearer ${token || ''}`,
          },
          cache: 'no-store', // Explicitly disable fetch cache
        });

        if (!response.ok) {
          console.error('Failed to fetch audio:', response.statusText);
          setAudioLoading(false);
          return;
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        // Cache the URL
        audioCacheRef.current.set(currentAudioId, objectUrl);
        
        audioBlobUrlRef.current = objectUrl;
        setAudioBlobUrl(objectUrl);
        setAudioLoading(false);
      } catch (error) {
        console.error('Error fetching audio:', error);
        setAudioLoading(false);
      }
    };

    fetchAudio();

    // Cleanup on unmount - revoke all cached URLs
    return () => {
      // Don't revoke here - we want to keep cached URLs
      // Only revoke on component unmount
    };
  }, [currentAudioId, audioItems, result.taskId, moduleName, getToken]);

  // Cleanup all cached URLs on unmount
  useEffect(() => {
    return () => {
      audioCacheRef.current.forEach((url) => {
        URL.revokeObjectURL(url);
      });
      audioCacheRef.current.clear();
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
    };
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className={className}>
        <div className={`
          p-8 text-center rounded-lg
          ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
        `}>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
            Loading questions...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || enrichedResults.length === 0) {
    return (
      <div className={className}>
        <div className={`
          p-8 text-center rounded-lg
          ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
        `}>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
            {error || 'No questions to display'}
          </p>
        </div>
      </div>
    );
  }

  if (audioGroups.length === 0 || currentAudioGroup.length === 0) {
    return (
      <div className={className}>
        <div className={`
          p-8 text-center rounded-lg
          ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
        `}>
          <p className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}>
            No questions to display
          </p>
        </div>
      </div>
    );
  }

  // Compute summary counts
  const correctCount = enrichedResults.filter(q => q.isCorrect).length;
  const skippedCount = enrichedResults.filter(q => q.userAnswer === -1 || q.userAnswer == null).length;
  const wrongCount = enrichedResults.length - correctCount - skippedCount;
  const pct = result.totalQuestions > 0 ? Math.round((result.score / result.totalQuestions) * 100) : 0;

  // Map questionId → groupIndex for jump navigation
  const questionToGroupIndex = useMemo(() => {
    const map = new Map<string, number>();
    audioGroups.forEach((group, gi) => group.forEach(q => map.set(q.questionId, gi)));
    return map;
  }, [audioGroups]);

  // Refs for scrolling to individual questions within the current group (v2 / reading)
  const questionDivRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const jumpToQuestion = (questionId: string) => {
    const groupIdx = questionToGroupIndex.get(questionId);
    if (groupIdx === undefined) return;
    if (groupIdx !== currentAudioGroupIndex) {
      setCurrentAudioGroupIndex(groupIdx);
      // Scroll after state update
      setTimeout(() => {
        questionDivRefs.current.get(questionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    } else {
      questionDivRefs.current.get(questionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div className={className}>
      {/* ── Score Hero ── */}
      <div className={`
        mb-6 p-6 rounded-2xl border text-center
        ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}
      `}>
        <div className={`text-6xl font-black leading-none ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
          {result.score}
          <span className={`text-3xl font-medium ml-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
            /{result.totalQuestions}
          </span>
        </div>
        <div className={`text-lg font-semibold mt-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          {pct}% correct
        </div>
        <div className="flex gap-6 justify-center mt-4 text-sm font-semibold flex-wrap">
          <span className="flex items-center gap-1.5 text-green-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.17l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd"/>
            </svg>
            {correctCount} correct
          </span>
          <span className="flex items-center gap-1.5 text-red-500">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/>
            </svg>
            {wrongCount} wrong
          </span>
          {skippedCount > 0 && (
            <span className={`flex items-center gap-1.5 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-400'}`}>
              <span className="font-bold text-base leading-none">—</span>
              {skippedCount} skipped
            </span>
          )}
        </div>
      </div>

      {/* ── Question Map ── */}
      <div className={`
        mb-6 p-4 rounded-xl border
        ${theme === 'dark' ? 'bg-slate-800/60 border-slate-700' : 'bg-slate-50 border-slate-200'}
      `}>
        <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          All Questions
        </p>
        <div className="flex flex-wrap gap-1.5">
          {enrichedResults.map((q, i) => {
            const isSkipped = q.userAnswer === -1 || q.userAnswer == null;
            const isActive = questionToGroupIndex.get(q.questionId) === currentAudioGroupIndex;
            return (
              <button
                key={q.questionId}
                onClick={() => jumpToQuestion(q.questionId)}
                title={`Q${i + 1}: ${isSkipped ? 'not attempted' : q.isCorrect ? 'correct' : 'wrong'}`}
                className={`
                  w-8 h-8 rounded-full text-xs font-bold transition-all
                  ${isSkipped
                    ? theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                    : q.isCorrect
                    ? 'bg-green-500 text-white'
                    : 'bg-red-500 text-white'
                  }
                  ${isActive ? 'ring-2 ring-offset-1 ring-indigo-400' : 'hover:scale-110'}
                `}
              >
                {i + 1}
              </button>
            );
          })}
        </div>
        <div className="flex gap-4 mt-3 text-xs font-medium flex-wrap">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block"/><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Correct</span></span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block"/><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Wrong</span></span>
          <span className="flex items-center gap-1"><span className={`w-3 h-3 rounded-full inline-block ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}`}/><span className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>Skipped</span></span>
        </div>
      </div>

      {/* Navigation progress label */}
      <div className="mb-4">
        <p className={`text-sm font-medium ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
          {moduleName === 'Listening'
            ? audioGroups.length > 1
              ? `Audio ${currentAudioGroupIndex + 1} of ${audioGroups.length} · ${currentAudioGroup.length} question${currentAudioGroup.length !== 1 ? 's' : ''}`
              : `Showing all ${enrichedResults.length} questions`
            : `Question ${currentAudioGroupIndex + 1} of ${audioGroups.length}`
          }
        </p>
      </div>

      {/* Audio Player for Listening Questions */}
      {moduleName === 'Listening' && currentAudioId && (
        <div className={`
          mb-6 p-4 rounded-lg
          ${theme === 'dark' ? 'bg-indigo-900/30 border border-indigo-700' : 'bg-indigo-50 border border-indigo-200'}
        `}>
          <p className={`
            text-center mb-4 font-semibold
            ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}
          `}>
            Audio
          </p>
          {audioLoading ? (
            <div className={`p-4 text-center ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
              Loading audio...
            </div>
          ) : audioBlobUrl ? (
            <AudioPlayer
              src={audioBlobUrl}
              autoPlay={false}
              onError={(error) => {
                console.error('Audio playback error:', error);
              }}
            />
          ) : (
            <div className={`p-4 text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Audio not available
            </div>
          )}
        </div>
      )}

      {/* Current Questions (all questions for current audio group) */}
      <div className="mb-8 space-y-6">
        {currentAudioGroup.map((question, idx) => {
          const questionData: MCQQuestionData = {
            questionId: question.questionId,
            question: question.question,
            questionText: question.questionText,
            options: question.options,
            optionImageUrls: question.optionImageUrls,
            correctAnswer: question.correctAnswer,
            userAnswer: question.userAnswer,
            explanation: question.explanation,
          };

          const originalIndex = enrichedResults.findIndex(q => q.questionId === question.questionId);
          const questionNumber = originalIndex >= 0 ? originalIndex + 1 : idx + 1;
          const isSkipped = question.userAnswer === -1 || question.userAnswer == null;

          return (
            <div
              key={question.questionId}
              ref={el => {
                if (el) questionDivRefs.current.set(question.questionId, el);
                else questionDivRefs.current.delete(question.questionId);
              }}
              className={`rounded-xl border p-4 ${
                isSkipped
                  ? theme === 'dark' ? 'border-slate-600 bg-slate-800/40' : 'border-slate-200 bg-slate-50/60'
                  : question.isCorrect
                  ? theme === 'dark' ? 'border-green-700/50 bg-green-900/10' : 'border-green-200 bg-green-50/50'
                  : theme === 'dark' ? 'border-red-700/50 bg-red-900/10' : 'border-red-200 bg-red-50/50'
              }`}
            >
              {/* Status badge */}
              <div className="flex items-center gap-2 mb-3">
                {isSkipped ? (
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${theme === 'dark' ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                    — Skipped
                  </span>
                ) : question.isCorrect ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.17l6.879-6.879a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                    Correct
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                    Wrong
                  </span>
                )}
              </div>
              <MCQQuestion
                question={questionData}
                questionNumber={questionNumber}
                selectedAnswer={question.userAnswer}
                onAnswerSelect={() => {}}
                disabled={true}
                showResult={true}
              />
            </div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={goToPreviousGroup}
          disabled={isFirstGroup}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-colors
            ${isFirstGroup
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }
          `}
        >
          ← {moduleName === 'Listening' ? 'Previous Audio' : 'Previous Question'}
        </button>

        <button
          onClick={goToNextGroup}
          disabled={isLastGroup}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-colors
            ${isLastGroup
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }
          `}
        >
          {moduleName === 'Listening' ? 'Next Audio' : 'Next Question'} →
        </button>
      </div>
    </div>
  );
};
