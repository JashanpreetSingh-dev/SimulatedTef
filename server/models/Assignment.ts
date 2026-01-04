/**
 * Assignment model - stores practice assignments created by examiners
 */

import { z } from 'zod';
import { Assignment, AssignmentSettings, AssignmentStatus, AssignmentType } from '../../types';

// Zod schema for Assignment Settings validation
export const AssignmentSettingsSchema = z.object({
  numberOfQuestions: z.number().int().min(1).max(40),
  sections: z.array(z.string()).optional(),
  timeLimitSec: z.number().int().positive().optional(),
  theme: z.string().optional(),
});

// Zod schema for Assignment validation
export const AssignmentSchema = z.object({
  assignmentId: z.string().min(1),
  type: z.enum(['reading', 'listening']),
  title: z.string().min(1),
  prompt: z.string().min(1),
  settings: AssignmentSettingsSchema,
  status: z.enum(['draft', 'published']),
  createdBy: z.string().min(1),
  organizationId: z.string().optional(), // Organization ID for RBAC
  taskId: z.string().optional(),
  questionIds: z.array(z.string()).optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AssignmentDocument = z.infer<typeof AssignmentSchema> & {
  _id?: string;
};

/**
 * Validate Assignment data
 */
export function validateAssignment(data: unknown): AssignmentDocument {
  return AssignmentSchema.parse(data);
}

/**
 * Create a new Assignment
 */
export function createAssignment(
  assignmentId: string,
  type: AssignmentType,
  title: string,
  prompt: string,
  settings: AssignmentSettings,
  createdBy: string,
  status: AssignmentStatus = 'draft',
  organizationId?: string,
  taskId?: string,
  questionIds?: string[]
): Assignment {
  const now = new Date().toISOString();
  return {
    assignmentId,
    type,
    title,
    prompt,
    settings,
    status,
    createdBy,
    organizationId,
    taskId,
    questionIds,
    createdAt: now,
    updatedAt: now,
  };
}
