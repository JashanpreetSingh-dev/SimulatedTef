/**
 * Error component displayed when no audio is available
 */

import React from 'react';
import { useTheme } from '../../../contexts/ThemeContext';
import { useLanguage } from '../../../contexts/LanguageContext';
import { ListeningTask } from '../../../types';

interface NoAudioErrorProps {
  task: ListeningTask;
  onClose?: () => void;
}

export const NoAudioError: React.FC<NoAudioErrorProps> = ({ task, onClose }) => {
  const { theme } = useTheme();
  const { t } = useLanguage();

  return (
    <div style={{ padding: '2rem', textAlign: 'center' }}>
      <h2 style={{ color: theme === 'dark' ? '#fff' : '#000', marginBottom: '1rem' }}>
        ⚠️ {t('listeningExam.noAudioAvailable')}
      </h2>
      <p style={{ color: theme === 'dark' ? '#ccc' : '#666', marginBottom: '1rem' }}>
        {t('listeningExam.noAudioGenerated')}
      </p>
      <p style={{ color: theme === 'dark' ? '#999' : '#888', fontSize: '0.9rem' }}>
        {t('listeningExam.taskId')}: {task.taskId}
      </p>
      {onClose && (
        <button
          onClick={onClose}
          style={{
            marginTop: '1rem',
            padding: '0.5rem 1rem',
            backgroundColor: theme === 'dark' ? '#444' : '#e0e0e0',
            color: theme === 'dark' ? '#fff' : '#000',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {t('listeningExam.close')}
        </button>
      )}
    </div>
  );
};
