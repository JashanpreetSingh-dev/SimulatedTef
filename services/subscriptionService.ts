/**
 * Subscription Service - Frontend service for subscription API calls
 */

import { authenticatedFetchJSON } from './authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface Subscription {
  _id?: string;
  userId: string;
  tier: 'free' | 'basic' | 'premium';
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing' | 'incomplete';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SubscriptionTier {
  _id?: string;
  id: 'free' | 'basic' | 'premium';
  name: string;
  limits: {
    sectionALimit: number;
    sectionBLimit: number;
    writtenExpressionSectionALimit?: number;
    writtenExpressionSectionBLimit?: number;
    mockExamLimit?: number;
  };
  stripePriceId?: string;
}

export const subscriptionService = {
  /**
   * Get current user's subscription
   */
  async getMySubscription(
    getToken: () => Promise<string | null>
  ): Promise<Subscription> {
    const url = `${BACKEND_URL}/api/subscriptions/me`;
    return authenticatedFetchJSON<Subscription>(url, {
      method: 'GET',
      getToken: getToken,
    });
  },

  /**
   * Create Stripe checkout session
   */
  async createCheckoutSession(
    getToken: () => Promise<string | null>,
    priceId?: string,
    tierId?: 'free' | 'basic' | 'premium'
  ): Promise<{ url: string }> {
    const url = `${BACKEND_URL}/api/subscriptions/checkout`;
    const returnBaseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    return authenticatedFetchJSON<{ url: string }>(url, {
      method: 'POST',
      getToken: getToken,
      body: JSON.stringify({ priceId, tierId, returnBaseUrl }),
    });
  },

  /**
   * Create Stripe customer portal session
   */
  async createPortalSession(
    getToken: () => Promise<string | null>
  ): Promise<{ url: string }> {
    const url = `${BACKEND_URL}/api/subscriptions/portal`;
    const returnBaseUrl = typeof window !== 'undefined' ? window.location.origin : undefined;
    return authenticatedFetchJSON<{ url: string }>(url, {
      method: 'POST',
      getToken: getToken,
      body: JSON.stringify({ returnBaseUrl }),
    });
  },

  /**
   * Get available subscription tiers
   */
  async getSubscriptionTiers(
    getToken: () => Promise<string | null>
  ): Promise<SubscriptionTier[]> {
    const url = `${BACKEND_URL}/api/subscriptions/tiers`;
    return authenticatedFetchJSON<SubscriptionTier[]>(url, {
      method: 'GET',
      getToken: getToken,
    });
  },

  /**
   * Get current month usage and limits
   */
  async getUsage(
    getToken: () => Promise<string | null>
  ): Promise<{
    usage: {
      sectionAUsed: number;
      sectionBUsed: number;
      mockExamsUsed: number;
      writtenExpressionSectionAUsed?: number;
      writtenExpressionSectionBUsed?: number;
    };
    limits: {
      sectionALimit: number;
      sectionBLimit: number;
      writtenExpressionSectionALimit?: number;
      writtenExpressionSectionBLimit?: number;
      mockExamLimit: number;
    };
    currentMonth?: string;
    currentPeriod?: string;
    resetDate: string;
    daysUntilReset: number;
  }> {
    const url = `${BACKEND_URL}/api/subscriptions/usage`;
    return authenticatedFetchJSON(url, {
      method: 'GET',
      getToken: getToken,
    });
  },

  /**
   * Change subscription plan
   */
  async changePlan(
    getToken: () => Promise<string | null>,
    priceId: string,
    tierId: 'free' | 'basic' | 'premium'
  ): Promise<{
    subscription: Subscription;
    proration: {
      prorationAmount: number;
      currency: string;
      newPrice: number;
      remainingDays: number;
    };
  }> {
    const url = `${BACKEND_URL}/api/subscriptions/change-plan`;
    return authenticatedFetchJSON(url, {
      method: 'POST',
      getToken: getToken,
      body: JSON.stringify({ priceId, tierId }),
    });
  },
};
