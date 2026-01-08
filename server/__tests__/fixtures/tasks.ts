/**
 * Task test fixtures
 */

export const testReadingTasks = [
  {
    taskId: 'reading_1',
    type: 'reading',
    prompt: 'Read the following passage',
    content: 'This is a test reading passage with content.',
    timeLimitSec: 3600,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    taskId: 'reading_2',
    type: 'reading',
    prompt: 'Read another passage',
    content: 'Another test reading passage.',
    timeLimitSec: 3600,
    isActive: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];

export const testListeningTasks = [
  {
    taskId: 'listening_1',
    type: 'listening',
    prompt: 'Listen to the audio',
    audioUrl: '/test/audio1.wav',
    timeLimitSec: 2400,
    isActive: true,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    taskId: 'listening_2',
    type: 'listening',
    prompt: 'Listen to another audio',
    audioUrl: '/test/audio2.wav',
    timeLimitSec: 2400,
    isActive: true,
    createdAt: '2024-01-02T00:00:00.000Z',
    updatedAt: '2024-01-02T00:00:00.000Z',
  },
];
