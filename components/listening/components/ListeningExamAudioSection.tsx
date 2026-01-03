/**
 * Audio section component for listening exam
 * Displays audio player with loading states
 */

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { AudioPlayer } from '../../AudioPlayer';
import { Phase } from '../hooks/useListeningExamState';
import { ListeningTask } from '../../../types';

interface ListeningExamAudioSectionProps {
  phase: Phase;
  audioUrl: string | null;
  isLoadingAudio: boolean;
  task: ListeningTask;
  isPracticeAssignment: boolean;
  onAudioEnded: () => void;
}

export const ListeningExamAudioSection: React.FC<ListeningExamAudioSectionProps> = ({
  phase,
  audioUrl,
  isLoadingAudio,
  task,
  isPracticeAssignment,
  onAudioEnded,
}) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  // Audio Player - always visible for practice assignments, or during playing phase for mock exams
  if (!isPracticeAssignment && phase !== 'playing') {
    return null;
  }

  return (
    <div className={`
      mb-6 p-4 rounded-lg
      ${theme === 'dark' ? 'bg-slate-800 border border-slate-700' : 'bg-white border border-slate-300'}
    `}>
      {!isPracticeAssignment && (
        <p className={`
          text-center mb-4 font-semibold
          ${theme === 'dark' ? 'text-slate-200' : 'text-slate-800'}
        `}>
          {t('listeningExam.listenToAudio')}
        </p>
      )}
      {isLoadingAudio ? (
        <div className={`p-4 text-center ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-current mr-2"></div>
          {t('listeningExam.loadingAudio')}
        </div>
      ) : audioUrl && audioUrl !== task.audioUrl ? (
        <AudioPlayer
          src={audioUrl}
          onEnded={onAudioEnded}
          autoPlay={!isPracticeAssignment} // Don't auto-play for practice assignments
          onError={(error) => {
            console.error('Audio playback error:', error);
          }}
        />
      ) : audioUrl === task.audioUrl && task.audioUrl ? (
        <div className={`p-4 ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
          ⚠️ {t('listeningExam.audioNotAvailable')}
        </div>
      ) : (
        <div className={`p-4 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
          {t('listeningExam.loadingAudio')}
        </div>
      )}
    </div>
  );
};
