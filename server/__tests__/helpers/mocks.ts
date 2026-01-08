/**
 * Mock implementations for external services
 */

import { vi } from 'vitest';

/**
 * Mock S3 Service
 */
export const mockS3Service = {
  uploadAudio: vi.fn().mockResolvedValue('test-audio-key.wav'),
  getAudioUrl: vi.fn().mockResolvedValue('https://test-bucket.s3.amazonaws.com/test-audio-key.wav'),
  deleteAudio: vi.fn().mockResolvedValue(undefined),
  isS3Configured: vi.fn().mockReturnValue(true),
};

/**
 * Mock Gemini AI Service
 */
export const mockGeminiService = {
  evaluate: vi.fn().mockResolvedValue({
    score: 75,
    clbLevel: 'CLB 7',
    cecrLevel: 'B2',
    feedback: 'Test feedback',
    strengths: ['Good vocabulary'],
    weaknesses: ['Grammar needs improvement'],
    grammarNotes: 'Test grammar notes',
    vocabularyNotes: 'Test vocabulary notes',
  }),
  generateQuestions: vi.fn().mockResolvedValue([
    {
      questionId: 'test_q1',
      question: 'Test question?',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correctAnswer: 0,
      explanation: 'Test explanation',
    },
  ]),
  generateTitle: vi.fn().mockResolvedValue('Test Generated Title'),
};

/**
 * Mock Clerk Service
 */
export const mockClerkService = {
  verifyToken: vi.fn().mockResolvedValue({
    sub: 'test_user_123',
    org_role: 'org:professor',
    org_id: 'test_org_123',
  }),
  getOrganizationMembershipList: vi.fn().mockResolvedValue({
    data: [
      {
        role: 'org:professor',
        organization: { id: 'test_org_123' },
      },
    ],
  }),
};

/**
 * Mock Redis/BullMQ
 */
export const mockRedis = {
  get: vi.fn(),
  set: vi.fn(),
  del: vi.fn(),
  exists: vi.fn(),
  ping: vi.fn().mockResolvedValue('PONG'),
};

/**
 * Mock BullMQ Queue
 */
export const mockQueue = {
  add: vi.fn().mockResolvedValue({
    id: 'test_job_123',
    data: {},
    getState: vi.fn().mockResolvedValue('waiting'),
    progress: 0,
    returnvalue: null,
    failedReason: null,
  }),
  getJob: vi.fn().mockResolvedValue({
    id: 'test_job_123',
    data: { userId: 'test_user_123' },
    getState: vi.fn().mockResolvedValue('completed'),
    progress: 100,
    returnvalue: { resultId: 'test_result_123' },
    failedReason: null,
  }),
  getWaitingCount: vi.fn().mockResolvedValue(0),
  getActiveCount: vi.fn().mockResolvedValue(0),
  on: vi.fn(),
};

/**
 * Mock BullMQ Worker
 */
export const mockWorker = {
  on: vi.fn(),
  close: vi.fn().mockResolvedValue(undefined),
};

/**
 * Setup all mocks
 */
export function setupMocks() {
  vi.mock('../../services/s3Service', () => ({
    uploadAudio: mockS3Service.uploadAudio,
    getAudioUrl: mockS3Service.getAudioUrl,
    deleteAudio: mockS3Service.deleteAudio,
    isS3Configured: mockS3Service.isS3Configured,
  }));

  vi.mock('../../../services/gemini', () => ({
    geminiService: mockGeminiService,
  }));

  vi.mock('@clerk/backend', () => ({
    verifyToken: mockClerkService.verifyToken,
    createClerkClient: vi.fn().mockReturnValue({
      users: {
        getOrganizationMembershipList: mockClerkService.getOrganizationMembershipList,
      },
    }),
  }));

  vi.mock('../../config/redis', () => ({
    redis: mockRedis,
    connection: {
      host: 'localhost',
      port: 6379,
    },
  }));

  vi.mock('bullmq', () => ({
    Queue: vi.fn().mockImplementation(() => mockQueue),
    Worker: vi.fn().mockImplementation(() => mockWorker),
  }));
}

/**
 * Reset all mocks
 */
export function resetMocks() {
  vi.clearAllMocks();
  Object.values(mockS3Service).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
  Object.values(mockGeminiService).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
  Object.values(mockClerkService).forEach((mock) => {
    if (typeof mock === 'function' && 'mockClear' in mock) {
      mock.mockClear();
    }
  });
}
