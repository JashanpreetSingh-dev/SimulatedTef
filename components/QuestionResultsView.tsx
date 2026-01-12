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
        const oldFormatQ = q as NormalizedQuestionResult & { question: string; questionText?: string; options: string[]; correctAnswer: number; explanation: string; audioId?: string };
        return {
          questionId: oldFormatQ.questionId,
          userAnswer: oldFormatQ.userAnswer,
          isCorrect: oldFormatQ.isCorrect,
          question: oldFormatQ.question,
          questionText: oldFormatQ.questionText,
          options: oldFormatQ.options,
          correctAnswer: oldFormatQ.correctAnswer,
          explanation: oldFormatQ.explanation,
          audioId: oldFormatQ.audioId, // Include audioId if present
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
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
              audioId: question.audioId, // Include audioId for listening questions
            };
          }).filter((q): q is EnrichedQuestionResult => q !== null);

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
              correctAnswer: question.correctAnswer,
              explanation: question.explanation,
            };
          }).filter((q): q is EnrichedQuestionResult => q !== null);

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

  return (
    <div className={className}>
      {/* Header with Score and Progress */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-4">
            <div className={`
              px-3 py-1 rounded font-mono text-sm font-semibold
              ${theme === 'dark' ? 'bg-slate-700 text-slate-100' : 'bg-indigo-100 text-indigo-700'}
            `}>
              {result.score}/{result.totalQuestions}
            </div>
            <div className={`
              px-3 py-1 rounded text-sm
              ${theme === 'dark' ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-700 border border-slate-300'}
            `}>
              {moduleName === 'Listening' 
                ? `Audio ${currentAudioGroupIndex + 1} of ${audioGroups.length} (${currentAudioGroup.length} question${currentAudioGroup.length > 1 ? 's' : ''})`
                : `Question ${currentAudioGroupIndex + 1} of ${audioGroups.length}`
              }
            </div>
          </div>
        </div>
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
            correctAnswer: question.correctAnswer,
            userAnswer: question.userAnswer,
            explanation: question.explanation,
          };
          
          // Find the original question number from enrichedResults
          const originalIndex = enrichedResults.findIndex(q => q.questionId === question.questionId);
          const questionNumber = originalIndex >= 0 ? originalIndex + 1 : idx + 1;
          
          return (
            <MCQQuestion
              key={question.questionId}
              question={questionData}
              questionNumber={questionNumber}
              selectedAnswer={question.userAnswer}
              onAnswerSelect={() => {}} // Disabled in results view
              disabled={true}
              showResult={true}
            />
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
