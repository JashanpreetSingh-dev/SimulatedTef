/**
 * Question model - stores MCQ questions for Reading/Listening tasks
 */

import { z } from 'zod';
import { ReadingListeningQuestion } from '../../types';

// Zod schema for Question validation
export const QuestionSchema = z.object({
  questionId: z.string().min(1),
  taskId: z.string().min(1),
  type: z.enum(['reading', 'listening']),
  questionNumber: z.number().int().min(1).max(40),
  question: z.string().min(1),
  questionText: z.string().optional(), // Optional: Question-specific text/passage
  options: z.array(z.string()).length(4), // Must have exactly 4 options
  correctAnswer: z.number().int().min(0).max(3), // Must be 0, 1, 2, or 3
  explanation: z.string().min(1), // Required explanation
  audioId: z.string().optional(), // Optional: Reference to AudioItem for listening questions
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type QuestionDocument = z.infer<typeof QuestionSchema> & {
  _id?: string;
};

/**
 * Validate Question data
 */
export function validateQuestion(data: unknown): QuestionDocument {
  return QuestionSchema.parse(data);
}

/**
 * Create a new Question
 */
export function createQuestion(
  questionId: string,
  taskId: string,
  type: 'reading' | 'listening',
  questionNumber: number,
  question: string,
  options: string[],
  correctAnswer: number,
  explanation: string,
  isActive: boolean = true,
  questionText?: string, // Optional: Question-specific text/passage
  audioId?: string // Optional: Reference to AudioItem for listening questions
): ReadingListeningQuestion {
  // Validate options array has exactly 4 items
  if (options.length !== 4) {
    throw new Error(`Question must have exactly 4 options, got ${options.length}`);
  }
  
  // Validate correctAnswer is 0-3
  if (correctAnswer < 0 || correctAnswer > 3) {
    throw new Error(`correctAnswer must be between 0 and 3, got ${correctAnswer}`);
  }
  
  // Validate questionNumber is 1-40
  if (questionNumber < 1 || questionNumber > 40) {
    throw new Error(`questionNumber must be between 1 and 40, got ${questionNumber}`);
  }
  
  const now = new Date().toISOString();
  return {
    questionId,
    taskId,
    type,
    questionNumber,
    question,
    questionText,
    options,
    correctAnswer,
    explanation,
    audioId,
    isActive,
    createdAt: now,
    updatedAt: now,
  };
}
