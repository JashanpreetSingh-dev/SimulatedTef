import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ExamCard } from './ExamCard';
import { useIsD2C } from '../../utils/userType';
import { subscriptionService } from '../../services/subscriptionService';

interface ExpressionOraleTabProps {
  onStartExam: (mode: 'partA' | 'partB' | 'full') => void;
}

interface SpeakingLimits {
  sectionA: { used: number; limit: number };
  sectionB: { used: number; limit: number };
}

export function ExpressionOraleTab({ onStartExam }: ExpressionOraleTabProps) {
  const { getToken } = useAuth();
  const isD2C = useIsD2C();
  const [limits, setLimits] = useState<SpeakingLimits | null>(null);

  useEffect(() => {
    if (!isD2C) return;
    let cancelled = false;
    subscriptionService.getUsage(getToken).then((data: any) => {
      if (cancelled) return;
      const l = data.limits || {};
      const u = data.usage || {};
      const limitA = l.sectionALimit ?? 1;
      const limitB = l.sectionBLimit ?? 1;
      setLimits({
        sectionA: { used: u.sectionAUsed ?? 0, limit: limitA },
        sectionB: { used: u.sectionBUsed ?? 0, limit: limitB },
      });
    }).catch(() => {
      if (!cancelled) setLimits(null);
    });
    return () => { cancelled = true; };
  }, [isD2C, getToken]);

  const atLimitA = isD2C && limits && limits.sectionA.limit !== -1 && limits.sectionA.used >= limits.sectionA.limit;
  const atLimitB = isD2C && limits && limits.sectionB.limit !== -1 && limits.sectionB.used >= limits.sectionB.limit;

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile: Stacked cards */}
      <div className="md:hidden space-y-4">
        <ExamCard
          mode="partA"
          onStart={onStartExam}
          variant="mobile"
          used={limits?.sectionA.used}
          limit={limits?.sectionA.limit}
          atLimit={atLimitA}
        />
        <ExamCard
          mode="partB"
          onStart={onStartExam}
          variant="mobile"
          used={limits?.sectionB.used}
          limit={limits?.sectionB.limit}
          atLimit={atLimitB}
        />
      </div>

      {/* Desktop: 2-column grid */}
      <div className="hidden md:grid md:grid-cols-2 gap-6">
        <ExamCard
          mode="partA"
          onStart={onStartExam}
          variant="desktop"
          used={limits?.sectionA.used}
          limit={limits?.sectionA.limit}
          atLimit={atLimitA}
        />
        <ExamCard
          mode="partB"
          onStart={onStartExam}
          variant="desktop"
          used={limits?.sectionB.used}
          limit={limits?.sectionB.limit}
          atLimit={atLimitB}
        />
      </div>
    </div>
  );
}
