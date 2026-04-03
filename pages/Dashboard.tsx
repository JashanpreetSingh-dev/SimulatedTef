import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { PracticeCard } from '../components/dashboard/PracticeCard';
import { DailyRitualCard } from '../components/dashboard/DailyRitualCard';
import { DailyRitualFeatureCallout } from '../components/dashboard/DailyRitualFeatureCallout';
import { MockExamsCard } from '../components/dashboard/MockExamsCard';
import { batchService } from '../services/batchService';
import { Batch } from '../types';
import { useIsD2C } from '../utils/userType';
import { subscriptionService, Subscription } from '../services/subscriptionService';

export function Dashboard() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [hasCompletedFirstPractice, setHasCompletedFirstPractice] = useState(false);
  const isD2C = useIsD2C();

  // Check if user is a professor or admin (admins have all professor permissions)
  const isProfessor = user?.organizationMemberships?.some(
    (membership) => membership.role === 'org:professor' || membership.role === 'org:admin'
  ) ?? false;

  useEffect(() => {
    // Only load batch for B2B students (not D2C users)
    if (!isProfessor && !isD2C) {
      loadBatch();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isProfessor, isD2C]);

  useEffect(() => {
    if (isD2C) {
      loadSubscription();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isD2C]);

  useEffect(() => {
    if (user?.id) {
      const completed = localStorage.getItem(`first_practice_completed_${user.id}`) === 'true';
      setHasCompletedFirstPractice(completed);
    }
  }, [user?.id]);

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

  const loadSubscription = async () => {
    try {
      const getTokenWrapper = async () => getToken();
      const sub = await subscriptionService.getMySubscription(getTokenWrapper);
      setSubscription(sub);
    } catch (err) {
      console.error('Failed to load subscription:', err);
      setSubscription(null);
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
            {isD2C && subscription && (
              <button
                onClick={() => navigate('/subscription')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-xs md:text-sm font-semibold hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-colors"
              >
                <span>⭐</span>
                <span>{subscription.tier.charAt(0).toUpperCase() + subscription.tier.slice(1)} Plan</span>
              </button>
            )}
          </div>
          <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">{t('dashboard.subtitle')}</p>
        </div>

        {isD2C && !hasCompletedFirstPractice && (!subscription || subscription.tier === 'free') && (
          <div className="rounded-xl bg-indigo-600 dark:bg-indigo-500 p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-semibold text-white text-base">Ready to ace your TEF Canada oral?</p>
              <p className="text-indigo-100 text-sm">Start your first AI-powered oral practice session — get real examiner feedback in minutes.</p>
            </div>
            <button
              onClick={() => navigate('/practice')}
              className="shrink-0 px-5 py-2.5 rounded-lg bg-white text-indigo-600 font-semibold text-sm hover:bg-indigo-50 transition-colors"
            >
              Start first oral practice
            </button>
          </div>
        )}

        <DailyRitualFeatureCallout />

        {/* Section Cards */}
        <div className="grid md:grid-cols-2 gap-6">
          <PracticeCard />
          <MockExamsCard />
        </div>
        <DailyRitualCard />
      </main>
    </DashboardLayout>
  );
}
