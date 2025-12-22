
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { persistenceService } from '../services/persistence';
import { SavedResult } from '../types';
import { formatDateFrench } from '../utils/dateFormatting';

type FilterMode = 'partA' | 'partB' | 'full';

export const HistoryList: React.FC = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
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
    navigate(`/exam/${retakeMode}`, { state: { scenario } });
  };

  if (loading) {
    return <div className="py-20 text-center animate-pulse text-slate-400">Synchronisation cloud...</div>;
  }

  if (results.length === 0) {
    return (
      <div className="py-24 text-center bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-200 dark:border-slate-800 shadow-sm animate-in zoom-in duration-500">
        <div className="text-7xl mb-8">📅</div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">Aucun historique</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-4 max-w-md mx-auto font-medium px-8 text-lg leading-relaxed">
          Passez votre premier examen blanc pour commencer à suivre vos progrès !
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Tabs for filtering - sticky */}
      <div className="sticky top-0 z-40 bg-slate-50 dark:bg-slate-950 -mx-6 sm:-mx-0 px-6 sm:px-0 pt-0 pb-0">
        <div className="flex gap-1 sm:gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-hide bg-slate-50 dark:bg-slate-950">
          <button
            onClick={() => setFilterMode('partA')}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
              filterMode === 'partA'
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
            }`}
          >
            A
          </button>
          <button
            onClick={() => setFilterMode('partB')}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
              filterMode === 'partB'
                ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
            }`}
          >
            B
          </button>
          <button
            onClick={() => setFilterMode('full')}
            className={`px-4 sm:px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-bold uppercase tracking-wider transition-colors whitespace-nowrap flex-shrink-0 ${
              filterMode === 'full'
                ? 'text-indigo-600 dark:text-indigo-400 border-b-2 border-indigo-600 dark:border-indigo-400'
                : 'text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400'
            }`}
          >
            Complet
          </button>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="py-12 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800">
          <p className="text-slate-500 dark:text-slate-400">Aucun résultat pour ce filtre.</p>
        </div>
      ) : (
        <div className="grid gap-4">
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
            <div key={item._id || item.timestamp} className="bg-white dark:bg-slate-900 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:border-indigo-500/50 hover:shadow-md transition-all">
              {/* Desktop: Single row layout */}
              <div className="hidden sm:flex items-center gap-4">
                {/* Score and CLB */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">{item.score}</div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 leading-none">{item.clbLevel}</span>
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider leading-none mt-0.5">{item.score}/699</span>
                  </div>
                </div>

                {/* Task number and date */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {taskNumberText && (
                    <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded">
                      {taskNumberText}
                    </span>
                  )}
                  <span className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                    {formatDateFrench(item.timestamp)}
                  </span>
                </div>

                {/* CECR level */}
                {item.cecrLevel && (
                  <div className="flex-shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                      item.cecrLevel.includes('C2') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                      item.cecrLevel.includes('C1') ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                      item.cecrLevel.includes('B2') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                      item.cecrLevel.includes('B1') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                      item.cecrLevel.includes('A2') ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                      'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
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
                    className="px-3 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all"
                  >
                    Reprendre
                  </button>
                  <button 
                    onClick={() => navigate(`/results/${item._id}`)}
                    className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black text-[9px] uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all"
                  >
                    Détails →
                  </button>
                </div>
              </div>

              {/* Mobile: Compact column layout */}
              <div className="flex sm:hidden items-center gap-3">
                <div className="text-xl font-black text-slate-900 dark:text-white flex-shrink-0">{item.score}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    {taskNumberText && (
                      <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {taskNumberText}
                      </span>
                    )}
                    {item.cecrLevel && (
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${
                        item.cecrLevel.includes('C2') ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' :
                        item.cecrLevel.includes('C1') ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' :
                        item.cecrLevel.includes('B2') ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        item.cecrLevel.includes('B1') ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' :
                        item.cecrLevel.includes('A2') ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' :
                        'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.cecrLevel}
                      </span>
                    )}
                  </div>
                  <div className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-0.5">
                    {formatDateFrench(item.timestamp)}
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleRetake(item)}
                    className="px-2.5 py-1.5 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-900/50 transition-all"
                  >
                    Reprendre
                  </button>
                  <button 
                    onClick={() => navigate(`/results/${item._id}`)}
                    className="px-3 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-lg font-black text-[8px] uppercase tracking-widest hover:bg-indigo-600 dark:hover:bg-indigo-400 transition-all"
                  >
                    Détails
                  </button>
                </div>
              </div>
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
