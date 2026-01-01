import { useMemo } from 'react';
import { SavedResult } from '../../../types';

/**
 * Hook to reconstruct written expression data from result
 */
export function useWrittenExpressionData(result: SavedResult) {
  return useMemo(() => {
    if (result.module !== 'writtenExpression') return null;
    
    // If writtenExpressionResult exists, use it
    if (result.writtenExpressionResult?.sectionA && result.writtenExpressionResult?.sectionB) {
      return result.writtenExpressionResult;
    }
    
    // Otherwise, try to reconstruct from transcript and task data
    if (result.transcript && result.taskPartA && result.taskPartB) {
      const transcript = result.transcript;
      const sectionAMatch = transcript.match(/Section A[^:]*:\s*(.*?)(?=\n\nSection B|$)/s);
      const sectionBMatch = transcript.match(/Section B[^:]*:\s*(.*?)$/s);
      
      if (sectionAMatch && sectionBMatch) {
        return {
          sectionA: {
            text: sectionAMatch[1].trim(),
            task: result.taskPartA,
          },
          sectionB: {
            text: sectionBMatch[1].trim(),
            task: result.taskPartB,
          },
        };
      }
    }
    
    return null;
  }, [result]);
}
