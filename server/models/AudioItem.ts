/**
 * AudioItem model - stores audio metadata and S3 references for Listening tasks
 * Audio files are now stored in S3, with s3Key referencing the file location
 */

import { z } from 'zod';

// Zod schema for AudioItem validation
// s3Key is used for new audio items, audioData is kept for backwards compatibility
export const AudioItemSchema = z.object({
  audioId: z.string().min(1),
  taskId: z.string().min(1),
  sectionId: z.number().int().min(1).max(4),
  audioScript: z.string().min(1),
  s3Key: z.string().optional(), // S3 object key for audio file
  mimeType: z.string().default('audio/wav'),
  repeatable: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AudioItemDocument = z.infer<typeof AudioItemSchema> & {
  _id?: string;
  s3Key?: string; // S3 object key for audio file
};

/**
 * Validate AudioItem data
 */
export function validateAudioItem(data: unknown): AudioItemDocument {
  return AudioItemSchema.parse(data);
}

/**
 * Create a new AudioItem with S3 storage
 */
export function createAudioItem(
  audioId: string,
  taskId: string,
  sectionId: number,
  audioScript: string,
  repeatable: boolean = false,
  s3Key?: string,
  mimeType: string = 'audio/wav'
): Omit<AudioItemDocument, '_id'> {
  // Validate sectionId
  if (sectionId < 1 || sectionId > 4) {
    throw new Error(`sectionId must be between 1 and 4, got ${sectionId}`);
  }

  const now = new Date().toISOString();
  return {
    audioId,
    taskId,
    sectionId,
    audioScript,
    s3Key,
    mimeType,
    repeatable,
    createdAt: now,
    updatedAt: now,
  };
}
