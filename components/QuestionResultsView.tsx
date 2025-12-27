import React, { useState, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { useAuth } from '@clerk/clerk-react';
import { MCQResult, ReadingListeningQuestion, NormalizedQuestionResult } from '../types';
import { MCQQuestion, MCQQuestionData } from './MCQQuestion';
import { getQuestionsByTaskId } from '../services/tasks';

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
}

export const QuestionResultsView: React.FC<QuestionResultsViewProps> = ({
  result,
  className = '',
}) => {
  const { theme } = useTheme();
  const { getToken } = useAuth();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<ReadingListeningQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enrichedResults, setEnrichedResults] = useState<EnrichedQuestionResult[]>([]);

  // Check if results are in old format (already have full question data)
  const isOldFormat = result.questionResults.length > 0 && isOldFormatQuestionResult(result.questionResults[0]);

  // Fetch questions if in new normalized format
  useEffect(() => {
    if (isOldFormat) {
      // Old format: convert to enriched format directly
      const enriched = result.questionResults.map(q => {
        const oldFormatQ = q as NormalizedQuestionResult & { question: string; questionText?: string; options: string[]; correctAnswer: number; explanation: string };
        return {
          questionId: oldFormatQ.questionId,
          userAnswer: oldFormatQ.userAnswer,
          isCorrect: oldFormatQ.isCorrect,
          question: oldFormatQ.question,
          questionText: oldFormatQ.questionText,
          options: oldFormatQ.options,
          correctAnswer: oldFormatQ.correctAnswer,
          explanation: oldFormatQ.explanation,
        };
      });
      setEnrichedResults(enriched);
      return;
    }

    // New format: fetch questions from API
    const fetchQuestions = async () => {
      setLoading(true);
      setError(null);
      try {
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
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setError('Failed to load question details');
      } finally {
        setLoading(false);
      }
    };

    fetchQuestions();
  }, [result.taskId, result.questionResults, isOldFormat, getToken]);

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < enrichedResults.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === enrichedResults.length - 1;


  const currentQuestion = enrichedResults[currentQuestionIndex];

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

  if (!currentQuestion) {
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

  const questionData: MCQQuestionData = {
    questionId: currentQuestion.questionId,
    question: currentQuestion.question,
    questionText: currentQuestion.questionText,
    options: currentQuestion.options,
    correctAnswer: currentQuestion.correctAnswer,
    userAnswer: currentQuestion.userAnswer,
    explanation: currentQuestion.explanation,
  };

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
              Question {currentQuestionIndex + 1} of {enrichedResults.length}
            </div>
          </div>
        </div>
      </div>

      {/* Current Question */}
      <div className="mb-8">
        <MCQQuestion
          question={questionData}
          questionNumber={currentQuestionIndex + 1}
          selectedAnswer={currentQuestion.userAnswer}
          onAnswerSelect={() => {}} // Disabled in results view
          disabled={true}
          showResult={true}
        />
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between items-center">
        <button
          onClick={goToPreviousQuestion}
          disabled={isFirstQuestion}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-colors
            ${isFirstQuestion
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }
          `}
        >
          ← Previous Question
        </button>

        <button
          onClick={goToNextQuestion}
          disabled={isLastQuestion}
          className={`
            px-6 py-3 rounded-lg font-semibold transition-colors
            ${isLastQuestion
              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
              : theme === 'dark'
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-100'
              : 'bg-slate-200 hover:bg-slate-300 text-slate-700'
            }
          `}
        >
          Next Question →
        </button>
      </div>
    </div>
  );
};
