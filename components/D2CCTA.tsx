import React from 'react';
import { SignUpButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

interface D2CCTAProps {
  variant?: 'hero' | 'inline' | 'card';
  className?: string;
}

export function D2CCTA({ variant = 'hero', className = '' }: D2CCTAProps) {
  const navigate = useNavigate();

  if (variant === 'hero') {
    return (
      <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
        <button className={`group relative px-8 py-4 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-600 dark:from-indigo-500 dark:to-indigo-600 text-white font-semibold text-lg hover:from-indigo-600 hover:to-indigo-700 dark:hover:from-indigo-600 dark:hover:to-indigo-700 transition-all duration-300 hover:scale-[1.05] hover:shadow-2xl hover:shadow-indigo-500/40 dark:hover:shadow-indigo-500/40 active:scale-[0.98] overflow-hidden ${className}`}>
          <span className="relative z-10">Try Now - Free</span>
          <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></span>
        </button>
      </SignUpButton>
    );
  }

  if (variant === 'inline') {
    return (
      <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
        <button className={`px-6 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition-colors ${className}`}>
          Get Started Free
        </button>
      </SignUpButton>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-indigo-500 to-indigo-600 dark:from-indigo-600 dark:to-indigo-700 rounded-2xl p-8 text-white ${className}`}>
        <h3 className="text-2xl font-bold mb-2">Ready to Start Practicing?</h3>
        <p className="text-indigo-100 mb-6">
          Join thousands of students preparing for TEF Canada. Start with our free plan and upgrade anytime.
        </p>
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span>1 Section A + 1 Section B speaking practice (total)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span>1 Mock exam (total)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xl">✓</span>
            <span>Unlimited written expression practice</span>
          </div>
        </div>
        <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard" signInFallbackRedirectUrl="/dashboard">
          <button className="w-full px-6 py-3 rounded-lg bg-white text-indigo-600 font-semibold hover:bg-indigo-50 transition-colors">
            Start Free Trial
          </button>
        </SignUpButton>
      </div>
    );
  }

  return null;
}
