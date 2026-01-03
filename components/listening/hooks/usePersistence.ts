/**
 * Custom hook for managing exam persistence
 * Handles localStorage save/load and auto-save functionality
 */

import { useEffect, useRef } from 'react';
import { loadSavedState, saveState, getStorageKey, clearSavedState, SavedExamState } from '../utils/listeningExamPersistence';
import { ReadingListeningQuestion } from '../../../types';
import { ListeningTask } from '../../../types';

const AUTO_SAVE_INTERVAL = 5000; // 5 seconds

interface UsePersistenceProps {
  task: ListeningTask;
  sessionId: string;
  questions: ReadingListeningQuestion[];
  answers: (number | null)[];
  currentQuestionIndex: number;
  hasStarted: boolean;
  startTime: number | null;
  onStateLoaded?: (state: SavedExamState) => void;
}

export function usePersistence({
  task,
  sessionId,
  questions,
  answers,
  currentQuestionIndex,
  hasStarted,
  startTime,
  onStateLoaded,
}: UsePersistenceProps) {
  const autoSaveRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = getStorageKey(task.taskId, sessionId);

  // Load saved state on mount
  useEffect(() => {
    const savedState = loadSavedState(storageKey, questions.length);
    if (savedState && onStateLoaded) {
      onStateLoaded(savedState);
    }
  }, [storageKey, questions.length, onStateLoaded]);

  // Auto-save to localStorage
  useEffect(() => {
    if (!hasStarted) return;

    autoSaveRef.current = setTimeout(() => {
      saveState(storageKey, answers, currentQuestionIndex, startTime);
    }, AUTO_SAVE_INTERVAL);

    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, [answers, currentQuestionIndex, storageKey, hasStarted, startTime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (autoSaveRef.current) {
        clearTimeout(autoSaveRef.current);
      }
    };
  }, []);

  return {
    storageKey,
    clearSavedState: () => clearSavedState(storageKey),
  };
}
