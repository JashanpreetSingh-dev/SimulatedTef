import React from 'react';
import { PricingCard } from './PricingCard';
import { useUser, SignUpButton } from '@clerk/clerk-react';

export const PricingSection: React.FC = () => {
  const { user } = useUser();
  const isSignedIn = !!user;

  const plans = [
    {
      plan: 'trial' as const,
      name: 'Free Trial',
      price: '$0',
      period: '',
      features: [
        '3 days free access',
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
        '10 Section A',
        '10 Section B',
        'Valid 30 days',
      ],
      limits: {
        fullTests: '5 total',
        sectionA: '10 total',
        sectionB: '10 total',
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
        '20 Full Tests',
        '20 Section A',
        '20 Section B',
        'Valid 30 days',
      ],
      limits: {
        fullTests: '20 total',
        sectionA: '20 total',
        sectionB: '20 total',
      },
      ctaText: 'Buy Exam Ready Pack',
      onCtaClick: () => handleCheckout('examReady'),
      highlighted: true,
      badge: '4 Weeks CLB 7',
    },
  ];

  return (
    <section id="pricing" className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16 bg-indigo-100 dark:bg-slate-900 transition-colors">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 sm:mb-6 leading-[1.1] tracking-[-0.02em] px-2">
            Simple, Transparent <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Pricing</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto leading-[1.6] px-4">
            Choose the plan that works best for you. All plans include AI evaluation and CLB scoring.
          </p>
          <p className="text-slate-700 dark:text-slate-300 text-sm mt-4">
            Prices in CAD. 12% GST/PST added at checkout.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((planData) => {
            return (
              <PricingCard
                key={planData.plan}
                {...planData}
                isSignedIn={isSignedIn}
                loading={false}
                isCurrentPlan={false}
                hasActivePack={false}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

