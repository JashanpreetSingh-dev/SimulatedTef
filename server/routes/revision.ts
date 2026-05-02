/**
 * Daily TEF revision ritual — deck generation and weak-card queue
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, z } from '../middleware/validate';
import {
  dailyRitualDeckLimiter,
  dailyRitualWeakCardLimiter,
  guidedWritingFeedbackLimiter,
} from '../middleware/rateLimiter';
import { generateDailyDeck } from '../services/dailyRitualService';
import {
  getCachedDeck,
  saveCachedDeck,
  getWeakCardsSummary,
  appendWeakCard,
} from '../services/dailyRitualStorage';
import { dailyRitualCardSchema } from './revisionSchemas';
import type { DailyRitualCard, WrittenTask } from '../../types';
import { getGuidedWritingFeedbackForUser } from '../services/guidedWritingFeedbackService';

const router = Router();

const dailyDeckBodySchema = z.object({
  focus: z.enum(['vocab', 'grammar', 'mixed']).default('mixed'),
  cefrHint: z.enum(['B2', 'C1']).default('B2'),
  cardCount: z.coerce.number().int().min(8).max(36).default(24),
  skipCache: z.boolean().optional().default(false),
});

router.post(
  '/daily-deck',
  requireAuth,
  dailyRitualDeckLimiter,
  validateBody(dailyDeckBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { focus, cefrHint, cardCount, skipCache } = req.body as z.infer<typeof dailyDeckBodySchema>;

    if (!skipCache) {
      const cached = await getCachedDeck(userId, focus, cefrHint, cardCount);
      if (cached && cached.length > 0) {
        return res.json({ cards: cached, cached: true });
      }
    }

    const weakCardsSummary = await getWeakCardsSummary(userId);
    const cards = await generateDailyDeck({
      focus,
      cardCount,
      cefrHint,
      weakCardsSummary,
      userId,
    });

    await saveCachedDeck(userId, focus, cefrHint, cardCount, cards);
    res.json({ cards, cached: false });
  })
);

const weakCardBodySchema = z.object({
  card: dailyRitualCardSchema,
});

const guidedWritingTaskSchema = z.object({
  id: z.string(),
  section: z.enum(['A', 'B']),
  subject: z.string(),
  instruction: z.string(),
  minWords: z.number(),
  modelAnswer: z.string().optional(),
});

const guidedWritingFeedbackBodySchema = z.object({
  text: z.string().min(1).max(50000),
  section: z.enum(['A', 'B']),
  task: guidedWritingTaskSchema,
});

router.post(
  '/guided-writing-feedback',
  requireAuth,
  guidedWritingFeedbackLimiter,
  validateBody(guidedWritingFeedbackBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { text, section, task } = req.body as z.infer<typeof guidedWritingFeedbackBodySchema>;
    const feedback = await getGuidedWritingFeedbackForUser({
      userId,
      text,
      section,
      task: task as WrittenTask,
    });
    res.json(feedback);
  })
);

router.post(
  '/weak-card',
  requireAuth,
  dailyRitualWeakCardLimiter,
  validateBody(weakCardBodySchema),
  asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId!;
    const { card } = req.body as z.infer<typeof weakCardBodySchema>;
    await appendWeakCard(userId, card as DailyRitualCard);
    res.json({ ok: true });
  })
);

export default router;
