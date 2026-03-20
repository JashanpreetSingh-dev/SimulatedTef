/**
 * Clerk Webhook Handler - handles user lifecycle events (e.g. user.created)
 */

import { Router, Request, Response } from 'express';
import { Webhook } from 'svix';
import { asyncHandler } from '../middleware/errorHandler';
import { enqueueEmailJob } from '../jobs/emailQueue';

const router = Router();

const clerkWebhookSecret = process.env.CLERK_WEBHOOK_SECRET;

if (!clerkWebhookSecret) {
  console.warn('CLERK_WEBHOOK_SECRET not set - Clerk webhooks will be disabled');
}

// GET so you can verify the endpoint is reachable (use your BACKEND URL, not frontend)
router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, message: 'Clerk webhook endpoint; use POST for events' });
});

router.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    if (!clerkWebhookSecret) {
      return res.status(503).json({ error: 'Clerk webhooks not configured' });
    }

    const payload = req.body; // raw body (Buffer) from express.raw()
    const svixId = req.headers['svix-id'] as string | undefined;
    const svixTimestamp = req.headers['svix-timestamp'] as string | undefined;
    const svixSignature = req.headers['svix-signature'] as string | undefined;

    if (!svixId || !svixTimestamp || !svixSignature) {
      return res.status(400).json({ error: 'Missing Svix signature headers' });
    }

    let event: any;
    try {
      const wh = new Webhook(clerkWebhookSecret);
      event = wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });
    } catch (err: any) {
      console.error('Clerk webhook signature verification failed:', err?.message || err);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const eventType = event.type as string;

    if (eventType === 'user.created') {
      const userId = event.data.id as string;
      const email =
        event.data.email_addresses?.[0]?.email_address ??
        event.data.primary_email_address?.email_address ??
        undefined;
      const firstName =
        (event.data.first_name as string | null | undefined) ??
        (event.data.firstName as string | null | undefined) ??
        undefined;

      await enqueueEmailJob({
        templateKind: 'welcome',
        userId,
        email,
        firstName,
      });
    }

    res.json({ received: true });
  })
);

export default router;

