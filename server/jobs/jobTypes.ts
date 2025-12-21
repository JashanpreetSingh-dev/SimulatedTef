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
}

export interface EvaluationJobResult {
  resultId: string;
  success: boolean;
  error?: string;
}

