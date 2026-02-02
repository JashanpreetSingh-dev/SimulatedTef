/**
 * Stripe Webhook Handler - handles Stripe webhook events
 */

import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import type { Document } from 'mongodb';
import { asyncHandler } from '../middleware/errorHandler';
import { subscriptionService } from '../services/subscriptionService';
import { connectDB } from '../db/connection';
import { createWebhookEvent } from '../models/webhookEvent';

const router = Router();

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not set - Stripe webhooks will be disabled');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null;

/** Subscription with billing period fields (SDK Subscription type may omit these in some API versions) */
type SubscriptionWithPeriod = Stripe.Subscription & { current_period_start?: number; current_period_end?: number };

/** Map Stripe price ID to tier id using env only (STRIPE_PRICE_ID_BASIC, STRIPE_PRICE_ID_PREMIUM). */
function getTierIdFromPriceId(priceId: string | undefined): 'basic' | 'premium' | null {
  if (!priceId) return null;
  if (priceId === process.env.STRIPE_PRICE_ID_BASIC) return 'basic';
  if (priceId === process.env.STRIPE_PRICE_ID_PREMIUM) return 'premium';
  return null;
}

// Stripe webhook endpoint (must be raw body, not JSON parsed)
router.post('/', asyncHandler(async (req: Request, res: Response) => {
  if (!stripe || !webhookSecret) {
    return res.status(503).json({ error: 'Stripe webhooks not configured' });
  }

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    return res.status(400).json({ error: 'No signature provided' });
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  // Check for idempotency - prevent duplicate processing
  const db = await connectDB();
  const webhookEventsCollection = db.collection('webhookEvents');
  const existingEvent = await webhookEventsCollection.findOne({ eventId: event.id });
  
  if (existingEvent) {
    console.log(`Webhook event ${event.id} (${event.type}) already processed. Skipping.`);
    return res.json({ received: true, alreadyProcessed: true });
  }

  // Record webhook event for idempotency
  const webhookEvent = createWebhookEvent(event.id, event.type, false);
  await webhookEventsCollection.insertOne({
    ...webhookEvent,
    eventData: event.data.object,
  } as Document);

  // Handle the event
  try {
    switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      await handleCheckoutCompleted(session);
      break;
    }

    case 'customer.subscription.created': {
      const subscription = event.data.object as SubscriptionWithPeriod;
      await handleSubscriptionCreated(subscription);
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as SubscriptionWithPeriod;
      await handleSubscriptionUpdated(subscription);
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      await handleSubscriptionDeleted(subscription);
      break;
    }

    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentSucceeded(invoice);
      break;
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      await handlePaymentFailed(invoice);
      break;
    }

      default: {
        // Expected Stripe events we don't need to handle (subscription/invoice lifecycle covered above)
        const expectedUnhandled = new Set([
          'charge.succeeded', 'payment_method.attached', 'customer.updated',
          'payment_intent.succeeded', 'payment_intent.created',
          'invoice.created', 'invoice.finalized', 'invoice.paid', 'invoice_payment.paid',
        ]);
        if (!expectedUnhandled.has(event.type)) {
          console.log(`Unhandled event type: ${event.type}`);
        }
        break;
      }
    }

    // Mark event as processed
    await webhookEventsCollection.updateOne(
      { eventId: event.id },
      { $set: { processed: true, processedAt: new Date().toISOString() } }
    );

    res.json({ received: true });
  } catch (error: any) {
    console.error(`Error processing webhook event ${event.id} (${event.type}):`, error);
    
    // Mark event as failed
    await webhookEventsCollection.updateOne(
      { eventId: event.id },
      { 
        $set: { 
          processed: false, 
          error: error.message,
          processedAt: new Date().toISOString() 
        } 
      }
    );
    
    // Still return 200 to Stripe (we've logged the error)
    res.status(500).json({ received: true, error: 'Failed to process webhook' });
  }
}));

/**
 * Handle checkout.session.completed event
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.userId;
  if (!userId) {
    console.error('No userId in checkout session metadata');
    return;
  }

  const subscriptionId = session.subscription as string;
  if (!subscriptionId) {
    console.error('No subscription ID in checkout session');
    return;
  }

  // Get subscription from Stripe to determine tier
  if (!stripe) return;
  const stripeSubscription = (await stripe.subscriptions.retrieve(subscriptionId)) as SubscriptionWithPeriod;
  const priceId = stripeSubscription.items.data[0]?.price.id;
  const tierId = getTierIdFromPriceId(priceId);
  if (!tierId) {
    console.error(`Tier not found for price ID: ${priceId}. Set STRIPE_PRICE_ID_BASIC or STRIPE_PRICE_ID_PREMIUM in .env.`);
    return;
  }

  const db = await connectDB();
  const tier = await db.collection('subscriptionTiers').findOne({ id: tierId });
  if (!tier) {
    console.error(`Subscription tier "${tierId}" not found in database. Run npm run migrate-subscriptions.`);
    return;
  }

  // Create or update subscription record
  const existing = await subscriptionService.getUserSubscription(userId);
  
  // Map Stripe status to our status
  // Important: If cancel_at_period_end is true but status is still 'active',
  // keep status as 'active' - user retains access until period ends
  let status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' = 'active';
  if (stripeSubscription.status === 'active') {
    // Even if cancel_at_period_end is true, status remains 'active' until period ends
    status = 'active';
  } else if (stripeSubscription.status === 'canceled') {
    status = 'canceled';
  } else if (stripeSubscription.status === 'past_due') {
    status = 'past_due';
  } else if (stripeSubscription.status === 'trialing') {
    status = 'trialing';
  } else if (stripeSubscription.status === 'incomplete' || stripeSubscription.status === 'incomplete_expired') {
    status = 'incomplete';
  }
  
  // Validate and convert period dates (Stripe timestamps are in seconds)
  const periodStart = stripeSubscription.current_period_start != null
    ? new Date(stripeSubscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const periodEnd = stripeSubscription.current_period_end != null
    ? new Date(stripeSubscription.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(); // Default to 30 days if missing
  
  if (existing) {
    await subscriptionService.updateSubscription(userId, {
      tier: tier.id,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
    });
  } else {
    // Create new subscription record
    await subscriptionService.createSubscriptionRecord(userId, tier.id, {
      customerId: session.customer as string,
      subscriptionId: subscriptionId,
    });
    // Update with correct status and period dates from Stripe
    await subscriptionService.updateSubscription(userId, {
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end || false,
    });
  }
  
  console.log(`✅ Checkout completed for user ${userId}, tier ${tier.id}, status ${status}`);
}

/**
 * Handle customer.subscription.created event
 */
async function handleSubscriptionCreated(subscription: SubscriptionWithPeriod) {
  const customerId = subscription.customer as string;
  
  if (!stripe) return;
  
  // Get customer to find userId from metadata
  const customerResponse = await stripe.customers.retrieve(customerId);
  if (typeof customerResponse === 'string' || customerResponse.deleted) {
    console.error(`Customer ${customerId} not found or deleted`);
    return;
  }
  const customer = customerResponse as Stripe.Customer;
  const userId = customer.metadata?.userId;
  if (!userId) {
    console.error(`No userId in customer metadata for subscription: ${subscription.id}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tierId = getTierIdFromPriceId(priceId);
  if (!tierId) {
    console.error(`Tier not found for price ID: ${priceId} in subscription.created. Set STRIPE_PRICE_ID_BASIC or STRIPE_PRICE_ID_PREMIUM in .env.`);
    return;
  }

  const db = await connectDB();
  const tier = await db.collection('subscriptionTiers').findOne({ id: tierId });
  if (!tier) {
    console.error(`Subscription tier "${tierId}" not found in database. Run npm run migrate-subscriptions.`);
    return;
  }

  // Map Stripe status to our status
  // Important: If cancel_at_period_end is true but status is still 'active',
  // keep status as 'active' - user retains access until period ends
  let status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' = 'active';
  if (subscription.status === 'active') {
    // Even if cancel_at_period_end is true, status remains 'active' until period ends
    status = 'active';
  } else if (subscription.status === 'canceled') {
    status = 'canceled';
  } else if (subscription.status === 'past_due') {
    status = 'past_due';
  } else if (subscription.status === 'trialing') {
    status = 'trialing';
  } else if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    status = 'incomplete';
  }

  // Validate and convert period dates (Stripe timestamps are in seconds)
  const periodStart = subscription.current_period_start != null
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const periodEnd = subscription.current_period_end != null
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const existing = await subscriptionService.getUserSubscription(userId);
  if (existing) {
    await subscriptionService.updateSubscription(userId, {
      tier: tier.id,
      stripeCustomerId: customerId,
      stripeSubscriptionId: subscription.id,
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    });
  } else {
    await subscriptionService.createSubscriptionRecord(userId, tier.id, {
      customerId: customerId,
      subscriptionId: subscription.id,
    });
    await subscriptionService.updateSubscription(userId, {
      status,
      currentPeriodStart: periodStart,
      currentPeriodEnd: periodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
    });
  }
  console.log(`✅ Subscription created for user ${userId}, tier ${tier.id}, status ${status}`);
}

/**
 * Handle customer.subscription.updated event
 */
async function handleSubscriptionUpdated(subscription: SubscriptionWithPeriod) {
  const customerId = subscription.customer as string;
  
  // Find user by customer ID
  const db = await connectDB();
  const userSubscription = await db.collection('subscriptions').findOne({
    stripeCustomerId: customerId,
  });

  if (!userSubscription) {
    console.error(`Subscription not found for customer: ${customerId}`);
    return;
  }

  const priceId = subscription.items.data[0]?.price.id;
  const tierId = getTierIdFromPriceId(priceId);
  const tier = tierId ? await db.collection('subscriptionTiers').findOne({ id: tierId }) : null;

  // Map Stripe status to our status
  // Important: If cancel_at_period_end is true but status is still 'active',
  // keep status as 'active' - user retains access until period ends
  let status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete' = 'active';
  if (subscription.status === 'active') {
    // Even if cancel_at_period_end is true, status remains 'active' until period ends
    status = 'active';
  } else if (subscription.status === 'canceled') {
    status = 'canceled';
  } else if (subscription.status === 'past_due') {
    status = 'past_due';
  } else if (subscription.status === 'trialing') {
    status = 'trialing';
  } else if (subscription.status === 'incomplete' || subscription.status === 'incomplete_expired') {
    status = 'incomplete';
  }

  // Validate and convert period dates (Stripe timestamps are in seconds)
  const periodStart = subscription.current_period_start != null
    ? new Date(subscription.current_period_start * 1000).toISOString()
    : new Date().toISOString();
  const periodEnd = subscription.current_period_end != null
    ? new Date(subscription.current_period_end * 1000).toISOString()
    : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  await subscriptionService.updateSubscription(userSubscription.userId, {
    tier: tier?.id || userSubscription.tier,
    status,
    currentPeriodStart: periodStart,
    currentPeriodEnd: periodEnd,
    cancelAtPeriodEnd: subscription.cancel_at_period_end || false,
  });
}

/**
 * Handle customer.subscription.deleted event
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  
  const db = await connectDB();
  const userSubscription = await db.collection('subscriptions').findOne({
    stripeCustomerId: customerId,
  });

  if (!userSubscription) {
    console.error(`Subscription not found for customer: ${customerId}`);
    return;
  }

  // Downgrade to free tier
  await subscriptionService.updateSubscription(userSubscription.userId, {
    tier: 'free',
    status: 'canceled',
    cancelAtPeriodEnd: false,
  });
}

/**
 * Handle invoice.payment_succeeded event
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  // Subscription is already active, just sync status
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string }).subscription as string | undefined;
  if (subscriptionId && stripe) {
    const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as SubscriptionWithPeriod;
    await handleSubscriptionUpdated(subscription);
  }
}

/**
 * Handle invoice.payment_failed event
 */
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const subscriptionId = (invoice as Stripe.Invoice & { subscription?: string }).subscription as string | undefined;
  if (subscriptionId && stripe) {
    const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as SubscriptionWithPeriod;
    await handleSubscriptionUpdated(subscription);
  }
}

export default router;
