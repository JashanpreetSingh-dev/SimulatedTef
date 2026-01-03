
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { persistenceService } from '../services/persistence';
import { SavedResult, NormalizedTask } from '../types';
import { formatDateFrench } from '../utils/dateFormatting';

interface HistoryListProps {
  module?: 'oralExpression' | 'writtenExpression';
}

const RESULTS_PER_PAGE = 20;

export const HistoryList: React.FC<HistoryListProps> = ({ module }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const userId = user?.id || 'guest';
  const [results, setResults] = useState<SavedResult[]>([]);
  const [tasks, setTasks] = useState<Map<string, NormalizedTask>>(new Map()); // Map of taskId -> task
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const scrollContainerRef = React.useRef<HTMLDivElement>(null);

  // Initial load and reload when filter mode changes
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      setResults([]);
      setHasMore(true);
      // Reset scroll position
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = 0;
      }
      try {
        // Determine resultType based on module
        const resultType = module === 'oralExpression' || module === 'writtenExpression' ? 'practice' : undefined;
        const response = await persistenceService.getAllResults(
          userId, 
          getToken, 
          RESULTS_PER_PAGE, 
          0,
          resultType,
          module,
          undefined,
          true // populateTasks
        );
        setResults(response.results || []);
        setHasMore(response.pagination?.hasMore ?? true);
        
        // Extract and store tasks from populated results
        const taskMap = new Map<string, NormalizedTask>();
        response.results?.forEach((result: any) => {
          if (result.taskA) {
            taskMap.set(result.taskReferences?.taskA?.taskId || '', result.taskA);
          }
          if (result.taskB) {
            taskMap.set(result.taskReferences?.taskB?.taskId || '', result.taskB);
          }
        });
        setTasks(taskMap);
      } catch (error) {
        console.error('Error loading results:', error);
        setResults([]);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [userId, getToken, module]);

  // Load more results when scrolling
  const loadMore = React.useCallback(async () => {
    if (loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const resultType = module === 'oralExpression' || module === 'writtenExpression' ? 'practice' : undefined;
    const response = await persistenceService.getAllResults(
      userId, 
      getToken, 
      RESULTS_PER_PAGE, 
      results.length,
      resultType,
      module,
      undefined,
      true // populateTasks
    );
    setResults(prev => [...prev, ...response.results]);
    setHasMore(response.pagination?.hasMore ?? false);
    
    // Update tasks map with new tasks
    setTasks(prev => {
      const newMap = new Map(prev);
      response.results?.forEach((result: any) => {
        if (result.taskA) {
          newMap.set(result.taskReferences?.taskA?.taskId || '', result.taskA);
        }
        if (result.taskB) {
          newMap.set(result.taskReferences?.taskB?.taskId || '', result.taskB);
        }
      });
      return newMap;
    });
    setLoadingMore(false);
  }, [userId, getToken, results.length, loadingMore, hasMore, module]);

  // Scroll detection for infinite scroll
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = container;
      // Load more when user is within 200px of bottom
      if (scrollHeight - scrollTop - clientHeight < 200 && hasMore && !loadingMore) {
        loadMore();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [hasMore, loadingMore, loadMore]);

  // Filter results by module type and resultType (no mode filtering - show all)
  const filteredResults = results.filter(result => {
    if (!module) return true;
    
    // Filter by module type and resultType
    const expectedResultType = module === 'oralExpression' || module === 'writtenExpression' ? 'practice' : 'mockExam';
    const moduleMatch = result.module === module;
    const resultTypeMatch = result.resultType === expectedResultType;
    
    return moduleMatch && resultTypeMatch;
  });

  const handleRetake = async (result: SavedResult) => {
    // Determine which mode to use for retake
    let retakeMode: 'partA' | 'partB' | 'full' = result.mode as 'partA' | 'partB' | 'full';
    
    // Fetch tasks from references
    const taskIds: string[] = [];
    if (result.taskReferences?.taskA?.taskId) {
      taskIds.push(result.taskReferences.taskA.taskId);
    }
    if (result.taskReferences?.taskB?.taskId) {
      taskIds.push(result.taskReferences.taskB.taskId);
    }
    
    let fetchedTasks: NormalizedTask[] = [];
    if (taskIds.length > 0) {
      fetchedTasks = await persistenceService.getTasks(taskIds, getToken);
    }
    
    const taskMap = new Map(fetchedTasks.map(t => [t.taskId, t]));
    
    // Navigate to exam with tasks in state
    if (result.module === 'writtenExpression') {
      // For written expression
      const taskA = result.taskReferences?.taskA ? taskMap.get(result.taskReferences.taskA.taskId)?.taskData : null;
      const taskB = result.taskReferences?.taskB ? taskMap.get(result.taskReferences.taskB.taskId)?.taskData : null;
      
      // Fallback to legacy fields if task references not available
      const finalTaskA = taskA || (result as any).writtenExpressionResult?.sectionA?.task || (result as any).taskPartA;
      const finalTaskB = taskB || (result as any).writtenExpressionResult?.sectionB?.task || (result as any).taskPartB;
      
      sessionStorage.setItem('practice_selected_module', 'written');
      navigate(`/exam/written/${retakeMode}`, { 
        state: { 
          tasks: { taskA: finalTaskA, taskB: finalTaskB }, 
          from: '/practice',
          module: 'written',
          selectedModule: 'written'
        } 
      });
    } else if (result.module === 'oralExpression') {
      // For oral expression
      const taskA = result.taskReferences?.taskA ? taskMap.get(result.taskReferences.taskA.taskId)?.taskData : null;
      const taskB = result.taskReferences?.taskB ? taskMap.get(result.taskReferences.taskB.taskId)?.taskData : null;
      
      // Fallback to legacy fields
      const finalTaskA = taskA || (result as any).taskPartA;
      const finalTaskB = taskB || (result as any).taskPartB;
      
      const scenario = {
        title: result.title,
        mode: retakeMode,
        officialTasks: {
          partA: finalTaskA,
          partB: finalTaskB
        }
      };
      
      sessionStorage.setItem('practice_selected_module', 'oral');
      navigate(`/exam/${retakeMode}`, { 
        state: { 
          scenario, 
          from: '/practice',
          module: 'oral',
          selectedModule: 'oral'
        } 
      });
    }
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

      {/* Scrollable list container */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 min-h-0 overflow-y-auto pt-6"
      >
        {filteredResults.length === 0 && !loading ? (
          <div className="py-12 text-center bg-indigo-100/70 dark:bg-slate-800/70 rounded-[2rem] border border-slate-200 dark:border-slate-700 transition-colors">
            <p className="text-slate-500 dark:text-slate-400">{t('history.noResults')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-2 pb-4">
              {filteredResults.map((item) => {
            // Get task numbers from task references or legacy fields
            const taskNumbers = [];
            const taskA = item.taskReferences?.taskA ? tasks.get(item.taskReferences.taskA.taskId) : null;
            const taskB = item.taskReferences?.taskB ? tasks.get(item.taskReferences.taskB.taskId) : null;
            
            // Fallback to legacy fields if needed
            const legacyTaskA = (item as any).taskPartA;
            const legacyTaskB = (item as any).taskPartB;
            const legacyWrittenTaskA = (item as any).writtenExpressionResult?.sectionA?.task;
            const legacyWrittenTaskB = (item as any).writtenExpressionResult?.sectionB?.task;
            
            if (item.mode === 'partA') {
              if (taskA?.taskData) {
                const id = (taskA.taskData as any).id;
                taskNumbers.push(`A#${id}`);
              } else if (legacyTaskA) {
                taskNumbers.push(`A#${legacyTaskA.id}`);
              } else if (legacyWrittenTaskA) {
                taskNumbers.push(`A#${legacyWrittenTaskA.id}`);
              }
            } else if (item.mode === 'partB') {
              if (taskB?.taskData) {
                const id = (taskB.taskData as any).id;
                taskNumbers.push(`B#${id}`);
              } else if (legacyTaskB) {
                taskNumbers.push(`B#${legacyTaskB.id}`);
              } else if (legacyWrittenTaskB) {
                taskNumbers.push(`B#${legacyWrittenTaskB.id}`);
              }
            } else if (item.mode === 'full') {
              if (taskA?.taskData) {
                const id = (taskA.taskData as any).id;
                taskNumbers.push(`A#${id}`);
              } else if (legacyTaskA) {
                taskNumbers.push(`A#${legacyTaskA.id}`);
              } else if (legacyWrittenTaskA) {
                taskNumbers.push(`A#${legacyWrittenTaskA.id}`);
              }
              if (taskB?.taskData) {
                const id = (taskB.taskData as any).id;
                taskNumbers.push(`B#${id}`);
              } else if (legacyTaskB) {
                taskNumbers.push(`B#${legacyTaskB.id}`);
              } else if (legacyWrittenTaskB) {
                taskNumbers.push(`B#${legacyWrittenTaskB.id}`);
              }
            }
            const taskNumberText = taskNumbers.join(' / ');
            
            // Get evaluation data from new structure or legacy fields
            const getEvaluationData = (result: SavedResult) => {
              // For partA/partB, check moduleData first
              if (result.moduleData && result.moduleData.type === 'oralExpression') {
                if (result.mode === 'partA' && result.moduleData.sectionA?.result) {
                  return result.moduleData.sectionA.result;
                } else if (result.mode === 'partB' && result.moduleData.sectionB?.result) {
                  return result.moduleData.sectionB.result;
                }
              }
              // Fallback to main evaluation or legacy structure
              return result.evaluation || result;
            };
            
            const evaluationData = getEvaluationData(item);
            const score = evaluationData.score ?? (item as any).score;
            const clbLevel = evaluationData.clbLevel ?? (item as any).clbLevel;
            const cecrLevel = evaluationData.cecrLevel ?? (item as any).cecrLevel;
            
            // Get mode badge color and label
            const getModeBadgeColor = (mode: string) => {
              if (mode === 'partA') return 'bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-400 border-blue-200 dark:border-blue-800';
              if (mode === 'partB') return 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
              return 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800';
            };
            
            const getModeLabel = (mode: string) => {
              if (mode === 'partA') return t('history.tabA');
              if (mode === 'partB') return t('history.tabB');
              return t('history.tabComplete');
            };
            
            return (
            <div key={item._id || item.timestamp} className="bg-indigo-100/70 dark:bg-slate-800/70 p-2 sm:p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300/50 dark:hover:border-indigo-600/50 hover:shadow-md transition-all">
              {/* Desktop: Single row layout */}
              <div className="hidden sm:flex items-center gap-3">
                {/* Left section: Mode badge, Score with /699 */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`px-1.5 py-0.5 rounded border font-black text-[8px] uppercase tracking-wider ${getModeBadgeColor(item.mode)}`}>
                    {getModeLabel(item.mode)}
                  </div>
                  <div className="flex items-baseline gap-1.5">
                    <div className="text-xl font-black text-slate-800 dark:text-slate-100">{score ?? '—'}</div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">/699</div>
                  </div>
                </div>

                {/* Center section: CLB, CECR, Task, Date */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  {/* CLB Badge */}
                  {clbLevel && (
                    <div className="bg-indigo-400 dark:bg-indigo-500 text-white px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                      <span className="text-[7px] font-black uppercase tracking-wider opacity-80">CLB</span>
                      <span className="text-xs font-black">{clbLevel}</span>
                    </div>
                  )}

                  {/* CECR Badge */}
                  {cecrLevel && (
                    <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex-shrink-0 ${
                      cecrLevel.includes('C2') ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-400 dark:text-purple-300' :
                      cecrLevel.includes('C1') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300' :
                      cecrLevel.includes('B2') ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300' :
                      cecrLevel.includes('B1') ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300' :
                      cecrLevel.includes('A2') ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' :
                      'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                    }`}>
                      {cecrLevel}
                    </span>
                  )}

                  {/* Task number */}
                  {taskNumberText && (
                    <span className="text-[10px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
                      {taskNumberText}
                    </span>
                  )}

                  {/* Date */}
                  <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {formatDateFrench(item.timestamp)}
                  </span>
                </div>

                {/* Right section: Action buttons */}
                <div className="flex gap-1.5 flex-shrink-0">
                  <button 
                    onClick={() => handleRetake(item)}
                    className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300 rounded font-black text-[8px] uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all"
                  >
                    {t('actions.resume')}
                  </button>
                  <button 
                    onClick={() => navigate(`/results/${item._id}`)}
                    className="px-2.5 py-1 bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 rounded font-black text-[8px] uppercase tracking-widest hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-all"
                  >
                    {t('actions.details')} →
                  </button>
                </div>
              </div>

              {/* Mobile: Compact column layout */}
              <div className="flex sm:hidden items-start gap-3">
                {/* Mode badge and Score with /699 */}
                <div className="flex flex-col items-start gap-1.5 flex-shrink-0">
                  <div className={`px-1.5 py-0.5 rounded border font-black text-[8px] uppercase tracking-wider ${getModeBadgeColor(item.mode)}`}>
                    {getModeLabel(item.mode)}
                  </div>
                  <div className="flex items-baseline gap-1">
                    <div className="text-xl font-black text-slate-800 dark:text-slate-100">{score ?? '—'}</div>
                    <div className="text-xs font-bold text-slate-500 dark:text-slate-400">/699</div>
                  </div>
                </div>
                
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  {/* First row: Badges and task */}
                  <div className="flex items-center gap-2 flex-wrap mb-1.5">
                    {clbLevel && (
                      <div className="bg-indigo-400 dark:bg-indigo-500 text-white px-2 py-0.5 rounded flex items-center gap-1 flex-shrink-0">
                        <span className="text-[7px] font-black uppercase tracking-wider opacity-80">CLB</span>
                        <span className="text-xs font-black">{clbLevel}</span>
                      </div>
                    )}
                    {cecrLevel && (
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider flex-shrink-0 ${
                        cecrLevel.includes('C2') ? 'bg-purple-100 dark:bg-purple-900/50 text-purple-400 dark:text-purple-300' :
                        cecrLevel.includes('C1') ? 'bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300' :
                        cecrLevel.includes('B2') ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-400 dark:text-blue-300' :
                        cecrLevel.includes('B1') ? 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-400 dark:text-emerald-300' :
                        cecrLevel.includes('A2') ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' :
                        'bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400'
                      }`}>
                        {cecrLevel}
                      </span>
                    )}
                    {taskNumberText && (
                      <span className="text-[9px] font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded flex-shrink-0">
                        {taskNumberText}
                      </span>
                    )}
                  </div>
                  
                  {/* Second row: Date and buttons */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400">
                      {formatDateFrench(item.timestamp)}
                    </span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <button 
                        onClick={() => handleRetake(item)}
                        className="px-2 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300 rounded font-black text-[8px] uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all"
                      >
                        {t('actions.resume')}
                      </button>
                      <button 
                        onClick={() => navigate(`/results/${item._id}`)}
                        className="px-2.5 py-1 bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 rounded font-black text-[8px] uppercase tracking-widest hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-all"
                      >
                        {t('actions.details')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })}
            </div>
            
            {/* Loading more indicator */}
            {loadingMore && (
              <div className="py-8 text-center">
                <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                  <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">{t('status.loading')}</span>
                </div>
              </div>
            )}
            
            {/* End of results indicator */}
            {!hasMore && filteredResults.length > 0 && (
              <div className="py-4 text-center">
                <p className="text-[10px] text-slate-400 dark:text-slate-600 font-medium opacity-60">
                  {t('history.endOfResults')}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
