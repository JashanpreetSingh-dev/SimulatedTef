import React, { useState } from 'react';
import { useTheme } from '../contexts/ThemeContext';
import { MCQResult } from '../types';
import { MCQQuestion, MCQQuestionData } from './MCQQuestion';

interface QuestionResultsViewProps {
  result: MCQResult;
  moduleName: 'Reading' | 'Listening';
  className?: string;
}


export const QuestionResultsView: React.FC<QuestionResultsViewProps> = ({
  result,
  moduleName,
  className = '',
}) => {
  const { theme } = useTheme();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Navigation functions
  const goToNextQuestion = () => {
    if (currentQuestionIndex < questionsToShow.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  // Show all questions (like exam interface)
  const questionsToShow = result.questionResults;

  const isFirstQuestion = currentQuestionIndex === 0;
  const isLastQuestion = currentQuestionIndex === questionsToShow.length - 1;


  const correctCount = result.questionResults.filter(q => q.isCorrect).length;
  const incorrectCount = result.questionResults.filter(q => !q.isCorrect).length;

  const currentQuestion = questionsToShow[currentQuestionIndex];

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
              Question {currentQuestionIndex + 1} of {questionsToShow.length}
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
