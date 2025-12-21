import React from 'react';
import { SignUpButton, SignedIn, SignedOut } from '@clerk/clerk-react';

interface PricingCardProps {
  plan: 'trial' | 'monthly' | 'yearly' | 'pack';
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
}) => {
  const cardClasses = highlighted
    ? 'bg-gradient-to-br from-indigo-600 to-indigo-700 border-indigo-500'
    : 'bg-slate-900/40 border-slate-800';

  const textClasses = highlighted ? 'text-white' : 'text-white';
  const subtitleClasses = highlighted ? 'text-indigo-100' : 'text-slate-400';

  const handleClick = () => {
    if (onCtaClick) {
      onCtaClick();
    }
  };

  const CTAButton = () => {
    if (plan === 'trial') {
      return (
        <SignUpButton mode="modal">
          <button className="w-full py-4 px-6 rounded-full bg-white text-slate-900 font-semibold text-base hover:bg-indigo-50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
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
                ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {loading ? 'Loading...' : ctaText}
          </button>
        </SignedIn>
        <SignedOut>
          <SignUpButton mode="modal">
            <button
              className={`w-full py-4 px-6 rounded-full font-semibold text-base transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                highlighted
                  ? 'bg-white text-indigo-600 hover:bg-indigo-50'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
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
        highlighted ? 'hover:shadow-indigo-600/30' : 'hover:shadow-slate-900/50'
      } ${cardClasses}`}
    >
      {badge && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="px-4 py-1 bg-indigo-500 text-white text-xs font-black uppercase tracking-wider rounded-full">
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

        <div className="border-t border-slate-700/50 pt-4 space-y-3">
          {features.map((feature, index) => (
            <div key={index} className="flex items-start gap-2">
              <span className={`text-lg mt-0.5 ${highlighted ? 'text-indigo-200' : 'text-emerald-400'}`}>
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

