/**
 * Custom hook for managing audio fetching and blob URLs
 * Handles authenticated audio fetching and cleanup
 */

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ReadingListeningQuestion } from '../../../types';
import { AudioItemMetadata } from '../../../services/tasks';
import { ListeningTask } from '../../../types';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface UseAudioManagementProps {
  currentQuestion: ReadingListeningQuestion | undefined;
  audioItems: AudioItemMetadata[] | null | undefined;
  task: ListeningTask;
  phase: 'reading' | 'playing' | 'answering' | 'transitioning';
  isPracticeAssignment: boolean;
}

export function useAudioManagement({
  currentQuestion,
  audioItems,
  task,
  phase,
  isPracticeAssignment,
}: UseAudioManagementProps) {
  const { getToken } = useAuth();
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const audioBlobUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const fetchAudio = async () => {
      // Clean up previous blob URL
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
      setAudioBlobUrl(null);
      setIsLoadingAudio(true);

      // Determine audio source
      let audioUrl: string | null = null;
      
      if (audioItems && currentQuestion?.audioId) {
        // New structure: use audioId from question
        const audioItem = audioItems.find(item => item.audioId === currentQuestion.audioId);
        if (audioItem && audioItem.hasAudio) {
          audioUrl = `${BACKEND_URL}/api/audio/${audioItem.audioId}?taskId=${encodeURIComponent(task.taskId)}`;
        }
      } else if (task.audioUrl) {
        // Old structure: fallback to task.audioUrl
        audioUrl = task.audioUrl;
      }

      if (!audioUrl) {
        setIsLoadingAudio(false);
        return;
      }

      // If it's an external URL (http/https), use it directly
      if (audioUrl.startsWith('http://') || audioUrl.startsWith('https://')) {
        // For API endpoints, we need to fetch with auth and create blob URL
        if (audioUrl.includes('/api/audio/')) {
          try {
            const token = await getToken();
            // Add cache-busting to ensure fresh audio is fetched
            const separator = audioUrl.includes('?') ? '&' : '?';
            const cacheBuster = `${separator}t=${Date.now()}`;
            const response = await fetch(`${audioUrl}${cacheBuster}`, {
              headers: {
                'Authorization': `Bearer ${token || ''}`,
              },
              cache: 'no-store', // Explicitly disable fetch cache
            });

            if (!response.ok) {
              console.error('Failed to fetch audio:', response.statusText);
              setIsLoadingAudio(false);
              return;
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);
            audioBlobUrlRef.current = objectUrl;
            setAudioBlobUrl(objectUrl);
            setIsLoadingAudio(false);
          } catch (error) {
            console.error('Error fetching audio:', error);
            setIsLoadingAudio(false);
          }
        } else {
          // External URL - use directly
          setAudioBlobUrl(audioUrl);
          setIsLoadingAudio(false);
        }
      } else {
        // Relative URL - use directly
        setAudioBlobUrl(audioUrl);
        setIsLoadingAudio(false);
      }
    };

    // Fetch audio when we have a current question
    // For practice assignments: always fetch (audio is always visible)
    // For mock exams: preload during 'reading' phase so audio is ready when timer ends
    if (currentQuestion && (isPracticeAssignment || phase === 'reading' || phase === 'playing' || (audioItems && currentQuestion.audioId))) {
      fetchAudio();
    }

    // Cleanup on unmount or when question changes
    return () => {
      if (audioBlobUrlRef.current) {
        URL.revokeObjectURL(audioBlobUrlRef.current);
        audioBlobUrlRef.current = null;
      }
    };
  }, [audioItems, currentQuestion?.audioId, task.taskId, task.audioUrl, phase, getToken, isPracticeAssignment]);

  // Only use task.audioUrl as fallback if we don't have audioItems
  // If we have audioItems, we should wait for the blob URL to be ready
  // Use explicit check: only use task.audioUrl if audioItems is null/undefined (not just falsy)
  const currentAudioUrl = audioBlobUrl || (audioItems !== null && audioItems !== undefined ? '' : (task.audioUrl || ''));

  return {
    audioBlobUrl: currentAudioUrl,
    isLoadingAudio,
  };
}
