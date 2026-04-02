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
} from '../middleware/rateLimiter';
import { generateDailyDeck } from '../services/dailyRitualService';
import {
  getCachedDeck,
  saveCachedDeck,
  getWeakCardsSummary,
  appendWeakCard,
} from '../services/dailyRitualStorage';
import { dailyRitualCardSchema } from './revisionSchemas';
import type { DailyRitualCard } from '../../types';

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
    });

    await saveCachedDeck(userId, focus, cefrHint, cardCount, cards);
    res.json({ cards, cached: false });
  })
);

const weakCardBodySchema = z.object({
  card: dailyRitualCardSchema,
});

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
