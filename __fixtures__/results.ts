import type { EvaluationResult } from '../types';

export const sampleOralExpressionResult: Partial<EvaluationResult> = {
  section: 'OralExpression',
  totalScore: 285,
  maxScore: 450,
  levelAchieved: 'B2',
  fluency_analysis: {
    hesitation_rate: 'moderate',
    filler_words_per_min: 3,
    average_pause_seconds: 1.2,
    self_corrections: 2,
    fluency_comment: 'Good flow with occasional hesitations',
  },
  criteria: {
    pronunciation: {
      score: 3,
      maxScore: 5,
      comment: 'Clear pronunciation with minor accent',
    },
    vocabulary: {
      score: 4,
      maxScore: 5,
      comment: 'Rich vocabulary, appropriate register',
    },
    grammar: {
      score: 3,
      maxScore: 5,
      comment: 'Good grammar with occasional errors',
    },
    fluency: {
      score: 3,
      maxScore: 5,
      comment: 'Natural flow, some hesitations',
    },
    coherence: {
      score: 4,
      maxScore: 5,
      comment: 'Well-organized response',
    },
  },
  feedback: 'Excellent response overall. Focus on reducing hesitations and self-corrections.',
};

export const sampleWrittenExpressionResult: Partial<EvaluationResult> = {
  section: 'WrittenExpression',
  totalScore: 310,
  maxScore: 450,
  levelAchieved: 'B2',
  criteria: {
    content: {
      score: 4,
      maxScore: 5,
      comment: 'Complete and relevant response',
    },
    organization: {
      score: 4,
      maxScore: 5,
      comment: 'Clear structure with introduction and conclusion',
    },
    vocabulary: {
      score: 3,
      maxScore: 5,
      comment: 'Adequate vocabulary, some repetition',
    },
    grammar: {
      score: 4,
      maxScore: 5,
      comment: 'Good grammar with minor errors',
    },
    spelling: {
      score: 4,
      maxScore: 5,
      comment: 'Few spelling mistakes',
    },
  },
  feedback: 'Well-written response. Consider using more varied vocabulary.',
};

export const sampleReadingResult = {
  section: 'ReadingComprehension',
  totalScore: 42,
  maxScore: 50,
  correctAnswers: 42,
  totalQuestions: 50,
  levelAchieved: 'C1',
  questionResults: [
    { questionId: 'q1', correct: true, userAnswer: 1, correctAnswer: 1 },
    { questionId: 'q2', correct: true, userAnswer: 2, correctAnswer: 2 },
    { questionId: 'q3', correct: false, userAnswer: 0, correctAnswer: 3 },
  ],
};

export const sampleListeningResult = {
  section: 'ListeningComprehension',
  totalScore: 38,
  maxScore: 50,
  correctAnswers: 38,
  totalQuestions: 50,
  levelAchieved: 'B2',
  questionResults: [
    { questionId: 'lq1', correct: true, userAnswer: 2, correctAnswer: 2 },
    { questionId: 'lq2', correct: false, userAnswer: 1, correctAnswer: 0 },
  ],
};

export const sampleMockExamResults = {
  mockExamId: 'mock_exam_1',
  userId: 'user_123',
  completedAt: new Date().toISOString(),
  modules: {
    reading: sampleReadingResult,
    listening: sampleListeningResult,
    oralExpression: sampleOralExpressionResult,
    writtenExpression: sampleWrittenExpressionResult,
  },
  totalScore: 675,
  maxTotalScore: 1000,
  overallLevel: 'B2',
};
