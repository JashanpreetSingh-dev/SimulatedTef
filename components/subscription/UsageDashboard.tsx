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
  currentMonth: string;
  resetDate: string;
  daysUntilReset: number;
}

interface UsageDashboardProps {
  refreshKey?: number; // Key to force refresh
}

export function UsageDashboard({ refreshKey }: UsageDashboardProps = {}) {
  const { getToken } = useAuth();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUsage();
  }, [refreshKey]); // Reload when refreshKey changes

  const loadUsage = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await subscriptionService.getUsage(getToken);
      setUsageData(data);
    } catch (err: any) {
      console.error('Failed to load usage:', err);
      setError(err.message || 'Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error || !usageData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800 p-6">
        <p className="text-red-600 dark:text-red-400">{error || 'Failed to load usage data'}</p>
      </div>
    );
  }

  const { usage, limits, daysUntilReset, resetDate } = usageData;

  const getUsagePercentage = (used: number, limit: number): number => {
    if (limit === -1) return 0; // Unlimited
    if (limit === 0) return 100; // No limit but used
    return Math.min((used / limit) * 100, 100);
  };

  const getUsageColor = (used: number, limit: number): string => {
    if (limit === -1) return 'bg-emerald-500'; // Unlimited
    const percentage = getUsagePercentage(used, limit);
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const formatResetDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Usage This Month
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Limits reset on {formatResetDate(resetDate)} ({daysUntilReset} {daysUntilReset === 1 ? 'day' : 'days'} remaining)
        </p>
      </div>

      <div className="space-y-6">
        {/* Section A Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Section A Speaking Practice
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {usage.sectionAUsed} / {limits.sectionALimit === -1 ? '∞' : limits.sectionALimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getUsageColor(usage.sectionAUsed, limits.sectionALimit)}`}
              style={{
                width: `${getUsagePercentage(usage.sectionAUsed, limits.sectionALimit)}%`,
              }}
            />
          </div>
          {limits.sectionALimit !== -1 && usage.sectionAUsed >= limits.sectionALimit && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Limit reached. Upgrade to continue practicing.
            </p>
          )}
        </div>

        {/* Section B Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Section B Speaking Practice
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {usage.sectionBUsed} / {limits.sectionBLimit === -1 ? '∞' : limits.sectionBLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getUsageColor(usage.sectionBUsed, limits.sectionBLimit)}`}
              style={{
                width: `${getUsagePercentage(usage.sectionBUsed, limits.sectionBLimit)}%`,
              }}
            />
          </div>
          {limits.sectionBLimit !== -1 && usage.sectionBUsed >= limits.sectionBLimit && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Limit reached. Upgrade to continue practicing.
            </p>
          )}
        </div>

        {/* Mock Exam Usage */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Mock Exams
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {usage.mockExamsUsed} / {limits.mockExamLimit === -1 ? '∞' : limits.mockExamLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getUsageColor(usage.mockExamsUsed, limits.mockExamLimit)}`}
              style={{
                width: `${getUsagePercentage(usage.mockExamsUsed, limits.mockExamLimit)}%`,
              }}
            />
          </div>
          {limits.mockExamLimit !== -1 && usage.mockExamsUsed >= limits.mockExamLimit && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Limit reached. Upgrade to continue practicing.
            </p>
          )}
        </div>

        {/* Written Expression Section A */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Written Expression (Section A)
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {usage.writtenExpressionSectionAUsed ?? 0} / {limits.writtenExpressionSectionALimit === -1 ? '∞' : (limits.writtenExpressionSectionALimit ?? 1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getUsageColor(usage.writtenExpressionSectionAUsed ?? 0, limits.writtenExpressionSectionALimit ?? 1)}`}
              style={{
                width: `${getUsagePercentage(usage.writtenExpressionSectionAUsed ?? 0, limits.writtenExpressionSectionALimit ?? 1)}%`,
              }}
            />
          </div>
          {(limits.writtenExpressionSectionALimit ?? 1) !== -1 && (usage.writtenExpressionSectionAUsed ?? 0) >= (limits.writtenExpressionSectionALimit ?? 1) && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Limit reached. Upgrade to continue practicing.
            </p>
          )}
        </div>

        {/* Written Expression Section B */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Written Expression (Section B)
            </span>
            <span className="text-sm font-bold text-gray-900 dark:text-white">
              {usage.writtenExpressionSectionBUsed ?? 0} / {limits.writtenExpressionSectionBLimit === -1 ? '∞' : (limits.writtenExpressionSectionBLimit ?? 1)}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${getUsageColor(usage.writtenExpressionSectionBUsed ?? 0, limits.writtenExpressionSectionBLimit ?? 1)}`}
              style={{
                width: `${getUsagePercentage(usage.writtenExpressionSectionBUsed ?? 0, limits.writtenExpressionSectionBLimit ?? 1)}%`,
              }}
            />
          </div>
          {(limits.writtenExpressionSectionBLimit ?? 1) !== -1 && (usage.writtenExpressionSectionBUsed ?? 0) >= (limits.writtenExpressionSectionBLimit ?? 1) && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              Limit reached. Upgrade to continue practicing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
