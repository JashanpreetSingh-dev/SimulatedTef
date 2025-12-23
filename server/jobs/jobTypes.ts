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
}

export interface EvaluationJobResult {
  resultId: string;
  success: boolean;
  error?: string;
}

