import React from 'react';
import { useNavigate } from 'react-router-dom';
import { SignUpButton } from '@clerk/clerk-react';
import { useUser } from '@clerk/clerk-react';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  reason?: string;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({ isOpen, onClose, reason }) => {
  const navigate = useNavigate();
  const { isSignedIn } = useUser();

  if (!isOpen) return null;

  const handleViewPricing = () => {
    onClose();
    navigate('/dashboard/subscription');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-indigo-100/70 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 rounded-3xl p-8 max-w-md w-full shadow-2xl transition-colors">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/50 rounded-2xl flex items-center justify-center text-3xl mb-4 mx-auto">
            🔒
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">Usage Limit Reached</h2>
          <p className="text-slate-500 dark:text-slate-400">
            {reason || 'You\'ve reached your daily limit. Upgrade to continue practicing.'}
          </p>
        </div>

        <div className="space-y-3 mb-6">
          <div className="p-4 bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl border border-slate-200 dark:border-slate-600">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-1">Starter Pack</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">$19 one-time • 5 Full Tests, 3 Section A, 3 Section B • Valid 30 days</p>
            {isSignedIn ? (
              <button
                onClick={handleViewPricing}
                className="w-full py-2 bg-indigo-400 text-white rounded-lg text-sm font-semibold hover:bg-indigo-1000 transition-colors"
              >
                View Plans
              </button>
            ) : (
              <SignUpButton mode="modal">
                <button className="w-full py-2 bg-indigo-400 text-white rounded-lg text-sm font-semibold hover:bg-indigo-1000 transition-colors">
                  Sign Up to Purchase
                </button>
              </SignUpButton>
            )}
          </div>

          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-xl border border-indigo-200 dark:border-indigo-700">
            <h3 className="text-slate-800 dark:text-slate-100 font-semibold mb-1">Exam Ready Pack</h3>
            <p className="text-slate-700 dark:text-slate-300 text-sm mb-2">$35 one-time • 15 Full Tests, 10 Section A, 10 Section B • Valid 30 days</p>
            {isSignedIn ? (
              <button
                onClick={handleViewPricing}
                className="w-full py-2 bg-indigo-400 text-white rounded-lg text-sm font-semibold hover:bg-indigo-1000 transition-colors"
              >
                View Plans
              </button>
            ) : (
              <SignUpButton mode="modal">
                <button className="w-full py-2 bg-indigo-400 text-white rounded-lg text-sm font-semibold hover:bg-indigo-1000 transition-colors">
                  Sign Up to Purchase
                </button>
              </SignUpButton>
            )}
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors text-sm font-semibold"
        >
          Maybe Later
        </button>
      </div>
    </div>
  );
};

