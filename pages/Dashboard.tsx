import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import { PaywallModal } from '../components/PaywallModal';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PracticeCard } from '../components/dashboard/PracticeCard';
import { MockExamsCard } from '../components/dashboard/MockExamsCard';
import { CheckoutMessage } from '../components/dashboard/CheckoutMessage';
import { PackExpirationWarning } from '../components/dashboard/PackExpirationWarning';

export function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { status, refreshStatus } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>();
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle checkout redirect - only run once per checkout parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkout = params.get('checkout');
    
    if (!checkout) return; // No checkout parameter, skip
    
    if (checkout === 'success') {
      setCheckoutMessage({ type: 'success', text: 'Payment successful! Your subscription has been activated.' });
      // Refresh subscription status
      refreshStatus();
      // Clean up URL immediately to prevent re-running
      navigate('/dashboard', { replace: true });
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setCheckoutMessage(null), 5000);
      return () => clearTimeout(timer);
    } else if (checkout === 'cancelled') {
      setCheckoutMessage({ type: 'error', text: 'Payment was cancelled. You can try again anytime.' });
      // Clean up URL immediately to prevent re-running
      navigate('/dashboard', { replace: true });
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setCheckoutMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.search, navigate, refreshStatus]);


  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-6 md:space-y-12">
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">{t('dashboard.greeting')}, {user?.firstName}!</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
        </div>

        {/* Checkout Success/Error Message */}
        {checkoutMessage && (
          <CheckoutMessage 
            message={checkoutMessage} 
            onDismiss={() => setCheckoutMessage(null)} 
          />
        )}

        {/* Pack Expiration Warning */}
        {status && <PackExpirationWarning status={status} />}

        {/* Subscription Status */}
        <div className="hidden md:block">
          <SubscriptionStatus />
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          reason={paywallReason}
        />

        {/* Section Cards */}
        <div className="grid md:grid-cols-2 gap-4 md:gap-8">
          <PracticeCard />
          <MockExamsCard />
        </div>
      </main>
    </DashboardLayout>
  );
}
