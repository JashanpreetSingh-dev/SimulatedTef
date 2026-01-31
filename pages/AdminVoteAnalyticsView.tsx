import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { adminService, VoteAnalytics } from '../services/adminService';
import { formatDateFrench } from '../utils/dateFormatting';
import { useLanguage } from '../contexts/LanguageContext';
import { useOrganization } from '@clerk/clerk-react';

export function AdminVoteAnalyticsView() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { organization } = useOrganization();
  const [analytics, setAnalytics] = useState<VoteAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Check if user is admin
  const isAdmin = user?.organizationMemberships?.some(
    (membership) => membership.role === 'org:admin'
  ) ?? false;

  useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
      return;
    }
    // Reset state when org changes
    setAnalytics(null);
    fetchAnalytics();
  }, [startDate, endDate, isAdmin, navigate, organization?.id]);

  const fetchAnalytics = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);
      const data = await adminService.getVoteAnalytics(getToken, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        orgId: organization?.id, // Pass explicit orgId for org switching
      });
      setAnalytics(data);
    } catch (error) {
      console.error('❌ Failed to fetch vote analytics:', error);
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading && !analytics) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full" />
          <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">
            {t('admin.loadingAnalytics') || 'Loading analytics...'}
          </span>
        </div>
      </DashboardLayout>
    );
  }

  if (!analytics) {
    return (
      <DashboardLayout>
        <div className="max-w-7xl mx-auto p-4 md:p-6">
          <div className="text-center py-12">
            <p className="text-slate-500 dark:text-slate-400">
              {t('admin.failedToLoad') || 'Failed to load analytics'}
            </p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-6">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
            {t('admin.voteAnalytics') || 'Vote Analytics'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {t('admin.voteAnalyticsSubtitle') || 'Analytics for Speaking results voting'}
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.startDate') || 'Start Date'}
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                {t('admin.endDate') || 'End Date'}
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
              >
                {t('admin.reset') || 'Reset'}
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {t('admin.totalVotes') || 'Total Votes'}
            </div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {analytics.summary.totalVotes.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {analytics.summary.totalUpvotes} ↑ / {analytics.summary.totalDownvotes} ↓
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {t('admin.downvotePercentage') || 'Downvote %'}
            </div>
            <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {analytics.summary.downvotePercentage.toFixed(1)}%
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
              {t('admin.totalResults') || 'Total Results'}
            </div>
            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
              {analytics.summary.totalResults.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Breakdown by Mode */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            {t('admin.breakdownByMode') || 'Breakdown by Exam Mode'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {(['full', 'partA', 'partB'] as const).map((mode) => {
              const modeData = analytics.byMode[mode];
              const modeLabel = mode === 'full' 
                ? t('results.section') + ' A & B'
                : mode === 'partA'
                ? t('results.section') + ' A'
                : t('results.section') + ' B';
              
              return (
                <div key={mode} className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                    {modeLabel}
                  </div>
                  <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                    <div>Results: {modeData.totalResults}</div>
                    <div>Upvotes: {modeData.upvotes}</div>
                    <div>Downvotes: {modeData.downvotes}</div>
                    <div className="font-bold">Total: {modeData.votes}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Downvote Reasons */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
            {t('admin.downvoteReasons') || 'Downvote Reasons'}
          </h2>
          <div className="space-y-2">
            {Object.entries(analytics.byReason).map(([reason, count]) => {
              const reasonLabels: Record<string, string> = {
                inaccurate_score: t('voting.reason.inaccurateScore') || 'Inaccurate score/level',
                poor_feedback: t('voting.reason.poorFeedback') || 'Poor or unhelpful feedback',
                technical_issue: t('voting.reason.technicalIssue') || 'Technical issue',
              };
              
              const totalDownvotes = analytics.summary.totalDownvotes;
              const percentage = totalDownvotes > 0 ? (count / totalDownvotes) * 100 : 0;
              
              return (
                <div key={reason} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                    {reasonLabels[reason] || reason}
                  </span>
                  <div className="flex items-center gap-3">
                    <div className="text-sm text-slate-600 dark:text-slate-400">
                      {count} ({percentage.toFixed(1)}%)
                    </div>
                    <div className="w-32 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-rose-500 dark:bg-rose-600"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Top Downvoted Results */}
        {analytics.topDownvotedResults.length > 0 && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-4">
              {t('admin.topDownvotedResults') || 'Top Downvoted Results'}
            </h2>
            <div className="space-y-2">
              {analytics.topDownvotedResults.map((result) => (
                <div
                  key={result.resultId}
                  className="p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
                  onClick={() => navigate(`/result/${result.resultId}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                        {result.title}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        Mode: {result.mode === 'full' ? 'Full' : result.mode === 'partA' ? 'Part A' : 'Part B'}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-rose-600 dark:text-rose-400">
                        {result.downvotes} ↓
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {result.upvotes} ↑
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
