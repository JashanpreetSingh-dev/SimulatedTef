import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { subscriptionService, Subscription, SubscriptionTier } from '../services/subscriptionService';
import { useIsD2C } from '../utils/userType';
import { UsageDashboard } from '../components/subscription/UsageDashboard';
import { SubscriptionOverview } from '../components/subscription/SubscriptionOverview';
import { ChangePlanModal } from '../components/subscription/ChangePlanModal';
import activePromo from '../config/promoConfig';

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
  const [changePlanTier, setChangePlanTier] = useState<SubscriptionTier | null>(null);
  const [usageRefreshKey, setUsageRefreshKey] = useState(0);

  // Check for success/cancel from Stripe redirect, or return from customer portal
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const portalReturn = searchParams.get('portal_return');

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
        setUsageRefreshKey((prev) => prev + 1);
        // Clean URL
        navigate('/subscription', { replace: true });
      };

      handleSuccess();
    } else if (canceled === 'true') {
      // Show user-friendly message when checkout is canceled
      setError('Payment process was canceled. You can try again or choose another plan.');
      // Clean URL
      navigate('/subscription', { replace: true });
    } else if (portalReturn === 'true') {
      // User returned from Stripe customer portal (e.g. after canceling) — sync and refresh UI
      const handlePortalReturn = async () => {
        try {
          const updated = await subscriptionService.syncSubscription(getToken);
          setSubscription(updated);
          await loadData();
          setUsageRefreshKey((prev) => prev + 1);
        } catch (err) {
          console.error('Failed to sync after portal return:', err);
          await loadData();
        }
        navigate('/subscription', { replace: true });
      };
      handlePortalReturn();
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
        />

               {/* Usage Dashboard */}
               <div className="mb-8">
                 <UsageDashboard refreshKey={usageRefreshKey} />
               </div>

        {/* Plan Comparison Section */}
        <div className="mb-8">
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
              Available Plans
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-base max-w-xl">
              Choose a plan that fits your learning needs. Upgrade or downgrade anytime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {tiers.map((tier) => {
              const isCurrentTier = tier.id === currentTier;
              const isUpgrade = tier.id !== 'free' && (currentTier === 'free' || 
                (currentTier === 'basic' && tier.id === 'premium'));
              const isDowngrade = tier.id === 'basic' && currentTier === 'premium';
              const isPopular = tier.id === 'premium' && !isCurrentTier;
              const formatPrice = (p: { amount: number; currency: string }) => {
                const { amount, currency } = p;
                const n = amount % 1 === 0 ? amount : Math.round(amount * 100) / 100;
                if (currency === 'usd') return `$${n}`;
                if (currency === 'cad') return `CA$${n}`;
                if (currency === 'eur') return `€${n}`;
                return `${currency.toUpperCase()} ${n}`;
              };
              const priceLabel = tier.id === 'free' ? '$0' : (tier.stripePrice ? formatPrice(tier.stripePrice) : '—');
              const priceSub = tier.id === 'free' ? 'Forever' : tier.stripePrice?.interval === 'year' ? 'per year' : 'per month';

              return (
                <div
                  key={tier.id}
                  className={`relative flex flex-col rounded-2xl border-2 p-6 sm:p-7 transition-all duration-300 ${
                    isCurrentTier
                      ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-500 dark:border-indigo-400 shadow-lg shadow-indigo-500/10 dark:shadow-indigo-500/5 ring-2 ring-indigo-500/20'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl dark:hover:shadow-slate-900/50'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-amber-400 to-amber-500 text-slate-900 shadow-md">
                        Most popular
                      </span>
                    </div>
                  )}

                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">
                      {tier.name}
                    </h3>
                    {activePromo?.discountPercent && tier.id !== 'free' && tier.stripePrice ? (
                      <div className="flex flex-col items-center gap-1">
                        <span className="text-slate-400 dark:text-slate-500 text-lg font-semibold line-through tabular-nums">
                          {priceLabel}
                        </span>
                        <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
                          <span className="text-3xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums">
                            {formatPrice({ ...tier.stripePrice, amount: Math.round(tier.stripePrice.amount * (1 - activePromo.discountPercent / 100) * 100) / 100 })}
                          </span>
                          <span className="text-sm text-slate-500 dark:text-slate-400">{priceSub}</span>
                        </div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400">
                          {activePromo.discountPercent}% off — code {activePromo.code}
                        </span>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
                        <span className="text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                          {priceLabel}
                        </span>
                        <span className="text-sm text-slate-500 dark:text-slate-400">{priceSub}</span>
                      </div>
                    )}
                    {isCurrentTier && (
                      <span className="inline-flex items-center mt-3 px-3 py-1.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full text-xs font-semibold">
                        Current Plan
                      </span>
                    )}
                  </div>

                  <ul className="space-y-4 mb-6 flex-1">
                    <li className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300" aria-hidden>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0V8m0 0V4a2 2 0 012-2h2a2 2 0 012 2v4z" /></svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Speaking</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {tier.limits.sectionALimit === 1 && tier.limits.sectionBLimit === 1 && tier.id === 'free'
                            ? '1 session (total)'
                            : tier.limits.sectionALimit === tier.limits.sectionBLimit
                              ? `${tier.limits.sectionALimit} sessions / month`
                              : `${tier.limits.sectionALimit} Part A, ${tier.limits.sectionBLimit} Part B / month`}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300" aria-hidden>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Mock exams</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {tier.id === 'free'
                            ? '1 (total)'
                            : `${tier.limits.mockExamLimit || 0} / month`}
                        </p>
                      </div>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300" aria-hidden>
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">Written expression</p>
                        <p className="text-sm font-semibold text-slate-900 dark:text-white">
                          {(tier.limits.writtenExpressionSectionALimit ?? 1) === -1
                            ? 'Unlimited'
                            : (tier.limits.writtenExpressionSectionALimit ?? 1) === (tier.limits.writtenExpressionSectionBLimit ?? 1)
                              ? `${tier.limits.writtenExpressionSectionALimit ?? 1} sessions / month`
                              : `${tier.limits.writtenExpressionSectionALimit ?? 1} Part A, ${tier.limits.writtenExpressionSectionBLimit ?? 1} Part B / month`}
                        </p>
                      </div>
                    </li>
                  </ul>

                  <div className="mt-auto pt-2">
                    {isCurrentTier ? (
                      <button
                        disabled
                        className="w-full px-4 py-3 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold cursor-default"
                      >
                        Current Plan
                      </button>
                    ) : tier.id === 'free' ? (
                      <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full px-4 py-3 rounded-xl border-2 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                      >
                        Free Plan
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          if (subscription && subscription.status === 'active' && subscription.tier !== 'free') {
                            setChangePlanTier(tier);
                          } else {
                            handleUpgrade(tier);
                          }
                        }}
                        disabled={processing}
                        className="w-full px-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        {processing ? 'Processing…' : isUpgrade ? 'Upgrade' : isDowngrade ? 'Downgrade' : 'Select Plan'}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Info Section */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-6">
          <h3 className="text-lg font-bold text-indigo-900 dark:text-indigo-200 mb-2">
            Need Help?
          </h3>
          <p className="text-sm text-indigo-800 dark:text-indigo-300 mb-4">
            For billing questions, to update your payment method, or to cancel your subscription, use the "Manage Billing" button above to access your Stripe customer portal.
          </p>
          <ul className="text-sm text-indigo-800 dark:text-indigo-300 space-y-1 list-disc list-inside">
            <li>All plans include access to all 4 TEF Canada modules</li>
            <li>Usage limits reset on the 1st of each month</li>
            <li>You can upgrade or downgrade your plan at any time</li>
            <li>No credit card required for the free plan</li>
          </ul>
        </div>

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
