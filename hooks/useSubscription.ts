import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

export interface SubscriptionStatus {
  subscriptionType: 'TRIAL' | 'STARTER_PACK' | 'EXAM_READY_PACK' | 'EXPIRED';
  isActive: boolean;
  isSuperUser?: boolean; // Super user bypasses all limits
  trialDaysRemaining?: number;
  // Pack fields
  packType?: 'STARTER_PACK' | 'EXAM_READY_PACK';
  packExpirationDate?: string;
  packCredits?: {
    fullTests: { total: number; used: number; remaining: number };
    sectionA: { total: number; used: number; remaining: number };
    sectionB: { total: number; used: number; remaining: number };
  };
  limits: {
    fullTests: number; // Daily limit from TRIAL
    sectionA: number; // Daily limit from TRIAL
    sectionB: number; // Daily limit from TRIAL
  };
  usage: {
    fullTestsUsed: number; // Daily usage
    sectionAUsed: number; // Daily usage
    sectionBUsed: number; // Daily usage
  };
}

export const useSubscription = () => {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { getToken, isSignedIn } = useAuth();

  const fetchStatus = async () => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`${BACKEND_URL}/api/subscription/status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch subscription status');
      }

      const data = await response.json();
      setStatus(data);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      console.error('Error fetching subscription status:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [isSignedIn]);

  const refreshStatus = useCallback(() => {
    fetchStatus();
  }, [isSignedIn]);

  return { status, loading, error, refreshStatus };
};

