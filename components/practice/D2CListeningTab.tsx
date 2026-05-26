import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ListeningTask, ReadingListeningQuestion, MCQResult } from '../../types';
import { AudioItemMetadata } from '../../services/tasks';
import { authenticatedFetchJSON } from '../../services/authenticatedFetch';
import { ListeningComprehensionExam } from '../ListeningComprehensionExam';
import { getStorageKey } from '../listening/utils/listeningExamPersistence';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface TaskWithAttempt {
  taskId: string;
  questionCount: number;
  attempted: boolean;
  bestScore: number | null;
  totalQuestions: number;
  attemptCount: number;
}

interface TaskListResponse {
  tasks: TaskWithAttempt[];
  type: string;
}

interface TaskData {
  task: ListeningTask;
  questions: ReadingListeningQuestion[];
  audioItems: AudioItemMetadata[] | null;
}

function getDisplayName(taskId: string): string {
  const testNumber = taskId.split('_').pop() ?? taskId;
  return `Test ${testNumber}`;
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm animate-pulse">
      <div className="flex items-start justify-between mb-3">
        <div className="h-5 w-20 bg-slate-200 dark:bg-slate-700 rounded" />
        <div className="h-5 w-16 bg-slate-200 dark:bg-slate-700 rounded-full" />
      </div>
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded mb-4" />
      <div className="h-9 w-full bg-slate-200 dark:bg-slate-700 rounded-lg" />
    </div>
  );
}

export function D2CListeningTab() {
  const { getToken } = useAuth();
  const [taskList, setTaskList] = useState<TaskWithAttempt[] | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithAttempt | null>(null);
  const [taskData, setTaskData] = useState<TaskData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loadingTask, setLoadingTask] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTaskList = useCallback(async () => {
    try {
      setError(null);
      const data = await authenticatedFetchJSON<TaskListResponse>(
        `${BACKEND_URL}/api/tasks/active/listening`,
        { method: 'GET', getToken }
      );
      setTaskList(data.tasks);
    } catch (err) {
      console.error('Failed to fetch listening task list:', err);
      setError('Impossible de charger les exercices. Veuillez réessayer.');
      setTaskList([]);
    }
  }, [getToken]);

  useEffect(() => {
    fetchTaskList();
  }, [fetchTaskList]);

  const handleStart = async (task: TaskWithAttempt) => {
    setSelectedTask(task);
    setLoadingTask(true);
    setError(null);
    try {
      const data = await authenticatedFetchJSON<{
        task: ListeningTask;
        questions: ReadingListeningQuestion[];
        count: number;
        audioItems?: AudioItemMetadata[] | null;
      }>(
        `${BACKEND_URL}/api/tasks/${task.taskId}/with-questions`,
        { method: 'GET', getToken }
      );
      setTaskData({
        task: data.task,
        questions: data.questions,
        audioItems: data.audioItems ?? null,
      });
      setSessionId(crypto.randomUUID());
    } catch (err) {
      console.error('Failed to fetch listening task:', err);
      setError('Impossible de charger le test. Veuillez réessayer.');
      setSelectedTask(null);
    } finally {
      setLoadingTask(false);
    }
  };

  const handleBack = () => {
    setSelectedTask(null);
    setTaskData(null);
    setSessionId(null);
  };

  const handleComplete = (result: MCQResult) => {
    if (selectedTask && sessionId) {
      const storageKey = getStorageKey(selectedTask.taskId, sessionId);
      localStorage.removeItem(storageKey);
    }
    setSelectedTask(null);
    setTaskData(null);
    setSessionId(null);
    fetchTaskList();
  };

  // Exam view
  if (selectedTask && taskData && sessionId && !loadingTask) {
    return (
      <ListeningComprehensionExam
        task={taskData.task}
        questions={taskData.questions}
        audioItems={taskData.audioItems}
        sessionId={sessionId}
        onComplete={handleComplete}
        onClose={handleBack}
      />
    );
  }

  // Loading task data
  if (loadingTask) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Chargement du test…</p>
        </div>
      </div>
    );
  }

  // Task list view
  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          Compréhension Orale
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Sélectionnez un test pour commencer
        </p>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchTaskList}
            className="mt-2 text-sm font-medium text-red-600 dark:text-red-400 underline"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {taskList === null && !error && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {taskList !== null && taskList.length === 0 && !error && (
        <div className="text-center py-12">
          <p className="text-slate-500 dark:text-slate-400">Aucun exercice disponible</p>
        </div>
      )}

      {/* Task grid */}
      {taskList !== null && taskList.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {taskList.map((task) => {
            const displayName = getDisplayName(task.taskId);
            return (
              <div
                key={task.taskId}
                className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    {displayName}
                  </h3>
                  {task.attempted ? (
                    <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                      Meilleur score&nbsp;: {task.bestScore}/{task.totalQuestions}
                    </span>
                  ) : (
                    <span className="shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400">
                      Non tenté
                    </span>
                  )}
                </div>

                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {task.totalQuestions} questions
                </p>

                <button
                  onClick={() => handleStart(task)}
                  className="mt-auto w-full py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white text-sm font-medium transition-colors"
                >
                  Commencer
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
