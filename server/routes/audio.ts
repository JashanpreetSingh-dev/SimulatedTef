/**
 * Audio API routes - serves audio files from S3 via presigned URLs
 * Also supports legacy audioData stored directly in MongoDB for backwards compatibility
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { connectDB } from '../db/connection';
import { s3Service } from '../services/s3Service';

const router = Router();

// GET /api/audio/items/:taskId - Get all audio items metadata for a task
router.get('/items/:taskId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { taskId } = req.params;

  if (!taskId) {
    return res.status(400).json({ error: 'taskId is required' });
  }

  const db = await connectDB();
  const audioItemsCollection = db.collection('audioItems');

  // Find all audio items for this task
  const items = await audioItemsCollection
    .find({ taskId })
    .sort({ sectionId: 1, audioId: 1 })
    .toArray();

  // Return only metadata (not binary data) - client will fetch audio via /api/audio/:audioId
  // Check for either s3Key (new) or audioData (legacy)
  const audioItems = items.map((item: any) => ({
    audioId: item.audioId,
    sectionId: item.sectionId,
    repeatable: item.repeatable,
    audioScript: item.audioScript,
    mimeType: item.mimeType,
    hasAudio: !!(item.s3Key || item.audioData), // Check both S3 and legacy
  }));

  res.json(audioItems);
}));

// GET /api/audio/:audioId - Serve audio file via S3 presigned URL or legacy MongoDB binary
router.get('/:audioId', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const { audioId } = req.params;
  const { taskId } = req.query;

  if (!audioId) {
    return res.status(400).json({ error: 'audioId is required' });
  }

  const db = await connectDB();
  const audioItemsCollection = db.collection('audioItems');

  // Build query
  const query: any = { audioId };
  if (taskId) {
    query.taskId = taskId;
  }

  // Find the audio item
  const audioItem = await audioItemsCollection.findOne(query);

  if (!audioItem) {
    return res.status(404).json({ error: 'Audio item not found' });
  }

  // Try S3 first (new system)
  if (audioItem.s3Key) {
    try {
      // Generate presigned URL for S3 access
      const presignedUrl = await s3Service.getPresignedUrl(audioItem.s3Key);
      // Redirect to presigned URL
      return res.redirect(presignedUrl);
    } catch (error: any) {
      console.error('S3 presigned URL error:', error);
      return res.status(500).json({ error: 'Failed to get audio URL from S3' });
    }
  }

  // Fallback to legacy audioData (binary stored in MongoDB)
  if (audioItem.audioData) {
    // Convert audioData to Buffer if it's not already (MongoDB Binary)
    let audioBuffer: Buffer;
    if (Buffer.isBuffer(audioItem.audioData)) {
      audioBuffer = audioItem.audioData;
    } else if (audioItem.audioData && typeof audioItem.audioData === 'object' && 'buffer' in audioItem.audioData) {
      // MongoDB Binary type
      audioBuffer = Buffer.from((audioItem.audioData as any).buffer);
    } else {
      return res.status(500).json({ error: 'Invalid audio data format' });
    }

    // Set appropriate headers
    const mimeType = audioItem.mimeType || 'audio/wav';
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', audioBuffer.length);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Accept-Ranges', 'bytes');

    // Send the audio data
    return res.send(audioBuffer);
  }

  // No audio data available
  return res.status(404).json({ error: 'Audio data not available for this audio item' });
}));

export default router;
