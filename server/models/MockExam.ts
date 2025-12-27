/**
 * Mock Exam model - stores mock exam definitions
 * Each mock exam consists of specific tasks for each module
 */

import { z } from 'zod';

// Zod schema for Mock Exam validation
export const MockExamSchema = z.object({
  mockExamId: z.string().min(1), // Unique identifier (e.g., "mock_1")
  name: z.string().min(1), // Display name (e.g., "Mock Exam 1")
  description: z.string().optional(), // Optional description
  // Task IDs for each module - all required for complete mock exams
  oralATaskId: z.string().min(1), // Format: "oralA_3"
  oralBTaskId: z.string().min(1), // Format: "oralB_1"
  readingTaskId: z.string().min(1), // Format: "reading_1"
  listeningTaskId: z.string().min(1), // Format: "listening_1"
  isActive: z.boolean().default(true),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type MockExamDocument = z.infer<typeof MockExamSchema> & {
  _id?: string;
};

/**
 * Validate Mock Exam data
 */
export function validateMockExam(data: unknown): MockExamDocument {
  return MockExamSchema.parse(data);
}

/**
 * Create a new Mock Exam
 */
export function createMockExam(
  mockExamId: string,
  name: string,
  oralATaskId: string,
  oralBTaskId: string,
  readingTaskId: string,
  listeningTaskId: string,
  options: {
    description?: string;
    isActive?: boolean;
  } = {}
): MockExamDocument {
  const now = new Date().toISOString();
  return {
    mockExamId,
    name,
    description: options.description,
    oralATaskId,
    oralBTaskId,
    readingTaskId,
    listeningTaskId,
    isActive: options.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };
}
