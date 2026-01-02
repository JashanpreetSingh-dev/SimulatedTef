/**
 * Recordings controller - handles recording-related business logic
 */

import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { getGridFSBucket } from '../db/connection';
import { recordingsService } from '../services/recordingsService';
import { asyncHandler } from '../middleware/errorHandler';

export const recordingsController = {
  /**
   * POST /api/recordings/upload
   * Upload audio recording to GridFS
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

    const gridFSBucket = getGridFSBucket();

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

    // Upload to GridFS
    const uploadStream = gridFSBucket.openUploadStream(originalFilename, {
      contentType: contentType,
      metadata: {
        userId,
        uploadedAt: new Date().toISOString(),
        originalMimeType: req.file.mimetype,
      },
    });

    uploadStream.end(req.file.buffer);

    uploadStream.on('finish', () => {
      console.log(`Audio uploaded to GridFS: ${originalFilename} (${(req.file!.size / 1024).toFixed(2)} KB)`);
      res.status(201).json({
        recordingId: uploadStream.id.toString(),
        filename: originalFilename,
        size: req.file!.size,
        contentType: contentType,
      });
    });

    uploadStream.on('error', (error) => {
      console.error('GridFS upload error:', error);
      res.status(500).json({ error: 'Failed to upload recording' });
    });
  }),

  /**
   * GET /api/recordings/:id
   * Download audio recording from GridFS
   */
  getRecording: asyncHandler(async (req: Request, res: Response) => {
    const recordingId = req.params.id;
    const userId = req.userId;

    // Validate ObjectId format
    if (!ObjectId.isValid(recordingId)) {
      return res.status(400).json({ error: 'Invalid recording ID format' });
    }

    // Check if file exists and verify ownership
    const file = await recordingsService.findById(recordingId, userId || '');

    if (!file) {
      return res.status(404).json({ error: 'Recording not found' });
    }

    // Determine content type from file metadata or filename
    let contentType = file.contentType || 'audio/wav';
    if (!contentType.startsWith('audio/')) {
      // Fallback: determine from filename
      if (file.filename.endsWith('.webm')) {
        contentType = 'audio/webm';
      } else if (file.filename.endsWith('.ogg')) {
        contentType = 'audio/ogg';
      } else if (file.filename.endsWith('.m4a')) {
        contentType = 'audio/mp4';
      } else {
        contentType = 'audio/wav';
      }
    }

    // Set headers for audio streaming with CORS support
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${file.filename}"`);
    res.setHeader('Content-Length', file.length.toString());
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour

    // Stream file from GridFS
    const gridFSBucket = getGridFSBucket();
    const downloadStream = gridFSBucket.openDownloadStream(new ObjectId(recordingId));
    downloadStream.pipe(res);

    downloadStream.on('error', (error) => {
      console.error('GridFS download error:', error);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download recording' });
      } else {
        res.end();
      }
    });

    downloadStream.on('end', () => {
      console.log(`Audio downloaded: ${file.filename} (${(file.length / 1024).toFixed(2)} KB)`);
    });
  }),
};

