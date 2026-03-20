import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { warmupService } from '../../services/warmupService';
import { WARMUP_TOPICS, WarmupTopic } from '../../constants/warmupTopics';

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
  const [activeTab, setActiveTab] = useState<'easy' | 'medium'>('easy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localDate = useMemo(() => new Date().toLocaleDateString('en-CA'), []);

  const easyTopics = WARMUP_TOPICS.filter((t) => t.difficulty === 'easy');
  const mediumTopics = WARMUP_TOPICS.filter((t) => t.difficulty === 'medium');
  const visibleTopics = activeTab === 'easy' ? easyTopics : mediumTopics;

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-3 md:mb-6 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 flex items-center gap-2 text-xs md:text-sm font-bold uppercase tracking-wider transition-colors"
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

      {/* Tabs + topic list */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          {(['easy', 'medium'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors ${
                activeTab === tab
                  ? 'text-amber-600 dark:text-amber-400 border-b-2 border-amber-400 -mb-px'
                  : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'
              }`}
            >
              {tab === 'easy' ? t('warmup.difficultyEasy') : t('warmup.difficultyMedium')}
            </button>
          ))}
        </div>

        {/* Topic list */}
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
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
      </div>

      {error && (
        <p className="text-sm text-rose-500 dark:text-rose-400">{error}</p>
      )}

      {/* Start button */}
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
    </div>
  );
};
