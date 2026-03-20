import React, { useMemo, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { WarmupDashboard } from '../components/warmup/WarmupDashboard';
import { WarmupSession } from '../components/warmup/WarmupSession';
import { WarmupComplete } from '../components/warmup/WarmupComplete';
import { warmupService } from '../services/warmupService';

type View = 'dashboard' | 'session' | 'complete';

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
                });
              }
              setView('complete');
            }}
          />
        )}
        {view === 'complete' && completion && (
          <WarmupComplete
            streak={completion.streak}
            feedback={completion.feedback}
            topicsCovered={completion.topicsCovered}
            durationSeconds={completion.durationSeconds}
            onBackToDashboard={() => setView('dashboard')}
          />
        )}
      </main>
    </DashboardLayout>
  );
}
