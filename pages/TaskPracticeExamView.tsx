import React, { useEffect, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import { ReadingTask, ListeningTask, ReadingListeningQuestion } from '../types';
import { AudioItemMetadata } from '../services/tasks';
import { ReadingComprehensionExam } from '../components/ReadingComprehensionExam';
import { ListeningComprehensionExam } from '../components/ListeningComprehensionExam';
import { authenticatedFetchJSON } from '../services/authenticatedFetch';
import { useLanguage } from '../contexts/LanguageContext';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface TaskWithQuestions {
  task: ReadingTask | ListeningTask;
  questions: ReadingListeningQuestion[];
  count: number;
  audioItems: AudioItemMetadata[] | null;
}

export function TaskPracticeExamView() {
  const { taskId } = useParams<{ taskId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { getToken } = useAuth();
  const { t } = useLanguage();

  const isListening = location.pathname.startsWith('/practice/listening');
  const practiceSessionId = `practice_${taskId}_${Date.now()}`;

  const [data, setData] = useState<TaskWithQuestions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!taskId) return;

    const load = async () => {
      try {
        const result = await authenticatedFetchJSON<TaskWithQuestions>(
          `${BACKEND_URL}/api/tasks/${taskId}/with-questions`,
          { getToken: async () => getToken() }
        );
        setData(result);
      } catch (err: any) {
        setError(err.message || t('practice.failedToLoadExam'));
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskId]); // getToken intentionally omitted — Clerk reissues a new reference on silent refresh, which would re-fetch the whole task

  const handleComplete = (result: any) => {
    if (result?.resultId) {
      navigate(`/results/${result.resultId}`);
    } else {
      navigate('/history');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="text-slate-500 dark:text-slate-400 text-sm">{t('status.loadingExam')}</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900 p-8">
        <div className="text-center">
          <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error || t('practice.examNotFound')}</p>
          <button
            onClick={() => navigate(isListening ? '/listening-practice' : '/reading-practice')}
            className="text-indigo-500 hover:text-indigo-600 text-sm font-bold"
          >
            {t('back.toTests')}
          </button>
        </div>
      </div>
    );
  }

  if (isListening) {
    return (
      <ListeningComprehensionExam
        task={data.task as ListeningTask}
        questions={data.questions}
        audioItems={data.audioItems}
        sessionId={practiceSessionId}
        onComplete={handleComplete}
        onClose={() => navigate('/listening-practice')}
      />
    );
  }

  return (
    <ReadingComprehensionExam
      task={data.task as ReadingTask}
      questions={data.questions}
      sessionId={practiceSessionId}
      onComplete={handleComplete}
      onClose={() => navigate('/reading-practice')}
    />
  );
}
