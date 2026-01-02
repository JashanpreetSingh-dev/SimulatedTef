import React from 'react';
import { useLanguage } from '../../../contexts/LanguageContext';

interface ModelAnswerProps {
  modelAnswer: string;
}

export const ModelAnswer: React.FC<ModelAnswerProps> = ({ modelAnswer }) => {
  const { t } = useLanguage();
  return (
    <div className="mb-6 sm:mb-12 p-4 sm:p-8 bg-blue-50 dark:bg-blue-900/20 rounded-xl sm:rounded-[2rem] border border-blue-100 dark:border-blue-500/20">
      <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-blue-400 dark:text-blue-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
        <span>📝</span> {t('results.modelAnswerLevel')}
      </h4>
      <div className="prose prose-sm dark:prose-invert max-w-none">
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
          {modelAnswer}
        </p>
      </div>
    </div>
  );
};
