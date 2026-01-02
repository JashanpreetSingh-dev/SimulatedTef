import { useMemo } from 'react';
import { SavedResult, WrittenTask } from '../../../types';

/**
 * Helper to extract WrittenTask from NormalizedTask or WrittenTask
 * NormalizedTask: { taskId, type, taskData: WrittenTask, ... }
 * WrittenTask: { id, section, subject, instruction, minWords, ... }
 */
function extractWrittenTask(task: any): WrittenTask | undefined {
  if (!task) return undefined;
  
  // Priority 1: If task has taskData property, it's a NormalizedTask - extract the taskData
  // This is the most common case when tasks are populated from the database
  if (task.taskData && typeof task.taskData === 'object') {
    const taskData = task.taskData;
    // WrittenTask should have: id (string), section ('A'|'B'), subject (string), instruction (string)
    if (taskData.subject !== undefined || taskData.instruction !== undefined || 
        (taskData.id !== undefined && typeof taskData.id === 'string')) {
      return taskData as WrittenTask;
    }
  }
  
  // Priority 2: Check if it's already a WrittenTask (has subject or instruction, but no type/taskId)
  // WrittenTask has: { id: string, section: 'A'|'B', subject: string, instruction: string, minWords: number }
  if (task.subject !== undefined || task.instruction !== undefined) {
    // Make sure it's not a NormalizedTask (which would have type and taskId)
    if (!task.type && !task.taskId) {
      return task as WrittenTask;
    }
  }
  
  // Priority 3: If it has id as string and section, it's likely a WrittenTask
  if (task.id !== undefined && typeof task.id === 'string' && 
      (task.section === 'A' || task.section === 'B') && 
      !task.type && !task.taskId) {
    return task as WrittenTask;
  }
  
  // Last resort: return as-is (might be a different structure or already correct)
  return task as WrittenTask;
}

/**
 * Hook to reconstruct written expression data from result
 */
export function useWrittenExpressionData(result: SavedResult) {
  return useMemo(() => {
    if (result.module !== 'writtenExpression') return null;
    
    // If moduleData exists and is WrittenExpressionData, use it
    if (result.moduleData && result.moduleData.type === 'writtenExpression') {
      const moduleData = result.moduleData;
      // Get tasks from populated result or legacy fields
      // Normalize tasks to always be WrittenTask objects
      const taskA = extractWrittenTask((result as any).taskA) || 
                    extractWrittenTask((result as any).writtenExpressionResult?.sectionA?.task) || 
                    result.taskPartA as WrittenTask | undefined;
      const taskB = extractWrittenTask((result as any).taskB) || 
                    extractWrittenTask((result as any).writtenExpressionResult?.sectionB?.task) || 
                    result.taskPartB as WrittenTask | undefined;
      
      // For partA/partB, only return the relevant section
      if (result.mode === 'partA') {
        return {
          sectionA: {
            text: moduleData.sectionA?.text || '',
            task: taskA,
            result: moduleData.sectionA?.result,
          },
        };
      } else if (result.mode === 'partB') {
        return {
          sectionB: {
            text: moduleData.sectionB?.text || '',
            task: taskB,
            result: moduleData.sectionB?.result,
          },
        };
      }
      
      // For full mode, return both sections
      return {
        sectionA: {
          text: moduleData.sectionA?.text || '',
          task: taskA,
          result: moduleData.sectionA?.result,
        },
        sectionB: {
          text: moduleData.sectionB?.text || '',
          task: taskB,
          result: moduleData.sectionB?.result,
        },
      };
    }
    
    // Fallback to legacy writtenExpressionResult
    if (result.writtenExpressionResult?.sectionA && result.writtenExpressionResult?.sectionB) {
      return result.writtenExpressionResult;
    }
    
    // Otherwise, try to reconstruct from transcript and task data
    // Normalize tasks to always be WrittenTask objects
    const taskA = extractWrittenTask((result as any).taskA) || result.taskPartA as WrittenTask | undefined;
    const taskB = extractWrittenTask((result as any).taskB) || result.taskPartB as WrittenTask | undefined;
    
    if (result.transcript && taskA && taskB) {
      const transcript = result.transcript;
      const sectionAMatch = transcript.match(/Section A[^:]*:\s*(.*?)(?=\n\nSection B|$)/s);
      const sectionBMatch = transcript.match(/Section B[^:]*:\s*(.*?)$/s);
      
      if (sectionAMatch && sectionBMatch) {
        return {
          sectionA: {
            text: sectionAMatch[1].trim(),
            task: taskA,
          },
          sectionB: {
            text: sectionBMatch[1].trim(),
            task: taskB,
          },
        };
      }
    }
    
    return null;
  }, [result]);
}
