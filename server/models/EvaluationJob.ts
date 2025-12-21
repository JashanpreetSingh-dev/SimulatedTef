/**
 * Evaluation job status model
 */

import { z } from 'zod';

export const EvaluationJobStatusSchema = z.object({
  jobId: z.string(),
  status: z.enum(['waiting', 'active', 'completed', 'failed']),
  progress: z.number().min(0).max(100).optional(),
  resultId: z.string().optional(),
  error: z.string().optional(),
});

export type EvaluationJobStatus = z.infer<typeof EvaluationJobStatusSchema>;

