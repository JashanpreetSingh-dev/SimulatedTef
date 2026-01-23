/**
 * Batch model - stores student batches managed by professors
 */

import { z } from 'zod';
import { Batch } from '../../types';

// Zod schema for Batch validation
export const BatchSchema = z.object({
  batchId: z.string().min(1),
  name: z.string().min(1),
  professorId: z.string().min(1),
  orgId: z.string().min(1),
  studentIds: z.array(z.string()),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type BatchDocument = z.infer<typeof BatchSchema> & {
  _id?: string;
};

/**
 * Validate Batch data
 */
export function validateBatch(data: unknown): BatchDocument {
  return BatchSchema.parse(data);
}

/**
 * Create a new Batch
 */
export function createBatch(
  batchId: string,
  name: string,
  professorId: string,
  orgId: string
): Batch {
  const now = new Date().toISOString();
  return {
    batchId,
    name,
    professorId,
    orgId,
    studentIds: [],
    createdAt: now,
    updatedAt: now,
  };
}