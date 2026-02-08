/**
 * Subscription API routes - manages user subscriptions
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, z } from '../middleware/validate';
import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { stripeService } from '../services/stripeService';
import { createClerkClient } from '@clerk/backend';
import { userUsageService } from '../services/userUsageService';
import { d2cConfigService } from '../services/d2cConfigService';
import { getFreeTierPeriodFromSignup } from '../utils/periodUtils';
import Stripe from 'stripe';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null;

const router = Router();

/** Base URL for Stripe redirects (success/cancel/return). Prefer body/FRONTEND_URL, then request origin. */
function getRedirectBaseUrl(req: Request): string {
  const fromBody = (req.body as { returnBaseUrl?: string })?.returnBaseUrl;
  if (fromBody && typeof fromBody === 'string' && fromBody.startsWith('http')) return fromBody.replace(/\/$/, '');
  if (process.env.FRONTEND_URL) return process.env.FRONTEND_URL.replace(/\/$/, '');
  const origin = req.get('Origin');
  if (origin && origin.startsWith('http')) return origin;
  const referer = req.get('Referer');
  if (referer) {
    try {
      const u = new URL(referer);
      return u.origin;
    } catch {
      // ignore
    }
  }
  return 'http://localhost:5173';
}

// Throttle Stripe sync for GET /me: only sync if last update was more than 5 minutes ago
const STRIPE_SYNC_THROTTLE_MS = 5 * 60 * 1000;

// GET /api/subscriptions/me - Get current user's subscription
router.get('/me', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let subscription = await subscriptionService.getUserSubscription(userId);
  let didSync = false;

  // If subscription exists and has Stripe ID, sync with Stripe only if stale (throttle to avoid rate limits)
  if (subscription && subscription.stripeSubscriptionId) {
    const updatedAt = subscription.updatedAt ? new Date(subscription.updatedAt).getTime() : 0;
    if (Date.now() - updatedAt > STRIPE_SYNC_THROTTLE_MS) {
      subscription = await subscriptionService.syncWithStripe(userId) ?? subscription;
      didSync = true;
    }
  }

  // If no subscription, return minimal free tier (no fake "next billing" date)
  if (!subscription) {
    const nowIso = new Date().toISOString();
    return res.json({
      tier: 'free',
      status: 'active',
      currentPeriodStart: nowIso,
      currentPeriodEnd: nowIso,
      cancelAtPeriodEnd: false,
    });
  }

  // For paid users, overwrite period in response so Billing card matches portal (use synced DB when we just synced to avoid extra Stripe call)
  const isPaidWithStripe = subscription.stripeSubscriptionId && (subscription.status === 'active' || subscription.status === 'trialing');
  if (isPaidWithStripe && subscription.stripeSubscriptionId) {
    let period: { periodStartStr: string; periodEndStr: string } | null = null;
    if (didSync && subscription.currentPeriodStart && subscription.currentPeriodEnd) {
      period = {
        periodStartStr: subscription.currentPeriodStart.split('T')[0],
        periodEndStr: subscription.currentPeriodEnd.split('T')[0],
      };
    }
    if (!period) {
      period = await stripeService.getBillingPeriodFromStripe(subscription.stripeSubscriptionId);
    }
    if (period) {
      const response = { ...subscription };
      response.currentPeriodStart = period.periodStartStr + 'T00:00:00.000Z';
      response.currentPeriodEnd = period.periodEndStr + 'T00:00:00.000Z';
      return res.json(response);
    }
  }

  res.json(subscription);
}));

// POST /api/subscriptions/sync - Force sync with Stripe (e.g. after returning from portal)
router.post('/sync', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let subscription = await subscriptionService.syncWithStripe(userId);

  if (!subscription) {
    return res.json({
      tier: 'free',
      status: 'active',
      currentPeriodStart: new Date().toISOString(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      cancelAtPeriodEnd: false,
    });
  }

  res.json(subscription);
}));

const checkoutSchema = z.object({
  priceId: z.string().optional(),
  tierId: z.string().optional(),
  returnBaseUrl: z.string().optional(),
}).refine((data) => data.priceId || data.tierId, {
  message: 'Price ID or Tier ID is required',
  path: ['priceId'],
});

// POST /api/subscriptions/checkout - Create Stripe checkout session
router.post('/checkout', requireAuth, validateBody(checkoutSchema), asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { priceId, tierId } = req.body;

  // If tierId is provided, get price ID from env only (STRIPE_PRICE_ID_BASIC, STRIPE_PRICE_ID_PREMIUM)
  let finalPriceId = priceId;
  if (!finalPriceId && tierId) {
    finalPriceId = process.env[`STRIPE_PRICE_ID_${tierId.toUpperCase()}`] || undefined;
    if (!finalPriceId) {
      return res.status(400).json({
        error: `Stripe pricing not configured for ${tierId} tier`,
        details: `Set STRIPE_PRICE_ID_${tierId.toUpperCase()} in .env for the ${tierId} plan.`,
      });
    }
  }

  if (!finalPriceId) {
    return res.status(400).json({
      error: 'Price ID or Tier ID is required',
      details: 'Unable to create checkout session. Please contact support.',
    });
  }

  // Get user email from Clerk
  let userEmail = `${userId}@example.com`;
  if (clerkClient) {
    try {
      const user = await clerkClient.users.getUser(userId);
      userEmail = user.emailAddresses[0]?.emailAddress || userEmail;
    } catch (err) {
      console.error('Failed to fetch user email from Clerk:', err);
      // Continue with fallback email
    }
  }

  // Get or create Stripe customer
  let subscription = await subscriptionService.getUserSubscription(userId);
  let customerId: string;

  if (subscription && subscription.stripeCustomerId) {
    // Verify customer exists in Stripe, create new one if it doesn't
    try {
      if (stripe) {
        await stripe.customers.retrieve(subscription.stripeCustomerId);
        customerId = subscription.stripeCustomerId;
      } else {
        throw new Error('Stripe not configured');
      }
    } catch (error: any) {
      // Customer doesn't exist in Stripe (e.g., from different environment or account)
      // Create a new customer
      if (error.code === 'resource_missing') {
        console.warn(`Customer ${subscription.stripeCustomerId} not found in Stripe, creating new customer`);
        customerId = await stripeService.createCustomer(userId, userEmail);
        await subscriptionService.updateSubscription(userId, { stripeCustomerId: customerId });
      } else {
        throw error;
      }
    }
  } else {
    customerId = await stripeService.createCustomer(userId, userEmail);
    // Create or update subscription record with customer ID
    if (subscription) {
      await subscriptionService.updateSubscription(userId, { stripeCustomerId: customerId });
    } else {
      await subscriptionService.createSubscriptionRecord(userId, 'free', { customerId });
    }
  }

  // Create checkout session (redirect back to frontend that initiated checkout)
  const baseUrl = getRedirectBaseUrl(req);
  const successUrl = `${baseUrl}/subscription?success=true`;
  const cancelUrl = `${baseUrl}/subscription?canceled=true`;

  try {
    const checkoutUrl = await stripeService.createCheckoutSession(
      customerId,
      finalPriceId,
      userId,
      successUrl,
      cancelUrl
    );

    res.json({ url: checkoutUrl });
  } catch (error: any) {
    // If customer doesn't exist in Stripe, create a new one and retry
    if (error.code === 'resource_missing' && error.message?.includes('customer')) {
      console.warn(`Customer ${customerId} not found in Stripe during checkout, creating new customer and retrying`);
      try {
        // Create a new customer
        const newCustomerId = await stripeService.createCustomer(userId, userEmail);
        // Update subscription record
        if (subscription) {
          await subscriptionService.updateSubscription(userId, { stripeCustomerId: newCustomerId });
        } else {
          await subscriptionService.createSubscriptionRecord(userId, 'free', { customerId: newCustomerId });
        }
        
        // Retry checkout with new customer
        const checkoutUrl = await stripeService.createCheckoutSession(
          newCustomerId,
          finalPriceId,
          userId,
          successUrl,
          cancelUrl
        );
        
        res.json({ url: checkoutUrl });
        return;
      } catch (retryError: any) {
        console.error('Error retrying checkout with new customer:', retryError);
        res.status(500).json({ 
          error: retryError.message || 'Failed to create checkout session',
          details: retryError.message
        });
        return;
      }
    }
    
    console.error('Error creating checkout session:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to create checkout session',
      details: error.message
    });
  }
}));

// POST /api/subscriptions/portal - Create Stripe customer portal session
router.post('/portal', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const subscription = await subscriptionService.getUserSubscription(userId);
  if (!subscription || !subscription.stripeCustomerId) {
    return res.status(404).json({ error: 'No active subscription found' });
  }

  const baseUrl = getRedirectBaseUrl(req);
  const returnUrl = `${baseUrl}/subscription?portal_return=true`;
  const portalUrl = await stripeService.createPortalSession(subscription.stripeCustomerId, returnUrl);

  res.json({ url: portalUrl });
}));

/** Format Stripe price for display (public and auth tier responses) */
function formatPriceForDisplay(amount: number, currency: string): string {
  const n = amount % 1 === 0 ? amount : Math.round(amount * 100) / 100;
  if (currency === 'usd') return `$${n}`;
  if (currency === 'cad') return `CA$${n}`;
  if (currency === 'eur') return `€${n}`;
  return `${currency.toUpperCase()} ${n}`;
}

// GET /api/subscriptions/tiers/public - Public pricing for landing page (no auth)
router.get('/tiers/public', asyncHandler(async (req: Request, res: Response) => {
  const tiers = await subscriptionService.getSubscriptionTiers();
  const publicTiers = await Promise.all(
    tiers.map(async (tier) => {
      if (tier.id === 'free') {
        return { id: tier.id, name: tier.name, price: '$0', priceSubtext: 'Forever' };
      }
      const priceId = tier.stripePriceId || process.env[`STRIPE_PRICE_ID_${tier.id.toUpperCase()}`];
      if (!priceId) {
        return { id: tier.id, name: tier.name, price: null as string | null, priceSubtext: 'per month' };
      }
      const stripePrice = await stripeService.getPriceDetails(priceId);
      if (!stripePrice) {
        return { id: tier.id, name: tier.name, price: null as string | null, priceSubtext: 'per month' };
      }
      return {
        id: tier.id,
        name: tier.name,
        price: formatPriceForDisplay(stripePrice.amount, stripePrice.currency),
        priceSubtext: stripePrice.interval === 'year' ? 'per year' : 'per month',
      };
    })
  );
  res.json({ tiers: publicTiers });
}));

// GET /api/subscriptions/tiers - Get available subscription tiers (with Stripe price for paid tiers)
router.get('/tiers', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const tiers = await subscriptionService.getSubscriptionTiers();
  const enriched = await Promise.all(
    tiers.map(async (tier) => {
      const priceId = tier.stripePriceId || (tier.id !== 'free' ? process.env[`STRIPE_PRICE_ID_${tier.id.toUpperCase()}`] : undefined);
      if (!priceId) {
        return { ...tier, stripePrice: null };
      }
      const stripePrice = await stripeService.getPriceDetails(priceId);
      return { ...tier, stripePrice };
    })
  );
  res.json(enriched);
}));

// GET /api/subscriptions/usage - Get current billing period usage and limits (subscription-based for D2C paid users, calendar month for free/B2B)
router.get('/usage', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  const orgId = req.orgId || null;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Get limits and usage based on user type
  let usage: {
    sectionAUsed: number;
    sectionBUsed: number;
    writtenExpressionSectionAUsed: number;
    writtenExpressionSectionBUsed: number;
    mockExamsUsed: number;
  };
  let limits: {
    sectionALimit: number;
    sectionBLimit: number;
    writtenExpressionSectionALimit: number;
    writtenExpressionSectionBLimit: number;
    mockExamLimit: number;
  };
  let resetDate: Date;
  let currentPeriod: string; // For display purposes
  let cancelAtPeriodEnd = false;

  if (orgId) {
    // B2B user - use org config and calendar month
    const currentMonth = userUsageService.getCurrentMonth();
    const monthlyUsage = await userUsageService.getUserMonthlyUsage(userId, currentMonth);
    const mockExamUsage = await userUsageService.getUserMonthlyMockExamUsage(userId, currentMonth);
    
    // B2B users don't track written expression usage
    usage = {
      sectionAUsed: monthlyUsage.sectionAUsed,
      sectionBUsed: monthlyUsage.sectionBUsed,
      writtenExpressionSectionAUsed: 0,
      writtenExpressionSectionBUsed: 0,
      mockExamsUsed: mockExamUsage,
    };
    
    const { organizationConfigService } = await import('../services/organizationConfigService');
    const config = await organizationConfigService.getConfig(orgId);
    limits = {
      sectionALimit: config.sectionALimit,
      sectionBLimit: config.sectionBLimit,
      writtenExpressionSectionALimit: -1, // Unlimited for B2B
      writtenExpressionSectionBLimit: -1, // Unlimited for B2B
      mockExamLimit: -1, // Unlimited for B2B
    };
    
    // Calculate reset date (first day of next month)
    const now = new Date();
    resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    currentPeriod = currentMonth;
  } else {
    // D2C user - check subscription billing cycle or calendar month for free tier
    let subscription = await subscriptionService.getUserSubscription(userId);

    // For paid users, sync DB with Stripe and use Stripe as source of truth for period/reset so UI matches portal
    const now = new Date();
    if (
      subscription &&
      subscription.stripeSubscriptionId &&
      (subscription.status === 'active' || subscription.status === 'trialing')
    ) {
      subscription = await subscriptionService.syncWithStripe(userId) ?? subscription;
    }

    // Use period from synced subscription when present (avoids duplicate Stripe retrieve); else fetch from Stripe with retry
    let periodStartStr: string | null = subscription?.currentPeriodStart ? subscription.currentPeriodStart.split('T')[0] : null;
    let periodEndStr: string | null = subscription?.currentPeriodEnd ? subscription.currentPeriodEnd.split('T')[0] : null;
    if (subscription?.stripeSubscriptionId && (!periodStartStr || !periodEndStr)) {
      let period = await stripeService.getBillingPeriodFromStripe(subscription.stripeSubscriptionId);
      if (!period) {
        await new Promise((r) => setTimeout(r, 500));
        period = await stripeService.getBillingPeriodFromStripe(subscription.stripeSubscriptionId);
      }
      if (period) {
        periodStartStr = period.periodStartStr;
        periodEndStr = period.periodEndStr;
      }
      if (!periodStartStr || !periodEndStr) {
        console.warn('Stripe billing period unavailable, using DB fallback', { userId, subscriptionId: subscription.stripeSubscriptionId });
        if (subscription.currentPeriodStart) periodStartStr = subscription.currentPeriodStart.split('T')[0];
        if (subscription.currentPeriodEnd) periodEndStr = subscription.currentPeriodEnd.split('T')[0];
      }
    }

    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing')
        && periodStartStr && periodEndStr) {
      // Paid subscription - billing cycle and reset date from Stripe; effective start resets usage on upgrade (usageCountingFromDate)
      let effectiveStartStr = subscription.usageCountingFromDate || periodStartStr;
      // Include period-start day so usage on upgrade day is visible (same clamp as userUsageService.getEffectivePeriodForSubscription)
      if (effectiveStartStr > periodStartStr) {
        effectiveStartStr = periodStartStr;
      }

      const usageCountingFromTime = (subscription as { usageCountingFromTime?: string }).usageCountingFromTime;
      const periodUsage = await userUsageService.getUserUsageInRange(
        userId,
        effectiveStartStr,
        periodEndStr,
        usageCountingFromTime
      );
      const mockExamUsage = await userUsageService.getUserMockExamUsageInRange(
        userId,
        effectiveStartStr,
        periodEndStr,
        usageCountingFromTime
      );
      const writtenExpressionSectionAUsage = await userUsageService.getUserWrittenExpressionSectionAUsageInRange(
        userId,
        effectiveStartStr,
        periodEndStr,
        usageCountingFromTime
      );
      const writtenExpressionSectionBUsage = await userUsageService.getUserWrittenExpressionSectionBUsageInRange(
        userId,
        effectiveStartStr,
        periodEndStr,
        usageCountingFromTime
      );
      usage = {
        sectionAUsed: periodUsage.sectionAUsed,
        sectionBUsed: periodUsage.sectionBUsed,
        writtenExpressionSectionAUsed: writtenExpressionSectionAUsage,
        writtenExpressionSectionBUsed: writtenExpressionSectionBUsage,
        mockExamsUsed: mockExamUsage,
      };
      const subscriptionLimits = await subscriptionService.getSubscriptionLimits(userId);
      if (subscriptionLimits) {
        limits = subscriptionLimits;
      } else {
        // Fallback to D2C config
        const d2cConfig = await d2cConfigService.getConfig();
        limits = {
          sectionALimit: d2cConfig.sectionALimit,
          sectionBLimit: d2cConfig.sectionBLimit,
          writtenExpressionSectionALimit: d2cConfig.writtenExpressionSectionALimit,
          writtenExpressionSectionBLimit: d2cConfig.writtenExpressionSectionBLimit,
          mockExamLimit: d2cConfig.mockExamLimit,
        };
      }
      
      // Reset date = Stripe current period end (date only, UTC) so it matches Stripe portal exactly
      resetDate = new Date(periodEndStr + 'T00:00:00.000Z');
      currentPeriod = `${periodStartStr} to ${periodEndStr}`;
      cancelAtPeriodEnd = subscription.cancelAtPeriodEnd ?? false;
    } else {
      // Free tier - reset monthly from signup date (same as paid: anniversary-based)
      let periodStart: string;
      let periodEnd: string;
      let signupAnchor: Date | null = null;
      if (clerkClient) {
        try {
          const clerkUser = await clerkClient.users.getUser(userId);
          if (clerkUser.createdAt) signupAnchor = new Date(clerkUser.createdAt);
        } catch {
          // ignore
        }
      }
      if (signupAnchor) {
        await subscriptionService.ensureFreeTierPeriodStart(userId, signupAnchor);
        const { periodStart: start, periodEnd: end } = getFreeTierPeriodFromSignup(signupAnchor);
        periodStart = start.toISOString();
        periodEnd = end.toISOString();
        const periodStartStr = periodStart.split('T')[0];
        const periodEndStr = periodEnd.split('T')[0];
        const sub = await subscriptionService.getUserSubscription(userId);
        const downgradedAt = (sub as { downgradedToFreeAt?: string } | null)?.downgradedToFreeAt;
        const effectiveStartStr = downgradedAt
          ? (downgradedAt.split('T')[0] > periodStartStr ? downgradedAt.split('T')[0] : periodStartStr)
          : periodStartStr;
        const periodUsage = await userUsageService.getUserUsageInRange(userId, effectiveStartStr, periodEndStr);
        const mockExamUsage = await userUsageService.getUserMockExamUsageInRange(userId, effectiveStartStr, periodEndStr);
        const writtenExpressionSectionAUsage = await userUsageService.getUserWrittenExpressionSectionAUsageInRange(userId, effectiveStartStr, periodEndStr);
        const writtenExpressionSectionBUsage = await userUsageService.getUserWrittenExpressionSectionBUsageInRange(userId, effectiveStartStr, periodEndStr);
        usage = {
          sectionAUsed: periodUsage.sectionAUsed,
          sectionBUsed: periodUsage.sectionBUsed,
          writtenExpressionSectionAUsed: writtenExpressionSectionAUsage,
          writtenExpressionSectionBUsed: writtenExpressionSectionBUsage,
          mockExamsUsed: mockExamUsage,
        };
        // Reset is the first day of the next period (day after periodEnd)
        resetDate = new Date(end);
        resetDate.setDate(resetDate.getDate() + 1);
        currentPeriod = `${effectiveStartStr} to ${periodEndStr}`;
      } else {
        // Fallback: calendar month if we can't get signup (e.g. Clerk unavailable)
        const currentMonth = userUsageService.getCurrentMonth();
        const monthlyUsage = await userUsageService.getUserMonthlyUsage(userId, currentMonth);
        const mockExamUsage = await userUsageService.getUserMonthlyMockExamUsage(userId, currentMonth);
        const writtenExpressionSectionAUsage = await userUsageService.getUserMonthlyWrittenExpressionSectionAUsage(userId, currentMonth);
        const writtenExpressionSectionBUsage = await userUsageService.getUserMonthlyWrittenExpressionSectionBUsage(userId, currentMonth);
        usage = {
          sectionAUsed: monthlyUsage.sectionAUsed,
          sectionBUsed: monthlyUsage.sectionBUsed,
          writtenExpressionSectionAUsed: writtenExpressionSectionAUsage,
          writtenExpressionSectionBUsed: writtenExpressionSectionBUsage,
          mockExamsUsed: mockExamUsage,
        };
        const now = new Date();
        resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        currentPeriod = currentMonth;
      }
      // No active subscription - use D2C config (Free tier)
      const d2cConfig = await d2cConfigService.getConfig();
      limits = {
        sectionALimit: d2cConfig.sectionALimit,
        sectionBLimit: d2cConfig.sectionBLimit,
        writtenExpressionSectionALimit: d2cConfig.writtenExpressionSectionALimit,
        writtenExpressionSectionBLimit: d2cConfig.writtenExpressionSectionBLimit,
        mockExamLimit: d2cConfig.mockExamLimit,
      };
    }
  }

  const now = new Date();
  // Use UTC date for "today" so day count matches Stripe portal regardless of server timezone
  const todayUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const daysUntilReset = Math.ceil((resetDate.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24));

  res.json({
    usage: {
      sectionAUsed: usage.sectionAUsed,
      sectionBUsed: usage.sectionBUsed,
      writtenExpressionSectionAUsed: usage.writtenExpressionSectionAUsed,
      writtenExpressionSectionBUsed: usage.writtenExpressionSectionBUsed,
      mockExamsUsed: usage.mockExamsUsed,
    },
    limits,
    currentPeriod,
    resetDate: resetDate.toISOString(),
    daysUntilReset,
    cancelAtPeriodEnd,
  });
}));

// GET /api/subscriptions/payment-method - Get payment method info
router.get('/payment-method', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const subscription = await subscriptionService.getUserSubscription(userId);
  if (!subscription || !subscription.stripeCustomerId) {
    return res.json({ paymentMethod: null });
  }

  try {
    const paymentMethod = await stripeService.getPaymentMethod(subscription.stripeCustomerId);
    res.json({
      paymentMethod: paymentMethod ? {
        last4: paymentMethod.last4,
        brand: paymentMethod.brand,
        expMonth: paymentMethod.expMonth,
        expYear: paymentMethod.expYear,
      } : null,
    });
  } catch (error: any) {
    console.error('Error fetching payment method:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch payment method' });
  }
}));

// POST /api/subscriptions/change-plan - Change subscription tier
router.post('/change-plan', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { priceId, tierId } = req.body;
  if (!priceId || !tierId) {
    return res.status(400).json({ error: 'Price ID and tier ID are required' });
  }

  const subscription = await subscriptionService.getUserSubscription(userId);
  if (!subscription || !subscription.stripeSubscriptionId) {
    return res.status(404).json({ error: 'No active subscription found' });
  }

  try {
    // Calculate proration
    const proration = await stripeService.calculateProration(subscription.stripeSubscriptionId, priceId);

    // Update subscription in Stripe
    await stripeService.updateSubscription(subscription.stripeSubscriptionId, priceId);

    // Update subscription tier in database
    const updatedSubscription = await subscriptionService.updateSubscription(userId, {
      tier: tierId as 'free' | 'basic' | 'premium',
    });

    res.json({
      subscription: updatedSubscription,
      proration,
    });
  } catch (error: any) {
    console.error('Error changing plan:', error);
    res.status(500).json({ error: error.message || 'Failed to change plan' });
  }
}));

export default router;
