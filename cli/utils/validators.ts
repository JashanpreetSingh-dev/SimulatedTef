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

/**
 * Validate listening question structure (audio_items format)
 */
export function validateListeningQuestionStructure(data: {
  section?: string;
  audio_items?: Array<{
    audio_id?: string;
    section_id?: number;
    repeatable?: boolean;
    audio_script?: string;
    questions?: Array<{
      question_id?: number;
      question?: string;
      options?: { A?: string; B?: string; C?: string; D?: string };
      correct_answer?: string;
    }>;
  }>;
}): { valid: boolean; error?: string } {
  if (!data.audio_items || !Array.isArray(data.audio_items)) {
    return { valid: false, error: 'Missing or invalid audio_items array' };
  }

  let totalQuestions = 0;
  const sectionCounts: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0 };

  for (const item of data.audio_items) {
    if (!item.audio_id || typeof item.audio_id !== 'string') {
      return { valid: false, error: 'Audio item missing or invalid audio_id' };
    }

    if (!item.section_id || typeof item.section_id !== 'number' || item.section_id < 1 || item.section_id > 4) {
      return { valid: false, error: `Audio item ${item.audio_id} has invalid section_id (must be 1-4)` };
    }

    if (typeof item.repeatable !== 'boolean') {
      return { valid: false, error: `Audio item ${item.audio_id} missing or invalid repeatable field` };
    }

    if (!item.audio_script || typeof item.audio_script !== 'string' || item.audio_script.trim() === '') {
      return { valid: false, error: `Audio item ${item.audio_id} missing or invalid audio_script` };
    }

    if (!item.questions || !Array.isArray(item.questions)) {
      return { valid: false, error: `Audio item ${item.audio_id} missing or invalid questions array` };
    }

    for (const q of item.questions) {
      if (typeof q.question_id !== 'number' || q.question_id < 1 || q.question_id > 40) {
        return { valid: false, error: `Question has invalid question_id (must be 1-40)` };
      }

      if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
        return { valid: false, error: `Question ${q.question_id} missing or invalid question text` };
      }

      if (!q.options || typeof q.options !== 'object') {
        return { valid: false, error: `Question ${q.question_id} missing or invalid options` };
      }

      if (!q.options.A || !q.options.B || !q.options.C || !q.options.D) {
        return { valid: false, error: `Question ${q.question_id} missing one or more options (A, B, C, D)` };
      }

      if (!q.correct_answer || !['A', 'B', 'C', 'D'].includes(q.correct_answer)) {
        return { valid: false, error: `Question ${q.question_id} missing or invalid correct_answer (must be A, B, C, or D)` };
      }

      totalQuestions++;
      sectionCounts[item.section_id]++;
    }
  }

  if (totalQuestions !== 40) {
    return { valid: false, error: `Expected 40 questions total, got ${totalQuestions}` };
  }

  if (sectionCounts[1] !== 4) {
    return { valid: false, error: `Section 1 should have 4 questions, got ${sectionCounts[1]}` };
  }

  if (sectionCounts[2] !== 6) {
    return { valid: false, error: `Section 2 should have 6 questions, got ${sectionCounts[2]}` };
  }

  if (sectionCounts[3] !== 10) {
    return { valid: false, error: `Section 3 should have 10 questions, got ${sectionCounts[3]}` };
  }

  if (sectionCounts[4] !== 20) {
    return { valid: false, error: `Section 4 should have 20 questions, got ${sectionCounts[4]}` };
  }

  return { valid: true };
}