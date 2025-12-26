import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useCheckout } from '../hooks/useCheckout';
import { UpgradeWarningModal } from './UpgradeWarningModal';


export const SubscriptionManagement: React.FC = () => {
  const { status, loading } = useSubscription();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { initiateCheckout } = useCheckout();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [showUpgradeWarning, setShowUpgradeWarning] = useState(false);
  const [pendingPackType, setPendingPackType] = useState<'starter' | 'examReady' | null>(null);


  if (loading || !status) {
    return (
      <div className="max-w-6xl mx-auto p-4 h-full flex items-center justify-center">
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 animate-pulse w-full max-w-md transition-colors">
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
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

  const handleCheckout = async (planType: 'starter' | 'examReady') => {
    // Check if user has active pack
    if (status?.packType && status?.packExpirationDate && new Date(status.packExpirationDate) > new Date()) {
      // Show upgrade warning
      setPendingPackType(planType);
      setShowUpgradeWarning(true);
      return;
    }

    // No active pack, proceed with checkout
    await initiateCheckout(planType);
  };

  const handleConfirmUpgrade = async () => {
    if (pendingPackType) {
      setShowUpgradeWarning(false);
      await initiateCheckout(pendingPackType);
      setPendingPackType(null);
    }
  };

  const hasTrial = status.isActive && status.subscriptionType === 'TRIAL';
  const hasPack = status.packType && status.packExpirationDate && new Date(status.packExpirationDate) > new Date();
  const packDaysRemaining = getPackDaysRemaining();
  
  const isStarterPackActive = status.packType === 'STARTER_PACK' && hasPack;
  const isExamReadyPackActive = status.packType === 'EXAM_READY_PACK' && hasPack;

  return (
    <div className="max-w-6xl mx-auto p-4 flex flex-col h-full min-h-0">
      <div className="mb-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-3 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs font-bold uppercase tracking-wider transition-colors"
        >
          ← Back to Dashboard
        </button>
        <h1 className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100 mb-1">Subscription Management</h1>
        <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Manage your subscription and view usage</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 pb-4">
          {/* Current Status Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Current Status</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* TRIAL Status */}
              {hasTrial && (
                <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-5 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Free Trial</h3>
                      <span className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300 rounded-full text-xs font-bold">Active</span>
                    </div>
                  </div>

                  {status.trialDaysRemaining !== undefined && (
                    <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Trial Days Remaining</p>
                      <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">{status.trialDaysRemaining}</p>
                    </div>
                  )}

                  <div className="mt-3">
                    <h4 className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Daily Usage</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Full Tests</span>
                        <span className="text-slate-800 dark:text-slate-100 font-semibold">
                          {status.usage.fullTestsUsed} / {status.limits.fullTests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Section A</span>
                        <span className="text-slate-800 dark:text-slate-100 font-semibold">
                          {status.usage.sectionAUsed} / {status.limits.sectionA}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs md:text-sm">
                        <span className="text-slate-500 dark:text-slate-400">Section B</span>
                        <span className="text-slate-800 dark:text-slate-100 font-semibold">
                          {status.usage.sectionBUsed} / {status.limits.sectionB}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Resets at midnight UTC</p>
                  </div>
                </div>
              )}

              {/* Pack Status */}
              {hasPack && (
                <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-5 transition-colors">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{getPackName()}</h3>
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-bold">Active</span>
                    </div>
                  </div>

                  {packDaysRemaining !== null && packDaysRemaining > 0 && (
                    <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Days Remaining</p>
                      <p className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">{packDaysRemaining}</p>
                    </div>
                  )}

                  {status.packExpirationDate && (
                    <div className="mb-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">Expiration Date</p>
                      <p className="text-sm text-slate-800 dark:text-slate-100 font-semibold">
                        {new Date(status.packExpirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {status.packCredits && (
                    <div className="mt-3">
                      <h4 className="text-xs md:text-sm font-semibold text-slate-800 dark:text-slate-100 mb-2">Pack Credits</h4>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Full Tests</span>
                          <span className="text-slate-800 dark:text-slate-100 font-semibold">
                            {status.packCredits.fullTests.remaining} / {status.packCredits.fullTests.total}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Section A</span>
                          <span className="text-slate-800 dark:text-slate-100 font-semibold">
                            {status.packCredits.sectionA.remaining} / {status.packCredits.sectionA.total}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs md:text-sm">
                          <span className="text-slate-500 dark:text-slate-400">Section B</span>
                          <span className="text-slate-800 dark:text-slate-100 font-semibold">
                            {status.packCredits.sectionB.remaining} / {status.packCredits.sectionB.total}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* No active subscription or pack */}
              {!hasTrial && !hasPack && (
                <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl p-4 md:p-5 lg:col-span-2 transition-colors">
                  <div className="text-center">
                    <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">No Active Plan</h3>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400">Purchase a pack to get started</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Available Packs Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-3 uppercase tracking-wider">Available Packs</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Starter Pack Card */}
              <div className={`bg-indigo-100/70 dark:bg-slate-800/50 border-2 rounded-xl p-4 md:p-5 transition-colors ${isStarterPackActive ? 'border-emerald-500 dark:border-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Starter Pack</h3>
                    {isStarterPackActive && (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-bold">Current</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">$19</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">one-time</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Full Tests</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">5 total</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Section A</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">10 total</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Section B</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">10 total</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Valid for</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">30 days</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout('starter')}
                  disabled={isStarterPackActive}
                  className={`w-full py-2 px-4 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
                    isStarterPackActive
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600'
                  }`}
                >
                  {isStarterPackActive ? 'Current Pack' : (hasPack ? 'Upgrade to Starter Pack' : 'Buy Starter Pack')}
                </button>
                {hasPack && !isStarterPackActive && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 text-center">
                    ⚠️ Upgrading replaces current pack
                  </p>
                )}
              </div>

              {/* Exam Ready Pack Card */}
              <div className={`bg-indigo-100/70 dark:bg-slate-800/50 border-2 rounded-xl p-4 md:p-5 transition-colors ${isExamReadyPackActive ? 'border-emerald-500 dark:border-emerald-500' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">Exam Ready Pack</h3>
                    {isExamReadyPackActive && (
                      <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-bold">Current</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl md:text-2xl font-black text-slate-800 dark:text-slate-100">$35</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">one-time</div>
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Full Tests</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">20 total</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Section A</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">20 total</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Section B</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">20 total</span>
                  </div>
                  <div className="flex items-center justify-between text-xs md:text-sm">
                    <span className="text-slate-500 dark:text-slate-400">Valid for</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">30 days</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout('examReady')}
                  disabled={isExamReadyPackActive}
                  className={`w-full py-2 px-4 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
                    isExamReadyPackActive
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600'
                  }`}
                >
                  {isExamReadyPackActive ? 'Current Pack' : (hasPack ? 'Upgrade to Exam Ready Pack' : 'Buy Exam Ready Pack')}
                </button>
                {hasPack && !isExamReadyPackActive && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 mt-1.5 text-center">
                    ⚠️ Upgrading replaces current pack
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upgrade Warning Modal */}
      {showUpgradeWarning && (
        <UpgradeWarningModal
          isOpen={showUpgradeWarning}
          onClose={() => {
            setShowUpgradeWarning(false);
            setPendingPackType(null);
          }}
          onConfirm={handleConfirmUpgrade}
          currentPack={{
            type: status.packType!,
            name: getPackName() || '',
            expiration: status.packExpirationDate!,
            credits: status.packCredits!,
          }}
          newPack={{
            type: pendingPackType === 'starter' ? 'STARTER_PACK' : 'EXAM_READY_PACK',
            name: pendingPackType === 'starter' ? 'Starter Pack' : 'Exam Ready Pack',
            credits: {
              fullTests: pendingPackType === 'starter' ? 5 : 20,
              sectionA: pendingPackType === 'starter' ? 10 : 20,
              sectionB: pendingPackType === 'starter' ? 10 : 20,
            },
          }}
        />
      )}
    </div>
  );
};

