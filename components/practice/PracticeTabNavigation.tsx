import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface PracticeTabNavigationProps {
  activeTab: 'practice' | 'history';
  onTabChange: (tab: 'practice' | 'history') => void;
  module: 'oral' | 'written';
}

export function PracticeTabNavigation({ activeTab, onTabChange, module }: PracticeTabNavigationProps) {
  const { t } = useLanguage();
  
  return (
    <div 
      className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide"
      role="tablist"
      aria-label="Practice sections"
    >
      <button
        onClick={() => onTabChange('practice')}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            onTabChange('history');
          }
        }}
        className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
          activeTab === 'practice'
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        aria-label={t('common.practice')}
        aria-selected={activeTab === 'practice'}
        role="tab"
      >
        {t('common.practice')}
      </button>
      <button
        onClick={() => onTabChange('history')}
        onKeyDown={(e) => {
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            onTabChange('practice');
          }
        }}
        className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-2 dark:focus:ring-offset-slate-800 ${
          activeTab === 'history'
            ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-400 shadow-sm'
            : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
        }`}
        aria-label={t('common.history')}
        aria-selected={activeTab === 'history'}
        role="tab"
      >
        {t('common.history')}
      </button>
    </div>
  );
}
