import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { SHOW_DAILY_RITUAL_NEW_BADGE } from '../../config/featureDiscovery';

export function DailyRitualCard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      id="tour-daily-ritual-card"
      className="h-full bg-gradient-to-br from-teal-600 to-teal-900 rounded-2xl md:rounded-3xl p-6 shadow-lg hover:shadow-xl hover:shadow-teal-500/25 transition-all group cursor-pointer border border-teal-400/25"
      onClick={() => navigate('/practice/daily-ritual')}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/15 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl group-hover:scale-110 transition-transform">
          📇
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <h3 className="text-base md:text-xl font-bold text-white">{t('practice.dailyRitualTitle')}</h3>
        {SHOW_DAILY_RITUAL_NEW_BADGE ? (
          <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/30">
            {t('common.new')}
          </span>
        ) : null}
      </div>
      <p className="text-teal-100 text-xs md:text-sm leading-relaxed mb-4">{t('practice.dailyRitualDescription')}</p>
      <div className="flex items-center text-white font-bold text-xs md:text-sm">
        {t('common.start')} <span className="ml-2">→</span>
      </div>
    </div>
  );
}
