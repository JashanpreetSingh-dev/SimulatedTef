import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PracticeCard } from '../components/dashboard/PracticeCard';
import { MockExamsCard } from '../components/dashboard/MockExamsCard';
import { batchService } from '../services/batchService';
import { Batch } from '../types';

export function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const [batch, setBatch] = useState<Batch | null>(null);

  // Check if user is a professor
  const isProfessor = user?.organizationMemberships?.some(
    (membership) => membership.role === 'org:professor'
  ) ?? false;

  useEffect(() => {
    if (!isProfessor) {
      loadBatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfessor]);

  const loadBatch = async () => {
    try {
      const getTokenWrapper = async () => getToken();
      const batchData = await batchService.getMyBatch(getTokenWrapper);
      setBatch(batchData);
    } catch (err) {
      console.error('Failed to load batch:', err);
      setBatch(null);
    }
  };

  return (
    <DashboardLayout>
      <main className="max-w-5xl mx-auto p-6 md:p-8 space-y-6 md:space-y-8">
        <div className="space-y-2 md:space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
              {t('dashboard.greeting')}, {user?.firstName}!
            </h2>
            {!isProfessor && batch && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs md:text-sm font-semibold">
                <span>👥</span>
                <span>{batch.name}</span>
              </span>
            )}
          </div>
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
