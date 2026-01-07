import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../contexts/ThemeContext';

interface AudioPlayerProps {
  src: string;
  onEnded?: () => void;
  onError?: (error: Error) => void;
  autoPlay?: boolean;
  className?: string;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  src,
  onEnded,
  onError,
  autoPlay = false,
  className = '',
}) => {
  const { theme } = useTheme();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isLoading, setIsLoading] = useState(true);

  // Reset state when src changes (important for navigation between questions)
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setIsLoading(true);
    
    // Load the new audio source
    if (audioRef.current) {
      audioRef.current.load();
    }
  }, [src]);

  // Update current time and handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => {
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
        setIsLoading(false);
      }
    };
    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
      onEnded?.();
    };
    const handleError = () => {
      setIsLoading(false);
      const error = new Error('Failed to load audio');
      onError?.(error);
    };
    const handleCanPlay = () => {
      setIsLoading(false);
      // Also check duration on canplay in case loadedmetadata was missed
      if (audio.duration && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('durationchange', updateDuration);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('canplay', handleCanPlay);

    // Check if metadata is already loaded (in case events fired before listeners attached)
    if (audio.readyState >= 1 && audio.duration && isFinite(audio.duration)) {
      setDuration(audio.duration);
      setIsLoading(false);
    }

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('durationchange', updateDuration);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [src, onEnded, onError]);

  // Workaround for webm/blob URLs that don't report duration properly
  // Force browser to calculate duration by briefly seeking to end
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !src) return;

    const fixDuration = () => {
      // If duration is Infinity or not set, try to force calculation
      if (!isFinite(audio.duration) || audio.duration === 0) {
        const originalTime = audio.currentTime;
        
        const handleSeeked = () => {
          if (isFinite(audio.duration) && audio.duration > 0) {
            setDuration(audio.duration);
          }
          // Seek back to original position
          audio.currentTime = originalTime;
          audio.removeEventListener('seeked', handleSeeked);
        };
        
        audio.addEventListener('seeked', handleSeeked);
        // Seek to a very large number - browser will clamp to actual end
        audio.currentTime = 1e101;
      }
    };

    // Try to fix duration after a short delay to let the audio load
    const timer = setTimeout(fixDuration, 500);
    
    return () => clearTimeout(timer);
  }, [src]);

  // Set volume and playback rate
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = volume;
    audio.playbackRate = playbackRate;
  }, [volume, playbackRate]);

  // Auto-play if requested
  useEffect(() => {
    if (autoPlay && audioRef.current && !isLoading) {
      audioRef.current.play().catch((error) => {
        console.error('Auto-play failed:', error);
        onError?.(error);
      });
    }
  }, [autoPlay, isLoading, onError]);

  const togglePlayPause = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      if (isPlaying) {
        audio.pause();
        setIsPlaying(false);
      } else {
        await audio.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      onError?.(error instanceof Error ? error : new Error('Playback failed'));
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current;
    if (!audio || !duration) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number): string => {
    if (isNaN(seconds) || !isFinite(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className={`audio-player ${className}`}>
      <audio ref={audioRef} src={src} preload="auto" />
      
      <div className="flex items-center gap-4">
        {/* Play/Pause Button */}
        <button
          onClick={togglePlayPause}
          disabled={isLoading}
          className={`
            p-2 rounded-full transition-colors
            ${theme === 'dark' 
              ? 'bg-slate-700 hover:bg-slate-600 text-slate-100' 
              : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-700'
            }
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isLoading ? (
            <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : isPlaying ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1 flex items-center gap-2">
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {formatTime(currentTime)}
          </span>
          <div
            onClick={handleSeek}
            className={`
              flex-1 h-2 rounded-full cursor-pointer relative
              ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-200'}
            `}
          >
            <div
              className={`
                h-full rounded-full transition-all
                ${theme === 'dark' ? 'bg-indigo-400' : 'bg-indigo-500'}
              `}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <span className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
            {formatTime(duration)}
          </span>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-2">
          <svg className={`w-4 h-4 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`} fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20"
          />
        </div>

        {/* Playback Speed */}
        <select
          value={playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
          className={`
            px-2 py-1 rounded text-sm
            ${theme === 'dark' 
              ? 'bg-slate-700 text-slate-100 border-slate-600' 
              : 'bg-white text-slate-700 border-slate-300'
            }
            border
          `}
        >
          <option value="0.5">0.5x</option>
          <option value="0.75">0.75x</option>
          <option value="1">1x</option>
          <option value="1.25">1.25x</option>
          <option value="1.5">1.5x</option>
          <option value="2">2x</option>
        </select>
      </div>
    </div>
  );
};
