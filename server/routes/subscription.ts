/**
 * Subscription API routes
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { subscriptionController } from '../controllers/subscriptionController';

const router = Router();

// Debug route to verify router is loaded (remove in production)
router.get('/ping', (req, res) => {
  res.json({ message: 'Subscription routes are loaded', timestamp: new Date().toISOString() });
});

// GET /api/subscription/status - Get user's subscription status
router.get('/status', requireAuth, subscriptionController.getStatus);

// POST /api/subscription/checkout - Create Stripe Checkout session
router.post('/checkout', requireAuth, subscriptionController.createCheckout);

// Note: Webhook route is handled directly in server.ts to ensure raw body parsing
// POST /api/subscription/webhook - Handle Stripe webhooks (no auth required)

// GET /api/subscription/manage - Get Stripe Customer Portal URL
router.get('/manage', requireAuth, subscriptionController.getManageUrl);

// GET /api/subscription/pack-status - Get pack purchase status (for upgrade warnings)
router.get('/pack-status', requireAuth, subscriptionController.getPackStatus);

export default router;

