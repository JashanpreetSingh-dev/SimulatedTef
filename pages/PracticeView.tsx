import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import { PaywallModal } from '../components/PaywallModal';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HistoryList } from '../components/HistoryList';
import { PracticeTabNavigation } from '../components/practice/PracticeTabNavigation';
import { ExpressionOraleTab } from '../components/practice/ExpressionOraleTab';

export function PracticeView() {
  const navigate = useNavigate();
  const [practiceTab, setPracticeTab] = useState<'expression-orale' | 'history'>('expression-orale');
  const { t } = useLanguage();
  const { status } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>();

  const canStartExamLightweight = (examType: 'full' | 'partA' | 'partB'): { canStart: boolean; reason?: string } => {
    if (!status) {
      return { canStart: false, reason: 'Loading subscription status...' };
    }

    // Super user bypasses all checks
    if (status.isSuperUser) {
      return { canStart: true };
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
          <button 
            onClick={() => navigate('/dashboard')}
            className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
          >
            ← {t('back.dashboard')}
          </button>
          <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">Practice</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          reason={paywallReason}
        />

        {/* Practice Tab Navigation */}
        <PracticeTabNavigation 
          activeTab={practiceTab} 
          onTabChange={setPracticeTab} 
        />

        {/* Practice Tab Content */}
        <div className="min-h-[400px]">
          {practiceTab === 'expression-orale' ? (
            <ExpressionOraleTab status={status} onStartExam={startExam} />
          ) : (
            /* History Tab Content */
            <div className="flex-1 min-h-0 overflow-hidden">
              <HistoryList />
            </div>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
