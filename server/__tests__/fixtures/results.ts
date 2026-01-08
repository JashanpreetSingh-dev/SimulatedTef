/**
 * Result test fixtures
 */

import { SavedResult } from '../../../types';

export const testResults: SavedResult[] = [
  {
    resultId: 'result_1',
    userId: 'user_1',
    section: 'OralExpression',
    score: 75,
    clbLevel: 'CLB 7',
    cecrLevel: 'B2',
    feedback: 'Good performance',
    strengths: ['Good vocabulary'],
    weaknesses: ['Grammar needs improvement'],
    timestamp: '2024-01-01T00:00:00.000Z',
    resultType: 'practice',
  },
  {
    resultId: 'result_2',
    userId: 'user_1',
    section: 'WrittenExpression',
    score: 80,
    clbLevel: 'CLB 8',
    cecrLevel: 'B2',
    feedback: 'Excellent writing',
    strengths: ['Clear structure', 'Good vocabulary'],
    weaknesses: [],
    timestamp: '2024-01-02T00:00:00.000Z',
    resultType: 'mockExam',
    mockExamId: 'mock_exam_1',
  },
  {
    resultId: 'result_3',
    userId: 'user_2',
    section: 'ReadingComprehension',
    score: 65,
    clbLevel: 'CLB 6',
    cecrLevel: 'B1',
    feedback: 'Needs improvement',
    strengths: [],
    weaknesses: ['Reading comprehension'],
    timestamp: '2024-01-03T00:00:00.000Z',
    resultType: 'assignment',
    assignmentId: 'assignment_1',
  },
];
