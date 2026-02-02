/**
 * Stripe Service - handles Stripe API operations
 */

import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  console.warn('STRIPE_SECRET_KEY not set - Stripe features will be disabled');
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey, {
  apiVersion: '2025-12-15.clover',
}) : null;

/**
 * Create a Stripe customer
 */
export async function createCustomer(userId: string, email: string): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const customer = await stripe.customers.create({
    email,
    metadata: {
      userId,
    },
  });

  return customer.id;
}

/**
 * Create a Stripe checkout session
 */
export async function createCheckoutSession(
  customerId: string,
  priceId: string,
  userId: string,
  successUrl: string,
  cancelUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    // Try to create checkout session directly - Stripe will validate the price ID
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
      },
    });

    return session.url || '';
  } catch (error: any) {
    // Provide more helpful error messages
    if (error.code === 'resource_missing') {
      const isTestMode = stripeSecretKey?.startsWith('sk_test_');
      
      if (error.message?.includes('price')) {
        // Price not found
        if (isTestMode) {
          throw new Error(`Price ID "${priceId}" not found in your Stripe test mode account. Please verify:
1. The price ID is correct
2. The price exists in your Stripe test mode dashboard
3. The price is active (not archived)
4. You're using the correct Stripe account`);
        } else {
          throw new Error(`Price ID "${priceId}" not found in your Stripe production account. Please verify the price ID is correct and exists in your Stripe dashboard.`);
        }
      } else if (error.message?.includes('customer')) {
        // Customer not found - re-throw so route handler can create a new customer
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Create a Stripe customer portal session
 */
export async function createPortalSession(
  customerId: string,
  returnUrl: string
): Promise<string> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session.url || '';
}

/**
 * Get a subscription from Stripe
 */
export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    return await stripe.subscriptions.retrieve(subscriptionId);
  } catch (error) {
    console.error('Error retrieving subscription:', error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelAtPeriodEnd: boolean = true
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  if (cancelAtPeriodEnd) {
    // Cancel at period end
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  } else {
    // Cancel immediately
    return await stripe.subscriptions.cancel(subscriptionId);
  }
}

/**
 * Update subscription (change tier)
 */
export async function updateSubscription(
  subscriptionId: string,
  priceId: string
): Promise<Stripe.Subscription> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  // Update the subscription item
  return await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    proration_behavior: 'always_invoice', // Prorate the change
  });
}

/**
 * Get invoices for a customer
 */
export async function getInvoices(customerId: string, limit: number = 10): Promise<Stripe.Invoice[]> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: customerId,
      limit,
    });

    return invoices.data;
  } catch (error: any) {
    // If customer doesn't exist, return empty array instead of throwing
    if (error.code === 'resource_missing' && error.message?.includes('customer')) {
      console.warn(`Customer ${customerId} not found in Stripe - returning empty invoice list`);
      return [];
    }
    throw error;
  }
}

/**
 * Get payment method for a customer
 */
export async function getPaymentMethod(customerId: string): Promise<{
  last4?: string;
  brand?: string;
  expMonth?: number;
  expYear?: number;
} | null> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  try {
    const customerResponse = await stripe.customers.retrieve(customerId);

    if (typeof customerResponse === 'string' || customerResponse.deleted) {
      return null;
    }
    const customer = customerResponse as Stripe.Customer;

    // Get default payment method
    if (customer.invoice_settings?.default_payment_method) {
      const paymentMethodId = customer.invoice_settings.default_payment_method;
      if (typeof paymentMethodId === 'string') {
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod.card) {
          return {
            last4: paymentMethod.card.last4,
            brand: paymentMethod.card.brand,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
          };
        }
      }
    }

    // Try to get from subscriptions
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
    });

    if (subscriptions.data.length > 0) {
      const subscription = subscriptions.data[0];
      if (subscription.default_payment_method) {
        const paymentMethodId = typeof subscription.default_payment_method === 'string'
          ? subscription.default_payment_method
          : subscription.default_payment_method.id;
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
        if (paymentMethod.card) {
          return {
            last4: paymentMethod.card.last4,
            brand: paymentMethod.card.brand,
            expMonth: paymentMethod.card.exp_month,
            expYear: paymentMethod.card.exp_year,
          };
        }
      }
    }

    return null;
  } catch (error: any) {
    // If customer doesn't exist, return null instead of throwing
    if (error.code === 'resource_missing' && error.message?.includes('customer')) {
      console.warn(`Customer ${customerId} not found in Stripe - returning null payment method`);
      return null;
    }
    console.error('Error retrieving payment method:', error);
    return null;
  }
}

/**
 * Calculate proration for plan change
 */
export async function calculateProration(
  subscriptionId: string,
  newPriceId: string
): Promise<{
  prorationAmount: number;
  currency: string;
  newPrice: number;
  remainingDays: number;
}> {
  if (!stripe) {
    throw new Error('Stripe is not configured');
  }

  const subscription = (await stripe.subscriptions.retrieve(subscriptionId)) as Stripe.Subscription & { current_period_end?: number };
  const newPrice = await stripe.prices.retrieve(newPriceId);

  // Calculate remaining days in current period
  const now = Math.floor(Date.now() / 1000);
  const periodEnd = subscription.current_period_end ?? now;
  const remainingSeconds = periodEnd - now;
  const remainingDays = Math.ceil(remainingSeconds / (24 * 60 * 60));

  // Calculate proration
  const currentPrice = subscription.items.data[0]?.price;
  if (!currentPrice) {
    throw new Error('Current price not found');
  }

  // Stripe calculates proration automatically, but we can estimate
  // The actual proration will be calculated by Stripe when the subscription is updated
  const prorationAmount = 0; // Will be calculated by Stripe

  return {
    prorationAmount,
    currency: newPrice.currency,
    newPrice: (newPrice.unit_amount || 0) / 100, // Convert from cents
    remainingDays,
  };
}

export const stripeService = {
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  cancelSubscription,
  updateSubscription,
  getInvoices,
  getPaymentMethod,
  calculateProration,
};
