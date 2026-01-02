import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PracticeModuleSelectorProps {
  onSelectModule: (module: 'oral' | 'written') => void;
}

export function PracticeModuleSelector({ onSelectModule }: PracticeModuleSelectorProps) {
  const { t } = useLanguage();
  
  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      {/* Expression Orale Card */}
      <div 
        className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer"
        onClick={() => onSelectModule('oral')}
      >
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">🎤</div>
        </div>
        <h3 className="text-lg md:text-2xl font-bold text-white mb-1.5 md:mb-2">{t('practice.oralExpression')}</h3>
        <p className="text-indigo-100 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">
          {t('practice.oralExpressionDescription')}
        </p>
        <div className="flex items-center text-white font-bold text-xs md:text-sm">
          {t('common.startPracticing')} <span className="ml-1.5">→</span>
        </div>
      </div>

      {/* Expression Ecrit Card */}
      <div 
        className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all group cursor-pointer"
        onClick={() => onSelectModule('written')}
      >
        <div className="flex items-start justify-between mb-3 md:mb-4">
          <div className="w-10 h-10 md:w-14 md:h-14 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">✍️</div>
        </div>
        <h3 className="text-lg md:text-2xl font-bold text-white mb-1.5 md:mb-2">{t('practice.writtenExpression')}</h3>
        <p className="text-purple-100 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">
          {t('practice.writtenExpressionDescription')}
        </p>
        <div className="flex items-center text-white font-bold text-xs md:text-sm">
          {t('common.startPracticing')} <span className="ml-1.5">→</span>
        </div>
      </div>
    </div>
  );
}
