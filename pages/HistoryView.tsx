import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { HistoryList } from '../components/HistoryList';
import { DashboardLayout } from '../layouts/DashboardLayout';

type ModuleFilter = 'all' | 'oralExpression' | 'writtenExpression' | 'reading' | 'listening';

const TABS: { key: ModuleFilter; label: string; icon: string }[] = [
  { key: 'all', label: 'All', icon: '📋' },
  { key: 'oralExpression', label: 'Speaking', icon: '🎤' },
  { key: 'writtenExpression', label: 'Writing', icon: '✍️' },
  { key: 'reading', label: 'Reading', icon: '📖' },
  { key: 'listening', label: 'Listening', icon: '🎧' },
];

export function HistoryView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<ModuleFilter>('all');

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-12 flex flex-col h-full min-h-0">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors flex-shrink-0"
        >
          ← {t('back.dashboard')}
        </button>

        {/* Module filter tabs */}
        <div className="flex gap-2 mb-4 md:mb-6 flex-wrap flex-shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1 min-h-0 overflow-hidden">
          <HistoryList module={activeTab === 'all' ? undefined : activeTab} />
        </div>
      </main>
    </DashboardLayout>
  );
}
