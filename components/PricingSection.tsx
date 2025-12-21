import React from 'react';
import { PricingCard } from './PricingCard';
import { useCheckout } from '../hooks/useCheckout';
import { useUser, SignUpButton } from '@clerk/clerk-react';

export const PricingSection: React.FC = () => {
  const { initiateCheckout, loading, isSignedIn } = useCheckout();
  const { user } = useUser();

  const handleCheckout = async (planType: 'monthly' | 'yearly' | 'pack') => {
    if (!isSignedIn) {
      // For signed-out users, show sign-up modal
      // The SignUpButton will handle this
      return;
    }

    await initiateCheckout(planType);
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
      plan: 'monthly' as const,
      name: 'Pro Monthly',
      price: '$29',
      period: '/month',
      originalPrice: '$32.48 with tax',
      features: [
        'Unlimited access',
        'AI Evaluation',
        'CLB Scoring',
        'Progress Tracking',
        'Unlimited History',
        'Priority Support',
      ],
      limits: {
        fullTests: '1 per day',
        sectionA: '2 per day',
        sectionB: '2 per day',
      },
      ctaText: 'Subscribe Monthly',
      onCtaClick: () => handleCheckout('monthly'),
    },
    {
      plan: 'yearly' as const,
      name: 'Pro Yearly',
      price: '$278',
      period: '/year',
      originalPrice: '$23.17/month',
      features: [
        'Unlimited access',
        'AI Evaluation',
        'CLB Scoring',
        'Progress Tracking',
        'Unlimited History',
        'Priority Support',
      ],
      limits: {
        fullTests: '1 per day',
        sectionA: '2 per day',
        sectionB: '2 per day',
      },
      ctaText: 'Subscribe Yearly',
      onCtaClick: () => handleCheckout('yearly'),
      highlighted: true,
      badge: 'Most Popular',
    },
    {
      plan: 'pack' as const,
      name: '5-Pack',
      price: '$19',
      period: ' one-time',
      features: [
        '5 full tests',
        'Valid year round',
        'AI Evaluation',
        'CLB Scoring',
        'Progress Tracking',
        'No subscription',
      ],
      limits: {
        fullTests: '5 total (no daily limit)',
      },
      ctaText: 'Buy 5-Pack',
      onCtaClick: () => handleCheckout('pack'),
      badge: 'Best Value',
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {plans.map((planData) => (
            <PricingCard
              key={planData.plan}
              {...planData}
              isSignedIn={isSignedIn}
              loading={loading}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

