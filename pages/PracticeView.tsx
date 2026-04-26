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
import { useUser } from '@clerk/clerk-react';
import { useIsD2C } from '../utils/userType';
import { BackNavButton } from '../components/navigation/BackNavButton';
import { usePageTour } from '../hooks/usePageTour';

const PRACTICE_STEPS = [
  {
    element: '#tour-practice-tab-switcher',
    popover: {
      title: '🎤 Oral  ·  ✍️ Written',
      description: 'Switch between Oral Expression (speaking) and Written Expression (essays). Both are tested on the real TEF Canada.',
      side: 'bottom' as const,
      align: 'start' as const,
    },
  },
  {
    element: '#tour-practice-content',
    popover: {
      title: '📋 Section A & Section B',
      description: 'Each section gives you a prompt to respond to — then AI grades you the same way a real TEF Canada examiner would. Pick a section and go.',
      side: 'top' as const,
      align: 'start' as const,
      nextBtnText: "Let's practice! →",
    },
  },
];

export function PracticeView() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useUser();
  const isD2C = useIsD2C();
  usePageTour(isD2C ? user?.id : undefined, 'practice', PRACTICE_STEPS);
  const limitReachedState = location.state as { limitReached?: boolean; reason?: string; switchTo?: 'oral' | 'written' } | undefined;
  const [dismissedLimitBanner, setDismissedLimitBanner] = useState(false);
  const showLimitBanner = Boolean(limitReachedState?.limitReached && !dismissedLimitBanner);
  // D2C users always land on 'oral', unless the getting-started widget deep-linked to 'written'.
  const [selectedModule, setSelectedModule] = useState<'oral' | 'written' | 'reading' | 'listening' | null>(() => {
    if (isD2C) {
      return limitReachedState?.switchTo ?? 'oral';
    }
    const stored = sessionStorage.getItem('practice_selected_module');
    if (stored === 'oral' || stored === 'written' || stored === 'reading' || stored === 'listening') {
      return stored;
    }
    return null;
  });
  const [practiceTab, setPracticeTab] = useState<'practice' | 'history'>('practice');
  const { t } = useLanguage();

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
          {isD2C ? (
            <BackNavButton onClick={() => navigate('/dashboard')} label={t('back.dashboard')} />
          ) : !selectedModule ? (
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
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
            {practiceTab === 'practice'
              ? t('practice.title')
              : t('history.title')
            }
          </h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
            {!selectedModule
              ? t('dashboard.subtitle')
              : practiceTab === 'practice'
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
        </div>

        {/* D2C: inline oral/written tab switcher. B2B: module selector grid. */}
        {isD2C ? (
          <>
            {/* D2C module tabs — Oral / Written */}
            <div
              id="tour-practice-tab-switcher"
              className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide"
              role="tablist"
              aria-label="Practice modules"
            >
              <button
                type="button"
                role="tab"
                aria-selected={selectedModule === 'oral'}
                onClick={() => { setSelectedModule('oral'); setPracticeTab('practice'); }}
                onKeyDown={(e) => { if (e.key === 'ArrowRight') { e.preventDefault(); setSelectedModule('written'); } }}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                  selectedModule === 'oral'
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                🎤 {t('practice.oralExpression')}
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={selectedModule === 'written'}
                onClick={() => { setSelectedModule('written'); setPracticeTab('practice'); }}
                onKeyDown={(e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); setSelectedModule('oral'); } }}
                className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
                  selectedModule === 'written'
                    ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-400 shadow-sm'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                ✍️ {t('practice.writtenExpression')}
              </button>
            </div>

            {/* Practice / History sub-tabs */}
            <PracticeTabNavigation
              activeTab={practiceTab}
              onTabChange={setPracticeTab}
              module={selectedModule as 'oral' | 'written'}
            />

            {/* Content */}
            <div id="tour-practice-content" className="min-h-[400px]">
              {practiceTab === 'practice' ? (
                selectedModule === 'oral' ? (
                  <ExpressionOraleTab onStartExam={(mode) => startExam(mode, false)} />
                ) : (
                  <ExpressionEcritTab onStartExam={(mode) => startExam(mode, true)} />
                )
              ) : (
                <div className="flex-1 min-h-0 overflow-hidden">
                  <HistoryList module={selectedModule === 'oral' ? 'oralExpression' : 'writtenExpression'} />
                </div>
              )}
            </div>
          </>
        ) : !selectedModule ? (
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
