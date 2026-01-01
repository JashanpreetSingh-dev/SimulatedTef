import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import { PaywallModal } from '../components/PaywallModal';
import { SubscriptionStatus } from '../components/SubscriptionStatus';
import { DashboardLayout } from '../layouts/DashboardLayout';

export function Dashboard() {
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'partA' | 'partB'>('partA');
  const { t } = useLanguage();
  const { status, refreshStatus } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>();
  const [checkoutMessage, setCheckoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Handle checkout redirect - only run once per checkout parameter
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkout = params.get('checkout');
    
    if (!checkout) return; // No checkout parameter, skip
    
    if (checkout === 'success') {
      setCheckoutMessage({ type: 'success', text: 'Payment successful! Your subscription has been activated.' });
      // Refresh subscription status
      refreshStatus();
      // Clean up URL immediately to prevent re-running
      navigate('/dashboard', { replace: true });
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setCheckoutMessage(null), 5000);
      return () => clearTimeout(timer);
    } else if (checkout === 'cancelled') {
      setCheckoutMessage({ type: 'error', text: 'Payment was cancelled. You can try again anytime.' });
      // Clean up URL immediately to prevent re-running
      navigate('/dashboard', { replace: true });
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => setCheckoutMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.search, navigate, refreshStatus]);

  const canStartExamLightweight = (examType: 'full' | 'partA' | 'partB'): { canStart: boolean; reason?: string } => {
    if (!status) {
      return { canStart: false, reason: 'Loading subscription status...' };
    }

    if (status.subscriptionType === 'EXPIRED') {
      return { canStart: false, reason: 'Subscription has expired' };
    }

    if (status.packExpirationDate) {
      const expirationDate = new Date(status.packExpirationDate);
      const now = new Date();
      if (now >= expirationDate) {
        return { canStart: false, reason: 'Pack has expired' };
      }
    }

    if (examType === 'full') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.fullTestsUsed < status.limits.fullTests;
      const hasPackCredits = status.packCredits && status.packCredits.fullTests.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: 'Daily full test limit reached and no pack credits available' };
      }
    } else if (examType === 'partA') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.sectionAUsed < status.limits.sectionA;
      const hasPackCredits = status.packCredits && status.packCredits.sectionA.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: 'Daily Section A limit reached and no pack credits available' };
      }
    } else if (examType === 'partB') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.sectionBUsed < status.limits.sectionB;
      const hasPackCredits = status.packCredits && status.packCredits.sectionB.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: 'Daily Section B limit reached and no pack credits available' };
      }
    }

    return { canStart: true };
  };

  const startExam = (mode: 'partA' | 'partB' | 'full') => {
    const examType = mode === 'full' ? 'full' : mode === 'partA' ? 'partA' : 'partB';
    const result = canStartExamLightweight(examType);
    
    if (result.canStart) {
      // When starting a new exam from the dashboard, always clear any previous
      // session/scenario for this mode so we generate a fresh random task.
      sessionStorage.removeItem(`exam_session_${mode}`);
      sessionStorage.removeItem(`exam_scenario_${mode}`);
      navigate(`/exam/${mode}`);
    } else {
      setPaywallReason(result.reason);
      setShowPaywall(true);
    }
  };

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-6 md:space-y-12">
        <div className="space-y-1 md:space-y-2">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">{t('dashboard.greeting')}, {user?.firstName}!</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
        </div>

        {/* Checkout Success/Error Message */}
        {checkoutMessage && (
          <div className={`rounded-2xl p-4 md:p-6 border ${
            checkoutMessage.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
              : 'bg-red-500/10 border-red-500/20 text-red-400'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {checkoutMessage.type === 'success' ? (
                  <span className="text-2xl">✅</span>
                ) : (
                  <span className="text-2xl">❌</span>
                )}
                <p className="font-semibold">{checkoutMessage.text}</p>
              </div>
              <button
                onClick={() => setCheckoutMessage(null)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {status && status.packType && status.packExpirationDate && new Date(status.packExpirationDate) > new Date() && (() => {
          const expirationDate = new Date(status.packExpirationDate);
          const now = new Date();
          const diffTime = expirationDate.getTime() - now.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays <= 3 && diffDays > 0) {
            return (
              <div className="bg-amber-300/10 border border-amber-300/20 rounded-2xl p-4 md:p-6">
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <h3 className="text-base md:text-lg font-bold text-amber-700 mb-1">
                      Pack Expiring Soon
                    </h3>
                    <p className="text-xs md:text-sm text-amber-800 mb-2">
                      Your {status.packType === 'STARTER_PACK' ? 'Starter Pack' : 'Exam Ready Pack'} expires in {diffDays} {diffDays === 1 ? 'day' : 'days'}.
                    </p>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="text-xs md:text-sm text-amber-700 hover:text-amber-800 font-semibold underline"
                    >
                      Purchase New Pack →
                    </button>
                  </div>
                </div>
              </div>
            );
          }
          return null;
        })()}

        {/* Subscription Status */}
        <div className="hidden md:block">
          <SubscriptionStatus />
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          reason={paywallReason}
        />

        {/* Mobile: Tabs for Section A and B */}
        <div className="md:hidden space-y-4">
          {/* Tab Buttons */}
          <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('partA')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'partA'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-blue-400 dark:text-blue-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t('dashboard.sectionA')}
            </button>
            <button
              onClick={() => setActiveTab('partB')}
              className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all ${
                activeTab === 'partB'
                  ? 'bg-indigo-100 dark:bg-indigo-900/50 text-emerald-400 dark:text-emerald-400 shadow-sm'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {t('dashboard.sectionB')}
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === 'partA' && (
            <div className="bg-indigo-100 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partA')}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">📞</div>
              {status && (status.limits.sectionA > 0 || status.packCredits?.sectionA.remaining) && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('common.available')}</div>
                  <div className="text-lg font-black text-blue-400 dark:text-blue-300">
                    {(() => {
                      const dailyRemaining = status.limits.sectionA > 0 
                        ? Math.max(0, status.limits.sectionA - status.usage.sectionAUsed)
                        : 0;
                      const packRemaining = status.packCredits?.sectionA.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA) || (status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0) ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA && (
                        <span>{t('common.daily')}: {status.limits.sectionA - status.usage.sectionAUsed}/{status.limits.sectionA}</span>
                      )}
                      {status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA && status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0 && <span> • </span>}
                      {status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0 && (
                        <span>{t('common.pack')}: {status.packCredits.sectionA.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{t('dashboard.sectionA')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-3">
                {t('dashboard.sectionADescription')}
              </p>
              <div className="flex items-center text-blue-400 dark:text-blue-300 font-bold text-xs">
                {t('common.commencer')} <span className="ml-1">→</span>
              </div>
            </div>
          )}

          {activeTab === 'partB' && (
            <div className="bg-indigo-100 dark:bg-slate-800/50 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partB')}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/50 rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform">🤝</div>
              {status && (status.limits.sectionB > 0 || status.packCredits?.sectionB.remaining) && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('common.available')}</div>
                  <div className="text-lg font-black text-emerald-400 dark:text-emerald-300">
                    {(() => {
                      const dailyRemaining = status.limits.sectionB > 0 
                        ? Math.max(0, status.limits.sectionB - status.usage.sectionBUsed)
                        : 0;
                      const packRemaining = status.packCredits?.sectionB.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB) || (status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0) ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB && (
                        <span>{t('common.daily')}: {status.limits.sectionB - status.usage.sectionBUsed}/{status.limits.sectionB}</span>
                      )}
                      {status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB && status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0 && <span> • </span>}
                      {status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0 && (
                        <span>{t('common.pack')}: {status.packCredits.sectionB.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
              </div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-1">{t('dashboard.sectionB')}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs leading-relaxed mb-3">
                {t('dashboard.sectionBDescription')}
              </p>
              <div className="flex items-center text-emerald-400 dark:text-emerald-300 font-bold text-xs">
                {t('common.commencer')} <span className="ml-1">→</span>
              </div>
            </div>
          )}

          {/* Exam Complet - Always visible below tabs */}
          <div className="bg-indigo-400 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer" onClick={() => startExam('full')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-indigo-100/20 rounded-xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">🏆</div>
              {status && (
                <div className="text-right">
                  <div className="text-xs text-indigo-200 mb-1">{t('common.available')}</div>
                  <div className="text-lg font-black text-white">
                    {(() => {
                      const dailyRemaining = status.limits.fullTests > 0 
                        ? Math.max(0, status.limits.fullTests - status.usage.fullTestsUsed)
                        : 0;
                      const packRemaining = status.packCredits?.fullTests.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests) || (status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0) ? (
                    <div className="text-xs text-indigo-300 mt-0.5">
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && (
                        <span>{t('common.daily')}: {status.limits.fullTests - status.usage.fullTestsUsed}/{status.limits.fullTests}</span>
                      )}
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && <span> • </span>}
                      {status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && (
                        <span>{t('common.pack')}: {status.packCredits.fullTests.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{t('dashboard.oralExpressionComplete')}</h3>
            <p className="text-indigo-100 text-xs leading-relaxed mb-3">
              {t('dashboard.oralExpressionDescription')}
            </p>
            <div className="flex items-center text-white font-bold text-xs">
              {t('common.commencer')} <span className="ml-1">→</span>
            </div>
          </div>

          {/* Mock Exam Card */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all group cursor-pointer" onClick={() => navigate('/mock-exam')}>
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl group-hover:rotate-12 transition-transform">📚</div>
              {status && (
                <div className="text-right">
                  <div className="text-xs text-purple-100 mb-1">{t('common.available')}</div>
                  <div className="text-lg font-black text-white">
                    {(() => {
                      const dailyRemaining = status.limits.fullTests > 0 
                        ? Math.max(0, status.limits.fullTests - status.usage.fullTestsUsed)
                        : 0;
                      const packRemaining = status.packCredits?.fullTests.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests) || (status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0) ? (
                    <div className="text-xs text-purple-200 mt-0.5">
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && (
                        <span>{t('common.daily')}: {status.limits.fullTests - status.usage.fullTestsUsed}/{status.limits.fullTests}</span>
                      )}
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && <span> • </span>}
                      {status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && (
                        <span>{t('common.pack')}: {status.packCredits.fullTests.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-lg font-bold text-white mb-1">{t('dashboard.mockExam')}</h3>
            <p className="text-purple-100 text-xs leading-relaxed mb-3">
              {t('dashboard.mockExamDescription')}
            </p>
            <div className="flex items-center text-white font-bold text-xs">
              {t('common.startMockExam')} <span className="ml-1">→</span>
            </div>
          </div>
        </div>

        {/* Desktop: 4-column grid (3 exam types + mock exam) */}
        <div className="hidden md:grid md:grid-cols-4 gap-6">
          <div className="bg-indigo-100 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partA')}>
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">📞</div>
              {status && (status.limits.sectionA > 0 || status.packCredits?.sectionA.remaining) && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Available</div>
                  <div className="text-2xl font-black text-blue-400 dark:text-blue-300">
                    {(() => {
                      const dailyRemaining = status.limits.sectionA > 0 
                        ? Math.max(0, status.limits.sectionA - status.usage.sectionAUsed)
                        : 0;
                      const packRemaining = status.packCredits?.sectionA.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA) || (status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0) ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA && (
                        <span>{t('common.daily')}: {status.limits.sectionA - status.usage.sectionAUsed}/{status.limits.sectionA}</span>
                      )}
                      {status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA && status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0 && <span> • </span>}
                      {status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0 && (
                        <span>{t('common.pack')}: {status.packCredits.sectionA.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('dashboard.sectionA')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t('dashboard.sectionADescription')}
            </p>
            <div className="mt-6 flex items-center text-blue-400 dark:text-blue-300 font-bold text-sm">
              {t('common.commencer')} <span className="ml-2">→</span>
            </div>
          </div>

          <div className="bg-indigo-100 dark:bg-slate-800/50 rounded-3xl p-8 border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group cursor-pointer" onClick={() => startExam('partB')}>
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">🤝</div>
              {status && (status.limits.sectionB > 0 || status.packCredits?.sectionB.remaining) && (
                <div className="text-right">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">Available</div>
                  <div className="text-2xl font-black text-emerald-400 dark:text-emerald-300">
                    {(() => {
                      const dailyRemaining = status.limits.sectionB > 0 
                        ? Math.max(0, status.limits.sectionB - status.usage.sectionBUsed)
                        : 0;
                      const packRemaining = status.packCredits?.sectionB.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB) || (status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0) ? (
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                      {status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB && (
                        <span>{t('common.daily')}: {status.limits.sectionB - status.usage.sectionBUsed}/{status.limits.sectionB}</span>
                      )}
                      {status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB && status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0 && <span> • </span>}
                      {status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0 && (
                        <span>{t('common.pack')}: {status.packCredits.sectionB.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">{t('dashboard.sectionB')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              {t('dashboard.sectionBDescription')}
            </p>
            <div className="mt-6 flex items-center text-emerald-400 dark:text-emerald-300 font-bold text-sm">
              {t('common.commencer')} <span className="ml-2">→</span>
            </div>
          </div>

          <div className="bg-indigo-400 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer" onClick={() => startExam('full')}>
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-indigo-100/20 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">🏆</div>
              {status && (
                <div className="text-right">
                  <div className="text-xs text-indigo-200 mb-1">{t('common.available')}</div>
                  <div className="text-2xl font-black text-white">
                    {(() => {
                      const dailyRemaining = status.limits.fullTests > 0 
                        ? Math.max(0, status.limits.fullTests - status.usage.fullTestsUsed)
                        : 0;
                      const packRemaining = status.packCredits?.fullTests.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests) || (status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0) ? (
                    <div className="text-xs text-indigo-300 mt-1">
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && (
                        <span>{t('common.daily')}: {status.limits.fullTests - status.usage.fullTestsUsed}/{status.limits.fullTests}</span>
                      )}
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && <span> • </span>}
                      {status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && (
                        <span>{t('common.pack')}: {status.packCredits.fullTests.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('dashboard.oralExpressionComplete')}</h3>
            <p className="text-indigo-100 text-sm leading-relaxed">
              {t('dashboard.oralExpressionDescription')}
            </p>
            <div className="mt-6 flex items-center text-white font-bold text-sm">
              {t('common.commencer')} <span className="ml-2">→</span>
            </div>
          </div>

          {/* Mock Exam Card */}
          <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-3xl p-8 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all group cursor-pointer" onClick={() => navigate('/mock-exam')}>
            <div className="flex items-start justify-between mb-6">
              <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-2xl group-hover:rotate-12 transition-transform">📚</div>
              {status && (
                <div className="text-right">
                  <div className="text-xs text-purple-100 mb-1">{t('common.available')}</div>
                  <div className="text-2xl font-black text-white">
                    {(() => {
                      const dailyRemaining = status.limits.fullTests > 0 
                        ? Math.max(0, status.limits.fullTests - status.usage.fullTestsUsed)
                        : 0;
                      const packRemaining = status.packCredits?.fullTests.remaining || 0;
                      const total = dailyRemaining + packRemaining;
                      return total > 0 ? total : '0';
                    })()}
                  </div>
                  {(status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests) || (status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0) ? (
                    <div className="text-xs text-purple-200 mt-1">
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && (
                        <span>{t('common.daily')}: {status.limits.fullTests - status.usage.fullTestsUsed}/{status.limits.fullTests}</span>
                      )}
                      {status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests && status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && <span> • </span>}
                      {status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0 && (
                        <span>{t('common.pack')}: {status.packCredits.fullTests.remaining}</span>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{t('dashboard.mockExam')}</h3>
            <p className="text-purple-100 text-sm leading-relaxed">
              {t('dashboard.mockExamDescription')}
            </p>
            <div className="mt-6 flex items-center text-white font-bold text-sm">
              {t('common.startMockExam')} <span className="ml-2">→</span>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
