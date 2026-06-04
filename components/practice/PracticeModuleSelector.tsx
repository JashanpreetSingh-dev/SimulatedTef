import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
interface PracticeModuleSelectorProps {
  onSelectModule: (module: 'oral' | 'written' | 'reading' | 'listening') => void;
}

export function PracticeModuleSelector({ onSelectModule }: PracticeModuleSelectorProps) {
  const { t } = useLanguage();

  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      {/* Expression Orale Card */}
      <div
        className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer"
        onClick={() => onSelectModule('oral')}
      >
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">
            🎤
          </div>
        </div>
        <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-1.5">{t('practice.oralExpression')}</h3>
        <p className="text-indigo-100 text-xs leading-relaxed mb-2 md:mb-3">
          {t('practice.oralExpressionDescription')}
        </p>
        <div className="flex items-center text-white font-bold text-xs">
          {t('common.startPracticing')} <span className="ml-1.5">→</span>
        </div>
      </div>

      {/* Expression Ecrit Card */}
      <div
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all group cursor-pointer"
        onClick={() => onSelectModule('written')}
      >
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">
            ✍️
          </div>
        </div>
        <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-1.5">{t('practice.writtenExpression')}</h3>
        <p className="text-purple-100 text-xs leading-relaxed mb-2 md:mb-3">
          {t('practice.writtenExpressionDescription')}
        </p>
        <div className="flex items-center text-white font-bold text-xs">
          {t('common.startPracticing')} <span className="ml-1.5">→</span>
        </div>
      </div>

    </div>
  );
}
