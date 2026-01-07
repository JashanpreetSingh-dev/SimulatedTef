import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';
import { useAudioPlayer } from '../hooks/useAudioPlayer';
import { AudioPlayer as SharedAudioPlayer } from '../../AudioPlayer';

interface AudioPlayerProps {
  recordingId: string | undefined;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ recordingId }) => {
  const { t } = useLanguage();
  const { audioUrl, audioLoading, audioError } = useAudioPlayer(recordingId);

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

  return <SharedAudioPlayer src={audioUrl} className="flex-1" />;
};
