import React, { useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { WarmupDashboard } from '../components/warmup/WarmupDashboard';
import { WarmupSession } from '../components/warmup/WarmupSession';
import { WarmupComplete } from '../components/warmup/WarmupComplete';
import { warmupService } from '../services/warmupService';

type View = 'dashboard' | 'session' | 'completing' | 'complete';

export function WarmupView() {
  const { getToken } = useAuth();
  const [view, setView] = useState<View>('dashboard');
  const [sessionConfig, setSessionConfig] = useState<{
    systemPrompt: string;
    topic: string;
    keywords: string[];
    sessionId?: string;
    userLevel: string;
    streak: number;
  } | null>(null);
  const [completion, setCompletion] = useState<{
    streak: number;
    feedback: {
      wentWell: string;
      practiceTip: string;
      levelNote: string;
    };
    topicsCovered: string[];
    durationSeconds: number;
    corrections: { original: string; corrected: string; explanation: string }[];
  } | null>(null);

  const localDate = useMemo(
    () => new Date().toLocaleDateString('en-CA'),
    [],
  );

  return (
    <DashboardLayout>
      <main className="max-w-2xl mx-auto p-6 md:p-8 space-y-6 md:space-y-8">
        {view === 'dashboard' && (
          <WarmupDashboard
            onStart={(cfg) => {
              setSessionConfig(cfg);
              setView('session');
            }}
          />
        )}
        {view === 'session' && sessionConfig && (
          <WarmupSession
            systemPrompt={sessionConfig.systemPrompt}
            keywords={sessionConfig.keywords}
            sessionId={sessionConfig.sessionId || localDate}
            onComplete={async (transcript, durationSeconds) => {
              setView('completing');
              try {
                const data = await warmupService.completeSession(
                  sessionConfig.sessionId || localDate,
                  transcript,
                  durationSeconds,
                  getToken,
                );
                setCompletion({
                  streak: data.streak,
                  feedback: data.feedback,
                  topicsCovered: data.topicsCovered || [],
                  durationSeconds,
                  corrections: data.corrections || [],
                });
              } catch (err) {
                console.error(err);
                setCompletion({
                  streak: sessionConfig.streak,
                  feedback: {
                    wentWell: "La séance s'est terminée. Tu peux te féliciter d'avoir parlé en français aujourd'hui.",
                    practiceTip: "Demain, reprends le même sujet et essaie d'ajouter plus de détails.",
                    levelNote: '',
                  },
                  topicsCovered: [],
                  durationSeconds,
                  corrections: [],
                });
              }
              setView('complete');
            }}
          />
        )}
        {view === 'completing' && (
          <div className="space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <div className="h-7 w-40 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-56 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-7 w-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-7 w-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm space-y-3">
              <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-5/6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="h-4 w-4/6 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              <div className="pt-3 border-t border-slate-100 dark:border-slate-700 space-y-2">
                <div className="h-3 w-24 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-full rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
                <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
              </div>
            </div>
            <div className="h-12 w-full rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />
          </div>
        )}
        {view === 'complete' && completion && (
          <WarmupComplete
            streak={completion.streak}
            feedback={completion.feedback}
            topicsCovered={completion.topicsCovered}
            durationSeconds={completion.durationSeconds}
            corrections={completion.corrections}
            onBackToDashboard={() => setView('dashboard')}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
