import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useNavigate } from 'react-router-dom';
import { useCheckout } from '../hooks/useCheckout';

export const SubscriptionStatus: React.FC = () => {
  const { status, loading } = useSubscription();
  const navigate = useNavigate();
  const { initiateCheckout } = useCheckout();

  if (loading || !status) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-4 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-3 bg-slate-700 rounded w-1/2"></div>
      </div>
    );
  }

  const getPackName = () => {
    if (status.packType === 'STARTER_PACK') return 'Starter Pack';
    if (status.packType === 'EXAM_READY_PACK') return 'Exam Ready Pack';
    return null;
  };

  const getPackDaysRemaining = () => {
    if (!status.packExpirationDate) return null;
    const expirationDate = new Date(status.packExpirationDate);
    const now = new Date();
    const diffTime = expirationDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  const hasTrial = status.isActive && status.subscriptionType === 'TRIAL';
  const hasPack = status.packType && status.packExpirationDate && new Date(status.packExpirationDate) > new Date();
  const packDaysRemaining = getPackDaysRemaining();

  return (
    <div className="space-y-4">
      {/* TRIAL Status */}
      {hasTrial && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base md:text-lg font-black text-white">Free Trial</h3>
                <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">Active</span>
              </div>
              {status.trialDaysRemaining !== undefined && (
                <p className="text-xs md:text-sm text-slate-400">
                  {status.trialDaysRemaining} days remaining
                </p>
              )}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-slate-400">
                  Daily: {status.limits.fullTests} Full, {status.limits.sectionA} Section A, {status.limits.sectionB} Section B
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pack Status */}
      {hasPack && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base md:text-lg font-black text-white">{getPackName()}</h3>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">Active</span>
              </div>
              {packDaysRemaining !== null && packDaysRemaining > 0 && (
                <p className="text-xs md:text-sm text-slate-400">
                  {packDaysRemaining} days remaining
                </p>
              )}
              {status.packCredits && (
                <div className="mt-2 space-y-1">
                  <p className="text-xs text-slate-400">
                    Full: {status.packCredits.fullTests.remaining}/{status.packCredits.fullTests.total} • 
                    Section A: {status.packCredits.sectionA.remaining}/{status.packCredits.sectionA.total} • 
                    Section B: {status.packCredits.sectionB.remaining}/{status.packCredits.sectionB.total}
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* No active subscription or pack */}
      {!hasTrial && !hasPack && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-base md:text-lg font-black text-white">No Active Plan</h3>
                <span className="px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-xs font-bold">Expired</span>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              View Plans
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

