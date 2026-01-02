/**
 * AudioItem model - stores audio files and scripts for Listening tasks
 */

import { z } from 'zod';

// Zod schema for AudioItem validation
// Note: audioData is stored as Buffer in MongoDB, but we use z.any() for flexibility
// since MongoDB Binary/Buffer types don't play well with Zod validation
export const AudioItemSchema = z.object({
  audioId: z.string().min(1),
  taskId: z.string().min(1),
  sectionId: z.number().int().min(1).max(4),
  audioScript: z.string().min(1),
  audioData: z.any().optional(), // Binary audio data (Buffer) - stored as WAV format
  mimeType: z.string().default('audio/wav'),
  repeatable: z.boolean().default(false),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type AudioItemDocument = z.infer<typeof AudioItemSchema> & {
  _id?: string;
  audioData?: Buffer; // Buffer type - MongoDB stores this as Binary automatically
};

/**
 * Validate AudioItem data
 */
export function validateAudioItem(data: unknown): AudioItemDocument {
  return AudioItemSchema.parse(data);
}

/**
 * Create a new AudioItem
 */
export function createAudioItem(
  audioId: string,
  taskId: string,
  sectionId: number,
  audioScript: string,
  repeatable: boolean = false,
  audioData?: Buffer,
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
    audioData,
    mimeType,
    repeatable,
    createdAt: now,
    updatedAt: now,
  };
}
