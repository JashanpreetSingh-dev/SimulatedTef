import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';
import { SubscriptionStatus as SubscriptionStatusType } from '../../hooks/useSubscription';

interface ExamCardProps {
  mode: 'partA' | 'partB' | 'full';
  status: SubscriptionStatusType | null;
  onStart: (mode: 'partA' | 'partB' | 'full') => void;
  variant?: 'mobile' | 'desktop';
}

export function ExamCard({ mode, status, onStart, variant = 'mobile' }: ExamCardProps) {
  const { t } = useLanguage();

  const config = {
    partA: {
      icon: '📞',
      title: t('dashboard.sectionA'),
      description: t('dashboard.sectionADescription'),
      bgColor: 'bg-indigo-100 dark:bg-slate-800/50',
      iconBg: 'bg-blue-100 dark:bg-blue-900/50',
      textColor: 'text-blue-400 dark:text-blue-300',
      borderColor: 'border-slate-200 dark:border-slate-700',
      titleColor: 'text-slate-800 dark:text-slate-100',
      getAvailable: () => {
        if (!status) return 0;
        const dailyRemaining = status.limits.sectionA > 0 
          ? Math.max(0, status.limits.sectionA - status.usage.sectionAUsed)
          : 0;
        const packRemaining = status.packCredits?.sectionA.remaining || 0;
        return dailyRemaining + packRemaining;
      },
      hasCredits: () => {
        if (!status) return false;
        return (status.limits.sectionA > 0 && status.usage.sectionAUsed < status.limits.sectionA) || 
               (status.packCredits?.sectionA.remaining && status.packCredits.sectionA.remaining > 0);
      },
      getDailyRemaining: () => status && status.limits.sectionA > 0 ? status.limits.sectionA - status.usage.sectionAUsed : 0,
      getPackRemaining: () => status?.packCredits?.sectionA.remaining || 0,
    },
    partB: {
      icon: '🤝',
      title: t('dashboard.sectionB'),
      description: t('dashboard.sectionBDescription'),
      bgColor: 'bg-indigo-100 dark:bg-slate-800/50',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/50',
      textColor: 'text-emerald-400 dark:text-emerald-300',
      borderColor: 'border-slate-200 dark:border-slate-700',
      titleColor: 'text-slate-800 dark:text-slate-100',
      getAvailable: () => {
        if (!status) return 0;
        const dailyRemaining = status.limits.sectionB > 0 
          ? Math.max(0, status.limits.sectionB - status.usage.sectionBUsed)
          : 0;
        const packRemaining = status.packCredits?.sectionB.remaining || 0;
        return dailyRemaining + packRemaining;
      },
      hasCredits: () => {
        if (!status) return false;
        return (status.limits.sectionB > 0 && status.usage.sectionBUsed < status.limits.sectionB) || 
               (status.packCredits?.sectionB.remaining && status.packCredits.sectionB.remaining > 0);
      },
      getDailyRemaining: () => status && status.limits.sectionB > 0 ? status.limits.sectionB - status.usage.sectionBUsed : 0,
      getPackRemaining: () => status?.packCredits?.sectionB.remaining || 0,
    },
    full: {
      icon: '🏆',
      title: t('dashboard.oralExpressionComplete'),
      description: t('dashboard.oralExpressionDescription'),
      bgColor: 'bg-indigo-400',
      iconBg: 'bg-indigo-100/20',
      textColor: 'text-white',
      borderColor: '',
      titleColor: 'text-white',
      getAvailable: () => {
        if (!status) return 0;
        const dailyRemaining = status.limits.fullTests > 0 
          ? Math.max(0, status.limits.fullTests - status.usage.fullTestsUsed)
          : 0;
        const packRemaining = status.packCredits?.fullTests.remaining || 0;
        return dailyRemaining + packRemaining;
      },
      hasCredits: () => {
        if (!status) return false;
        return (status.limits.fullTests > 0 && status.usage.fullTestsUsed < status.limits.fullTests) || 
               (status.packCredits?.fullTests.remaining && status.packCredits.fullTests.remaining > 0);
      },
      getDailyRemaining: () => status && status.limits.fullTests > 0 ? status.limits.fullTests - status.usage.fullTestsUsed : 0,
      getPackRemaining: () => status?.packCredits?.fullTests.remaining || 0,
    },
  };

  const cardConfig = config[mode];
  const available = cardConfig.getAvailable();
  const hasCredits = cardConfig.hasCredits();
  const dailyRemaining = cardConfig.getDailyRemaining();
  const packRemaining = cardConfig.getPackRemaining();
  const hasDailyLimit = status && status.limits[mode === 'full' ? 'fullTests' : mode === 'partA' ? 'sectionA' : 'sectionB'] > 0;

  if (variant === 'mobile') {
    return (
      <div 
        className={`${cardConfig.bgColor} rounded-2xl p-5 ${cardConfig.borderColor ? `border ${cardConfig.borderColor}` : ''} shadow-sm hover:shadow-md transition-all group cursor-pointer`}
        onClick={() => onStart(mode)}
      >
        <div className="flex items-start justify-between mb-4">
          <div className={`w-10 h-10 ${cardConfig.iconBg} rounded-xl flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
            {cardConfig.icon}
          </div>
          {status && (hasCredits || available > 0) && (
            <div className="text-right">
              <div className={`text-xs ${mode === 'full' ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'} mb-0.5`}>
                {t('common.available')}
              </div>
              <div className={`text-lg font-black ${cardConfig.textColor}`}>
                {available > 0 ? available : '0'}
              </div>
              {hasCredits && (
                <div className={`text-xs ${mode === 'full' ? 'text-indigo-300' : 'text-slate-400 dark:text-slate-500'} mt-0.5`}>
                  {hasDailyLimit && dailyRemaining > 0 && status && (
                    <span>{t('common.daily')}: {dailyRemaining}/{status.limits[mode === 'full' ? 'fullTests' : mode === 'partA' ? 'sectionA' : 'sectionB']}</span>
                  )}
                  {hasDailyLimit && dailyRemaining > 0 && packRemaining > 0 && <span> • </span>}
                  {packRemaining > 0 && (
                    <span>{t('common.pack')}: {packRemaining}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        <h3 className={`text-lg font-bold ${cardConfig.titleColor} mb-1`}>{cardConfig.title}</h3>
        <p className={`${mode === 'full' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'} text-xs leading-relaxed mb-3`}>
          {cardConfig.description}
        </p>
        <div className={`flex items-center ${cardConfig.textColor} font-bold text-xs`}>
          {t('common.commencer')} <span className="ml-1">→</span>
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div 
      className={`${cardConfig.bgColor} rounded-3xl p-8 ${cardConfig.borderColor ? `border ${cardConfig.borderColor}` : ''} shadow-sm hover:shadow-md transition-all group cursor-pointer`}
      onClick={() => onStart(mode)}
    >
      <div className="flex items-start justify-between mb-6">
        <div className={`w-12 h-12 ${cardConfig.iconBg} rounded-2xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform`}>
          {cardConfig.icon}
        </div>
        {status && (hasCredits || available > 0) && (
          <div className="text-right">
            <div className={`text-xs ${mode === 'full' ? 'text-indigo-200' : 'text-slate-500 dark:text-slate-400'} mb-1`}>
              Available
            </div>
            <div className={`text-2xl font-black ${cardConfig.textColor}`}>
              {available > 0 ? available : '0'}
            </div>
            {hasCredits && (
              <div className={`text-xs ${mode === 'full' ? 'text-indigo-300' : 'text-slate-400 dark:text-slate-500'} mt-1`}>
                {hasDailyLimit && dailyRemaining > 0 && status && (
                  <span>{t('common.daily')}: {dailyRemaining}/{status.limits[mode === 'full' ? 'fullTests' : mode === 'partA' ? 'sectionA' : 'sectionB']}</span>
                )}
                {hasDailyLimit && dailyRemaining > 0 && packRemaining > 0 && <span> • </span>}
                {packRemaining > 0 && (
                  <span>{t('common.pack')}: {packRemaining}</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <h3 className={`text-xl font-bold ${cardConfig.titleColor} mb-2`}>{cardConfig.title}</h3>
      <p className={`${mode === 'full' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'} text-sm leading-relaxed`}>
        {cardConfig.description}
      </p>
      <div className={`mt-6 flex items-center ${cardConfig.textColor} font-bold text-sm`}>
        {t('common.commencer')} <span className="ml-2">→</span>
      </div>
    </div>
  );
}
