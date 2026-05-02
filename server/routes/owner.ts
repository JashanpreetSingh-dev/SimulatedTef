/**
 * Owner-only analytics routes
 * All routes gated by requireAuth + requireOwner
 */

import { Router, Request, Response } from 'express';
import { requireAuth, requireOwner } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { connectDB } from '../db/connection';
import { createClerkClient } from '@clerk/backend';

const clerkClient = process.env.CLERK_SECRET_KEY
  ? createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY })
  : null;

const router = Router();

/** Build a Date N days ago (start of day UTC) */
function daysAgo(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

/** Format Date as YYYY-MM-DD */
function fmtDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Parse date range from request query.
 * Prefers startDate/endDate params; falls back to days.
 */
function parseDateRange(req: Request): { since: string; until: string; totalDays: number } {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (req.query.startDate && req.query.endDate) {
    const since = `${req.query.startDate}T00:00:00.000Z`;
    const until = `${req.query.endDate}T23:59:59.999Z`;
    const ms = new Date(until).getTime() - new Date(since).getTime();
    const totalDays = Math.max(1, Math.ceil(ms / 86400000));
    return { since, until, totalDays };
  }
  const days = Math.min(parseInt(req.query.days as string) || 30, 365);
  return {
    since: daysAgo(days).toISOString(),
    until: `${todayStr}T23:59:59.999Z`,
    totalDays: days,
  };
}

/**
 * GET /api/owner/stats
 * Top-level KPI cards
 */
router.get(
  '/stats',
  requireAuth,
  requireOwner,
  asyncHandler(async (req: Request, res: Response) => {
    const { since, until } = parseDateRange(req);
    const db = await connectDB();

    // Users: count subscriptions by tier/status
    const subsPipeline = [
      {
        $group: {
          _id: { tier: '$tier', status: '$status' },
          count: { $sum: 1 },
        },
      },
    ];
    const subsAgg = await db.collection('subscriptions').aggregate(subsPipeline).toArray();

    let totalUsers = 0;
    let d2cUsers = 0;
    let orgUsers = 0;
    const subs = { free: 0, basic: 0, premium: 0, canceled: 0 };

    for (const row of subsAgg) {
      const tier = (row._id.tier || '').toLowerCase();
      const status = (row._id.status || '').toLowerCase();
      const count = row.count as number;
      totalUsers += count;

      if (status === 'canceled' || status === 'cancelled') {
        subs.canceled += count;
      } else if (tier === 'free') {
        subs.free += count;
        d2cUsers += count;
      } else if (tier === 'basic') {
        subs.basic += count;
        d2cUsers += count;
      } else if (tier === 'premium') {
        subs.premium += count;
        d2cUsers += count;
      } else {
        orgUsers += count;
      }
    }

    // Activity counts (within date range)
    const speakingSessions = await db.collection('conversationLogs').countDocuments({
      startedAt: { $gte: since, $lte: until },
    });

    // Usage events by type
    const usageAgg = await db
      .collection('usageEvents')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until } } },
        { $group: { _id: '$type', count: { $sum: 1 } } },
      ])
      .toArray();

    const usageByType: Record<string, number> = {};
    for (const row of usageAgg) {
      usageByType[row._id as string] = row.count as number;
    }

    const evaluations = await db.collection('results').countDocuments({
      createdAt: { $gte: since, $lte: until },
    });

    const mockExams = (usageByType['mockExam'] ?? 0);
    const writingFeedback =
      (usageByType['writtenExpressionSectionA'] ?? 0) +
      (usageByType['writtenExpressionSectionB'] ?? 0);

    // Speaking cost
    const speakingCostAgg = await db
      .collection('conversationLogs')
      .aggregate([
        { $match: { startedAt: { $gte: since, $lte: until } } },
        { $group: { _id: null, total: { $sum: '$metrics.totalCost' } } },
      ])
      .toArray();
    const speakingCost = speakingCostAgg[0]?.total ?? 0;

    // Oral eval cost
    const oralEvalCostAgg = await db
      .collection('results')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until }, module: 'oralExpression' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$aiCost', 0] } } } },
      ])
      .toArray();
    const oralEvalCost = oralEvalCostAgg[0]?.total ?? 0;

    // Written eval cost
    const writtenEvalCostAgg = await db
      .collection('results')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until }, module: 'writtenExpression' } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$aiCost', 0] } } } },
      ])
      .toArray();
    const writtenEvalCost = writtenEvalCostAgg[0]?.total ?? 0;

    const aiDateMatch = { createdAt: { $gte: since, $lte: until } };
    const [dailyRitualAgg, guidedWritingAgg, otherAiMiscAgg] = await Promise.all([
      db
        .collection('aiUsageEvents')
        .aggregate([
          { $match: { ...aiDateMatch, source: 'dailyRitualDeck' } },
          { $group: { _id: null, total: { $sum: '$costUsd' } } },
        ])
        .toArray(),
      db
        .collection('aiUsageEvents')
        .aggregate([
          { $match: { ...aiDateMatch, source: 'guidedWritingFeedback' } },
          { $group: { _id: null, total: { $sum: '$costUsd' } } },
        ])
        .toArray(),
      db
        .collection('aiUsageEvents')
        .aggregate([
          {
            $match: {
              ...aiDateMatch,
              $nor: [{ source: 'dailyRitualDeck' }, { source: 'guidedWritingFeedback' }],
            },
          },
          { $group: { _id: null, total: { $sum: '$costUsd' } } },
        ])
        .toArray(),
    ]);
    const dailyRitualAiCost = dailyRitualAgg[0]?.total ?? 0;
    const guidedWritingAiCost = guidedWritingAgg[0]?.total ?? 0;
    const otherAiMiscCost = otherAiMiscAgg[0]?.total ?? 0;
    const miscAiRounded = Math.round(otherAiMiscCost * 100) / 100;
    const dailyRitualRounded = Math.round(dailyRitualAiCost * 100) / 100;
    const guidedWritingRounded = Math.round(guidedWritingAiCost * 100) / 100;
    const aiSubtotal = dailyRitualAiCost + guidedWritingAiCost + otherAiMiscCost;

    res.json({
      users: { total: totalUsers, d2c: d2cUsers, org: orgUsers },
      subscriptions: subs,
      activity: {
        speakingSessions,
        evaluations,
        writingFeedback,
        mockExams,
      },
      cost: {
        speaking: Math.round(speakingCost * 100) / 100,
        oralEval: Math.round(oralEvalCost * 100) / 100,
        writtenEval: Math.round(writtenEvalCost * 100) / 100,
        dailyRitual: dailyRitualRounded,
        guidedWriting: guidedWritingRounded,
        otherAi: miscAiRounded,
        total:
          Math.round((speakingCost + oralEvalCost + writtenEvalCost + aiSubtotal) * 100) / 100,
      },
    });
  })
);

/**
 * GET /api/owner/activity-chart
 * Daily activity for charting
 */
router.get(
  '/activity-chart',
  requireAuth,
  requireOwner,
  asyncHandler(async (req: Request, res: Response) => {
    const { since, until, totalDays } = parseDateRange(req);
    const db = await connectDB();

    const speakingAgg = await db
      .collection('conversationLogs')
      .aggregate([
        { $match: { startedAt: { $gte: since, $lte: until } } },
        {
          $group: {
            _id: { $substr: ['$startedAt', 0, 10] },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const evalAgg = await db
      .collection('results')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until } } },
        {
          $group: {
            _id: { $substr: ['$createdAt', 0, 10] },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const signupAgg = await db
      .collection('subscriptions')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until } } },
        {
          $group: {
            _id: { $substr: ['$createdAt', 0, 10] },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const speakingMap = new Map(speakingAgg.map((r) => [r._id, r.count]));
    const evalMap = new Map(evalAgg.map((r) => [r._id, r.count]));
    const signupMap = new Map(signupAgg.map((r) => [r._id, r.count]));

    const labels: string[] = [];
    const speaking: number[] = [];
    const evaluations: number[] = [];
    const newSignups: number[] = [];

    const sinceDate = new Date(since);
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(sinceDate);
      d.setUTCDate(d.getUTCDate() + i);
      const label = fmtDate(d);
      labels.push(label);
      speaking.push((speakingMap.get(label) as number) ?? 0);
      evaluations.push((evalMap.get(label) as number) ?? 0);
      newSignups.push((signupMap.get(label) as number) ?? 0);
    }

    res.json({ labels, speaking, evaluations, newSignups });
  })
);

/**
 * GET /api/owner/cost-breakdown
 * Daily AI cost per category
 */
router.get(
  '/cost-breakdown',
  requireAuth,
  requireOwner,
  asyncHandler(async (req: Request, res: Response) => {
    const { since, until, totalDays } = parseDateRange(req);
    const db = await connectDB();

    const speakingCostAgg = await db
      .collection('conversationLogs')
      .aggregate([
        { $match: { startedAt: { $gte: since, $lte: until } } },
        {
          $group: {
            _id: { $substr: ['$startedAt', 0, 10] },
            cost: { $sum: '$metrics.totalCost' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const oralEvalCostAgg = await db
      .collection('results')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until }, module: 'oralExpression' } },
        {
          $group: {
            _id: { $substr: ['$createdAt', 0, 10] },
            cost: { $sum: { $ifNull: ['$aiCost', 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const writtenEvalCostAgg = await db
      .collection('results')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until }, module: 'writtenExpression' } },
        {
          $group: {
            _id: { $substr: ['$createdAt', 0, 10] },
            cost: { $sum: { $ifNull: ['$aiCost', 0] } },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    const aiDayMatch = { createdAt: { $gte: since, $lte: until } };
    const dayGroup = {
      $group: {
        _id: { $substr: ['$createdAt', 0, 10] },
        cost: { $sum: '$costUsd' },
      },
    };
    const [dailyRitualCostAgg, guidedWritingCostAgg, otherAiMiscCostAgg] = await Promise.all([
      db
        .collection('aiUsageEvents')
        .aggregate([
          { $match: { ...aiDayMatch, source: 'dailyRitualDeck' } },
          dayGroup,
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      db
        .collection('aiUsageEvents')
        .aggregate([
          { $match: { ...aiDayMatch, source: 'guidedWritingFeedback' } },
          dayGroup,
          { $sort: { _id: 1 } },
        ])
        .toArray(),
      db
        .collection('aiUsageEvents')
        .aggregate([
          {
            $match: {
              ...aiDayMatch,
              $nor: [{ source: 'dailyRitualDeck' }, { source: 'guidedWritingFeedback' }],
            },
          },
          dayGroup,
          { $sort: { _id: 1 } },
        ])
        .toArray(),
    ]);

    const speakingMap = new Map(speakingCostAgg.map((r) => [r._id, r.cost]));
    const oralEvalMap = new Map(oralEvalCostAgg.map((r) => [r._id, r.cost]));
    const writtenEvalMap = new Map(writtenEvalCostAgg.map((r) => [r._id, r.cost]));
    const dailyRitualMap = new Map(dailyRitualCostAgg.map((r) => [r._id, r.cost]));
    const guidedWritingMap = new Map(guidedWritingCostAgg.map((r) => [r._id, r.cost]));
    const otherAiMiscMap = new Map(otherAiMiscCostAgg.map((r) => [r._id, r.cost]));

    const labels: string[] = [];
    const speakingCosts: number[] = [];
    const oralEvalCosts: number[] = [];
    const writtenEvalCosts: number[] = [];
    const dailyRitualCosts: number[] = [];
    const guidedWritingCosts: number[] = [];
    const otherAiCosts: number[] = [];

    const sinceDate = new Date(since);
    for (let i = 0; i < totalDays; i++) {
      const d = new Date(sinceDate);
      d.setUTCDate(d.getUTCDate() + i);
      const label = fmtDate(d);
      labels.push(label);
      speakingCosts.push(Math.round(((speakingMap.get(label) as number) ?? 0) * 10000) / 10000);
      oralEvalCosts.push(Math.round(((oralEvalMap.get(label) as number) ?? 0) * 10000) / 10000);
      writtenEvalCosts.push(Math.round(((writtenEvalMap.get(label) as number) ?? 0) * 10000) / 10000);
      dailyRitualCosts.push(Math.round(((dailyRitualMap.get(label) as number) ?? 0) * 10000) / 10000);
      guidedWritingCosts.push(Math.round(((guidedWritingMap.get(label) as number) ?? 0) * 10000) / 10000);
      otherAiCosts.push(Math.round(((otherAiMiscMap.get(label) as number) ?? 0) * 10000) / 10000);
    }

    res.json({
      labels,
      speaking: speakingCosts,
      oralEval: oralEvalCosts,
      writtenEval: writtenEvalCosts,
      dailyRitual: dailyRitualCosts,
      guidedWriting: guidedWritingCosts,
      otherAi: otherAiCosts,
    });
  })
);

/**
 * GET /api/owner/session-health
 * Speaking session quality metrics (always current month)
 */
router.get(
  '/session-health',
  requireAuth,
  requireOwner,
  asyncHandler(async (req: Request, res: Response) => {
    const db = await connectDB();

    const now = new Date();
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

    const healthAgg = await db
      .collection('conversationLogs')
      .aggregate([
        { $match: { startedAt: { $gte: monthStart.toISOString() } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
            avgTokens: {
              $avg: {
                $add: [
                  { $ifNull: ['$metrics.totalBilledPromptTokens', 0] },
                  { $ifNull: ['$metrics.totalCompletionTokens', 0] },
                ],
              },
            },
            totalCost: { $sum: '$metrics.totalCost' },
          },
        },
      ])
      .toArray();

    let completed = 0;
    let abandoned = 0;
    let failed = 0;
    let totalDuration = 0;
    let totalTokens = 0;
    let totalSessions = 0;
    let totalCostThisMonth = 0;

    for (const row of healthAgg) {
      const status = (row._id || '').toLowerCase();
      const count = row.count as number;
      totalSessions += count;
      totalCostThisMonth += row.totalCost as number;

      if (status === 'completed') {
        completed = count;
        totalDuration += (row.avgDuration as number) * count;
        totalTokens += (row.avgTokens as number) * count;
      } else if (status === 'abandoned') {
        abandoned = count;
      } else {
        failed += count;
      }
    }

    res.json({
      completed,
      abandoned,
      failed,
      avgDurationSeconds: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
      avgTokensPerSession: totalSessions > 0 ? Math.round(totalTokens / totalSessions) : 0,
      totalCostThisMonth: Math.round(totalCostThisMonth * 100) / 100,
    });
  })
);

/**
 * GET /api/owner/recent-sessions
 * Most recent speaking sessions
 */
router.get(
  '/recent-sessions',
  requireAuth,
  requireOwner,
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
    const { since, until } = parseDateRange(req);
    const db = await connectDB();

    const filter: any = { startedAt: { $gte: since, $lte: until } };

    const sessions = await db
      .collection('conversationLogs')
      .find(filter)
      .sort({ startedAt: -1 })
      .limit(limit)
      .project({
        userId: 1,
        examType: 1,
        startedAt: 1,
        duration: 1,
        status: 1,
        'metrics.totalCost': 1,
        'metrics.totalBilledPromptTokens': 1,
        'metrics.totalCompletionTokens': 1,
        'metrics.messageCount': 1,
        'metrics.aiMessageCount': 1,
      })
      .toArray();

    // Batch-fetch emails from Clerk
    const uniqueIds = [...new Set(sessions.map((s) => s.userId as string))];
    const emailMap = new Map<string, string>();
    if (clerkClient && uniqueIds.length > 0) {
      try {
        const { data: users } = await clerkClient.users.getUserList({
          userId: uniqueIds,
          limit: uniqueIds.length,
        });
        for (const u of users) {
          const email = u.emailAddresses[0]?.emailAddress || u.username || u.id;
          emailMap.set(u.id, email);
        }
      } catch (err) {
        console.error('Failed to fetch Clerk user emails:', err);
      }
    }

    const result = sessions.map((s) => ({
      userId: s.userId,
      userEmail: emailMap.get(s.userId) ?? s.userId,
      examType: s.examType,
      startedAt: s.startedAt,
      duration: s.duration ?? 0,
      status: s.status,
      cost: s.metrics?.totalCost ?? 0,
      billedPromptTokens: s.metrics?.totalBilledPromptTokens ?? 0,
      completionTokens: s.metrics?.totalCompletionTokens ?? 0,
      turns: s.metrics?.aiMessageCount ?? 0,
    }));

    res.json(result);
  })
);

/**
 * GET /api/owner/user-costs
 * Per-user AI cost breakdown, filterable by date range
 */
router.get(
  '/user-costs',
  requireAuth,
  requireOwner,
  asyncHandler(async (req: Request, res: Response) => {
    const { since, until } = parseDateRange(req);
    const db = await connectDB();

    // Speaking cost + session count per user
    const speakingAgg = await db
      .collection('conversationLogs')
      .aggregate([
        { $match: { startedAt: { $gte: since, $lte: until } } },
        {
          $group: {
            _id: '$userId',
            speakingCost: { $sum: '$metrics.totalCost' },
            speakingSessions: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Oral eval cost + count per user (include all results, cost 0 if aiCost not set)
    const oralAgg = await db
      .collection('results')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until }, module: 'oralExpression' } },
        {
          $group: {
            _id: '$userId',
            oralEvalCost: { $sum: { $ifNull: ['$aiCost', 0] } },
            oralEvals: { $sum: 1 },
          },
        },
      ])
      .toArray();

    // Written eval cost + count per user (include all results, cost 0 if aiCost not set)
    const writtenAgg = await db
      .collection('results')
      .aggregate([
        { $match: { createdAt: { $gte: since, $lte: until }, module: 'writtenExpression' } },
        {
          $group: {
            _id: '$userId',
            writtenEvalCost: { $sum: { $ifNull: ['$aiCost', 0] } },
            writtenEvals: { $sum: 1 },
          },
        },
      ])
      .toArray();

    const aiUserMatch = {
      createdAt: { $gte: since, $lte: until },
      userId: { $exists: true, $nin: [null, ''] },
    };
    const userAiGroup = {
      $group: {
        _id: '$userId',
        events: { $sum: 1 },
        aiCost: { $sum: '$costUsd' },
      },
    };
    const [dailyRitualUserAgg, guidedWritingUserAgg, otherAiUserAgg] = await Promise.all([
      db
        .collection('aiUsageEvents')
        .aggregate([{ $match: { ...aiUserMatch, source: 'dailyRitualDeck' } }, userAiGroup])
        .toArray(),
      db
        .collection('aiUsageEvents')
        .aggregate([{ $match: { ...aiUserMatch, source: 'guidedWritingFeedback' } }, userAiGroup])
        .toArray(),
      db
        .collection('aiUsageEvents')
        .aggregate([
          {
            $match: {
              ...aiUserMatch,
              $nor: [{ source: 'dailyRitualDeck' }, { source: 'guidedWritingFeedback' }],
            },
          },
          userAiGroup,
        ])
        .toArray(),
    ]);

    // Merge into a map keyed by userId
    const userMap = new Map<string, {
      speakingSessions: number;
      speakingCost: number;
      oralEvals: number;
      oralEvalCost: number;
      writtenEvals: number;
      writtenEvalCost: number;
      dailyRitualEvents: number;
      dailyRitualCost: number;
      guidedWritingEvents: number;
      guidedWritingCost: number;
      otherEvents: number;
      otherAiCost: number;
    }>();

    function getOrCreate(userId: string) {
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          speakingSessions: 0,
          speakingCost: 0,
          oralEvals: 0,
          oralEvalCost: 0,
          writtenEvals: 0,
          writtenEvalCost: 0,
          dailyRitualEvents: 0,
          dailyRitualCost: 0,
          guidedWritingEvents: 0,
          guidedWritingCost: 0,
          otherEvents: 0,
          otherAiCost: 0,
        });
      }
      return userMap.get(userId)!;
    }

    for (const r of speakingAgg) {
      const u = getOrCreate(r._id as string);
      u.speakingSessions = r.speakingSessions as number;
      u.speakingCost = r.speakingCost as number;
    }
    for (const r of oralAgg) {
      const u = getOrCreate(r._id as string);
      u.oralEvals = r.oralEvals as number;
      u.oralEvalCost = r.oralEvalCost as number;
    }
    for (const r of writtenAgg) {
      const u = getOrCreate(r._id as string);
      u.writtenEvals = r.writtenEvals as number;
      u.writtenEvalCost = r.writtenEvalCost as number;
    }
    for (const r of dailyRitualUserAgg) {
      const uid = r._id as string;
      if (!uid) continue;
      const u = getOrCreate(uid);
      u.dailyRitualEvents = r.events as number;
      u.dailyRitualCost = r.aiCost as number;
    }
    for (const r of guidedWritingUserAgg) {
      const uid = r._id as string;
      if (!uid) continue;
      const u = getOrCreate(uid);
      u.guidedWritingEvents = r.events as number;
      u.guidedWritingCost = r.aiCost as number;
    }
    for (const r of otherAiUserAgg) {
      const uid = r._id as string;
      if (!uid) continue;
      const u = getOrCreate(uid);
      u.otherEvents = r.events as number;
      u.otherAiCost = r.aiCost as number;
    }

    // Batch Clerk email lookup
    const uniqueIds = [...userMap.keys()];
    const emailMap = new Map<string, string>();
    if (clerkClient && uniqueIds.length > 0) {
      try {
        const { data: users } = await clerkClient.users.getUserList({
          userId: uniqueIds,
          limit: uniqueIds.length,
        });
        for (const u of users) {
          emailMap.set(u.id, u.emailAddresses[0]?.emailAddress || u.username || u.id);
        }
      } catch (err) {
        console.error('Failed to fetch Clerk user emails:', err);
      }
    }

    const subByUser = new Map<string, { tier: string; status: string }>();
    if (uniqueIds.length > 0) {
      const subDocs = await db
        .collection('subscriptions')
        .find({ userId: { $in: uniqueIds } })
        .project({ userId: 1, tier: 1, status: 1 })
        .toArray();
      for (const doc of subDocs) {
        const uid = doc.userId as string | undefined;
        if (uid) {
          subByUser.set(uid, {
            tier: typeof doc.tier === 'string' ? doc.tier : 'free',
            status: typeof doc.status === 'string' ? doc.status : '',
          });
        }
      }
    }

    function normalizeTier(raw: string): 'free' | 'basic' | 'premium' {
      if (raw === 'basic' || raw === 'premium' || raw === 'free') return raw;
      return 'free';
    }

    const result = [...userMap.entries()]
      .map(([userId, data]) => {
        const sub = subByUser.get(userId);
        const subscriptionTier = normalizeTier(sub?.tier ?? 'free');
        const subscriptionStatus = sub?.status ?? '';
        const isPayingSubscriber =
          (subscriptionTier === 'basic' || subscriptionTier === 'premium') &&
          (subscriptionStatus === 'active' || subscriptionStatus === 'trialing');

        return {
          userId,
          userEmail: emailMap.get(userId) ?? userId,
          subscriptionTier,
          subscriptionStatus,
          isPayingSubscriber,
          speakingSessions: data.speakingSessions,
          speakingCost: Math.round(data.speakingCost * 10000) / 10000,
          oralEvals: data.oralEvals,
          oralEvalCost: Math.round(data.oralEvalCost * 10000) / 10000,
          writtenEvals: data.writtenEvals,
          writtenEvalCost: Math.round(data.writtenEvalCost * 10000) / 10000,
          dailyRitualEvents: data.dailyRitualEvents,
          dailyRitualCost: Math.round(data.dailyRitualCost * 10000) / 10000,
          guidedWritingEvents: data.guidedWritingEvents,
          guidedWritingCost: Math.round(data.guidedWritingCost * 10000) / 10000,
          otherEvents: data.otherEvents,
          otherAiCost: Math.round(data.otherAiCost * 10000) / 10000,
          totalCost:
            Math.round(
              (data.speakingCost +
                data.oralEvalCost +
                data.writtenEvalCost +
                data.dailyRitualCost +
                data.guidedWritingCost +
                data.otherAiCost) *
                10000
            ) / 10000,
        };
      })
      .sort((a, b) => b.totalCost - a.totalCost);

    res.json(result);
  })
);

export default router;

