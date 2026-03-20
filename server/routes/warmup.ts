import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { connectDB } from '../db/connection';
import { warmupService } from '../services/warmupService';
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
    if (!localDate || !isDateWithinOneDayOfServer(localDate)) {
      return res.status(400).json({ error: 'Invalid localDate' });
    }

    await warmupService.markAbandonedIfStale(userId, localDate);

    const db = await connectDB();
    const sessionsCollection = db.collection<WarmupSession>('warmupSessions');

    let session = await sessionsCollection.findOne({
      userId,
      date: localDate,
    });

    const profile = await warmupService.getOrCreateProfile(userId);

    const keywordsLookValid = (kws: string[] | undefined) =>
      Array.isArray(kws) &&
      kws.length > 0 &&
      kws.every((k) => k.length < 60 && !k.toLowerCase().includes('transcript'));

    if (session && session.topic && keywordsLookValid(session.keywords)) {
      const streak = await warmupService.computeStreak(userId, localDate);
      const systemPrompt = warmupService.buildSystemPrompt(
        profile,
        session.topic,
        session.keywords,
      );

      return res.json({
        systemPrompt,
        topic: session.topic,
        keywords: session.keywords,
        userLevel: profile.levelEstimate,
        streak,
      });
    }

    const topic = warmupService.selectTopic(profile);
    const keywords = await warmupService.generateKeywords(
      topic,
      profile.levelEstimate,
    );

    const now = new Date();

    const upsertResult = await sessionsCollection.findOneAndUpdate(
      { userId, date: localDate },
      {
        $setOnInsert: {
          userId,
          date: localDate,
          status: 'active' as const,
          createdAt: now,
        },
        $set: {
          topic,
          keywords,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    session = upsertResult.value as WarmupSession;
    const streak = await warmupService.computeStreak(userId, localDate);
    const systemPrompt = warmupService.buildSystemPrompt(profile, topic, keywords);

    res.json({
      systemPrompt,
      topic,
      keywords,
      userLevel: profile.levelEstimate,
      streak,
      sessionId: session ? (session as any)._id?.toString() : undefined,
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

    const { localDate } = req.body as { localDate?: string };
    if (!localDate || !isDateWithinOneDayOfServer(localDate)) {
      return res.status(400).json({ error: 'Invalid localDate' });
    }

    const db = await connectDB();
    const sessionsCollection = db.collection<WarmupSession>('warmupSessions');

    const now = new Date();

    const result = await sessionsCollection.findOneAndUpdate(
      { userId, date: localDate },
      {
        $setOnInsert: {
          userId,
          date: localDate,
          status: 'active' as const,
          createdAt: now,
        },
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );

    const session = result.value as any;
    const sessionId = session?._id?.toString();

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
    const feedback = await warmupService.generateSessionFeedback(
      transcript,
      profile.levelEstimate,
    );

    const localDate =
      (existing && existing.date) ||
      new Date().toISOString().slice(0, 10); // Fallback to server date

    const streak = await warmupService.computeStreak(userId, localDate);

    await sessionsCollection.updateOne(
      { userId, date: localDate },
      {
        $set: {
          status: 'completed',
          durationSeconds: durationSeconds ?? existing?.durationSeconds ?? 0,
          topicsCovered: feedback.topicsCovered,
          levelAtSession: feedback.levelAtSession,
          streak,
          feedback: {
            wentWell: feedback.wentWell,
            practiceTip: feedback.practiceTip,
            levelNote: feedback.levelNote,
          },
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

