import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export const SubscriptionManagement: React.FC = () => {
  const { status, loading, refreshStatus } = useSubscription();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const [loadingPortal, setLoadingPortal] = useState(false);

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/subscription/manage`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get management URL');
      }

      const data = await response.json();
      window.location.href = data.url;
    } catch (err: any) {
      console.error('Error opening portal:', err);
      alert('Failed to open subscription management. Please try again.');
    } finally {
      setLoadingPortal(false);
    }
  };

  if (loading || !status) {
    return (
      <div className="max-w-6xl mx-auto p-4 h-full flex items-center justify-center">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 animate-pulse w-full max-w-md">
          <div className="h-5 bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-1/2"></div>
        </div>
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

  const hasTrial = status.isActive && status.subscriptionType === 'TRIAL';
  const hasPack = status.packType && status.packExpirationDate && new Date(status.packExpirationDate) > new Date();
  const packDaysRemaining = getPackDaysRemaining();

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col h-full min-h-0">
      <div className="mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-3 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-white mb-1">Subscription Management</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Manage your subscription and view usage</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pb-4">
          {/* TRIAL Status */}
          {hasTrial && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-white mb-1">Free Trial</h2>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">Active</span>
                </div>
              </div>

              {status.trialDaysRemaining !== undefined && (
                <div className="mb-3 pb-3 border-b border-slate-700">
                  <p className="text-xs text-slate-400 mb-0.5">Trial Days Remaining</p>
                  <p className="text-xl md:text-2xl font-black text-white">{status.trialDaysRemaining}</p>
                </div>
              )}

              <div className="mt-3">
                <h3 className="text-xs md:text-sm font-semibold text-white mb-2">Daily Usage</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-400">Full Tests</span>
                    <span className="text-white font-semibold">
                      {status.usage.fullTestsUsed} / {status.limits.fullTests}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-400">Section A</span>
                    <span className="text-white font-semibold">
                      {status.usage.sectionAUsed} / {status.limits.sectionA}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-400">Section B</span>
                    <span className="text-white font-semibold">
                      {status.usage.sectionBUsed} / {status.limits.sectionB}
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-2">Resets at midnight UTC</p>
              </div>
            </div>
          )}

          {/* Pack Status */}
          {hasPack && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 md:p-5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-base md:text-lg font-bold text-white mb-1">{getPackName()}</h2>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">Active</span>
                </div>
              </div>

              {packDaysRemaining !== null && packDaysRemaining > 0 && (
                <div className="mb-3 pb-3 border-b border-slate-700">
                  <p className="text-xs text-slate-400 mb-0.5">Days Remaining</p>
                  <p className="text-xl md:text-2xl font-black text-white">{packDaysRemaining}</p>
                </div>
              )}

              {status.packExpirationDate && (
                <div className="mb-3 pb-3 border-b border-slate-700">
                  <p className="text-xs text-slate-400 mb-0.5">Expiration Date</p>
                  <p className="text-sm text-white font-semibold">
                    {new Date(status.packExpirationDate).toLocaleDateString()}
                  </p>
                </div>
              )}

              {status.packCredits && (
                <div className="mt-3">
                  <h3 className="text-xs md:text-sm font-semibold text-white mb-2">Pack Credits</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-slate-400">Full Tests</span>
                      <span className="text-white font-semibold">
                        {status.packCredits.fullTests.remaining} / {status.packCredits.fullTests.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-slate-400">Section A</span>
                      <span className="text-white font-semibold">
                        {status.packCredits.sectionA.remaining} / {status.packCredits.sectionA.total}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs md:text-sm">
                      <span className="text-slate-400">Section B</span>
                      <span className="text-white font-semibold">
                        {status.packCredits.sectionB.remaining} / {status.packCredits.sectionB.total}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-slate-700">
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full py-2 px-4 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  Upgrade Pack
                </button>
                <p className="text-xs text-slate-500 mt-1.5 text-center">
                  ⚠️ Upgrading replaces current pack
                </p>
              </div>
            </div>
          )}

          {/* No active pack */}
          {!hasPack && !hasTrial && (
            <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 md:p-5 lg:col-span-2">
              <div className="text-center">
                <h2 className="text-base md:text-lg font-bold text-white mb-1">No Active Pack</h2>
                <p className="text-xs md:text-sm text-slate-400 mb-4">Purchase a pack to get started</p>
                <button
                  onClick={() => navigate('/pricing')}
                  className="w-full max-w-xs mx-auto py-2 px-4 bg-indigo-600 text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-indigo-700 transition-colors"
                >
                  View Plans
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

