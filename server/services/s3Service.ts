/**
 * S3 Service - Handles audio file storage in AWS S3
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

// All config is read at call time so dotenv can run before these values are captured
function getBucket(): string { return process.env.AWS_S3_BUCKET || ''; }
function getRegion(): string { return process.env.AWS_REGION || 'us-east-1'; }
function getUrlExpirySeconds(): number { return parseInt(process.env.S3_URL_EXPIRY_SECONDS || '3600', 10); }

let _s3Client: S3Client | undefined;
function getS3Client(): S3Client {
  if (!_s3Client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;
    _s3Client = new S3Client({
      region: getRegion(),
      ...(accessKeyId && secretAccessKey && {
        credentials: { accessKeyId, secretAccessKey },
      }),
    });
  }
  return _s3Client;
}

/**
 * Check if S3 is configured
 */
export function isS3Configured(): boolean {
  return !!(getBucket() && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/**
 * Upload a file (audio or image) to S3
 * @param buffer - File buffer
 * @param key - S3 object key
 * @param contentType - MIME type (e.g., 'audio/wav', 'image/png')
 * @returns The S3 key of the uploaded file
 */
export async function uploadFile(
  buffer: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set');
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await getS3Client().send(command);
  console.log(`✅ Uploaded to S3: ${key} (${(buffer.length / 1024).toFixed(2)} KB)`);
  return key;
}

/** @deprecated Use uploadFile. Upload audio file to S3. */
export async function uploadAudio(
  buffer: Buffer,
  key: string,
  contentType: string = 'audio/wav'
): Promise<string> {
  return uploadFile(buffer, key, contentType);
}

/**
 * Generate a presigned URL for downloading an audio file
 * @param key - S3 object key
 * @param expiresIn - URL expiry time in seconds (default: 1 hour)
 * @returns Presigned URL for temporary access
 */
export async function getPresignedUrl(
  key: string,
  expiresIn: number = getUrlExpirySeconds()
): Promise<string> {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set');
  }

  const command = new GetObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  const url = await getSignedUrl(getS3Client(), command, { expiresIn });
  return url;
}

/**
 * Delete an audio file from S3
 * @param key - S3 object key to delete
 */
export async function deleteAudio(key: string): Promise<void> {
  const bucket = getBucket();
  if (!bucket) {
    throw new Error('AWS_S3_BUCKET environment variable is not set');
  }

  const command = new DeleteObjectCommand({
    Bucket: bucket,
    Key: key,
  });

  await getS3Client().send(command);
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

/**
 * Generate S3 key for listening Section 1 option images ("quel dessin")
 * @param taskId - Task ID
 * @param questionNumber - Question number (1–40)
 * @param letter - Option letter A, B, C, or D
 * @returns S3 key in format: images/listening_section1/{taskId}/{taskId}_q{questionNumber}_{letter}.png
 */
export function generateSection1ImageKey(taskId: string, questionNumber: number, letter: string): string {
  return `images/listening_section1/${taskId}/${taskId}_q${questionNumber}_${letter}.png`;
}

export const s3Service = {
  isS3Configured,
  uploadFile,
  uploadAudio,
  getPresignedUrl,
  deleteAudio,
  generateRecordingKey,
  generateAudioItemKey,
  generateSection1ImageKey,
};
