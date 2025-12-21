
export type TEFSection = 'OralComprehension' | 'WrittenComprehension' | 'OralExpression' | 'WrittenExpression';

export interface Question {
  id: string;
  type: 'multiple-choice';
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
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
}

export interface UserProfile extends MongoDocument {
  firstName: string;
  email: string;
  targetLevel: string;
  totalSessions: number;
  streakDays: number;
  averageScore: string;
}
