/**
 * Job type definitions for BullMQ
 */

export interface EvaluationJobData {
  section: 'OralExpression' | 'WrittenExpression';
  prompt: string;
  transcript: string;
  scenarioId: number;
  timeLimitSec: number;
  questionCount?: number;
  userId: string;
  recordingId?: string;
  mode: string;
  title: string;
  taskPartA?: any;
  taskPartB?: any;
  /**
   * EO2-specific: remaining seconds on the timer at the moment the exam ended (client-side view).
   * Undefined for non-EO2 runs or when not provided.
   */
  eo2RemainingSeconds?: number;
  /**
   * Optional fluency metrics derived from the saved audio (hesitations, fillers, pauses, etc.).
   * Passed through to the evaluation model as extra context for fluency/interaction scoring.
   */
  fluencyAnalysis?: any;
  /**
   * Mock exam metadata for tracking results within mock exams
   */
  mockExamId?: string;
  module?: 'oralExpression' | 'reading' | 'listening';
}

export interface EvaluationJobResult {
  resultId: string;
  success: boolean;
  error?: string;
}

