import React from 'react';
import { SubscriptionStatus as SubscriptionStatusType } from '../../hooks/useSubscription';
import { ExamCard } from './ExamCard';

interface ExpressionOraleTabProps {
  status: SubscriptionStatusType | null;
  onStartExam: (mode: 'partA' | 'partB' | 'full') => void;
}

export function ExpressionOraleTab({ status, onStartExam }: ExpressionOraleTabProps) {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile: Stacked cards */}
      <div className="md:hidden space-y-4">
        <ExamCard mode="partA" status={status} onStart={onStartExam} variant="mobile" />
        <ExamCard mode="partB" status={status} onStart={onStartExam} variant="mobile" />
        <ExamCard mode="full" status={status} onStart={onStartExam} variant="mobile" />
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        <ExamCard mode="partA" status={status} onStart={onStartExam} variant="desktop" />
        <ExamCard mode="partB" status={status} onStart={onStartExam} variant="desktop" />
        <ExamCard mode="full" status={status} onStart={onStartExam} variant="desktop" />
      </div>
    </div>
  );
}
