import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { subscriptionService } from '../../services/subscriptionService';

interface UsageData {
  usage: {
    sectionAUsed: number;
    sectionBUsed: number;
    mockExamsUsed: number;
    writtenExpressionSectionAUsed?: number;
    writtenExpressionSectionBUsed?: number;
  };
  limits: {
    sectionALimit: number;
    sectionBLimit: number;
    mockExamLimit: number;
    writtenExpressionSectionALimit?: number;
    writtenExpressionSectionBLimit?: number;
  };
  currentPeriod?: string;
  resetDate: string;
  daysUntilReset: number;
  cancelAtPeriodEnd?: boolean;
}

interface UsageDashboardProps {
  refreshKey?: number;
}

function displayUsed(used: number, limit: number): number {
  return limit === -1 ? used : Math.min(used, limit);
}

function getUsagePercentage(used: number, limit: number): number {
  if (limit === -1) return 0;
  if (limit === 0) return 100;
  return Math.min((used / limit) * 100, 100);
}

function getUsageVariant(used: number, limit: number): 'success' | 'warning' | 'danger' | 'unlimited' {
  if (limit === -1) return 'unlimited';
  const pct = getUsagePercentage(used, limit);
  if (pct >= 100) return 'danger';
  if (pct >= 80) return 'warning';
  return 'success';
}

/** Format reset/next-billing date in UTC to match Stripe Customer Portal (Stripe uses UTC). */
function formatResetDate(dateString: string): string {
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

interface UsageRowProps {
  label: string;
  used: number;
  limit: number;
  icon: React.ReactNode;
}

function UsageRow({ label, used, limit, icon }: UsageRowProps) {
  const displayLimit = limit === -1 ? '∞' : limit;
  const variant = getUsageVariant(used, limit);
  const pct = getUsagePercentage(used, limit);
  const atLimit = limit !== -1 && used >= limit;

  const barBg =
    variant === 'danger'
      ? 'bg-red-500 dark:bg-red-500'
      : variant === 'warning'
        ? 'bg-amber-500 dark:bg-amber-500'
        : 'bg-emerald-500 dark:bg-emerald-500';

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400" aria-hidden>
            {icon}
          </span>
          <span className="text-xs font-medium text-slate-600 dark:text-slate-400 truncate">{label}</span>
        </div>
        <span className={`text-xs font-semibold tabular-nums shrink-0 ${atLimit ? 'text-red-600 dark:text-red-400' : 'text-slate-900 dark:text-white'}`}>
          {displayUsed(used, limit)}/{displayLimit}
          {atLimit && <span className="ml-0.5 text-[10px] font-normal">· limit</span>}
        </span>
      </div>
      <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-300 ease-out ${barBg}`}
          style={{ width: variant === 'unlimited' ? '100%' : `${pct}%` }}
          role="progressbar"
          aria-valuenow={used}
          aria-valuemin={0}
          aria-valuemax={limit === -1 ? undefined : limit}
          aria-label={`${label}: ${used} of ${displayLimit} used`}
        />
      </div>
    </div>
  );
}

export function UsageDashboard({ refreshKey }: UsageDashboardProps = {}) {
  const { getToken } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsage();
  }, [refreshKey]);

  const loadUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionService.getUsage(getToken);
      setUsageData(data);
    } catch (err: unknown) {
      console.error('Failed to load usage:', err);
      setError(err instanceof Error ? err.message : 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-24 animate-pulse" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-20 animate-pulse" />
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between">
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 animate-pulse" />
                <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-10 animate-pulse" />
              </div>
              <div className="h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-950/20 px-4 py-3">
        <p className="text-red-700 dark:text-red-300 text-sm mb-2">{error || 'Failed to load usage data'}</p>
        <button
          type="button"
          onClick={loadUsage}
          className="text-xs font-semibold text-red-700 dark:text-red-300 hover:underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
        >
          Try again
        </button>
      </div>
    );
  }

  const { usage, limits, daysUntilReset, resetDate, cancelAtPeriodEnd } = usageData;
  const iconClass = 'h-3 w-3';

  const rows: Array<{ label: string; used: number; limit: number; icon: React.ReactNode }> = [
    { label: 'Speaking A', used: usage.sectionAUsed, limit: limits.sectionALimit, icon: <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0V8m0 0V4a2 2 0 012-2h2a2 2 0 012 2v4z" /></svg> },
    { label: 'Speaking B', used: usage.sectionBUsed, limit: limits.sectionBLimit, icon: <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0V8m0 0V4a2 2 0 012-2h2a2 2 0 012 2v4z" /></svg> },
    { label: 'Mock exams', used: usage.mockExamsUsed, limit: limits.mockExamLimit, icon: <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg> },
    { label: 'Written A', used: usage.writtenExpressionSectionAUsed ?? 0, limit: limits.writtenExpressionSectionALimit ?? 1, icon: <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> },
    { label: 'Written B', used: usage.writtenExpressionSectionBUsed ?? 0, limit: limits.writtenExpressionSectionBLimit ?? 1, icon: <svg className={iconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg> },
  ];

  return (
    <div className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden shadow-sm">
      <div className="px-4 py-2.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-slate-900 dark:text-white">
          Usage
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {cancelAtPeriodEnd
            ? <>Subscription ends {formatResetDate(resetDate)} · <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{daysUntilReset}</span> {daysUntilReset === 1 ? 'day' : 'days'} left</>
            : <>Resets {formatResetDate(resetDate)} · <span className="tabular-nums font-medium text-slate-700 dark:text-slate-300">{daysUntilReset}</span> {daysUntilReset === 1 ? 'day' : 'days'} left</>}
        </p>
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
        {rows.map((r) => (
          <UsageRow key={r.label} label={r.label} used={r.used} limit={r.limit} icon={r.icon} />
        ))}
      </div>
    </div>
  );
}
