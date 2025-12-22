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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Subscription Management</h1>
        <p className="text-slate-500 dark:text-slate-400">Manage your subscription and view usage</p>
      </div>

      {/* TRIAL Status */}
      {hasTrial && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">Free Trial</h2>
              <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold">Active</span>
            </div>
          </div>

          {status.trialDaysRemaining !== undefined && (
            <div className="mb-4">
              <p className="text-slate-400 mb-1">Trial Days Remaining</p>
              <p className="text-2xl font-black text-white">{status.trialDaysRemaining}</p>
            </div>
          )}

          <div className="border-t border-slate-700 pt-6 mt-6">
            <h3 className="text-lg font-bold text-white mb-4">Daily Usage (Resets at midnight UTC)</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Full Tests</span>
                <span className="text-white font-semibold">
                  {status.usage.fullTestsUsed} / {status.limits.fullTests}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Section A</span>
                <span className="text-white font-semibold">
                  {status.usage.sectionAUsed} / {status.limits.sectionA}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Section B</span>
                <span className="text-white font-semibold">
                  {status.usage.sectionBUsed} / {status.limits.sectionB}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pack Status */}
      {hasPack && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-white mb-2">{getPackName()}</h2>
              <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-bold">Active</span>
            </div>
          </div>

          {packDaysRemaining !== null && packDaysRemaining > 0 && (
            <div className="mb-4">
              <p className="text-slate-400 mb-1">Days Remaining</p>
              <p className="text-2xl font-black text-white">{packDaysRemaining}</p>
            </div>
          )}

          {status.packExpirationDate && (
            <div className="mb-4">
              <p className="text-slate-400 mb-1">Expiration Date</p>
              <p className="text-white font-semibold">
                {new Date(status.packExpirationDate).toLocaleDateString()}
              </p>
            </div>
          )}

          {status.packCredits && (
            <div className="border-t border-slate-700 pt-6 mt-6">
              <h3 className="text-lg font-bold text-white mb-4">Pack Credits</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Full Tests</span>
                  <span className="text-white font-semibold">
                    {status.packCredits.fullTests.remaining} / {status.packCredits.fullTests.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Section A</span>
                  <span className="text-white font-semibold">
                    {status.packCredits.sectionA.remaining} / {status.packCredits.sectionA.total}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Section B</span>
                  <span className="text-white font-semibold">
                    {status.packCredits.sectionB.remaining} / {status.packCredits.sectionB.total}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-slate-700 pt-6 mt-6">
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              Upgrade Pack
            </button>
            <p className="text-xs text-slate-500 mt-2 text-center">
              ⚠️ Upgrading will replace your current pack and unused credits will be lost
            </p>
          </div>
        </div>
      )}

      {/* No active pack */}
      {!hasPack && (
        <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
          <div className="text-center">
            <h2 className="text-2xl font-black text-white mb-2">No Active Pack</h2>
            <p className="text-slate-400 mb-6">Purchase a pack to get started</p>
            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-3 px-6 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition-colors"
            >
              View Plans
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

