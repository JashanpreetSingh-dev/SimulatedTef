import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { FRENCH_ACCENTS } from './constants/frenchAccents';

interface FrenchAccentBarProps {
  onInsertCharacter: (char: string) => void;
}

export const FrenchAccentBar: React.FC<FrenchAccentBarProps> = ({ onInsertCharacter }) => {
  const { t } = useLanguage();
  return (
    <div className="flex items-center gap-1 p-1.5 bg-slate-50 dark:bg-slate-800/50 rounded-md border border-slate-200 dark:border-slate-700">
      <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 mr-1.5 whitespace-nowrap">
        {t('writtenExpression.accents')}
      </span>
      <div className="flex flex-wrap gap-0.5">
        {FRENCH_ACCENTS.map((accent) => (
          <button
            key={accent.char}
            type="button"
            onClick={() => onInsertCharacter(accent.char)}
                className="px-1.5 py-0.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:border-indigo-300 dark:hover:border-indigo-600 transition-colors focus:outline-none focus:ring-1 focus:ring-indigo-500"
                title={`${t('writtenExpression.insert')} ${accent.char}`}
              >
            {accent.label}
          </button>
        ))}
      </div>
    </div>
  );
};
