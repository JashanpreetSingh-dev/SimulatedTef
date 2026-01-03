import React, { useState } from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useCheckout } from '../hooks/useCheckout';
import { UpgradeWarningModal } from './UpgradeWarningModal';
import { useLanguage } from '../contexts/LanguageContext';


export const SubscriptionManagement: React.FC = () => {
  const { status, loading } = useSubscription();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { initiateCheckout } = useCheckout();
  const { t } = useLanguage();
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [showUpgradeWarning, setShowUpgradeWarning] = useState(false);
  const [pendingPackType, setPendingPackType] = useState<'starter' | 'examReady' | null>(null);


  if (loading || !status) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-12 h-full flex items-center justify-center">
        <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl p-6 md:p-8 animate-pulse w-full max-w-md transition-colors shadow-sm">
          <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const getPackName = () => {
    if (status.packType === 'STARTER_PACK') return t('subscription.starterPack');
    if (status.packType === 'EXAM_READY_PACK') return t('subscription.examReadyPack');
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
    <div className="max-w-5xl mx-auto p-4 md:p-12 flex flex-col h-full min-h-0">
      <div className="mb-6 md:mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
        >
          ← {t('back.dashboard')}
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('subscription.title')}</h1>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('subscription.subtitle')}</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        <div className="space-y-6 md:space-y-12 pb-4">
          {/* Current Status Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 md:mb-6 uppercase tracking-wider">{t('subscription.currentStatus')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* TRIAL Status */}
              {hasTrial && (
                <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl p-5 md:p-6 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('subscription.freeTrial')}</h3>
                      <span className="px-2.5 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300 rounded-full text-xs font-bold">{t('subscription.active')}</span>
                    </div>
                  </div>

                  {status.trialDaysRemaining !== undefined && (
                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">{t('subscription.trialDaysRemaining')}</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">{status.trialDaysRemaining}</p>
                    </div>
                  )}

                  <div className="mt-4">
                    <h4 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('subscription.dailyUsage')}</h4>
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between text-sm md:text-base">
                        <span className="text-slate-500 dark:text-slate-400">{t('subscription.fullTests')}</span>
                        <span className="text-slate-800 dark:text-slate-100 font-semibold">
                          {status.usage.fullTestsUsed} / {status.limits.fullTests}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm md:text-base">
                        <span className="text-slate-500 dark:text-slate-400">{t('dashboard.sectionA')}</span>
                        <span className="text-slate-800 dark:text-slate-100 font-semibold">
                          {status.usage.sectionAUsed} / {status.limits.sectionA}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm md:text-base">
                        <span className="text-slate-500 dark:text-slate-400">{t('dashboard.sectionB')}</span>
                        <span className="text-slate-800 dark:text-slate-100 font-semibold">
                          {status.usage.sectionBUsed} / {status.limits.sectionB}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mt-3">{t('subscription.resetsAtMidnight')}</p>
                  </div>
                </div>
              )}

              {/* Pack Status */}
              {hasPack && (
                <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl p-5 md:p-6 transition-colors shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{getPackName()}</h3>
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-bold">{t('subscription.active')}</span>
                    </div>
                  </div>

                  {packDaysRemaining !== null && packDaysRemaining > 0 && (
                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">{t('subscription.daysRemaining')}</p>
                      <p className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">{packDaysRemaining}</p>
                    </div>
                  )}

                  {status.packExpirationDate && (
                    <div className="mb-4 pb-4 border-b border-slate-200 dark:border-slate-700">
                      <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 mb-1">{t('subscription.expirationDate')}</p>
                      <p className="text-sm md:text-base text-slate-800 dark:text-slate-100 font-semibold">
                        {new Date(status.packExpirationDate).toLocaleDateString()}
                      </p>
                    </div>
                  )}

                  {status.packCredits && (
                    <div className="mt-4">
                      <h4 className="text-sm md:text-base font-semibold text-slate-800 dark:text-slate-100 mb-3">{t('subscription.packCredits')}</h4>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-sm md:text-base">
                          <span className="text-slate-500 dark:text-slate-400">{t('subscription.fullTests')}</span>
                          <span className="text-slate-800 dark:text-slate-100 font-semibold">
                            {status.packCredits.fullTests.remaining} / {status.packCredits.fullTests.total}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm md:text-base">
                          <span className="text-slate-500 dark:text-slate-400">{t('dashboard.sectionA')}</span>
                          <span className="text-slate-800 dark:text-slate-100 font-semibold">
                            {status.packCredits.sectionA.remaining} / {status.packCredits.sectionA.total}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm md:text-base">
                          <span className="text-slate-500 dark:text-slate-400">{t('dashboard.sectionB')}</span>
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
                <div className="bg-indigo-100/70 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl md:rounded-2xl p-6 md:p-8 lg:col-span-2 transition-colors shadow-sm">
                  <div className="text-center">
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('subscription.noActivePlan')}</h3>
                    <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('subscription.purchasePackToStart')}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Available Packs Section */}
          <div>
            <h2 className="text-sm font-bold text-slate-500 dark:text-slate-400 mb-4 md:mb-6 uppercase tracking-wider">{t('subscription.availablePacks')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Starter Pack Card */}
              <div className={`bg-indigo-100/70 dark:bg-slate-800/50 border-2 rounded-xl md:rounded-2xl p-5 md:p-6 transition-colors shadow-sm ${isStarterPackActive ? 'border-emerald-500 dark:border-emerald-500 shadow-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('subscription.starterPack')}</h3>
                    {isStarterPackActive && (
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-bold">{t('subscription.current')}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">$19</div>
                    <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{t('subscription.oneTime')}</div>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-sm md:text-base">
                    <span className="text-slate-500 dark:text-slate-400">{t('subscription.fullTests')}</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">5 {t('subscription.total')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm md:text-base">
                    <span className="text-slate-500 dark:text-slate-400">{t('dashboard.sectionA')}</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">10 {t('subscription.total')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm md:text-base">
                    <span className="text-slate-500 dark:text-slate-400">{t('dashboard.sectionB')}</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">10 {t('subscription.total')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm md:text-base">
                    <span className="text-slate-500 dark:text-slate-400">{t('subscription.validFor')}</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">30 {t('subscription.days')}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout('starter')}
                  disabled={isStarterPackActive}
                  className={`w-full py-3 px-4 rounded-lg text-sm md:text-base font-semibold transition-colors ${
                    isStarterPackActive
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isStarterPackActive ? t('subscription.currentPack') : (hasPack ? t('subscription.upgradeToStarterPack') : t('subscription.buyStarterPack'))}
                </button>
                {hasPack && !isStarterPackActive && (
                  <p className="text-xs md:text-sm text-amber-600 dark:text-amber-400 mt-2 text-center">
                    {t('subscription.upgradingReplacesPack')}
                  </p>
                )}
              </div>

              {/* Exam Ready Pack Card */}
              <div className={`bg-indigo-100/70 dark:bg-slate-800/50 border-2 rounded-xl md:rounded-2xl p-5 md:p-6 transition-colors shadow-sm ${isExamReadyPackActive ? 'border-emerald-500 dark:border-emerald-500 shadow-emerald-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg md:text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('subscription.examReadyPack')}</h3>
                    {isExamReadyPackActive && (
                      <span className="px-2.5 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300 rounded-full text-xs font-bold">{t('subscription.current')}</span>
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-2xl md:text-3xl font-black text-slate-800 dark:text-slate-100">$35</div>
                    <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">{t('subscription.oneTime')}</div>
                  </div>
                </div>

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center justify-between text-sm md:text-base">
                    <span className="text-slate-500 dark:text-slate-400">{t('subscription.fullTests')}</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">20 {t('subscription.total')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm md:text-base">
                    <span className="text-slate-500 dark:text-slate-400">{t('dashboard.sectionA')}</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">20 {t('subscription.total')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm md:text-base">
                    <span className="text-slate-500 dark:text-slate-400">{t('dashboard.sectionB')}</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">20 {t('subscription.total')}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm md:text-base">
                    <span className="text-slate-500 dark:text-slate-400">{t('subscription.validFor')}</span>
                    <span className="text-slate-800 dark:text-slate-100 font-semibold">30 {t('subscription.days')}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleCheckout('examReady')}
                  disabled={isExamReadyPackActive}
                  className={`w-full py-3 px-4 rounded-lg text-sm md:text-base font-semibold transition-colors ${
                    isExamReadyPackActive
                      ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 cursor-not-allowed'
                      : 'bg-indigo-400 dark:bg-indigo-500 text-white dark:text-white hover:bg-indigo-500 dark:hover:bg-indigo-600 shadow-sm hover:shadow-md'
                  }`}
                >
                  {isExamReadyPackActive ? t('subscription.currentPack') : (hasPack ? t('subscription.upgradeToExamReadyPack') : t('subscription.buyExamReadyPack'))}
                </button>
                {hasPack && !isExamReadyPackActive && (
                  <p className="text-xs md:text-sm text-amber-600 dark:text-amber-400 mt-2 text-center">
                    {t('subscription.upgradingReplacesPack')}
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
            name: pendingPackType === 'starter' ? t('subscription.starterPack') : t('subscription.examReadyPack'),
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

