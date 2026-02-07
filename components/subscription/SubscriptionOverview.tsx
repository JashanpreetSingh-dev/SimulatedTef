import React, { useState } from 'react';
import { Subscription, SubscriptionTier } from '../../services/subscriptionService';
import { subscriptionService } from '../../services/subscriptionService';
import { useAuth } from '@clerk/clerk-react';

interface SubscriptionOverviewProps {
  subscription: Subscription | null;
  currentTier: SubscriptionTier | undefined;
  onSubscriptionUpdate: () => void;
}

export function SubscriptionOverview({ subscription, currentTier, onSubscriptionUpdate }: SubscriptionOverviewProps) {
  const { getToken } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleManageBilling = async () => {
    try {
      setProcessing(true);
      setError(null);
      const { url } = await subscriptionService.createPortalSession(getToken);
      if (url) {
        window.location.href = url;
      } else {
        setError('Failed to open customer portal');
      }
    } catch (err: any) {
      console.error('Failed to open customer portal:', err);
      setError(err.message || 'Failed to open customer portal');
    } finally {
      setProcessing(false);
    }
  };

  // Use UTC so period end date matches Stripe (Stripe timestamps are UTC)
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  const getStatusBadgeColor = (status: string): string => {
    switch (status) {
      case 'active':
        return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
      case 'canceled':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'past_due':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'trialing':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (!subscription) {
    return null;
  }

  const isFreeTier = subscription.tier === 'free';
  const isPaidTier = !isFreeTier && subscription.status === 'active';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 border-indigo-500 dark:border-indigo-400 p-6 mb-6">
      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {currentTier?.name || subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan
            </h2>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${getStatusBadgeColor(subscription.status)}`}>
              {subscription.status}
            </span>
          </div>

          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {subscription.cancelAtPeriodEnd && (
              <p className="text-yellow-600 dark:text-yellow-400 font-semibold">
                ⚠️ Subscription will cancel on {formatDate(subscription.currentPeriodEnd)}
              </p>
            )}
            {isFreeTier && (
              <p className="text-gray-500 dark:text-gray-400">
                Free tier - Upgrade anytime to unlock more features
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {isPaidTier && (
            <>
              <button
                onClick={handleManageBilling}
                disabled={processing}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
              >
                {processing ? 'Loading...' : 'Manage Billing'}
              </button>
            </>
          )}
          {isFreeTier && (
            <button
              onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
            >
              View Plans
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
