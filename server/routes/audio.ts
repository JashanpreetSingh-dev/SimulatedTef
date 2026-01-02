/**
 * Audio API routes - serves audio files from AudioItems
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { connectDB } from '../db/connection';

const router = Router();

// GET /api/audio/:audioId - Serve audio file from AudioItem
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

  // Check if audio data exists
  if (!audioItem.audioData) {
    return res.status(404).json({ error: 'Audio data not available for this audio item' });
  }

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
  res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
  res.setHeader('Accept-Ranges', 'bytes');

  // Send the audio data
  res.send(audioBuffer);
}));

export default router;
