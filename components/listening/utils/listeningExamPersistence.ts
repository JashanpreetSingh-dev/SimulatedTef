/**
 * Persistence utilities for listening comprehension exam
 * Handles localStorage save/load operations
 */

const STORAGE_KEY_PREFIX = 'listening_exam_';

export interface SavedExamState {
  answers: (number | null)[];
  currentQuestionIndex: number;
  startTime: number | null;
}

/**
 * Generate storage key for an exam session
 */
export function getStorageKey(taskId: string, sessionId: string): string {
  return `${STORAGE_KEY_PREFIX}${taskId}_${sessionId}`;
}

/**
 * Load saved exam state from localStorage
 */
export function loadSavedState(storageKey: string, questionsLength: number): SavedExamState | null {
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const savedData = JSON.parse(saved);
      if (savedData.answers && Array.isArray(savedData.answers)) {
        // Ensure answers array matches current questions length
        const paddedAnswers = [...savedData.answers];
        while (paddedAnswers.length < questionsLength) {
          paddedAnswers.push(null);
        }
        return {
          answers: paddedAnswers.slice(0, questionsLength),
          currentQuestionIndex: savedData.currentQuestionIndex !== undefined
            ? Math.min(savedData.currentQuestionIndex, questionsLength - 1)
            : 0,
          startTime: savedData.startTime || null,
        };
      }
    }
  } catch (error) {
    console.error('Failed to load saved state:', error);
  }
  return null;
}

/**
 * Save exam state to localStorage
 */
export function saveState(
  storageKey: string,
  answers: (number | null)[],
  currentQuestionIndex: number,
  startTime: number | null
): void {
  try {
    localStorage.setItem(storageKey, JSON.stringify({
      answers,
      currentQuestionIndex,
      startTime,
    }));
  } catch (error) {
    console.error('Failed to save state:', error);
  }
}

/**
 * Clear saved exam state
 */
export function clearSavedState(storageKey: string): void {
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Failed to clear saved state:', error);
  }
}
