import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HistoryList } from '../components/HistoryList';
import { PracticeTabNavigation } from '../components/practice/PracticeTabNavigation';
import { ExpressionOraleTab } from '../components/practice/ExpressionOraleTab';
import { ExpressionEcritTab } from '../components/practice/ExpressionEcritTab';
import { ReadingTab } from '../components/practice/ReadingTab';
import { ListeningTab } from '../components/practice/ListeningTab';
import { PracticeModuleSelector } from '../components/practice/PracticeModuleSelector';
import { useIsD2C } from '../utils/userType';
import { BackNavButton } from '../components/navigation/BackNavButton';

export function PracticeView() {
  const navigate = useNavigate();
  const location = useLocation();
  const isD2C = useIsD2C();
  const limitReachedState = location.state as { limitReached?: boolean; reason?: string } | undefined;
  const [dismissedLimitBanner, setDismissedLimitBanner] = useState(false);
  const showLimitBanner = Boolean(limitReachedState?.limitReached && !dismissedLimitBanner);
  // Restore module selection from sessionStorage or URL state
  // D2C users can only access 'oral' and 'written' modules
  const [selectedModule, setSelectedModule] = useState<'oral' | 'written' | 'reading' | 'listening' | null>(() => {
    const stored = sessionStorage.getItem('practice_selected_module');
    if (stored === 'oral' || stored === 'written') {
      return stored;
    }
    // If stored module is reading/listening but user is D2C, reset to null
    if (stored === 'reading' || stored === 'listening') {
      return null;
    }
    return null;
  });
  const [practiceTab, setPracticeTab] = useState<'practice' | 'history'>('practice');
  const { t } = useLanguage();

  // Reset module if D2C user tries to access reading/listening
  useEffect(() => {
    if (isD2C && (selectedModule === 'reading' || selectedModule === 'listening')) {
      setSelectedModule(null);
      sessionStorage.removeItem('practice_selected_module');
    }
  }, [isD2C, selectedModule]);

  // Save module selection to sessionStorage when it changes
  useEffect(() => {
    if (selectedModule) {
      sessionStorage.setItem('practice_selected_module', selectedModule);
    } else {
      sessionStorage.removeItem('practice_selected_module');
    }
  }, [selectedModule]);

  const startExam = (mode: 'partA' | 'partB' | 'full', isWrittenExpression: boolean = false) => {
    if (isWrittenExpression) {
      // Written expression - navigate directly
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
      // Oral expression - navigate directly (B2B mode - no limits)
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
    }
  };

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-12 space-y-6 md:space-y-12">
        <div className="space-y-1 md:space-y-2">
          {showLimitBanner && (
            <div className="mb-4 p-4 rounded-lg bg-amber-100 dark:bg-amber-900/30 border border-amber-300 dark:border-amber-700 flex items-start justify-between gap-3">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                {limitReachedState?.reason || t('errors.writtenExpressionLimitReached')}
              </p>
              <button
                type="button"
                onClick={() => setDismissedLimitBanner(true)}
                className="shrink-0 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 text-sm font-medium"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          )}
          {!selectedModule ? (
            <BackNavButton onClick={() => navigate('/dashboard')} label={t('back.dashboard')} />
          ) : (
            <BackNavButton
              onClick={() => {
                setSelectedModule(null);
                setPracticeTab('practice');
              }}
              label={t('back.practice')}
            />
          )}
          {!selectedModule ? (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{t('practice.title')}</h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
            </>
          ) : (
            <>
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
                {practiceTab === 'practice' 
                  ? t('practice.title')
                  : t('history.title')
                }
              </h2>
              <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
                {practiceTab === 'practice'
                  ? (selectedModule === 'oral' 
                      ? t('practice.oralSubtitle') 
                      : selectedModule === 'written'
                      ? t('practice.writtenSubtitle')
                      : selectedModule === 'reading'
                      ? t('practice.readingSubtitle')
                      : selectedModule === 'listening'
                      ? t('practice.listeningSubtitle')
                      : '')
                  : t('history.subtitle')
                }
              </p>
            </>
          )}
        </div>

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
                  <ExpressionOraleTab onStartExam={(mode) => startExam(mode, false)} />
                ) : selectedModule === 'written' ? (
                  <ExpressionEcritTab onStartExam={(mode) => startExam(mode, true)} />
                ) : selectedModule === 'reading' ? (
                  <ReadingTab />
                ) : selectedModule === 'listening' ? (
                  <ListeningTab />
                ) : null
              ) : practiceTab === 'history' ? (
                /* History Tab Content */
                <div className="flex-1 min-h-0 overflow-hidden">
                  <HistoryList module={
                    selectedModule === 'oral' ? 'oralExpression' :
                    selectedModule === 'written' ? 'writtenExpression' :
                    selectedModule === 'reading' ? 'reading' :
                    selectedModule === 'listening' ? 'listening' : 'oralExpression'
                  } />
                </div>
              ) : null}
            </div>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
