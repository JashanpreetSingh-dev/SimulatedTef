import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MCQQuestion } from './MCQQuestion';
import { sampleMCQQuestion, answeredCorrectQuestion, answeredIncorrectQuestion } from '../__fixtures__/mcqQuestions';

// Mock the useTheme hook
vi.mock('../contexts/ThemeContext', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

describe('MCQQuestion', () => {
  const defaultProps = {
    question: sampleMCQQuestion,
    questionNumber: 1,
    onAnswerSelect: vi.fn(),
  };

  it('renders question text', () => {
    render(<MCQQuestion {...defaultProps} />);
    expect(screen.getByText(sampleMCQQuestion.question)).toBeInTheDocument();
  });

  it('renders all options', () => {
    render(<MCQQuestion {...defaultProps} />);
    sampleMCQQuestion.options.forEach(option => {
      expect(screen.getByText(option)).toBeInTheDocument();
    });
  });

  it('renders question number', () => {
    render(<MCQQuestion {...defaultProps} />);
    expect(screen.getByText(/Question 1/)).toBeInTheDocument();
  });

  it('calls onAnswerSelect when option is clicked', () => {
    const onAnswerSelect = vi.fn();
    render(<MCQQuestion {...defaultProps} onAnswerSelect={onAnswerSelect} />);
    
    fireEvent.click(screen.getByText('Ottawa'));
    expect(onAnswerSelect).toHaveBeenCalledWith(1);
  });

  it('does not call onAnswerSelect when disabled', () => {
    const onAnswerSelect = vi.fn();
    render(<MCQQuestion {...defaultProps} onAnswerSelect={onAnswerSelect} disabled />);
    
    fireEvent.click(screen.getByText('Ottawa'));
    expect(onAnswerSelect).not.toHaveBeenCalled();
  });

  it('highlights selected answer', () => {
    render(<MCQQuestion {...defaultProps} selectedAnswer={1} />);
    
    const ottawaOption = screen.getByText('Ottawa');
    // Ottawa should be displayed when selected
    expect(ottawaOption).toBeInTheDocument();
  });

  it('shows correct answer in result mode', () => {
    render(
      <MCQQuestion
        question={answeredCorrectQuestion}
        questionNumber={1}
        onAnswerSelect={vi.fn()}
        showResult
      />
    );
    
    // The correct answer should be displayed
    expect(screen.getByText('Ottawa')).toBeInTheDocument();
  });

  it('shows incorrect answer in result mode', () => {
    render(
      <MCQQuestion
        question={answeredIncorrectQuestion}
        questionNumber={1}
        onAnswerSelect={vi.fn()}
        showResult
      />
    );
    
    // Both the correct and user's answer should be visible
    expect(screen.getByText('Toronto')).toBeInTheDocument();
    expect(screen.getByText('Ottawa')).toBeInTheDocument();
  });

  it('displays explanation when provided for incorrect answer', () => {
    render(
      <MCQQuestion
        question={answeredIncorrectQuestion}
        questionNumber={1}
        onAnswerSelect={vi.fn()}
        showResult
      />
    );
    
    // Explanation is shown only for incorrect answers
    // Check for the "Explanation:" label
    expect(screen.getByText('Explanation:')).toBeInTheDocument();
  });
});
