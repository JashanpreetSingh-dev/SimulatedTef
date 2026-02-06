import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { subscriptionService, Subscription, SubscriptionTier } from '../services/subscriptionService';
import { useIsD2C } from '../utils/userType';
import { UsageDashboard } from '../components/subscription/UsageDashboard';
import { SubscriptionOverview } from '../components/subscription/SubscriptionOverview';
import { BillingHistory } from '../components/subscription/BillingHistory';
import { CancelSubscriptionModal } from '../components/subscription/CancelSubscriptionModal';
import { ChangePlanModal } from '../components/subscription/ChangePlanModal';

export function SubscriptionView() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isD2C = useIsD2C();
  
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [tiers, setTiers] = useState<SubscriptionTier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [changePlanTier, setChangePlanTier] = useState<SubscriptionTier | null>(null);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);

  // Check for success/cancel from Stripe redirect
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      // Async function to handle post-checkout logic
      const handleSuccess = async () => {
        // Wait a moment for webhook to process (Stripe webhooks are usually fast but async)
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Reload subscription after successful payment
        await loadSubscription();
        // Reload all data to refresh usage limits
        await loadData();
        // Refresh usage dashboard
        setUsageRefreshKey(prev => prev + 1);
        // Clean URL
        navigate('/subscription', { replace: true });
      };
      
      handleSuccess();
    } else if (canceled === 'true') {
      // Show user-friendly message when checkout is canceled
      setError('Payment process was canceled. You can try again or choose another plan.');
      // Clean URL
      navigate('/subscription', { replace: true });
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    if (isD2C) {
      loadData();
    } else {
      // Redirect B2B users to dashboard
      navigate('/dashboard');
    }
  }, [isD2C, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [sub, tierList] = await Promise.all([
        subscriptionService.getMySubscription(getToken),
        subscriptionService.getSubscriptionTiers(getToken),
      ]);
      setSubscription(sub);
      setTiers(tierList);
    } catch (err: any) {
      console.error('Failed to load subscription data:', err);
      setError(err.message || 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  };

  const loadSubscription = async (retries = 3): Promise<void> => {
    try {
      const sub = await subscriptionService.getMySubscription(getToken);
      setSubscription(sub);
      
      // If we just completed checkout and subscription is still free, retry (webhook might not have processed yet)
      if (retries > 0 && sub && sub.tier === 'free' && sub.status === 'active' && !sub.stripeSubscriptionId) {
        console.log(`Subscription not updated yet, retrying... (${retries} retries left)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return loadSubscription(retries - 1);
      }
    } catch (err: any) {
      console.error('Failed to reload subscription:', err);
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        return loadSubscription(retries - 1);
      }
    }
  };

  const handleUpgrade = async (tier: SubscriptionTier) => {
    // If user has an active subscription, show change plan modal
    if (subscription && subscription.status === 'active' && subscription.tier !== 'free') {
      setChangePlanTier(tier);
      return;
    }

    // Create checkout session - backend will look up price ID from tier if not provided
    try {
      setProcessing(true);
      setError(null);
      const { url } = await subscriptionService.createCheckoutSession(
        getToken, 
        tier.stripePriceId || undefined, // Pass priceId if available
        tier.id // Always pass tierId so backend can look it up if priceId is missing
      );
      if (url) {
        window.location.href = url;
      } else {
        setError('Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Failed to create checkout session:', err);
      // Try to extract a more user-friendly error message
      let errorMessage = 'Failed to start checkout';
      try {
        if (err.message) {
          const errorMatch = err.message.match(/\{"error":"([^"]+)"/);
          if (errorMatch) {
            errorMessage = errorMatch[1];
            // Check if there's a details field
            const detailsMatch = err.message.match(/"details":"([^"]+)"/);
            if (detailsMatch) {
              errorMessage = `${errorMessage}. ${detailsMatch[1]}`;
            }
          } else {
            errorMessage = err.message;
          }
        }
      } catch {
        // Fallback to original error message
        errorMessage = err.message || 'Failed to start checkout';
      }
      setError(errorMessage);
    } finally {
      setProcessing(false);
    }
  };

  const handlePlanChanged = async () => {
    await loadSubscription();
    setChangePlanTier(null);
  };

  const handleSubscriptionCanceled = async () => {
    await loadSubscription();
    setShowCancelModal(false);
  };

  if (!isD2C) {
    return null;
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Loading subscription...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const currentTier = subscription?.tier || 'free';
  const currentTierData = tiers.find(t => t.id === currentTier);

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-sm font-bold transition-colors"
          >
            ← Back to Dashboard
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Subscription & Billing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Manage your subscription, track usage, and upgrade your plan.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Current Subscription Overview */}
        <SubscriptionOverview
          subscription={subscription}
          currentTier={currentTierData}
          onSubscriptionUpdate={loadSubscription}
          onCancelClick={() => setShowCancelModal(true)}
        />

               {/* Usage Dashboard */}
               <div className="mb-8">
                 <UsageDashboard refreshKey={usageRefreshKey} />
               </div>

        {/* Plan Comparison Section */}
        <div className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              Available Plans
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              Choose a plan that fits your learning needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const isCurrentTier = tier.id === currentTier;
              const isUpgrade = tier.id !== 'free' && (currentTier === 'free' || 
                (currentTier === 'basic' && tier.id === 'premium'));
              const isDowngrade = tier.id === 'basic' && currentTier === 'premium';

              return (
                <div
                  key={tier.id}
                  className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border-2 p-6 transition-all ${
                    isCurrentTier
                      ? 'border-indigo-500 dark:border-indigo-400 shadow-xl'
                      : tier.id === 'premium'
                      ? 'border-yellow-400 dark:border-yellow-500'
                      : 'border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-700'
                  }`}
                >
                  <div className="text-center mb-6">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      {tier.name}
                    </h3>
                    {isCurrentTier && (
                      <span className="inline-block px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-semibold">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <div className="space-y-4 mb-6">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Speaking Practice</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tier.limits.sectionALimit === 1 && tier.limits.sectionBLimit === 1 && tier.id === 'free'
                          ? '1 Section A + 1 Section B (total)'
                          : `${tier.limits.sectionALimit} Section A + ${tier.limits.sectionBLimit} Section B / month`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Mock Exams</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {tier.id === 'free'
                          ? '1 (total)'
                          : `${tier.limits.mockExamLimit || 0} / month`}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Written Expression</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {(tier.limits.writtenExpressionSectionALimit ?? 1) === -1 ? 'Unlimited' : `${tier.limits.writtenExpressionSectionALimit ?? 1} Section A + ${tier.limits.writtenExpressionSectionBLimit ?? 1} Section B / month`}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6">
                    {isCurrentTier ? (
                      <button
                        disabled
                        className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-lg cursor-not-allowed font-semibold"
                      >
                        Current Plan
                      </button>
                    ) : tier.id === 'free' ? (
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full px-4 py-2 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors font-semibold"
                      >
                        Free Plan
                      </button>
                  ) : (
                    <button
                      onClick={() => {
                        // If user has active subscription, show change plan modal
                        if (subscription && subscription.status === 'active' && subscription.tier !== 'free') {
                          setChangePlanTier(tier);
                        } else {
                          handleUpgrade(tier);
                        }
                      }}
                      disabled={processing}
                      className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
                    >
                      {processing ? 'Processing...' : isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Select Plan'}
                    </button>
                  )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Billing History */}
        <div className="mb-8">
          <BillingHistory />
        </div>

        {/* Info Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mb-2">
            Need Help?
          </h3>
          <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-4">
            For billing questions or to update your payment method, use the "Manage Billing" button above to access your Stripe customer portal.
          </p>
          <ul className="text-sm text-indigo-800 dark:text-indigo-300 space-y-1 list-disc list-inside">
            <li>All plans include access to all 4 TEF Canada modules</li>
            <li>Usage limits reset on the 1st of each month</li>
            <li>You can upgrade or downgrade your plan at any time</li>
            <li>No credit card required for the free plan</li>
          </ul>
        </div>

        {/* Cancel Subscription Modal */}
        {subscription && (
          <CancelSubscriptionModal
            subscription={subscription}
            isOpen={showCancelModal}
            onClose={() => setShowCancelModal(false)}
            onCanceled={handleSubscriptionCanceled}
          />
        )}

        {/* Change Plan Modal */}
        {changePlanTier && (
          <ChangePlanModal
            currentTier={currentTier}
            targetTier={changePlanTier}
            isOpen={!!changePlanTier}
            onClose={() => setChangePlanTier(null)}
            onChanged={handlePlanChanged}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
