import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { ReadingTask } from '../types';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';
import { PracticeTabNavigation } from '../components/practice/PracticeTabNavigation';
import { HistoryList } from '../components/HistoryList';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function ReadingPracticeView() {
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [tasks, setTasks] = useState<ReadingTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'practice' | 'history'>('practice');

  useEffect(() => {
    const load = async () => {
      try {
        const data = await authenticatedFetchJSON<ReadingTask[]>(
          `${BACKEND_URL}/api/tasks/all?type=reading`,
          { getToken: async () => getToken() }
        );
        setTasks(data);
      } catch (err: any) {
        setError(err.message || t('practice.failedToLoadReading'));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [getToken]);

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
        >
          ← {t('back.dashboard')}
        </button>

        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
            {t('modules.reading')}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base">
            {t('practice.freeTestSubtitle')}
          </p>
        </div>

        <div className="mb-6">
          <PracticeTabNavigation activeTab={activeTab} onTabChange={setActiveTab} module="reading" />
        </div>

        {activeTab === 'history' && (
          <HistoryList module="reading" />
        )}

        {activeTab === 'practice' && loading && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-48 bg-slate-200 dark:bg-slate-700 rounded-2xl animate-pulse" />
            ))}
          </div>
        )}

        {activeTab === 'practice' && error && (
          <div className="text-red-500 dark:text-red-400 text-sm p-4 bg-red-50 dark:bg-red-900/20 rounded-xl">
            {error}
          </div>
        )}

        {activeTab === 'practice' && !loading && !error && tasks.length === 0 && (
          <div className="text-slate-500 dark:text-slate-400 text-center py-16">
            {t('practice.noReadingTestsFree')}
          </div>
        )}

        {activeTab === 'practice' && !loading && !error && tasks.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tasks.map((task, index) => (
              <div
                key={task.taskId}
                onClick={() => navigate(`/practice/reading/${task.taskId}`)}
                className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl p-5 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl mb-4 group-hover:rotate-12 transition-transform">
                  📖
                </div>
                <h3 className="text-white font-bold text-base mb-1 line-clamp-2">
                  {t('practice.readingTestTitle', { number: String(index + 1) })}
                </h3>
                <p className="text-blue-100 text-xs leading-relaxed mb-4 line-clamp-2">
                  {task.prompt}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-blue-200 text-xs font-medium">{t('practice.readingTestMeta')}</span>
                  <span className="text-white font-bold text-xs">{t('practice.start')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </DashboardLayout>
  );
}
