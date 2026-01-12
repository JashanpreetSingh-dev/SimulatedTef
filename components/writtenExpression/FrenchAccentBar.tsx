import React, { useState } from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FRENCH_ACCENTS } from './constants/frenchAccents';

interface FrenchAccentBarProps {
  onInsertCharacter: (char: string) => void;
}

export const FrenchAccentBar: React.FC<FrenchAccentBarProps> = ({ onInsertCharacter }) => {
  const { t } = useLanguage();
  const [isUppercase, setIsUppercase] = useState(false);

  const handleAccentClick = (accent: typeof FRENCH_ACCENTS[0]) => {
    onInsertCharacter(isUppercase ? accent.uppercase : accent.char);
  };

  return (
    <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
      <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mr-1 whitespace-nowrap">
        {t('writtenExpression.accents')}
      </span>
      <div className="flex flex-wrap gap-1">
        {/* Shift button - styled like a keyboard key */}
        <button
          type="button"
          onClick={() => setIsUppercase(!isUppercase)}
          className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm ${
            isUppercase
              ? 'bg-indigo-500 text-white border-2 border-indigo-600 hover:bg-indigo-600 dark:bg-indigo-600 dark:border-indigo-400 dark:hover:bg-indigo-500 shadow-indigo-500/50 active:shadow-inner active:translate-y-0.5'
              : 'text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 border-2 border-slate-400 dark:border-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600 shadow-slate-400/30 dark:shadow-slate-600/30 active:shadow-inner active:translate-y-0.5'
          }`}
          title={isUppercase ? 'Uppercase mode (click for lowercase)' : 'Lowercase mode (click for uppercase)'}
        >
          ⇪
        </button>
        {/* Accent buttons */}
        {FRENCH_ACCENTS.map((accent) => (
          <button
            key={accent.char}
            type="button"
            onClick={() => handleAccentClick(accent)}
            className="px-2.5 py-1 text-sm font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title={`${t('writtenExpression.insert')} ${isUppercase ? accent.uppercase : accent.char}`}
          >
            {isUppercase ? accent.uppercase : accent.label}
          </button>
        ))}
      </div>
    </div>
  );
};
