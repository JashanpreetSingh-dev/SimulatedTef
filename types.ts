
export type TEFSection = 'OralComprehension' | 'WrittenComprehension' | 'OralExpression' | 'WrittenExpression';

export interface Question {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

// Reading/Listening Question (stored in MongoDB)
export interface ReadingListeningQuestion {
  questionId: string; // Unique question identifier (e.g., "reading_1_q1")
  taskId: string; // Foreign key to task (references task.taskId)
  type: 'reading' | 'listening'; // Question type (only for MCQ questions)
  questionNumber: number; // Question number within task (1-40)
  question: string; // Question text
  questionText?: string; // Optional: Question-specific text/passage (for reading questions that reference specific parts)
  options: string[]; // Array of exactly 4 answer options
  correctAnswer: number; // Index 0-3 indicating correct option
  explanation: string; // Explanation of why the correct answer is right
  audioId?: string; // Optional: Reference to AudioItem for listening questions
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TEFTask {
  id: number;
  section: string;
  prompt: string;
  title?: string | null;
  image: string;
  time_limit_sec: number;
  difficulty: string;
  suggested_questions?: string[];
  counter_arguments?: string[];
}

export interface WrittenTask {
  id: string;
  section: 'A' | 'B';
  subject: string;
  instruction: string;
  minWords: number;
  modelAnswer?: string; // Model answer from knowledge base
}

export interface ExamScenario {
  id: string;
  title: string;
  section: TEFSection;
  content: string; 
  audioUrl?: string; 
  questions?: Question[];
  tasks?: string[]; 
  officialTasks?: {
    partA: TEFTask;
    partB: TEFTask;
  };
}

// Reading Task (stored in MongoDB)
export interface ReadingTask {
  taskId: string; // Unique identifier
  type: 'reading';
  prompt: string; // Main instruction/prompt
  content: string; // Reading passage text
  timeLimitSec: number; // Time limit in seconds, typically 3600 for 60 minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Listening Task (stored in MongoDB)
export interface ListeningTask {
  taskId: string; // Unique identifier
  type: 'listening';
  prompt: string; // Main instruction/prompt
  audioUrl: string; // Audio file path
  timeLimitSec: number; // Time limit in seconds, typically 2400 for 40 minutes
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Base Task interface (unified for all types)
export interface Task {
  taskId: string; // Unique identifier
  type: 'oralA' | 'oralB' | 'reading' | 'listening';
  prompt: string; // Main instruction/prompt
  timeLimitSec: number;
  
  // Type-specific content (only one will be populated based on type)
  image?: string; // For oralA/oralB - image path
  content?: string; // For reading - passage text
  audioUrl?: string; // For listening - audio file path
  
  // Type-specific data
  suggested_questions?: string[]; // For oralA only
  counter_arguments?: string[]; // For oralB only
  
  // Metadata
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Normalized question result entry (stored in database)
export interface NormalizedQuestionResult {
  questionId: string;
  userAnswer: number; // Selected answer index (-1 if not answered)
  isCorrect: boolean;
}

// MCQ Result with question-by-question breakdown
export interface MCQResult {
  taskId: string;
  answers: number[]; // User's selected answers (40 answers for Reading/Listening)
  score: number; // Score out of 40 (number of correct answers)
  totalQuestions: number; // Always 40 for Reading/Listening
  questionResults: Array<NormalizedQuestionResult>; // Normalized question results (only questionId, userAnswer, isCorrect)
}

export interface UpgradedSentence {
  weak: string;
  better: string;
  why: string;
}

export interface EvaluationResult {
  score: number;           // Overall TEF score (0-699) - Full TEF scoring scale
  clbLevel: string;        // Canadian Language Benchmark - single level only (e.g., "CLB 7", "CLB 5") - NO RANGES
  cecrLevel: string;       // CECR level - single level only (A1, A2, B1, B2, C1, or C2) - NO RANGES
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  grammarNotes: string;
  vocabularyNotes: string;
  // Enhanced fields
  overall_comment?: string;
  criteria?: Record<string, any>;  // Individual criterion scores (0-10 each) for detailed breakdown
  top_improvements?: string[];
  upgraded_sentences?: UpgradedSentence[];
  model_answer?: string;
  // Written Expression specific - structured by section
  model_answer_sectionA?: string;  // Model answer for Section A (fait divers)
  model_answer_sectionB?: string;   // Model answer for Section B (argumentation)
  corrections_sectionA?: UpgradedSentence[];  // Corrections for Section A
  corrections_sectionB?: UpgradedSentence[];  // Corrections for Section B
}

export interface UserResponse {
  scenarioId: string;
  section: TEFSection;
  textResponse?: string;
  audioBlob?: Blob;
  mcqAnswers?: number[];
}

// MongoDB Specific Types
export interface MongoDocument {
  _id?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

// Task reference types (imported from types/task.ts)
import type { TaskReference, TaskType, NormalizedTask } from './types/task';
export type { TaskReference, TaskType, NormalizedTask };

// Module-specific data structures
export interface OralExpressionData {
  type: 'oralExpression';
  // For complete exams or mock exams: both sections
  sectionA?: {
    text: string;
    result?: EvaluationResult;
  };
  sectionB?: {
    text: string;
    result?: EvaluationResult;
  };
  // For practice partA/partB: only relevant section
}

export interface WrittenExpressionData {
  type: 'writtenExpression';
  // For complete exams or mock exams: both sections
  sectionA?: {
    text: string;
    result?: EvaluationResult;
  };
  sectionB?: {
    text: string;
    result?: EvaluationResult;
  };
  // For practice partA/partB: only relevant section
}

export interface MCQData {
  type: 'mcq';
  // Full answer array for quick access
  answers: number[]; // 40 answers
  // Normalized for querying/analysis
  questionResults: Array<{
    questionId: string;
    userAnswer: number;
    isCorrect: boolean;
  }>;
  score: number; // Out of 40
  totalQuestions: number; // Always 40
}

export type ModuleData = OralExpressionData | WrittenExpressionData | MCQData;

export interface SavedResult extends MongoDocument {
  // Core identification
  resultType: 'practice' | 'mockExam' | 'assignment';
  mode: 'partA' | 'partB' | 'full';
  module: 'oralExpression' | 'writtenExpression' | 'reading' | 'listening';
  mockExamId?: string; // Only present for mockExam results
  assignmentId?: string; // Only present for assignment results
  title: string;
  timestamp: number;
  
  // Task references (normalized)
  taskReferences: {
    taskA?: TaskReference; // { taskId: string, type: 'oralA' | 'writtenA' | 'reading' }
    taskB?: TaskReference; // { taskId: string, type: 'oralB' | 'writtenB' | 'listening' }
  };
  
  // Evaluation results (unified)
  evaluation: EvaluationResult;
  
  // Module-specific data (discriminated union)
  moduleData: ModuleData;
  
  // Common optional fields
  recordingId?: string;
  transcript?: string;
  isLoading?: boolean; // Flag to indicate if evaluation is still in progress
  
  // Legacy fields (deprecated, kept for backward compatibility during transition)
  taskPartA?: TEFTask;
  taskPartB?: TEFTask;
  readingResult?: MCQResult;
  listeningResult?: MCQResult;
  oralExpressionResult?: {
    clbLevel: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
  };
  writtenExpressionResult?: {
    sectionA: {
      text: string;
      task: WrittenTask;
      result?: EvaluationResult;
    };
    sectionB: {
      text: string;
      task: WrittenTask;
      result?: EvaluationResult;
    };
  };
}

export interface UserProfile extends MongoDocument {
  firstName: string;
  email: string;
  targetLevel: string;
  totalSessions: number;
  streakDays: number;
  averageScore: string;
}

// Assignment Types
export type AssignmentStatus = 'draft' | 'published';
export type AssignmentType = 'reading' | 'listening';

export interface AssignmentSettings {
  numberOfQuestions: number; // Number of questions to generate (typically 40)
  sections?: string[]; // Optional: Specific sections to include (e.g., ['A', 'B', 'C'] for reading)
  timeLimitSec?: number; // Optional: Custom time limit (practice mode typically has no limit)
  theme?: string; // Optional: Theme for question generation
}

export interface Assignment {
  assignmentId: string; // Unique identifier
  type: AssignmentType; // 'reading' | 'listening'
  title: string; // Assignment title (can be AI-generated if not provided)
  prompt: string; // Teacher's prompt for AI generation
  settings: AssignmentSettings; // Assignment settings
  status: AssignmentStatus; // 'draft' | 'published'
  createdBy: string; // User ID of creator
  taskId?: string; // Reference to ReadingTask or ListeningTask
  questionIds?: string[]; // References to generated questions
  createdAt: string;
  updatedAt: string;
}