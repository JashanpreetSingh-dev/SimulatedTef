/**
 * Custom hook for managing exam submission
 * Handles submit logic, auto-submit, and beforeunload handling
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { MCQResult } from '../../../types';
import { ReadingListeningQuestion } from '../../../types';
import { ListeningTask } from '../../../types';
import { saveState, clearSavedState } from '../utils/listeningExamPersistence';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

interface UseSubmissionProps {
  task: ListeningTask;
  questions: ReadingListeningQuestion[];
  answers: (number | null)[];
  mockExamId: string;
  assignmentId?: string;
  sessionId: string;
  storageKey: string;
  hasStarted: boolean;
  onComplete: (result: MCQResult) => void;
}

export function useSubmission({
  task,
  questions,
  answers,
  mockExamId,
  assignmentId,
  sessionId,
  storageKey,
  hasStarted,
  onComplete,
}: UseSubmissionProps) {
  const { getToken } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = useCallback(async (isAutoSubmit = false) => {
    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Clear saved data
      clearSavedState(storageKey);

      // Prepare answers array (fill nulls with -1 for incomplete answers)
      const submittedAnswers = answers.map(a => a !== null ? a : -1);

      // Submit to backend - use assignment endpoint if assignmentId is provided
      const endpoint = assignmentId 
        ? `${BACKEND_URL}/api/exam/submit-assignment-mcq`
        : `${BACKEND_URL}/api/exam/submit-mcq`;
      
      const requestBody = assignmentId
        ? {
            taskId: task.taskId,
            answers: submittedAnswers,
            module: 'listening',
            assignmentId,
            sessionId,
          }
        : {
            taskId: task.taskId,
            answers: submittedAnswers,
            module: 'listening',
            mockExamId,
            sessionId,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getToken()}`,
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit: ${response.status} ${errorText}`);
      }

      const responseData = await response.json();
      
      // Convert response to MCQResult format
      const result: MCQResult & { resultId?: string } = {
        taskId: task.taskId,
        answers: submittedAnswers,
        score: responseData.score || 0,
        totalQuestions: responseData.totalQuestions || questions.length,
        questionResults: questions.map((q, index) => {
          const userAnswer = submittedAnswers[index] ?? -1;
          const isCorrect = userAnswer === q.correctAnswer;
          return {
            questionId: q.questionId,
            userAnswer,
            isCorrect,
          };
        }),
        ...(responseData.resultId && { resultId: responseData.resultId }), // Include resultId if available
      };
      
      onComplete(result as MCQResult);
    } catch (error) {
      console.error('Failed to submit answers:', error);
      alert('Failed to submit answers. Please try again.');
      setIsSubmitting(false);
    }
  }, [answers, task.taskId, mockExamId, assignmentId, sessionId, getToken, onComplete, storageKey, isSubmitting, questions]);

  // Handle page unload - auto-submit for mock exams
  useEffect(() => {
    const handleBeforeUnload = async () => {
      // Auto-submit if this is a mock exam or assignment and user has started
      if ((mockExamId || assignmentId) && hasStarted && !isSubmitting) {
        try {
          // Prepare answers array (fill nulls with -1 for incomplete answers)
          const submittedAnswers = answers.map(a => a !== null ? a : -1);

          // Submit in background - don't wait for response since page is unloading
          const endpoint = assignmentId 
            ? `${BACKEND_URL}/api/exam/submit-assignment-mcq`
            : `${BACKEND_URL}/api/exam/submit-mcq`;
          
          const requestBody = assignmentId
            ? {
                taskId: task.taskId,
                answers: submittedAnswers,
                module: 'listening',
                assignmentId,
                sessionId,
              }
            : {
                taskId: task.taskId,
                answers: submittedAnswers,
                module: 'listening',
                mockExamId,
                sessionId,
              };

          fetch(endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${await getToken()}`,
            },
            body: JSON.stringify(requestBody),
            // Don't wait for response since page is unloading
            keepalive: true,
          }).catch(error => {
            console.error('Failed to auto-submit on unload:', error);
          });
        } catch (error) {
          console.error('Failed to prepare auto-submit:', error);
        }
      } else {
        // Regular save to localStorage for non-mock exams
        saveState(storageKey, answers, 0, null); // Save current state
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [answers, storageKey, mockExamId, assignmentId, hasStarted, isSubmitting, task.taskId, sessionId, getToken]);

  return {
    isSubmitting,
    handleSubmit,
  };
}
