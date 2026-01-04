import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { HistoryList } from '../components/HistoryList';
import { PracticeTabNavigation } from '../components/practice/PracticeTabNavigation';
import { ExpressionOraleTab } from '../components/practice/ExpressionOraleTab';
import { ExpressionEcritTab } from '../components/practice/ExpressionEcritTab';
import { ReadingTab } from '../components/practice/ReadingTab';
import { ListeningTab } from '../components/practice/ListeningTab';
import { PracticeModuleSelector } from '../components/practice/PracticeModuleSelector';

export function PracticeView() {
  const navigate = useNavigate();
  // Restore module selection from sessionStorage or URL state
  const [selectedModule, setSelectedModule] = useState<'oral' | 'written' | 'reading' | 'listening' | null>(() => {
    const stored = sessionStorage.getItem('practice_selected_module');
    return (stored === 'oral' || stored === 'written' || stored === 'reading' || stored === 'listening') ? stored : null;
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
      // Oral expression - navigate directly (no limits)
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
              ) : (
                /* History Tab Content */
                <div className="flex-1 min-h-0 overflow-hidden">
                  <HistoryList module={
                    selectedModule === 'oral' ? 'oralExpression' :
                    selectedModule === 'written' ? 'writtenExpression' :
                    selectedModule === 'reading' ? 'reading' :
                    selectedModule === 'listening' ? 'listening' : 'oralExpression'
                  } />
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </DashboardLayout>
  );
}
