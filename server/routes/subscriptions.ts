/**
 * Subscription API routes - manages user subscriptions
 */

import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { asyncHandler } from '../middleware/errorHandler';
import { Request, Response } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { stripeService } from '../services/stripeService';
import { connectDB } from '../db/connection';
import { createClerkClient } from '@clerk/backend';
import { userUsageService } from '../services/userUsageService';
import { d2cConfigService } from '../services/d2cConfigService';
import Stripe from 'stripe';

const clerkSecretKey = process.env.CLERK_SECRET_KEY || '';
const clerkClient = clerkSecretKey ? createClerkClient({ secretKey: clerkSecretKey }) : null;

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null;

const router = Router();

// GET /api/subscriptions/me - Get current user's subscription
router.get('/me', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  let subscription = await subscriptionService.getUserSubscription(userId);
  
  // If subscription exists and has Stripe ID, sync with Stripe
  if (subscription && subscription.stripeSubscriptionId) {
    subscription = await subscriptionService.syncWithStripe(userId);
  }

  // If no subscription, return free tier
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

// POST /api/subscriptions/checkout - Create Stripe checkout session
router.post('/checkout', requireAuth, asyncHandler(async (req: Request, res: Response) => {
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
      details: 'Unable to create checkout session. Please contact support.'
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

  // Create checkout session
  const successUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription?success=true`;
  const cancelUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription?canceled=true`;
  
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

  const returnUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/subscription`;
  const portalUrl = await stripeService.createPortalSession(subscription.stripeCustomerId, returnUrl);

  res.json({ url: portalUrl });
}));

// POST /api/subscriptions/cancel - Cancel subscription
router.post('/cancel', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { cancelAtPeriodEnd = true } = req.body;

  const subscription = await subscriptionService.cancelSubscription(userId, cancelAtPeriodEnd);
  res.json(subscription);
}));

// GET /api/subscriptions/tiers - Get available subscription tiers
router.get('/tiers', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const tiers = await subscriptionService.getSubscriptionTiers();
  res.json(tiers);
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
    
    // B2B users don't track written expression usage
    usage = {
      sectionAUsed: monthlyUsage.sectionAUsed,
      sectionBUsed: monthlyUsage.sectionBUsed,
      writtenExpressionSectionAUsed: 0,
      writtenExpressionSectionBUsed: 0,
      mockExamsUsed: mockExamUsage,
    };
    
    // Calculate reset date (first day of next month)
    const now = new Date();
    resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    currentPeriod = currentMonth;
  } else {
    // D2C user - check subscription billing cycle or calendar month for free tier
    const subscription = await subscriptionService.getUserSubscription(userId);
    
    if (subscription && (subscription.status === 'active' || subscription.status === 'trialing') 
        && subscription.currentPeriodStart && subscription.currentPeriodEnd) {
      // Paid subscription - use billing cycle
      const periodUsage = await userUsageService.getUserUsageInRange(
        userId,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
      );
      const mockExamUsage = await userUsageService.getUserMockExamUsageInRange(
        userId,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
      );
      
      const writtenExpressionSectionAUsage = await userUsageService.getUserWrittenExpressionSectionAUsageInRange(
        userId,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
      );
      const writtenExpressionSectionBUsage = await userUsageService.getUserWrittenExpressionSectionBUsageInRange(
        userId,
        subscription.currentPeriodStart,
        subscription.currentPeriodEnd
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
      
      // Reset date is the end of the current billing period
      resetDate = new Date(subscription.currentPeriodEnd);
      currentPeriod = `${new Date(subscription.currentPeriodStart).toISOString().split('T')[0]} to ${new Date(subscription.currentPeriodEnd).toISOString().split('T')[0]}`;
    } else {
      // Free tier - use calendar month
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
      
      // No active subscription - use D2C config (Free tier)
      const d2cConfig = await d2cConfigService.getConfig();
      limits = {
        sectionALimit: d2cConfig.sectionALimit,
        sectionBLimit: d2cConfig.sectionBLimit,
        writtenExpressionSectionALimit: d2cConfig.writtenExpressionSectionALimit,
        writtenExpressionSectionBLimit: d2cConfig.writtenExpressionSectionBLimit,
        mockExamLimit: d2cConfig.mockExamLimit,
      };
      
      // Calculate reset date (first day of next month)
      const now = new Date();
      resetDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      currentPeriod = currentMonth;
    }
  }

  const now = new Date();
  const daysUntilReset = Math.ceil((resetDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

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
  });
}));

// GET /api/subscriptions/billing-history - Get invoices from Stripe
router.get('/billing-history', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const subscription = await subscriptionService.getUserSubscription(userId);
  if (!subscription || !subscription.stripeCustomerId) {
    return res.json({ invoices: [], paymentMethod: null });
  }

  try {
    const invoices = await stripeService.getInvoices(subscription.stripeCustomerId, 20);
    const paymentMethod = await stripeService.getPaymentMethod(subscription.stripeCustomerId);

    // Format invoices for frontend
    const formattedInvoices = invoices.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      amount: invoice.amount_paid / 100, // Convert from cents
      currency: invoice.currency.toUpperCase(),
      status: invoice.status,
      date: new Date(invoice.created * 1000).toISOString(),
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      invoicePdf: invoice.invoice_pdf,
    }));

    res.json({
      invoices: formattedInvoices,
      paymentMethod: paymentMethod ? {
        last4: paymentMethod.last4,
        brand: paymentMethod.brand,
        expMonth: paymentMethod.expMonth,
        expYear: paymentMethod.expYear,
      } : null,
    });
  } catch (error: any) {
    // If customer doesn't exist in Stripe (e.g., created in different environment), return empty
    if (error.code === 'resource_missing' && error.message?.includes('customer')) {
      console.warn(`Customer ${subscription.stripeCustomerId} not found in Stripe - returning empty billing history`);
      return res.json({ invoices: [], paymentMethod: null });
    }
    console.error('Error fetching billing history:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch billing history' });
  }
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
