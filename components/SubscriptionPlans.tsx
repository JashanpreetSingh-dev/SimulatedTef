import React from 'react';
import { SignUpButton } from '@clerk/clerk-react';

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

const tiers: SubscriptionTier[] = [
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

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {tiers.map((tier) => (
            <div
              key={tier.id}
              className={`relative bg-white dark:bg-slate-800 rounded-2xl border-2 p-6 sm:p-8 transition-all duration-300 hover:shadow-xl ${
                tier.highlight
                  ? 'border-indigo-500 dark:border-indigo-400 shadow-lg scale-105 md:scale-110'
                  : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700'
              }`}
            >
              {tier.highlight && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">
                  {tier.name}
                </h3>
                <div className="mb-2">
                  <span className="text-4xl font-black text-slate-800 dark:text-slate-100">
                    {tier.price}
                  </span>
                  {tier.priceSubtext && (
                    <span className="text-slate-500 dark:text-slate-400 text-sm ml-2">
                      {tier.priceSubtext}
                    </span>
                  )}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-slate-600 dark:text-slate-300 text-sm">
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
                        className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                          tier.highlight
                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg'
                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                        }`}
                      >
                        Get Started Free
                      </button>
                    </SignUpButton>
                  ) : (
                    <SignUpButton mode="modal" fallbackRedirectUrl="/subscription" signInFallbackRedirectUrl="/subscription">
                      <button
                        className={`w-full px-6 py-3 rounded-lg font-semibold transition-all duration-300 ${
                          tier.highlight
                            ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 hover:shadow-lg'
                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
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
