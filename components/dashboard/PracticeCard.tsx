import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export function PracticeCard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div 
      className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-2xl md:rounded-3xl p-6 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer"
      onClick={() => navigate('/practice')}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl group-hover:scale-110 transition-transform">🎯</div>
      </div>
      <h3 className="text-base md:text-xl font-bold text-white mb-2">{t('common.practice')}</h3>
      <p className="text-indigo-100 text-xs md:text-sm leading-relaxed mb-4">
        {t('practice.cardDescription')}
      </p>
      <div className="flex items-center text-white font-bold text-xs md:text-sm">
        {t('common.startPracticing')} <span className="ml-2">→</span>
      </div>
    </div>
  );
}
