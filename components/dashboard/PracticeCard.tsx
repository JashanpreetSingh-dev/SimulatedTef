import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';

export function PracticeCard() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div
      id="tour-practice-card"
      className="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl md:rounded-3xl p-6 md:p-8 shadow-lg hover:shadow-xl hover:shadow-indigo-400/25 transition-all group cursor-pointer"
      onClick={() => navigate('/practice')}
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        {/* Left — headline + description */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-white text-xs font-bold tracking-wide uppercase">
              AI-Powered
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">
            {t('common.practice')}
          </h3>
          <p className="text-indigo-100 text-sm md:text-base leading-relaxed max-w-md">
            {t('practice.cardDescription')}
          </p>
        </div>

        {/* Right — two module pills */}
        <div className="flex flex-row md:flex-col gap-3 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/practice', { state: { switchTo: 'oral' } }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 active:bg-white/25 text-white text-sm font-semibold transition-colors"
          >
            <span>🎤</span>
            <span>{t('practice.oralExpression')}</span>
            <span className="ml-auto text-white/60">→</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/practice', { state: { switchTo: 'written' } }); }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 active:bg-white/25 text-white text-sm font-semibold transition-colors"
          >
            <span>✍️</span>
            <span>{t('practice.writtenExpression')}</span>
            <span className="ml-auto text-white/60">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
