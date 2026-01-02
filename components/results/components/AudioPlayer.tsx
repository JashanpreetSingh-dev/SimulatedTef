import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';

interface AudioPlayerProps {
  recordingId: string | undefined;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ recordingId }) => {
  const { t } = useLanguage();
  const { audioUrl, audioLoading, audioError, setAudioError } = useAudioPlayer(recordingId);

  if (audioLoading) {
    return (
      <div className="flex-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="w-4 h-4 border-2 border-indigo-400 dark:border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
        <span>{t('results.audioLoading')}</span>
      </div>
    );
  }

  if (audioError) {
    return (
      <div className="flex-1 text-xs text-rose-600 dark:text-rose-400">
        {t('results.audioError')} {audioError}
      </div>
    );
  }

  if (!audioUrl) {
    return null;
  }

  return (
    <audio 
      controls 
      className="flex-1 h-7 sm:h-8"
      src={audioUrl}
      preload="auto"
      onLoadedMetadata={(e) => {
        const target = e.target as HTMLAudioElement;
        const duration = target.duration;
        if (duration && !isNaN(duration) && isFinite(duration) && duration > 0) {
          console.log('✅ Audio duration:', duration.toFixed(2), 'seconds');
        } else if (duration === Infinity) {
          console.log('ℹ️ Duration not in header (WebM/OGG), will be available after playback starts');
        }
      }}
      onDurationChange={(e) => {
        const target = e.target as HTMLAudioElement;
        if (target.duration && isFinite(target.duration) && target.duration > 0) {
          console.log('✅ Duration updated:', target.duration.toFixed(2), 'seconds');
        }
      }}
      onError={(e) => {
        console.error('Audio playback error:', e);
        const target = e.target as HTMLAudioElement;
        if (target.error) {
          console.error('Audio error details:', {
            code: target.error.code,
            message: target.error.message,
            networkState: target.networkState,
          });
          setAudioError(`Playback error: ${target.error.message}`);
        }
      }}
      onLoadStart={() => {
        console.log('🎵 Audio loading started');
      }}
      onCanPlay={() => {
        console.log('✅ Audio ready to play');
      }}
      onPlay={(e) => e.stopPropagation()}
      onPause={(e) => e.stopPropagation()}
      onTimeUpdate={(e) => e.stopPropagation()}
    >
      {t('results.audioNotSupported')}
    </audio>
  );
};
