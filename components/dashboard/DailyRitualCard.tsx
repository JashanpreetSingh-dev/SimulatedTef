import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export function DailyRitualCard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      className="bg-gradient-to-br from-teal-600 to-teal-900 rounded-2xl md:rounded-3xl p-6 shadow-lg hover:shadow-xl hover:shadow-teal-500/25 transition-all group cursor-pointer border border-teal-400/25"
      onClick={() => navigate('/practice/daily-ritual')}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/15 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl group-hover:scale-110 transition-transform">
          📇
        </div>
      </div>
      <h3 className="text-base md:text-xl font-bold text-white mb-2">{t('practice.dailyRitualTitle')}</h3>
      <p className="text-teal-100 text-xs md:text-sm leading-relaxed mb-4">{t('practice.dailyRitualDescription')}</p>
      <div className="flex items-center text-white font-bold text-xs md:text-sm">
        {t('common.start')} <span className="ml-2">→</span>
      </div>
    </div>
  );
}
