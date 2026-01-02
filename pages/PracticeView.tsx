import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useSubscription } from '../hooks/useSubscription';
import { PaywallModal } from '../components/PaywallModal';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HistoryList } from '../components/HistoryList';
import { PracticeTabNavigation } from '../components/practice/PracticeTabNavigation';
import { ExpressionOraleTab } from '../components/practice/ExpressionOraleTab';
import { ExpressionEcritTab } from '../components/practice/ExpressionEcritTab';
import { PracticeModuleSelector } from '../components/practice/PracticeModuleSelector';

export function PracticeView() {
  const navigate = useNavigate();
  // Restore module selection from sessionStorage or URL state
  const [selectedModule, setSelectedModule] = useState<'oral' | 'written' | null>(() => {
    const stored = sessionStorage.getItem('practice_selected_module');
    return (stored === 'oral' || stored === 'written') ? stored : null;
  });
  const [practiceTab, setPracticeTab] = useState<'practice' | 'history'>('practice');
  const { t } = useLanguage();
  const { status } = useSubscription();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallReason, setPaywallReason] = useState<string>();

  // Save module selection to sessionStorage when it changes
  useEffect(() => {
    if (selectedModule) {
      sessionStorage.setItem('practice_selected_module', selectedModule);
    } else {
      sessionStorage.removeItem('practice_selected_module');
    }
  }, [selectedModule]);

  const canStartExamLightweight = (examType: 'full' | 'partA' | 'partB'): { canStart: boolean; reason?: string } => {
    if (!status) {
      return { canStart: false, reason: t('errors.loadingSubscription') };
    }

    // Super user bypasses all checks
    if (status.isSuperUser) {
      return { canStart: true };
    }

    if (status.subscriptionType === 'EXPIRED') {
      return { canStart: false, reason: t('errors.subscriptionExpired') };
    }

    if (status.packExpirationDate) {
      const expirationDate = new Date(status.packExpirationDate);
      const now = new Date();
      if (now >= expirationDate) {
        return { canStart: false, reason: t('errors.packExpired') };
      }
    }

    if (examType === 'full') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.fullTestsUsed < status.limits.fullTests;
      const hasPackCredits = status.packCredits && status.packCredits.fullTests.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: t('errors.fullTestLimitReached') };
      }
    } else if (examType === 'partA') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.sectionAUsed < status.limits.sectionA;
      const hasPackCredits = status.packCredits && status.packCredits.sectionA.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: t('errors.sectionALimitReached') };
      }
    } else if (examType === 'partB') {
      const hasTrialLimit = status.isActive && status.subscriptionType === 'TRIAL' && 
        status.usage.sectionBUsed < status.limits.sectionB;
      const hasPackCredits = status.packCredits && status.packCredits.sectionB.remaining > 0;
      
      if (!hasTrialLimit && !hasPackCredits) {
        return { canStart: false, reason: t('errors.sectionBLimitReached') };
      }
    }

    return { canStart: true };
  };

  const startExam = (mode: 'partA' | 'partB' | 'full', isWrittenExpression: boolean = false) => {
    if (isWrittenExpression) {
      // Written expression has no limits - navigate directly
      sessionStorage.removeItem(`exam_session_written_${mode}`);
      sessionStorage.removeItem(`exam_scenario_written_${mode}`);
      // Pass module context in state for proper back navigation
      navigate(`/exam/written/${mode}`, { 
        state: { 
          from: '/practice',
          module: 'written',
          selectedModule: selectedModule 
        } 
      });
    } else {
      // Oral expression - check limits
      const examType = mode === 'full' ? 'full' : mode === 'partA' ? 'partA' : 'partB';
      const result = canStartExamLightweight(examType);
      
      if (result.canStart) {
        sessionStorage.removeItem(`exam_session_${mode}`);
        sessionStorage.removeItem(`exam_scenario_${mode}`);
        // Pass module context in state for proper back navigation
        navigate(`/exam/${mode}`, { 
          state: { 
            from: '/practice',
            module: 'oral',
            selectedModule: selectedModule 
          } 
        });
      } else {
        setPaywallReason(result.reason);
        setShowPaywall(true);
      }
    }
  };

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-6 md:space-y-12">
        <div className="space-y-1 md:space-y-2">
          {!selectedModule ? (
            <button 
              onClick={() => navigate('/dashboard')}
              className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
            >
              ← {t('back.dashboard')}
            </button>
          ) : (
            <button 
              onClick={() => {
                setSelectedModule(null);
                setPracticeTab('practice');
              }}
              className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
            >
              ← {t('back.practice')}
            </button>
          )}
          {!selectedModule ? (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">{t('practice.title')}</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
            </>
          ) : (
            <>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100">
                {practiceTab === 'practice' 
                  ? t('practice.title')
                  : t('history.title')
                }
              </h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                {practiceTab === 'practice'
                  ? (selectedModule === 'oral' 
                      ? t('practice.oralSubtitle') 
                      : t('practice.writtenSubtitle'))
                  : t('history.subtitle')
                }
              </p>
            </>
          )}
        </div>

        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          reason={paywallReason}
        />

        {/* Show module selector if no module selected */}
        {!selectedModule ? (
          <PracticeModuleSelector onSelectModule={setSelectedModule} />
        ) : (
          <>

            {/* Practice Tab Navigation */}
            <PracticeTabNavigation 
              activeTab={practiceTab} 
              onTabChange={setPracticeTab}
              module={selectedModule}
            />

            {/* Practice Tab Content */}
            <div className="min-h-[400px]">
              {practiceTab === 'practice' ? (
                selectedModule === 'oral' ? (
                  <ExpressionOraleTab status={status} onStartExam={(mode) => startExam(mode, false)} />
                ) : (
                  <ExpressionEcritTab onStartExam={(mode) => startExam(mode, true)} />
                )
              ) : (
                /* History Tab Content */
                <div className="flex-1 min-h-0 overflow-hidden">
                  <HistoryList module={selectedModule === 'oral' ? 'oralExpression' : 'writtenExpression'} />
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
