/**
 * Job type definitions for BullMQ
 */

export interface EvaluationJobData {
  section: 'OralExpression' | 'WrittenExpression';
  prompt: string;
  /** 
   * For OralExpression: audio blob as base64 string (worker will transcribe)
   * For WrittenExpression: text content directly
   * If transcript is provided, it will be used directly (backward compatibility)
   */
  transcript?: string;
  /** OralExpression: base64 audio when client transcript is insufficient (worker transcribes + fluency). */
  audioBlob?: string;
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
   * If not provided and audioBlob is present, worker will generate this during transcription.
   */
  fluencyAnalysis?: any;
  /**
   * Mock exam metadata for tracking results within mock exams
   */
  mockExamId?: string;
  module?: 'oralExpression' | 'reading' | 'listening' | 'writtenExpression';
  /**
   * Written expression specific: section texts (for proper result storage)
   */
  writtenSectionAText?: string;
  writtenSectionBText?: string;
}

export interface EvaluationJobResult {
  resultId: string;
  success: boolean;
  error?: string;
}

export interface QuestionGenerationJobData {
  assignmentId: string;
  type: 'reading' | 'listening';
  prompt: string;
  settings: {
    numberOfQuestions: number;
    theme?: string;
    sections?: string[];
  };
  userId: string;
}

export interface QuestionGenerationJobResult {
  assignmentId: string;
  taskId: string;
  questionIds: string[];
  success: boolean;
  error?: string;
}

export type EmailTemplateKind = 'welcome' | 'subscription_congrats' | 'good_friday_promo';

export interface EmailJobData {
  templateKind: EmailTemplateKind;
  userId: string;
  email?: string;
  firstName?: string;
  tierId?: string;
  tierName?: string;
  periodStart?: string;
  periodEnd?: string;
}

export interface EmailJobResult {
  success: boolean;
  error?: string;
}
