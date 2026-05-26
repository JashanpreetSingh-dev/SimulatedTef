import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export function ReadingListeningCard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      className="h-full bg-gradient-to-br from-violet-600 to-violet-900 rounded-2xl md:rounded-3xl p-6 shadow-lg hover:shadow-xl hover:shadow-violet-500/25 transition-all group cursor-pointer border border-violet-400/25"
      onClick={() => navigate('/practice', { state: { switchTo: 'reading' } })}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/15 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl group-hover:scale-110 transition-transform">
          📚
        </div>
        <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/30">
          {t('practice.readingListeningBadge')}
        </span>
      </div>
      <h3 className="text-base md:text-xl font-bold text-white mb-2">{t('practice.readingListeningTitle')}</h3>
      <p className="text-violet-100 text-xs md:text-sm leading-relaxed mb-4">
        {t('practice.readingListeningDescription')}
      </p>
      <div className="flex flex-col gap-2">
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/practice', { state: { switchTo: 'reading' } }); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
        >
          <span>📖</span>
          <span>Reading</span>
          <span className="ml-auto text-white/60">→</span>
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); navigate('/practice', { state: { switchTo: 'listening' } }); }}
          className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-semibold transition-colors"
        >
          <span>🎧</span>
          <span>Listening</span>
          <span className="ml-auto text-white/60">→</span>
        </button>
      </div>
    </div>
  );
}
