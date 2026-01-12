import React from 'react';
import { useTheme } from '../contexts/ThemeContext';

export interface MCQQuestionData {
  questionId: string;
  question: string;
  questionText?: string; // Optional: Question-specific text/passage (for reading questions)
  options: string[];
  correctAnswer?: number; // Only provided in results view
  userAnswer?: number; // Only provided in results view
  explanation?: string; // Only provided in results view
}

interface MCQQuestionProps {
  question: MCQQuestionData;
  questionNumber: number;
  selectedAnswer?: number | null;
  onAnswerSelect: (answerIndex: number) => void;
  disabled?: boolean;
  showResult?: boolean; // Show correct/incorrect indicators
  className?: string;
}

export const MCQQuestion: React.FC<MCQQuestionProps> = ({
  question,
  questionNumber,
  selectedAnswer = null,
  onAnswerSelect,
  disabled = false,
  showResult = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const { questionId, question: questionText, questionText: questionPassage, options, correctAnswer, userAnswer, explanation } = question;

  const isCorrect = showResult && userAnswer !== undefined && correctAnswer !== undefined 
    ? userAnswer === correctAnswer 
    : null;

  const getOptionStyle = (index: number) => {
    const baseStyle = `
      p-2 rounded-lg border-2 transition-all cursor-pointer
      ${disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-opacity-70'}
    `;

    if (showResult && correctAnswer !== undefined) {
      // Results view
      if (index === correctAnswer) {
        // Correct answer - always show green
        return `${baseStyle} ${
          theme === 'dark' 
            ? 'bg-green-900/30 border-green-500 text-green-100' 
            : 'bg-green-50 border-green-500 text-green-800'
        }`;
      } else if (index === userAnswer && userAnswer !== correctAnswer) {
        // User's incorrect answer - show red
        return `${baseStyle} ${
          theme === 'dark' 
            ? 'bg-red-900/30 border-red-500 text-red-100' 
            : 'bg-red-50 border-red-500 text-red-800'
        }`;
      } else {
        // Other options
        return `${baseStyle} ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-600 text-slate-300' 
            : 'bg-white border-slate-300 text-slate-700'
        }`;
      }
    } else {
      // Exam view
      if (selectedAnswer === index) {
        // Selected option
        return `${baseStyle} ${
          theme === 'dark' 
            ? 'bg-indigo-900/50 border-indigo-400 text-indigo-100' 
            : 'bg-indigo-50 border-indigo-500 text-indigo-800'
        }`;
      } else {
        // Unselected option
        return `${baseStyle} ${
          theme === 'dark' 
            ? 'bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-500' 
            : 'bg-white border-slate-300 text-slate-700 hover:border-indigo-300'
        }`;
      }
    }
  };

  const getOptionLabel = (index: number) => {
    const labels = ['A', 'B', 'C', 'D'];
    return labels[index];
  };

  return (
    <div className={`mcq-question ${className}`}>
      <div className="mb-4">
        <h3 className={`
          text-lg font-semibold mb-2
          ${theme === 'dark' ? 'text-slate-100' : 'text-slate-800'}
        `}>
          Question {questionNumber}
        </h3>
        {questionPassage && (
          <div className={`
            mb-4 p-4 rounded-lg border
            ${theme === 'dark' ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}
          `}>
            <p className={`
              text-sm italic mb-2 font-semibold
              ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
            `}>
              Texte de référence:
            </p>
            <p className={`
              text-sm leading-relaxed
              ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}
            `}>
              {questionPassage}
            </p>
          </div>
        )}
        <p className={`
          text-base mb-4
          ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}
        `}>
          {questionText}
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {options.map((option, index) => (
          <div key={index} className="relative min-h-[80px] flex">
            <button
              type="button"
              onClick={() => !disabled && onAnswerSelect(index)}
              disabled={disabled}
              className={`${getOptionStyle(index)} w-full h-full flex items-start`}
            >
              <div className="flex items-start gap-2">
                {/* Option Label */}
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center font-semibold text-xs
                  ${showResult && index === correctAnswer
                    ? theme === 'dark' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-green-500 text-white'
                    : showResult && index === userAnswer && userAnswer !== correctAnswer
                    ? theme === 'dark'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-500 text-white'
                    : selectedAnswer === index
                    ? theme === 'dark'
                      ? 'bg-indigo-500 text-white'
                      : 'bg-indigo-500 text-white'
                    : theme === 'dark'
                    ? 'bg-slate-700 text-slate-300'
                    : 'bg-slate-200 text-slate-700'
                  }
                `}>
                  {getOptionLabel(index)}
                </div>

                {/* Option Text */}
                <div className="flex-1 text-left">
                  {option}
                </div>

                {/* Result Indicator */}
                {showResult && index === correctAnswer && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-green-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  </div>
                )}
                {showResult && index === userAnswer && userAnswer !== correctAnswer && (
                  <div className="flex-shrink-0">
                    <svg className="w-6 h-6 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </div>
                )}
              </div>
            </button>
          </div>
        ))}
      </div>

      {/* Explanation (shown in results view for incorrect answers or when toggled) */}
      {showResult && explanation && isCorrect === false && (
        <div className={`
          mt-4 p-4 rounded-lg
          ${theme === 'dark' 
            ? 'bg-slate-800/50 border border-slate-700' 
            : 'bg-slate-50 border border-slate-200'
          }
        `}>
          <p className={`
            text-sm font-semibold mb-2
            ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}
          `}>
            Explanation:
          </p>
          <p className={`
            text-sm
            ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}
          `}>
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
};
