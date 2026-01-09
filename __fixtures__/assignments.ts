import type { Assignment } from '../types';

export const sampleReadingAssignment: Partial<Assignment> = {
  assignmentId: 'assignment_1',
  type: 'reading',
  title: 'La culture québécoise',
  prompt: 'Lisez le texte suivant sur la culture québécoise et répondez aux questions.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user_prof_123',
  settings: {
    numberOfQuestions: 10,
    timeLimitMinutes: 30,
    difficulty: 'intermediate',
  },
  status: 'active',
  taskId: 'task_reading_1',
};

export const sampleListeningAssignment: Partial<Assignment> = {
  assignmentId: 'assignment_2',
  type: 'listening',
  title: 'Interview avec un immigrant',
  prompt: 'Écoutez l\'interview suivante et répondez aux questions.',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  createdBy: 'user_prof_123',
  settings: {
    numberOfQuestions: 8,
    timeLimitMinutes: 20,
    audioReplayLimit: 2,
  },
  status: 'active',
  taskId: 'task_listening_1',
};

export const sampleAssignmentList: Partial<Assignment>[] = [
  sampleReadingAssignment,
  sampleListeningAssignment,
  {
    assignmentId: 'assignment_3',
    type: 'reading',
    title: 'Le système de santé canadien',
    prompt: 'Analysez le texte sur le système de santé.',
    createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    createdBy: 'user_prof_123',
    settings: {
      numberOfQuestions: 12,
      timeLimitMinutes: 35,
    },
    status: 'draft',
  },
  {
    assignmentId: 'assignment_4',
    type: 'listening',
    title: 'Bulletin météo',
    prompt: 'Écoutez le bulletin météo et notez les informations.',
    createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
    updatedAt: new Date(Date.now() - 172800000).toISOString(),
    createdBy: 'user_prof_123',
    settings: {
      numberOfQuestions: 6,
      timeLimitMinutes: 15,
    },
    status: 'completed',
  },
];
