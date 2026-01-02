import React from 'react';
import { ExamCard } from './ExamCard';

interface ExpressionEcritTabProps {
  onStartExam: (mode: 'partA' | 'partB' | 'full') => void;
}

export function ExpressionEcritTab({ onStartExam }: ExpressionEcritTabProps) {
  // Written expression has no limits, so we pass null for status
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Mobile: Stacked cards */}
      <div className="md:hidden space-y-4">
        <ExamCard mode="partA" status={null} onStart={onStartExam} variant="mobile" isWrittenExpression={true} />
        <ExamCard mode="partB" status={null} onStart={onStartExam} variant="mobile" isWrittenExpression={true} />
        <ExamCard mode="full" status={null} onStart={onStartExam} variant="mobile" isWrittenExpression={true} />
      </div>

      {/* Desktop: 3-column grid */}
      <div className="hidden md:grid md:grid-cols-3 gap-6">
        <ExamCard mode="partA" status={null} onStart={onStartExam} variant="desktop" isWrittenExpression={true} />
        <ExamCard mode="partB" status={null} onStart={onStartExam} variant="desktop" isWrittenExpression={true} />
        <ExamCard mode="full" status={null} onStart={onStartExam} variant="desktop" isWrittenExpression={true} />
      </div>
    </div>
  );
}
