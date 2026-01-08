/**
 * Assignment test fixtures
 */

import { Assignment } from '../../../types';

export const testAssignments: Assignment[] = [
  {
    assignmentId: 'assignment_1',
    type: 'reading',
    title: 'Reading Assignment 1',
    prompt: 'Read the following passage and answer questions',
    settings: {
      numberOfQuestions: 10,
      sections: ['section1'],
      timeLimitSec: 3600,
    },
    status: 'draft',
    createdBy: 'user_1',
    creatorName: 'User One',
    orgId: 'org_1',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    assignmentId: 'assignment_2',
    type: 'listening',
    title: 'Listening Assignment 1',
    prompt: 'Listen to the audio and answer questions',
    settings: {
      numberOfQuestions: 20,
      sections: ['section1', 'section2'],
      timeLimitSec: 2400,
    },
    status: 'published',
    createdBy: 'user_1',
    creatorName: 'User One',
    orgId: 'org_1',
    taskId: 'listening_1',
    questionIds: ['q1', 'q2', 'q3'],
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];
