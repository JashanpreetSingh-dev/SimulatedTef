import React, { useState, useEffect, useRef } from 'react';
import { WrittenTask } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { WrittenExpressionHeader } from '../writtenExpression/WrittenExpressionHeader';
import { FrenchAccentBar } from '../writtenExpression/FrenchAccentBar';
import { insertCharacterAtCursor } from '../writtenExpression/utils/textUtils';
import { CompanionPanel } from './CompanionPanel';
import { useGuidedWritingFeedback } from './hooks/useGuidedWritingFeedback';

interface GuidedWritingEditorProps {
  task: WrittenTask;
  section: 'A' | 'B';
  onFinish: (text: string) => void;
}

export const GuidedWritingEditor: React.FC<GuidedWritingEditorProps> = ({
  task,
  section,
  onFinish,
}) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(section === 'A' ? 25 * 60 : 35 * 60);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  /** Tailwind `md` — only one editor layout mounts so textareaRef matches the visible field (fixes accent/caret bugs). */
  const [isMdUp, setIsMdUp] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 768px)').matches : false
  );

  const { feedback, isLoading, error, requestFeedback, clearFeedback } = useGuidedWritingFeedback({
    task,
    section,
  });

  // Reset state when task changes
  useEffect(() => {
    setText('');
    setTimeLeft(section === 'A' ? 25 * 60 : 35 * 60);
    clearFeedback();
  }, [task.section, task.id, section, clearFeedback]);

  // Timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [task.section, task.id]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const sync = () => setIsMdUp(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  const handleFinish = () => {
    onFinish(text);
  };

  const handleInsertCharacter = (char: string, selectionStart?: number, selectionEnd?: number) => {
    const textarea = textareaRef.current;
    if (textarea) {
      // Use provided position if available (captured before button click), 
      // otherwise try to get from textarea
      const start = selectionStart !== undefined ? selectionStart : textarea.selectionStart;
      const end = selectionEnd !== undefined ? selectionEnd : textarea.selectionEnd;
      
      const { newText, newCursorPosition } = insertCharacterAtCursor(
        text,
        char,
        start,
        end
      );
      setText(newText);
      // Set cursor position after inserted character
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    } else {
      // Fallback if textarea ref is not available
      setText(text + char);
    }
  };

  const handleRequestFeedback = () => {
    requestFeedback(text);
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <WrittenExpressionHeader task={task} timeLeft={timeLeft} text={text} />

      {isMdUp ? (
        <div className="flex flex-1 gap-4 min-h-0">
          <div className="flex flex-col flex-[0.6] gap-3 min-h-0">
            <FrenchAccentBar onInsertCharacter={handleInsertCharacter} />

            <textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t('writtenExpression.placeholder')}
              className="flex-1 w-full min-h-[350px] p-5 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-300/20 dark:focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
            />

            <button
              onClick={handleFinish}
              disabled={text.trim().length === 0}
              className="w-full py-3 bg-indigo-500 dark:bg-indigo-600 text-white rounded-lg font-semibold text-xs uppercase tracking-wide hover:bg-indigo-600 dark:hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
            >
              {t('writtenExpression.submit')}
            </button>
          </div>

          <div className="flex-[0.4] min-h-0">
            <CompanionPanel
              task={task}
              text={text}
              timeLeft={timeLeft}
              feedback={feedback}
              isLoading={isLoading}
              error={error}
              onRequestFeedback={handleRequestFeedback}
            />
          </div>
        </div>
      ) : (
        <div className="flex flex-col flex-1 gap-3 min-h-0">
          <FrenchAccentBar onInsertCharacter={handleInsertCharacter} />

          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('writtenExpression.placeholder')}
            className="flex-1 w-full min-h-[200px] p-4 bg-white dark:bg-slate-800 rounded-lg border-2 border-slate-300 dark:border-slate-600 text-sm leading-relaxed text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-indigo-300/20 dark:focus:ring-indigo-500/20 focus:border-indigo-400 dark:focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
          />

          <div className="flex-shrink-0 max-h-[300px] min-h-[200px]">
            <CompanionPanel
              task={task}
              text={text}
              timeLeft={timeLeft}
              feedback={feedback}
              isLoading={isLoading}
              error={error}
              onRequestFeedback={handleRequestFeedback}
            />
          </div>

          <button
            onClick={handleFinish}
            disabled={text.trim().length === 0}
            className="w-full py-3 bg-indigo-500 dark:bg-indigo-600 text-white rounded-lg font-semibold text-xs uppercase tracking-wide hover:bg-indigo-600 dark:hover:bg-indigo-700 active:scale-[0.98] transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:grayscale"
          >
            {t('writtenExpression.submit')}
          </button>
        </div>
      )}
    </div>
  );
};