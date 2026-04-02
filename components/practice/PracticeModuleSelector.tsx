import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { SHOW_DAILY_RITUAL_NEW_BADGE } from '../../config/featureDiscovery';
import { useIsD2C } from '../../utils/userType';

interface PracticeModuleSelectorProps {
  onSelectModule: (module: 'oral' | 'written' | 'reading' | 'listening') => void;
}

export function PracticeModuleSelector({ onSelectModule }: PracticeModuleSelectorProps) {
  const { t } = useLanguage();
  const isD2C = useIsD2C();
  const navigate = useNavigate();
  
  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      {/* Expression Orale Card */}
      <div 
        className="bg-gradient-to-br from-indigo-400 to-indigo-600 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl hover:shadow-indigo-400/20 transition-all group cursor-pointer"
        onClick={() => onSelectModule('oral')}
      >
        <div className="flex items-start justify-between mb-2 md:mb-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">🎤</div>
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
          <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">✍️</div>
        </div>
        <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-1.5">{t('practice.writtenExpression')}</h3>
        <p className="text-purple-100 text-xs leading-relaxed mb-2 md:mb-3">
          {t('practice.writtenExpressionDescription')}
        </p>
        <div className="flex items-center text-white font-bold text-xs">
          {t('common.startPracticing')} <span className="ml-1.5">→</span>
        </div>
      </div>

      {/* Reading Comprehension Card - B2B Only */}
      {!isD2C && (
        <div 
          className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl hover:shadow-blue-500/20 transition-all group cursor-pointer"
          onClick={() => onSelectModule('reading')}
        >
          <div className="flex items-start justify-between mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">📖</div>
          </div>
          <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-1.5">{t('modules.reading')}</h3>
          <p className="text-blue-100 text-xs leading-relaxed mb-2 md:mb-3">
            {t('practice.readingSubtitle')}
          </p>
          <div className="flex items-center text-white font-bold text-xs">
            {t('common.startPracticing')} <span className="ml-1.5">→</span>
          </div>
        </div>
      )}

      {/* Listening Comprehension Card - B2B Only */}
      {!isD2C && (
        <div 
          className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl md:rounded-2xl p-3 md:p-4 shadow-lg hover:shadow-xl hover:shadow-green-500/20 transition-all group cursor-pointer"
          onClick={() => onSelectModule('listening')}
        >
          <div className="flex items-start justify-between mb-2 md:mb-3">
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-lg md:rounded-xl flex items-center justify-center text-base md:text-xl group-hover:scale-110 transition-transform">🎧</div>
          </div>
          <h3 className="text-sm md:text-lg font-bold text-white mb-1 md:mb-1.5">{t('modules.listening')}</h3>
          <p className="text-green-100 text-xs leading-relaxed mb-2 md:mb-3">
            {t('practice.listeningSubtitle')}
          </p>
          <div className="flex items-center text-white font-bold text-xs">
            {t('common.startPracticing')} <span className="ml-1.5">→</span>
          </div>
        </div>
      )}

      <div
        className="md:col-span-2 bg-gradient-to-br from-teal-600 to-teal-900 rounded-xl md:rounded-2xl p-4 md:p-5 shadow-lg hover:shadow-xl hover:shadow-teal-500/20 border border-teal-400/25 transition-all cursor-pointer group"
        onClick={() => navigate('/practice/daily-ritual')}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white/15 rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
              📇
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base md:text-lg font-bold text-white">{t('practice.dailyRitualTitle')}</h3>
                {SHOW_DAILY_RITUAL_NEW_BADGE ? (
                  <span className="inline-flex items-center rounded-full bg-white/20 px-2 py-0.5 text-[10px] md:text-xs font-bold uppercase tracking-wide text-white ring-1 ring-white/30">
                    {t('common.new')}
                  </span>
                ) : null}
              </div>
              <p className="text-teal-100 text-xs md:text-sm leading-relaxed mt-0.5">
                {t('practice.dailyRitualDescription')}
              </p>
            </div>
          </div>
          <div className="flex items-center text-white font-bold text-sm sm:shrink-0">
            {t('common.start')} <span className="ml-2">→</span>
          </div>
        </div>
      </div>
    </div>
  );
}
