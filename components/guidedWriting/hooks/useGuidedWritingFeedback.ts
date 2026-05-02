import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { WrittenTask } from '../../../types';
import type { GuidedFeedback } from '../../../services/guidedWritingFeedback';
import { fetchGuidedWritingFeedback } from '../../../services/guidedWritingFeedbackApi';

interface UseGuidedWritingFeedbackOptions {
  task: WrittenTask;
  section: 'A' | 'B';
}

export function useGuidedWritingFeedback({ task, section }: UseGuidedWritingFeedbackOptions) {
  const { getToken } = useAuth();
  const [feedback, setFeedback] = useState<GuidedFeedback | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequestedText, setLastRequestedText] = useState<string>('');

  const requestFeedback = useCallback(async (text: string) => {
    // Don't request if text is empty
    if (!text.trim()) {
      setError('Veuillez écrire quelque chose avant de demander un retour.');
      return;
    }

    // Don't request if text hasn't changed
    if (text === lastRequestedText && feedback) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      if (!token) {
        setError('Veuillez vous connecter pour utiliser le compagnon d’écriture.');
        return;
      }
      const result = await fetchGuidedWritingFeedback(getToken, { text, section, task });
      setFeedback(result);
      setLastRequestedText(text);
    } catch (err: any) {
      const errorMessage = err?.message || 'Une erreur est survenue lors de la demande de retour.';
      setError(errorMessage);
      console.error('Error requesting feedback:', err);
    } finally {
      setIsLoading(false);
    }
  }, [task, section, lastRequestedText, feedback, getToken]);

  const clearFeedback = useCallback(() => {
    setFeedback(null);
    setError(null);
    setLastRequestedText('');
  }, []);

  return {
    feedback,
    isLoading,
    error,
    requestFeedback,
    clearFeedback
  };
}