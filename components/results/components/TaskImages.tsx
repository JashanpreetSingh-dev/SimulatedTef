import React from 'react';
import { TEFTask } from '../../../types';
import { useLanguage } from '../../../contexts/LanguageContext';
import { getImagePath } from '../utils/resultHelpers';

interface TaskImagesProps {
  tasks: Array<{ task: TEFTask; label: string }>;
}

export const TaskImages: React.FC<TaskImagesProps> = ({ tasks }) => {
  const { t } = useLanguage();
  if (tasks.length === 0) return null;

  return (
    <div className="space-y-4 sm:space-y-8">
      {tasks.map(({ task, label }, index) => (
        <div key={index} className="bg-indigo-100/70 dark:bg-slate-800/50 rounded-2xl sm:rounded-[3rem] border border-slate-200 dark:border-slate-700 p-4 sm:p-8 md:p-12 shadow-sm transition-colors">
          <h4 className="text-[9px] sm:text-[10px] font-black uppercase text-slate-500 dark:text-slate-400 mb-4 sm:mb-6 tracking-widest flex items-center gap-2">
            <span>📄</span> {t('results.officialDocument')} #{task.id}
          </h4>
          <div className="mb-4 sm:mb-6">
            <img
              src={getImagePath(task.image)}
              alt={`${label} Task Document`}
              className="w-full rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.dataset.retried === 'true') {
                  target.style.display = 'none';
                  return;
                }
                target.dataset.retried = 'true';
                
                const currentSrc = target.src;
                if (task.image.startsWith('/')) {
                  const altPath = task.image.substring(1);
                  if (!currentSrc.includes(altPath)) {
                    target.src = altPath;
                  }
                } else {
                  const altPath = '/' + task.image;
                  if (!currentSrc.includes(altPath)) {
                    target.src = altPath;
                  }
                }
              }}
            />
          </div>
          <div className="bg-indigo-100/70 dark:bg-slate-700/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-600">
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed italic">
              <strong className="text-slate-800 dark:text-slate-100 not-italic block mb-1 sm:mb-2">{t('results.instructionLabel')}</strong> {task.prompt}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
