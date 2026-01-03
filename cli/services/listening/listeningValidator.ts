/**
 * Validation logic for listening question generation
 * Handles question count validation and retry logic
 */

/**
 * Validate that the AI response contains the expected number of questions
 */
export function validateQuestionCount(
  parsed: any,
  targetQuestionCount: number
): { valid: boolean; totalQuestions: number; error?: string } {
  let totalQuestions = 0;
  parsed.audio_items.forEach((item: any) => {
    if (item.questions && Array.isArray(item.questions)) {
      totalQuestions += item.questions.length;
    }
  });

  if (totalQuestions !== targetQuestionCount) {
    return {
      valid: false,
      totalQuestions,
      error: `Expected ${targetQuestionCount} questions total, got ${totalQuestions}`
    };
  }

  return {
    valid: true,
    totalQuestions
  };
}

/**
 * Validate generated listening questions structure
 */
export function validateGeneratedListeningQuestions(
  audioItems: any[],
  questions: any[]
): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (questions.length === 0) {
    errors.push('No questions generated');
    return { valid: false, errors };
  }

  if (questions.length !== 40) {
    errors.push(`Expected 40 questions, got ${questions.length}`);
  }

  // Check section distribution
  const sectionCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };
  audioItems.forEach(item => {
    const itemQuestions = questions.filter((q: any) => q.audioId === item.audioId);
    sectionCounts[item.sectionId] += itemQuestions.length;
  });

  if (sectionCounts[1] !== 4) {
    errors.push(`Section 1 should have 4 questions, got ${sectionCounts[1]}`);
  }
  if (sectionCounts[2] !== 6) {
    errors.push(`Section 2 should have 6 questions, got ${sectionCounts[2]}`);
  }
  if (sectionCounts[3] !== 10) {
    errors.push(`Section 3 should have 10 questions, got ${sectionCounts[3]}`);
  }
  if (sectionCounts[4] !== 20) {
    errors.push(`Section 4 should have 20 questions, got ${sectionCounts[4]}`);
  }

  // Check for duplicate question numbers
  const questionNumbers = questions.map((q: any) => q.questionNumber);
  const duplicates = questionNumbers.filter((num: number, index: number) => questionNumbers.indexOf(num) !== index);
  if (duplicates.length > 0) {
    errors.push(`Duplicate question numbers found: ${duplicates.join(', ')}`);
  }

  // Validate each question
  questions.forEach((q: any, index: number) => {
    if (q.options.length !== 4) {
      errors.push(`Question ${index + 1}: Must have exactly 4 options, got ${q.options.length}`);
    }
    if (q.correctAnswer < 0 || q.correctAnswer > 3) {
      errors.push(`Question ${index + 1}: Correct answer must be 0-3, got ${q.correctAnswer}`);
    }
    if (!q.explanation || q.explanation.trim() === '') {
      errors.push(`Question ${index + 1}: Missing explanation`);
    }
    if (!q.audioId) {
      errors.push(`Question ${index + 1}: Missing audioId reference`);
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}
