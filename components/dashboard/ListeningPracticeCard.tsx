import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export function ListeningPracticeCard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      id="tour-listening-practice-card"
      className="h-full bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition-all group cursor-pointer"
      onClick={() => navigate('/listening-practice')}
    >
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl group-hover:rotate-12 transition-transform">🎧</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-1.5 md:mb-2">
        <h3 className="text-base md:text-xl font-bold text-white">{t('modules.listening')}</h3>
        <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/30">
          {t('common.new')}
        </span>
      </div>
      <p className="text-green-100 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">
        {t('dashboard.listeningCardDescription')}
      </p>
      <div className="flex items-center text-white font-bold text-xs md:text-sm">
        {t('common.browseTests')} <span className="ml-1.5">→</span>
      </div>
    </div>
  );
}
