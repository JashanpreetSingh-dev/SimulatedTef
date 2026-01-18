import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { WrittenTask, SavedResult } from '../../../types';
import { evaluationJobService } from '../../../services/evaluationJobService';

interface UseGuidedWritingEvaluationOptions {
  taskA: WrittenTask;
  taskB: WrittenTask;
  title: string;
  onSuccess: (result: SavedResult) => void;
  onError?: (error: Error) => void;
  mode: 'partA' | 'partB';
}

export function useGuidedWritingEvaluation({
  taskA,
  taskB,
  title,
  onSuccess,
  onError,
  mode,
}: UseGuidedWritingEvaluationOptions) {
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const submitEvaluation = async (sectionAText: string, sectionBText: string) => {
    setIsSubmitting(true);

    try {
      if (!getToken) {
        throw new Error('Authentication required');
      }

      // Combine sections for evaluation based on mode
      let combinedTranscript: string;
      let combinedPrompt: string;
      
      if (mode === 'partA') {
        combinedTranscript = `Section A (Fait divers):\n${sectionAText}`;
        combinedPrompt = `Section A: ${taskA.subject}\n${taskA.instruction}`;
      } else {
        combinedTranscript = `Section B (Argumentation):\n${sectionBText}`;
        combinedPrompt = `Section B: ${taskB.subject}\n${taskB.instruction}`;
      }

      // Submit evaluation job
      const { jobId } = await evaluationJobService.submitJob(
        'WrittenExpression',
        combinedPrompt,
        combinedTranscript,
        0, // scenarioId - not used for written expression
        mode === 'partA' ? (25 * 60) : (35 * 60), // time limit based on mode
        undefined, // questionCount
        undefined, // recordingId
        mode, // mode
        title,
        taskA, // taskPartA
        taskB, // taskPartB
        undefined, // eo2RemainingSeconds
        undefined, // fluencyAnalysis
        getToken,
        sectionAText || undefined, // writtenSectionAText
        sectionBText || undefined, // writtenSectionBText
        undefined, // mockExamId
        'writtenExpression' // module
      );

      setIsSubmitting(false);
      setIsEvaluating(true);

      // Poll for result
      const result = await evaluationJobService.pollJobStatus(
        jobId,
        getToken,
        undefined, // onProgress
        2000, // intervalMs
        150 // maxAttempts (5 minutes)
      );

      // Create SavedResult
      const savedResult: SavedResult = {
        ...result,
        userId: '', // Will be set by backend
        mode: mode,
        title: title,
        timestamp: Date.now(),
        mockExamId: undefined,
        module: 'writtenExpression',
        isLoading: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setIsEvaluating(false);
      onSuccess(savedResult);
    } catch (error) {
      console.error('Error submitting guided writing evaluation:', error);
      setIsSubmitting(false);
      setIsEvaluating(false);
      
      const err = error instanceof Error ? error : new Error('Une erreur est survenue lors de l\'évaluation.');
      if (onError) {
        onError(err);
      } else {
        alert(err.message);
      }
    }
  };

  return {
    submitEvaluation,
    isSubmitting,
    isEvaluating,
  };
}