import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { authenticatedFetch } from '../../../services/authenticatedFetch';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export function useAudioPlayer(recordingId: string | undefined) {
  const { getToken } = useAuth();
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!recordingId) {
      return;
    }

    const loadAudio = async () => {
      try {
        setAudioLoading(true);
        setAudioError(null);
        
        // Clean up previous object URL if it exists
        if (audioObjectUrlRef.current) {
          URL.revokeObjectURL(audioObjectUrlRef.current);
          audioObjectUrlRef.current = null;
        }
        
        const response = await authenticatedFetch(`${BACKEND_URL}/api/recordings/${recordingId}`, {
          getToken: getToken,
        });

        if (!response.ok) {
          throw new Error(`Failed to load audio: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);
        
        audioObjectUrlRef.current = objectUrl;
        setAudioUrl(objectUrl);
        setAudioLoading(false);
        
      } catch (error: any) {
        console.error('Error loading audio:', error);
        setAudioError(error.message || 'Failed to load audio recording');
        setAudioLoading(false);
      }
    };

    loadAudio();

    // Cleanup: revoke object URL when component unmounts or recordingId changes
    return () => {
      if (audioObjectUrlRef.current) {
        URL.revokeObjectURL(audioObjectUrlRef.current);
        audioObjectUrlRef.current = null;
      }
    };
  }, [recordingId, getToken]);

  return {
    audioUrl,
    audioLoading,
    audioError,
    setAudioError,
  };
}
