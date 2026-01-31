import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ExamCardProps {
  mode: 'partA' | 'partB' | 'full';
  onStart: (mode: 'partA' | 'partB' | 'full') => void;
  variant?: 'mobile' | 'desktop';
  isWrittenExpression?: boolean;
  /** When true, card is disabled and shows "Limit reached" (D2C usage wall) */
  atLimit?: boolean;
  /** Show usage badge e.g. "1 / 1" (optional) */
  used?: number;
  limit?: number;
}

export function ExamCard({ mode, onStart, variant = 'mobile', isWrittenExpression = false, atLimit = false, used, limit }: ExamCardProps) {
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
    },
  };

  const cardConfig = config[mode];

  const cardPadding = isWrittenExpression ? 'p-2' : 'p-4';
  const cardRounded = isWrittenExpression ? 'rounded-lg' : 'rounded-2xl';
  const iconSize = isWrittenExpression ? 'w-6 h-6' : 'w-8 h-8';
  const iconTextSize = isWrittenExpression ? 'text-base' : 'text-lg';
  const titleSize = isWrittenExpression ? 'text-sm' : 'text-base';
  const titleMargin = isWrittenExpression ? 'mb-0.5' : 'mb-1';
  const descriptionMargin = isWrittenExpression ? 'mb-1' : 'mb-2';
  const sectionMargin = isWrittenExpression ? 'mb-1.5' : 'mb-3';
  const buttonMargin = isWrittenExpression ? 'mt-1.5' : 'mt-3';

  const showUsage = used !== undefined && limit !== undefined && limit !== -1;
  const usageBadge = showUsage
    ? (atLimit ? t('practice.limitReached') : `${used} / ${limit}`)
    : null;

  const wrapperClass = atLimit
    ? `bg-slate-100 dark:bg-slate-800/50 border-slate-300 dark:border-slate-600 opacity-75 cursor-not-allowed ${cardRounded} ${cardPadding} ${cardConfig.borderColor ? 'border' : ''} shadow-sm transition-all group`
    : `${cardConfig.bgColor} ${cardRounded} ${cardPadding} ${cardConfig.borderColor ? `border ${cardConfig.borderColor}` : ''} shadow-sm hover:shadow-md transition-all group cursor-pointer`;

  const handleClick = () => {
    if (!atLimit) onStart(mode);
  };

  if (variant === 'mobile') {
    return (
      <div
        className={wrapperClass}
        onClick={handleClick}
        aria-disabled={atLimit}
      >
        <div className={`flex items-start justify-between ${sectionMargin}`}>
          <div className={`${iconSize} ${cardConfig.iconBg} rounded-lg flex items-center justify-center ${iconTextSize} ${!atLimit ? 'group-hover:scale-110 transition-transform' : ''}`}>
            {cardConfig.icon}
          </div>
          {usageBadge !== null && (
            <span className={`text-xs font-semibold ${atLimit ? 'text-red-600 dark:text-red-400' : cardConfig.textColor}`}>
              {usageBadge}
            </span>
          )}
        </div>
        <h3 className={`${titleSize} font-bold ${cardConfig.titleColor} ${titleMargin}`}>{cardConfig.title}</h3>
        <p className={`${mode === 'full' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'} text-xs leading-relaxed ${descriptionMargin}`}>
          {cardConfig.description}
        </p>
        <div className={`flex items-center ${cardConfig.textColor} font-bold text-xs`}>
          {atLimit ? t('practice.limitReached') : <>{t('common.commencer')} <span className="ml-1">→</span></>}
        </div>
      </div>
    );
  }

  // Desktop variant
  return (
    <div
      className={wrapperClass}
      onClick={handleClick}
      aria-disabled={atLimit}
    >
      <div className={`flex items-start justify-between ${sectionMargin}`}>
        <div className={`${iconSize} ${cardConfig.iconBg} rounded-lg flex items-center justify-center ${iconTextSize} ${!atLimit ? 'group-hover:scale-110 transition-transform' : ''}`}>
          {cardConfig.icon}
        </div>
        {usageBadge !== null && (
          <span className={`text-xs font-semibold ${atLimit ? 'text-red-600 dark:text-red-400' : cardConfig.textColor}`}>
            {usageBadge}
          </span>
        )}
      </div>
      <h3 className={`${titleSize} font-bold ${cardConfig.titleColor} ${titleMargin}`}>{cardConfig.title}</h3>
      <p className={`${mode === 'full' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'} text-xs leading-relaxed`}>
        {cardConfig.description}
      </p>
      <div className={`${buttonMargin} flex items-center ${cardConfig.textColor} font-bold text-xs`}>
        {atLimit ? t('practice.limitReached') : <>{t('common.commencer')} <span className="ml-1.5">→</span></>}
      </div>
    </div>
  );
}
