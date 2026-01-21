import React, { useEffect, useState } from 'react';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { adminService, OrgConversationLog } from '../services/adminService';
import { formatDateFrench } from '../utils/dateFormatting';
import { useLanguage } from '../contexts/LanguageContext';

const LOGS_PER_PAGE = 50;

export function AdminUsageView() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [logs, setLogs] = useState<OrgConversationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedLog, setSelectedLog] = useState<OrgConversationLog | null>(null);
  const [summary, setSummary] = useState<{
    totalSessions: number;
    totalTokens: number;
    totalBilledTokens: number;
    totalCost: number;
    uniqueUsers: number;
  } | null>(null);
  
  // Filters
  const [examTypeFilter, setExamTypeFilter] = useState<'partA' | 'partB' | 'all'>('all');
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
    fetchLogs(0, false);
  }, [examTypeFilter, startDate, endDate, isAdmin, navigate]);

  const fetchLogs = async (skip: number = 0, append: boolean = false) => {
    if (!isAdmin) return;

    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const response = await adminService.getOrgLogs(
        getToken,
        {
          examType: examTypeFilter !== 'all' ? examTypeFilter : undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          limit: LOGS_PER_PAGE,
          skip,
        }
      );

      if (append) {
        setLogs(prev => [...prev, ...response.logs]);
      } else {
        setLogs(response.logs);
      }
      setHasMore(response.pagination.hasMore);
      setSummary(response.summary);
    } catch (error) {
      console.error('❌ Failed to fetch org conversation logs:', error);
      setLogs([]);
      setHasMore(false);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchLogs(logs.length, true);
    }
  };

  const formatTokenCount = (count: number): string => {
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(2)}M`;
    }
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const formatCost = (cost: number | undefined): string => {
    if (cost === undefined || cost === null || isNaN(cost)) {
      return '$0.0000';
    }
    if (cost >= 1) {
      return `$${cost.toFixed(2)}`;
    }
    return `$${cost.toFixed(4)}`;
  };

  if (!isAdmin) {
    return null;
  }

  if (loading && logs.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-400 border-t-transparent rounded-full" />
          <span className="ml-3 text-sm text-slate-500 dark:text-slate-400">{t('admin.loadingLogs')}</span>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto p-4 md:p-6 space-y-3">
        <div className="space-y-2">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900 dark:text-slate-100">
              {t('admin.usageTitle')}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {t('admin.usageSubtitle')}
            </p>
          </div>

          {/* Summary Cards */}
          {loading && !summary ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700 animate-pulse">
                  <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded mb-1 w-16"></div>
                  <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-12"></div>
                </div>
              ))}
            </div>
          ) : summary ? (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('admin.sessions')}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {summary.totalSessions.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('admin.users')}</div>
                <div className="text-xl font-bold text-slate-900 dark:text-slate-100">
                  {summary.uniqueUsers.toLocaleString()}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('admin.billedTokens')}</div>
                <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                  {formatTokenCount(summary.totalBilledTokens)}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('admin.finalSize')}</div>
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">
                  {formatTokenCount(summary.totalTokens)}
                </div>
              </div>
              <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
                <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{t('admin.totalCost')}</div>
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {formatCost(summary.totalCost)}
                </div>
              </div>
            </div>
          ) : null}

          {/* Filters */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-2 border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('admin.examType')}
                </label>
                <select
                  value={examTypeFilter}
                  onChange={(e) => setExamTypeFilter(e.target.value as 'partA' | 'partB' | 'all')}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
                >
                  <option value="all">{t('admin.allTypes')}</option>
                  <option value="partA">{t('practice.sectionA')}</option>
                  <option value="partB">{t('practice.sectionB')}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('admin.startDate')}
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  {t('admin.endDate')}
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-2 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm font-bold text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setExamTypeFilter('all');
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="w-full px-3 py-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-sm font-bold text-slate-700 dark:text-slate-300 transition-colors"
                >
                  {t('admin.reset')}
                </button>
              </div>
            </div>
          </div>

          {/* Logs List */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="p-2 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {t('admin.conversationLogs')} ({logs.length} {hasMore ? '+' : ''})
              </h2>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-700">
              {loading && logs.length === 0 ? (
                <div className="p-2 space-y-1">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="h-10 bg-slate-100 dark:bg-slate-700/50 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : logs.length === 0 ? (
                <div className="p-2 text-center text-slate-500 dark:text-slate-400">
                  {t('admin.noLogsFound')}
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log._id || log.sessionId}
                    onClick={() => setSelectedLog(log)}
                    className="p-2 hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-bold ${
                            log.part === 'A'
                              ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300'
                              : 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                          }`}>
                            {t('admin.part')} {log.part}
                          </span>
                          <span className="text-xs text-slate-400 dark:text-slate-500">
                            User: {log.userId.substring(0, 8)}...
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-0.5 truncate">
                          {log.taskTitle}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {formatDateFrench(log.startedAt)}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-0.5">
                          {formatTokenCount(log.metrics.totalBilledTokens || log.metrics.totalTokens)} tokens
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {formatCost(log.metrics.totalCost)}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            {hasMore && (
              <div className="p-2 border-t border-slate-200 dark:border-slate-700 text-center">
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 hover:bg-indigo-200 dark:hover:bg-indigo-900/50 rounded text-sm font-bold text-indigo-700 dark:text-indigo-300 transition-colors disabled:opacity-50"
                >
                  {loadingMore ? t('admin.loading') : t('admin.loadMore')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                {t('admin.sessionDetails')}
              </h2>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{t('admin.information')}</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('admin.task')}:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{selectedLog.taskTitle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('admin.part')}:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{t('results.section')} {selectedLog.part}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('admin.userId')}:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100 font-mono text-xs">{selectedLog.userId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">{t('admin.date')}:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{formatDateFrench(selectedLog.startedAt)}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 dark:text-slate-100 mb-2">{t('admin.tokenUsage')}</h3>
                <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                      {formatTokenCount(selectedLog.metrics.totalTokens)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.conversationSize')}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('admin.finalContext')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                      {formatTokenCount(selectedLog.metrics.totalBilledTokens || selectedLog.metrics.totalTokens)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.totalBilled')}</div>
                    <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">{t('admin.allTurns')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                      {formatCost(selectedLog.metrics.totalCost)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{t('admin.totalCostLabel')}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
