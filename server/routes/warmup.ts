import { ObjectId } from 'mongodb';
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { connectDB } from '../db/connection';
import { warmupService, getTopicPhrases } from '../services/warmupService';
import { enqueueWarmupProfileJob } from '../jobs/warmupQueue';
import { WarmupSession } from '../models/WarmupSession';

const router = Router();

function parseLocalDate(localDate: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(localDate)) return null;
  const d = new Date(`${localDate}T00:00:00Z`);
  return isNaN(d.getTime()) ? null : d;
}

function isDateWithinOneDayOfServer(localDate: string): boolean {
  const parsed = parseLocalDate(localDate);
  if (!parsed) return false;

  const serverNow = new Date();
  const serverDate = new Date(
    Date.UTC(serverNow.getUTCFullYear(), serverNow.getUTCMonth(), serverNow.getUTCDate()),
  );

  const diffDays = Math.abs(
    (parsed.getTime() - serverDate.getTime()) / (1000 * 60 * 60 * 24),
  );
  return diffDays <= 1;
}

router.get(
  '/config',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const localDate = String(req.query.localDate || '').trim();
    const topicLabel = String(req.query.topic || '').trim();
    const topicId = String(req.query.topicId || '').trim();

    if (!localDate || !isDateWithinOneDayOfServer(localDate)) {
      return res.status(400).json({ error: 'Invalid localDate' });
    }
    if (!topicLabel) {
      return res.status(400).json({ error: 'topic is required' });
    }

    await warmupService.markAbandonedIfStale(userId, localDate);

    const profile = await warmupService.getOrCreateProfile(userId);
    const phrases = getTopicPhrases(topicId);
    const streak = await warmupService.computeStreak(userId, localDate);
    const systemPrompt = warmupService.buildSystemPrompt(profile, topicLabel, phrases);

    res.json({
      systemPrompt,
      phrases,
      userLevel: profile.levelEstimate,
      streak,
    });
  }),
);

router.post(
  '/session/start',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { localDate, topicId, topicLabel } = req.body as {
      localDate?: string;
      topicId?: string;
      topicLabel?: string;
    };
    if (!localDate || !isDateWithinOneDayOfServer(localDate)) {
      return res.status(400).json({ error: 'Invalid localDate' });
    }

    const db = await connectDB();
    const sessionsCollection = db.collection<WarmupSession>('warmupSessions');

    const now = new Date();
    const result = await sessionsCollection.insertOne({
      userId,
      date: localDate,
      status: 'active' as const,
      topicId: topicId || '',
      topic: topicLabel || '',
      createdAt: now,
    } as any);

    const sessionId = result.insertedId.toString();
    res.json({ sessionId });
  }),
);

router.post(
  '/session/complete',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { sessionId, transcript, durationSeconds } = req.body as {
      sessionId?: string;
      transcript?: string;
      durationSeconds?: number;
    };

    if (!sessionId || typeof transcript !== 'string') {
      return res.status(400).json({ error: 'sessionId and transcript are required' });
    }

    const db = await connectDB();
    const sessionsCollection = db.collection<WarmupSession>('warmupSessions');

    const sessionObjectId = typeof sessionId === 'string' ? sessionId : '';

    const existing = await sessionsCollection.findOne({
      userId,
      // Using string id comparison via _id.toString in application layer if needed
      // For now, match by userId + status active/completed on latest date to keep simple
    });

    const profile = await warmupService.getOrCreateProfile(userId);

    // Extract only user lines from transcript for corrections
    const userTranscript = transcript
      .split('\n')
      .filter((line) => line.startsWith('User:'))
      .map((line) => line.replace(/^User:\s*/, ''))
      .join(' ');

    const [feedback, corrections] = await Promise.all([
      warmupService.generateSessionFeedback(transcript, profile.levelEstimate),
      warmupService.generateCorrections(userTranscript, profile.levelEstimate),
    ]);

    // Find the session document by sessionId (ObjectId) or fall back to userId+date
    let sessionDoc: WarmupSession | null = null;
    try {
      if (sessionObjectId && ObjectId.isValid(sessionObjectId)) {
        sessionDoc = await sessionsCollection.findOne({
          _id: new ObjectId(sessionObjectId) as any,
          userId,
        });
      }
    } catch { /* ignore */ }

    const localDate =
      (sessionDoc && sessionDoc.date) ||
      new Date().toISOString().slice(0, 10);

    const streak = await warmupService.computeStreak(userId, localDate);

    const updateQuery = sessionDoc
      ? { _id: (sessionDoc as any)._id }
      : { userId, date: localDate };

    await sessionsCollection.updateOne(
      updateQuery as any,
      {
        $set: {
          status: 'completed',
          durationSeconds: durationSeconds ?? 0,
          topicsCovered: feedback.topicsCovered,
          levelAtSession: feedback.levelAtSession,
          streak,
          feedback: {
            wentWell: feedback.wentWell,
            practiceTip: feedback.practiceTip,
            levelNote: feedback.levelNote,
          },
          corrections,
        },
      },
      { upsert: true },
    );

    await enqueueWarmupProfileJob({
      userId,
      sessionId: sessionObjectId || `${userId}-${localDate}`,
      transcript,
      feedback: {
        wentWell: feedback.wentWell,
        practiceTip: feedback.practiceTip,
        levelNote: feedback.levelNote,
        topicsCovered: feedback.topicsCovered,
        levelAtSession: feedback.levelAtSession,
      },
      currentProfile: profile,
    });

    res.json({
      streak,
      feedback: {
        wentWell: feedback.wentWell,
        practiceTip: feedback.practiceTip,
        levelNote: feedback.levelNote,
      },
      topicsCovered: feedback.topicsCovered,
      levelAtSession: feedback.levelAtSession,
      corrections,
    });
  }),
);

router.get(
  '/summary',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const profile = await warmupService.getOrCreateProfile(userId);
    const localDate = new Date().toLocaleDateString('en-CA');
    const streak = await warmupService.computeStreak(userId, localDate);

    res.json({
      streak,
      levelEstimate: profile.levelEstimate || 'A2',
    });
  }),
);

router.get(
  '/history',
  requireAuth,
  asyncHandler(async (req, res) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const db = await connectDB();
    const sessionsCollection = db.collection<WarmupSession>('warmupSessions');

    const sessions = await sessionsCollection
      .find({ userId })
      .sort({ date: -1 })
      .limit(30)
      .toArray();

    const history = sessions.map((s) => ({
      date: s.date,
      status: s.status,
      durationSeconds: s.durationSeconds ?? 0,
      topicsCovered: s.topicsCovered ?? [],
      levelAtSession: s.levelAtSession,
      streak: s.streak,
    }));

    res.json(history);
  }),
);

export default router;

