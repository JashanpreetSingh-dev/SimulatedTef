/**
 * Email unsubscribe endpoint — no auth required, HMAC token-based.
 *
 * Token format: v1.<hmac-sha256-hex>
 * HMAC key: process.env.EMAIL_UNSUBSCRIBE_SECRET
 * HMAC message: userId
 *
 * Usage in emails: /api/unsubscribe?userId=<userId>&token=<token>
 */

import { Router, Request, Response } from 'express';
import { createHmac, timingSafeEqual } from 'crypto';
import { connectDB } from '../db/connection';
import rateLimit from 'express-rate-limit';

const router = Router();

const unsubscribeLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false });

export function createUnsubscribeToken(userId: string): string {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret) throw new Error('EMAIL_UNSUBSCRIBE_SECRET is not set');
  const hmac = createHmac('sha256', secret).update(userId).digest('hex');
  return `v1.${hmac}`;
}

function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const secret = process.env.EMAIL_UNSUBSCRIBE_SECRET;
  if (!secret) return false;
  if (!token.startsWith('v1.')) return false;
  const expected = createHmac('sha256', secret).update(userId).digest('hex');
  const provided = token.slice(3); // strip "v1."
  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(provided, 'hex'));
  } catch {
    return false;
  }
}

// POST /api/unsubscribe?userId=<id>&token=<token>
router.post('/', unsubscribeLimiter, async (req: Request, res: Response) => {
  const userId = (req.query.userId ?? req.body?.userId) as string | undefined;
  const token = (req.query.token ?? req.body?.token) as string | undefined;

  if (!userId || !token) {
    return res.status(400).json({ error: 'Missing userId or token' });
  }

  if (!verifyUnsubscribeToken(userId, token)) {
    return res.status(401).json({ error: 'Invalid unsubscribe token' });
  }

  try {
    const db = await connectDB();
    await db.collection('emailPreferences').updateOne(
      { userId },
      { $set: { userId, unsubscribedAt: new Date().toISOString(), source: 'link' } },
      { upsert: true }
    );
    res.json({ ok: true, message: 'You have been unsubscribed from Akseli emails.' });
  } catch (err: any) {
    console.error('Unsubscribe error:', err);
    res.status(500).json({ error: 'Failed to process unsubscribe request' });
  }
});

// GET /api/unsubscribe — render a simple confirmation page
router.get('/', unsubscribeLimiter, async (req: Request, res: Response) => {
  const userId = req.query.userId as string | undefined;
  const token = req.query.token as string | undefined;

  if (!userId || !token || !verifyUnsubscribeToken(userId, token)) {
    return res.status(400).send('<p>Lien de désabonnement invalide.</p>');
  }

  try {
    const db = await connectDB();
    await db.collection('emailPreferences').updateOne(
      { userId },
      { $set: { userId, unsubscribedAt: new Date().toISOString(), source: 'link' } },
      { upsert: true }
    );
    res.send(`
      <!DOCTYPE html>
      <html lang="fr">
      <head><meta charset="UTF-8"><title>Désabonnement — Akseli</title></head>
      <body style="font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#1e293b">
        <h1 style="font-size:1.5rem">Vous avez été désabonné(e)</h1>
        <p>Vous ne recevrez plus d'emails promotionnels d'Akseli.</p>
        <p style="margin-top:2rem"><a href="/" style="color:#6366f1">Retour à Akseli</a></p>
      </body>
      </html>
    `);
  } catch (err: any) {
    console.error('Unsubscribe GET error:', err);
    res.status(500).send('<p>Une erreur est survenue. Veuillez réessayer.</p>');
  }
});

export default router;
