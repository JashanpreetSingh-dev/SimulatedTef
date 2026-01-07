import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface GrammarVocabularyNotesProps {
  grammarNotes: string;
  vocabularyNotes: string;
}

export const GrammarVocabularyNotes: React.FC<GrammarVocabularyNotesProps> = ({ 
  grammarNotes, 
  vocabularyNotes 
}) => {
  const { t } = useLanguage();
  
  if (!grammarNotes && !vocabularyNotes) return null;

  return (
    <div className="grid md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-12">
      {/* Grammar Notes */}
      {grammarNotes && (
        <div className="p-4 sm:p-6 bg-violet-50 dark:bg-violet-900/20 rounded-xl sm:rounded-2xl border border-violet-200 dark:border-violet-800 transition-colors">
          <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-violet-600 dark:text-violet-400 mb-3 sm:mb-4 tracking-widest flex items-center gap-2">
            <span>📝</span> {t('results.grammarNotes')}
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {grammarNotes}
          </p>
        </div>
      )}

      {/* Vocabulary Notes */}
      {vocabularyNotes && (
        <div className="p-4 sm:p-6 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl sm:rounded-2xl border border-cyan-200 dark:border-cyan-800 transition-colors">
          <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-cyan-600 dark:text-cyan-400 mb-3 sm:mb-4 tracking-widest flex items-center gap-2">
            <span>📚</span> {t('results.vocabularyNotes')}
          </h4>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {vocabularyNotes}
          </p>
        </div>
      )}
    </div>
  );
};
