import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface ExamCardProps {
  mode: 'partA' | 'partB' | 'full';
  onStart: (mode: 'partA' | 'partB' | 'full') => void;
  variant?: 'mobile' | 'desktop';
  isWrittenExpression?: boolean;
}

export function ExamCard({ mode, onStart, variant = 'mobile', isWrittenExpression = false }: ExamCardProps) {
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

  if (variant === 'mobile') {
    return (
      <div 
        className={`${cardConfig.bgColor} rounded-2xl p-4 ${cardConfig.borderColor ? `border ${cardConfig.borderColor}` : ''} shadow-sm hover:shadow-md transition-all group cursor-pointer`}
        onClick={() => onStart(mode)}
      >
        <div className="flex items-start justify-between mb-3">
          <div className={`w-8 h-8 ${cardConfig.iconBg} rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}>
            {cardConfig.icon}
          </div>
        </div>
        <h3 className={`text-base font-bold ${cardConfig.titleColor} mb-1`}>{cardConfig.title}</h3>
        <p className={`${mode === 'full' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'} text-xs leading-relaxed mb-2`}>
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
      className={`${cardConfig.bgColor} rounded-2xl p-4 ${cardConfig.borderColor ? `border ${cardConfig.borderColor}` : ''} shadow-sm hover:shadow-md transition-all group cursor-pointer`}
      onClick={() => onStart(mode)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className={`w-8 h-8 ${cardConfig.iconBg} rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform`}>
          {cardConfig.icon}
        </div>
      </div>
      <h3 className={`text-base font-bold ${cardConfig.titleColor} mb-1`}>{cardConfig.title}</h3>
      <p className={`${mode === 'full' ? 'text-indigo-100' : 'text-slate-500 dark:text-slate-400'} text-xs leading-relaxed`}>
        {cardConfig.description}
      </p>
      <div className={`mt-3 flex items-center ${cardConfig.textColor} font-bold text-xs`}>
        {t('common.commencer')} <span className="ml-1.5">→</span>
      </div>
    </div>
  );
}
