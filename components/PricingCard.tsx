import React from 'react';
import { SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react';

interface PricingCardProps {
  plan: 'trial' | 'starter' | 'examReady';
  name: string;
  price: string;
  period?: string;
  originalPrice?: string;
  features: string[];
  limits: {
    fullTests?: string;
    sectionA?: string;
    sectionB?: string;
  };
  ctaText: string;
  onCtaClick?: () => void;
  highlighted?: boolean;
  badge?: string;
  isSignedIn?: boolean;
  loading?: boolean;
  isCurrentPlan?: boolean;
  hasActivePack?: boolean;
}

export const PricingCard: React.FC<PricingCardProps> = ({
  plan,
  name,
  price,
  period,
  originalPrice,
  features,
  limits,
  ctaText,
  onCtaClick,
  highlighted = false,
  badge,
  isSignedIn = false,
  loading = false,
  isCurrentPlan = false,
  hasActivePack = false,
}) => {
  const cardClasses = highlighted
    ? 'bg-gradient-to-br from-indigo-400 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600 border-indigo-300 dark:border-indigo-400'
    : 'bg-indigo-100/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700';

  const textClasses = highlighted ? 'text-white dark:text-white' : 'text-slate-800 dark:text-slate-100';
  const subtitleClasses = highlighted ? 'text-indigo-100 dark:text-indigo-100' : 'text-slate-500 dark:text-slate-400';

  const handleClick = () => {
    if (onCtaClick) {
      onCtaClick();
    }
  };

  const CTAButton = () => {
    // If this is the current plan, show "Current Plan" instead of button
    if (isCurrentPlan && isSignedIn) {
      return (
        <div className="w-full py-4 px-6 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 font-semibold text-base text-center cursor-not-allowed">
          Current Plan
        </div>
      );
    }

    if (plan === 'trial') {
      return (
        <SignUpButton mode="modal">
          <button className="w-full py-4 px-6 rounded-full bg-indigo-100/50 dark:bg-slate-700/50 text-slate-800 dark:text-slate-100 font-semibold text-base hover:bg-indigo-100 dark:hover:bg-slate-700 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            {ctaText}
          </button>
        </SignUpButton>
      );
    }

    // For paid plans, show sign-up for signed-out users
    return (
      <>
        <SignedIn>
          <button
            onClick={handleClick}
            disabled={loading}
            className={`w-full py-4 px-6 rounded-full font-semibold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${
              highlighted
                ? 'bg-white/20 dark:bg-white/20 text-white dark:text-white hover:bg-white/30 dark:hover:bg-white/30'
                : 'bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600'
            }`}
          >
            {loading ? 'Loading...' : (hasActivePack ? 'Upgrade Pack' : ctaText)}
          </button>
          {hasActivePack && (
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-2 text-center">
              ⚠️ Your current pack will be replaced
            </p>
          )}
        </SignedIn>
        <SignedOut>
          <SignUpButton mode="modal">
            <button
              className={`w-full py-4 px-6 rounded-full font-semibold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                highlighted
                  ? 'bg-white/20 dark:bg-white/20 text-white dark:text-white hover:bg-white/30 dark:hover:bg-white/30'
                  : 'bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600'
              }`}
            >
              {ctaText}
            </button>
          </SignUpButton>
        </SignedOut>
      </>
    );
  };

  return (
    <div
      className={`relative p-6 sm:p-8 rounded-3xl border-2 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
        highlighted 
          ? 'hover:shadow-indigo-400/30 dark:hover:shadow-indigo-500/30' 
          : 'hover:shadow-slate-200/50 dark:hover:shadow-slate-700/50'
      } ${cardClasses}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className={`px-4 py-1.5 text-indigo-600 dark:text-indigo-200 text-xs font-black uppercase tracking-wider rounded-full backdrop-blur-sm ${
            highlighted 
              ? 'bg-white/20 dark:bg-white/20 border-2 border-white/50 dark:border-white/50 shadow-lg shadow-white/20 dark:shadow-white/20' 
              : 'bg-indigo-300/80 dark:bg-indigo-500/80 border-2 border-indigo-400/60 dark:border-indigo-600/60 shadow-lg shadow-indigo-400/30 dark:shadow-indigo-600/30'
          }`}>
            {badge}
          </span>
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className={`text-2xl font-black ${textClasses} mb-2`}>{name}</h3>
          <div className="flex items-baseline gap-2">
            <span className={`text-4xl font-black ${textClasses}`}>{price}</span>
            {period && (
              <span className={`text-base font-semibold ${subtitleClasses}`}>
                {period}
              </span>
            )}
          </div>
          {originalPrice && (
            <p className={`text-sm ${subtitleClasses} mt-1 line-through`}>
              {originalPrice}
            </p>
          )}
        </div>

        <div className="space-y-3">
          {limits.fullTests && (
            <div className={`text-sm ${subtitleClasses}`}>
              <span className="font-semibold">Full Tests: </span>
              {limits.fullTests}
            </div>
          )}
          {limits.sectionA && (
            <div className={`text-sm ${subtitleClasses}`}>
              <span className="font-semibold">Section A: </span>
              {limits.sectionA}
            </div>
          )}
          {limits.sectionB && (
            <div className={`text-sm ${subtitleClasses}`}>
              <span className="font-semibold">Section B: </span>
              {limits.sectionB}
            </div>
          )}
        </div>

        <div className={`border-t ${highlighted ? 'border-white/20 dark:border-white/20' : 'border-slate-200 dark:border-slate-700'} pt-4 space-y-3`}>
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className={`text-lg mt-0.5 ${highlighted ? 'text-white dark:text-white' : 'text-emerald-400 dark:text-emerald-300'}`}>
                ✓
              </span>
              <span className={`text-sm ${subtitleClasses}`}>{feature}</span>
            </div>
          ))}
        </div>

        <div className="pt-4">
          <CTAButton />
        </div>
      </div>
    </div>
  );
};

