/**
 * S3 Service - Handles audio file storage in AWS S3
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// S3 Configuration
const region = process.env.AWS_REGION || 'us-east-1';
const bucket = process.env.AWS_S3_BUCKET || '';
const urlExpirySeconds = parseInt(process.env.S3_URL_EXPIRY_SECONDS || '3600', 10);

// Initialize S3 client
// AWS SDK v3 automatically uses AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY from environment
const s3Client = new S3Client({
  region,
  ...(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  }),
});

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return !!(bucket && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/**
 * Upload audio file to S3
 * @param buffer - Audio file buffer
 * @param key - S3 object key (e.g., 'recordings/userId/timestamp_uuid.wav')
 * @param contentType - MIME type (e.g., 'audio/wav')
 * @returns The S3 key of the uploaded file
 */
export async function uploadAudio(
  buffer: Buffer,
  key: string,
  contentType: string = 'audio/wav'
): Promise<string> {
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);
  console.log(`✅ Uploaded audio to S3: ${key} (${(buffer.length / 1024).toFixed(2)} KB)`);
  
  return key;
}

/**
 * Generate a presigned URL for downloading an audio file
 * @param key - S3 object key
 * @param expiresIn - URL expiry time in seconds (default: 1 hour)
 * @returns Presigned URL for temporary access
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = urlExpirySeconds
): Promise<string> {
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set');
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(s3Client, command, { expiresIn });
  return url;
}

/**
 * Delete an audio file from S3
 * @param key - S3 object key to delete
 */
export async function deleteAudio(key: string): Promise<void> {
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await s3Client.send(command);
  console.log(`🗑️ Deleted audio from S3: ${key}`);
}

/**
 * Generate S3 key for user recordings
 * @param userId - User ID
 * @param filename - Original filename
 * @returns S3 key in format: recordings/{userId}/{timestamp}_{filename}
 */
export function generateRecordingKey(userId: string, filename: string): string {
  const timestamp = Date.now();
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `recordings/${userId}/${timestamp}_${sanitizedFilename}`;
}

/**
 * Generate S3 key for listening audio items
 * @param taskId - Task ID
 * @param audioId - Audio item ID
 * @param extension - File extension (default: 'wav')
 * @returns S3 key in format: audio/{taskId}/{audioId}.{ext}
 */
export function generateAudioItemKey(taskId: string, audioId: string, extension: string = 'wav'): string {
  return `audio/${taskId}/${audioId}.${extension}`;
}

export const s3Service = {
  isS3Configured,
  uploadAudio,
  getPresignedUrl,
  deleteAudio,
  generateRecordingKey,
  generateAudioItemKey,
};
