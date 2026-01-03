import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../contexts/LanguageContext';
import { useSubscription } from '../../hooks/useSubscription';

export function MockExamsCard() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { status } = useSubscription();

  return (
    <div 
      className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-lg hover:shadow-xl hover:shadow-purple-500/20 transition-all group cursor-pointer"
      onClick={() => navigate('/mock-exam')}
    >
      <div className="flex items-start justify-between mb-3 md:mb-4">
        <div className="w-10 h-10 md:w-12 md:h-12 bg-white/20 rounded-xl md:rounded-2xl flex items-center justify-center text-lg md:text-2xl group-hover:rotate-12 transition-transform">📚</div>
        {status && (
          <div className="text-right">
            <div className="text-xs md:text-sm text-purple-100 mb-0.5">{t('common.available')}</div>
            <div className="text-base md:text-xl font-black text-white">
              {(() => {
                const dailyRemaining = status.limits.fullTests > 0 
                  ? Math.max(0, status.limits.fullTests - status.usage.fullTestsUsed)
                  : 0;
                const packRemaining = status.packCredits?.fullTests.remaining || 0;
                const total = dailyRemaining + packRemaining;
                return total > 0 ? total : '0';
              })()}
            </div>
          </div>
        )}
      </div>
      <h3 className="text-base md:text-xl font-bold text-white mb-1.5 md:mb-2">{t('dashboard.mockExam')}</h3>
      <p className="text-purple-100 text-xs md:text-sm leading-relaxed mb-3 md:mb-4">
        {t('dashboard.mockExamDescription')}
      </p>
      <div className="flex items-center text-white font-bold text-xs md:text-sm">
        {t('common.startMockExam')} <span className="ml-1.5">→</span>
      </div>
    </div>
  );
}
