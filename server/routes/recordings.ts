/**
 * Recordings API routes
 */

import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth';
import { recordingsController } from '../controllers/recordingsController';

const router = Router();

// Multer for handling multipart/form-data (file uploads)
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/recordings/upload - Upload audio recording
router.post('/upload', requireAuth, upload.single('audio'), recordingsController.uploadRecording);

// GET /api/recordings/:id - Download audio recording
router.get('/:id', requireAuth, recordingsController.getRecording);

export default router;

