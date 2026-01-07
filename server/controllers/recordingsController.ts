/**
 * Recordings controller - handles recording-related business logic
 * Now uses S3 for audio storage instead of GridFS
 */

import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { connectDB } from '../db/connection';
import { recordingsService } from '../services/recordingsService';
import { s3Service } from '../services/s3Service';
import { asyncHandler } from '../middleware/errorHandler';

export const recordingsController = {
  /**
   * POST /api/recordings/upload
   * Upload audio recording to S3
   */
  uploadRecording: asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    // Validate file size
    if (req.file.size === 0) {
      return res.status(400).json({ error: 'Empty audio file provided' });
    }

    if (req.file.size < 100) {
      return res.status(400).json({ error: 'Audio file too small, likely invalid' });
    }

    // Check if S3 is configured
    if (!s3Service.isS3Configured()) {
      return res.status(500).json({ error: 'S3 storage is not configured' });
    }

    // Use authenticated userId from middleware (not from request body)
    const userId = req.userId || 'guest';

    // Use the original filename from the request, or generate one
    const originalFilename = req.file.originalname || `${userId}_${Date.now()}.wav`;

    // Determine content type from file extension or mimetype
    let contentType = req.file.mimetype || 'audio/wav';
    if (!contentType.startsWith('audio/')) {
      // Fallback: determine from extension
      if (originalFilename.endsWith('.webm')) {
        contentType = 'audio/webm';
      } else if (originalFilename.endsWith('.ogg')) {
        contentType = 'audio/ogg';
      } else if (originalFilename.endsWith('.m4a')) {
        contentType = 'audio/mp4';
      } else {
        contentType = 'audio/wav';
      }
    }

    try {
      // Generate S3 key
      const s3Key = s3Service.generateRecordingKey(userId, originalFilename);

      // Upload to S3
      await s3Service.uploadAudio(req.file.buffer, s3Key, contentType);

      // Store metadata in MongoDB recordings collection
      const db = await connectDB();
      const recordingDoc = {
        s3Key,
        userId,
        filename: originalFilename,
        contentType,
        size: req.file.size,
        createdAt: new Date(),
      };

      const result = await db.collection('recordings').insertOne(recordingDoc);
      const recordingId = result.insertedId.toString();

      console.log(`✅ Audio uploaded to S3: ${originalFilename} (${(req.file.size / 1024).toFixed(2)} KB)`);
      
      res.status(201).json({
        recordingId,
        filename: originalFilename,
        size: req.file.size,
        contentType,
      });
    } catch (error: any) {
      console.error('S3 upload error:', error);
      res.status(500).json({ error: 'Failed to upload recording' });
    }
  }),

  /**
   * GET /api/recordings/:id
   * Get presigned URL for audio recording from S3
   */
  getRecording: asyncHandler(async (req: Request, res: Response) => {
    const recordingId = req.params.id;
    const userId = req.userId;

    // Validate ObjectId format
    if (!ObjectId.isValid(recordingId)) {
      return res.status(400).json({ error: 'Invalid recording ID format' });
    }

    // Check if file exists and verify ownership
    const recording = await recordingsService.findById(recordingId, userId || '');

    if (!recording) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    try {
      // Generate presigned URL for S3 access
      const presignedUrl = await s3Service.getPresignedUrl(recording.s3Key);

      // Redirect to presigned URL
      res.redirect(presignedUrl);
    } catch (error: any) {
      console.error('S3 presigned URL error:', error);
      res.status(500).json({ error: 'Failed to get recording URL' });
    }
  }),
};
