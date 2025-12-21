/**
 * Recording metadata model
 */

import { z } from 'zod';

export const RecordingMetadataSchema = z.object({
  userId: z.string(),
  uploadedAt: z.string(),
  originalMimeType: z.string().optional(),
});

export type RecordingMetadata = z.infer<typeof RecordingMetadataSchema>;

