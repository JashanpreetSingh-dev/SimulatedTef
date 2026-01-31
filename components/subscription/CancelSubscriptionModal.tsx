import React, { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { subscriptionService, Subscription } from '../../services/subscriptionService';

interface CancelSubscriptionModalProps {
  subscription: Subscription;
  isOpen: boolean;
  onClose: () => void;
  onCanceled: () => void;
}

export function CancelSubscriptionModal({
  subscription,
  isOpen,
  onClose,
  onCanceled,
}: CancelSubscriptionModalProps) {
  const { getToken } = useAuth();
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCancel = async () => {
    try {
      setProcessing(true);
      setError(null);
      await subscriptionService.cancelSubscription(getToken, cancelAtPeriodEnd);
      onCanceled();
      onClose();
    } catch (err: any) {
      console.error('Failed to cancel subscription:', err);
      setError(err.message || 'Failed to cancel subscription');
    } finally {
      setProcessing(false);
    }
  };

  // Use UTC so period end date matches Stripe Dashboard (Stripe timestamps are UTC)
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      timeZone: 'UTC',
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Cancel Subscription
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your billing period.
          </p>

          {subscription.currentPeriodEnd && (
            <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Current billing period ends:</strong> {formatDate(subscription.currentPeriodEnd)}
              </p>
            </div>
          )}

          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                checked={cancelAtPeriodEnd}
                onChange={() => setCancelAtPeriodEnd(true)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Cancel at period end (Recommended)
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Continue using premium features until {subscription.currentPeriodEnd ? formatDate(subscription.currentPeriodEnd) : 'the end of your billing period'}.
                  You'll be downgraded to the free plan after that.
                </div>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="radio"
                checked={!cancelAtPeriodEnd}
                onChange={() => setCancelAtPeriodEnd(false)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold text-gray-900 dark:text-white">
                  Cancel immediately
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cancel now and lose access to premium features immediately. You won't be charged for the remaining period.
                </div>
              </div>
            </label>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Keep Subscription
          </button>
          <button
            onClick={handleCancel}
            disabled={processing}
            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {processing ? 'Canceling...' : 'Cancel Subscription'}
          </button>
        </div>
      </div>
    </div>
  );
}
