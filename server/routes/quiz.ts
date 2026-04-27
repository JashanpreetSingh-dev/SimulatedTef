/**
 * Quiz notification & generation routes
 */

import { Router, Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { connectDB } from '../db/connection';
import { generateQuizFromWeaknesses } from '../services/quizService';

const router = Router();

/**
 * GET /api/quiz/notifications/count
 * Returns the number of unread quiz notifications for the authenticated user.
 */
router.get(
  '/notifications/count',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const db = await connectDB();
    const unread = await db
      .collection('quiz_notifications')
      .countDocuments({ userId, status: 'unread' });

    res.json({ unread });
  }),
);

/**
 * GET /api/quiz/notifications
 * Returns all quiz notifications for the user (quiz field omitted for size).
 */
router.get(
  '/notifications',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const db = await connectDB();
    const notifications = await db
      .collection('quiz_notifications')
      .find({ userId }, { projection: { quiz: 0 } })
      .sort({ createdAt: -1 })
      .toArray();

    res.json({ notifications });
  }),
);

/**
 * POST /api/quiz/generate
 * Generate (or return cached) quiz for a notification.
 * Body: { notificationId: string }
 */
router.post(
  '/generate',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { notificationId } = req.body;
    if (!notificationId) {
      return res.status(400).json({ error: 'notificationId is required' });
    }

    const db = await connectDB();

    let oid: ObjectId;
    try {
      oid = new ObjectId(notificationId);
    } catch {
      return res.status(400).json({ error: 'Invalid notificationId' });
    }

    const doc = await db
      .collection('quiz_notifications')
      .findOne({ _id: oid, userId });

    if (!doc) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    // Already generated — return cached quiz.
    if (doc.quizGenerated) {
      return res.json({ quiz: doc.quiz, weaknesses: doc.weaknesses });
    }

    // Paywall check: require active paid subscription.
    const subscription = await db
      .collection('subscriptions')
      .findOne({ userId });
    if (!subscription || subscription.tier === 'free') {
      return res.json({ paywalled: true });
    }

    // Generate quiz via Gemini.
    const quiz = await generateQuizFromWeaknesses(doc.weaknesses);

    await db
      .collection('quiz_notifications')
      .updateOne({ _id: oid }, { $set: { quiz, quizGenerated: true } });

    res.json({ quiz, weaknesses: doc.weaknesses });
  }),
);

/**
 * POST /api/quiz/notifications/:id/read
 * Mark a notification as read.
 */
router.post(
  '/notifications/:id/read',
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    let oid: ObjectId;
    try {
      oid = new ObjectId(req.params.id);
    } catch {
      return res.status(400).json({ error: 'Invalid notification id' });
    }

    const db = await connectDB();
    await db.collection('quiz_notifications').updateOne(
      { _id: oid, userId },
      { $set: { status: 'read', readAt: new Date().toISOString() } },
    );

    res.json({ success: true });
  }),
);

export default router;
