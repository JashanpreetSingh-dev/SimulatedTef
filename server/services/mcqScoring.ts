/**
 * MCQ Scoring Service - calculates scores for Reading/Listening MCQ questions
 */

import { MCQResult, ReadingListeningQuestion } from '../../types';

export interface ScoringInput {
  taskId: string;
  questions: ReadingListeningQuestion[]; // All 40 questions for the task
  answers: number[]; // User's selected answers (array of indices 0-3)
}

export interface ScoringResult extends MCQResult {
  // Already includes all MCQResult fields
}

/**
 * Calculate MCQ score and build question-by-question results
 * 
 * @param input - Scoring input with taskId, questions, and user answers
 * @returns MCQResult with score, questionResults array, and all question details
 */
export function calculateMCQScore(input: ScoringInput): ScoringResult {
  const { taskId, questions, answers } = input;
  
  // Validate inputs - support variable number of questions (not just 40)
  if (questions.length === 0) {
    throw new Error(`Expected at least 1 question, got ${questions.length}`);
  }
  
  if (answers.length > questions.length) {
    throw new Error(`Expected at most ${questions.length} answers, got ${answers.length}`);
  }
  
  // Sort questions by questionNumber to ensure correct order
  const sortedQuestions = [...questions].sort((a, b) => a.questionNumber - b.questionNumber);
  
  // Build normalized questionResults array (only store questionId, userAnswer, isCorrect)
  const questionResults = sortedQuestions.map((question, index) => {
    const userAnswer = index < answers.length ? answers[index] : -1; // -1 means not answered
    const correctAnswer = question.correctAnswer;
    const isCorrect = userAnswer === correctAnswer;
    
    return {
      questionId: question.questionId,
      userAnswer,
      isCorrect,
    };
  });
  
  // Calculate score (only count answered questions)
  const answeredQuestions = questionResults.filter(q => q.userAnswer !== -1);
  const score = answeredQuestions.filter(q => q.isCorrect).length;
  const totalQuestions = questions.length;
  
  // Pad answers array to match questions length if needed
  const paddedAnswers = answers.length === totalQuestions 
    ? answers 
    : [...answers, ...Array(totalQuestions - answers.length).fill(-1)];
  
  return {
    taskId,
    answers: paddedAnswers,
    score,
    totalQuestions,
    questionResults,
  };
}

/**
 * Validate answer array format
 */
export function validateAnswers(answers: number[], expectedCount: number = 40): boolean {
  if (answers.length > expectedCount) {
    return false;
  }
  
  // All answers must be valid indices (0-3) or -1 (not answered)
  return answers.every(answer => answer >= -1 && answer <= 3);
}
