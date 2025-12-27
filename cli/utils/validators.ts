/**
 * Input validation utilities for CLI
 */

/**
 * Validate task ID format
 */
export function validateTaskId(taskId: string, type: 'reading' | 'listening' | 'oral'): boolean {
  if (!taskId || typeof taskId !== 'string') {
    return false;
  }

  switch (type) {
    case 'reading':
      return /^reading_\d+$/.test(taskId);
    case 'listening':
      return /^listening_\d+$/.test(taskId);
    case 'oral':
      return /^oral(A|B)_\d+$/.test(taskId);
    default:
      return false;
  }
}

/**
 * Validate time limit (must be positive number)
 */
export function validateTimeLimit(timeLimit: number): boolean {
  return typeof timeLimit === 'number' && timeLimit > 0;
}

/**
 * Validate question structure
 */
export function validateQuestionStructure(question: {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}): { valid: boolean; error?: string } {
  if (!question.question || typeof question.question !== 'string' || question.question.trim() === '') {
    return { valid: false, error: 'Question text is required' };
  }

  if (!Array.isArray(question.options) || question.options.length !== 4) {
    return { valid: false, error: 'Question must have exactly 4 options' };
  }

  if (question.options.some(opt => !opt || typeof opt !== 'string' || opt.trim() === '')) {
    return { valid: false, error: 'All options must be non-empty strings' };
  }

  if (typeof question.correctAnswer !== 'number' || question.correctAnswer < 0 || question.correctAnswer > 3) {
    return { valid: false, error: 'Correct answer must be a number between 0 and 3' };
  }

  if (!question.explanation || typeof question.explanation !== 'string' || question.explanation.trim() === '') {
    return { valid: false, error: 'Explanation is required' };
  }

  return { valid: true };
}

/**
 * Validate TEF section format (A-G)
 */
export function validateTEFSections(sections: string): boolean {
  const validSections = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const sectionsArray = sections.split(',').map(s => s.trim().toUpperCase());
  return sectionsArray.every(s => validSections.includes(s));
}

/**
 * Validate mock exam task references
 */
export function validateMockExamReferences(references: {
  oralA: string;
  oralB: string;
  reading: string;
  listening: string;
}): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!validateTaskId(references.oralA, 'oral')) {
    errors.push(`Invalid oralA task ID: ${references.oralA}`);
  }

  if (!validateTaskId(references.oralB, 'oral')) {
    errors.push(`Invalid oralB task ID: ${references.oralB}`);
  }

  if (!validateTaskId(references.reading, 'reading')) {
    errors.push(`Invalid reading task ID: ${references.reading}`);
  }

  if (!validateTaskId(references.listening, 'listening')) {
    errors.push(`Invalid listening task ID: ${references.listening}`);
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
