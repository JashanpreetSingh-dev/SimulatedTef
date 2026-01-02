/**
 * Subscription controller - handles subscription and payment logic
 */

import { Request, Response } from 'express';
import Stripe from 'stripe';
import { asyncHandler } from '../middleware/errorHandler';
import { subscriptionService } from '../services/subscriptionService';
import { connectDB } from '../db/connection';
import { Subscription, createSubscription } from '../models/subscription';
import { WebhookEvent, createWebhookEvent } from '../models/webhookEvent';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, { apiVersion: '2025-12-15.clover' }) : null;

export const subscriptionController = {
  /**
   * GET /api/subscription/status
   * Get user's subscription status and usage
   */
  getStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const status = await subscriptionService.getSubscriptionStatus(userId);
    res.json(status);
  }),

  /**
   * POST /api/subscription/checkout
   * Create Stripe Checkout session
   */
  createCheckout: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const { planType } = req.body; // 'starter' | 'examReady'

    if (!planType || !['starter', 'examReady'].includes(planType)) {
      return res.status(400).json({ error: 'Invalid plan type' });
    }

    // Check if user can purchase pack (has active pack warning)
    const packCheck = await subscriptionService.canPurchasePack(userId);
    if (!packCheck.canPurchase) {
      return res.status(400).json({ 
        error: packCheck.reason || 'Cannot purchase pack',
        hasActivePack: packCheck.hasActivePack,
        activePackType: packCheck.activePackType,
        activePackExpiration: packCheck.activePackExpiration,
        activePackCredits: packCheck.activePackCredits,
      });
    }

    const priceIdMap: Record<string, string> = {
      starter: process.env.STRIPE_PRICE_ID_STARTER_PACK || '',
      examReady: process.env.STRIPE_PRICE_ID_EXAM_READY_PACK || '',
    };

    const priceId = priceIdMap[planType];
    if (!priceId) {
      return res.status(500).json({ error: 'Price ID not configured for this plan' });
    }

    // Get or create Stripe customer
    const db = await connectDB();
    const subscription = await db.collection('subscriptions').findOne({ userId }) as unknown as Subscription | null;
    
    let customerId = subscription?.stripeCustomerId;
    
    if (!customerId) {
      // Get user email from Clerk (would need to fetch from Clerk API)
      // For now, create customer without email
      const customer = await stripe.customers.create({
        metadata: { userId },
      });
      customerId = customer.id;
      
      // Update subscription with customer ID
      if (subscription) {
        await db.collection('subscriptions').updateOne(
          { userId },
          { $set: { stripeCustomerId: customerId, updatedAt: new Date().toISOString() } }
        );
      }
    }

    // Create checkout session (all packs are one-time payments)
    // Determine frontend URL from request origin or environment variable
    const getFrontendUrl = () => {
      // Priority: 1. Environment variable, 2. Request origin, 3. Default localhost
      if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
      }
      // Try to get from request origin (for development)
      const origin = req.headers.origin || req.headers.referer;
      if (origin) {
        try {
          const url = new URL(origin);
          return `${url.protocol}//${url.host}`;
        } catch (e) {
          // Invalid URL, fall through to default
        }
      }
      // Default fallback
      return 'http://localhost:3000';
    };
    
    const frontendUrl = getFrontendUrl();
    
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      mode: 'payment', // One-time payment for packs
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${frontendUrl}/dashboard?checkout=success`,
      cancel_url: `${frontendUrl}/dashboard?checkout=cancelled`,
      metadata: {
        userId,
        planType,
        hasActivePack: packCheck.hasActivePack ? 'true' : 'false',
        activePackType: packCheck.activePackType || '',
      },
    };

    const session = await stripe.checkout.sessions.create(sessionParams);

    res.json({
      sessionId: session.id,
      url: session.url,
      checkoutUrl: session.url,
    });
  }),

  /**
   * POST /api/subscription/webhook
   * Handle Stripe webhooks
   * Note: This is NOT wrapped in asyncHandler because it's called directly from server.ts
   * with express.raw() middleware to preserve the raw body for signature verification
   */
  handleWebhook: async (req: Request, res: Response) => {
    if (!stripe) {
      console.error('Webhook: Stripe not configured');
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('Webhook: STRIPE_WEBHOOK_SECRET not set in environment');
      return res.status(500).json({ error: 'Webhook secret not configured' });
    }

      const sig = req.headers['stripe-signature'];
      if (!sig) {
        console.error('Webhook: Missing stripe-signature header');
        return res.status(400).json({ error: 'No signature' });
      }
      
      // Ensure sig is a string (can be string or string[])
      const signature = Array.isArray(sig) ? sig[0] : sig;

    let event: Stripe.Event;
    try {
      // req.body is a Buffer when using express.raw() middleware
      const body = req.body as Buffer;
      if (!body || !Buffer.isBuffer(body)) {
        console.error('Webhook: Body is not a Buffer. Type:', typeof body, 'IsBuffer:', Buffer.isBuffer(body));
        return res.status(400).json({ error: 'Invalid request body format' });
      }
      
      console.log('Webhook: Verifying signature...');
      console.log('   Body length:', body.length, 'bytes');
      console.log('   Signature:', signature.substring(0, 20) + '...');
      console.log('   Secret starts with:', webhookSecret.substring(0, 10) + '...');
      
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
      console.log(`Webhook: Event received - ${event.type} [${event.id}]`);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      console.error('   Webhook secret starts with:', webhookSecret.substring(0, 10) + '...');
      console.error('   Signature header present:', !!sig);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    const db = await connectDB();

    // Check if this event was already processed (idempotency)
    const existingEvent = await db.collection('webhookEvents').findOne({ eventId: event.id }) as unknown as WebhookEvent | null;
    
    if (existingEvent?.processed) {
      console.log(`Webhook: Event ${event.id} already processed, skipping`);
      return res.json({ received: true, message: 'Event already processed' });
    }

    // Mark event as being processed immediately to prevent duplicate processing
    // Use upsert with $setOnInsert to only set if document doesn't exist
    if (!existingEvent) {
      const webhookEvent = createWebhookEvent(event.id, event.type, false);
      const { _id, ...eventToInsert } = webhookEvent;
      await db.collection('webhookEvents').insertOne(eventToInsert as any);
    }

    // Use MongoDB transaction for atomic operations
    const mongoSession = db.client.startSession();
    
    try {
      await mongoSession.withTransaction(async () => {
        // Handle the event
        console.log(`📦 Webhook: Processing event type: ${event.type}`);
        
        switch (event.type) {
          case 'checkout.session.completed': {
            const checkoutSession = event.data.object as Stripe.Checkout.Session;
            const userId = checkoutSession.metadata?.userId;
            const planType = checkoutSession.metadata?.planType;

        if (!userId || !planType) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Pack purchase (starter or examReady)
        if (planType === 'starter' || planType === 'examReady') {
          const packType: 'STARTER_PACK' | 'EXAM_READY_PACK' = planType === 'starter' ? 'STARTER_PACK' : 'EXAM_READY_PACK';
          
          // Pack credits based on type
          const packCredits = {
            STARTER_PACK: {
              fullTests: 5,
              sectionA: 10,
              sectionB: 10,
            },
            EXAM_READY_PACK: {
              fullTests: 20,
              sectionA: 20,
              sectionB: 20,
            },
          };
          
          const credits = packCredits[packType];
          const purchaseDate = new Date();
          const expirationDate = new Date(purchaseDate);
          expirationDate.setDate(expirationDate.getDate() + 30); // 30 days from purchase
          
          // Check if user has active pack (upgrade scenario)
          const existing = await db.collection('subscriptions').findOne(
            { userId },
            { session: mongoSession }
          ) as unknown as Subscription | null;
          
          const hasActivePack = existing?.packType && existing?.packExpirationDate && 
            new Date(existing.packExpirationDate) > new Date();
          
          if (hasActivePack) {
            // Upgrading - replace old pack with new one
            console.warn(`Webhook: User ${userId} is upgrading pack: ${existing.packType} -> ${packType}. Old credits will be lost.`);
          }
          
          // Initialize or update pack within transaction
          if (!existing) {
            // Create new subscription with TRIAL + pack
            const newSub = createSubscription(userId, 'TRIAL', {
              trialStartDate: new Date().toISOString(),
              packType,
              packPurchasedDate: purchaseDate.toISOString(),
              packExpirationDate: expirationDate.toISOString(),
              packFullTestsTotal: credits.fullTests,
              packFullTestsUsed: 0,
              packSectionATotal: credits.sectionA,
              packSectionAUsed: 0,
              packSectionBTotal: credits.sectionB,
              packSectionBUsed: 0,
              stripeCustomerId: checkoutSession.customer as string,
            });
            const { _id, ...subToInsert } = newSub;
            await db.collection('subscriptions').insertOne(subToInsert as any, { session: mongoSession });
          } else {
            // Update existing subscription with pack (replace if upgrading)
            await db.collection('subscriptions').updateOne(
              { userId },
              { 
                $set: {
                  packType,
                  packPurchasedDate: purchaseDate.toISOString(),
                  packExpirationDate: expirationDate.toISOString(),
                  packFullTestsTotal: credits.fullTests,
                  packFullTestsUsed: 0, // Reset on upgrade
                  packSectionATotal: credits.sectionA,
                  packSectionAUsed: 0, // Reset on upgrade
                  packSectionBTotal: credits.sectionB,
                  packSectionBUsed: 0, // Reset on upgrade
                  stripeCustomerId: checkoutSession.customer as string,
                  updatedAt: new Date().toISOString(),
                }
              },
              { session: mongoSession }
            );
          }
          
          console.log(`Webhook: ${hasActivePack ? 'Upgraded' : 'Purchased'} ${packType} for user ${userId}`);
        }
        break;
      }

          // Removed subscription webhook handlers (customer.subscription.*, invoice.payment_succeeded)
          // Packs are one-time payments, no subscription management needed
          default:
            console.log(`Webhook: Unhandled event type: ${event.type}`);
        }
      });

      // Mark webhook event as successfully processed
      await db.collection('webhookEvents').updateOne(
        { eventId: event.id },
        {
          $set: {
            processed: true,
            processedAt: new Date().toISOString(),
          },
        }
      );

      console.log(`Webhook: Successfully processed ${event.type}`);
      res.json({ received: true });
    } catch (error: any) {
      // Mark webhook event as failed
      try {
        await db.collection('webhookEvents').updateOne(
          { eventId: event.id },
          {
            $set: {
              processed: false,
              error: error.message || String(error),
              processedAt: new Date().toISOString(),
            },
          }
        );
      } catch (updateError) {
        console.error('Failed to update webhook event status:', updateError);
      }

      console.error(`Webhook: Failed to process ${event.type}:`, error);
      console.error('   Error details:', {
        message: error.message,
        stack: error.stack,
        eventId: event.id,
        eventType: event.type,
      });
      
      // Return 200 to Stripe to prevent infinite retries
      // We've already marked the event as processed (with error), so Stripe should not retry
      // This prevents infinite loops while still logging the error for investigation
      res.json({ 
        received: true,
        error: 'Webhook processing failed', 
        message: error.message,
        eventId: event.id 
      });
    } finally {
      await mongoSession.endSession();
    }
  },

  /**
   * GET /api/subscription/pack-status
   * Get pack purchase status (for upgrade warnings)
   */
  getPackStatus: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const packCheck = await subscriptionService.canPurchasePack(userId);
    res.json(packCheck);
  }),

  /**
   * GET /api/subscription/manage
   * Get Stripe Customer Portal URL
   */
  getManageUrl: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.userId;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    if (!stripe) {
      return res.status(500).json({ error: 'Stripe not configured' });
    }

    const db = await connectDB();
    const subscription = await db.collection('subscriptions').findOne({ userId }) as unknown as Subscription | null;
    
    if (!subscription?.stripeCustomerId) {
      return res.status(404).json({ error: 'No Stripe customer found' });
    }

    // Determine frontend URL from request origin or environment variable
    const getFrontendUrl = () => {
      if (process.env.FRONTEND_URL) {
        return process.env.FRONTEND_URL;
      }
      const origin = req.headers.origin || req.headers.referer;
      if (origin) {
        try {
          const url = new URL(origin);
          return `${url.protocol}//${url.host}`;
        } catch (e) {
          // Invalid URL, fall through to default
        }
      }
      return 'http://localhost:3000';
    };
    
    const frontendUrl = getFrontendUrl();

    const session = await stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: `${frontendUrl}/dashboard/subscription`,
    });

    res.json({ url: session.url });
  }),
};

