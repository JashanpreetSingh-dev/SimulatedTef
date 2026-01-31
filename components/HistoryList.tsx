
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import { useLanguage } from '../contexts/LanguageContext';
import { persistenceService } from '../services/persistence';
import { assignmentService } from '../services/assignmentService';
import { evaluationJobService } from '../services/evaluationJobService';
import { geminiService } from '../services/gemini';
import { SavedResult, NormalizedTask, ResultListItem } from '../types';
import { formatDateFrench } from '../utils/dateFormatting';
import { LoadingSkeleton } from './common/Loading';
import ReactPaginate from 'react-paginate';

interface HistoryListProps {
  module?: 'oralExpression' | 'writtenExpression' | 'reading' | 'listening';
}

const RESULTS_PER_PAGE = 5;

export const HistoryList: React.FC<HistoryListProps> = ({ module }) => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const userId = user?.id || 'guest';
  const [results, setResults] = useState<(SavedResult | ResultListItem)[]>([]);
  const [tasks, setTasks] = useState<Map<string, NormalizedTask>>(new Map()); // Map of taskId -> task
  const [assignmentCompletionCounts, setAssignmentCompletionCounts] = useState<Map<string, number>>(new Map()); // Map of assignmentId -> completion count
  const [loading, setLoading] = useState(true);
  const [recheckingResults, setRecheckingResults] = useState<Set<string>>(new Set()); // Track which results are being rechecked
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);

  // Reset to first page when module filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [module]);

  // Fetch results when page or filter changes
  useEffect(() => {
    const fetchResults = async () => {
      setLoading(true);
      try {
        // Determine resultType based on module
        // For oral/written expression: show practice results
        // For reading/listening: show assignment results (practice assignments, not mock exam results)
        const resultType = (module === 'oralExpression' || module === 'writtenExpression') 
          ? 'practice' 
          : (module === 'reading' || module === 'listening') 
            ? 'assignment' 
            : undefined;
        
        const skip = currentPage * RESULTS_PER_PAGE;
        const response = await persistenceService.getAllResults(
          userId, 
          getToken, 
          RESULTS_PER_PAGE, 
          skip,
          resultType,
          module,
          undefined,
          true // populateTasks
        );
        setResults(response.results || []);
        
        // Calculate pagination info
        if (response.pagination) {
          const total = response.pagination.total || 0;
          setTotalResults(total);
          setTotalPages(Math.ceil(total / RESULTS_PER_PAGE));
        } else {
          // Fallback: if no pagination info, assume we have more if results.length === RESULTS_PER_PAGE
          setTotalResults(response.results?.length || 0);
          setTotalPages(response.results?.length === RESULTS_PER_PAGE ? currentPage + 2 : currentPage + 1);
        }
        
        // Fetch tasks using taskReferences (taskA/taskB are no longer populated)
        const taskIds = new Set<string>();
        response.results?.forEach((result: any) => {
          if (result.taskReferences?.taskA?.taskId) {
            taskIds.add(result.taskReferences.taskA.taskId);
          }
          if (result.taskReferences?.taskB?.taskId) {
            taskIds.add(result.taskReferences.taskB.taskId);
          }
        });
        
        if (taskIds.size > 0 && getToken) {
          try {
            const fetchedTasks = await persistenceService.getTasks(Array.from(taskIds), getToken);
            const taskMap = new Map<string, NormalizedTask>();
            fetchedTasks.forEach(task => {
              taskMap.set(task.taskId, task);
            });
            setTasks(taskMap);
          } catch (error) {
            console.error('Failed to fetch tasks:', error);
          }
        }
        
        // Count assignment completions - fetch all assignment results for this user to get accurate counts
        if (userId && userId !== 'guest') {
          try {
            const allResultsResponse = await persistenceService.getAllResults(
              userId,
              getToken,
              1000, // Get a large number to count all completions
              0,
              'assignment', // Only get assignment results
              undefined,
              undefined,
              false // Don't need to populate tasks for counting
            );
            
            // Count completions per assignment
            const completionCounts = new Map<string, number>();
            allResultsResponse.results?.forEach((result: SavedResult) => {
              if (result.assignmentId) {
                const currentCount = completionCounts.get(result.assignmentId) || 0;
                completionCounts.set(result.assignmentId, currentCount + 1);
              }
            });
            setAssignmentCompletionCounts(completionCounts);
          } catch (error) {
            console.error('Failed to fetch assignment completion counts:', error);
            // Continue without completion counts
          }
        }
      } catch (error) {
        console.error('Error loading results:', error);
        setResults([]);
        setTotalPages(0);
        setTotalResults(0);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [userId, getToken, module, currentPage]);

  // Handle page change
  const handlePageChange = ({ selected }: { selected: number }) => {
    setCurrentPage(selected);
    // Scroll to top when page changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Filter results by module type and resultType (no mode filtering - show all)
  const filteredResults = results.filter(result => {
    if (!module) {
      // When no module filter, show all results (practice, mockExam, and assignment)
      return true;
    }
    
    // Filter by module type and resultType
    // For oral/written expression: show practice results
    // For reading/listening: show ONLY assignment results (not mock exam results - those belong to mock exams)
    if (module === 'oralExpression' || module === 'writtenExpression') {
      return result.module === module && result.resultType === 'practice';
    } else if (module === 'reading' || module === 'listening') {
      // For reading/listening practice, show only assignment results (not mock exam results)
      return result.module === module && result.resultType === 'assignment';
    } else {
      // Default case - shouldn't happen but filter by module
      return result.module === module;
    }
  });

  const handleRecheck = async (result: SavedResult | ResultListItem) => {
    // Only allow recheck for SavedResult (full data required)
    // ResultListItem doesn't have the necessary data (transcript, moduleData, etc.)
    if (!('evaluation' in result) && !('moduleData' in result)) {
      // This is a ResultListItem - fetch full result first
      const resultId = result._id;
      if (!resultId || !getToken) return;
      
      try {
        // Fetch full result from API
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'}/api/results/detail/${resultId}`, {
          headers: {
            'Authorization': `Bearer ${await getToken()}`,
          },
        });
        if (!response.ok) {
          alert('Unable to recheck: result not found');
          return;
        }
        const fullResult = await response.json();
        // Recursively call with full result
        return handleRecheck(fullResult);
      } catch (error) {
        console.error('Failed to fetch full result for recheck:', error);
        alert('Unable to recheck: failed to load result details');
        return;
      }
    }
    
    // Only allow recheck for oral and written expression practice results
    const savedResult = result as SavedResult;
    if (savedResult.module !== 'oralExpression' && savedResult.module !== 'writtenExpression') {
      return;
    }
    if (savedResult.resultType !== 'practice') {
      return;
    }

    const resultId = savedResult._id;
    if (!resultId) {
      alert('Unable to recheck: result ID is missing');
      return;
    }

    // Mark as rechecking
    setRecheckingResults(prev => new Set(prev).add(resultId));

    try {
      // Extract transcript/text from result
      let transcript = '';
      let writtenSectionAText = '';
      let writtenSectionBText = '';
      let fluencyAnalysis: any | null = null;
      
      if (savedResult.module === 'oralExpression') {
        // For oral expression, re-transcribe from audio file if available
        if (savedResult.recordingId) {
          try {
            console.log('🎤 Re-transcribing audio from recording:', result.recordingId);
            const audioBlob = await persistenceService.downloadRecording(result.recordingId, getToken);
            
            if (audioBlob) {
              // Re-transcribe the audio file
              const transcriptionResult = await geminiService.transcribeAudio(audioBlob);
              transcript = transcriptionResult.transcript || '';
              fluencyAnalysis = transcriptionResult.fluency_analysis || null;
              console.log('✅ Audio re-transcribed successfully:', transcript.substring(0, 100) + (transcript.length > 100 ? '...' : ''));
            } else {
              console.warn('⚠️ Failed to download audio, falling back to saved transcript');
              // Fallback to saved transcript if download fails
              // For oral expression, transcript is always at top level
              transcript = savedResult.transcript || '';
            }
          } catch (error) {
            console.error('❌ Error re-transcribing audio:', error);
            // Fallback to saved transcript if transcription fails
            // For oral expression, transcript is always at top level
            transcript = savedResult.transcript || '';
          }
        } else {
          // No recording ID, use saved transcript
          // For oral expression, transcript is always at top level
          transcript = savedResult.transcript || '';
        }
      } else if (savedResult.module === 'writtenExpression') {
        // For written expression, get text from moduleData
        if (savedResult.moduleData && savedResult.moduleData.type === 'writtenExpression') {
          writtenSectionAText = savedResult.moduleData.sectionA?.text || '';
          writtenSectionBText = savedResult.moduleData.sectionB?.text || '';
          
          // Build combined transcript for evaluation
          if (savedResult.mode === 'partA') {
            transcript = `Section A (Fait divers):\n${writtenSectionAText}`;
          } else if (savedResult.mode === 'partB') {
            transcript = `Section B (Argumentation):\n${writtenSectionBText}`;
          } else {
            transcript = `Section A (Fait divers):\n${writtenSectionAText}\n\nSection B (Argumentation):\n${writtenSectionBText}`;
          }
        } else {
          // Fallback to legacy fields
          const legacySectionA = (savedResult as any).writtenExpressionResult?.sectionA?.text || '';
          const legacySectionB = (savedResult as any).writtenExpressionResult?.sectionB?.text || '';
          if (savedResult.mode === 'partA') {
            transcript = `Section A (Fait divers):\n${legacySectionA}`;
            writtenSectionAText = legacySectionA;
          } else if (result.mode === 'partB') {
            transcript = `Section B (Argumentation):\n${legacySectionB}`;
            writtenSectionBText = legacySectionB;
          } else {
            transcript = `Section A (Fait divers):\n${legacySectionA}\n\nSection B (Argumentation):\n${legacySectionB}`;
            writtenSectionAText = legacySectionA;
            writtenSectionBText = legacySectionB;
          }
        }
      }

      if (!transcript || transcript.trim().length === 0) {
        alert('Unable to recheck: transcript/text is missing');
        setRecheckingResults(prev => {
          const next = new Set(prev);
          next.delete(resultId);
          return next;
        });
        return;
      }

      // Extract tasks from task references or legacy fields
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

      // Get taskPartA and taskPartB
      let taskPartA: any = null;
      let taskPartB: any = null;

      if (result.taskReferences?.taskA) {
        taskPartA = taskMap.get(result.taskReferences.taskA.taskId)?.taskData;
      }
      if (result.taskReferences?.taskB) {
        taskPartB = taskMap.get(result.taskReferences.taskB.taskId)?.taskData;
      }

      // Fallback to legacy fields
      if (!taskPartA) {
        taskPartA = (result as any).taskPartA || (result as any).writtenExpressionResult?.sectionA?.task;
      }
      if (!taskPartB) {
        taskPartB = (result as any).taskPartB || (result as any).writtenExpressionResult?.sectionB?.task;
      }

      // Build prompt from tasks
      let prompt = '';
      if (result.module === 'oralExpression') {
        if (result.mode === 'partA' || result.mode === 'full') {
          prompt = taskPartA?.prompt || taskPartA?.subject || '';
        }
        if (result.mode === 'partB' || result.mode === 'full') {
          const partBPrompt = taskPartB?.prompt || taskPartB?.subject || '';
          if (result.mode === 'full') {
            prompt = `${prompt ? prompt + '\n\n' : ''}Section B: ${partBPrompt}`;
          } else {
            prompt = partBPrompt;
          }
        }
      } else if (result.module === 'writtenExpression') {
        if (result.mode === 'partA' || result.mode === 'full') {
          prompt = `Section A: ${taskPartA?.subject || ''}\n${taskPartA?.instruction || ''}`;
        }
        if (result.mode === 'partB' || result.mode === 'full') {
          const partBPrompt = `Section B: ${taskPartB?.subject || ''}\n${taskPartB?.instruction || ''}`;
          if (result.mode === 'full') {
            prompt = `${prompt ? prompt + '\n\n' : ''}${partBPrompt}`;
          } else {
            prompt = partBPrompt;
          }
        }
      }

      // Determine section type for evaluation
      const section = result.module === 'oralExpression' ? 'OralExpression' : 'WrittenExpression';

      // Submit re-evaluation job
      const { jobId } = await evaluationJobService.submitJob(
        section,
        prompt,
        transcript,
        0, // scenarioId - not used for re-evaluation
        result.mode === 'partA' ? (25 * 60) : result.mode === 'partB' ? (35 * 60) : (25 * 60) + (35 * 60), // timeLimitSec
        undefined, // questionCount
        result.recordingId, // recordingId
        result.mode || 'full', // mode
        result.title || 'Re-evaluation', // title
        taskPartA, // taskPartA
        taskPartB, // taskPartB
        undefined, // eo2RemainingSeconds
        fluencyAnalysis || undefined, // fluencyAnalysis - use fresh analysis if available
        getToken,
        writtenSectionAText || undefined, // writtenSectionAText
        writtenSectionBText || undefined, // writtenSectionBText
        undefined, // mockExamId
        result.module // module
      );

      // Poll for completion - this returns the new SavedResult created by the worker
      const newResult = await evaluationJobService.pollJobStatus(
        jobId,
        getToken,
        undefined, // onProgress
        2000, // intervalMs
        150 // maxAttempts (5 minutes)
      );

      // The worker creates a NEW result, so we need to refresh the list to show it
      // Reload results to include the new entry - go to first page
      setCurrentPage(0);
      try {
        const resultType = (result.module === 'oralExpression' || result.module === 'writtenExpression') 
          ? 'practice' 
          : undefined;
        const response = await persistenceService.getAllResults(
          userId, 
          getToken, 
          RESULTS_PER_PAGE, 
          0,
          resultType,
          result.module,
          undefined,
          true // populateTasks
        );
        
        // Update results list - new result will appear at the top (sorted by timestamp)
        setResults(response.results || []);
        
        // Update pagination info
        if (response.pagination) {
          const total = response.pagination.total || 0;
          setTotalResults(total);
          setTotalPages(Math.ceil(total / RESULTS_PER_PAGE));
        }
        
        // Extract and store tasks from populated results
        const taskMap = new Map<string, NormalizedTask>();
        response.results?.forEach((r: any) => {
          if (r.taskA) {
            taskMap.set(r.taskReferences?.taskA?.taskId || '', r.taskA);
          }
          if (r.taskB) {
            taskMap.set(r.taskReferences?.taskB?.taskId || '', r.taskB);
          }
        });
        setTasks(taskMap);
      } catch (error) {
        console.error('Error refreshing results list:', error);
      }

      alert('Re-evaluation completed successfully! A new result has been added to your history.');
    } catch (error) {
      console.error('Error rechecking result:', error);
      alert('Failed to recheck result. Please try again.');
    } finally {
      // Remove from rechecking set
      setRecheckingResults(prev => {
        const next = new Set(prev);
        next.delete(resultId);
        return next;
      });
    }
  };

  const handleRetake = async (result: SavedResult | ResultListItem) => {
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
    } else if ((result.module === 'reading' || result.module === 'listening') && result.assignmentId) {
      // For reading/listening assignments - fetch assignment to get taskId
      try {
        const assignment = await assignmentService.getAssignment(result.assignmentId, getToken);
        if (assignment && assignment.taskId) {
          navigate(`/exam/${result.module}?taskId=${assignment.taskId}&assignmentId=${result.assignmentId}`);
        } else {
          alert('Unable to retake this assignment. Assignment information is missing.');
        }
      } catch (error) {
        console.error('Failed to fetch assignment:', error);
        alert('Unable to retake this assignment. Please try again.');
      }
    } else if (result.module === 'reading' || result.module === 'listening') {
      // For reading/listening mock exams - navigate to mock exam view
      const mockExamId = 'mockExamId' in result ? result.mockExamId : undefined;
      if (mockExamId) {
        navigate(`/mock-exam/${mockExamId}?module=${result.module}`);
      } else {
        alert('Unable to retake this exam. Mock exam information is missing.');
      }
    }
  };

  if (loading) {
    return (
      <div className="grid gap-2 pt-6">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="bg-indigo-100/70 dark:bg-slate-800/70 p-2 rounded border border-slate-200 dark:border-slate-700"
          >
            <div className="hidden sm:flex items-center gap-2">
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <LoadingSkeleton variant="rectangular" width={60} height={24} />
                <LoadingSkeleton variant="text" width={40} height={20} />
              </div>
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <LoadingSkeleton variant="rectangular" width={70} height={24} />
                <LoadingSkeleton variant="rectangular" width={50} height={24} />
                <LoadingSkeleton variant="text" width={100} height={16} />
                <LoadingSkeleton variant="text" width={80} height={16} />
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <LoadingSkeleton variant="rectangular" width={80} height={32} />
                <LoadingSkeleton variant="rectangular" width={80} height={32} />
              </div>
            </div>
            <div className="sm:hidden space-y-2">
              <div className="flex items-center gap-1.5">
                <LoadingSkeleton variant="rectangular" width={60} height={24} />
                <LoadingSkeleton variant="text" width={40} height={20} />
              </div>
              <div className="flex items-center gap-1.5">
                <LoadingSkeleton variant="rectangular" width={70} height={24} />
                <LoadingSkeleton variant="rectangular" width={50} height={24} />
              </div>
              <LoadingSkeleton variant="text" width="100%" height={16} />
              <div className="flex gap-1.5">
                <LoadingSkeleton variant="rectangular" width={80} height={32} />
                <LoadingSkeleton variant="rectangular" width={80} height={32} />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="py-24 text-center bg-indigo-100/70 dark:bg-slate-800/70 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm animate-in zoom-in duration-500 transition-colors">
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
      {/* Results list container */}
      <div className="flex-1 min-h-0 pt-6">
        {filteredResults.length === 0 && !loading ? (
          <div className="py-12 text-center bg-indigo-100/70 dark:bg-slate-800/70 rounded-2xl border border-slate-200 dark:border-slate-700 transition-colors">
            <p className="text-slate-500 dark:text-slate-400">{t('history.noResults')}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 pb-4">
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
            
            // Get evaluation data - handle both ResultListItem (summary) and SavedResult (full)
            let score: number | undefined;
            let totalQuestions: number | undefined;
            let clbLevel: string | undefined;
            let cecrLevel: string | undefined;
            
            // Check if item is ResultListItem (has flattened fields) or SavedResult (has nested evaluation)
            if ('score' in item && 'clbLevel' in item && 'cecrLevel' in item && !('evaluation' in item)) {
              // ResultListItem - use flattened fields directly
              score = item.score;
              clbLevel = item.clbLevel;
              cecrLevel = item.cecrLevel;
              
              // For MCQ results, use flattened mcqScore/mcqTotalQuestions
              if (item.module === 'reading' || item.module === 'listening') {
                score = item.mcqScore;
                totalQuestions = item.mcqTotalQuestions;
              }
            } else {
              // SavedResult - use existing logic
              const getEvaluationData = (result: SavedResult) => {
                if ('evaluationSummary' in result && result.evaluationSummary) {
                  return result.evaluationSummary;
                }
                return result.evaluation || result;
              };
              
              const evaluationData = getEvaluationData(item as SavedResult);
              
              // For reading/listening (including assignments), get score from moduleData
              if (item.module === 'reading' || item.module === 'listening') {
                const savedResult = item as SavedResult;
                if (savedResult.moduleData && savedResult.moduleData.type === 'mcq') {
                  score = savedResult.moduleData.score;
                  totalQuestions = savedResult.moduleData.totalQuestions;
                } else if (item.module === 'reading' && (item as any).readingResult) {
                  score = (item as any).readingResult.score;
                  totalQuestions = (item as any).readingResult.totalQuestions;
                } else if (item.module === 'listening' && (item as any).listeningResult) {
                  score = (item as any).listeningResult.score;
                  totalQuestions = (item as any).listeningResult.totalQuestions;
                }
              } else {
                // For oral/written expression, use evaluation score
                const evalData = evaluationData as any;
                if ('score' in evalData && typeof evalData.score === 'number') {
                  score = evalData.score;
                } else if (evalData && typeof evalData === 'object' && 'evaluation' in evalData) {
                  score = (evalData as SavedResult).evaluation?.score;
                }
              }
              
              // Handle clbLevel and cecrLevel
              const evalData = evaluationData as any;
              if ('clbLevel' in evalData && typeof evalData.clbLevel === 'string') {
                clbLevel = evalData.clbLevel;
              } else if (evalData && typeof evalData === 'object' && 'evaluation' in evalData) {
                clbLevel = (evalData as SavedResult).evaluation?.clbLevel;
              }
              if ('cecrLevel' in evalData && typeof evalData.cecrLevel === 'string') {
                cecrLevel = evalData.cecrLevel;
              } else if (evalData && typeof evalData === 'object' && 'evaluation' in evalData) {
                cecrLevel = (evalData as SavedResult).evaluation?.cecrLevel;
              }
            }
            
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
            <div key={item._id || item.timestamp} className="bg-indigo-100/70 dark:bg-slate-800/70 p-2 rounded border border-slate-200 dark:border-slate-700 shadow-sm hover:border-indigo-300/50 dark:hover:border-indigo-600/50 hover:shadow-md transition-all">
              {/* Desktop: Single row layout */}
              <div className="hidden sm:flex items-center gap-2">
                {/* Left section: Mode badge, Score (only for reading/listening MCQ) */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className={`px-2 py-1 rounded border font-black text-xs uppercase tracking-wider ${getModeBadgeColor(item.mode)}`}>
                    {getModeLabel(item.mode)}
                  </div>
                  {/* Only show raw score for reading/listening (MCQ) results */}
                  {(item.module === 'reading' || item.module === 'listening') && (
                    <div className="flex items-baseline gap-1">
                      <div className="text-xl font-black text-slate-800 dark:text-slate-100">{score ?? '—'}</div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">/{totalQuestions ?? 40}</div>
                    </div>
                  )}
                </div>

                {/* Center section: CLB, CECR, Task, Date */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  {/* CLB Badge */}
                  {clbLevel && (
                    <div className="bg-indigo-400 dark:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
                      <span className="text-xs font-black uppercase tracking-wider opacity-80">CLB</span>
                      <span className="text-xs font-black">{clbLevel}</span>
                    </div>
                  )}

                  {/* CECR Badge */}
                  {cecrLevel && (
                    <span className={`px-2 py-1 rounded-full text-xs font-black uppercase tracking-wider flex-shrink-0 ${
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

                  {/* Title/Assignment name - show for all results */}
                  {item.title && (
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">
                        {item.title}
                      </span>
                      {/* Show completion count for assignments */}
                      {item.assignmentId && assignmentCompletionCounts.has(item.assignmentId) && (
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded flex-shrink-0">
                          {assignmentCompletionCounts.get(item.assignmentId)}x
                        </span>
                      )}
                    </div>
                  )}

                  {/* Task number - only show for oral/written expression, not for reading/listening */}
                  {taskNumberText && (item.module === 'oralExpression' || item.module === 'writtenExpression') && (
                    <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded flex-shrink-0">
                      {taskNumberText}
                    </span>
                  )}

                  {/* Date */}
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 flex-shrink-0">
                    {formatDateFrench(item.timestamp)}
                  </span>
                </div>

                {/* Right section: Action buttons */}
                <div className="flex gap-2 flex-shrink-0">
                  <button 
                    onClick={() => handleRetake(item)}
                    className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300 rounded font-black text-xs uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all"
                  >
                    {(item.module === 'reading' || item.module === 'listening') ? t('actions.retake') : t('actions.resume')}
                  </button>
                  {/* Recheck button - only for oral/written expression practice results */}
                  {(item.module === 'oralExpression' || item.module === 'writtenExpression') && item.resultType === 'practice' && (
                    <button 
                      onClick={() => handleRecheck(item)}
                      disabled={recheckingResults.has(item._id || '')}
                      className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded font-black text-xs uppercase tracking-widest hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                    >
                      {recheckingResults.has(item._id || '') ? (
                        <>
                          <div className="w-3 h-3 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                          {t('actions.recheck')}
                        </>
                      ) : (
                        t('actions.recheck')
                      )}
                    </button>
                  )}
                  <button 
                    onClick={() => navigate(`/results/${item._id}`)}
                    className="px-3 py-1 bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 rounded font-black text-xs uppercase tracking-widest hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-all"
                  >
                    {t('actions.details')} →
                  </button>
                </div>
              </div>

              {/* Mobile: Compact column layout */}
              <div className="flex sm:hidden items-start gap-2">
                {/* Mode badge and Score (only for reading/listening MCQ) */}
                <div className="flex flex-col items-start gap-2 flex-shrink-0">
                  <div className={`px-2 py-1 rounded border font-black text-xs uppercase tracking-wider ${getModeBadgeColor(item.mode)}`}>
                    {getModeLabel(item.mode)}
                  </div>
                  {/* Only show raw score for reading/listening (MCQ) results */}
                  {(item.module === 'reading' || item.module === 'listening') && (
                    <div className="flex items-baseline gap-1">
                      <div className="text-xl font-black text-slate-800 dark:text-slate-100">{score ?? '—'}</div>
                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400">/{totalQuestions ?? 40}</div>
                    </div>
                  )}
                </div>
                
                {/* Main content */}
                <div className="flex-1 min-w-0">
                  {/* First row: Badges and task */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-1">
                    {clbLevel && (
                      <div className="bg-indigo-400 dark:bg-indigo-500 text-white px-2 py-1 rounded flex items-center gap-1 flex-shrink-0">
                        <span className="text-xs font-black uppercase tracking-wider opacity-80">CLB</span>
                        <span className="text-xs font-black">{clbLevel}</span>
                      </div>
                    )}
                    {cecrLevel && (
                      <span className={`px-2 py-1 rounded-full text-xs font-black uppercase tracking-wider flex-shrink-0 ${
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
                    {/* Task number - only show for oral/written expression, not for reading/listening */}
                    {taskNumberText && (item.module === 'oralExpression' || item.module === 'writtenExpression') && (
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-200 dark:bg-slate-700 px-2 py-1 rounded flex-shrink-0">
                        {taskNumberText}
                      </span>
                    )}
                  </div>
                  
                  {/* Title/Assignment name row */}
                  {item.title && (
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                        {item.title}
                      </span>
                      {/* Show completion count for assignments */}
                      {item.assignmentId && assignmentCompletionCounts.has(item.assignmentId) && (
                        <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-1 rounded flex-shrink-0">
                          {assignmentCompletionCounts.get(item.assignmentId)}x
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Second row: Date and buttons */}
                  <div className="flex items-center justify-between gap-1.5">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {formatDateFrench(item.timestamp)}
                    </span>
                    <div className="flex gap-2 flex-shrink-0">
                      <button 
                        onClick={() => handleRetake(item)}
                        className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-400 dark:text-indigo-300 rounded font-black text-xs uppercase tracking-widest hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-all"
                      >
                        {(item.module === 'reading' || item.module === 'listening') ? t('actions.retake') : t('actions.resume')}
                      </button>
                      {/* Recheck button - only for oral/written expression practice results */}
                      {(item.module === 'oralExpression' || item.module === 'writtenExpression') && item.resultType === 'practice' && (
                        <button 
                          onClick={() => handleRecheck(item)}
                          disabled={recheckingResults.has(item._id || '')}
                          className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded font-black text-xs uppercase tracking-widest hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          {recheckingResults.has(item._id || '') ? (
                            <>
                              <div className="w-3 h-3 border-2 border-emerald-600 dark:border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                              {t('actions.recheck')}
                            </>
                          ) : (
                            t('actions.recheck')
                          )}
                        </button>
                      )}
                      <button 
                        onClick={() => navigate(`/results/${item._id}`)}
                        className="px-3 py-1 bg-slate-900 dark:bg-slate-700 text-white dark:text-slate-100 rounded font-black text-xs uppercase tracking-widest hover:bg-indigo-400 dark:hover:bg-indigo-500 transition-all"
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
          </>
        )}
      </div>
      
      {/* Pagination controls */}
      {!loading && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <ReactPaginate
            previousLabel={'←'}
            nextLabel={'→'}
            breakLabel={'...'}
            pageCount={totalPages}
            marginPagesDisplayed={2}
            pageRangeDisplayed={5}
            onPageChange={handlePageChange}
            forcePage={currentPage}
            containerClassName="flex items-center gap-2"
            pageClassName="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
            pageLinkClassName="block"
            previousClassName="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            previousLinkClassName="block"
            nextClassName="px-3 py-1 rounded border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            nextLinkClassName="block"
            breakClassName="px-2 text-slate-500 dark:text-slate-400"
            activeClassName="bg-indigo-500 text-white border-indigo-500 dark:bg-indigo-600 dark:border-indigo-600"
            activeLinkClassName="block"
            disabledClassName="opacity-50 cursor-not-allowed"
          />
        </div>
      )}
      
      {/* Results count info */}
      {!loading && totalResults > 0 && (
        <div className="mt-4 text-center text-sm text-slate-500 dark:text-slate-400">
          Showing {currentPage * RESULTS_PER_PAGE + 1} to {Math.min((currentPage + 1) * RESULTS_PER_PAGE, totalResults)} of {totalResults} results
        </div>
      )}
    </div>
  );
};
