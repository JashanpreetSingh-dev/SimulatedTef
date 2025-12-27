
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

export interface SavedResult extends EvaluationResult, MongoDocument {
  mode: string;
  title: string;
  timestamp: number;
  recordingId?: string; 
  transcript?: string;
  taskPartA?: TEFTask; // Task data for Section A
  taskPartB?: TEFTask; // Task data for Section B
  isLoading?: boolean; // Flag to indicate if evaluation is still in progress
  // Mock exam fields
  mockExamId?: string; // Unique identifier for this mock exam (e.g., "oralA_1-oralB_2-reading_3-listening_4")
  module?: 'oralExpression' | 'reading' | 'listening'; // Module this result belongs to
  readingResult?: MCQResult; // Reading module result (score out of 40)
  listeningResult?: MCQResult; // Listening module result (score out of 40)
  oralExpressionResult?: {
    clbLevel: number;
    feedback: string;
    strengths: string[];
    weaknesses: string[];
    // ... existing oral expression result structure
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
