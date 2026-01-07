import React from 'react';
import { useUser } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PracticeCard } from '../components/dashboard/PracticeCard';
import { MockExamsCard } from '../components/dashboard/MockExamsCard';

export function Dashboard() {
  const { user } = useUser();
  const { t } = useLanguage();

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-6 md:space-y-8">
        <div className="space-y-2 md:space-y-4">
          <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">{t('dashboard.greeting')}, {user?.firstName}!</h2>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
        </div>

        {/* Section Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <PracticeCard />
          <MockExamsCard />
        </div>
      </main>
    </DashboardLayout>
  );
}
