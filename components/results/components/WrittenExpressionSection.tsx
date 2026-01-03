import React from 'react';
import { WrittenTask, UpgradedSentence } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { highlightMistakes } from '../utils/resultHelpers';

interface WrittenExpressionSectionProps {
  sectionData: {
    text: string;
    task: WrittenTask;
  };
  corrections: UpgradedSentence[];
  modelAnswer: string | null;
}

export const WrittenExpressionSection: React.FC<WrittenExpressionSectionProps> = ({
  sectionData,
  corrections,
  modelAnswer,
}) => {
  const { t } = useLanguage();
  const hasModelAnswer = modelAnswer && 
    !modelAnswer.toLowerCase().includes('intentionally left blank') && 
    !modelAnswer.toLowerCase().includes('separate model answers');

  return (
    <div className="space-y-6">
      {/* Task Info */}
      <div className="bg-indigo-100/70 dark:bg-slate-700/50 rounded-2xl p-6 border border-slate-200 dark:border-slate-600">
        <p className="text-sm text-slate-800 dark:text-slate-200 font-semibold mb-4">
          {t('results.subjectLabel')} {sectionData.task?.subject || 'N/A'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
          {sectionData.task?.instruction || ''}
        </p>
      </div>

      {/* User's Answer with Highlighted Mistakes */}
      <div>
        <h5 className="text-xs font-black uppercase text-indigo-400 dark:text-indigo-300 mb-4 tracking-widest">
          {t('results.yourWriting')}
        </h5>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border-2 border-slate-300 dark:border-slate-600">
          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
            {highlightMistakes(sectionData.text, corrections)}
          </p>
        </div>
      </div>

      {/* Corrections */}
      <div>
        <h5 className="text-xs font-black uppercase text-amber-600 dark:text-amber-400 mb-4 tracking-widest">
          {t('results.corrections')}
        </h5>
        {corrections.length > 0 ? (
          <div className="space-y-4">
            {corrections.map((sentence: UpgradedSentence, i: number) => (
              <div key={i} className="bg-amber-50 dark:bg-amber-900/20 p-6 rounded-xl border border-amber-200 dark:border-amber-800">
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-xs font-black uppercase text-rose-600 dark:text-rose-400 mb-2 tracking-wider">
                      {t('results.original')}
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300 italic leading-relaxed">
                      "{sentence.weak}"
                    </p>
                  </div>
                  <div>
                    <div className="text-xs font-black uppercase text-emerald-400 dark:text-emerald-300 mb-2 tracking-wider">
                      {t('results.corrected')}
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-100 font-medium leading-relaxed">
                      "{sentence.better}"
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-amber-200 dark:border-amber-700">
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                    {sentence.why}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              {t('results.noCorrectionsAvailable')}
            </p>
          </div>
        )}
      </div>

      {/* Model Answer */}
      <div>
        <h5 className="text-xs font-black uppercase text-emerald-400 dark:text-emerald-300 mb-4 tracking-widest">
          {t('results.modelAnswer')}
        </h5>
        {hasModelAnswer ? (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl p-6 border border-emerald-200 dark:border-emerald-800">
            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              {modelAnswer}
            </p>
          </div>
        ) : (
          <div className="bg-amber-50/50 dark:bg-amber-900/10 p-6 rounded-xl border border-amber-200/50 dark:border-amber-800/50">
            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
              {t('results.modelAnswerUnavailable')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
