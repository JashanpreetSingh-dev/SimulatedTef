import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { HistoryList } from '../components/HistoryList';
import { DashboardLayout } from '../layouts/DashboardLayout';

export function HistoryView() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-4 md:p-6 lg:p-12 flex flex-col h-full min-h-0">
        <button 
          onClick={() => navigate('/dashboard')}
          className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors flex-shrink-0"
        >
          ← {t('back.dashboard')}
        </button>
        <div className="flex-1 min-h-0 overflow-hidden">
          <HistoryList />
        </div>
      </main>
    </DashboardLayout>
  );
}
