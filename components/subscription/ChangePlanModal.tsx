import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { subscriptionService, SubscriptionTier } from '../../services/subscriptionService';

interface ChangePlanModalProps {
  currentTier: string;
  targetTier: SubscriptionTier;
  isOpen: boolean;
  onClose: () => void;
  onChanged: () => void;
}

export function ChangePlanModal({
  currentTier,
  targetTier,
  isOpen,
  onClose,
  onChanged,
}: ChangePlanModalProps) {
  const { getToken } = useAuth();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proration, setProration] = useState<{
    prorationAmount: number;
    currency: string;
    newPrice: number;
    remainingDays: number;
  } | null>(null);

  useEffect(() => {
    if (isOpen && targetTier.stripePriceId) {
      // Note: We'd need subscription ID to calculate proration
      // For now, we'll show a message that proration will be calculated by Stripe
      setProration(null);
    }
  }, [isOpen, targetTier]);

  if (!isOpen) return null;

  const isUpgrade = targetTier.id !== 'free' && (currentTier === 'free' || 
    (currentTier === 'basic' && targetTier.id === 'premium'));
  const isDowngrade = targetTier.id === 'basic' && currentTier === 'premium';

  const handleChangePlan = async () => {
    if (!targetTier.stripePriceId) {
      setError('This tier is not available for purchase');
      return;
    }

    try {
      setProcessing(true);
      setError(null);
      await subscriptionService.changePlan(getToken, targetTier.stripePriceId, targetTier.id);
      onChanged();
      onClose();
    } catch (err: any) {
      console.error('Failed to change plan:', err);
      setError(err.message || 'Failed to change plan');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          {isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Change'} Plan
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        <div className="mb-6">
          <p className="text-gray-700 dark:text-gray-300 mb-4">
            You're about to {isUpgrade ? 'upgrade' : isDowngrade ? 'downgrade' : 'change'} to the{' '}
            <strong>{targetTier.name}</strong> plan.
          </p>

          <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg mb-4">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-200 mb-2">
              New Plan Features:
            </h3>
            <ul className="text-sm text-indigo-800 dark:text-indigo-300 space-y-1 list-disc list-inside">
              <li>
                {targetTier.limits.sectionALimit === 1 && targetTier.limits.sectionBLimit === 1 && targetTier.id === 'free'
                  ? '1 speaking session (total)'
                  : targetTier.limits.sectionALimit === targetTier.limits.sectionBLimit
                    ? `${targetTier.limits.sectionALimit} speaking sessions per month`
                    : `${targetTier.limits.sectionALimit} Part A, ${targetTier.limits.sectionBLimit} Part B per month`}
              </li>
              <li>
                {targetTier.id === 'free'
                  ? '1 Mock Exam (total)'
                  : `${targetTier.limits.mockExamLimit} Mock Exams per month`}
              </li>
              <li>
                Written Expression: {(targetTier.limits.writtenExpressionSectionALimit ?? 1) === -1
                  ? 'Unlimited'
                  : (targetTier.limits.writtenExpressionSectionALimit ?? 1) === (targetTier.limits.writtenExpressionSectionBLimit ?? 1)
                    ? `${targetTier.limits.writtenExpressionSectionALimit ?? 1} sessions per month`
                    : `${targetTier.limits.writtenExpressionSectionALimit ?? 1} Part A, ${targetTier.limits.writtenExpressionSectionBLimit ?? 1} Part B per month`}
              </li>
            </ul>
          </div>

          {proration && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                <strong>Proration:</strong> You'll be charged a prorated amount for the remaining{' '}
                {proration.remainingDays} days of your billing period. The exact amount will be calculated by Stripe.
              </p>
            </div>
          )}

          {!proration && (isUpgrade || isDowngrade) && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {isUpgrade
                  ? 'You\'ll be charged a prorated amount for the upgrade. The change takes effect immediately.'
                  : 'Your plan will change at the end of your current billing period. You\'ll continue to have access to your current plan features until then.'}
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={processing}
            className="flex-1 px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handleChangePlan}
            disabled={processing || !targetTier.stripePriceId}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {processing ? 'Processing...' : `Confirm ${isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Change'}`}
          </button>
        </div>
      </div>
    </div>
  );
}
