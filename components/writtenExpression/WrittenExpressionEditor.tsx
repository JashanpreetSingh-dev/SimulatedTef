import React, { useState, useEffect, useRef } from 'react';
import { WrittenTask } from '../../types';
import { useLanguage } from '../../contexts/LanguageContext';
import { WrittenExpressionHeader } from './WrittenExpressionHeader';
import { FrenchAccentBar } from './FrenchAccentBar';
import { insertCharacterAtCursor } from './utils/textUtils';

interface WrittenExpressionEditorProps {
  task: WrittenTask;
  onFinish: (text: string) => void;
}

export const WrittenExpressionEditor: React.FC<WrittenExpressionEditorProps> = ({ task, onFinish }) => {
  const { t } = useLanguage();
  const [text, setText] = useState('');
  const [timeLeft, setTimeLeft] = useState(task.section === 'A' ? 25 * 60 : 35 * 60);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Reset state when task changes (e.g., switching from Section A to B)
  useEffect(() => {
    setText('');
    setTimeLeft(task.section === 'A' ? 25 * 60 : 35 * 60);
  }, [task.section, task.id]);

  // Timer effect - resets when task changes
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [task.section, task.id]);

  const handleFinish = () => {
    onFinish(text);
  };

  const handleInsertCharacter = (char: string) => {
    const textarea = textareaRef.current;
    if (textarea) {
      const { newText, newCursorPosition } = insertCharacterAtCursor(
        text,
        char,
        textarea.selectionStart,
        textarea.selectionEnd
      );
      setText(newText);
      // Set cursor position after inserted character
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(newCursorPosition, newCursorPosition);
      }, 0);
    } else {
      // Fallback: just append if textarea ref not available
      setText(text + char);
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <WrittenExpressionHeader task={task} timeLeft={timeLeft} text={text} />

      {/* Editor Panel - Takes most of the screen */}
      <div className="flex flex-col flex-1 gap-3 min-h-0">
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
    </div>
  );
};
