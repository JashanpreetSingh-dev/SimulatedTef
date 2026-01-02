
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { persistenceService } from '../services/persistence';
import { SavedResult } from '../types';
import { formatDateFrench } from '../utils/dateFormatting';

type FilterMode = 'partA' | 'partB' | 'full';

export const HistoryList: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const userId = user?.id || 'guest';
  const [results, setResults] = useState<SavedResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>('partA');

  useEffect(() => {
    const fetchResults = async () => {
      const data = await persistenceService.getAllResults(userId, getToken);
      setResults(data);
      setLoading(false);
    };
    fetchResults();
  }, [userId, getToken]);

  // Filter results based on selected mode
  const filteredResults = results.filter(result => result.mode === filterMode);

  const handleRetake = (result: SavedResult) => {
    // Determine which mode to use for retake
    let retakeMode: 'partA' | 'partB' | 'full' = result.mode as 'partA' | 'partB' | 'full';
    
    // Reconstruct scenario from saved task data
    const scenario = {
      title: result.title,
      mode: retakeMode,
      officialTasks: {
        partA: result.taskPartA!,
        partB: result.taskPartB!
      }
    };
    
    // Navigate to exam with scenario in state (bypasses completed task filtering)
    navigate(`/exam/${retakeMode}`, { state: { scenario, from: '/practice' } });
  };

  if (loading) {
    return <div className="py-20 text-center animate-pulse text-slate-500 dark:text-slate-400">{t('history.syncing')}</div>;
  }

  if (results.length === 0) {
    return (
      <div className="py-24 text-center bg-indigo-100/70 dark:bg-slate-800/70 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-sm animate-in zoom-in duration-500 transition-colors">
        <div className="text-7xl mb-8">📅</div>
        <h2 className="text-4xl font-black text-slate-800 dark:text-slate-100 tracking-tight">{t('history.empty')}</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md mx-auto font-medium px-8 text-lg leading-relaxed">
          {t('history.emptyDescription')}
        </p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col animate-in fade-in duration-700">
      {/* Tabs for filtering - fixed */}
      <div className="flex-shrink-0 mb-6">
        <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide">
          <button
            onClick={() => setFilterMode('partA')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
              filterMode === 'partA'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-blue-400 dark:text-blue-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('history.tabA')}
          </button>
          <button
            onClick={() => setFilterMode('partB')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
              filterMode === 'partB'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-emerald-400 dark:text-emerald-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('history.tabB')}
          </button>
          <button
            onClick={() => setFilterMode('full')}
            className={`flex-1 py-2 px-3 rounded-lg font-bold text-xs transition-all whitespace-nowrap flex-shrink-0 ${
              filterMode === 'full'
                ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {t('history.tabComplete')}
          </button>
        </div>
      </div>

      {/* Scrollable list container */}
      <div className="flex-1 min-h-0 overflow-y-auto pt-6">
        {filteredResults.length === 0 ? (
          <div className="py-12 text-center bg-indigo-100/70 dark:bg-slate-800/70 rounded-[2rem] border border-slate-200 dark:border-slate-700 transition-colors">
            <p className="text-slate-500 dark:text-slate-400">{t('history.noResults')}</p>
          </div>
        ) : (
          <div className="grid gap-4 pb-4">
            {filteredResults.map((item) => {
            // Get task numbers from saved task data, only show relevant ones based on mode
            const taskNumbers = [];
            if (item.mode === 'partA' && item.taskPartA) {
              taskNumbers.push(`A#${item.taskPartA.id}`);
            } else if (item.mode === 'partB' && item.taskPartB) {
              taskNumbers.push(`B#${item.taskPartB.id}`);
            } else if (item.mode === 'full') {
              if (item.taskPartA) taskNumbers.push(`A#${item.taskPartA.id}`);
              if (item.taskPartB) taskNumbers.push(`B#${item.taskPartB.id}`);
            }
            const taskNumberText = taskNumbers.join(' / ');
            
            return (
            <div key={item._id || item.timestamp} className="bg-indigo-100/70 dark:bg-slate-800/70 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300/50 dark:hover:border-indigo-600/50 hover:shadow-md transition-all">
              {/* Desktop: Single row layout */}
              <div className="hidden sm:flex items-center gap-4">
                {/* Score and CLB */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-2xl font-black text-slate-800 dark:text-slate-100">{item.score}</div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-400 dark:text-indigo-300 leading-none">{item.clbLevel}</span>
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider leading-none mt-0.5">{item.score}/699</span>
                  </div>
                </div>

                {/* Task number and date */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {taskNumberText && (
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                      {taskNumberText}
                    </span>
                  )}
                  <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {formatDateFrench(item.timestamp)}
                  </span>
                </div>

                {/* CECR level */}
                {item.cecrLevel && (
                  <div className="flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      item.cecrLevel.includes('C2') ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-400 dark:text-purple-300' :
                      item.cecrLevel.includes('C1') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300' :
                      item.cecrLevel.includes('B2') ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300' :
                      item.cecrLevel.includes('B1') ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300' :
                      item.cecrLevel.includes('A2') ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' :
                      'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                    }`}>
                      {item.cecrLevel}
                    </span>
                  </div>
                )}

                {/* Spacer */}
                <div className="flex-1"></div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleRetake(item)}
                    className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all"
                  >
                    {t('actions.resume')}
                  </button>
                  <button 
                    onClick={() => navigate(`/results/${item._id}`)}
                    className="px-4 py-1.5 bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-all"
                  >
                    {t('actions.details')} →
                  </button>
                </div>
              </div>

              {/* Mobile: Compact column layout */}
              <div className="flex sm:hidden items-center gap-3">
                <div className="text-xl font-black text-slate-800 dark:text-slate-100 flex-shrink-0">{item.score}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {taskNumberText && (
                      <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded">
                        {taskNumberText}
                      </span>
                    )}
                    {item.cecrLevel && (
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        item.cecrLevel.includes('C2') ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-400 dark:text-purple-300' :
                        item.cecrLevel.includes('C1') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300' :
                        item.cecrLevel.includes('B2') ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300' :
                        item.cecrLevel.includes('B1') ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300' :
                        item.cecrLevel.includes('A2') ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' :
                        'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.cecrLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    {formatDateFrench(item.timestamp)}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleRetake(item)}
                    className="px-2.5 py-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all"
                  >
                    {t('actions.resume')}
                  </button>
                  <button 
                    onClick={() => navigate(`/results/${item._id}`)}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-all"
                  >
                    {t('actions.details')}
                  </button>
                </div>
              </div>
            </div>
            );
          })}
          </div>
        )}
      </div>
    </div>
  );
};
