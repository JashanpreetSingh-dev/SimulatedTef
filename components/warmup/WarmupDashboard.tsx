import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { warmupService } from '../../services/warmupService';
import { WARMUP_TOPICS, WarmupTopic } from '../../constants/warmupTopics';

interface HistorySession {
  date: string;
  status: string;
  durationSeconds: number;
  topic?: string;
  topicsCovered: string[];
  levelAtSession?: string;
  streak?: number;
}

interface Props {
  onStart: (config: {
    systemPrompt: string;
    topic: string;
    phrases: string[];
    sessionId?: string;
    userLevel: string;
    streak: number;
  }) => void;
}

export const WarmupDashboard: React.FC<Props> = ({ onStart }) => {
  const { getToken } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<WarmupTopic | null>(null);
  const [activeTab, setActiveTab] = useState<'easy' | 'medium' | 'history'>('easy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessions, setSessions] = useState<HistorySession[] | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const hasFetchedHistory = useRef(false);

  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const easyTopics = WARMUP_TOPICS.filter((t) => t.difficulty === 'easy');
  const mediumTopics = WARMUP_TOPICS.filter((t) => t.difficulty === 'medium');
  const visibleTopics = activeTab === 'easy' ? easyTopics : mediumTopics;

  const handleTabChange = (tab: 'easy' | 'medium' | 'history') => {
    setActiveTab(tab);
    if (tab === 'history' && !hasFetchedHistory.current) {
      hasFetchedHistory.current = true;
      setHistoryLoading(true);
      warmupService
        .getHistory(getToken)
        .then((data) => setSessions(data))
        .catch(() => setSessions([]))
        .finally(() => setHistoryLoading(false));
    }
  };

  const handleStartClick = async () => {
    if (!selectedTopic) return;
    setLoading(true);
    setError(null);
    try {
      const [config, { sessionId }] = await Promise.all([
        warmupService.getConfig(localDate, selectedTopic.label, getToken, selectedTopic.id),
        warmupService.startSession(localDate, selectedTopic.id, selectedTopic.label, getToken),
      ]);
      onStart({
        systemPrompt: config.systemPrompt,
        topic: selectedTopic.label,
        phrases: config.phrases,
        sessionId,
        userLevel: config.userLevel,
        streak: config.streak,
      });
    } catch (err: any) {
      setError(err?.message || t('warmup.startError'));
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00Z`);
    return d.toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.max(1, Math.round(seconds / 60));
    return t('warmup.historyDuration', { count: String(mins) });
  };

  const completedSessions = sessions?.filter((s) => s.status === 'completed') ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2 md:space-y-3">
        <button
          onClick={() => navigate('/dashboard')}
          className="text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
        >
          ← {t('back.dashboard')}
        </button>
        <h2 className="text-xl md:text-2xl font-bold text-slate-800 dark:text-slate-100">
          {t('warmup.title')}
        </h2>
        <p className="text-sm md:text-base text-slate-500 dark:text-slate-400">
          {t('warmup.subtitle')}
        </p>
      </div>

      {/* Tab bar — pill style matching app-wide pattern */}
      <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
        {(['easy', 'medium', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap ${
              activeTab === tab
                ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab === 'easy'
              ? t('warmup.difficultyEasy')
              : tab === 'medium'
              ? t('warmup.difficultyMedium')
              : t('warmup.historyTab')}
          </button>
        ))}
      </div>

      {/* Topic list (easy / medium) */}
      {activeTab !== 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
          {visibleTopics.map((topic) => {
            const isSelected = selectedTopic?.id === topic.id;
            return (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic)}
                className={`w-full text-left px-5 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                  isSelected
                    ? 'bg-amber-50 dark:bg-amber-900/20'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                }`}
              >
                <span className={`text-sm ${isSelected ? 'font-semibold text-amber-900 dark:text-amber-200' : 'font-medium text-slate-700 dark:text-slate-200'}`}>
                  {topic.label}
                </span>
                {isSelected && (
                  <span className="text-amber-500 shrink-0 text-sm">✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* History tab content */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {historyLoading ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 w-32 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                    <div className="h-3 w-20 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                  </div>
                  <div className="h-5 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                </div>
              ))}
            </div>
          ) : completedSessions.length > 0 ? (
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {completedSessions.map((session, i) => (
                <div key={i} className="px-5 py-3.5 flex items-center gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  {/* Date badge */}
                  <div className="shrink-0 w-10 text-center">
                    <p className="text-[11px] font-black uppercase tracking-wider text-slate-400 dark:text-slate-500 leading-tight">
                      {formatDate(session.date)}
                    </p>
                  </div>
                  {/* Topic */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                      {session.topic || '—'}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {formatDuration(session.durationSeconds)}
                    </p>
                  </div>
                  {/* Level badge */}
                  {session.levelAtSession && (
                    <span className="shrink-0 px-2 py-1 rounded text-xs font-black uppercase tracking-wider bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300">
                      {session.levelAtSession}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center text-sm text-slate-400 dark:text-slate-500">
              {t('warmup.noHistory')}
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p>
      )}

      {/* Start button — hidden on history tab */}
      {activeTab !== 'history' && (
        <div className="space-y-1.5">
          {selectedTopic && !loading && (
            <p className="text-center text-xs text-slate-500 dark:text-slate-400">
              {selectedTopic.label}
            </p>
          )}
          <button
            onClick={handleStartClick}
            disabled={!selectedTopic || loading}
            className={`w-full py-3.5 rounded-xl text-sm font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 transition-all ${
              !selectedTopic || loading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                : 'bg-amber-400 hover:bg-amber-500 text-amber-950 shadow-lg shadow-amber-400/30'
            }`}
          >
            {loading ? (
              <span>{t('warmup.connecting')}</span>
            ) : (
              <>
                <span>🎙</span>
                <span>{selectedTopic ? t('warmup.start') : t('warmup.selectTopic')}</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};
