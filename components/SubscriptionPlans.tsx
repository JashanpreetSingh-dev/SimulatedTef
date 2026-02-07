import React, { useEffect, useState } from 'react';
import { SignUpButton } from '@clerk/clerk-react';
import { subscriptionService } from '../services/subscriptionService';

interface SubscriptionTier {
  id: 'free' | 'basic' | 'premium';
  name: string;
  price: string;
  priceSubtext?: string;
  limits: {
    sectionALimit: number;
    sectionBLimit: number;
    writtenExpressionSectionALimit: number;
    writtenExpressionSectionBLimit: number;
    mockExamLimit: number;
  };
  features: string[];
  highlight?: boolean;
  stripePriceId?: string;
}

const DEFAULT_TIERS: SubscriptionTier[] = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    priceSubtext: 'Forever',
    limits: {
      sectionALimit: 1,
      sectionBLimit: 1,
      writtenExpressionSectionALimit: 1,
      writtenExpressionSectionBLimit: 1,
      mockExamLimit: 1,
    },
    features: [
      '1 speaking practice (total)',
      '1 writing practice (total)',
      '1 Mock exam (total)',
      'AI-powered evaluation & feedback',
      'Progress tracking & history',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: '$10',
    priceSubtext: 'per month',
    limits: {
      sectionALimit: 10,
      sectionBLimit: 10,
      writtenExpressionSectionALimit: 10,
      writtenExpressionSectionBLimit: 10,
      mockExamLimit: 5,
    },
    features: [
      '10 speaking practices/month',
      '10 writing practices/month',
      '5 Mock exams/month',
      'AI-powered evaluation & feedback',
      'Progress tracking & history',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: '$30',
    priceSubtext: 'per month',
    limits: {
      sectionALimit: 30,
      sectionBLimit: 30,
      writtenExpressionSectionALimit: 30,
      writtenExpressionSectionBLimit: 30,
      mockExamLimit: 10,
    },
    features: [
      '30 speaking practices/month',
      '30 writing practices/month',
      '10 Mock exams/month',
      'AI-powered evaluation & feedback',
      'Progress tracking & history',
    ],
    highlight: true,
  },
];

interface SubscriptionPlansProps {
  variant?: 'landing' | 'inline';
  showCTA?: boolean;
}

export function SubscriptionPlans({ variant = 'landing', showCTA = true }: SubscriptionPlansProps) {
  const [tiers, setTiers] = useState<SubscriptionTier[]>(DEFAULT_TIERS);

  useEffect(() => {
    subscriptionService
      .getPublicTiers()
      .then(({ tiers: publicTiers }) => {
        setTiers((prev) =>
          prev.map((t) => {
            const fromApi = publicTiers.find((p) => p.id === t.id);
            if (!fromApi) return t;
            return {
              ...t,
              price: fromApi.price ?? t.price,
              priceSubtext: fromApi.priceSubtext ?? t.priceSubtext,
            };
          })
        );
      })
      .catch(() => {
        // Keep default tiers on failure
      });
  }, []);

  return (
    <section className="relative py-16 sm:py-24 md:py-32 px-4 sm:px-6 lg:px-12 xl:px-16">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12 sm:mb-16">
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-slate-800 dark:text-slate-100 mb-4 leading-[1.1] tracking-[-0.02em]">
            Choose Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-indigo-400 to-cyan-500 dark:from-indigo-400 dark:via-indigo-300 dark:to-cyan-400">Plan</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-base sm:text-lg md:text-xl max-w-2xl mx-auto">
            Start free and upgrade anytime. All plans include all 4 TEF modules with AI evaluation.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative flex flex-col rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 ${
                tier.highlight
                  ? 'bg-gradient-to-b from-indigo-50/80 to-white dark:from-indigo-950/30 dark:to-slate-800 border-indigo-500 dark:border-indigo-400 shadow-xl shadow-indigo-500/10 dark:shadow-indigo-500/5 md:-mt-2 md:mb-2 md:scale-[1.02]'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 hover:shadow-xl'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6 pt-1">
                <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3">
                  {tier.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1.5 flex-wrap">
                  <span className="text-4xl font-black text-slate-900 dark:text-white tabular-nums tracking-tight">
                    {tier.price}
                  </span>
                  {tier.priceSubtext && (
                    <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                      {tier.priceSubtext}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3.5 mb-8 flex-1">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 mt-0.5" aria-hidden>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 text-sm leading-snug">
                      {feature}
                    </span>
                  </li>
                ))}
              </ul>

              {showCTA && (
                <div className="mt-auto">
                  {tier.id === 'free' ? (
                    <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
                      <button
                        className={`w-full px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                          tier.highlight
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-lg hover:shadow-xl'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-600 focus:ring-slate-400'
                        }`}
                      >
                        Get Started Free
                      </button>
                    </SignUpButton>
                  ) : (
                    <SignUpButton mode="modal" fallbackRedirectUrl="/subscription" signInFallbackRedirectUrl="/subscription">
                      <button
                        className={`w-full px-6 py-3.5 rounded-xl font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-900 ${
                          tier.highlight
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500 shadow-lg hover:shadow-xl'
                            : 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/60 focus:ring-indigo-400'
                        }`}
                      >
                        Upgrade to {tier.name}
                      </button>
                    </SignUpButton>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {variant === 'landing' && (
          <div className="mt-12 text-center">
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              All plans include access to all 4 TEF Canada modules. No credit card required for free plan.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
