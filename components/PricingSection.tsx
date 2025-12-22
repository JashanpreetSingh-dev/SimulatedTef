import React, { useState } from 'react';
import { PricingCard } from './PricingCard';
import { useCheckout } from '../hooks/useCheckout';
import { useUser, SignUpButton } from '@clerk/clerk-react';
import { useSubscription } from '../hooks/useSubscription';
import { UpgradeWarningModal } from './UpgradeWarningModal';

export const PricingSection: React.FC = () => {
  const { initiateCheckout, loading, isSignedIn } = useCheckout();
  const { user } = useUser();
  const { status } = useSubscription();
  const [showUpgradeWarning, setShowUpgradeWarning] = useState(false);
  const [pendingPackType, setPendingPackType] = useState<'starter' | 'examReady' | null>(null);

  const handleCheckout = async (planType: 'starter' | 'examReady') => {
    if (!isSignedIn) {
      // For signed-out users, show sign-up modal
      // The SignUpButton will handle this
      return;
    }

    // Check if user has active pack
    if (status?.packType && status?.packExpirationDate && new Date(status.packExpirationDate) > new Date()) {
      // Show upgrade warning
      setPendingPackType(planType);
      setShowUpgradeWarning(true);
      return;
    }

    // No active pack, proceed with checkout
    await initiateCheckout(planType);
  };

  const handleConfirmUpgrade = async () => {
    if (pendingPackType) {
      setShowUpgradeWarning(false);
      await initiateCheckout(pendingPackType);
      setPendingPackType(null);
    }
  };

  const plans = [
    {
      plan: 'trial' as const,
      name: 'Free Trial',
      price: '$0',
      period: '',
      features: [
        '3 days free access',
        'AI Evaluation',
        'CLB Scoring',
        'Progress Tracking',
        'Exam History',
      ],
      limits: {
        fullTests: '1 per day',
        sectionA: '1 per day',
        sectionB: '1 per day',
      },
      ctaText: 'Start Free Trial',
    },
    {
      plan: 'starter' as const,
      name: 'Starter Pack',
      price: '$19',
      period: ' one-time',
      features: [
        '5 Full Tests',
        '3 Section A',
        '3 Section B',
        '11 Tests Total',
        'Valid 30 days',
        'AI Evaluation',
        'CLB Scoring',
      ],
      limits: {
        fullTests: '5 total',
        sectionA: '3 total',
        sectionB: '3 total',
      },
      ctaText: 'Buy Starter Pack',
      onCtaClick: () => handleCheckout('starter'),
      badge: 'Week 1 Intensive',
    },
    {
      plan: 'examReady' as const,
      name: 'Exam Ready Pack',
      price: '$35',
      period: ' one-time',
      features: [
        '15 Full Tests',
        '10 Section A',
        '10 Section B',
        '35 Tests Total',
        'Valid 30 days',
        'AI Evaluation',
        'CLB Scoring',
      ],
      limits: {
        fullTests: '15 total',
        sectionA: '10 total',
        sectionB: '10 total',
      },
      ctaText: 'Buy Exam Ready Pack',
      onCtaClick: () => handleCheckout('examReady'),
      highlighted: true,
      badge: '4 Weeks CLB 7',
    },
  ];

  return (
    <section id="pricing" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-indigo-300 to-cyan-400">Pricing</span>
          </h2>
          <p className="text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4">
            Choose the plan that works best for you. All plans include AI evaluation and CLB scoring.
          </p>
          <p className="text-slate-500 text-sm mt-4">
            Prices in CAD. 12% GST/PST added at checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((planData) => {
            // Determine if this is the user's current plan
            const isCurrentPlan = status && status.isActive && (
              (planData.plan === 'trial' && status.subscriptionType === 'TRIAL') ||
              (planData.plan === 'starter' && status.packType === 'STARTER_PACK' && status.packExpirationDate && new Date(status.packExpirationDate) > new Date()) ||
              (planData.plan === 'examReady' && status.packType === 'EXAM_READY_PACK' && status.packExpirationDate && new Date(status.packExpirationDate) > new Date())
            );
            
            // Check if user has active pack (for upgrade warning)
            const hasActivePack = status?.packType && status?.packExpirationDate && 
              new Date(status.packExpirationDate) > new Date() &&
              planData.plan !== 'trial';

            return (
              <PricingCard
                key={planData.plan}
                {...planData}
                isSignedIn={isSignedIn}
                loading={loading}
                isCurrentPlan={isCurrentPlan}
                hasActivePack={hasActivePack}
              />
            );
          })}
        </div>
      </div>

      {/* Upgrade Warning Modal */}
      {status?.packType && status?.packExpirationDate && status?.packCredits && (
        <UpgradeWarningModal
          isOpen={showUpgradeWarning}
          onClose={() => {
            setShowUpgradeWarning(false);
            setPendingPackType(null);
          }}
          onConfirm={handleConfirmUpgrade}
          currentPack={{
            type: status.packType,
            expiration: status.packExpirationDate,
            credits: status.packCredits,
          }}
          newPack={{
            type: pendingPackType === 'starter' ? 'STARTER_PACK' : 'EXAM_READY_PACK',
            name: pendingPackType === 'starter' ? 'Starter Pack' : 'Exam Ready Pack',
            credits: {
              fullTests: pendingPackType === 'starter' ? 5 : 15,
              sectionA: pendingPackType === 'starter' ? 3 : 10,
              sectionB: pendingPackType === 'starter' ? 3 : 10,
            },
          }}
        />
      )}
    </section>
  );
};

