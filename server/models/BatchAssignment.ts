/**
 * BatchAssignment model - links assessments to batches
 */

import { z } from 'zod';
import { BatchAssignment } from '../../types';

// Zod schema for BatchAssignment validation
export const BatchAssignmentSchema = z.object({
  batchAssignmentId: z.string().min(1),
  batchId: z.string().min(1),
  assignmentId: z.string().min(1),
  assignedBy: z.string().min(1),
  assignedAt: z.string(),
  orgId: z.string().min(1),
});

export type BatchAssignmentDocument = z.infer<typeof BatchAssignmentSchema> & {
  _id?: string;
};

/**
 * Validate BatchAssignment data
 */
export function validateBatchAssignment(data: unknown): BatchAssignmentDocument {
  return BatchAssignmentSchema.parse(data);
}

/**
 * Create a new BatchAssignment
 */
export function createBatchAssignment(
  batchAssignmentId: string,
  batchId: string,
  assignmentId: string,
  assignedBy: string,
  orgId: string
): BatchAssignment {
  const now = new Date().toISOString();
  return {
    batchAssignmentId,
    batchId,
    assignmentId,
    assignedBy,
    assignedAt: now,
    orgId,
  };
}