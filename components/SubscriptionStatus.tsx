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
      <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 animate-pulse transition-colors">
        <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
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

  // Combined card when both trial and pack are active
  if (hasTrial && hasPack) {
    return (
      <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 transition-colors">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 flex flex-col sm:flex-row gap-3 sm:gap-4">
            {/* Trial Section */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Free Trial</h3>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300 rounded-full text-xs font-bold">Active</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {status.trialDaysRemaining !== undefined ? `${status.trialDaysRemaining}d left` : ''} • Daily: {status.limits.fullTests} Full, {status.limits.sectionA} A, {status.limits.sectionB} B
              </p>
            </div>

            {/* Pack Section */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{getPackName()}</h3>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-bold">Active</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {packDaysRemaining !== null && packDaysRemaining > 0 ? `${packDaysRemaining}d left` : ''}
                {status.packCredits && ` • Full: ${status.packCredits.fullTests.remaining}/${status.packCredits.fullTests.total}, A: ${status.packCredits.sectionA.remaining}/${status.packCredits.sectionA.total}, B: ${status.packCredits.sectionB.remaining}/${status.packCredits.sectionB.total}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleUpgrade}
            className="px-3 py-1.5 bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors whitespace-nowrap"
          >
            Upgrade
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* TRIAL Status Only */}
      {hasTrial && !hasPack && (
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Free Trial</h3>
                <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300 rounded-full text-xs font-bold">Active</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {status.trialDaysRemaining !== undefined ? `${status.trialDaysRemaining}d left` : ''} • Daily: {status.limits.fullTests} Full, {status.limits.sectionA} A, {status.limits.sectionB} B
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-3 py-1.5 bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors whitespace-nowrap"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* Pack Status Only */}
      {!hasTrial && hasPack && (
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">{getPackName()}</h3>
                <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-bold">Active</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {packDaysRemaining !== null && packDaysRemaining > 0 ? `${packDaysRemaining}d left` : ''}
                {status.packCredits && ` • Full: ${status.packCredits.fullTests.remaining}/${status.packCredits.fullTests.total}, A: ${status.packCredits.sectionA.remaining}/${status.packCredits.sectionA.total}, B: ${status.packCredits.sectionB.remaining}/${status.packCredits.sectionB.total}`}
              </p>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-3 py-1.5 bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors whitespace-nowrap"
            >
              Upgrade
            </button>
          </div>
        </div>
      )}

      {/* No active subscription or pack */}
      {!hasTrial && !hasPack && (
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">No Active Plan</h3>
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full text-xs font-bold">Expired</span>
              </div>
            </div>
            <button
              onClick={handleUpgrade}
              className="px-3 py-1.5 bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 dark:hover:bg-indigo-600 transition-colors whitespace-nowrap"
            >
              View Plans
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

