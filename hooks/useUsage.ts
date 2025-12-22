import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export type ExamType = 'full' | 'partA' | 'partB';

export interface CanStartExamResult {
  canStart: boolean;
  reason?: string;
  sessionId?: string;
}

export const useUsage = () => {
  const [loading, setLoading] = useState(false);
  const { getToken, isSignedIn } = useAuth();

  const checkCanStart = async (examType: ExamType): Promise<CanStartExamResult> => {
    if (!isSignedIn) {
      return { canStart: false, reason: 'Please sign in to start an exam' };
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/usage/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ examType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to check usage');
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Error checking usage:', err);
      return { canStart: false, reason: err.message || 'Failed to check usage' };
    } finally {
      setLoading(false);
    }
  };

  const startExam = async (examType: ExamType): Promise<CanStartExamResult> => {
    if (!isSignedIn) {
      return { canStart: false, reason: 'Please sign in to start an exam' };
    }

    setLoading(true);
    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/exam/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ examType }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to start exam');
      }

      const data = await response.json();
      return data;
    } catch (err: any) {
      console.error('Error starting exam:', err);
      return { canStart: false, reason: err.message || 'Failed to start exam' };
    } finally {
      setLoading(false);
    }
  };

  const validateSession = async (sessionId: string): Promise<boolean> => {
    if (!isSignedIn) {
      return false;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/exam/validate-session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      return data.valid === true;
    } catch (err) {
      console.error('Error validating session:', err);
      return false;
    }
  };

  const completeSession = async (sessionId: string, resultId?: string, status: 'completed' | 'failed' = 'completed'): Promise<boolean> => {
    if (!isSignedIn) {
      return false;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/exam/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ sessionId, resultId, status }),
      });

      return response.ok;
    } catch (err) {
      console.error('Error completing session:', err);
      return false;
    }
  };

  return { checkCanStart, startExam, validateSession, completeSession, loading };
};

