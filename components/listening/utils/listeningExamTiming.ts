/**
 * Timing utilities for listening comprehension exam
 * Handles timing requirements for different question ranges
 */

/**
 * Timing requirements:
 * Questions 23-30 (2 questions per audio): 20 seconds before, 20 seconds after
 * All other questions (1 question per audio): 10 seconds before, 10 seconds after
 */
export function getTimingForQuestion(questionNumber: number): { readingTime: number; answerTime: number } {
  // Question numbers are 1-indexed
  if (questionNumber >= 23 && questionNumber <= 30) {
    return { readingTime: 20, answerTime: 20 };
  }
  return { readingTime: 10, answerTime: 10 };
}
