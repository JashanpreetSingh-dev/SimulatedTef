import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

interface Props {
  streak?: number;
  levelEstimate?: string;
}

export function WarmupCard({ streak, levelEstimate }: Props) {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const displayStreak = streak ?? 0;
  const displayLevel = levelEstimate ?? 'A2';

  return (
    <div
      className="bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl md:rounded-3xl p-6 shadow-lg hover:shadow-xl hover:shadow-amber-400/30 transition-all group cursor-pointer"
      onClick={() => navigate('/warmup')}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/30 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl group-hover:scale-110 transition-transform">
          🔥
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.25em] bg-amber-200/70 text-amber-900 border border-amber-300">
            Warm-Up
          </span>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-white/40 text-amber-900 border border-amber-200">
            {t('warmup.streak', { count: String(displayStreak) })} 🔥
          </span>
        </div>
      </div>
      <h3 className="text-base md:text-xl font-bold text-amber-950 mb-2">
        {t('warmup.title')}
      </h3>
      <p className="text-amber-950/80 text-xs md:text-sm leading-relaxed mb-4">
        {t('warmup.cardDescription')}
      </p>
      <div className="flex items-center justify-between text-xs md:text-sm">
        <div className="flex items-center gap-1.5 text-amber-950 font-semibold">
          <span className="px-2 py-0.5 rounded-full bg-white/50 border border-amber-200">
            {t('warmup.levelLabel')} {displayLevel}
          </span>
        </div>
        <div className="text-amber-950 font-bold flex items-center">
          <span className="mr-1">{t('warmup.start')}</span> <span>→</span>
        </div>
      </div>
    </div>
  );
}

